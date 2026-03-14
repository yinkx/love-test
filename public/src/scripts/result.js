/**
 * 结果页面逻辑
 */
import { questions, dimensions } from './questions.js';

// 状态管理
const state = {
  result: null,
  code: null
};

// DOM 元素
const levelBadge = document.getElementById('level-badge');
const levelName = document.getElementById('level-name');
const levelIcon = document.getElementById('level-icon');
const scoreNumber = document.getElementById('score-number');
const dimensionList = document.getElementById('dimension-list');
const featuresList = document.getElementById('features-list');
const suggestionsList = document.getElementById('suggestions-list');
const shareModal = document.getElementById('share-modal');
const shareBtn = document.getElementById('share-btn');
const modalClose = document.getElementById('modal-close');
const downloadBtn = document.getElementById('download-btn');
const shareLevel = document.getElementById('share-level');
const shareScore = document.getElementById('share-score');
const shareDesc = document.getElementById('share-desc');

// 等级描述文案
const levelDescriptions = {
  "理性大师": "你在感情中保持着清醒的头脑，不容易被爱情冲昏头脑。你懂得爱自己，这是最棒的恋爱状态。",
  "清醒恋爱者": "你在感情中能保持理性，同时也愿意真诚投入。这种平衡很难得，请继续珍惜。",
  "轻度恋爱脑": "你在感情中比较投入，偶尔会因为对方情绪起伏。这很正常，说明你在认真对待这段关系。",
  "中度恋爱脑": "你在感情中很容易投入，有时会忽略自己的需求。学习在爱里保持一些自我空间，会让你更快乐。",
  "重度恋爱脑患者": "你在感情中全然投入，愿意为爱付出一切。你的勇敢很珍贵，但也请记得好好爱自己。"
};

// 各维度特征
const dimensionFeatures = {
  emotion: {
    high: ["情绪容易随对方波动", "经常胡思乱想", "对消息回复很敏感"],
    low: ["情绪相对稳定", "不容易过度解读", "能保持心情平静"]
  },
  behavior: {
    high: ["会主动为对方付出", "愿意改变习惯配合", "记住对方的每句话"],
    low: ["付出比较谨慎", "保持原有生活习惯", "不会过度主动"]
  },
  rational: {
    high: ["能理性评估关系", "会沟通不舒服的事", "不容易被冲昏头脑"],
    low: ["容易感情用事", "有时会忍让", "容易陷入自我感动"]
  },
  boundary: {
    high: ["容易让渡个人空间", "可能放弃兴趣爱好", "边界感较弱"],
    low: ["保持独立空间", "有自己的生活圈", "边界感清晰"]
  }
};

// 成长建议库
const suggestionsPool = {
  emotion: [
    "尝试记录情绪日记，觉察情绪波动的触发点",
    "练习「暂停 10 分钟」法则，情绪上来时先做别的事",
    "培养独处的能力，学会自己安抚情绪"
  ],
  behavior: [
    "付出前问问自己：这是对方需要的，还是我想给的？",
    "保持自己的社交圈，不要因为恋爱推掉所有聚会",
    "允许对方有自己的空间，不需要时刻联系"
  ],
  rational: [
    "定期反思这段关系：它让你变得更好还是更焦虑？",
    "学习区分「事实」和「脑补」，不要过度解读",
    "设置底线，当被触碰时要勇敢表达"
  ],
  boundary: [
    "每周保留至少一次「只属于自己的时间」",
    "重拾或培养一个完全属于自己的爱好",
    "练习说「不」，你的需求同样重要"
  ]
};

// 初始化
async function init() {
  // 从 URL 获取验证码
  const params = new URLSearchParams(window.location.search);
  state.code = params.get('code');

  if (!state.code) {
    alert('缺少验证码，请重新测试');
    window.location.href = './index.html';
    return;
  }

  // 检查 URL 中的 code 是否与 localStorage 中的一致
  const storedCode = localStorage.getItem('loveBrainCode');
  const resultStr = localStorage.getItem('loveBrainResult');

  // 如果验证码不一致或没有结果，需要重新测试
  if (state.code !== storedCode || !resultStr) {
    alert('验证码已变更或测试数据不存在，请重新测试');
    window.location.href = `./test.html?code=${state.code}`;
    return;
  }

  state.result = JSON.parse(resultStr);
  renderResult();
}

