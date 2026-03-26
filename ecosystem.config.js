module.exports = {
  apps: [{
    name: 'zuri-app',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/zuri/zuri-platform',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  },
  {
    name: 'zuri-websocket',
    script: './src/server/websocket.ts',
    cwd: '/home/zuri/zuri-platform',
    interpreter: 'node',
    interpreter_args: '--import tsx',
    exec_mode: 'fork',
    env: {
      WEBSOCKET_PORT: '3005',
      JWT_SECRET: 'zuri-secret-key-change-this',
      REDIS_URL: 'redis://localhost:6379',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      DATABASE_URL: 'postgresql://postgres@localhost:5432/zuri_db',
      NODE_ENV: 'development'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/websocket-err.log',
    out_file: './logs/websocket-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
