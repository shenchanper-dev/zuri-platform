/**
 * ZURI NEMT Platform - WebSocket Hook for Dashboard
 * 
 * Real-time updates from driver app via Socket.IO
 * Integrates with existing useGPSTracking hook
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DriverLocationUpdate {
    conductorId: number;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
    batteryLevel?: number;
    timestamp: string;
}

export interface DriverStatusUpdate {
    conductorId: number;
    status: string;
    timestamp: string;
}

export interface UseWebSocketDashboardConfig {
    url?: string;
    autoConnect?: boolean;
    reconnectAttempts?: number;
}

export interface UseWebSocketDashboardReturn {
    // State
    isConnected: boolean;
    error: string | null;
    activeDrivers: number;

    // Data (latest updates)
    lastLocationUpdate: DriverLocationUpdate | null;
    lastStatusUpdate: DriverStatusUpdate | null;

    // Actions
    connect: () => void;
    disconnect: () => void;

    // Event handlers (for integration)
    onLocationUpdate: (callback: (data: DriverLocationUpdate) => void) => () => void;
    onDriverConnected: (callback: (conductorId: number) => void) => () => void;
    onDriverDisconnected: (callback: (conductorId: number) => void) => () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useWebSocketDashboard(
    config: UseWebSocketDashboardConfig = {}
): UseWebSocketDashboardReturn {
    const {
        url = (() => {
            const envUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
            if (envUrl) return envUrl;

            if (typeof window === 'undefined') return 'http://localhost:3005';

            const host = window.location.hostname;
            const isProdZuri = host === 'admin.zuri.pe' || host.endsWith('.zuri.pe');
            if (isProdZuri) return 'wss://admin.zuri.pe/ws';

            const port = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || process.env.WEBSOCKET_PORT || '3005';
            const scheme = window.location.protocol === 'https:' ? 'https' : 'http';
            return `${scheme}://${host}:${port}`;
        })(),
        autoConnect = true,
        reconnectAttempts = 5,
    } = config;

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeDrivers, setActiveDrivers] = useState(0);
    const [lastLocationUpdate, setLastLocationUpdate] = useState<DriverLocationUpdate | null>(null);
    const [lastStatusUpdate, setLastStatusUpdate] = useState<DriverStatusUpdate | null>(null);

    // Refs
    const socketRef = useRef<Socket | null>(null);
    const callbacksRef = useRef<{
        onLocation: ((data: DriverLocationUpdate) => void)[];
        onConnected: ((id: number) => void)[];
        onDisconnected: ((id: number) => void)[];
    }>({
        onLocation: [],
        onConnected: [],
        onDisconnected: [],
    });

    // ============================================
    // CONNECT
    // ============================================
    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        console.log('🔌 [Dashboard WS] Connecting to:', url);

        socketRef.current = io(url, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: reconnectAttempts,
            reconnectionDelay: 1000,
            timeout: 10000,
            // Dashboard doesn't need auth - it's admin only
            query: { role: 'dashboard' },
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
            console.log('✅ [Dashboard WS] Connected');
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ [Dashboard WS] Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ [Dashboard WS] Connection error:', err.message);
            setError(err.message);
        });

        // ========================================
        // DRIVER EVENTS
        // ========================================

        // Driver connected
        socket.on('driver:connected', (data: { conductorId: number }) => {
            console.log('🚗 [Dashboard WS] Driver connected:', data.conductorId);
            setActiveDrivers((prev) => prev + 1);
            callbacksRef.current.onConnected.forEach((cb) => cb(data.conductorId));
        });

        // Driver disconnected
        socket.on('driver:disconnected', (data: { conductorId: number }) => {
            console.log('🚗 [Dashboard WS] Driver disconnected:', data.conductorId);
            setActiveDrivers((prev) => Math.max(0, prev - 1));
            callbacksRef.current.onDisconnected.forEach((cb) => cb(data.conductorId));
        });

        // Location broadcast from drivers
        socket.on('drivers:location:broadcast', (data: DriverLocationUpdate) => {
            setLastLocationUpdate(data);
            callbacksRef.current.onLocation.forEach((cb) => cb(data));
        });

        // Status broadcast
        socket.on('drivers:status:broadcast', (data: DriverStatusUpdate) => {
            setLastStatusUpdate(data);
        });

    }, [url, reconnectAttempts]);

    // ============================================
    // DISCONNECT
    // ============================================
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsConnected(false);
    }, []);

    // ============================================
    // CALLBACK REGISTRATION
    // ============================================
    const onLocationUpdate = useCallback((callback: (data: DriverLocationUpdate) => void) => {
        callbacksRef.current.onLocation.push(callback);
        return () => {
            callbacksRef.current.onLocation = callbacksRef.current.onLocation.filter((cb) => cb !== callback);
        };
    }, []);

    const onDriverConnected = useCallback((callback: (id: number) => void) => {
        callbacksRef.current.onConnected.push(callback);
        return () => {
            callbacksRef.current.onConnected = callbacksRef.current.onConnected.filter((cb) => cb !== callback);
        };
    }, []);

    const onDriverDisconnected = useCallback((callback: (id: number) => void) => {
        callbacksRef.current.onDisconnected.push(callback);
        return () => {
            callbacksRef.current.onDisconnected = callbacksRef.current.onDisconnected.filter((cb) => cb !== callback);
        };
    }, []);

    // ============================================
    // LIFECYCLE
    // ============================================
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    // ============================================
    // RETURN
    // ============================================
    return {
        isConnected,
        error,
        activeDrivers,
        lastLocationUpdate,
        lastStatusUpdate,
        connect,
        disconnect,
        onLocationUpdate,
        onDriverConnected,
        onDriverDisconnected,
    };
}

export default useWebSocketDashboard;
