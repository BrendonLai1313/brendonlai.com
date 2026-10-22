// src/data/projects.ts
// -----------------------------------------------------------------------------
// /projects（实证案例 / Case Files）的案例资料，中英双语。
// 由 src/components/CaseFile.astro 渲染；两个 projects.astro 只负责 map。
// 新增 / 修改案例：只改这里，中英同步。
//
// 主线：一个人 × AI = 一支团队。三个案例 = 首页「三个实证」的完整拆解，
// 每个案例只接一个出口；出口网址一律由 src/data/site.ts 解析，这里不写死。
//
// 内容红线（CLAUDE.md §5）：
//   - 案例 A 不写公司名、成立日期、股权、结束原因、金额、客户数。
//   - 案例 B 不写客户名、自己的货值 / 税额；税率以官方最新公告为准。
//   - 案例 C 只用「俊宇 / Joey」，不写全名，不写其他小朋友或家人的真名。
// theme 控制整张档案卡配色（色彩 class 写在 CaseFile.astro 内，Tailwind 才扫描得到）。
// -----------------------------------------------------------------------------
import { CONVERSION_ENTRIES, SOCIAL } from './site';

type Bi = { zh: string; en: string };
type BiList = { zh: string[]; en: string[] };

export type CaseTheme = 'amber' | 'green' | 'sky';

export interface CaseStep {
  title: Bi;
  body: Bi;
}

export interface CasePhoto {
  src: string; // public/ 下的路径；只放真实现场照片，已清 EXIF
  alt: Bi;
}

export interface CaseLogItem {
  status: 'ongoing' | 'done';
  text: Bi;
}

export interface CaseFileData {
  id: string; // 页内锚点，例如 case-a
  fileId: string; // 档案卡顶栏的视觉标签
  headerIcon: string; // 顶栏图示（fas）
  bgIcon: string; // 右侧出口区背景大图示（fas）
  theme: CaseTheme;
  tag: Bi; // 实证 A · 东南亚 0→1
  title: Bi;
  question: Bi; // 问题（主角）
  intro: Bi[]; // 开场段落
  steps: CaseStep[]; // ① ② ③ 做法
  closing: Bi; // 结语
  note?: Bi; // 小字附注（例如税率免责）
  roles: BiList; // 顶替的岗位
  photos?: CasePhoto[]; // 现场照片（可选）：1 张 = 横幅；2–3 张 = 并排
  photoCaption?: Bi; // 照片说明（不写客户名、不写年份）
  log?: CaseLogItem[];
  exit: { href: string; brand: string; label: Bi }; // 唯一出口；href 空 → 不渲染按钮
}

const entryUrl = (key: string) => CONVERSION_ENTRIES.find((e) => e.key === key)?.url ?? '';

