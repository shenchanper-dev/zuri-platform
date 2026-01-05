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
  }]
};
