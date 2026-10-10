// src/data/schema.ts
// -----------------------------------------------------------------------------
// 全站結構化資料（JSON-LD / schema.org）的單一真理源。
// GEO 目的：讓 Google / Bing / AI 搜尋引擎明確知道「這是誰、在做什麼、在哪裡」。
//
// 用法（頁面 <head> 內）：
//   <Fragment slot="head">
//     <script type="application/ld+json" set:html={JSON.stringify(siteJsonLd('zh'))} />
//   </Fragment>
// -----------------------------------------------------------------------------
import { SITE_URL, SOCIAL } from './site';

export type Lang = 'zh' | 'en';

// sameAs：只放入「已設定」的社群連結，避免出現空字串（死連結）。
const sameAs = [SOCIAL.linkedin, SOCIAL.instagram, SOCIAL.twitter].filter(Boolean);

const PROFILE = {
  zh: {
    alternateName: '赖先生',
    jobTitle: '帮中国工业落地东南亚的实战顾问',
    description:
      '赖先生 —— 帮中国工业落地东南亚的实战顾问：市场进入、渠道搭建与本地分销。',
    knowsAbout: [
      '工业品出海',
      '东南亚市场进入',
      '本地分销',
      'B2B 贸易',
      'AI 自动化',
      '一人公司运营',
    ],
  },
  en: {
    alternateName: 'Brendon Lai',
    jobTitle: 'Hands-on advisor helping Chinese industry enter Southeast Asia',
    description:
      'Brendon Lai — a hands-on advisor helping Chinese industry land in Southeast Asia: market entry, channel building and local distribution.',
    knowsAbout: [
      'Southeast Asia market entry',
      'Industrial distribution',
      'B2B trade',
      'AI automation',
      'Solo business operations',
    ],
  },
} as const;

export function siteJsonLd(lang: Lang = 'zh') {
  const isEn = lang === 'en';
  const p = PROFILE[lang];
  const home = isEn ? `${SITE_URL}/en/` : `${SITE_URL}/`;
  const aboutUrl = isEn ? `${SITE_URL}/en/about-brendon` : `${SITE_URL}/about-brendon`;

  const person = {
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: 'Brendon Lai',
    alternateName: p.alternateName,
    url: aboutUrl,
    image: `${SITE_URL}/brendon-logo.png`,
    jobTitle: p.jobTitle,
    description: p.description,
    knowsAbout: [...p.knowsAbout],
    ...(sameAs.length ? { sameAs } : {}),
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: home,
    name: 'Brendon Lai',
    inLanguage: isEn ? 'en' : 'zh-CN',
    publisher: { '@id': `${SITE_URL}/#person` },
  };

  const page = {
    '@type': 'ProfilePage',
    '@id': home,
    url: home,
    name: isEn ? 'Brendon Lai' : '赖先生 · Brendon Lai',
    inLanguage: isEn ? 'en' : 'zh-CN',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#person` },
    mainEntity: { '@id': `${SITE_URL}/#person` },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [person, website, page],
  };
}
