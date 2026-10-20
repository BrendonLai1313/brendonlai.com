import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Brendon Hub「书」集合：每一本书 = 一条对外输出（视频 / 文章 / 短文）
const books = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/books' }),
  schema: z.object({
    // 标题（GEO：H2/H3 语义化标题）
    title: z.string(),
    titleEn: z.string().optional(),
    // 一句话摘要（50–80 字，自然语言，不做关键词堆砌）
    summary: z.string(),
    summaryEn: z.string().optional(),
    // 关键词（3–5 个，工业 / AI / 跨境相关）
    keywords: z.array(z.string()),
    keywordsEn: z.array(z.string()).optional(),
    // 发布日期（ISO 格式，机器可读）
    publishedAt: z.coerce.date(),
    // 内容类型：video = 视频 / article = 文章 / short = 短文·语音
    type: z.enum(['video', 'article', 'short']),
    // 所属书柜
    cabinet: z.enum(['corporate', 'published', 'future', 'methodology']),
    // 外链（只指向主权资产：YouTube 个人频道 / blog.brendonlai.com / 站内页）
    externalUrl: z.string(),
    // 封面缩略图（可选）
    image: z.string().optional(),
    // 所属实证项目（可选；刻意用 string 而非 enum，避免写错一个字就 build fail）
    project: z.string().optional(),
  }),
});

export const collections = { books };
