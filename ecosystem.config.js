/**
 * PM2 部署配置文件
 *
 * 使用方法:
 * 1. pm2 start ecosystem.config.js --env production
 * 2. pm2 save
 */

module.exports = {
  apps: [{
    name: 'love-test-api',
    script: 'server.js',
    cwd: '/data/test/love-test',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 8000,
      PROJECT_SHORT_NAME: 'love'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
};
