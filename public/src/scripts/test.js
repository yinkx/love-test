/**
 * 测试页面逻辑
 */
import { questions } from './questions.js';

// API 基础 URL（根据环境自动适配）
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/love-test/api'
  : '/love-test/api';

// 本地开发模式（无后端时自动跳过验证）
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const USE_MOCK = false; // 设置为 false 使用真实 API 验证（本地服务器已支持 API）

// 状态管理
const state = {
  code: null,           // 验证码
  currentIndex: 0,      // 当前题目索引
  answers: [],          // 答案数组
  verified: false       // 是否已验证
};

// DOM 元素
const loadingScreen = document.getElementById('loading-screen');
const errorScreen = document.getElementById('error-screen');
const testScreen = document.getElementById('test-screen');
const errorMessage = document.getElementById('error-message');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const questionText = document.getElementById('question-text');
const optionsGrid = document.getElementById('options-grid');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// 初始化
async function init() {
  // 从 URL 获取验证码
  const params = new URLSearchParams(window.location.search);
  state.code = params.get('code');

  if (!state.code) {
    showError('缺少验证码，请从官方渠道获取');
    return;
  }

  // 验证验证码
  const valid = await verifyCode(state.code);
  if (!valid) {
    return;
  }

  // 验证通过，显示测试页面
  state.verified = true;
  showTest();
}

// 验证验证码
async function verifyCode(code) {
  // 本地开发模式：直接通过验证
  if (USE_MOCK) {
    console.log('[Mock] 本地开发模式，跳过验证');
    return true;
  }

  try {
    const response = await fetch(`${API_BASE}/verify?code=${encodeURIComponent(code)}`);
    const result = await response.json();

    if (result.valid) {
      return true;
    } else {
      showError(result.message || '验证码无效');
      return false;
    }
  } catch (error) {
    console.error('验证失败:', error);
    showError('网络错误，请稍后重试');
    return false;
  }
}

// 显示错误页面
function showError(message) {
  loadingScreen.style.display = 'none';
  errorScreen.style.display = 'flex';
  errorMessage.textContent = message;
}

// 显示测试页面
function showTest() {
  loadingScreen.style.display = 'none';
  testScreen.style.display = 'flex';
  renderQuestion();
}

// 渲染题目
function renderQuestion() {
  const question = questions[state.currentIndex];

  // 更新进度
  const progress = ((state.currentIndex + 1) / questions.length) * 100;
  progressFill.style.width = `${progress}%`;
  progressText.textContent = `${state.currentIndex + 1}/${questions.length}`;
  // 更新 ARIA
  progressFill.parentElement.setAttribute('aria-valuenow', Math.round(progress));

  // 渲染题目文本
  questionText.textContent = question.question;
  questionText.id = `question-${question.id}`;

  // 渲染选项
  optionsGrid.innerHTML = '';
  question.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = option.text;
    btn.dataset.score = option.score;
    btn.dataset.index = index;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.setAttribute('tabindex', '-1');
    btn.addEventListener('click', () => selectOption(option.score));
    optionsGrid.appendChild(btn);
  });

  // 如果之前已回答，恢复答案
  if (state.answers[state.currentIndex] !== undefined) {
    const buttons = optionsGrid.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
      if (parseInt(btn.dataset.score) === state.answers[state.currentIndex]) {
        btn.classList.add('selected');
        btn.setAttribute('aria-checked', 'true');
        btn.setAttribute('tabindex', '0');
      }
    });
  }

  // 聚焦第一个选项（仅首次加载）
  if (state.currentIndex === 0 && state.answers.length === 0) {
    const firstButton = optionsGrid.querySelector('.option-btn');
    if (firstButton) {
      firstButton.focus();
    }
  }

  // 更新按钮状态
  prevBtn.style.visibility = state.currentIndex === 0 ? 'hidden' : 'visible';
  nextBtn.textContent = state.currentIndex === questions.length - 1 ? '完成测试' : '下一题';
  nextBtn.disabled = state.answers[state.currentIndex] === undefined;
}

// 选择选项
function selectOption(score) {
  state.answers[state.currentIndex] = score;

  // 更新 UI 和 ARIA 状态
  const buttons = optionsGrid.querySelectorAll('.option-btn');
  buttons.forEach(btn => {
    const isSelected = parseInt(btn.dataset.score) === score;
    btn.classList.toggle('selected', isSelected);
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    btn.setAttribute('tabindex', isSelected ? '0' : '-1');
  });
  nextBtn.disabled = false;
}

