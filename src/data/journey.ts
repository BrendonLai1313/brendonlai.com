// src/data/journey.ts
// -----------------------------------------------------------------------------
// R7：雙語文案資料化（沿用 isEn 模式）
//
// 原本中／英兩份文案硬編碼在 JourneyTimeline.astro 內，改一句話就要動元件邏輯。
// 這裡把它抽成純資料：中英共用同一份 TypeScript 結構，欄位缺漏會在 build 期報錯，
// 永不「失同步」。元件只負責呈現。
//
// 用法：
//   const isEn = Astro.currentLocale === 'en';
//   const phases = journeyPhases[isEn ? 'en' : 'zh'];
//   const t = journeyCopy[isEn ? 'en' : 'zh'];
// -----------------------------------------------------------------------------

export interface Milestone {
  id: string;
  /** 年齡標籤，如 "10岁" / "10" */
  age: string;
  /** 年份標籤，如 "1998" */
  year: string;
  title: string;
  desc: string;
  impact: string;
  image: string;
  align: 'left' | 'right';
}

export interface JourneyPhase {
  id: string;
  title: string;
  subtitle: string;
  yearRange: string;
  milestones: Milestone[];
}

export type Lang = 'zh' | 'en';

export const journeyPhases: Record<Lang, JourneyPhase[]> = {
  zh: [
    {
      id: 'phase-childhood',
      title: '儿童与少年阶段',
      subtitle: '屋邨里的野孩子',
      yearRange: '1988 - 2000',
      milestones: [
        { id: 'stage-child-1', age: '10岁', year: '1998', title: '深水埗的街头智慧', desc: '在屋邨长大，没有丰厚的资源，但学会了如何在复杂的环境中生存。街头的游戏规则，成为我最早的商业启蒙。', impact: '培养了敏锐的观察力与不服输的韧性。', image: '/hero-life.jpg', align: 'left' },
        { id: 'stage-child-2', age: '15岁', year: '2003', title: '男校的丛林法则', desc: '进入竞争激烈的男校，在学业与人际关系中摸爬滚打。学会了如何在一群强者中找到自己的定位与发言权。', impact: '理解了「实力才是硬道理」的残酷现实。', image: '/hero-main.jpg', align: 'right' },
      ],
    },
    {
      id: 'phase-youth',
      title: '青年与探索阶段',
      subtitle: '第一份工与社会大学',
      yearRange: '2005 - 2012',
      milestones: [
        { id: 'stage-youth-1', age: '22岁', year: '2010', title: '社会大学的第一课', desc: '踏入职场，从最基层的职位开始。在现实的磨练中，学会了察言观色与向上管理，提早看清商业社会的底层逻辑。', impact: '种下了「不被环境定义」的种子，锻炼出极强的执行力。', image: '/hero-work.jpg', align: 'left' },
      ],
    },
    {
      id: 'phase-adult',
      title: '壮年与跨国实战',
      subtitle: '东南亚拓荒与降维打击',
      yearRange: '2014 - 2019',
      milestones: [
        { id: 'stage-adult-1', age: '26岁', year: '2014', title: '跨国制造业：东南亚拓荒', desc: '被派往星马泰印尼，面对截然不同的文化与供应链挑战。从工厂现场到区域策略，见证了实体经济的残酷与机遇。', impact: '建立了一套跨文化、跨地域的「降维打击」管理 SOP。', image: '/hero-work.jpg', align: 'right' },
      ],
    },
    {
      id: 'phase-mature',
      title: '中年与自我重构',
      subtitle: '父亲、创业者与 AI 系统',
      yearRange: '2020 - 至今',
      milestones: [
        { id: 'stage-mature-1', age: '30+岁', year: '2020+', title: '身份升级：父亲与创业者', desc: '迎来家庭新成员，同时开启独立顾问生涯。为了爱与信念，决定用 AI 与系统思维重构工作，追求更高的杠杆与自由。', impact: '真正理解「长期主义」与「资产沉淀」的意义。', image: '/hero-main.jpg', align: 'left' },
      ],
    },
  ],

  en: [
    {
      id: 'phase-childhood',
      title: 'Childhood & Teenage Years',
      subtitle: 'A wild kid from the housing estates',
      yearRange: '1988 - 2000',
      milestones: [
        { id: 'stage-child-1', age: '10', year: '1998', title: 'Street smarts of Sham Shui Po', desc: 'Grew up in public housing without abundant resources, but learned how to survive in a complex environment. The rules of the street became my earliest business education.', impact: 'Sharpened observation and built unyielding resilience.', image: '/hero-life.jpg', align: 'left' },
        { id: 'stage-child-2', age: '15', year: '2003', title: 'Jungle rules of an all-boys school', desc: 'Entered a fiercely competitive all-boys school, fighting through academics and relationships. Learned how to find my place and my voice among the strong.', impact: 'Understood the harsh truth that strength is the only currency.', image: '/hero-main.jpg', align: 'right' },
      ],
    },
    {
      id: 'phase-youth',
      title: 'Youth & Exploration',
      subtitle: 'First job & the school of life',
      yearRange: '2005 - 2012',
      milestones: [
        { id: 'stage-youth-1', age: '22', year: '2010', title: 'First lesson from the school of life', desc: 'Entered the workforce from the most junior position. Through real-world grind, learned to read the room and manage upward, seeing the underlying logic of business early.', impact: "Planted the seed of 'never be defined by your environment' and built relentless execution.", image: '/hero-work.jpg', align: 'left' },
      ],
    },
    {
      id: 'phase-adult',
      title: 'Prime Years & Cross-border Battles',
      subtitle: 'The SEA frontier & outmaneuvering',
      yearRange: '2014 - 2019',
      milestones: [
        { id: 'stage-adult-1', age: '26', year: '2014', title: 'Cross-border manufacturing: the SEA frontier', desc: 'Posted to Singapore, Malaysia, Thailand and Indonesia, facing radically different cultures and supply chains. From the factory floor to regional strategy, witnessed the brutality and opportunity of the real economy.', impact: "Built a cross-cultural, cross-region 'outmaneuver' management SOP.", image: '/hero-work.jpg', align: 'right' },
      ],
    },
    {
      id: 'phase-mature',
      title: 'Mid-life & Reinvention',
      subtitle: 'Father, founder & AI systems',
      yearRange: '2020 - present',
      milestones: [
        { id: 'stage-mature-1', age: '30+', year: '2020+', title: 'Level up: father & founder', desc: 'Welcomed a new family member while launching an independent consulting practice. For love and conviction, rebuilt my work with AI and systems thinking, chasing greater leverage and freedom.', impact: "Truly understood 'long-termism' and 'asset accumulation'.", image: '/hero-main.jpg', align: 'left' },
      ],
    },
  ],
};

export const journeyCopy: Record<Lang, {
  eyebrow: string;
  h2: string;
  desc: string;
  gained: string;
  /** 拍立得照片角落的年份標籤後綴，如「1998 年鉴」/「1998 Archive」 */
  archive: string;
}> = {
  zh: {
    eyebrow: 'THE JOURNEY',
    h2: '打怪升级路线图',
    desc: '每一个阶段都是一次破局与重生。点击展开不同的人生篇章，滑动查看我在各个 Milestone 获得的「装备」与「认知」。',
    gained: '获得认知/装备：',
    archive: '年鉴',
  },
  en: {
    eyebrow: 'THE JOURNEY',
    h2: 'Level-up roadmap',
    desc: 'Each stage is a breakthrough and a rebirth. Click to expand different chapters of my life, and explore the "gear" and "insights" I gained at each milestone.',
    gained: 'Gained insight / gear:',
    archive: 'Archive',
  },
};
