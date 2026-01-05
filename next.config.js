// next.config.js - Configuración mejorada para evitar errores React minificados
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Mejorar manejo de errores en desarrollo
  typescript: {
    ignoreBuildErrors: false, // Cambiar a false para detectar errores TypeScript
  },
  
  eslint: {
    ignoreDuringBuilds: false, // Cambiar a false para mejorar calidad de código
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
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Separar Leaflet en su propio chunk
          leaflet: {
            name: 'leaflet',
            test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };
    
    return config;
  },
  
  // Variables de entorno para desarrollo
  env: {
    ZURI_ENV: process.env.NODE_ENV,
    ZURI_VERSION: '2.0.0',
    ZURI_ARCHITECTURE: 'Clean Architecture',
  },
  
  // Headers para desarrollo
  async headers() {
    return [
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