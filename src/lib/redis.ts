import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }
  
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('❌ Redis reconnection failed after 10 attempts');
          return new Error('Max reconnection attempts reached');
        }
        // Exponential backoff
        return Math.min(retries * 100, 3000);
      },
    },
  });
  
  redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
  });
  
  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });
  
  redisClient.on('ready', () => {
    console.log('✅ Redis ready to use');
  });
  
  await redisClient.connect();
  
  return redisClient;
}

export async function setWithExpiry(key: string, value: string, expirySeconds: number = 120) {
  const client = await getRedisClient();
  return client.setEx(key, expirySeconds, value);
}

export async function get(key: string) {
  const client = await getRedisClient();
  return client.get(key);
}

export async function del(key: string) {
  const client = await getRedisClient();
  return client.del(key);
}

export async function publish(channel: string, message: string) {
  const client = await getRedisClient();
  return client.publish(channel, message);
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export default {
  get,
  setWithExpiry,
  del,
  publish,
  getRedisClient,
  closeRedis,
};
