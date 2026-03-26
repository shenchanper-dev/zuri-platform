'use client';

import { useEffect } from 'react';

function isChunkError(error: any) {
  const name = typeof error?.name === 'string' ? error.name : '';
  const message = typeof error?.message === 'string' ? error.message : '';
  return (
    name === 'ChunkLoadError' ||
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk') ||
    message.includes('CSS_CHUNK_LOAD_FAILED')
  );
}

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!isChunkError(error)) return;
    try {
      const key = 'zuri_chunk_reload_once';
      const already = sessionStorage.getItem(key);
      if (!already) {
        sessionStorage.setItem(key, '1');
        const url = new URL(window.location.href);
        url.searchParams.set('__reload', String(Date.now()));
        window.location.replace(url.toString());
      }
    } catch {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ocurrió un error</h1>
              <p className="text-sm text-gray-600 mt-1">
                Si fue un error de carga de recursos, suele resolverse recargando.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('__reload', String(Date.now()));
                  window.location.replace(url.toString());
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Recargar
              </button>
              <button
                onClick={() => reset()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>

            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer select-none">Ver detalle técnico</summary>
              <pre className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-auto">
                {String(error?.name || 'Error')}: {String(error?.message || '')}
              </pre>
            </details>
          </div>
        </div>
      </body>
    </html>
  );
}