// 键盘导航
document.addEventListener('keydown', (e) => {
  if (!state.verified) return;

  const buttons = Array.from(optionsGrid.querySelectorAll('.option-btn'));
  const currentSelectedIndex = buttons.findIndex(btn => btn.classList.contains('selected'));

  // 数字键 1-4 快速选择
  if (e.key >= '1' && e.key <= '4') {
    e.preventDefault();
    const index = parseInt(e.key) - 1;
    if (buttons[index]) {
      buttons[index].click();
      buttons[index].focus();
    }
  }

  // 方向键上下选择
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    let nextIndex = currentSelectedIndex;

    if (e.key === 'ArrowUp' && currentSelectedIndex > 0) {
      nextIndex = currentSelectedIndex - 1;
    } else if (e.key === 'ArrowDown' && currentSelectedIndex < buttons.length - 1) {
      nextIndex = currentSelectedIndex + 1;
    }

    if (nextIndex !== currentSelectedIndex && nextIndex >= 0) {
      buttons[nextIndex].click();
      buttons[nextIndex].focus();
    }
  }

  // Enter 键确认选择/下一题
  if (e.key === 'Enter' && state.answers[state.currentIndex] !== undefined) {
    e.preventDefault();
    nextBtn.click();
  }

  // 左右方向键切换题目（Alt + 方向键）
  if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    if (e.key === 'ArrowLeft' && state.currentIndex > 0) {
      prevBtn.click();
    } else if (e.key === 'ArrowRight' && state.currentIndex < questions.length - 1) {
      nextBtn.click();
    }
  }

  // Tab 键聚焦到选项
  if (e.key === 'Tab' && currentSelectedIndex === -1) {
    buttons[0].focus();
  }
});

// 上一题
prevBtn.addEventListener('click', () => {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
  }
});

// 下一题/完成
nextBtn.addEventListener('click', async () => {
  if (state.currentIndex < questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
  } else {
    // 完成测试，提交答案
    await submitAnswers();
  }
});

// 提交答案
async function submitAnswers() {
  // 计算结果
  const result = calculateResult(state.answers);

  // 标记验证码为已使用（本地模式跳过）
  if (!USE_MOCK) {
    try {
      await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: state.code })
      });
    } catch (error) {
      console.error('标记失败:', error);
    }
  } else {
    console.log('[Mock] 本地开发模式，跳过标记已使用');
  }

  // 存储结果到 localStorage
  localStorage.setItem('loveBrainResult', JSON.stringify(result));
  localStorage.setItem('loveBrainCode', state.code);

  // 跳转到结果页
  window.location.href = `./result.html?code=${state.code}`;
}

// 计算结果
function calculateResult(answers) {
  // 计算总分（原始分 20-80）
  const rawScore = answers.reduce((sum, score) => sum + score, 0);

  // 转换为百分制（0-100）
  const totalScore = Math.round(((rawScore - 20) / 60) * 100);

  // 计算各维度得分
  const dimensions = {
    emotion: [],
    behavior: [],
    rational: [],
    boundary: []
  };

  questions.forEach((q, index) => {
    dimensions[q.dimension].push(answers[index]);
  });

  const dimensionScores = {};
  const dimensionMax = { emotion: 20, behavior: 20, rational: 20, boundary: 20 };

  Object.keys(dimensions).forEach(key => {
    const raw = dimensions[key].reduce((sum, s) => sum + s, 0);
    // 每个维度 4-16 分，转换为 0-100
    dimensionScores[key] = Math.round(((raw - 4) / 12) * 100);
  });

  // 判定等级
  const level = getLevel(totalScore);

  return {
    totalScore,
    level,
    dimensionScores,
    rawScore
  };
}

// 判定等级
function getLevel(score) {
  if (score <= 20) return { name: "理性大师", color: "#7CB9A8" };
  if (score <= 40) return { name: "清醒恋爱者", color: "#A8D5BA" };
  if (score <= 60) return { name: "轻度恋爱脑", color: "#FFE5A0" };
  if (score <= 80) return { name: "中度恋爱脑", color: "#FFB5A8" };
  return { name: "重度恋爱脑患者", color: "#FF8A8A" };
}

// 启动
init();
