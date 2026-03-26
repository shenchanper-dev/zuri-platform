'use client';

import { useEffect } from 'react';

/**
 * ZURI Lead Developer Solution: ChunkErrorHandler
 * 
 * Automatically detects hash mismatches (ChunkLoadError) and triggers 
 * a hard reload to sync the browser with the latest server build.
 * This prevents white screens and broken navigation after a re-build.
 */
export default function ChunkErrorHandler() {
    useEffect(() => {
        const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
            const error = 'reason' in event ? event.reason : event.error;

            // Handle ChunkLoadError
            if (error && (
                error.name === 'ChunkLoadError' ||
                /Loading chunk .* failed/.test(error.message) ||
                /Failed to load resource: the server responded with a status of 400/.test(error.message)
            )) {
                console.warn('🚀 [Zuri Safety] ChunkLoadError detected. Re-syncing with server...');
                window.location.reload();
            }
        };

        // Listen for standard errors and unhandled promise rejections
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleError);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleError);
        };
    }, []);

    return null;
}
