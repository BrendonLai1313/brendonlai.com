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

export interface Post {
  slug: string; // 站內路由 slug（保證 ASCII）
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

let cached: Promise<Post[]> | null = null;

async function load(): Promise<Post[]> {
  const endpoint =
    `${WORDPRESS_URL}/wp-json/wp/v2/posts` +
    `?per_page=100&_fields=id,slug,title,excerpt,content,date,modified,link`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data: any[] = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((p) => p && p.slug && p.id && !EXCLUDED_IDS.includes(Number(p.id)))
      .map((p) => {
        const id = Number(p.id);
        const wpSlug = String(p.slug);
        return {
          slug: routeSlug(wpSlug, id),
          wpSlug,
          id,
          title: decodeEntities(String(p?.title?.rendered ?? '')),
          excerpt: plain(String(p?.excerpt?.rendered ?? '')),
          html: sanitize(String(p?.content?.rendered ?? '')),
          date: String(p?.date ?? ''),
          modified: String(p?.modified ?? p?.date ?? ''),
          link: String(p?.link ?? WORDPRESS_URL),
        };
      });
  } catch {
    return [];
  }
}

export function getPosts(): Promise<Post[]> {
  if (!cached) cached = load();
  return cached;
}

export const BLOG_URL = WORDPRESS_URL;
