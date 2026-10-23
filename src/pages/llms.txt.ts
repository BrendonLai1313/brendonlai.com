// /llms.txt —— 俾 AI 读的网站简介（GEO）
// -----------------------------------------------------------------------------
// 主体仍然人手维护：src/data/llms-base.txt（改主张、入口或案例时要同步更新）。
// 专栏文章清单由 build 时从 WordPress 自动附加，唔使人手加。
// -----------------------------------------------------------------------------
import type { APIRoute } from 'astro';
import base from '../data/llms-base.txt?raw';
import { getPosts } from '../data/posts';
import { SITE_URL } from '../data/site';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const line = (p: Awaited<ReturnType<typeof getPosts>>[number]) => {
    const path = p.lang === 'en' ? `/en/insights/${p.slug}` : `/insights/${p.slug}`;
    const url = new URL(path, SITE_URL).href;
    return `- [${p.title}](${url})${p.excerpt ? `：${p.excerpt}` : ''}`;
  };
  const zh = posts.filter((p) => p.lang === 'zh').map(line);
  const en = posts.filter((p) => p.lang === 'en').map(line);
  let out = base.trimEnd() + '\n';
  if (zh.length || en.length) {
    out += '\n## 专栏文章 / Insights\n\n';
    if (zh.length) out += zh.join('\n') + '\n';
    if (en.length) out += (zh.length ? '\n' : '') + en.join('\n') + '\n';
  }
  return new Response(out, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
