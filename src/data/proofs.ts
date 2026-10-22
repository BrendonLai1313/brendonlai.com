// src/data/proofs.ts
// -----------------------------------------------------------------------------
// 首页「三个实证」区块的资料（中英双语）。
// 主线：一个人 × AI = 一支团队。每个实证只讲「做过什么、结果怎样」，
// 只接一个出口；出口网址一律由 src/data/site.ts 解析，这里不写死任何网址。
//
// 内容红线（见 CLAUDE.md §5）：
//   - 实证 A 不写公司名、成立日期、股权、结束原因、金额、客户数。
//   - EduStory 只用「俊宇 / Joey」，不用全名。
//   - 实证文案 ≠ 转化入口文案：这里讲结果，ConversionEntries 讲去哪里找我。
// -----------------------------------------------------------------------------
import { CONVERSION_ENTRIES, SOCIAL } from './site';

type Bi = { zh: string; en: string };

export interface Proof {
  key: 'a' | 'b' | 'c';
  letter: string;
  icon: string; // FontAwesome class（fas）
  tag: Bi;
  question: Bi;
  title: Bi;
  result: Bi;
  roles: { zh: string[]; en: string[] };
  // href 为空字串 → 链接不渲染（与 site.ts 的「空 = 隐藏」规则一致）
  link: { href: string; label: Bi };
}

const entryUrl = (key: string) => CONVERSION_ENTRIES.find((e) => e.key === key)?.url ?? '';

export const PROOFS: Proof[] = [
  {
    key: 'a',
    letter: 'A',
    icon: 'fa-diagram-project',
    tag: { zh: '实证 A · 东南亚 0→1', en: 'Proof A · Southeast Asia 0→1' },
    question: {
      zh: '一间新公司没有 IT 部门，怎样在第一天就有接得住订单的系统？',
      en: 'No IT department at a brand-new company — how do you have systems that can handle orders from day one?',
    },
    title: {
      zh: '一个人，把一间东南亚工业品公司从 0 搭起来',
      en: 'One person, building a Southeast Asian industrial-supply company from zero',
    },
    result: {
      zh: '3 套自建系统：产品数据管线 · 自建 ERP · B2B 产品商城',
      en: '3 self-built systems: product data pipeline · ERP · B2B product store',
    },
    roles: {
      zh: ['数据专员', '定价分析', 'ERP 实施', '网站开发'],
      en: ['Data specialist', 'Pricing analyst', 'ERP implementer', 'Web developer'],
    },
    link: {
      href: entryUrl('sea-leap'),
      label: { zh: '相关服务：出海落地咨询', en: 'Related: market-entry consulting' },
    },
  },
  {
    key: 'b',
    letter: 'B',
    icon: 'fa-file-shield',
    tag: { zh: '实证 B · 跨境出海', en: 'Proof B · Cross-border' },
    question: {
      zh: '出海难的不是「卖」，而是卖出去之后的那一百张纸。',
      en: "Going global isn't hard because of selling — it's the hundred pieces of paper after the sale.",
    },
    title: {
      zh: '把出海最繁琐的合规工序，做成工具',
      en: 'Turning the most tedious compliance work into tools',
    },
    result: {
      zh: 'SDS 文件生成（已有付费客户）· 进口税务查核 · 清关与贸易文件',
      en: 'SDS generation (first paying customer) · import tax checks · customs & trade documents',
    },
    roles: {
      zh: ['合规专员', '报关前期查核', '单证文员'],
      en: ['Compliance specialist', 'Pre-clearance checks', 'Documentation clerk'],
    },
    link: {
      href: entryUrl('gai-store'),
      label: { zh: '相关工具', en: 'Related tools' },
    },
  },
  {
    key: 'c',
    letter: 'C',
    icon: 'fa-clapperboard',
    tag: { zh: '实证 C · EduStory', en: 'Proof C · EduStory' },
    question: {
      zh: '几万年前，人类在洞壁上画下生存的方法，留给下一代。今天，一个爸爸能用什么？',
      en: 'Tens of thousands of years ago, people painted survival lessons on cave walls for the next generation. What can a dad use today?',
    },
    title: {
      zh: '用 AI，把我走过的路画成动画，留给孩子',
      en: "Turning the road I've walked into cartoons for my kid, with AI",
    },
    result: {
      zh: '每一集取材自孩子真实的行为与我亲身吃过的亏，由三个 AI 智能体组成的动画团队完成。',
      en: 'Every episode starts from my kid\'s real behaviour and a lesson I learned the hard way — made by an AI crew of three agents.',
    },
    roles: {
      zh: ['编剧', '分镜', '动画', '配音', '剪辑'],
      en: ['Scriptwriter', 'Storyboard', 'Animator', 'Voice-over', 'Editor'],
    },
    link: {
      href: SOCIAL.edustoryPlaylist,
      label: { zh: '关注 EduStory', en: 'Follow EduStory' },
    },
  },
];

// 区块标题文案
export const PROOFS_COPY = {
  zh: {
    eyebrow: 'PROOF · 三个实证',
    h2: '一个人 × AI = 一支团队',
    sub: '不是口号。下面每一件，都是我一个人借助 AI 亲手做出来的。',
    rolesLabel: '顶替的岗位',
  },
  en: {
    eyebrow: 'PROOF · THREE CASES',
    h2: 'One person × AI = a whole team',
    sub: 'Not a slogan. Each of these was built by one person, hands-on, with AI.',
    rolesLabel: 'Roles covered',
  },
};
