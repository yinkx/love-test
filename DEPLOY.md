# 恋爱脑测试 H5 - 部署指南

本文档详细说明如何使用 PM2 一键部署脚本将项目部署到 Linux 服务器。

---

## 前置要求

### 服务器要求

- 操作系统：Ubuntu 20.04+ / Debian 10+ / CentOS 7+
- root 用户权限
- 内存：至少 512MB
- 磁盘：至少 1GB 可用空间

### 网络要求

- 公网 IP 地址
- 域名（可选，用于配置域名访问）
- 安全组开放端口：80 (HTTP), 443 (HTTPS), 8000 (API)

---

## 快速部署（5 分钟）

### 步骤 1：上传项目

```bash
# 本地执行（将项目上传到服务器）
scp -r love-test root@YOUR_SERVER_IP:/tmp/
```

### 步骤 2：登录服务器

```bash
ssh root@YOUR_SERVER_IP
```

### 步骤 3：移动项目并运行部署

```bash
# 移动项目到目标目录
mv /tmp/love-test /data/test/
cd /data/test/love-test

# 授权并运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

部署脚本会自动完成以下操作：

1. ✅ 检查并安装 Node.js 18.x
2. ✅ 检查并安装 Nginx
3. ✅ 检查并安装 PM2
4. ✅ 创建项目目录
5. ✅ 安装项目依赖
6. ✅ 生成验证码（首次部署）
7. ✅ 配置 Nginx（子路径访问）
8. ✅ 配置防火墙
9. ✅ 启动 PM2 服务
10. ✅ 验证部署

---

## 部署脚本配置说明

### 修改部署配置（可选）

编辑 `deploy.sh` 文件，修改以下配置项：

```bash
# 应用名称
APP_NAME="love-test-api"

# 项目部署目录
APP_DIR="/data/test/love-test"

# 项目访问前缀（子路径）
PROJECT_SHORT_NAME="love-test"

# Node.js 版本
NODE_VERSION="18"

# API 端口
PORT=8000

# 域名配置
DOMAIN_NAME="xiaotuzi.fun"      # 主域名
SUB_DOMAIN=""                    # 子域名前缀，留空使用根域名
SERVER_IP="47.95.70.70"         # 服务器公网 IP
```

### 配置说明

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `APP_NAME` | PM2 应用名称 | `love-test-api` |
| `APP_DIR` | 项目部署绝对路径 | `/data/test/love-test` |
| `PROJECT_SHORT_NAME` | 子路径前缀 | `love-test` |
| `PORT` | API 监听端口 | `8000` |
| `DOMAIN_NAME` | 主域名 | `xiaotuzi.fun` |
| `SUB_DOMAIN` | 子域名前缀，留空则使用根域名 | `love` → `love.xiaotuzi.fun` |
| `SERVER_IP` | 服务器公网 IP | `47.95.70.70` |

---

## 访问地址

部署成功后，可通过以下地址访问：

### 域名访问

```
http://xiaotuzi.fun/love-test/
http://www.xiaotuzi.fun/love-test/
```

### IP 访问

```
http://47.95.70.70/love-test/
```

### 测试页面

```
http://47.95.70.70/love-test/test.html?code=验证码
```

---

## 手动配置（可选）

如果不想使用自动部署脚本，可手动执行以下步骤。

### 1. 安装环境

```bash
# Ubuntu/Debian
apt update
apt install -y nginx nodejs npm

# CentOS/RHEL
yum install -y epel-release
yum install -y nginx nodejs npm

# 安装 PM2
npm install -g pm2
```

### 2. 部署代码

```bash
# 创建目录
mkdir -p /data/test/love-test
cd /data/test/love-test

# 复制项目文件
# (将项目文件上传到此目录)

# 安装依赖
npm install --production

# 生成验证码
npm run generate-codes -- --count 100
```

### 3. 启动服务

```bash
# 启动 PM2
pm2 start ecosystem.config.js --env production

# 保存配置
pm2 save

