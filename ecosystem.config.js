/**
 * PM2 部署配置文件
 *
 * 使用方法：
 * 1. 本地修改代码后提交并 push 到 GitHub
 * 2. 在服务器上执行：pm2 deploy ecosystem.config.js production update
 * 3. 或者首次部署：pm2 deploy ecosystem.config.js production setup
 */

module.exports = {
  apps: [{
    name: 'love-test-api',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }],

  deploy: {
    production: {
      user: 'root',
      host: '你的服务器 IP',  // 修改为你的服务器 IP
      ref: 'origin/main',
      repo: 'https://github.com/yinkx/love-test.git',
      path: '/data/test/love-test',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'npm install -g pm2',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