// 渲染结果
function renderResult() {
  const { totalScore, level, dimensionScores } = state.result;

  // 渲染等级
  levelName.textContent = level.name;
  levelBadge.style.borderColor = level.color;
  levelIcon.textContent = getLevelIcon(totalScore);

  // 渲染分数（动画）
  animateScore(scoreNumber, totalScore);

  // 渲染雷达图
  renderRadarChart(dimensionScores);

  // 渲染维度分析
  renderDimensionAnalysis(dimensionScores);

  // 渲染典型特征
  renderFeatures(dimensionScores);

  // 渲染成长建议
  renderSuggestions(dimensionScores);
}

// 等级图标
function getLevelIcon(score) {
  if (score <= 20) return "🧘";
  if (score <= 40) return "🌿";
  if (score <= 60) return "🌸";
  if (score <= 80) return "💕";
  return "💗";
}

// 分数动画
function animateScore(element, target) {
  let current = 0;
  const increment = target / 30;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 30);
}

// 渲染雷达图（带动画）
function renderRadarChart(scores) {
  const canvas = document.getElementById('radar-canvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 40;

  // 维度标签
  const labels = ["情绪", "行为", "理性", "边界"];
  const targetValues = [
    scores.emotion / 100,
    scores.behavior / 100,
    scores.rational / 100,
    scores.boundary / 100
  ];

  // 当前动画值
  let currentValues = [0, 0, 0, 0];
  const animationSpeed = 0.05;

  // 清空画布
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // 绘制背景网格（5 层）
  function drawGrid() {
    ctx.strokeStyle = '#E8D5D5';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const ratio = i / 5;
      const gridRadius = radius * ratio;

      ctx.beginPath();
      for (let j = 0; j < 4; j++) {
        const angle = (Math.PI / 2) - (j * Math.PI / 2);
        const x = centerX + Math.cos(angle) * gridRadius;
        const y = centerY - Math.sin(angle) * gridRadius;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  // 绘制轴线
  function drawAxes() {
    ctx.strokeStyle = '#D4A5A5';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) - (i * Math.PI / 2);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY - Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  // 绘制数据区域
  function drawDataArea(values) {
    ctx.fillStyle = 'rgba(212, 165, 165, 0.5)';
    ctx.strokeStyle = '#D4A5A5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) - (i * Math.PI / 2);
      const dataRadius = radius * values[i];
      const x = centerX + Math.cos(angle) * dataRadius;
      const y = centerY - Math.sin(angle) * dataRadius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 绘制数据点
  function drawDataPoints(values) {
    ctx.fillStyle = '#D4A5A5';
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) - (i * Math.PI / 2);
      const dataRadius = radius * values[i];
      const x = centerX + Math.cos(angle) * dataRadius;
      const y = centerY - Math.sin(angle) * dataRadius;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 绘制标签
  function drawLabels() {
    ctx.fillStyle = '#4A4A4A';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelPositions = [
      { x: centerX, y: centerY - radius - 20 },
      { x: centerX + radius + 30, y: centerY },
      { x: centerX, y: centerY + radius + 20 },
      { x: centerX - radius - 30, y: centerY }
    ];
    labels.forEach((label, i) => {
      ctx.fillText(label, labelPositions[i].x, labelPositions[i].y);
    });
  }

  // 动画循环
  function animate() {
    let shouldContinue = false;

    // 更新当前值
    for (let i = 0; i < 4; i++) {
      if (currentValues[i] < targetValues[i]) {
        currentValues[i] += (targetValues[i] - currentValues[i]) * animationSpeed;
        shouldContinue = true;
      }
    }

    // 绘制所有元素
    clearCanvas();
    drawGrid();
    drawAxes();
    drawDataArea(currentValues);
    drawDataPoints(currentValues);
    drawLabels();

    if (shouldContinue) {
      requestAnimationFrame(animate);
    }
  }

  // 启动动画
  animate();
}

// 渲染维度分析
function renderDimensionAnalysis(scores) {
  const dimConfig = {
    emotion: { name: "情绪维度", desc: "你在恋爱中的情绪波动程度" },
    behavior: { name: "行为维度", desc: "你为恋爱付出的行为程度" },
    rational: { name: "理性维度", desc: "你在恋爱中的理性思考能力" },
    boundary: { name: "边界维度", desc: "你在恋爱中保持自我的程度" }
  };

  dimensionList.innerHTML = '';
  Object.keys(scores).forEach(key => {
    const score = scores[key];
    const config = dimConfig[key];
    const level = score >= 60 ? '偏高' : score >= 40 ? '中等' : '偏低';
    const color = score >= 60 ? '#FF8A8A' : score >= 40 ? '#FFE5A0' : '#A8D5BA';

    const item = document.createElement('div');
    item.className = 'dimension-item';
    item.innerHTML = `
      <div class="dimension-header">
        <span class="dimension-name">${config.name}</span>
        <span class="dimension-score" style="background: ${color}">${score}分</span>
      </div>
      <p class="dimension-desc">${config.desc}</p>
      <p class="dimension-level">你的状态：<span style="color: ${color}">${level}</span></p>
    `;
    dimensionList.appendChild(item);
  });
}

// 渲染典型特征
function renderFeatures(scores) {
  const features = [];

  Object.keys(scores).forEach(key => {
    const score = scores[key];
    const isHigh = score >= 60;
    const featureList = dimensionFeatures[key][isHigh ? 'high' : 'low'];
    features.push(...featureList.slice(0, 2));
  });

  // 打乱并取 5 条
  const shuffled = features.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 5);

  featuresList.innerHTML = '';
  selected.forEach(feature => {
    const li = document.createElement('li');
    li.className = 'feature-item';
    li.textContent = `• ${feature}`;
    featuresList.appendChild(li);
  });
}

// 渲染成长建议
function renderSuggestions(scores) {
  const suggestions = [];

  // 找出得分最高的两个维度（最需要关注的）
  const sortedDims = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  sortedDims.forEach(([dim]) => {
    const pool = suggestionsPool[dim];
    const selected = pool[Math.floor(Math.random() * pool.length)];
    suggestions.push(selected);
  });

  // 添加通用建议
  suggestions.push("每天花 10 分钟独处，和自己对话");

  suggestionsList.innerHTML = '';
  suggestions.forEach((suggestion, index) => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.innerHTML = `<span class="suggestion-num">${index + 1}</span> ${suggestion}`;
    suggestionsList.appendChild(div);
  });
}

// 分享功能
shareBtn.addEventListener('click', () => {
  const { level, totalScore } = state.result;
  shareLevel.textContent = level.name;
  shareScore.textContent = `${totalScore}分`;
  shareDesc.textContent = levelDescriptions[level.name] || '';
  shareModal.style.display = 'flex';

  // 聚焦到关闭按钮
  setTimeout(() => modalClose.focus(), 100);

  // 阻止背景滚动
  document.body.style.overflow = 'hidden';
});

modalClose.addEventListener('click', () => {
  shareModal.style.display = 'none';
  document.body.style.overflow = '';
  shareBtn.focus();
});

// 关闭弹窗（点击背景）
shareModal.addEventListener('click', (e) => {
  if (e.target === shareModal) {
    shareModal.style.display = 'none';
    document.body.style.overflow = '';
    shareBtn.focus();
  }
});

// ESC 键关闭弹窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && shareModal.style.display === 'flex') {
    shareModal.style.display = 'none';
    document.body.style.overflow = '';
    shareBtn.focus();
  }
});

