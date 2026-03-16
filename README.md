# 恋爱脑测试 H5

> 温和治愈型情感测试 - 探索你在爱里的样子

---

## 部署配置

| 配置项 | 值 |
|--------|-----|
| **项目根目录** | `/data/test/love-test` |
| **项目名称** | `love-test` |
| **访问地址格式** | `域名/love-test/?code=验证码` |
| **示例访问地址** | `https://xiaotuzi.fun/love-test/?code=ABC123` |
| **API 端口** | `8000` |

---

## 项目结构

```
love-test/
├── public/                 # 静态页面
│   ├── index.html         # 落地页
│   ├── test.html          # 测试页
│   └── result.html        # 结果页
├── src/
│   ├── styles/
│   │   └── main.css       # 全局样式（莫兰迪粉 + 暖黄）
│   └── scripts/
│       ├── questions.js   # 20 道测试题目
│       ├── test.js        # 测试逻辑
│       └── result.js      # 结果计算
├── api/
│   └── verify/
│       └── index.js       # 验证码校验 API
├── data/
│   └── codes/             # 验证码文件存储
├── scripts/
│   └── generate-codes.js  # 验证码生成脚本
├── server.js              # Node.js 后端服务
├── ecosystem.config.js    # PM2 配置文件
├── package.json
├── deploy.sh              # 一键部署脚本
└── vercel.json            # Vercel 部署配置
```

---

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动本地服务器
npm run dev

# 访问 http://localhost:3000
```

### 生成验证码

```bash
# 生成 100 个验证码
npm run generate-codes

# 生成指定数量
npm run generate-codes -- --count 50
```

验证码文件保存在 `data/codes/` 目录，验证码只要未被使用就永久有效。

---

## 部署方案

### 方案一：PM2 一键部署（推荐）

适用于 Ubuntu/Debian/CentOS 服务器，支持标准 Nginx 环境。

#### 前置要求

- 服务器具有 root 权限
- 已安装 Node.js 18+（脚本可自动安装）
- 已安装 Nginx（脚本可自动安装）
- 已安装 PM2（脚本可自动安装）

#### 一键部署

```bash
# 1. 上传项目到服务器
scp -r love-test root@your-server:/tmp/

# 2. 登录服务器
ssh root@your-server

# 3. 移动到目标目录并授权
mv /tmp/love-test /data/test/
cd /data/test/love-test

# 4. 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

#### 部署后配置

脚本执行完成后，会显示访问地址和管理命令：

```
========================================
  部署完成！
========================================

访问地址:
  - 域名：http://xiaotuzi.fun/love-test/
  - 公网 IP: http://47.95.70.70/love-test/
  - 测试：http://xiaotuzi.fun/love-test/test.html?code=验证码

管理命令:
  - 查看状态：pm2 status
  - 查看日志：pm2 logs love-test-api
  - 重启服务：pm2 restart love-test-api
  - 停止服务：pm2 stop love-test-api

项目目录:
  - /data/test/love-test

验证码目录:
  - /data/test/love-test/data/codes/
```

#### Nginx 配置说明

部署脚本会自动完成以下配置：

1. **创建项目配置文件**：`/data/test/nginx/love-test.conf`
2. **Include 到主配置**：自动添加到 `/etc/nginx/nginx.conf`
3. **禁用 default 站点**：避免 80 端口冲突

手动配置 Nginx（可选）：

```nginx
server {
    listen 80;
    server_name xiaotuzi.fun www.xiaotuzi.fun 47.95.70.70;

    set $project_root /data/test/love-test;

    access_log /var/log/nginx/love-test-access.log;
    error_log /var/log/nginx/love-test-error.log;

    location /love-test/ {
        alias $project_root/public/;
        index index.html;
        try_files $uri $uri/ /love-test/index.html;
    }

    location /love-test/api/ {
        proxy_pass http://127.0.0.1:8000/love-test/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type';

        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    location /love-test/src/ {
        alias $project_root/public/src/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 常用管理命令

```bash
# 查看服务状态
pm2 status love-test-api

# 查看实时日志
pm2 logs love-test-api

# 重启服务
pm2 restart love-test-api

