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
  /** 照片路径；留空 '' = 不显示照片。只放真实对应该年份的照片，避免把近照标成旧年鉴。 */
  image: string;
  /** 照片角落的年份标签（可选）。照片年份与里程碑年份不同时用，例如童年照实为 1983 年拍。 */
  imageLabel?: string;
  /** 照片填充方式：默认 cover（裁切填满）；横向证书 / 奖牌用 contain（完整显示）。 */
  imageFit?: 'cover' | 'contain';
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

// 2026-10-21 按 Brendon 的 LinkedIn 履历与本人补充重写（Brendon 1979 年 12 月出生）。
// 事实来源：LinkedIn（2000–2025 职位与年份）＋ Brendon 补充（2003–2006 香港本地中小企、2018–2020 猎芯网）＋ 2023 年个人 CV（奖项、团队与营业额百分比）。
// 已批准点名的前雇主：Suntan Technology、Sumida、United Chemi-Con、RS Components、猎芯网 ichunt、Hoffmann Group（只写雇佣事实）。
// 2025 年的东南亚公司保持匿名（见 docs/DECISIONS.md）。
export const journeyPhases: Record<Lang, JourneyPhase[]> = {
  zh: [
    {
      id: 'phase-childhood',
      title: '香港成长',
      subtitle: '屋邨里的野孩子',
      yearRange: '1979 - 1999',
      milestones: [
        { id: 'stage-child-1', age: '10岁', year: '1990', title: '深水埗的街头智慧', desc: '在屋邨长大，没有丰厚的资源，但学会了如何在复杂的环境中生存。街头的游戏规则，成为我最早的商业启蒙。', impact: '培养了敏锐的观察力与不服输的韧性。', image: '/photos/timeline-1983-childhood.jpg', imageLabel: '1983', align: 'left' },
        { id: 'stage-child-2', age: '15岁', year: '1995', title: '男校的丛林法则', desc: '进入竞争激烈的男校，在学业与人际关系中摸爬滚打。学会了如何在一群强者中找到自己的定位与发言权。', impact: '理解了「实力才是硬道理」的残酷现实。', image: '/photos/timeline-1995-school.jpg', align: 'right' },
      ],
    },
    {
      id: 'phase-youth',
      title: '香港销售前线',
      subtitle: '日系与欧洲工业品分销',
      yearRange: '2000 - 2018',
      milestones: [
        { id: 'stage-youth-1', age: '20岁', year: '2000', title: '第一份工：一个人跑完整条线', desc: '在香港 Suntan Technology 担任销售与市场经理，从客户拜访、市场活动到活动策划，一个人跑完整条线；之后在香港本地中小企继续磨练。', impact: '最早学会：销售、市场和执行，本来就是同一件事。', image: '', align: 'left' },
        { id: 'stage-youth-2', age: '26岁', year: '2006', title: '日系电子元件：品质与纪律', desc: '先后加入日系电子元件企业 Sumida 与 United Chemi-Con：由销售专员做起，负责 OEM 订单份额与设计端推广；升任销售主管后协调新产品开发、管理大客户与季度商务谈判，并获大客户颁发「最佳供应商」与「最佳交货」奖项。', impact: '在日本企业学会：可靠，比聪明更值钱。', image: '/photos/timeline-2011-chemicon-expo.jpg', imageLabel: '2011', align: 'right' },
        { id: 'stage-youth-3', age: '32岁', year: '2012', title: '欧洲目录分销：RS Components', desc: '加入欧洲工业品目录分销商 RS Components，由客户经理升任华南区销售总监。2015 财年连续四季获香港区 Top Sales，最高单季超出任务 514.8%，所在办事处获评 2015 财年最佳办事处；2017 年担任欧时工业园中国路演主讲。同期在职读完英国兰开夏大学市场学学士，获 2013 年最佳学生奖，并代表毕业生致谢辞。', impact: '目录分销的本质，是让急需的客户随时找得到、等得起。', image: '/photos/timeline-2015-rs-top-sales-board.jpg', imageLabel: '2015', imageFit: 'contain', align: 'left' },
      ],
    },
    {
      id: 'phase-adult',
      title: '跨境与东南亚',
      subtitle: '从中国供应链平台到德国工具品牌',
      yearRange: '2018 - 2025',
      milestones: [
        { id: 'stage-adult-1', age: '38岁', year: '2018', title: '中国电子元器件平台：猎芯网', desc: '出任深圳电子元器件 B2B 平台猎芯网（ichunt）的销售总监，负责国际与中国市场：完成销售架构调整，把销售团队扩充一倍，并设立香港办事处与供应链分公司。', impact: '从平台内部看见中国供应链的速度，也看见它出海时要补的那一块。', image: '/photos/timeline-2018-ichunt.jpg', align: 'right' },
        { id: 'stage-adult-2', age: '40岁', year: '2020', title: '德国工具品牌：一个人，用数码带动全国团队', desc: '出任德国工具品牌 Hoffmann Group 马来西亚公司销售总监（国家经理），完成各部门架构调整与办事处搬迁。自发用数码工具带领全国销售团队：把销售理念、产品知识和数据做成视频、报表与网页工具。任内 36 个月，国家营业额增长超过 44%，团队人数却减少了 43%。', impact: '人少了 43%，营业额多了 44%：一个人 + 好工具，可以放大一整支团队。这是「一个人 × AI = 一支团队」的起点。', image: '/photos/timeline-2020-hoffmann.jpg', align: 'left' },
      ],
    },
    {
      id: 'phase-mature',
      title: '一个人 × AI',
      subtitle: '一人公司与 EduStory',
      yearRange: '2025 - 至今',
      milestones: [
        { id: 'stage-mature-1', age: '45岁', year: '2025', title: '东南亚公司 0→1', desc: '用 AI 一个人把一间东南亚工业品公司从 0 搭起来：产品数据管线、自建 ERP、B2B 产品商城。', impact: '验证了：一个人 × AI，可以撑起一间公司的骨架。', image: '/photos/case-a-delivery-team.jpg', align: 'right' },
        { id: 'stage-mature-2', age: '46岁', year: '2026', title: '一人公司与 EduStory', desc: '把工作和育儿都重构成 AI 系统：一人公司营运，以及为孩子拍的品格动画 EduStory。', impact: 'AI 替我省下人手；判断和心意，仍然是自己的。', image: '/photos/case-a-trolley.jpg', align: 'left' },
      ],
    },
  ],

  en: [
    {
      id: 'phase-childhood',
      title: 'Growing up in Hong Kong',
      subtitle: 'A wild kid from the housing estates',
      yearRange: '1979 - 1999',
      milestones: [
        { id: 'stage-child-1', age: '10', year: '1990', title: 'Street smarts of Sham Shui Po', desc: 'Grew up in public housing without abundant resources, but learned how to survive in a complex environment. The rules of the street became my earliest business education.', impact: 'Sharpened observation and built unyielding resilience.', image: '/photos/timeline-1983-childhood.jpg', imageLabel: '1983', align: 'left' },
        { id: 'stage-child-2', age: '15', year: '1995', title: 'Jungle rules of an all-boys school', desc: 'Entered a fiercely competitive all-boys school, fighting through academics and relationships. Learned how to find my place and my voice among the strong.', impact: 'Understood the harsh truth that strength is the only currency.', image: '/photos/timeline-1995-school.jpg', align: 'right' },
      ],
    },
    {
      id: 'phase-youth',
      title: 'The Hong Kong sales front line',
      subtitle: 'Japanese components & European catalogue distribution',
      yearRange: '2000 - 2018',
      milestones: [
        { id: 'stage-youth-1', age: '20', year: '2000', title: 'First job: running the whole line alone', desc: 'Sales & Marketing Manager at Suntan Technology in Hong Kong — client visits, marketing activities and events, end to end on my own; then more years in a local Hong Kong SME.', impact: 'Learned early that sales, marketing and execution are really one job.', image: '', align: 'left' },
        { id: 'stage-youth-2', age: '26', year: '2006', title: 'Japanese components: quality & discipline', desc: 'Joined Japanese electronic-component makers Sumida and then United Chemi-Con — starting as a sales executive tracking OEM order share and design-in promotion, then as sales supervisor coordinating new product development, key accounts and quarterly business reviews, with "Best Supplier" and "Best Delivery" awards from key customers.', impact: 'Japanese companies taught me that reliability is worth more than cleverness.', image: '/photos/timeline-2011-chemicon-expo.jpg', imageLabel: '2011', align: 'right' },
        { id: 'stage-youth-3', age: '32', year: '2012', title: 'European catalogue distribution: RS Components', desc: 'Joined European industrial catalogue distributor RS Components, rising from account manager to South China Sales Director. Hong Kong Top Sales for four straight quarters in FY15, peaking at 514.8% of quarterly budget, in the FY15 Best Office; main speaker at the 2017 RS Industry Park roadshow in China. Meanwhile completed a part-time BA in Marketing at the University of Lancashire — 2013 Best Student Award, and the graduates\' vote of thanks.', impact: 'The essence of catalogue distribution: urgent customers can always find it, and can count on it arriving.', image: '/photos/timeline-2015-rs-top-sales-board.jpg', imageLabel: '2015', imageFit: 'contain', align: 'left' },
      ],
    },
    {
      id: 'phase-adult',
      title: 'Cross-border & Southeast Asia',
      subtitle: 'From a Chinese supply-chain platform to a German tool brand',
      yearRange: '2018 - 2025',
      milestones: [
        { id: 'stage-adult-1', age: '38', year: '2018', title: 'Chinese components platform: ichunt', desc: 'Sales Director (International & China) at ichunt (猎芯网), a Shenzhen B2B platform for electronic components: restructured sales, doubled the sales team, and set up a Hong Kong office and a supply-chain subsidiary.', impact: 'Saw the speed of China\'s supply chain from the inside — and the piece it still needs when going global.', image: '/photos/timeline-2018-ichunt.jpg', align: 'right' },
        { id: 'stage-adult-2', age: '40', year: '2020', title: 'A German tool brand: one person, a nationwide team, made digital', desc: 'Sales Director (Country Manager) at Hoffmann Group\'s Malaysian company — restructured departments and relocated the office. I took it on myself to lead the nationwide sales team with digital tools: videos, reports and web tools carrying our sales thinking, product knowledge and data. Over 36 months, country turnover grew by more than 44% while the team shrank by 43%.', impact: '43% fewer people, 44% more turnover: one person with good tools can amplify a whole team — the seed of "one person × AI = a whole team".', image: '/photos/timeline-2020-hoffmann.jpg', align: 'left' },
      ],
    },
    {
      id: 'phase-mature',
      title: 'One person × AI',
      subtitle: 'A one-person company & EduStory',
      yearRange: '2025 - present',
      milestones: [
        { id: 'stage-mature-1', age: '45', year: '2025', title: 'A Southeast Asian company, 0→1', desc: 'Built a Southeast Asian industrial-supply company from zero, alone, with AI: product data pipeline, self-built ERP, B2B product store.', impact: 'Proved that one person × AI can hold up the skeleton of a company.', image: '/photos/case-a-delivery-team.jpg', align: 'right' },
        { id: 'stage-mature-2', age: '46', year: '2026', title: 'A one-person company & EduStory', desc: 'Rebuilding both work and parenting as AI systems: running a one-person company, and making EduStory character cartoons for my kid.', impact: 'AI saves me the crew; the judgement and the care are still mine.', image: '/photos/case-a-trolley.jpg', align: 'left' },
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
