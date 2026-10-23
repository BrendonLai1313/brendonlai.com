// src/data/posts.ts
// -----------------------------------------------------------------------------
// R3（P1）：專欄文章的唯一資料源。
//
// build-time 抓 WordPress REST API 一次，模組層快取，供 /insights 列表頁與
// /insights/[slug] 文章頁共用 —— 兩邊永遠一致。
//
// GEO 鐵律（PLAN §6）：站內靜態文章頁，不用 iframe / JS 動態載入。
// canonical 歸主域（即本站 /insights/[slug]）；原文仍以博客為出處並回連。
// -----------------------------------------------------------------------------

const WORDPRESS_URL =
  import.meta.env.PUBLIC_WORDPRESS_URL || 'https://blog.brendonlai.com';

export type Lang = 'zh' | 'en';

export interface FaqItem {
  q: string;
  a: string;
}

export interface Post {
  slug: string; // 站內路由 slug（保證 ASCII；英文版已去掉結尾 -en）
  lang: Lang; // 依 WP 分類 zh / en 判斷；冇分類就按標題有冇中文字推斷
  hasPair: boolean; // 另一語言有冇同 slug 嘅版本（有先輸出 hreflang）
  faq: FaqItem[]; // 由正文「FAQ / 常见问题」段落抽出，供 FAQPage JSON-LD
  wpSlug: string; // WordPress 原始 slug（可含中文）
  id: number; // WordPress 文章 ID
  title: string;
  excerpt: string;
  html: string; // 已淨化的正文 HTML
  date: string; // ISO 日期
  modified: string; // ISO 日期
  link: string; // 博客原文網址（出處）
}

// 想給某篇文章一個漂亮又有關鍵字的網址時，在此以 WP 文章 ID 指定自訂 slug。
// 例：{ 42: 'industrial-engineering-of-enlightenment' }
// 留空即可 —— 非 ASCII 的原生 slug 會自動退回 `post-<id>`。
export const SLUG_OVERRIDES: Record<number, string> = {};

// 不在本站展示的 WP 文章 ID（例如 n8n 发文流程的测试稿）。
// 根治方法是在 WordPress 把测试稿改成草稿或删除；这里是保险。
export const EXCLUDED_IDS: number[] = [7]; // 7 = 「n8n 測試：第一篇自動發文」

// Astro 動態路由對非 ASCII slug 的編碼比對不穩（會出現 NoMatchingStaticPathFound），
// 因此站內路由一律使用 ASCII slug：原生 slug 已是 ASCII 者沿用，否則退回 post-<id>。
function routeSlug(wpSlug: string, id: number): string {
  if (SLUG_OVERRIDES[id]) return SLUG_OVERRIDES[id];
  if (/^[a-z0-9-]+$/i.test(wpSlug)) return wpSlug;
  return `post-${id}`;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
}