// 分享弹窗内的 Tab 键循环
shareModal.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;

  const focusableElements = shareModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey && document.activeElement === firstElement) {
    e.preventDefault();
    lastElement.focus();
  } else if (!e.shiftKey && document.activeElement === lastElement) {
    e.preventDefault();
    firstElement.focus();
  }
});

// 下载分享卡片
downloadBtn.addEventListener('click', async () => {
  const shareCard = document.getElementById('share-card');

  // 使用 html2canvas 或简单截图方案
  // 这里使用 Canvas 手绘方式生成图片
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 375;
  const height = 500;

  canvas.width = width;
  canvas.height = height;

  // 绘制背景渐变
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#FFF8F0');
  gradient.addColorStop(1, '#F4E4C1');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 绘制标题
  ctx.fillStyle = '#D4A5A5';
  ctx.font = 'bold 20px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('🌸 恋爱脑测试 🌸', width / 2, 50);

  // 绘制等级
  const { level, totalScore } = state.result;
  ctx.fillStyle = '#4A4A4A';
  ctx.font = 'bold 28px system-ui';
  ctx.fillText(level.name, width / 2, 120);

  // 绘制分数
  ctx.fillStyle = '#D4A5A5';
  ctx.font = 'bold 56px system-ui';
  ctx.fillText(`${totalScore}`, width / 2, 190);

  // 绘制描述
  ctx.fillStyle = '#8B8B8B';
  ctx.font = '16px system-ui';
  const desc = levelDescriptions[level.name] || '';
  wrapText(ctx, desc, width / 2, 230, width - 60, 24);

  // 绘制底部文字
  ctx.fillStyle = '#8B8B8B';
  ctx.font = '14px system-ui';
  ctx.fillText('扫码测试你的恋爱脑指数', width / 2, height - 40);

  // 下载图片
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `恋爱脑测试-${level.name}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('生成失败:', error);
    alert('生成失败，请使用手机截图保存～');
  }
});

// 辅助函数：文本换行
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

// 启动
init();
