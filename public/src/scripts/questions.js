/**
 * 恋爱脑测试题目数据
 * 共 20 题，四维度，每维度 5 题
 * 维度：emotion(情绪)、behavior(行为)、rational(理性)、boundary(边界)
 */

export const questions = [
  // ==================== 情绪维度 (1-5) ====================
  {
    id: 1,
    dimension: "emotion",
    question: "当他没有及时回复消息时，你会忍不住胡思乱想吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },
  {
    id: 2,
    dimension: "emotion",
    question: "他的情绪变化会明显影响到你的心情吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },
  {
    id: 3,
    dimension: "emotion",
    question: "你会因为他的一句话开心很久，也会因为一句话难过很久吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },
  {
    id: 4,
    dimension: "emotion",
    question: "等待他消息的过程中，你会感到焦虑不安吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },
  {
    id: 5,
    dimension: "emotion",
    question: "你会反复琢磨他说过的话，试图找出 hidden meaning 吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },

  // ==================== 行为维度 (6-10) ====================
  {
    id: 6,
    dimension: "behavior",
    question: "你会主动找他聊天，即使他回复得很简短吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },
  {
    id: 7,
    dimension: "behavior",
    question: "你会为了他推掉和朋友们的聚会吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },
  {
    id: 8,
    dimension: "behavior",
    question: "你会记住他说过的每句话，甚至记得他随口提过的小愿望吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },
  {
    id: 9,
    dimension: "behavior",
    question: "你会主动为他做一些事，即使他没有要求吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },
  {
    id: 10,
    dimension: "behavior",
    question: "你会改变自己的作息或习惯来配合他吗？",
    options: [
      { text: "完全不会", score: 1 },
      { text: "偶尔会", score: 2 },
      { text: "经常会", score: 3 },
      { text: "总是会", score: 4 }
    ]
  },

  // ==================== 理性维度 (11-15) ====================
  {
    id: 11,
    dimension: "rational",
    question: "即使很喜欢他，你也能客观评估你们是否合适吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  },
  {
    id: 12,
    dimension: "rational",
    question: "当他做出让你不舒服的事，你会理性沟通而不是忍让吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  },
  {
    id: 13,
    dimension: "rational",
    question: "你能分清他对你的好是出于真心还是只是礼貌吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  },
  {
    id: 14,
    dimension: "rational",
    question: "即使很在意，你也会考虑这段关系是否值得继续投入吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  },
  {
    id: 15,
    dimension: "rational",
    question: "你能意识到自己的某些想法可能只是「脑补」而非事实吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  },

  // ==================== 边界维度 (16-20) ====================
  {
    id: 16,
    dimension: "boundary",
    question: "你会有自己的独立空间和时间，不完全围着他转吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  },
  {
    id: 17,
    dimension: "boundary",
    question: "你有自己的兴趣爱好，不会因为恋爱就放弃吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  },
  {
    id: 18,
    dimension: "boundary",
    question: "你能在恋爱中保持自己的朋友圈子吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  },
  {
    id: 19,
    dimension: "boundary",
    question: "你有自己的底线和原则，不会因为他而一再妥协吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  },
  {
    id: 20,
    dimension: "boundary",
    question: "你能接受他有自己的空间，不会时刻黏着他吗？",
    options: [
      { text: "完全不会", score: 4 },
      { text: "偶尔会", score: 3 },
      { text: "经常会", score: 2 },
      { text: "总是会", score: 1 }
    ]
  }
];

// 维度说明
export const dimensions = {
  emotion: {
    name: "情绪",
    description: "你在恋爱中的情绪波动程度"
  },
  behavior: {
    name: "行为",
    description: "你为恋爱付出的行为程度"
  },
  rational: {
    name: "理性",
    description: "你在恋爱中的理性思考能力"
  },
  boundary: {
    name: "边界",
    description: "你在恋爱中保持自我的程度"
  }
};