function plain(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

// Google Docs 貼文帶來的雜亂 HTML：只保留語義標籤與安全的 a / img 屬性。
function sanitize(input: string): string {
  let s = input ?? '';

  // 若回傳是整份文件，只取 body 內容
  const body = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) s = body[1];

  // 完全移除不含正文的元素
  s = s.replace(/<(script|style|iframe|noscript|head|title|meta|link)[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<\/?(html|head|body)[^>]*>/gi, '');
  s = s.replace(/<(script|style|iframe|noscript|meta|link)[^>]*\/?>/gi, '');

  // 白名單化所有開始標籤（只留 a 的 href、img 的 src/alt，其餘屬性一律丟棄）
  s = s.replace(/<([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (_m, rawTag, attrs) => {
    const tag = String(rawTag).toLowerCase();
    if (tag === 'a') {
      const href = (attrs.match(/href\s*=\s*"([^"]*)"/i) || [])[1] || '';
      return href ? `<a href="${href}" rel="noopener">` : '<a>';
    }
    if (tag === 'img') {
      const src = (attrs.match(/src\s*=\s*"([^"]*)"/i) || [])[1] || '';
      const alt = (attrs.match(/alt\s*=\s*"([^"]*)"/i) || [])[1] || '';
      return src ? `<img src="${src}" alt="${alt}" loading="lazy">` : '';
    }
    return `<${tag}>`;
  });

  // 移除 Google Docs 慣用的空 span（cX / lst-kix_* 等已在上一步的屬性白名單化中被清掉）
  s = s.replace(/<\/?span[^>]*>/gi, '');

  return s.trim();
}

// 中英配對規則（2026-10-23 確認）：同一篇文中英各一篇 WP 文章，
// 中文 slug = x，英文 slug = x-en，WP 分類分別為 zh / en。
// 網站：中文 → /insights/x，英文 → /en/insights/x，兩者互相 hreflang。
const CJK = /[\u3400-\u9fff]/;

function detectLang(catSlugs: string[], title: string): Lang {
  if (catSlugs.includes('en')) return 'en';
  if (catSlugs.includes('zh') || catSlugs.includes('zh-cn')) return 'zh';
  return CJK.test(title) ? 'zh' : 'en';
}

// 正文入面標題含「FAQ / 常见问题 / 常見問題」嘅段落：其後每個 h3 = 問題，跟住嘅段落 = 答案。
function extractFaq(html: string): FaqItem[] {
  const m = html.match(/<h2>[^<]*(FAQ|常见问题|常見問題)[^<]*<\/h2>([\s\S]*?)(?=<h2>|$)/i);
  if (!m) return [];
  const items: FaqItem[] = [];
  const re = /<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/gi;
  let r: RegExpExecArray | null;
  while ((r = re.exec(m[2]))) {
    const q = plain(r[1]);
    const a = plain(r[2]);
    if (q && a) items.push({ q, a });
  }
  return items;
}

let cached: Promise<Post[]> | null = null;

async function load(): Promise<Post[]> {
  const endpoint =
    `${WORDPRESS_URL}/wp-json/wp/v2/posts` +
    `?per_page=100&_fields=id,slug,title,excerpt,content,date,modified,link,categories`;
  try {
    const catMap = new Map<number, string>();
    try {
      const cr = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/categories?per_page=100&_fields=id,slug`);
      if (cr.ok) {
        const cats: any[] = await cr.json();
        if (Array.isArray(cats)) cats.forEach((c) => catMap.set(Number(c.id), String(c.slug).toLowerCase()));
      }
    } catch {
      /* 分類攞唔到就用標題推斷語言 */
    }
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data: any[] = await res.json();
    if (!Array.isArray(data)) return [];
    const list: Post[] = data
      .filter((p) => p && p.slug && p.id && !EXCLUDED_IDS.includes(Number(p.id)))
      .map((p) => {
        const id = Number(p.id);
        const wpSlug = String(p.slug);
        const title = decodeEntities(String(p?.title?.rendered ?? ''));
        const catSlugs = (Array.isArray(p.categories) ? p.categories : []).map((c: any) => catMap.get(Number(c)) ?? '');
        const lang = detectLang(catSlugs, title);
        let slug = routeSlug(wpSlug, id);
        if (lang === 'en') slug = slug.replace(/-en$/, '');
        const html = sanitize(String(p?.content?.rendered ?? ''));
        return {
          slug,
          lang,
          hasPair: false,
          faq: extractFaq(html),
          wpSlug,
          id,
          title,
          excerpt: plain(String(p?.excerpt?.rendered ?? '')),
          html,
          date: String(p?.date ?? ''),
          modified: String(p?.modified ?? p?.date ?? ''),
          link: String(p?.link ?? WORDPRESS_URL),
        };
      });
    const key = (p: Post) => `${p.lang}:${p.slug}`;
    const keys = new Set(list.map(key));
    list.forEach((p) => (p.hasPair = keys.has(`${p.lang === 'zh' ? 'en' : 'zh'}:${p.slug}`)));
    return list;
  } catch {
    return [];
  }
}

/** 全部文章；傳 lang 就只返回該語言。 */
export async function getPosts(lang?: Lang): Promise<Post[]> {
  if (!cached) cached = load();
  const all = await cached;
  return lang ? all.filter((p) => p.lang === lang) : all;
}

export const BLOG_URL = WORDPRESS_URL;
