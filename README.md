# 恋爱脑测试 H5

> 温和治愈型情感测试 - 探索你在爱里的样子

---

## 部署配置

| 配置项 | 值 |
|--------|-----|
| **项目根目录** | `/data/test` |
| **项目名称** | `love-test` |
| **访问地址格式** | `域名/love-test/?code=验证码` |
| **示例访问地址** | `https://example.com/love-test/?code=ABC123` |

---

## 项目结构

```
02_恋爱脑测试/
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
├── package.json
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

验证码文件保存在 `data/codes/` 目录，每个验证码有效期 24 小时。

---

## 部署到 Vercel

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录并部署

```bash
vercel login
vercel --prod
```

### 3. 配置域名

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
- **后端**：Node.js Serverless (Vercel)
- **存储**：JSON 文件（验证码数据）
- **部署**：Vercel

---

## 注意事项

1. **验证码有效期**：24 小时，过期自动失效
2. **一次性使用**：验证通过后标记为已使用
3. **CORS 配置**：API 已配置允许跨域访问
4. **移动端适配**：已优化 375px-428px 屏幕尺寸

---

## 开发日志

- 2026-03-14: 项目初始化，完成核心功能开发
