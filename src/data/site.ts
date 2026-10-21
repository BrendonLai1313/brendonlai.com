// src/data/site.ts
// -----------------------------------------------------------------------------
// 全站唯一真理源 (SSOT)：外部連結 / 聯絡方式 / 轉化入口。
// 任何要換「真實號碼、表單連結、社群連結」的地方，只需要改這一個檔案。
//
// 規則：
//   留空字串 ('') = 該項目尚未設定 → 元件會自動隱藏，或改為引導至轉化入口，
//   因此畫面上永遠不會出現壞掉的按鈕（href="#" 或 YOUR_FORM_ID 這類死連結）。
// -----------------------------------------------------------------------------

export const SITE_URL = 'https://brendonlai.com';

export interface ConversionEntry {
  key: 'sea-leap' | 'gai-store';
  url: string;
  icon: string; // FontAwesome class
  brand: string; // 對外顯示的域名
  name: { zh: string; en: string };
  desc: { zh: string; en: string };
  cta: { zh: string; en: string };
}

// 轉化收口入口（與 public/llms.txt 完全一致）
// 2026-10-21：hoff-industrial.com 撤出轉化入口（Brendon 決定）。域名仍屬 Brendon，
// 日後若轉指向他自己的新業務，再加回此陣列（記得同步 key 型別與 llms.txt）。
export const CONVERSION_ENTRIES: ConversionEntry[] = [
  {
    key: 'sea-leap',
    url: 'https://sea-leap.com',
    icon: 'fa-ship',
    brand: 'sea-leap.com',
    name: { zh: '出海咨询', en: 'Going-global consulting' },
    desc: {
      zh: '工业品出海东南亚的市场进入、渠道搭建与落地陪跑。',
      en: 'Market entry, channel building and hands-on support for industrial products entering Southeast Asia.',
    },
    cta: { zh: '预约咨询', en: 'Book a consult' },
  },
  {
    key: 'gai-store',
    url: 'https://gai-store.com',
    icon: 'fa-store',
    brand: 'gai-store.com',
    name: { zh: 'B2B 贸易平台', en: 'B2B trade platform' },
    desc: {
      zh: '面向工业品采购的 B2B 交易与供应链对接平台。',
      en: 'A B2B trading platform for industrial procurement and supply-chain matching.',
    },
    cta: { zh: '进入平台', en: 'Visit platform' },
  },
];

export const CONTACT = {
  // WhatsApp（國際格式、不含 + 與空格）。
  whatsapp: '8615017959223',
  // 微信號（搜索用）。
  wechatId: 'brendonlky',
  // 把二維碼圖片放到 public/wechat-qr.png，然後填入 '/wechat-qr.png'。
  // 留空 → 彈窗改為引導文字，不再出現「請放入圖片」佔位符。
  wechatQr: '',
  // 對外 Email。
  email: 'info@brendonlai.com',
};

export const SOCIAL = {
  // 真實社群連結。留空 → 該圖示不渲染（避免 href="#" 死連結）。
  linkedin: 'https://www.linkedin.com/in/lai-brendon-winwinwin',
  // TODO: 建議日後改為自訂短網址 'https://www.linkedin.com/in/brendonlai'（與 brendonlai.com 一致）。
  instagram: '',
  twitter: '',
  // Brendon 本人的 YouTube 频道（注意：youtube.com/@BrendonLai 不是他的频道）。
  youtube: 'https://www.youtube.com/@laibrendon',
  // EduStory 播放清单（实证 C 的出口）。留空 → 实证 C 的链接不渲染。
  edustoryPlaylist: 'https://www.youtube.com/playlist?list=PLfFWb1UvxzOU',
};

export const FORMS = {
  // TODO: 填入真實 Google Form 連結（解鎖資源用）。
  //       留空 → 資源解鎖按鈕改為引導至站內轉化入口（#conversion）。
  resourceRequest: '',
};
