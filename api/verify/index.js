const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET - 校验验证码
  if (req.method === 'GET') {
    const { code } = req.query;

    if (!code) {
      res.status(400).json({ valid: false, message: '缺少验证码' });
      return;
    }

    try {
      const codePath = path.join(__dirname, '../../data/codes', `${code}.json`);

      // 检查文件是否存在
      if (!fs.existsSync(codePath)) {
        res.status(200).json({ valid: false, message: '验证码无效' });
        return;
      }

      // 读取验证码信息
      const codeData = JSON.parse(fs.readFileSync(codePath, 'utf8'));

      // 检查是否已使用
      if (codeData.status === 1) {
        res.status(200).json({ valid: false, message: '验证码已被使用' });
        return;
      }

      // 检查是否过期（24 小时）
      const createdAt = new Date(codeData.createdAt).getTime();
      const now = Date.now();
      const hoursPassed = (now - createdAt) / (1000 * 60 * 60);

      if (hoursPassed > 24) {
        res.status(200).json({ valid: false, message: '验证码已过期' });
        return;
      }

      // 验证通过
      res.status(200).json({ valid: true, message: '验证通过' });
    } catch (error) {
      console.error('验证错误:', error);
      res.status(500).json({ valid: false, message: '服务器错误' });
    }

    return;
  }

  // POST - 标记验证码已使用
  if (req.method === 'POST') {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ success: false, message: '缺少验证码' });
      return;
    }

    try {
      const codePath = path.join(__dirname, '../../data/codes', `${code}.json`);

      // 检查文件是否存在
      if (!fs.existsSync(codePath)) {
        res.status(400).json({ success: false, message: '验证码不存在' });
        return;
      }

      // 读取并更新
      const codeData = JSON.parse(fs.readFileSync(codePath, 'utf8'));

      if (codeData.status === 1) {
        res.status(400).json({ success: false, message: '验证码已被使用' });
        return;
      }

      // 标记为已使用
      codeData.status = 1;
      codeData.usedAt = new Date().toISOString();
      codeData.ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

      // 写回文件
      fs.writeFileSync(codePath, JSON.stringify(codeData, null, 2));

      res.status(200).json({ success: true, message: '已标记为已使用' });
    } catch (error) {
      console.error('标记错误:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }

    return;
  }

  // 不支持的方法
  res.status(405).json({ error: '不支持的方法' });
};