export const CASE_FILES: CaseFileData[] = [
  // ---------------------------------------------------------------- A
  {
    id: 'case-a',
    fileId: 'PROOF_A · SEA_0_TO_1',
    headerIcon: 'fa-diagram-project',
    bgIcon: 'fa-industry',
    theme: 'amber',
    tag: { zh: '实证 A · 东南亚 0→1', en: 'Proof A · Southeast Asia 0→1' },
    title: {
      zh: '一个人，把一间东南亚工业品公司从 0 搭起来',
      en: 'One person, building a Southeast Asian industrial-supply company from zero',
    },
    question: {
      zh: '一间新公司没有 IT 部门，怎样在第一天就有接得住订单的系统？',
      en: 'No IT department at a brand-new company — how do you have systems that can handle orders from day one?',
    },
    intro: [
      {
        zh: '一间新公司最缺的往往不是订单，而是一套接得住订单的系统。没有 IT 部门，也没有预算请实施顾问，营运由我一个人负责，所以我用 AI 自己搭。',
        en: "What a new company lacks most is rarely orders — it's a system that can handle them. No IT department, no budget for implementation consultants, and operations run by me alone. So I built it myself, with AI.",
      },
    ],
    steps: [
      {
        title: { zh: '产品数据管线', en: 'Product data pipeline' },
        body: {
          zh: '清洗并标准化约 1,500 个 SKU 的供应商目录，把「成本 → 汇率 → 税 → 利润」的定价矩阵写成可重跑的脚本。改一个参数，整份报价表就重新算一次。',
          en: 'Cleaned and standardised a supplier catalogue of about 1,500 SKUs, and turned the "cost → exchange rate → tax → margin" pricing matrix into a re-runnable script. Change one parameter and the whole price list recalculates.',
        },
      },
      {
        title: { zh: '自建 ERP', en: 'Self-built ERP' },
        body: {
          zh: '自己部署 Odoo，处理报价、订单和库存，把「供应商 → 仓库 → 客户」串成一条完整的单。',
          en: 'Deployed Odoo myself for quotes, orders and inventory, linking "supplier → warehouse → customer" into one continuous order flow.',
        },
      },
      {
        title: { zh: 'B2B 产品商城', en: 'B2B product store' },
        body: {
          zh: '用 Odoo 搭建，按应用场景分类（夹持、刀具、量测、机防、搬运），产品页直接标示 HS code 和到岸成本说明。',
          en: 'Built on Odoo and organised by application (workholding, cutting tools, measuring, machine protection, handling), with HS codes and landed-cost notes on every product page.',
        },
      },
    ],
    closing: {
      zh: '按传统做法，这是一支小团队几个月的工作。我想说的不是 AI 有多厉害，而是当你清楚要做什么，AI 会把「做」的时间压缩。判断力，仍然是你的。',
      en: "Done the traditional way, this is months of work for a small team. My point isn't how powerful AI is — it's that when you know exactly what to do, AI compresses the doing. The judgement is still yours.",
    },
    photos: [
      { src: '/photos/case-a-delivery-team.jpg', alt: { zh: '客户现场交付后的合照', en: 'Team photo after an on-site client delivery' } },
      { src: '/photos/case-a-workbench.jpg', alt: { zh: '安装工作台与挂板', en: 'Installing a workbench and pegboard' } },
      { src: '/photos/case-a-trolley.jpg', alt: { zh: '组装移动推车', en: 'Assembling a mobile trolley' } },
    ],
    photoCaption: {
      zh: '客户现场交付：工作台、挂板与移动推车，从报价到安装一手跟进。',
      en: 'On-site client delivery: workbenches, pegboards and mobile trolleys — followed through from quote to installation.',
    },
    roles: {
      zh: ['数据专员', '定价分析', 'ERP 实施', '网站开发'],
      en: ['Data specialist', 'Pricing analyst', 'ERP implementer', 'Web developer'],
    },
    log: [
      {
        status: 'done',
        text: { zh: '[阶段完成] 三套系统由 0 搭建并投入营运。', en: '[Phase complete] Three systems built from zero and put into operation.' },
      },
    ],
    exit: {
      href: entryUrl('sea-leap'),
      brand: 'sea-leap.com',
      label: { zh: '出海落地咨询', en: 'Market-entry consulting' },
    },
  },

  // ---------------------------------------------------------------- B
  {
    id: 'case-b',
    fileId: 'PROOF_B · CROSS_BORDER',
    headerIcon: 'fa-file-shield',
    bgIcon: 'fa-ship',
    theme: 'green',
    tag: { zh: '实证 B · 跨境出海', en: 'Proof B · Cross-border' },
    title: {
      zh: '把出海最繁琐的合规工序，做成工具',
      en: 'Turning the most tedious compliance work into tools',
    },
    question: {
      zh: '出海难的不是「卖」，而是卖出去之后的那一百张纸。',
      en: "Going global isn't hard because of selling — it's the hundred pieces of paper after the sale.",
    },
    intro: [
      {
        zh: '我在做马来西亚进口时，每天都在处理这三类工序。传统做法要么请人，要么外包，我把它们做成了工具。',
        en: 'Importing into Malaysia, I dealt with these three kinds of work every day. The usual answer is to hire or outsource. I turned them into tools.',
      },
    ],
    steps: [
      {
        title: { zh: 'SDS 文件生成', en: 'SDS generation' },
        body: {
          zh: '输入产品资料，自动生成合规格式的安全数据表。以前要先查资料库再排版，现在是填表。',
          en: 'Enter the product data and a compliant safety data sheet is generated. It used to mean searching databases and formatting by hand — now it means filling in a form.',
        },
      },
      {
        title: { zh: '进口税务查核', en: 'Import tax checks' },
        body: {
          zh: '用 AI 直接读马来西亚官方宪报原文（关税税则令、销售税令、豁免令，合共 300 多页），逐个 HS code 核对关税、销售税和豁免条件。也理清了几套常被混淆的制度：低价值商品税和商业进口销售税、De Minimis 的适用范围、豁免必须在货到前获批。',
          en: "Used AI to read Malaysia's official gazettes directly — the customs duties order, sales tax orders and exemption orders, 300+ pages in all — checking duty, sales tax and exemptions HS code by HS code. It also untangled regimes that are often confused: low-value goods tax vs. sales tax on commercial imports, where De Minimis actually applies, and why exemptions must be approved before the goods arrive.",
        },
      },
      {
        title: { zh: '清关与贸易文件', en: 'Customs & trade documents' },
        body: {
          zh: '英文发票、HS code、原产地、Incoterms（DAP / DDP 责任划分），全部模板化、自动填入。',
          en: 'English invoices, HS codes, country of origin and Incoterms (who is liable under DAP vs. DDP) — all templated and filled in automatically.',
        },
      },
    ],
    closing: {
      zh: '结论只有一句：规则写在官方原文里，AI 让一个人也读得完。',
      en: 'The takeaway is one line: the rules are written in the official texts, and AI lets one person read all of them.',
    },
    note: {
      zh: '税率与豁免条件以马来西亚官方最新公告为准。',
      en: "Duty rates and exemption conditions are subject to Malaysia's latest official notices.",
    },
    photos: [
      { src: '/photos/case-b-client-site.jpg', alt: { zh: '在客户的化工车间现场工作', en: "Working on site in a client's chemical workshop" } },
    ],
    photoCaption: {
      zh: '首位付费客户的车间：SDS 生成工具在这里落地。',
      en: "At the first paying client's workshop, where the SDS generator was put to work.",
    },
    roles: {
      zh: ['合规专员', '报关前期查核', '单证文员'],
      en: ['Compliance specialist', 'Pre-clearance checks', 'Documentation clerk'],
    },
    log: [
      {
        status: 'done',
        text: { zh: '[已落地] SDS 生成工具迎来首位付费客户。', en: '[Live] The SDS generator has its first paying client.' },
      },
    ],
    exit: {
      href: entryUrl('gai-store'),
      brand: 'gai-store.com',
      label: { zh: '出海工具与平台', en: 'Go-global tools & platform' },
    },
  },

  // ---------------------------------------------------------------- C
  {
    id: 'case-c',
    fileId: 'PROOF_C · EDUSTORY',
    headerIcon: 'fa-clapperboard',
    bgIcon: 'fa-film',
    theme: 'sky',
    tag: { zh: '实证 C · EduStory', en: 'Proof C · EduStory' },
    title: {
      zh: '把我走过的路，画给孩子看',
      en: "Painting what I've lived, for my kid",
    },
    question: {
      zh: '几万年前，人类在洞壁上画下生存的方法，留给下一代。今天，一个爸爸能用什么？',
      en: 'Tens of thousands of years ago, people painted survival lessons on cave walls for the next generation. What can a dad use today?',
    },
    intro: [
      {
        zh: '那时候人类还没有文字，只能在洞穴的墙上画下野牛、长矛和围猎的队形。不是为了好看，而是为了让下一代知道：遇到这样的情况，该怎样活下去。我做 EduStory，做的是同一件事。',
        en: 'There was no writing yet — only bison, spears and hunting formations on the wall. Not for beauty, but so the next generation would know how to survive. EduStory is the same thing.',
      },
      {
        zh: '每一集都从两个真实的触发点开始：我看见孩子俊宇（Joey）做了一件事；我知道这件事做下去，大概率会有什么后果，因为同样的错，我自己犯过，也吃过亏。孩子真实的行为、父亲真实的观察、父亲真实吃过的亏，就是故事的全部原料。',
        en: "Every episode starts from two real triggers: I see my kid Joey do something, and I know where it is likely to lead — because I've made the same mistake myself and paid for it. A child's real behaviour, a father's real observation, a father's real lesson: that is all the story is made of.",
      },
    ],
    steps: [
      {
        title: { zh: '不说教，把坏习惯变成角色', en: "Don't lecture — turn the habit into a character" },
        body: {
          zh: '不盖笔盖的红水笔会打喷嚏漏墨，被乱丢的玩具会半夜离家出走。孩子看见的不是责备，而是后果，然后自己决定要不要改。',
          en: "A marker left uncapped sneezes ink everywhere; toys thrown on the floor run away at midnight. What the child sees isn't blame but consequences — and then decides for himself whether to change.",
        },
      },
      {
        title: { zh: '一支由 AI 组成的动画团队', en: 'An animation crew made of AI' },
        body: {
          zh: '我把监制、编剧、画师拆成三个 AI 智能体，各有规格书、质检红线和固定的角色库。一集 3 分钟、18 个镜头，主角和家人在每一集都保持同一个样子。',
          en: 'I split the producer, scriptwriter and artist into three AI agents, each with its own spec, quality-gate rules and a shared character bank. Each episode is 3 minutes and 18 shots, and the family looks the same in every one.',
        },
      },
      {
        title: { zh: '像改良生产线一样迭代', en: 'Iterated like a production line' },
        body: {
          zh: '第一集只有 1 分钟、8 个镜头，像幻灯片。逐秒复盘之后定下规则：一集只讲一件事、每个镜头不超过 25 个字、留 5 秒给动作和呼吸。到第四集，节奏才真正定型。',
          en: 'Episode one was 1 minute and 8 shots — it felt like a slideshow. After reviewing it second by second, I set the rules: one story per episode, no more than 25 characters of dialogue per shot, five seconds left for action and breath. By episode four the pacing finally settled.',
        },
      },
    ],
    closing: {
      zh: 'AI 替我省下的是人手。故事里的智慧和心意，仍然只能由我自己来给。',
      en: 'AI saves me the crew. The wisdom and the care can only come from me.',
    },
    roles: {
      zh: ['编剧', '分镜', '动画', '配音', '剪辑'],
      en: ['Scriptwriter', 'Storyboard', 'Animator', 'Voice-over', 'Editor'],
    },
    log: [
      {
        status: 'ongoing',
        text: { zh: '[持续更新] YouTube「EduStory 动画」已发布 4 集。', en: '[Ongoing] 4 episodes published in the "EduStory 动画" YouTube playlist.' },
      },
    ],
    exit: {
      href: SOCIAL.edustoryPlaylist,
      brand: 'YouTube · EduStory 动画',
      label: { zh: '关注 EduStory', en: 'Follow EduStory' },
    },
  },
];

// 页面标题文案
export const CASES_COPY = {
  zh: {
    title: '实证案例 | Brendon Lai · 一个人 × AI = 一支团队',
    description:
      '一个人 × AI = 一支团队的完整拆解：一个人把东南亚工业品公司从 0 搭起来、把出海合规工序做成工具、用 AI 动画团队为孩子拍品格故事。',
    h1: '实证案例',
    sub: '一个人 × AI = 一支团队的完整拆解：问题、做法、结果。',
  },
  en: {
    title: 'Case Files | Brendon Lai · One person × AI = a whole team',
    description:
      'One person × AI = a whole team, taken apart: building a Southeast Asian industrial-supply company from zero, turning go-global compliance into tools, and an AI animation crew making character stories for a kid.',
    h1: 'Case Files',
    sub: 'One person × AI = a whole team, taken apart: the problem, the method, the result.',
  },
};
