import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { verify } from 'jsonwebtoken';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: path.join(process.cwd(), '.env.local') });
dotenvConfig({ path: path.join(process.cwd(), '.env.websocket') });
dotenvConfig({ path: path.join(process.cwd(), '.env') });

const HTTP_PORT = parseInt(process.env.WEBSOCKET_PORT || '3005', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'zuri-secret-key-change-this';

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:8081',
      'https://admin.zuri.pe',
      /\.zuri\.pe$/,
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Redis setup for PM2 clustering
const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis Pub/Sub connected for Socket.IO clustering');
  })
  .catch((err) => {
    console.error('❌ Redis connection failed:', err);
    console.log('⚠️  Running without clustering support');
  });

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const role = socket.handshake.query.role;

  // Dashboard connection - read only, no auth required
  if (role === 'dashboard') {
    socket.data.role = 'dashboard';
    console.log('🖥️ Dashboard client connected (read-only)');
    return next();
  }

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { conductorId: number; role: string };

    if (decoded.role !== 'driver') {
      return next(new Error('Invalid role'));
    }

    socket.data.conductorId = decoded.conductorId;
    socket.data.role = 'driver';
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// Track active connections
const activeDrivers = new Map<number, string>(); // conductorId -> socketId

// Socket.IO event handlers
io.on('connection', (socket) => {
  const conductorId = socket.data.conductorId;

  console.log(`🚗 Driver connected: ${conductorId} (socket: ${socket.id})`);

  // Store active connection
  activeDrivers.set(conductorId, socket.id);

  // Broadcast to admin dashboard
  io.emit('driver:connected', { conductorId, timestamp: new Date().toISOString() });

  // ========================================
  // EVENT: Location Update
  // ========================================
  socket.on('driver:location:update', async (data) => {
    try {
      const { latitude, longitude, heading, speed, accuracy, batteryLevel, conductorId: payloadConductorId } = data;
      
      // Use conductorId from payload if available, otherwise from socket auth
      const driverId = payloadConductorId || conductorId;

      // Validation
      if (!latitude || !longitude || !driverId) {
        socket.emit('error', { message: 'Invalid location data - missing coordinates or conductorId' });
        return;
      }

      // Rate limiting: max 5 updates per second
      const now = Date.now();
      const lastUpdate = (socket.data.lastLocationUpdate as number) || 0;
      if (now - lastUpdate < 200) { // 200ms = 5 updates/sec max
        return; // Silently ignore
      }
      socket.data.lastLocationUpdate = now;

      // Update database directly
      try {
        const { Client } = await import('pg');
        const dbClient = new Client({
          connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zuri_db'
        });
        await dbClient.connect();

        const updateQuery = `
          UPDATE conductores
          SET 
            "ubicacionActualLatitud" = $1,
            "ubicacionActualLongitud" = $2,
            "ultimaActualizacionGPS" = NOW(),
            "precisionGPS" = $3,
            "velocidadActual" = $4,
            "rumboActual" = $5,
            "nivelBateria" = $6,
            "estaConectado" = true,
            "ultimaConexion" = NOW(),
            "updatedAt" = NOW()
          WHERE id = $7
        `;

        await dbClient.query(updateQuery, [
          parseFloat(latitude),
          parseFloat(longitude),
          accuracy ? parseFloat(accuracy) : null,
          speed ? parseFloat(speed) : null,
          heading ? parseFloat(heading) : null,
          batteryLevel ? parseInt(batteryLevel, 10) : null,
          driverId
        ]);

        await dbClient.end();
        console.log(`📍 [WS] GPS updated in DB: Conductor ${driverId} - Lat: ${latitude}, Lng: ${longitude}`);
      } catch (dbError: any) {
        console.error('❌ [WS] Database update error:', dbError.message);
        // Continue anyway - don't block WebSocket updates
      }

      // Publish to Redis for all workers
      await pubClient.publish('driver:locations', JSON.stringify({
        conductorId: driverId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        heading: heading ? parseFloat(heading) : null,
        speed: speed ? parseFloat(speed) : null,
        accuracy: accuracy ? parseFloat(accuracy) : null,
        batteryLevel: batteryLevel ? parseInt(batteryLevel, 10) : null,
        timestamp: new Date().toISOString(),
      }));

      // Acknowledge receipt
      socket.emit('driver:location:ack', { timestamp: new Date().toISOString() });

    } catch (error) {
      console.error('Location update error:', error);
      socket.emit('error', { message: 'Failed to process location' });
    }
  });

  // ========================================
  // EVENT: Status Change
  // ========================================
  socket.on('driver:status:update', async (data) => {
    try {
      const { status } = data; // 'online', 'offline', 'busy'

      if (!['online', 'offline', 'busy'].includes(status)) {
        socket.emit('error', { message: 'Invalid status' });
        return;
      }

      await pubClient.publish('driver:status', JSON.stringify({
        conductorId,
        status,
        timestamp: new Date().toISOString(),
      }));

      socket.emit('driver:status:ack', { status, timestamp: new Date().toISOString() });

    } catch (error) {
      console.error('Status update error:', error);
    }
  });

  // ========================================
  // EVENT: Disconnect
  // ========================================
  socket.on('disconnect', (reason) => {
    console.log(`🚗 Driver disconnected: ${conductorId} (reason: ${reason})`);

    activeDrivers.delete(conductorId);

    // Notify admin dashboard
    io.emit('driver:disconnected', { conductorId, timestamp: new Date().toISOString() });

    // Publish to Redis
    pubClient.publish('driver:disconnected', JSON.stringify({
      conductorId,
      reason,
      timestamp: new Date().toISOString(),
    })).catch(err => console.error('Redis publish error:', err));
  });
});

