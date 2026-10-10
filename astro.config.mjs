import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://brendonlai.com',
  integrations: [sitemap()],
  // R4：原本獨立的 /manuals 已收編進 Brendon Hub 的「方法論手冊」櫃。
  // 舊連結永久導向 Hub（static 輸出會產生 meta-refresh + canonical 的轉址頁）。
  redirects: {
    '/manuals': '/hub',
    '/en/manuals': '/en/hub',
  },
  // 固定 dev 端口，避免多個 agent 開 server 時端口跳來跳去（4321 → 4322 → 4323…）
  server: {
    port: 4321,
  },
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      // 端口被佔用時直接報錯，而不是偷偷換 port
      strictPort: true,
    },
  },
});