# 配置开机自启
pm2 startup
```

### 4. 配置 Nginx

创建配置文件 `/etc/nginx/conf.d/love-test.conf`：

```nginx
server {
    listen 80;
    server_name xiaotuzi.fun www.xiaotuzi.fun 47.95.70.70;

    set $project_root /data/test/love-test;

    access_log /var/log/nginx/love-test-access.log;
    error_log /var/log/nginx/love-test-error.log;

    # 静态文件
    location /love-test/ {
        alias $project_root/public/;
        index index.html;
        try_files $uri $uri/ /love-test/index.html;
    }

    # API 代理
    location /love-test/api/ {
        proxy_pass http://127.0.0.1:8000/love-test/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type';

        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    # 静态资源缓存
    location /love-test/src/ {
        alias $project_root/public/src/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

禁用 default 站点：

```bash
rm -f /etc/nginx/sites-enabled/default
```

验证并重载：

```bash
nginx -t
systemctl reload nginx
```

---

## 常用管理命令

### PM2 服务管理

```bash
# 查看服务状态
pm2 status

# 查看详细状态
pm2 show love-test-api

# 查看实时日志
pm2 logs love-test-api

# 重启服务
pm2 restart love-test-api

# 停止服务
pm2 stop love-test-api

# 启动服务
pm2 start love-test-api

# 删除服务
pm2 delete love-test-api

# 保存服务列表（开机自启）
pm2 save
```

### Nginx 管理

```bash
# 检查配置
nginx -t

# 重载配置
systemctl reload nginx

# 重启 Nginx
systemctl restart nginx

# 查看状态
systemctl status nginx

# 查看访问日志
tail -f /var/log/nginx/love-test-access.log

# 查看错误日志
tail -f /var/log/nginx/love-test-error.log
```

### 验证码管理

```bash
# 生成新验证码
cd /data/test/love-test
npm run generate-codes -- --count 100

# 查看所有验证码
ls data/codes/

# 查看验证码状态
cat data/codes/ABC123.json
```

---

## 故障排查

### 404 Not Found

**原因**：default 站点冲突

```bash
# 删除 default 站点
rm /etc/nginx/sites-enabled/default

# 重载 Nginx
systemctl reload nginx
```

### 502 Bad Gateway

**原因**：PM2 服务未运行

```bash
# 检查服务状态
pm2 status

# 重启服务
pm2 restart love-test-api
```

### 端口占用

**原因**：8000 端口被占用

```bash
# 查看端口占用
lsof -i:8000
netstat -tlnp | grep 8000

# 杀死占用进程
kill -9 <PID>

# 重启服务
pm2 restart love-test-api
```

### API 无法访问

检查后端服务日志：

```bash
pm2 logs love-test-api --lines 50
```

### 静态资源 404

检查文件路径：

```bash
ls -la /data/test/love-test/public/
ls -la /data/test/love-test/public/src/
```

---

## 多项目部署

如果同一域名下部署多个项目，每个项目使用不同的子路径：

```
xiaotuzi.fun/love-test/      # 恋爱测试
xiaotuzi.fun/personality/    # 性格测试
xiaotuzi.fun/career/         # 职业测试
```

每个项目的 Nginx 配置使用不同的 `PROJECT_SHORT_NAME`，部署脚本会自动处理。

---

## HTTPS 配置（可选）

使用 Certbot 配置免费 HTTPS：

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d xiaotuzi.fun -d www.xiaotuzi.fun

# 自动续期
certbot renew --dry-run
```

---

## 性能优化

### 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### 静态资源缓存

已在配置中启用 30 天缓存：

```nginx
location /love-test/src/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 备份与恢复

### 备份项目

```bash
# 备份整个项目
tar -czf love-test-backup-$(date +%Y%m%d).tar.gz /data/test/love-test

# 仅备份验证码数据
tar -czf codes-backup-$(date +%Y%m%d).tar.gz /data/test/love-test/data/codes
```

### 恢复项目

```bash
tar -xzf love-test-backup-20260316.tar.gz -C /data/test/
```

---

## 安全建议

1. **防火墙配置**：仅开放必要端口（80/443/8000）
2. **定期更新**：保持系统和依赖最新
3. **日志监控**：定期检查访问日志和错误日志
4. **备份数据**：定期备份验证码数据
5. **限制速率**：可在 Nginx 配置中添加请求限流

---

## 技术支持

如遇问题，请检查以下内容：

1. PM2 服务状态：`pm2 status`
2. Nginx 配置：`nginx -t`
3. 访问日志：`tail /var/log/nginx/love-test-access.log`
4. 错误日志：`tail /var/log/nginx/love-test-error.log`
5. PM2 日志：`pm2 logs love-test-api`
