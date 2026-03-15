/**
 * 本地开发服务器 - 模拟生产环境
 * 支持静态文件和 API 路由
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// ==================== 限流配置 ====================
const RATE_LIMIT = {
  windowMs: 60 * 1000,      // 1 分钟窗口
  maxRequests: 30,          // 最多 30 次请求
  maxVerify: 10             // 验证接口最多 10 次
};

// 请求记录
const requestStore = new Map();

// 清理过期记录（每 5 分钟）
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestStore.entries()) {
    if (now - data.startTime > RATE_LIMIT.windowMs) {
      requestStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// 检查限流
function checkRateLimit(ip, isVerify = false) {
  const now = Date.now();
  let data = requestStore.get(ip);

  if (!data || now - data.startTime > RATE_LIMIT.windowMs) {
    data = { startTime: now, total: 0, verify: 0 };
    requestStore.set(ip, data);
  }

  data.total++;
  if (isVerify) data.verify++;

  const maxRequests = isVerify ? RATE_LIMIT.maxVerify : RATE_LIMIT.maxRequests;

  if (data.verify > RATE_LIMIT.maxVerify) {
    return { allowed: false, message: '验证请求过于频繁，请稍后再试' };
  }

  if (data.total > RATE_LIMIT.maxRequests) {
    return { allowed: false, message: '请求过于频繁，请稍后再试' };
  }

  return { allowed: true };
}

// 获取客户端 IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         '127.0.0.1';
}

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 路由配置（与 vercel.json 保持一致）
const routes = [
  { src: /^\/(love-test\/)?api\//, dest: '/api$&' },
  { src: /^\/test\/(.*)/, dest: '/test.html' },
  { src: /^\/result\/(.*)/, dest: '/result.html' }
];

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// 发送 JSON 响应
function sendJSON(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

// 发送文件
function sendFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(content);
  });
}

// 处理验证码 API
async function handleVerify(req, res, query) {
  const clientIP = getClientIP(req);

  // 限流检查
  const limitResult = checkRateLimit(clientIP, true);
  if (!limitResult.allowed) {
    sendJSON(res, 429, { valid: false, message: limitResult.message });
    return;
  }

  const codePath = path.join(__dirname, 'data/codes', `${query.code}.json`);

  // 处理 OPTIONS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET - 验证验证码
  if (req.method === 'GET') {
    if (!query.code) {
      sendJSON(res, 400, { valid: false, message: '缺少验证码' });
      return;
    }

    try {
      if (!fs.existsSync(codePath)) {
        sendJSON(res, 200, { valid: false, message: '验证码无效' });
        return;
      }

      const codeData = JSON.parse(fs.readFileSync(codePath, 'utf8'));

      if (codeData.status === 1) {
        sendJSON(res, 200, { valid: false, message: '验证码已被使用' });
        return;
      }

      // 检查是否过期（24 小时）
      const createdAt = new Date(codeData.createdAt).getTime();
      const now = Date.now();
      const hoursPassed = (now - createdAt) / (1000 * 60 * 60);

      if (hoursPassed > 24) {
        sendJSON(res, 200, { valid: false, message: '验证码已过期' });
        return;
      }

      sendJSON(res, 200, { valid: true, message: '验证通过' });
    } catch (error) {
      console.error('[验证错误]', error.message);
      sendJSON(res, 500, { valid: false, message: '服务器错误' });
    }
    return;
  }

  // POST - 标记已使用
  if (req.method === 'POST') {
    const body = await parseBody(req);
    const code = body.code;

    if (!code) {
      sendJSON(res, 400, { success: false, message: '缺少验证码' });
      return;
    }

    try {
      if (!fs.existsSync(codePath)) {
        sendJSON(res, 400, { success: false, message: '验证码不存在' });
        return;
      }

      const codeData = JSON.parse(fs.readFileSync(codePath, 'utf8'));

      if (codeData.status === 1) {
        sendJSON(res, 400, { success: false, message: '验证码已被使用' });
        return;
      }

      codeData.status = 1;
      codeData.usedAt = new Date().toISOString();
      codeData.ip = req.headers['x-forwarded-for'] || '127.0.0.1';

      fs.writeFileSync(codePath, JSON.stringify(codeData, null, 2));

      sendJSON(res, 200, { success: true, message: '已标记为已使用' });
    } catch (error) {
      console.error('[标记错误]', error.message);
      sendJSON(res, 500, { success: false, message: '服务器错误' });
    }
    return;
  }

  sendJSON(res, 405, { error: '不支持的方法' });
}

// 发送文件
function sendFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(content);
  });
}

// 创建服务器
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  console.log(`[ ${new Date().toLocaleTimeString()} ] ${req.method} ${pathname}`);

  // 处理 API 路由（支持 /api/ 和 /love-test/api/）
  if (pathname.startsWith('/api/') || pathname.startsWith('/love-test/api/')) {
    if (pathname === '/api/verify' || pathname === '/api/verify/' ||
        pathname === '/love-test/api/verify' || pathname === '/love-test/api/verify/') {
      await handleVerify(req, res, query);
      return;
    }
    sendJSON(res, 404, { error: 'API not found' });
    return;
  }

  // 应用路由规则
  for (const route of routes) {
    const match = pathname.match(route.src);
    if (match) {
      if (route.dest.includes('/api/')) {
        // API 路由，跳过
        continue;
      }
      pathname = route.dest;
      break;
    }
  }

  // 静态文件服务
  let filePath = path.join(__dirname, 'public', pathname);

  // 如果路径是目录，尝试查找 index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    // 尝试不带扩展名
    filePath = path.join(__dirname, 'public', pathname + '.html');
  }

  if (fs.existsSync(filePath)) {
    sendFile(res, filePath);
  } else {
    res.writeHead(404);
    res.end('Page not found');
  }
});

// 错误处理
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用`);
  } else {
    console.error('服务器错误:', err);
  }
  process.exit(1);
});

// 优雅关闭
function gracefulShutdown(signal) {
  console.log(`\n收到 ${signal} 信号，正在关闭服务器...`);
  clearInterval(cleanupTimer);

  server.close((err) => {
    if (err) {
      console.error('关闭失败:', err);
      process.exit(1);
    }
    console.log('服务器已关闭');
    process.exit(0);
  });

  // 如果 10 秒后还没关闭，强制退出
  setTimeout(() => {
    console.error('未能优雅关闭，强制退出');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, () => {
  console.log(`\n🚀 本地服务器已启动`);
  console.log(`📍 地址：http://localhost:${PORT}`);
  console.log(`📍 地址：http://127.0.0.1:${PORT}`);
  console.log(`\n✨ 模拟生产环境，支持 API 路由`);
  console.log(`📁 验证码目录：${path.join(__dirname, 'data/codes')}`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});