# 停止服务
pm2 stop love-test-api

# 删除服务
pm2 delete love-test-api

# 查看服务详情
pm2 show love-test-api

# 保存当前服务列表（开机自启）
pm2 save
```

#### 验证部署

```bash
# 测试首页
curl http://127.0.0.1/love-test/index.html

# 测试 API
curl http://127.0.0.1/love-test/api/verify?code=TEST01

# 测试静态资源
curl http://127.0.0.1/love-test/src/styles/main.css

# 查看访问日志
tail -f /var/log/nginx/love-test-access.log
```

---

### 方案二：Vercel 部署

适用于无服务器快速部署。

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录并部署

```bash
vercel login
vercel --prod
```

#### 3. 配置域名

在 Vercel 控制台绑定自定义域名。

---

## 使用流程

1. **用户在小红书付费购买** → 你发送带验证码的链接
2. **用户打开链接** → `https://your-domain.com/love-test/?code=ABC123`
3. **验证码校验** → 自动验证有效性
4. **完成 20 道测试** → 3-5 分钟
5. **查看完整报告** → 包含分数、等级、维度分析、建议
6. **验证码失效** → 一次性使用，防止共享

---

## API 说明

### GET /love-test/api/verify?code=XXX

校验验证码是否有效

**响应示例：**
```json
{ "valid": true, "message": "验证通过" }
{ "valid": false, "message": "验证码已被使用" }
```

### POST /love-test/api/verify

标记验证码为已使用

**请求体：**
```json
{ "code": "ABC123" }
```

**响应示例：**
```json
{ "success": true, "message": "已标记为已使用" }
```

---

## 题目维度

| 维度 | 题号 | 说明 |
|------|------|------|
| 情绪 | 1-5 | 恋爱中的情绪波动程度 |
| 行为 | 6-10 | 为恋爱付出的行为程度 |
| 理性 | 11-15 | 恋爱中的理性思考能力 |
| 边界 | 16-20 | 恋爱中保持自我的程度 |

---

## 结果等级

| 分数 | 等级 | 颜色 |
|------|------|------|
| 0-20 | 理性大师 | 🧘 #7CB9A8 |
| 21-40 | 清醒恋爱者 | 🌿 #A8D5BA |
| 41-60 | 轻度恋爱脑 | 🌸 #FFE5A0 |
| 61-80 | 中度恋爱脑 | 💕 #FFB5A8 |
| 81-100 | 重度恋爱脑患者 | 💗 #FF8A8A |

---

## 验证码管理

### 查看已生成的验证码

```bash
ls data/codes/
```

### 查看某个验证码状态

```bash
cat data/codes/ABC123.json
```

输出示例：
```json
{
  "code": "ABC123",
  "status": 0,
  "createdAt": "2026-03-14T10:00:00Z",
  "usedAt": null,
  "ip": null
}
```

- `status: 0` = 未使用
- `status: 1` = 已使用

---

## 技术栈

- **前端**：HTML + CSS + JavaScript (ES Modules)
- **后端**：Node.js + Express
- **进程管理**：PM2
- **反向代理**：Nginx
- **存储**：JSON 文件（验证码数据）

---

## 注意事项

1. **验证码规则**：只要未被使用就永久有效，不会过期
2. **一次性使用**：测试完成后标记为已使用，防止共享
3. **CORS 配置**：API 已配置允许跨域访问
4. **移动端适配**：已优化 375px-428px 屏幕尺寸
5. **安全组配置**：确保服务器开放端口 80/443/8000

---

## 故障排查

### 404 Not Found

检查 Nginx 配置，确保删除了 default 站点：
```bash
rm /etc/nginx/sites-enabled/default
systemctl reload nginx
```

### 服务无法访问

检查 PM2 服务状态：
```bash
pm2 status
pm2 logs love-test-api
```

### 端口占用

检查 8000 端口占用：
```bash
lsof -i:8000
netstat -tlnp | grep 8000
```

---

## 开发日志

- 2026-03-16: 添加 PM2 一键部署脚本，支持标准 Nginx 环境
- 2026-03-14: 项目初始化，完成核心功能开发