// Subscribe to Redis channels for broadcasting
subClient.subscribe('driver:locations', (message) => {
  try {
    const data = JSON.parse(message);
    // Broadcast to admin dashboard clients only
    io.emit('drivers:location:broadcast', data);
  } catch (err) {
    console.error('Redis message parse error:', err);
  }
});

subClient.subscribe('driver:status', (message) => {
  try {
    const data = JSON.parse(message);
    io.emit('drivers:status:broadcast', data);
  } catch (err) {
    console.error('Redis message parse error:', err);
  }
});

// ========================================
// SERVICE ASSIGNMENT NOTIFICATIONS
// ========================================
subClient.subscribe('service:assigned', (message) => {
  try {
    const data = JSON.parse(message);
    const { conductorId, servicio } = data;

    // Find driver's socket
    const socketId = activeDrivers.get(conductorId);

    if (socketId) {
      // Send directly to the driver
      io.to(socketId).emit('service:assigned', servicio);
      console.log(`📋 Service ${servicio.codigo} sent to driver ${conductorId}`);
    } else {
      console.log(`⚠️ Driver ${conductorId} not connected, service notification queued`);
      // TODO: Store for later delivery or send push notification
    }
  } catch (err) {
    console.error('Service assignment error:', err);
  }
});

subClient.subscribe('service:updated', (message) => {
  try {
    const data = JSON.parse(message);
    const { conductorId, servicioId, estado } = data;

    const socketId = activeDrivers.get(conductorId);
    if (socketId) {
      io.to(socketId).emit('service:updated', { servicioId, estado });
    }

    // Also broadcast to dashboard
    io.emit('service:status:changed', data);
  } catch (err) {
    console.error('Service update error:', err);
  }
});

// ========================================
// UTILITY: Notify specific driver
// ========================================
export async function notifyDriver(conductorId: number, event: string, data: any): Promise<boolean> {
  const socketId = activeDrivers.get(conductorId);

  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }

  // Try via Redis if driver is connected to another instance
  await pubClient.publish('driver:notification', JSON.stringify({
    conductorId,
    event,
    data,
    timestamp: new Date().toISOString(),
  }));

  return false; // Can't confirm delivery
}

// Listen for cross-instance notifications
subClient.subscribe('driver:notification', (message) => {
  try {
    const { conductorId, event, data } = JSON.parse(message);
    const socketId = activeDrivers.get(conductorId);

    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  } catch (err) {
    console.error('Driver notification error:', err);
  }
});

// Health check endpoint
httpServer.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      activeDrivers: activeDrivers.size,
      timestamp: new Date().toISOString(),
    }));
  }
});

// Start server
httpServer.listen(HTTP_PORT, () => {
  console.log(`🚀 WebSocket server running on port ${HTTP_PORT}`);
  console.log(`📍 Health check: http://localhost:${HTTP_PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  io.close();
  await pubClient.quit();
  await subClient.quit();
  httpServer.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

export { io, activeDrivers };
