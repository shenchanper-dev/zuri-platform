// next.config.js - Configuración mejorada para evitar errores React minificados
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Mejorar manejo de errores en desarrollo
  typescript: {
    ignoreBuildErrors: false, // Detectar errores TypeScript
  },

  eslint: {
    ignoreDuringBuilds: false, // Mejorar calidad de código
    dirs: ['src'],
  },

  // Optimización para Leaflet y mapas
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fix para Leaflet en Next.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // Optimizar chunks para evitar errores de carga
    // Removido splitChunks manual que causaba errores 500 en el runtime de webpack

    return config;
  },

  // Variables de entorno para desarrollo
  env: {
    ZURI_ENV: process.env.NODE_ENV,
    ZURI_VERSION: '2.0.0',
    ZURI_ARCHITECTURE: 'Clean Architecture',
  },

  // Headers para desarrollo y CORS
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path((?!_next/static).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
      {
        source: '/dashboard/(.*)',
        headers: [
          {
            key: 'X-ZURI-Version',
            value: '2.0.0-Clean-Architecture',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
