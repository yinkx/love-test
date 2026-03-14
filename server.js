/**
 * 本地开发服务器 - 模拟生产环境
 * 支持静态文件和 API 路由
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 路由配置（与 vercel.json 保持一致）
const routes = [
  { src: /^\/api\//, dest: '/api$&' },
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

// 处理验证码 API
async function handleVerify(req, res, query) {
  const codePath = path.join(__dirname, 'data/codes', `${query.code}.json`);

  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // 处理 OPTIONS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET - 验证验证码
  if (req.method === 'GET') {
    if (!query.code) {
      res.writeHead(400);
      res.end(JSON.stringify({ valid: false, message: '缺少验证码' }));
      return;
    }

    try {
      if (!fs.existsSync(codePath)) {
        res.writeHead(200);
        res.end(JSON.stringify({ valid: false, message: '验证码无效' }));
        return;
      }

      const codeData = JSON.parse(fs.readFileSync(codePath, 'utf8'));

      if (codeData.status === 1) {
        res.writeHead(200);
        res.end(JSON.stringify({ valid: false, message: '验证码已被使用' }));
        return;
      }

      // 检查是否过期（24 小时）
      const createdAt = new Date(codeData.createdAt).getTime();
      const now = Date.now();
      const hoursPassed = (now - createdAt) / (1000 * 60 * 60);

      if (hoursPassed > 24) {
        res.writeHead(200);
        res.end(JSON.stringify({ valid: false, message: '验证码已过期' }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ valid: true, message: '验证通过' }));
    } catch (error) {
      console.error('验证错误:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ valid: false, message: '服务器错误' }));
    }
    return;
  }

  // POST - 标记已使用
  if (req.method === 'POST') {
    const body = await parseBody(req);
    const code = body.code;

    if (!code) {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, message: '缺少验证码' }));
      return;
    }

    try {
      if (!fs.existsSync(codePath)) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: '验证码不存在' }));
        return;
      }

      const codeData = JSON.parse(fs.readFileSync(codePath, 'utf8'));

      if (codeData.status === 1) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: '验证码已被使用' }));
        return;
      }

      codeData.status = 1;
      codeData.usedAt = new Date().toISOString();
      codeData.ip = req.headers['x-forwarded-for'] || '127.0.0.1';

      fs.writeFileSync(codePath, JSON.stringify(codeData, null, 2));

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: '已标记为已使用' }));
    } catch (error) {
      console.error('标记错误:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, message: '服务器错误' }));
    }
    return;
  }

  res.writeHead(405);
  res.end(JSON.stringify({ error: '不支持的方法' }));
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

  console.log(`${req.method} ${pathname}`);

  // 处理 API 路由
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/verify' || pathname === '/api/verify/') {
      await handleVerify(req, res, query);
      return;
    }
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API not found' }));
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

server.listen(PORT, () => {
  console.log(`\n🚀 本地服务器已启动`);
  console.log(`📍 地址：http://localhost:${PORT}`);
  console.log(`📍 地址：http://127.0.0.1:${PORT}`);
  console.log(`\n✨ 模拟生产环境，支持 API 路由`);
  console.log(`📁 验证码目录：${path.join(__dirname, 'data/codes')}`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});
