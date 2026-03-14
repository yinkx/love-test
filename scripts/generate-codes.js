const fs = require('fs');
const path = require('path');

// 生成随机验证码（6 位字母数字组合）
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符 I, O, 1, 0
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 生成不重复的验证码
function generateUniqueCodes(count, existingCodes = []) {
  const codes = new Set(existingCodes);
  const newCodes = [];

  while (newCodes.length < count) {
    const code = generateCode();
    if (!codes.has(code)) {
      codes.add(code);
      newCodes.push(code);
    }
  }

  return newCodes;
}

// 主函数
function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  let count = 100; // 默认生成 100 个
  let outputDir = path.join(__dirname, '../data/codes');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    }
  }

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 获取已存在的验证码
  const existingFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));
  const existingCodes = existingFiles.map(f => f.replace('.json', ''));

  // 生成新的验证码
  const newCodes = generateUniqueCodes(count, existingCodes);

  // 创建验证码文件
  const now = new Date().toISOString();
  newCodes.forEach(code => {
    const codePath = path.join(outputDir, `${code}.json`);
    const codeData = {
      code: code,
      status: 0, // 0=未使用，1=已使用
      createdAt: now,
      usedAt: null,
      ip: null
    };
    fs.writeFileSync(codePath, JSON.stringify(codeData, null, 2));
  });

  console.log(`✅ 成功生成 ${newCodes.length} 个验证码`);
  console.log(`📁 存储目录：${outputDir}`);
  console.log('\n验证码列表:');
  console.log(newCodes.join(', '));
}

main();
