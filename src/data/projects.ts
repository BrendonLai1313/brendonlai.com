// src/data/projects.ts
// -----------------------------------------------------------------------------
// /projects（矩阵档案柜 / File Cabinet）的案例资料，中英双语。
// 由 src/components/CaseFile.astro 渲染；两个 projects.astro 只负责 map。
// 新增 / 修改案例：只改这里，中英同步。
//
// theme 控制整张档案卡的配色（色彩 class 写在 CaseFile.astro 内，Tailwind 才扫描得到）。
// 「水面之下」解锁按钮一律走 site.ts 的 FORMS.resourceRequest（空 → 退回 #conversion）。
// -----------------------------------------------------------------------------

type Bi = { zh: string; en: string };

export type CaseTheme = 'amber' | 'green';

export interface CaseLogItem {
  status: 'testing' | 'done';
  text: Bi;
}

export interface CaseFileData {
  fileId: string; // 档案卡顶栏的视觉标签，例如 CROSS_BORDER_AI
  headerIcon: string; // 顶栏图示（fas）
  bgIcon: string; // 「水面之下」背景大图示（fas）
  theme: CaseTheme;
  title: Bi;
  subtitle: Bi;
  why: Bi;
  what: Bi;
  stack: { zh: string[]; en: string[] };
  log: CaseLogItem[];
  cta: Bi; // 解锁按钮文字
  note: { zh: [string, string]; en: [string, string] }; // 按钮下方说明（两行）
}

export const CASE_FILES: CaseFileData[] = [
  {
    fileId: 'CROSS_BORDER_AI',
    headerIcon: 'fa-globe-asia',
    bgIcon: 'fa-ship',
    theme: 'amber',
    title: { zh: '跨境贸易 AI 引擎', en: 'Cross-border Trade AI Engine' },
    subtitle: {
      zh: '欧标设计 + 中国制造，AI 提速供应链',
      en: 'European design + Chinese manufacturing, AI-accelerated supply chain',
    },
    why: {
      zh: '传统外贸询盘处理低效，跨文化沟通与供应链筛选成本极高。',
      en: 'Traditional foreign-trade inquiry handling is slow, and cross-cultural communication plus supplier screening is costly.',
    },
    what: {
      zh: '打造 AI 询盘过滤与报价系统，精准识别高意向客户，缩短 50% 沟通周期。',
      en: 'Build an AI inquiry-filtering and quoting system that spots high-intent buyers and cuts the communication cycle by 50%.',
    },
    stack: {
      zh: ['LLM Prompts', 'CRM 整合', '数据清洗脚本'],
      en: ['LLM Prompts', 'CRM integration', 'Data-cleaning scripts'],
    },
    log: [
      {
        status: 'testing',
        text: {
          zh: '[测试中] 欧美市场询盘语气情感分析模型微调。',
          en: '[Testing] Fine-tuning sentiment analysis for EU & US inquiry tone.',
        },
      },
    ],
    cta: { zh: '获取 AI 跨境询盘过滤 Prompt 📝', en: 'Get the AI cross-border inquiry filter prompt 📝' },
    note: {
      zh: ['供应链资源与核心话术库仅对同频者开放，', '填写申请单自动获取。'],
      en: ['Supply-chain resources & core scripts are reserved for aligned peers,', 'fill in the form for instant access.'],
    },
  },
  {
    fileId: 'BIO_HACKING',
    headerIcon: 'fa-yin-yang',
    bgIcon: 'fa-brain',
    theme: 'green',
    title: { zh: '工具与内在修炼', en: 'Tools & Inner Practice' },
    subtitle: {
      zh: 'Google Workspace 迁移与生物效率 SOP',
      en: 'Google Workspace migration & bio-efficiency SOPs',
    },
    why: {
      zh: '资讯过载导致注意力涣散，工作与家庭边界模糊。',
      en: 'Information overload scatters attention and blurs the line between work and family.',
    },
    what: {
      zh: '建立数位极简主义系统与冥想觉察习惯，恢复深度工作能力，提升决策质量。',
      en: 'Build a digital-minimalism system and meditation practice to restore deep work and sharpen decisions.',
    },
    stack: {
      zh: ['Google Workspace', 'GTD 方法论', 'Vipassana (内观)'],
      en: ['Google Workspace', 'GTD method', 'Vipassana'],
    },
    log: [
      {
        status: 'done',
        text: {
          zh: '[完成] 全面迁移至 Google Workspace，构建单一真理源 (SSOT)。',
          en: '[Done] Fully migrated to Google Workspace, building a single source of truth (SSOT).',
        },
      },
    ],
    cta: { zh: '解锁个人效能管理 SOP 笔记 📝', en: 'Unlock personal effectiveness SOP notes 📝' },
    note: {
      zh: ['高浓度生物黑客经验与习惯养成指南仅对同频者开放，', '填写申请单自动获取。'],
      en: ['High-density biohacking experience & habit guides are reserved for aligned peers,', 'fill in the form for instant access.'],
    },
  },
];
