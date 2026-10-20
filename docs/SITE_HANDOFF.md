# brendonlai.com — 交接文件（給 Claude 的只讀盤點）

> **文件性質**：純資料盤點（read-only inventory）。產生過程中**沒有修改任何程式碼或內容**。
> **產生日期**：2026-10-20
> **盤點範圍**：`REF_Brendonlai.com_Content_Hub_底层架构/website_engine/`（真正在跑的主工程）
> **盤點方法**：靜態原始碼審查 + `package-lock.json` 解析 + `git log`。未做瀏覽器渲染 QA。
>
> **給 Claude 的一句話**：呢個站係 Astro 6 純靜態站，中英雙語用「兩份手抄頁面 + `isEn` 三元表達式」混合實現，部署係「GitHub Actions 雲端 build → rsync → VPS 上的 nginx 容器 → Traefik 反向代理」。**你有兩件事唔可以亂碰**：(1) `src/data/site.ts` 係全站唯一真理源；(2) VPS 上同一個 Traefik 仲有其他生產站（gai-store.com、hoff-industrial.com、n8n），任何改動都唔可以影響佢哋。詳見 §11。

---

## 目錄

- [§0 30 秒速覽](#0-30-秒速覽)
- [§1 主工程確認](#1-主工程確認)
- [§2 部署現況與 Git 狀態](#2-部署現況與-git-狀態)
- [§3 頁面清單（中英）](#3-頁面清單中英)
- [§4 Components 清單](#4-components-清單)
- [§5 資料層](#5-資料層完整原文)
- [§6 雙語機制](#6-雙語機制)
- [§7 樣式系統](#7-樣式系統)
- [§8 R1–R7 架構診斷後的實際狀態](#8-2026-09-23架構診斷報告之後做過嘅改動r1r7-實際狀態)
- [§9 程式碼看不見的事](#9-你所知但喺程式碼睇唔到嘅嘢)
- [§10 改版注意事項](#10-改版注意事項)
- [§11 VPS 風險警告（最高優先閱讀）](#11-vps-風險警告最高優先閱讀)

---

## §0 30 秒速覽

| 項目 | 事實 |
|---|---|
| 真正主工程 | `REF_Brendonlai.com_Content_Hub_底层架构/website_engine/` |
| 已廢棄 | 專案根目錄下的 `web/`（無 `.git`、只有 1 頁、6 個 component、冇 sitemap、冇 i18n） |
| 框架 | Astro **6.1.3**（static output） |
| 樣式 | Tailwind CSS **4.2.2**（via `@tailwindcss/vite`，CSS-first `@theme`，**冇** `tailwind.config.mjs`） |
| Node | `engines: ">=22.12.0"`；本機實測 **v22.16.0**、npm 10.9.4 |
| 頁面數 | 7 條路由 × 2 語言 = 14 個 `.astro` 檔（其中 `/hub/[slug]`、`/insights/[slug]` 為動態） |
| Components | 10 個（全部有在用，冇孤兒） |
| 上線狀態 | **已上線** `https://brendonlai.com`（Hostinger VPS + Docker nginx + Traefik + Let's Encrypt） |
| 部署方式 | `.github/workflows/deploy.yml`：push `main` → cloud build → `rsync --delete` 到 `/var/www/brendonlai.com/` |
| Git | branch `main`，working tree **乾淨**，**只有 6 個 commit**（唔夠 15 個） |
| 最大風險 | 同一個 Traefik 實例同時服務 gai-store / hoff-industrial / n8n —— 見 §11 |

---

## §1 主工程確認

### 1.1 結論

| 目錄 | 位置 | 狀態 | 判斷依據 |
|---|---|---|---|
| `website_engine/` | `REF_Brendonlai.com_Content_Hub_底层架构/website_engine/` | ✅ **唯一在跑、唯一會部署** | 有 `.git`；有 `.github/workflows/deploy.yml`；`astro.config.mjs` 有 `site` + `i18n` + `redirects`；14 個頁面；10 個 component；`dist/` 有產物 |
| `web/` | 專案根目錄下 `web/`（與 `REF_...` 同級） | ❌ **已廢棄，可以無視** | **冇 `.git`**；只有 1 個頁面 `src/pages/index.astro`；只有 6 個 component（含 Astro 範本殘留 `Welcome.astro`）；`package.json` **冇** `@astrojs/sitemap`；`astro.config.mjs` **冇** `site` / `i18n` / `redirects`；`tailwind.config.mjs` 存在（v4 唔會讀，屬舊版遺留）；有自己 `node_modules` 但唔屬任何 repo |

**驗證方法**（Claude 可自行覆核）：

```powershell
# 主工程：應該見到 .git 與 .github
Get-ChildItem -Force 'REF_Brendonlai.com_Content_Hub_底层架构\website_engine' | Select-Object Name
# 廢棄版：應該見唔到 .git
Get-ChildItem -Force 'web' | Select-Object Name
```

> **行動指引**：改版一律只改 `website_engine/`。`web/` 唔好刪（Brendon 未明確授權），但亦唔好參考——它的 component 名字（`Hero`、`Facets`、`Milestones`、`Contact`、`Header`）同名但內容係舊版，**照抄會退版**。

### 1.2 實際版本（以 `package-lock.json` 為準）

`package.json` 寫的是 caret range，**實際安裝版本**如下（解析自 `package-lock.json`，`lockfileVersion: 3`，共 372 個 package）：

| 套件 | `package.json` 宣告 | **實際鎖定版本** |
|---|---|---|
| `astro` | `^6.1.3` | **6.1.3** |
| `tailwindcss` | `^4.1.12` | **4.2.2** |
| `@tailwindcss/vite` | `^4.1.12` | **4.2.2** |
| `@tailwindcss/oxide` | （transitive） | **4.2.2** |
| `vite` | `overrides: ^7.1.10` | **7.3.1** |
| `@astrojs/sitemap` | `^3.7.4` | **3.7.4** |
| Node | `engines: >=22.12.0` | 本機 **v22.16.0**（npm 10.9.4） |

> ⚠️ 陷阱：`website_engine/node_modules/astro/` 裡面**只有 `dist/`，冇 `package.json`**。所以 `npm ls`、`node -p "require('astro/package.json').version"` 都會失敗（會回報 empty 或直接報錯）。要查版本，請睇 `package-lock.json` 的 `packages["node_modules/astro"].version`。呢個係本機 node_modules 不完整所致，**唔影響 CI**（CI 用 `npm ci` 重新安裝）。

`package.json` 全文：

```json
{
  "name": "web",
  "type": "module",
  "version": "0.0.1",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.7.4",
    "@tailwindcss/vite": "^4.1.12",
    "astro": "^6.1.3",
    "tailwindcss": "^4.1.12"
  },
  "overrides": { "vite": "^7.1.10" }
}
```

> `name` 仍然係 `"web"`（由 Astro 範本繼承，冇改過），**唔代表**佢係廢棄嘅 `web/`。分辨方法：睇路徑，唔好睇 `name`。

### 1.3 本地開發／建置

```powershell
# 前置：Node >= 22.12
cd 'REF_Brendonlai.com_Content_Hub_底层架构\website_engine'

npm ci          # 建議用 ci，確保同 CI 一致的鎖定版本
npm run dev     # http://localhost:4321 （astro.config.mjs 設了 strictPort: true，port 被佔用會直接失敗，不會自動換 port）
npm run build   # 產出到 ./dist/
npm run preview # 預覽 dist（亦是 4321）
```

**`astro.config.mjs` 全文**（913 bytes）：

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://brendonlai.com',
  integrations: [sitemap()],
  // R4：/manuals 已併入 Brendon Hub 的方法論櫃
  redirects: {
    '/manuals': '/hub',
    '/en/manuals': '/en/hub',
  },
  server: { port: 4321 },
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
    server: { strictPort: true },
  },
});
```

**`tsconfig.json`**：`extends: "astro/tsconfigs/strict"`（strict mode；`any` 用得比較多，見 §9）。

**Build 時的外部依賴**：`npm run build` 會**打真網絡**去 `https://blog.brendonlai.com/wp-json/wp/v2/posts`（見 §5.3）。如果 WordPress 掛了，build **不會失敗**，`/insights` 會渲染空狀態——這是刻意設計（graceful fallback）。

---

## §2 部署現況與 Git 狀態

### 2.1 有冇上線？去邊？

**已上線：`https://brendonlai.com`**（同時 `www.brendonlai.com` 由同一 Traefik router 處理）。

- 主機：**Hostinger VPS**，IP `<VPS IP：見 GitHub Secret VPS_HOST>`，hostname `<VPS hostname>`
- 靜態檔位置：`/var/www/brendonlai.com/`（約 2 MB，純 `dist/` 內容）
- 容器：`brendon-site`，image `nginx:alpine`，`restart: unless-stopped`
- 反向代理 + TLS：**Traefik v3.6.8**（容器 `n8n-traefik-1`），Let's Encrypt `TLS-ALPN-01`，resolver 名稱 `mytlschallenge`，自動續期
- Compose 專案放喺 VPS 的 `/docker/brendonlai/`

> 注意：`handoff/AI_HANDOFF_PROMPT.md` 仍然寫「線上首頁返回 Hostinger parked domain」——**已過時**。DNS 已改指 VPS，站已上線。

### 2.2 部署方式：GitHub Actions（唯一自動路徑）

**`.github/workflows/deploy.yml`**（1388 bytes）重點：

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:        # 可在 Actions 頁手動 Run workflow

concurrency:
  group: deploy-brendonlai
  cancel-in-progress: false

# steps（ubuntu-latest）
# 1. actions/checkout
# 2. actions/setup-node@v4  node-version: 22  cache: npm
# 3. npm ci
# 4. npm run build
# 5. 寫入 secrets.VPS_SSH_KEY 到 ~/.ssh/id_ed25519；ssh-keyscan -p $VPS_PORT
# 6. rsync -avzr --delete -e "ssh -p $VPS_PORT" dist/ "$VPS_USER@$VPS_HOST:/var/www/brendonlai.com/"
```

**Repository secrets（4 個）**：`VPS_HOST`、`VPS_PORT`、`VPS_USER`、`VPS_SSH_KEY`。

**關鍵事實**：

1. **VPS 上永遠唔會 build**。npm 只在 GitHub Actions 跑。所以改 `package.json` 依賴唔會即刻整死 VPS。
2. `rsync --delete` 的目標**只有** `/var/www/brendonlai.com/`。呢個 scope 係安全的（唔會掂到其他站）。
3. 部署完**唔需要重啟容器**：nginx 直接讀 bind mount 的檔案，且 mount 係 `:ro`。
4. **冇**任何手動上載流程、**冇** FTP、**冇** Hostinger `public_html`。`deploy/` 入面**只有** `docker-compose.yml` + `README.md`，冇部署腳本。

**`deploy/docker-compose.yml`**（1919 bytes）全文：

```yaml
services:
  brendon-site:
    image: nginx:alpine
    container_name: brendon-site
    restart: unless-stopped
    networks:
      - web
    volumes:
      - /var/www/brendonlai.com:/usr/share/nginx/html:ro
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=n8n_default"
      - "traefik.http.routers.brendon-http.rule=Host(`brendonlai.com`) || Host(`www.brendonlai.com`)"
      - "traefik.http.routers.brendon-http.entrypoints=web"
      - "traefik.http.routers.brendon-http.middlewares=brendon-https-redirect"
      - "traefik.http.middlewares.brendon-https-redirect.redirectscheme.scheme=https"
      - "traefik.http.routers.brendon-https.rule=Host(`brendonlai.com`) || Host(`www.brendonlai.com`)"
      - "traefik.http.routers.brendon-https.entrypoints=websecure"
      - "traefik.http.routers.brendon-https.tls=true"
      - "traefik.http.routers.brendon-https.tls.certresolver=mytlschallenge"
      - "traefik.http.services.brendon.loadbalancer.server.port=80"

networks:
  web:
    external: true
    name: n8n_default
```

> 檔案頂部原有警告註解（重點）：「⚠️ 唔可以喺主機層裝 nginx，會同 Traefik 撞 port 80/443。」「完全照抄 VPS 上 gai-site / his-site 嘅模式」。

### 2.3 Git 狀態

```text
branch : main
remote : https://github.com/BrendonLai1313/brendonlai.com
status : 乾淨（git status --short 無輸出）
總 commit 數 : 6
```

**最近 15 個 commit —— 實際只有 6 個**（`git rev-list --count HEAD` = 6），全部列出：

| # | Hash | 日期 | 訊息 |
|---|---|---|---|
| 1 | `38673d4` | 2026-10-14 | fix: Hero 翻卡点击仅限触控装置（桌面维持纯 hover） |
| 2 | `c0e4455` | 2026-10-13 | feat: Hero 翻卡支援手機點擊翻面（保留桌面 hover） |
| 3 | `8c1109d` | 2026-10-13 | chore: trigger deploy to verify VPS secrets |
| 4 | `110f295` | 2026-10-13 | 新增 VPS 自动部署：Docker + Traefik 容器设定、GitHub Actions workflow、部署说明 |
| 5 | `48e26e5` | 2026-10-10 | v1.1 上线整备：Hero/Milestones 换相、Logo 换装、转化出口文案与按钮、联络资料 |
| 6 | `059222c` | 2026-09-23 | v1.0 基线：中英双语个人品牌站（Astro + Tailwind + Brendon Hub 内容引擎） |

**判斷**：commit 訊息用**簡體中文**（第 5、6 個），之後轉為**繁體/混合**。呢個 repo 只有 ~1 個月歷史，**冇 branch 保護規則的記錄、冇 PR 流程**——歷史上全部直接 push `main`（每 push 一次就自動部署一次）。

---

## §3 頁面清單（中英）

### 3.0 路由總表

| 路由（zh） | 路由（en） | 檔案（zh） | 檔案（en） | 動態？ |
|---|---|---|---|---|
| `/` | `/en/` | `src/pages/index.astro` | `src/pages/en/index.astro` | 否 |
| `/about-brendon` | `/en/about-brendon` | `src/pages/about-brendon.astro` | `src/pages/en/about-brendon.astro` | 否 |
| `/hub` | `/en/hub` | `src/pages/hub/index.astro` | `src/pages/en/hub/index.astro` | 否 |
| `/hub/[slug]` | `/en/hub/[slug]` | `src/pages/hub/[slug].astro` | `src/pages/en/hub/[slug].astro` | 是（`books` collection，4 篇 → 4 URL） |
| `/insights` | `/en/insights` | `src/pages/insights/index.astro` | `src/pages/en/insights/index.astro` | 否（內容 build-time 抓 WP） |
| `/insights/[slug]` | `/en/insights/[slug]` | `src/pages/insights/[slug].astro` | `src/pages/en/insights/[slug].astro` | 是（WP posts） |
| `/projects` | `/en/projects` | `src/pages/projects.astro` | `src/pages/en/projects.astro` | 否 |
| `/manuals` → `/hub` | `/en/manuals` → `/en/hub` | （已刪除，只剩 redirect） | 同左 | — |

- 語言前綴規則：`prefixDefaultLocale: false` → 中文**無前綴**，英文 `/en` 前綴（首頁英文係 `/en/`，有尾斜線）。
- 全站只有 **5 個一級頁面**（首頁／關於／Hub／專欄／專案）+ 2 組動態內頁。呢個 5 頁地圖係刻意收斂的設計決策（見 §9）。
- 所有頁面都經 `src/layouts/Layout.astro` 包裹（Header + main + Footer 自動帶入），所以**每頁都會有 Header 與 Footer**，下面唔再重複列。

---

### 3.1 全站共用文案（Header / Footer）

**`src/components/Header.astro`**（3098 bytes）

| 位置 | 中文 | 英文 |
|---|---|---|
| Logo alt | `Brendon Lai 赖` | 同左 |
| 導覽 1 | `首页` | Home |
| 導覽 2 | `Brendon 是谁` | About |
| 導覽 3 | `Brendon Hub` | Brendon Hub |
| 導覽 4 | `在途项目` | Projects |
| 導覽 5 | `专栏` | Insights |
| 語言切換按鈕 | `EN`（在中文頁顯示） | `中文`（在英文頁顯示） |

> 注意：導覽第 4 項中文寫「**在途项目**」，但對應頁面 `/projects` 的 H1 是「矩阵档案柜」、`<title>` 是「矩阵档案柜 | Brendon Lai 的硬核阵地」。**命名唔一致**，係現存的小瑕疵。

**`src/components/Footer.astro`**（6349 bytes）

| 位置 | 中文 | 英文 |
|---|---|---|
| 定位語 | `帮中国工业落地东南亚的实战顾问。` | `A hands-on advisor helping Chinese industry land in Southeast Asia.` |
| 欄目標題 1 | `快速导航` | `Explore` |
| 欄目標題 2 | `与我连结` | `Connect` |
| 聯絡標籤 | `WhatsApp` / `微信` / `Email` | `WhatsApp` / `WeChat` / `Email` |
| 轉化入口小標（compact variant） | `三个转化入口` | `Three conversion entries` |
| 版權 | `版权所有。` | `All rights reserved.` |
| Slogan | `坚守真实，行善业。` | `Stay true. Do good.` |
| 無聯絡資料時的替代句 | `渠道資料整理中 —— 期間請直接由下方三個轉化入口找我。` | （同結構英文版） |

Footer 的導覽標籤與 Header **完全一致**（首頁／Brendon 是谁／Brendon Hub／在途项目／专栏）。

---

### 3.2 `/` 首頁（中文）

**檔案**：`src/pages/index.astro`（1023 bytes）
**Component 次序**：`Hero` → `ConversionEntries`（`variant="full"`）→ `Facets` → `Milestones` → `MatrixPreview` → `Contact`（+ Layout 內建 Header / Footer）

```
Hero → ConversionEntries(#conversion) → Facets(#facets) → Milestones(#milestones)
     → MatrixPreview(#matrix-preview) → Contact(#contact)
```

- **`<title>`**：`Brendon Lai | 帮中国工业落地东南亚的实战顾问 · 打怪升级之路`
- **meta description**：`赖先生 —— 帮中国工业落地东南亚的实战顾问。这里是我一人的内容枢纽：工业出海、AI 自动化与一人公司运营的实战输出。`
- **canonicalPath**：`/`　**mainClass**：`""`（空字串，唔覆寫預設）
- **額外 head**：`siteJsonLd('zh')` → `Person` + `WebSite` + `ProfilePage` 的 `@graph`（見 §5.4）

**頁面文案原文（按渲染次序）**

| 區塊 | 文案 |
|---|---|
| **Hero** badge | `坚守真实，贡献产业` |
| Hero h1 | `帮中国工业，` ／ `落地东南亚`（分兩行，第二行有手繪底線 SVG） |
| Hero tag 1 | `[ 商业: 工业品目录分销 ]` |
| Hero tag 2 | `[ 方法: AI 驱动 + 实测验证 ]` |
| Hero tag 3 | `[ 内核: 品质优先 + 长期主义 ]` |
| Hero p1 | `20 年欧洲 / 日本工业品目录分销实战。我公开自己从 0 到 1、用 AI 把一间跨境贸易公司做起来的过程——帮你进入东南亚市场，少走弯路。` |
| Hero p2 | `在这里，我也真实记录一个香港男孩如何带领家庭阶层升级、一路「打怪升级」的过程。` |
| Hero CTA 1 | `了解我能帮你做什么`（→ `#conversion`） |
| Hero CTA 2 | `看我的实战实录 →`（→ `/hub`） |
| Hero CTA 3 | `Brendon是谁`（→ `/about-brendon`） |
| Hero CTA 4 | `我的领英`（→ `SOCIAL.linkedin`，有值才渲染） |
| Hero 翻卡背面 1 | `实战顾问视角，聚焦制造业出海、增长与落地执行。` |
| Hero 翻卡背面 2 | `工作之外，也分享成长、家庭与坚持信念的自己。` |
| Hero 翻卡背面 3 | `真实生活切片，保留烟火气与长期主义的温度。` |
| **ConversionEntries** eyebrow | `小心规划，小步快跑` |
| ConversionEntries h2 | `三个今天就能帮你企业增值的专业领域` |
| ConversionEntries sub | `简单明了，一针见血 —— 按你现在的情况，挑一个走进去。` |
| 轉化卡 1（來自 `site.ts`） | `出海咨询` ／ `工业品出海东南亚的市场进入、渠道搭建与落地陪跑。` ／ `预约咨询` ／ `sea-leap.com` |
| 轉化卡 2 | `B2B 贸易平台` ／ `面向工业品采购的 B2B 交易与供应链对接平台。` ／ `进入平台` ／ `gai-store.com` |
| 轉化卡 3 | `马来西亚分销` ／ `马来西亚本地仓储、分销与售后，让产品真正落地。` ／ `查看分销` ／ `hoff-industrial.com` |
| **Facets** eyebrow | `HOME OVERVIEW` |
| Facets h2 | `核心身份与信任背书` |
| Facets sub | `我是一位爸爸、一位丈夫、也是一位企业顾问。比起头衔，更希望成为一个让人感到信任的人。` |
| Facets 卡標題 | `From Factory Floor to Regional Strategy`（**刻意保留英文**，中英頁都一樣） |
| Facets 卡正文 | `从中国工厂一线，到跨境贸易、电商平台、东南亚建厂，再到协助企业设计 1+1 全球化策略。一路实践后我更相信：长期主义与可执行，才是穿越周期的底层能力。` |
| Facets 連結 | `阅读完整人生故事`（→ `/about-brendon`） |
| Facets 數字 1 | `1500+` ／ `客户满意服务` |
| Facets 數字 2 | `5` ／ `不同国家工作经验` |
| Facets 數字 3 | `15` ／ `Years of experience`　← **BUG：中文頁漏翻譯，見 §9** |
| **Milestones** 小標 | `BRENDON HUB · 方法论手册` |
| Milestones h2 | `真正的答案，不在别人手上` |
| Milestones p1 | `我们在成长过程里，被灌输太多应该。忙着追赶别人版本的成功，却忘了最关键的问题：你真正想要什么。` |
| Milestones p2 | `与其执着每一步都完美，不如持续体验、反思、改进。你的人生说明书，应该由你自己书写。` |
| Milestones 按鈕 1 | `进入方法论手册`（→ `/hub`） |
| Milestones 按鈕 2 | `先看我的三幕故事`（→ `/about-brendon`） |
| **MatrixPreview** h2 | `子系统矩阵预览` + ` / MATRIX`（後綴固定英文） |
| MatrixPreview sub | `目前正在运行与测试的底层架构模块` |
| Matrix 卡 A | `NLM-新店子实验室` ／ `100% 代码掌控的 AI 自动化内容流水线。` ／ 狀態 `Phase 1 运行中` |
| Matrix 卡 B | `跨境贸易 AI 引擎` ／ `欧标设计 + 中国制造，AI 提速供应链管理。` ／ 狀態 `测试中` |
| Matrix 卡 C | `工具与内在修炼` ／ `Google Workspace 迁移与生物效率 SOP。` ／ 狀態 `稳定迭代` |
| **Contact** h2 | `寻找志同道合的你` |
| Contact 正文 | `如果你对企业出海、阶层跃升、或是 AI 自动化感兴趣；如果你也认同“坚守真实、行善业”的价值观，欢迎随时与我连结。` |
| Contact 按鈕 | `WhatsApp 交流` ／ `WeChat 合作` ／ `邮件联络` |
| Contact 彈窗 | `添加 WeChat` ／ `扫描下方二维码` ／ `或搜索微信号` ／ `微信二维码稍后将在此公布。` |
| Contact 底部 | `未来，这里将接入我的 AI 助理，为您提供全天候的自动化对接。` |
| Contact 無直接聯絡時的替代 | `挑一个符合你现况的出口` ／ `最快的入口，就是上面的三个出口。` |

---

### 3.3 `/en/` 首頁（英文）

**檔案**：`src/pages/en/index.astro`（998 bytes）
**Component 次序**：與中文**完全相同**（`Hero` → `ConversionEntries` → `Facets` → `Milestones` → `MatrixPreview` → `Contact`）

- **`<title>`**：`Brendon Lai | Helping Chinese industry land in Southeast Asia`
- **meta description**：`Brendon Lai — a hands-on advisor helping Chinese industry land in Southeast Asia: market entry, channel building and local distribution.`
- **canonicalPath**：`/`（同中文頁一樣傳 `/`，由 Layout 自動推導成 `/en/`）
- 英文文案全部寫在**同一個 component 的 `isEn ? {...} : {...}`** 的英文分支，唔在頁面檔內。

---

### 3.4 `/about-brendon` 關於（中文）

**檔案**：`src/pages/about-brendon.astro`（1365 bytes）
**Component 次序**：頁面自身 header `<section>` → `JourneyTimeline`（`id="journey-timeline"`）→ `Contact`

- **`<title>`**：`关于 Brendon | 三幕人生故事`
- **meta description**：`我是 Brendon Lai —— 爸爸、丈夫、企业顾问。这一页不是简历，而是我如何从现实走出来、再走向自己选择的人生版本的三幕故事。`
- **canonicalPath**：`/about-brendon`

| 位置 | 文案 |
|---|---|
| 小標 | `ABOUT BRENDON`（中英相同，固定英文） |
| H1 | `Life isn't about finding your place — it's choosing who you want to be.`（**中英頁都係英文**，刻意的品牌句） |
| 正文 | `我是 Brendon Lai，一位爸爸、一位丈夫、也是一位企业顾问。这一页不是简历，而是我如何从现实中走出来，再走向自己选择人生版本的三幕故事。` |
| CTA | `查看打怪升级明细路线图`（→ `#journey-timeline`） |
| **JourneyTimeline** eyebrow | `THE JOURNEY`（中英相同） |
| JourneyTimeline h2 | `打怪升级路线图` |
| JourneyTimeline desc | `每一个阶段都是一次破局与重生。点击展开不同的人生篇章，滑动查看我在各个 Milestone 获得的「装备」与「认知」。` |
| 每張卡的標籤 | `获得认知/装备：` |
| 拍立得角落 | `{year} 年鉴`，例：`1998 年鉴` |

> **JourneyTimeline 的階段內容全部來自 `src/data/journey.ts`**（4 個 phase、5 個 milestone），唔在 `.astro` 內。完整文案見 §5.2。呢個係全站唯一「真正資料驅動」的雙語區塊。

---

### 3.5 `/en/about-brendon` 關於（英文）

**檔案**：`src/pages/en/about-brendon.astro`（1374 bytes）
**Component 次序**：同中文

- **`<title>`**：`About Brendon | A three-act story`
- **meta description**：`I'm Brendon Lai — a father, a husband and a business advisor. This page isn't a résumé; it's the three-act story of how I walked out of reality and toward the version of life I chose.`
- 按鈕英文：`View the level-up roadmap`

---

### 3.6 `/hub` Brendon Hub 列表（中文）

**檔案**：`src/pages/hub/index.astro`（4963 bytes）
**Component 次序**：頁面自身 `<section>`（標題）→ 4 個 `<section>`（每櫃一個，空櫃自動唔渲染）→ `Contact`

- **`<title>`**：`Brendon Hub | 有料放送 · 一人公司运营实录`
- **meta description**：`Brendon Lai 的内容枢纽：持续输出关于工业出海、AI 自动化与一人公司运营的实战干货。`
- **canonicalPath**：`/hub`　**mainClass**：`pt-28 pb-16`

| 位置 | 文案 |
|---|---|
| Eyebrow | `BRENDON HUB` |
| H1 | `有料放送` |
| 副標 | `一人公司运营实录 · 持续输出工业出海、AI 自动化与创业实战的高价值内容。` |
| 櫃 1 標題 | `品牌实战`　meta：`过往替公司做的视频广告 · 建立专业背书` |
| 櫃 2 標題 | `内容输出`　meta：`已发布文章 / 帖子 · 沉淀思考` |
| 櫃 3 標題 | `个人 IP · 未来`　meta：`未来的个人 IP 视频 · 持续更新的主战场` |
| 櫃 4 標題 | `方法论手册`　meta：`反复使用的 SOP / 清单 · 干货` |
| 類型標籤 | `视频` / `文章` / `短文` |

> 櫃（cabinet）是**寫死在頁面檔**的陣列，唔在 `data/`。新增／改名櫃要改 **`content.config.ts` 的 enum + 兩個頁面檔**（中英各一），見 §10。

---

### 3.7 `/en/hub`（英文）

**檔案**：`src/pages/en/hub/index.astro`（4923 bytes）
**Component 次序**：同中文

- **`<title>`**：`Brendon Hub | Field notes from a one-person company`
- **meta description**：`Brendon Lai's content hub: field notes on industrial expansion, AI automation and one-person-company operations.`
- H1：`Field Notes`
- 副標：`The one-person-company operations log · high-value content on industrial expansion, AI automation and entrepreneurship.`
- 櫃名：`Brand campaigns` / `Published content` / `Personal IP · Future` / `Methodology`
- 類型：`Video` / `Article` / `Short`

> ⚠️ 呢個檔案係**照抄中文版再改字串**的產物：它仍然用 `const isEn = Astro.currentLocale === 'en'` 加 `isEn ? [...] : [...]`，所以檔案內同時存在**永遠唔會執行到的中文分支**（同中文版一字不差）。呢個係「雙語漂移」的根源，見 §6。

---

### 3.8 `/hub/[slug]` 內容內頁（中文）

**檔案**：`src/pages/hub/[slug].astro`（3565 bytes）
**Component 次序**：`<article>`（返回連結 → 類型/日期 → H1 → 作者行 → 摘要 → `<Content />` → keywords → 外部 CTA）→ `Contact`

- **`<title>`**：`{title} | Brendon Hub`（動態）
- **meta description**：`{summary}`（動態，取 frontmatter `summary`）
- **canonicalPath**：`/hub/${slug}`　**ogType**：`video.other`（type=video）或 `article`
- **額外 head**：JSON-LD，`@type` = `VideoObject` 或 `Article`

| 位置 | 文案 |
|---|---|
| 返回 | `返回 Brendon Hub` |
| 作者標籤 | `作者`：**Brendon Lai** · `中国工业企业进入东南亚实战顾问` |
| 外部 CTA | `前往完整内容` |
| 缺失時 | `Astro.redirect('/hub')` |

**4 篇的標題（中文）**：見 §5.5。

---

### 3.9 `/en/hub/[slug]`（英文）

**檔案**：`src/pages/en/hub/[slug].astro`（3608 bytes）
同中文版結構。英文標籤：`Back to Brendon Hub` / `Author` / `View full content` / 職銜 `Hands-on advisor helping Chinese industry enter Southeast Asia`。
`<title>` 仍然是 `{titleEn} | Brendon Hub`（**後綴冇翻譯**）。

---

### 3.10 `/insights` 專欄列表（中文）

**檔案**：`src/pages/insights/index.astro`（3996 bytes）
**Component 次序**：頁面 header `<section>` → 卡片 grid（或空狀態）→ 「前往博客」→ `Contact`

- **`<title>`**：`专栏文章 | Brendon Lai · 工业出海与一人公司实战`
- **meta description**：`Brendon Lai 的专栏：持续输出工业品出海东南亚、AI 自动化与一人公司运营的实战思考。`
- **canonicalPath**：`/insights`

| 位置 | 文案 |
|---|---|
| Eyebrow | `BRENDON COLUMN` |
| H1 | `专栏文章` |
| 副標 | `来自博客的实战思考 —— 工业出海、AI 自动化与一人公司运营。` |
| 卡片連結 | `阅读全文` |
| 底部 | `前往博客看全部文章` |
| 空狀態 | `文章正在整理中，欢迎先前往博客浏览最新内容。` |

> ⚠️ 檔案內 `const isEn = false;` —— **硬編碼**。呢頁係刻意只有中文（見 §9）。

---

### 3.11 `/en/insights`（英文）

**檔案**：`src/pages/en/insights/index.astro`（4161 bytes）

- **`<title>`**：`Insights | Brendon Lai — Industrial expansion & one-person company`
- **meta description**：`Brendon Lai's column: field notes on industrial expansion into Southeast Asia, AI automation and running a one-person company.`
- 標籤：`Insights` / `Read more` / `See all posts on the blog` / 空狀態 `Articles are being organised — head to the blog for the latest in the meantime.`
- ⚠️ 呢個檔案 `const isEn = true;`（硬編碼，同中文版相反）

> **重要**：`/en/insights` 的**文章內容本身仍然是中文**——`posts.ts` 只抓 WordPress，冇英文欄位。所以英文讀者會見到中文標題與中文正文。呢個係已知限制（見 §9）。

---

### 3.12 `/insights/[slug]` 文章內頁（中文）

**檔案**：`src/pages/insights/[slug].astro`（5543 bytes）
**Component 次序**：`<article>`（返回 → 標題 → meta → 作者 → 正文 `set:html` → 原文出處 → 更多文章）→ `Contact`

- **`<title>`**：`{post.title} | Brendon Lai 专栏`
- **meta description**：`{post.excerpt}`
- **canonicalPath**：`/insights/${post.slug}`　**ogType**：`article`

| 位置 | 文案 |
|---|---|
| 返回 | `返回专栏` |
| 原文出處 | `原文出处`（連到 `post.link`） |
| 作者 | `作者`：Brendon Lai · `中国工业企业进入东南亚实战顾问` |
| 更多 | `更多文章` |
| 正文缺失 | `本文正文暂未同步，请前往原文阅读。` |

- JSON-LD：`Article` + `datePublished` / `dateModified` / `author.url` = `https://brendonlai.com/about-brendon` / `publisher` = Person / `isBasedOn: post.link` / `inLanguage: 'zh-CN'`
- 內含一段**大型 `is:global` CSS**，專門處理 Google Docs 貼過來的 HTML（h2/h3、ul/ol、blockquote、img、table、pre），改版時**唔好刪**。

---

### 3.13 `/en/insights/[slug]`（英文）

**檔案**：`src/pages/en/insights/[slug].astro`（5631 bytes）
`<title>`：`{post.title} | Brendon Lai 专栏`（**注意：仍然係中文後綴，冇改成英文**）。標籤：`Back to Insights` / `Original post` / `Author` / `More posts`。
正文仍然係中文（同 §3.11 的限制）。

---

### 3.14 `/projects` 專案（中文）

**檔案**：`src/pages/projects.astro`（11806 bytes）　← **單一最大的頁面檔**
**Component 次序**：頁面 H1 block → `Lab` → `<article>` #1（`FILE_ID: CROSS_BORDER_AI`）→ `<article>` #2（`FILE_ID: BIO_HACKING`）→ `Contact`

- **`<title>`**：`矩阵档案柜 | Brendon Lai 的硬核阵地`
- **meta description**：`系统级思维的幕后解剖：跨境贸易 AI 引擎、Google Workspace 迁移与生物效率 SOP 的实战拆解，水面之下是代码与资源。`
- **canonicalPath**：`/projects`　**bodyClass**：`file-cabinet-bg text-hk-text`　**mainClass**：`pt-32 pb-20 px-6 max-w-5xl mx-auto min-h-screen`
- **內嵌 `is:global` style**：`body { background-color: #Fdfbf7; color: #333333; }` + `.file-cabinet-bg` 40px 橙紅網格紋

| 位置 | 文案 |
|---|---|
| H1 | `#` `矩阵档案柜` |
| 副標 | `系统级思维的幕后解剖。水面之上是架构与逻辑，水面之下是代码与资源。` |
| **Lab** h2 | `我是如何用 AI 重构这一切的` |
| Lab 正文 | `告别平台绑架，100% 代码掌控。Astro 门面 + n8n 自动化流水线实录。` |
| Lab Phase 1 | `Phase 1: 静态重构` ／ `Astro 极速门面部署 (Completed)` |
| Lab Phase 2 | `Phase 2: 自动化引擎` ／ `n8n -> WordPress 图文流水线测试中 (In Progress)` |
| Lab Phase 3 | `Phase 3: AI 赋能` ／ `个人知识库与智能客服接入 (Planning)` |
| Lab CTA | `解锁 NLM 底层 n8n JSON 代码与 SOP 📝` |
| Lab CTA 註 | `核心代码与供应链资源仅对同频者开放，填写申请单自动获取。` |
| Lab 終端機視窗標題 | `NLM_Architecture.sh` |
| Lab 狀態燈 | `System Phase 1: Online` |
| **檔案 02** 標籤 | `FILE_ID: CROSS_BORDER_AI` |
| 檔案 02 標題 | `跨境贸易 AI 引擎` |
| 檔案 02 副標 | `欧标设计 + 中国制造，AI 提速供应链` |
| 檔案 02 小節 | `商业痛点与 ROI 预期`：`Why:` 传统外贸询盘处理低效，跨文化沟通与供应链筛选成本极高。`What (ROI):` 打造 AI 询盘过滤与报价系统，精准识别高意向客户，缩短 50% 沟通周期。 |
| 檔案 02 Tech Stack | `LLM Prompts` / `CRM 整合` / `数据清洗脚本` |
| 檔案 02 進度 | `Build in Public 进度日志`：`[测试中] 欧美市场询盘语气情感分析模型微调。` |
| 檔案 02 鎖定區 | `RESTRICTED ACCESS` ／ `水面之下的硬核资源已锁定` |
| 檔案 02 CTA | `获取 AI 跨境询盘过滤 Prompt 📝` |
| 檔案 02 CTA 註 | `供应链资源与核心话术库仅对同频者开放，填写申请单自动获取。` |
| **檔案 03** 標籤 | `FILE_ID: BIO_HACKING` |
| 檔案 03 標題 | `工具与内在修炼` |
| 檔案 03 副標 | `Google Workspace 迁移与生物效率 SOP` |
| 檔案 03 小節 | `商业痛点与 ROI 预期`：`Why:` 资讯过载导致注意力涣散，工作与家庭边界模糊。`What (ROI):` 建立数位极简主义系统与冥想觉察习惯，恢复深度工作能力，提升决策质量。 |
| 檔案 03 Tech Stack | `Google Workspace` / `GTD 方法论` / `Vipassana (内观)` |
| 檔案 03 進度 | `Build in Public 进度日志`：`[完成] 全面迁移至 Google Workspace，构建单一真理源 (SSOT)。` |
| 檔案 03 鎖定區 | `RESTRICTED ACCESS` ／ `水面之下的硬核资源已锁定` |
| 檔案 03 CTA | `解锁个人效能管理 SOP 笔记 📝` |
| 檔案 03 CTA 註 | `高浓度生物黑客经验与习惯养成指南仅对同频者开放，填写申请单自动获取。` |

**兩個 article 的 CTA 連結邏輯**（中英共用）：

```ts
const formHref = FORMS.resourceRequest || (isEn ? '/en/#conversion' : '/#conversion');
const formExternal = Boolean(FORMS.resourceRequest);
// 目前 FORMS.resourceRequest === '' → 全部指向 /#conversion（首頁轉化區）
```

> 呢頁的兩個案例係**硬編碼在 `.astro` 裡**，唔在 `data/`、唔在 content collection。所以要改成「三個案例」，最直接的做法係抽成陣列（見 §10b）。

---

### 3.15 `/en/projects`（英文）

**檔案**：`src/pages/en/projects.astro`（11337 bytes）
同中文版結構（同樣兩個硬編碼 article）。

- **`<title>`**：`File Cabinet | Brendon Lai's hardcore HQ`
- **meta description**：`The behind-the-scenes anatomy of systems thinking: a cross-border trade AI engine, Google Workspace migration and bio-efficiency SOPs — code and resources below the surface.`
- H1：`# File Cabinet`　副標：`The behind-the-scenes anatomy of systems thinking. Above the surface: architecture and logic. Below: code and resources.`

---

## §4 Components 清單

全部 10 個 component 都在 `src/components/`。**冇任何孤兒 component**（2026-09-23 診斷報告指出的 `Facets` 未接入、`Welcome.astro` 殘留，兩者都已在 R6 處理：`Facets` 已接回首頁；`Welcome.astro` 已刪）。

| # | 檔案 | 大小 | 用途 | Props | 文案位置 | 使用頁面 |
|---|---|---|---|---|---|---|
| 1 | `Header.astro` | 3098 B | 固定頂欄：Logo、5 項導覽、語言切換、手機漢堡選單（JS toggle） | **無 props**（全部靠 `Astro.currentLocale`） | **Component 內**（`nav` 陣列、`altLabel`） | 全部頁面（由 `Layout.astro` 掛載） |
| 2 | `Footer.astro` | 6349 B | 頁尾：定位語、快速導覽、`ConversionEntries variant="compact"`、聯絡方式（空值自動隱藏）、版權 + slogan | **無 props** | Component 內（`t`）+ `data/site.ts`（`CONTACT` / `SOCIAL` / `CONVERSION_ENTRIES`） | 全部頁面（由 `Layout.astro` 掛載） |
| 3 | `Hero.astro` | 12091 B | 首屏：定位 badge、H1、3 個霓虹標籤、兩段自我介紹、4 個 CTA、右側 3 張可翻面照片卡 | **無 props** | Component 內（`t`，中英各一份）；連結讀 `data/site.ts` 的 `SOCIAL.linkedin` | `/`、`/en/` |
| 4 | `ConversionEntries.astro` | 4088 B | **R1 轉化收口層**：三個轉化入口（sea-leap / gai-store / hoff-industrial） | `variant?: 'full' \| 'compact'`（預設 `full`） | 標題文案在 Component 內（`t`）；**卡片內容 100% 來自 `data/site.ts`** | `full`：`/`、`/en/`；`compact`：Footer（即全站） |
| 5 | `Facets.astro` | 3317 B | 核心身份 + 信任背書（1500+ / 5 / 15 三個數字） | **無 props** | Component 內（`t`） | `/`、`/en/` |
| 6 | `Milestones.astro` | 2422 B | 深色 CTA 卡：引導去 Brendon Hub 的方法論櫃 + 三幕故事 | **無 props** | Component 內（`t`） | `/`、`/en/` |
| 7 | `MatrixPreview.astro` | 5942 B | Bento grid 預覽三個子系統，全部連去 `/projects` | **無 props** | Component 內（`t`） | `/`、`/en/` |
| 8 | `Contact.astro` | 7705 B | 深色聯絡區：WhatsApp / WeChat（含 QR 彈窗）/ Email；全部空值時退回 `#conversion`；底部 AI 助理預告 | **無 props** | Component 內（`t`）+ `data/site.ts`（`CONTACT`） | **全部 7 個頁面** |
| 9 | `Lab.astro` | 11882 B | 復古終端機視窗：`NLM_Architecture.sh`、Astro → n8n → WP 資料流圖、3 個 phase、解鎖 CTA | **無 props** | Component 內（`t`）+ `data/site.ts`（`FORMS.resourceRequest`） | `/projects`、`/en/projects` |
| 10 | `JourneyTimeline.astro` | 8966 B | 人生時間軸：4 個可摺疊 phase、5 個 milestone、polaroid hover 圖、accordion JS | **無 props** | **`data/journey.ts`**（`journeyPhases` + `journeyCopy`）—— Component 內**零文案**` | `/about-brendon`、`/en/about-brendon` |

### 4.1 各 component 的實作要點（改版時容易踩雷）

**`Header.astro`**
- `lp()` helper：`'/' → isEn ? '/en/' : '/'`，其餘 `isEn ? '/en'+path : path`
- 語言切換用 `Astro.url.pathname` 做 `^\/en(?=\/|$)` 剝除 → **新增任何新頁面都會自動獲得正確的語言切換**，唔需要改
- 手機選單 JS 直接 `querySelector` + `classList.toggle('hidden')`，冇 null check 之外的防禦

**`Footer.astro`**
- 5 個職責寫在檔案頂部註解：定位語／快速導覽／R1 compact 轉化層／聯絡方式／版權
- `contactLinks`、`socialLinks` 都是「array with falsy filter」，`CONTACT.wechatId` 存在時 href 是 `#contact`（scroll 去頁尾自己的 Contact 區）
- **`ConversionEntries` 係 import 進來的，Footer 內沒有重複寫三個域名**

**`Hero.astro`**
- 三張卡：`/hero-work-hands.jpg`、`/hero-real-me.jpg`、`/hero-life-2.jpg`；hover 翻面
- **觸控裝置額外支援點擊翻面**（2026-10-14 最新 commit）：
  ```js
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) { /* 加 role="button" tabindex="0" aria-pressed，click 切換 .is-flipped，Enter/Space 可操作 */ }
  ```
  配 `<style is:global>.flip-card-inner.is-flipped { transform: rotateY(180deg) !important; }</style>`
- 兩個 R 標記：`{/* R2：改為連結到 ABOUT BRENDON 頁 */}`、`{/* R6：領英按鈕取代原本的圖示 */}`
- LinkedIn 按鈕係條件渲染（`SOCIAL.linkedin &&`）

**`ConversionEntries.astro`**
- 頂部註解講明：呢個係全站**唯一**渲染三個轉化出口的地方，改 `site.ts` 兩處版位同步
- `full` 版**自己就是 `<section id="conversion">`** —— 所以 `#conversion` 錨點只存在於首頁

**`Facets.astro`**
- 頂部註解：`// 首頁「核心身份與信任背書」區塊（原本是孤兒元件，R6 接回首頁）`
- `lp()` helper 與 Header 相同（重複實作）

**`Milestones.astro`**
- 圖片 `milestoneImage = '/field-industrial.jpg'`（public 內，101 KB）

**`MatrixPreview.astro`**
- 3 張卡**全部** `href={projectsUrl}` —— 即係三個唔同子系統都帶去同一頁，冇 deep link

**`Contact.astro`**
- `hasWa` = WhatsApp 數字長度 > 0；`hasWechat` = `wechatId || wechatQr`；`hasEmail`
- `!hasAnyDirect` → 顯示「挑一个符合你现况的出口」→ `#conversion`
- WeChat 彈窗：有 QR 就 `<img>`，冇就顯示 `qrPending` 文字；JS 有 null check
- **唔會**出現 `href="#"`

**`Lab.astro`**
- 3 節點資料流圖純 CSS/HTML，`1. Astro UI / Static Frontend` → `2. n8n / Automation Hub` → `3. WordPress …`
- 有 `@keyframes shimmer` 與假 log 行

**`JourneyTimeline.astro`**
- `const phases = journeyPhases[lang]; const t = journeyCopy[lang];`
- 4 個 phase 預設**全部收合**（`accordion-content hidden`），accordion JS 會「開一個時自動收其他」
- 桌面 hover 出現 polaroid（`group-hover`，`-rotate-6` ↔ `rotate-6`）；手機則直接在卡片下方顯示一張 static polaroid
- 里程碑左右交錯由 `align: 'left' | 'right'` 控制

### 4.2 已刪除／不再存在的 component

| 名稱 | 狀態 |
|---|---|
| `Welcome.astro` | Astro 範本殘留，**已在 R6 刪除**（`web/` 舊資料夾內仍有一份，唔要參考） |
| `src/assets/astro.svg`、`src/assets/background.svg` | 仍然存在但**冇任何 import**（無害的死檔案） |

---

## §5 資料層（完整原文）

### 5.0 一覽

`website_engine/src/data/` 只有 **4 個檔案**，全部是純 TypeScript 常數／函式，**冇任何 runtime DB、冇 API route、冇 CMS**。內容只有兩個來源：**呢 4 個 .ts 檔**，同埋 **`src/content/books/*.md` 的 frontmatter**（另有 `posts.ts` 喺 **build 時**去 WordPress REST API 抓文）。

| 檔案 | 行數 | 角色 | 邊啲地方 import |
|---|---|---|---|
| `src/data/site.ts` | 87 | **SSOT**：域名、三個轉化入口、聯絡方式、社群、表單 | `Layout.astro`、`schema.ts`、`Header`、`Footer`、`Hero`、`ConversionEntries`、`Contact`、`Lab`、`projects.astro`、`hub/[slug].astro` |
| `src/data/schema.ts` | 91 | JSON-LD（Person / WebSite / ProfilePage） | 各頁 `siteSchema` prop |
| `src/data/journey.ts` | 142 | R7 抽出：人生時間軸的**中英雙語**資料 | 只有 `JourneyTimeline.astro` |
| `src/data/posts.ts` | 135 | R3：WordPress REST 抓文 + 淨化 + 快取 | `insights/index.astro`、`insights/[slug].astro`（中英各一） |
| `src/content.config.ts` | 30 | Content Collection schema（books） | Astro 自動載入 |

> ⚠️ **`site.ts` 係全站唯一真理源。** 改任何「WhatsApp / 微信 / Email / 三個轉化入口網址 / LinkedIn」都只應該改呢一個檔，**唔好去 component 內硬編碼**。Claude 改版時最容易犯的錯，就係喺新 component 直接寫死 `https://gai-store.com` —— 咁樣日後換域名要改十個地方。

---

### 5.1 `src/data/site.ts`（全文）

```ts
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
  key: 'sea-leap' | 'gai-store' | 'hoff-industrial';
  url: string;
  icon: string; // FontAwesome class
  brand: string; // 對外顯示的域名
  name: { zh: string; en: string };
  desc: { zh: string; en: string };
  cta: { zh: string; en: string };
}

// PLAN §1 的三個轉化收口入口（與 public/llms.txt 完全一致）
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
  {
    key: 'hoff-industrial',
    url: 'https://hoff-industrial.com',
    icon: 'fa-industry',
    brand: 'hoff-industrial.com',
    name: { zh: '马来西亚分销', en: 'Malaysia distribution' },
    desc: {
      zh: '马来西亚本地仓储、分销与售后，让产品真正落地。',
      en: 'Local warehousing, distribution and after-sales in Malaysia — so products actually land.',
    },
    cta: { zh: '查看分销', en: 'See distribution' },
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
};

export const FORMS = {
  // TODO: 填入真實 Google Form 連結（解鎖資源用）。
  //       留空 → 資源解鎖按鈕改為引導至站內轉化入口（#conversion）。
  resourceRequest: '',
};
```

**要留意的 4 件事：**

1. `whatsapp: '8615017959223'` 係**中國號碼**（+86 150 1795 9223），唔係香港號碼。改號碼時記得保留「無 `+`、無空格」格式。
2. `wechatQr: ''` 一直未填 → WeChat 按鈕點落去係**純文字提示**，冇 QR 圖。呢個係 Brendon 已知的待辦。
3. `FORMS.resourceRequest: ''` 一直未填 → `/projects` 每個案例的「解鎖資源」CTA 會 fallback 去 `#conversion`（見 §3.14）。
4. `SOCIAL.instagram` / `twitter` 留空 → 元件唔會渲染該圖示，呢個係**故意設計**，唔係 bug，唔好「順手加返 `href="#"`」。

---

### 5.2 `src/data/schema.ts`（全文）

```ts
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
```

**注意：** 全站每一個頁面（包括 `/projects`、`/hub/[slug]`）都會輸出 **`ProfilePage`** 這一個 `@graph`，因為各頁都係傳 `siteSchema={siteJsonLd(...)}`。`hub/[slug].astro` 另外再插一個 `VideoObject` / `Article` 的獨立 `<script>`。改版時若新增頁面而唔記得傳 `siteSchema`，該頁就冇 Person 標記（GEO 分數會跌）。

---

### 5.3 `src/data/journey.ts`（全文，R7 產物）

```ts
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
```

**重要觀察：**

- 中文版 `yearRange: '2020 - 至今'`，英文版係 `'2020 - present'` —— 分開兩處，唔會自動同步。
- 中文用**簡體**（`儿童与少年阶段`），但網站其他位置用**繁體**（`專欄文章`）。呢個係歷史遺留，Brendon 未統一。
- `image` 全部係 `/hero-life.jpg`、`/hero-main.jpg`、`/hero-work.jpg` 三張舊圖，**唔係** `Selected Photo/_web_ready/` 那批新圖。想換相要改呢 8 個 `image:` 值（zh + en 各 4）。

---

### 5.4 `src/data/posts.ts`（全文，R3 產物）

```ts
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
      .filter((p) => p && p.slug && p.id)
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
```

**⚠️ 部署風險（同 §11 有關）：** 呢個檔會在 **`npm run build` 的時候**發一個 HTTP request 去 `https://blog.brendonlai.com/wp-json/wp/v2/posts`。所以：

- 如果 blog 掛咗／被 firewall 擋住，**build 唔會 fail**（有 `catch` 回 `[]`），但 `/insights` 會變成「文章正在整理中」的 fallback，而且**整個 `/insights/[slug]` 頁集會消失**（`getStaticPaths` 回空 array）。
- Build 機（**GitHub Actions 的 runner**）必須能出外網訪問該域名；**唔係由 VPS 出網**。
- 想改走本地／另一個 WP 域名，用環境變數 `PUBLIC_WORDPRESS_URL`（GitHub Actions 內未設定，所以現時硬食 `https://blog.brendonlai.com`）。

---

### 5.5 `src/content.config.ts`（全文）

```ts
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
  }),
});

export const collections = { books };
```

**Schema 重點：**

| 欄位 | 必填？ | 型別 | 說明 |
|---|---|---|---|
| `title` | ✅ | string | 中文標題（GEO 用 H2/H3） |
| `titleEn` | ❌ | string | 英文標題，**缺咗會 fallback 顯示中文** |
| `summary` | ✅ | string | 一句話摘要 50–80 字 |
| `summaryEn` | ❌ | string | 同上，英文 |
| `keywords` | ✅ | string[] | 3–5 個 |
| `keywordsEn` | ❌ | string[] | 同上，英文 |
| `publishedAt` | ✅ | `z.coerce.date()` | `2026-04-05` 這種寫法即可（會 coerce 成 Date） |
| `type` | ✅ | `'video' \| 'article' \| 'short'` | 決定 `hub/[slug]` 的 JSON-LD 係 `VideoObject` 定 `Article` |
| `cabinet` | ✅ | `'corporate' \| 'published' \| 'future' \| 'methodology'` | 對應 4 個書櫃，**字串必須完全吻合** |
| `externalUrl` | ✅ | string | 必填但**冇 URL 格式驗證**（寫錯都 build 得過） |
| `image` | ❌ | string | 封面縮圖，**現時 4 本書全部冇用** |

> 注意：`cabinet` 係 **enum**，唔係自由字串。`cabinet: 'methodology'` 打錯成 `'method'` → **build 直接 fail**。呢點同 §10(c) 加 `project` 欄位有關（新欄位必須 `optional()`，否則 4 篇現有 md 全部 fail）。

---

### 5.6 `src/content/books/` 四篇 frontmatter（全文）

現時 **只有 4 篇**，分佈於 4 個書櫃，每個書櫃 1 篇：

| 檔案 | 書櫃 | type | 發佈日 | externalUrl |
|---|---|---|---|---|
| `bb20260405-01-enlightenment.md` | `published` | `article` | 2026-04-05 | `blog.brendonlai.com/...inner-yield-rate/` |
| `cross-border-supply-chain-ad.md` | `corporate` | `video` | 2023-08-15 | `youtube.com/@brendonlai` |
| `one-person-company-lesson-1.md` | `future` | `video` | 2026-09-01 | `youtube.com/@brendonlai` |
| `sea-expansion-sop.md` | `methodology` | `short` | 2026-05-20 | `blog.brendonlai.com/sea-expansion-sop` |

#### (1) `bb20260405-01-enlightenment.md`

```yaml
---
title: "觉悟的工业工程学：我如何用 Google 生态自动化我的「内在良率」"
titleEn: "The industrial engineering of enlightenment: automating my inner yield rate with the Google ecosystem"
summary: "把佛法的「戒、定、慧」映射到工业工程的「捕获、隔离、提炼」，用 Google 生态打造个人的数字化道场。"
summaryEn: "Mapping Buddhism's precepts, concentration and wisdom onto industrial engineering's capture, isolate and refine — building a personal digital dojo with the Google ecosystem."
keywords: ["工业工程", "AI 自动化", "Google 生态", "心性修炼"]
keywordsEn: ["industrial engineering", "AI automation", "Google ecosystem", "inner practice"]
publishedAt: 2026-04-05
type: "article"
cabinet: "published"
externalUrl: "https://blog.brendonlai.com/the-industrial-engineering-of-enlightenment-how-i-use-google-ecosystem-to-automate-my-inner-yield-rate/"
---
```

正文（會喺 `/hub/bb20260405-01-enlightenment` 渲染）：

```
站在槟城冲压厂车间，我亲眼看着一条机械臂停下、闪起红灯，产线主管用三分钟完成诊断、隔离、重启。那一刻我意识到：我们的大脑，为什么不能用同一套 SOP 来对待？

这篇文章把「戒、定、慧」映射到工业工程的「捕获、隔离、提炼」，用 Google Chat、Google Tasks、Google Form 三层架构，把情绪变成可复盘的数据。全文在 blog.brendonlai.com。
```

#### (2) `cross-border-supply-chain-ad.md`

```yaml
---
title: "跨境供应链广告片"
titleEn: "Cross-border supply chain brand film"
summary: "过往替企业制作的跨境供应链品牌广告，示范工业品如何用视觉讲清「欧标设计 + 中国制造」。"
summaryEn: "A cross-border supply chain brand ad I produced for a client, showing how industrial products can visually communicate 'European design + Chinese manufacturing'."
keywords: ["跨境供应链", "品牌广告", "工业品", "视频"]
keywordsEn: ["cross-border supply chain", "brand ad", "industrial goods", "video"]
publishedAt: 2023-08-15
type: "video"
cabinet: "corporate"
externalUrl: "https://www.youtube.com/@brendonlai"
---
```

正文：

```
为跨境供应链企业制作的品牌广告片，把「欧标设计 + 中国制造」的价值主张用一段 30 秒的视觉讲清楚。这是我在企业端积累的实战作品之一。
```

#### (3) `one-person-company-lesson-1.md`

```yaml
---
title: "一人公司第一课：为什么要出海"
titleEn: "One-Person Company, Lesson 1: Why go overseas"
summary: "记录我从 0 到 1 用 AI 驱动一间合资公司转亏为盈、并公开做过程的第一集。"
summaryEn: "Episode one of documenting how I used AI to turn a joint venture from loss to profit — from 0 to 1, in public."
keywords: ["一人公司", "AI 驱动", "出海", "创业实录"]
keywordsEn: ["one-person company", "AI-driven", "go global", "founder journal"]
publishedAt: 2026-09-01
type: "video"
cabinet: "future"
externalUrl: "https://www.youtube.com/@brendonlai"
---
```

正文：

```
「一人公司营运实录」系列的第一集：为什么一个 47 岁的工业老手，拒绝回中国打工，选择用 AI + 内容重新创业。这里公开我做这个过程——问题才是主角，我只是载体。
```

#### (4) `sea-expansion-sop.md`

```yaml
---
title: "东南亚拓荒 SOP：从工厂现场到区域策略"
titleEn: "Southeast Asia expansion SOP: from factory floor to regional strategy"
summary: "把跨文化、跨地域的制造管理经验，沉淀成一套可复制的「降维打击」落地清单。"
summaryEn: "Distilling cross-cultural, cross-region manufacturing experience into a replicable 'outmaneuver' execution checklist."
keywords: ["东南亚", "制造业", "跨境", "SOP", "管理"]
keywordsEn: ["Southeast Asia", "manufacturing", "cross-border", "SOP", "management"]
publishedAt: 2026-05-20
type: "short"
cabinet: "methodology"
externalUrl: "https://blog.brendonlai.com/sea-expansion-sop"
---
```

正文：

```
被派往星马泰印尼，面对截然不同的文化与供应链挑战，我把工厂现场到区域策略的每一步，提炼成可复制的 SOP 清单。适合正在考虑进入东南亚市场的工业 SME 老板。
```

**四篇都是簡體中文正文 + 英文 frontmatter。** `/en/hub/[slug]` 會顯示英文 title/summary，但**正文仍然是簡體中文**（因為 markdown body 只有一份，冇 `bodyEn` 欄位）。呢個係雙語系統最大的結構性限制，見 §6.4。

---

## §6 雙語機制

### 6.1 一句話總結

**冇 i18n 字典檔、冇翻譯抽換層。** 中英同步靠 **三種手動機制並存**：

| # | 機制 | 出現位置 | 誰要手動維護 |
|---|---|---|---|
| ① | **兩個獨立頁面檔**（`src/pages/x.astro` + `src/pages/en/x.astro`） | 全部 7 個路由 | 整頁複製，改字 |
| ② | **同一個檔內的 `isEn ? {} : {}` 三元式** | `Header`、`Footer`、`Hero`、`Facets`、`Milestones`、`MatrixPreview`、`Contact`、`Lab`、`ConversionEntries`、`hub/index.astro` | 改 zh 分支就要順手改 en 分支 |
| ③ | **`Record<Lang, …>` 資料檔** | **只有** `journey.ts`（R7 之後） | 改 zh 陣列就要改 en 陣列 |

三種機制**冇統一**，所以「改一句中文」實際要改幾多地方，**取決於那句話住在哪一種機制裡**。

### 6.2 路由係點產生的

`astro.config.mjs` 的 i18n 設定 + **`src/pages/en/` 實體資料夾** 兩者配合：

```js
i18n: {
  defaultLocale: 'zh',
  locales: ['zh', 'en'],
  prefixDefaultLocale: false,   // 中文唔要 /zh，英文要 /en
}
```

- 中文頁：`src/pages/index.astro` → `/`
- 英文頁：`src/pages/en/index.astro` → `/en/`
- **`en/` 唔係 redirect、唔係自動翻譯**，係一份**真·複製檔**。

`Layout.astro` 用 `Astro.currentLocale` 判斷語言，並由 `canonicalPath` **自動推導** canonical + hreflang：

```js
const logical = (canonicalPath ?? rawPath).replace(/^\/en(?=\/|$)/, '') || '/';
const zhPath = logical;
const enPath = logical === '/' ? '/en/' : `/en${logical}`;
```

→ **只要頁面有傳對 `canonicalPath`，hreflang 就自動正確**，唔使手寫。呢個係 R6 的最大貢獻。

### 6.3 改一句中文文案 → 你要改邊幾個地方（checklist）

| 你改嘅係 | 必改 | 可能漏 |
|---|---|---|
| **頁面內文**（`src/pages/*.astro`） | 同一個檔的 `isEn ? … : …` 另一個分支（如有），**＋ `src/pages/en/` 對應鏡像檔內的同一句** | `Layout` 的 `title` / `description` prop 內也有文案 |
| **`Header` / `Footer` 導航字** | `Header.astro` / `Footer.astro` 內 `t` 物件的另一個語言分支 | Footer 底部那 3 條 `contactLinks` |
| **首頁 Hero** | `Hero.astro` `t` 物件的 `en` 分支 | `h1` 內有 `{`…`}` 插值，改中文時要同步改英文語序 |
| **首頁三個轉化卡** | `src/data/site.ts` 的 `CONVERSION_ENTRIES[].name/desc/cta` 的 `.en` | `public/llms.txt`（**站外 SEO 檔，會同上線內容不一致**） |
| **首頁數字 stats** | `Facets.astro` 的 `stats` 陣列（zh 分支）**＋ `en` 分支** | 中文分支第三個 label 目前係英文 `Years of experience`（bug，見 6.4） |
| **時間軸** | `src/data/journey.ts` 的 `journeyPhases.en` 對應 milestone **＋ `journeyCopy.en`** | `yearRange`（中英分開寫，`2020 - 至今` vs `2020 - present`） |
| **`/projects` 兩個案例** | `projects.astro`（214 行）**＋ `en/projects.astro`（獨立 214 行，唔係 import）** | 兩個檔各自有 `FILE_ID`、`RESTRICTED ACCESS`、CTA 字串，**冇共用資料檔** |
| **`/hub` 列表文案** | `hub/index.astro` `cabinets` 陣列（zh 分支）**＋ `en/hub/index.astro`（另有一份死 zh 分支）** | `typeLabel`、`formatDate` 的 locale |
| **書的標題／摘要** | 該 md 的 `title` / `summary` **＋ `titleEn` / `summaryEn`** | markdown 正文**冇英文版**（結構性限制） |
| **`/about-brendon`** | `about-brendon.astro`（30 行）**＋ `en/about-brendon.astro`（30 行獨立檔）** | 兩檔內容幾乎一樣但**完全獨立**，改一邊唔會影響另一邊 |
| **`/insights` 列表文案** | `insights/index.astro` **＋ `en/insights/index.astro`** | 兩檔各自硬編碼 `const isEn = false/true` |

**最易中招：`/projects` 同 `/about-brendon`。** 呢兩對頁面**唔係**靠三元式，而係**兩份完整獨立的檔案**。改中文版，英文版**零反應**。

### 6.4 已知的雙語不一致（Claude 接手前必須知）

| # | 位置 | 問題 | 嚴重度 |
|---|---|---|---|
| 1 | `insights/index.astro`、`insights/[slug].astro` | 硬編碼 `const isEn = false;`；`en/` 版本硬編碼 `const isEn = true;`。**唔係由 `Astro.currentLocale` 判斷** —— 如果有人把 `en/` 檔移位置，語言判斷會靜靜錯掉 | 中 |
| 2 | `/en/insights` 及 `/en/insights/[slug]` | 頁面 UI 係英文，但**文章內容（來自 WordPress）仍然係中文**。`posts.ts` 完全冇語言過濾 | **高（SEO/GEO 風險：英文頁含中文正文）** |
| 3 | `Facets.astro` zh 分支 | 第三個 stat label 寫死 `'Years of experience'`（英文），前兩個係中文 | 低（但好顯眼） |
| 4 | `en/hub/index.astro` | 整頁複製自中文版，`isEn ? … : …` 的 **zh 分支仍然留喺檔內**（死代碼，永遠唔會執行） | 低（維護陷阱） |
| 5 | `en/hub/[slug].astro` | `<title>` 後綴直接沿用中文版格式，英文頁 title 有中英夾雜 | 低 |
| 6 | `hub/[slug].astro` | `authorJob = '中国工业企业进入东南亚实战顾问'` **寫死簡體中文**，英文頁都會出中文職銜 | 中 |
| 7 | `Layout.astro` `defaultDesc` | 有中英兩版，但**只在頁面冇傳 `description` 時才用**；`/projects` 等頁有傳，所以實際用自訂版 | 低 |
| 8 | `llms.txt` | 站外 SEO 檔，內含三個轉化入口描述 —— **改 `site.ts` 唔會自動同步它** | 中 |
| 9 | `README.md` | 仍然係 Astro Starter Kit 原文（`Welcome.astro`、`localhost:4321`），**完全冇提到 i18n** | 低（但會誤導接手人） |

### 6.5 如果 Claude 想「順手重構成統一字典」

**強烈建議唔好喺第一次改版時做。** 理由：

- 現時 14 個頁面中，有 7 對係「兩個獨立檔」。要抽成字典，等於**同時重寫 14 個檔 + 8 個 component**，一次過動到全站每一句字。
- 冇測試、冇 snapshot、冇 storybook。任何漏掉的字會**靜靜變成空白**（Astro 對 undefined 唔會報錯，只會唔渲染）。
- 現有 `isEn` 三元式雖然醜，但**TypeScript 會檢查兩個分支都存在**（物件字面量缺 key 會紅字）。改成 `t('key')` 之後，漏 key 只會 runtime undefined。

**若真要做**，安全順序：先做 `journey.ts` 模式（已有先例）→ 再做 `Header`/`Footer`（出現喺每一頁，改了即刻全站可見）→ 最後才碰頁面內文。

---

## §7 樣式系統

### 7.1 核心：Tailwind v4 的 CSS-first token（**冇 config 檔**）

整個樣式系統只有一個入口：`src/styles/global.css`，由 `Layout.astro` 第 15 行 `import '../styles/global.css';` 引入。

```css
@import "tailwindcss";

/* ---------------------------------------------------------------
   品牌设计令牌 (Tailwind v4 写法)
   v4 不会再自动读取 tailwind.config.mjs，
   必须用 @theme 在 CSS 里声明，否则 hk-* 颜色类不会生成，
   会出现「白底 + 白字」导致文字看不见的问题。
   --------------------------------------------------------------- */
@theme {
  --color-hk-bg: #ffffff;
  --color-hk-primary: #1e293b;
  --color-hk-accent: #d97757;
  --color-hk-text: #333333;

  --font-sans: "Noto Sans HK", ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", "Microsoft YaHei", sans-serif;
}

/* 全站基本排版 */
html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--color-hk-bg);
  color: var(--color-hk-text);
  -webkit-font-smoothing: antialiased;
}
```

### 7.2 Token 對照表

| CSS 變數 | 值 | 生成的 class | 實際用途 | 出現位置 |
|---|---|---|---|---|
| `--color-hk-bg` | `#ffffff` | `bg-hk-bg`、`text-hk-bg` | 全站白底 | `body`、`Layout.astro` 的 `bodyClass` 預設值 |
| `--color-hk-primary` | `#1e293b`（深藍灰 slate-800） | `bg-hk-primary`、`text-hk-primary`、`border-hk-primary`、`ring-hk-primary` | 主文字／深色按鈕背景／邊框 | `Header` 的 logo 文字、多處 CTA 按鈕、`.timeline-dot` 的 ring |
| `--color-hk-accent` | `#d97757`（赤陶橙 terracotta） | `bg-hk-accent`、`text-hk-accent`、`selection:bg-hk-accent` | **品牌主色**：eyebrow、數字、hover 線、選取反白 | `Layout` 的 `selection:bg-hk-accent`、`Milestones` 標籤、`Facets` 數字、`Mask-icon` 顏色 |
| `--color-hk-text` | `#333333` | `text-hk-text` | 正文顏色 | `body`、`projects.astro` 的 `bodyClass="file-cabinet-bg text-hk-text"` |
| `--font-sans` | `"Noto Sans HK", ui-sans-serif, system-ui, …` | `font-sans` | 全站字體 | `Layout` 的 `<body class="font-sans …">` |

> **點解係 `hk-` 前綴？** 早期 Brendon 用「HK」做品牌代號（Hong Kong）。呢個前綴已經變成事實標準，**唔建議改名**，因為 14 個頁面 + 10 個 component 內四散使用 `hk-*`（尤其 `hk-accent`、`hk-primary`），改一次要全域搜替換，風險高於收益。

### 7.3 為什麼 `website_engine/` 冇 `tailwind.config.mjs`

- Tailwind **v4** 已經**唔會自動讀 `tailwind.config.mjs`**。所有 design token 必須寫在 CSS 的 `@theme {}` 內。
- 頂層 `web/`（廢棄專案）**仍然有** `tailwind.config.mjs` —— 因為它用的是舊版寫法。
- **陷阱**：如果 Claude 見到 `web/tailwind.config.mjs` 覺得「咦，主工程漏咗 config」而複製過去，Tailwind v4 會**完全忽略它**，`hk-*` class 唔會生成 → 畫面變成**白底白字**（`bg-hk-bg` 無效 = 透明，`text-hk-text` 無效 = 繼承）。`global.css` 的註解就是為了提醒這件事。

### 7.4 全局 CSS 共有 **4 個來源**（不是只有一個）

| # | 位置 | 作用域 | 內容 |
|---|---|---|---|
| 1 | `src/styles/global.css` | 全站 | `@import "tailwindcss"` + `@theme` token + `html{scroll-behavior}` + `body` 底色 |
| 2 | `Layout.astro` 內 `<style is:global>` | 全站（每一頁） | 再次宣告 `body{background:#ffffff;color:#333333}`（**與 global.css 重複**，但優先級更高）＋ `.timeline-dot`（18px 圓點，橙底白邊深藍 ring）＋ `.hk-card:hover`（`translateY(-5px)` + 陰影） |
| 3 | `projects.astro` 內 `<style is:global>` | **只影響 `/projects` 同 `/en/projects`**（因為 `is:global`） | `body{background-color:#Fdfbf7;color:#333333}` ＋ `.file-cabinet-bg`（40px 網格，`rgba(217,119,87,0.05)`） |
| 4 | `insights/[slug].astro` 內 `<style is:global>` | **只影響文章頁** | 一大段 WordPress 文章 HTML 的排版樣式（`h2/h3/p/ul/blockquote/img/a/table` 等），因為 WP 來的 HTML 冇 class |

**⚠️ 第 3 點係一個定時炸彈。** `projects.astro` 用 `is:global` 改 `body` 背景色。因為 Astro 靜態輸出時每頁係獨立 HTML，所以現時**冇問題**；但如果日後改成 SPA / View Transitions（`<ClientRouter />`），離開 `/projects` 後**米色底會殘留**到其他頁。Claude 若引入 View Transitions，必須把該段改成 `body:has(.file-cabinet-bg)` 或加 `.page-projects` scope。

### 7.5 字體與圖示：**兩個外部 CDN 依賴**

`Layout.astro` `<head>` 內：

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+HK:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
```

| 依賴 | 版本 | 用途 | 風險 |
|---|---|---|---|
| Google Fonts · Noto Sans HK | 5 個字重 300/400/500/700/900 | 全站字體 | 中國大陸訪問不穩（Google 被牆）；無 self-host fallback |
| Font Awesome (cdnjs) | **6.4.0**（2023 年版本，已舊） | 全站所有圖示（`fa-ship`、`fa-store`、`fa-industry`、`fa-bolt`、`fa-whatsapp` 等） | CDN 掛咗 → 全站圖示變空白方格；`site.ts` 的 `icon` 欄位直接存 FA class 字串，**換 icon 套件等於改資料檔** |

> 如果 Claude 想「現代化」，**唔好一次過換走 Font Awesome**。`CONVERSION_ENTRIES[].icon` 係 `'fa-ship'` 這類字串，直接塞進 `class={...}`。改用 Lucide/Iconify 要同時改 `site.ts` 的型別同 `ConversionEntries.astro` 的渲染方式。

### 7.6 實際在用的 Tailwind 色系（**不只 hk-\***）

程式碼內大量使用 Tailwind **內建**色票，形成「雙軌並存」：

| 色系 | 例子 | 用在哪 |
|---|---|---|
| `stone-50 / 100 / 200 / 400 / 500 / 600 / 700 / 800 / 900` | `bg-stone-50`、`text-stone-900`、`border-stone-200` | **主力**：卡片底、邊框、正文（`ConversionEntries` 用 `bg-stone-50`） |
| `amber-50 / 300 / 500 / 800` | `border-amber-300`、`text-amber-800`、`bg-amber-50` | 時間軸 accordion 展開態、`impact` 提示框、`Milestones` 標籤 |
| `hk-accent`（= `#d97757`） | `text-hk-accent`、`selection:bg-hk-accent` | eyebrow、強調數字、hover |
| `hk-primary`（= `#1e293b`） | `bg-hk-primary`、`text-hk-primary` | 深色按鈕、標題 |
| `rgba(41,37,36,1)` | `shadow-[8px_8px_0_rgba(41,37,36,1)]` | `/projects` 的「復古硬陰影」（Neo-brutalism 風格） |

**設計語言其實有三套混在一起：**

1. **暖灰極簡**（stone + 白底）→ 首頁、Hub、Insights
2. **赤陶橙點綴**（hk-accent）→ 品牌色
3. **復古檔案櫃 / Neo-brutalism**（`/projects`：米色 `#Fdfbf7` + 網格 + 硬邊框 + 8px 硬陰影 + 三點視窗 chrome）

→ **Claude 改版時，`/projects` 係唯一「風格唔跟大隊」的頁面。** 如果要做視覺統一，呢頁要整頁重做，唔係改 token 就搞掂。

### 7.7 其他全域行為

- `html { scroll-behavior: smooth; }` + `<html class="scroll-smooth">`（兩處重複設定）
- `body` 有 `selection:bg-hk-accent selection:text-white` → 選字時橙底白字
- 錨點跳轉（`#conversion`、`#facets`、`#milestones`、`#matrix-preview`、`#contact`）靠 `scroll-behavior: smooth`；`Header` 係 `fixed`，所以每個 `<section id>` 都有 `scroll-mt-*` 補償（改版加新 section 時**必須**跟）
- 無 dark mode、無 RTL、無 reduced-motion 處理

---

## §8 2026-09-23《架構診斷報告》之後做過嘅改動（R1–R7 實際狀態）

### 8.0 一覽

| 編號 | 報告建議 | 實際狀態 | 主要檔案 |
|---|---|---|---|
| **R1** | 把「三個轉化收口入口」做回站內（報告指這是**致命缺口**） | ✅ **已完成** | `src/components/ConversionEntries.astro`（新建）、`src/data/site.ts`、`index.astro`、`en/index.astro`、`Footer.astro` |
| **R2** | 首頁由「講自己」改為「講客戶問題 → 證據 → 轉化」 | 🟡 **部分完成** | `Hero.astro`（CTA 已改）、`index.astro` / `en/index.astro`（**區塊次序未重排**） |
| **R3** | `/insights` 由 iframe 改為 build-time 靜態頁 | ✅ **已完成** | `src/data/posts.ts`（新建）、`insights/index.astro`、`insights/[slug].astro`、`en/insights/*` |
| **R4** | `/manuals` 退役，收編入 Hub | ✅ **已完成** | `astro.config.mjs`（redirects）、`Milestones.astro`（按鈕改 `/hub`）、`public/llms.txt`（已移除 manuals 條目） |
| **R5** | 清掉所有假佔位（`85200000000`、`YOUR_FORM_ID`、wechat QR 提示） | 🟡 **大部分完成，剩 2 個要業主提供資料** | `src/data/site.ts`、`Contact.astro`、`Lab.astro`、`projects.astro` |
| **R6** | 抽出共用 Layout；接回孤兒元件 `Facets`；刪 `Welcome.astro` | ✅ **已完成** | `src/layouts/Layout.astro`（新建）、全部 14 個頁面、`Facets.astro` |
| **R7** | 雙語文案資料化（時間軸先行） | ✅ **已完成**（只限時間軸） | `src/data/journey.ts`（新建）、`JourneyTimeline.astro`（由 200+ 行降到呈現層） |

**總計：5 項完成、2 項部分完成、0 項未做。**

---

### R1 — 三個轉化收口入口 ✅ 已完成

**報告原問題（缺口 1，評為「致命」）：** 三個轉化入口只存在於 `public/llms.txt`，`src/` 內完全冇對應 UI。訪客睇完整站都唔知可以「去邊度買／去邊度問」。

**做了什麼：**

1. 新建 `src/components/ConversionEntries.astro`，渲染 `CONVERSION_ENTRIES` 三張卡（`sea-leap` / `gai-store` / `hoff-industrial`）。
2. 元件自帶 `<section id="conversion">` → **全站 `#conversion` 錨點由這個元件獨家擁有**。
3. 資料來自 `src/data/site.ts` 的 `CONVERSION_ENTRIES`，**與 `llms.txt` 文字一致**。
4. 插入首頁第 2 位（`Hero` 之後），中英各一次。
5. `Footer.astro` 加一條常駐轉化條，指向 `#conversion`。

**對應檔案：**

| 檔案 | 角色 |
|---|---|
| `src/data/site.ts` | 三個入口的唯一資料源（含 zh/en 的 name/desc/cta） |
| `src/components/ConversionEntries.astro` | 呈現；接受 `variant?: 'full' \| 'compact'` |
| `src/pages/index.astro` | `<ConversionEntries />`（full） |
| `src/pages/en/index.astro` | 同上 |
| `src/components/Footer.astro` | 底部轉化條（5 項職責之一） |

**未做的部分：** 三個入口**只出現在首頁 + Footer**。`/projects`、`/hub`、`/insights` 只有 `Contact`（`#contact`），冇 `#conversion` 區塊。所以由內頁想跳去轉化，要靠 Footer。

---

### R2 — 首頁轉化導向 🟡 部分完成

**報告原問題（缺口 2，評為「高」）：** 首頁 <title> 寫「真實面向與打怪升級之路」，但內容係自我介紹，冇回答訪客「你能幫我解決什麼」。

**做了什麼：**

- `Hero.astro` 內有明確註解 `{/* R2：改為連結到 ABOUT BRENDON 頁 */}` —— 原本第 3 個 CTA 指去 `#milestones`（自我介紹區），**已改為 `/about-brendon`**。
- 換言之：首頁唔再 attempt 講完整人生故事，把「故事」推去 `/about-brendon`，首頁專心做轉化。

**未做／做得不徹底：**

- 首頁 section 次序**仍然係**：`Hero → ConversionEntries → Facets → Milestones → MatrixPreview → Contact`。
  - 即係：**先講「我是誰的數字」（Facets）→ 再講「我的經歷」（Milestones）→ 最後才講「我的項目」（Matrix）**。
  - 報告建議的漏斗係「客戶問題 → 證據 → 轉化」，現時係「自我介紹 → 轉化」。**結構性重排未做**。
- 首頁 `<title>` 是否已改，需以 §3.2 的原文為準（該節已貼出目前實際上線的 `<title>` 與 description）。
- `JourneyTimeline`（完整人生時間軸）**只出現在 `/about-brendon`**，唔在首頁 —— 呢個係 R2 之後的刻意安排。

**對應檔案：** `src/components/Hero.astro`（已改）、`src/pages/index.astro` + `src/pages/en/index.astro`（**未重排**）、`src/pages/about-brendon.astro` + `en/about-brendon.astro`（承接故事）。

---

### R3 — `/insights` 去 iframe 化 ✅ 已完成

**報告原問題（缺口 3，評為「高」）：** `/insights` 整頁係一個 `<iframe>` 嵌入 WordPress。SEO 上等於「呢頁冇內容」；GEO 上 AI 爬蟲讀唔到。

**做了什麼：**

1. 新建 `src/data/posts.ts`：build-time 打 `https://blog.brendonlai.com/wp-json/wp/v2/posts?per_page=100`，模組層 `Promise` 快取，**中英四個頁面共用同一份資料**。
2. `insights/index.astro` 改成靜態列表（卡片 + 摘要 + 「閱讀全文」），並永遠保留一條「前往博客看全部文章」的外鏈。
3. 新建 `insights/[slug].astro`：`getStaticPaths` 由 `getPosts()` 產生，`set:html` 渲染已淨化的正文。
4. `en/insights/index.astro`、`en/insights/[slug].astro` 為鏡像檔。
5. `posts.ts` 內有完整 HTML 白名單淨化（去 `<script>/<style>/<iframe>`，只留 `a[href]`、`img[src|alt]`），解決 Google Docs 貼上來的髒 HTML。
6. 非 ASCII slug 自動退回 `post-<id>`，避免 `NoMatchingStaticPathFound`。

**對應檔案：** `src/data/posts.ts`（新）、`src/pages/insights/index.astro`、`src/pages/insights/[slug].astro`、`src/pages/en/insights/index.astro`、`src/pages/en/insights/[slug].astro`。

**副作用（Claude 必須知）：**

- Build 時**必須**能連 `blog.brendonlai.com`。連不上 → build 成功但文章頁全消失（靜靜 fail，唔會紅燈）。
- `en/insights/*` 抓的是**同一批中文文章**（WP 冇多語言）→ 英文頁含中文正文。
- 冇分頁：`per_page=100`，超過 100 篇會被**靜靜截斷**。

---

### R4 — `/manuals` 退役 ✅ 已完成

**報告原問題（缺口 4，評為「中」）：** `/manuals` 係舊的獨立頁，內容同 Hub 的「方法論手冊」櫃重複；`Milestones` 仍然連去 `/manuals`。

**做了什麼：**

1. `astro.config.mjs` 加：
   ```js
   redirects: {
     '/manuals': '/hub',
     '/en/manuals': '/en/hub',
   },
   ```
   靜態輸出會生成一個帶 `<meta http-equiv="refresh">` + canonical 的轉址頁。
2. `Milestones.astro` 第二個按鈕由 `/manuals` 改為 `/hub`（按鈕文案仍係「Brendon Hub · 方法论手册」）。
3. `public/llms.txt` 已**移除** manuals 條目（現時第 10 行直接列 `/hub`）。

**對應檔案：** `astro.config.mjs`（第 8–13 行）、`src/components/Milestones.astro`、`public/llms.txt`。

**殘留：** `src/pages/` 內**已經冇** `manuals.astro`（已刪）。舊外部連結靠 redirect 救，**唔好刪 redirects**。

---

### R5 — 清掉假佔位 🟡 大部分完成

**報告原問題（缺口 5，評為「高」）：** 全站有 4 類假資料：`wa.me/85200000000`、`[请在 public 文件夹放入 wechat-qr.png]`、`forms.google.com/YOUR_FORM_ID`（中英各 2 個）。

**做了什麼：**

1. 建立 `src/data/site.ts` 作 SSOT，把全部聯絡／表單／社群集中。
2. `whatsapp` 已填**真實號碼** `8615017959223`（+86 150 1795 9223）。
3. `Contact.astro` 改成 `hasWa / hasWechat / hasEmail / hasAnyDirect` 四個判斷：
   - 有值 → 出按鈕；冇值 → **唔渲染該按鈕**；
   - 三個都冇 → 出一個 fallback 連去 `#conversion`；
   - **永遠唔會出 `href="#"`**。
4. `Lab.astro`、`projects.astro` 的「解鎖資源」按鈕：`FORMS.resourceRequest` 有值 → 外鏈；空 → 內跳 `#conversion`（`formExternal` 判斷）。
5. `wechatQr` 空 → 彈窗改為純文字引導（微信號 `brendonlky`），**唔再顯示「請放入圖片」佔位符**。

**仍未完成（因為要 Brendon 本人提供）：**

| 項目 | 現值 | 影響 |
|---|---|---|
| `CONTACT.wechatQr` | `''` | 微信彈窗冇 QR code 圖（`public/` 內亦**冇** `wechat-qr.png` —— 已核實） |
| `FORMS.resourceRequest` | `''` | `/projects` 兩個案例的「解鎖資源」按鈕全部 fallback 去 `#conversion`（冇真正表單） |
| `SOCIAL.instagram` / `twitter` | `''` | 唔渲染（刻意，非 bug） |

**對應檔案：** `src/data/site.ts`、`Contact.astro`、`Lab.astro`、`projects.astro`、`en/projects.astro`、`ConversionEntries.astro`。

---

### R6 — 共用 Layout + 接回孤兒元件 ✅ 已完成

**報告原問題（缺口 6 + 7，評為「中」）：** 冇共用 Layout，每頁自己寫 `<head>`；`layouts/Layout.astro` 竟然仍係 `<title>Astro Basics</title>` 的範本；`Facets.astro` 零引用（孤兒）；`Welcome.astro` 範本殘留。

**做了什麼：**

1. 新建 `src/layouts/Layout.astro`，一次承載：
   - `<head>`：title / description / canonical / **hreflang（zh-CN / en / x-default）** / OG / Twitter Card / favicon / Google Fonts / FontAwesome；
   - `<Header />` + `<main>` + `<Footer />`；
   - canonical 與 hreflang **由 `canonicalPath` 自動推導**（見 §6.2）。
2. 全部 **14 個頁面**改為 `<Layout title=… description=… canonicalPath=…>`。
3. `Facets.astro`（數字／信任背書）**接回首頁**，位置在 `ConversionEntries` 之後。
4. 刪除 `Welcome.astro`。

**對應檔案：** `src/layouts/Layout.astro`（新）、`src/pages/**/*.astro`（全部）、`src/components/Facets.astro`。

**殘留：** `src/assets/astro.svg`、`src/assets/background.svg` 仍在，但**冇任何 import**（無害死檔，可刪）。

---

### R7 — 雙語文案資料化 ✅ 已完成（只限時間軸）

**報告原問題（缺口 8，評為「中」）：** 中英靠整頁手抄，`JourneyTimeline.astro` 內更加係**中英兩份文案硬編碼在同一個檔**，改一句要改兩處邏輯。

**做了什麼：**

1. 新建 `src/data/journey.ts`：
   - `journeyPhases: Record<Lang, JourneyPhase[]>`（4 個 phase、5 個 milestone）；
   - `journeyCopy: Record<Lang, { eyebrow, h2, desc, gained, archive }>`；
   - `interface Milestone` / `JourneyPhase` 提供 build 期型別檢查。
2. `JourneyTimeline.astro` 只保留呈現層：`const phases = journeyPhases[isEn ? 'en' : 'zh'];`。
3. 順手改 UX：**4 個 phase 預設全部收合**，accordion 開一個自動收其他。

**對應檔案：** `src/data/journey.ts`（新）、`src/components/JourneyTimeline.astro`。

**未做的部分：** 只有時間軸做了資料化。`Header`、`Footer`、`Hero`、`Facets`、`Milestones`、`MatrixPreview`、`Contact`、`Lab`、`ConversionEntries` 仍然係 `isEn ? {} : {}` 三元式；`/projects`、`/about-brendon` 仍然係兩份獨立檔。**R7 的模式可以被複製，但未被推廣。**

---

## §9 你所知但喺程式碼睇唔到嘅嘢

> 呢一節**唔係**從程式碼推導，而係來自 2026-09-23 診斷過程、Brendon 的對話，以及實際部署經驗。Claude 應該把它當作「口述歷史」看待。

### 9.1 設計決定背後的原因

| 決定 | 原因 |
|---|---|
| **三個轉化入口（sea-leap / gai-store / hoff-industrial）**，而唔係「聯絡我」 | Brendon 的收入來自三個實體業務，唔係「個人品牌廣告」。網站的角色是**漏斗頂**，唔係 CV。所以首頁一定要有三條「去哪裡做生意」的路。 |
| **`site.ts` 做 SSOT、空字串 = 隱藏** | 因為 Brendon 經常未準備好某些資料（微信 QR、Google Form）。與其顯示假資料，寧願**唔顯示**。這條規則被寫成程式碼註解，是刻意的約束。 |
| **`/hub` 四個書櫃寫死在頁面檔** | 書櫃是**敘事分類**（企業作品 / 已發表 / 未來 / 方法論），唔係資料。當初判斷 4 個唔會經常變，所以冇抽去 `data/`。 |
| **`/projects` 用「復古檔案櫃」視覺** | Brendon 想要「工業現場感」—— 檔案櫃、貼紙、`RESTRICTED ACCESS`、硬陰影。呢頁是**展示實力**（給潛在客戶／合作方），唔係給普羅大眾，所以刻意做得「重」、唔跟首頁的極簡風。 |
| **`JourneyTimeline` 預設全部收合** | 時間軸有 5 個 milestone，全開會令 `/about-brendon` 極長，訪客會走。收合後引導「點擊展開」。 |
| **Hero 第 4 個 CTA 用 LinkedIn 文字按鈕** | 原本係一個 icon，R6 改成文字按鈕（`{/* R6：領英按鈕取代原本的圖示 */}`），因為 icon 太細、唔明顯。 |
| **中英用兩份獨立頁面，而唔係 i18n 字典** | 早期為求快、求「每頁可以獨立改到最貼近當地語感」。代價就是今日的同步地獄（見 §6）。 |
| **`/projects` 標題英文版叫 `File Cabinet`** | 中文版叫「檔案櫃」。英文用 File Cabinet 保留同一個比喻，唔直譯成 "Projects"。 |

### 9.2 曾經試過但放棄的做法

| 做法 | 為何放棄 |
|---|---|
| **`/insights` 用 iframe 嵌 WordPress** | 被 2026-09-23 報告判定為「SEO/GEO 自殺」。已由 R3 取代。**`web/` 舊專案內仍然有 iframe 版本，唔好參考。** |
| **獨立 `/manuals` 頁** | 與 Hub 的「方法論手冊」櫃重複。已由 R4 改成 redirect。 |
| **Astro Starter Kit 預設結構**（`Welcome.astro` + `layouts/Layout.astro` 的 `<title>Astro Basics</title>`） | 純範本殘留，從未真正使用。R6 已清。 |
| **`tailwind.config.mjs`** | 升級 Tailwind v4 後失效。**`web/` 內仍有一份，係舊世界的遺物。** |
| **`wa.me/85200000000` 假號碼** | R5 已換成真實中國號碼。 |
| **「請放入 wechat-qr.png」的佔位文字** | 寧願唔顯示，都唔好顯示內部指示給訪客。已改成純文字引導。 |
| **頂層 `web/` 整個專案** | 見 §1.1。**冇 git、冇 deploy、冇 i18n**。保留只為「歷史參考」。 |

### 9.3 已知 bug / 缺陷（未修）

| # | 問題 | 位置 | 影響 |
|---|---|---|---|
| 1 | 中文版 stats 第三個 label 係英文 `'Years of experience'` | `Facets.astro` | 中文頁中英夾雜，很顯眼 |
| 2 | 英文 Hub 文章頁 `<title>` 中英夾雜 | `en/hub/[slug].astro` | SERP 顯示不專業 |
| 3 | 文章頁作者職銜寫死簡體中文 | `hub/[slug].astro` `authorJob` | 英文頁出中文 |
| 4 | `/en/insights` 正文係中文 | `posts.ts` 冇語言過濾 | 英文 SEO 內容錯配 |
| 5 | `insights/*` 用 `const isEn = false/true` 硬編碼 | 4 個 insights 頁 | 語言判斷不可靠 |
| 6 | `externalUrl` 冇 URL 驗證 | `content.config.ts` | 打錯字都 build 得過，變成 404 外鏈 |
| 7 | `image` 欄位存在但 4 本書全部冇用 | `content.config.ts` | Hub 列表冇封面圖，視覺單薄 |
| 8 | `hero-life-2.jpg` 存在但**冇任何引用** | `public/` | 死資源（159 KB） |
| 9 | `src/assets/astro.svg`、`background.svg` 冇 import | `src/assets/` | 死資源 |
| 10 | `README.md` 仍係 Astro Starter Kit 原文 | `website_engine/README.md` | **會誤導接手人**去搵 `Welcome.astro`、行 `localhost:4321` |
| 11 | `llms.txt` 人手維護，與 `site.ts` 無同步機制 | `public/llms.txt` | 改文案容易漏 |
| 12 | 首頁 title 與內容調性未完全對齊 | `index.astro` / `en/index.astro` | R2 未完成的部分 |
| 13 | `hub/index.astro` 書櫃資料寫死在頁面 | `hub/index.astro`、`en/hub/index.astro` | 加書櫃要改兩個檔 |

### 9.4 TODO（程式碼內明文寫住的）

| TODO | 檔案 | 說明 |
|---|---|---|
| LinkedIn 改短網址 | `site.ts` 第 78 行 | 現時 `linkedin.com/in/lai-brendon-winwinwin`，建議改成 `linkedin.com/in/brendonlai` |
| 填 Google Form | `site.ts` 第 84 行 | `resourceRequest` 空 → 資源解鎖全部 fallback |
| 放微信 QR | `site.ts` 第 68 行 | 圖要放 `public/wechat-qr.png`，然後填 `'/wechat-qr.png'` |

### 9.5 Brendon 講過嘅偏好（交接重點）

1. **「問題才是主角，我只是載體。」** —— 呢句出現在 `one-person-company-lesson-1.md` 正文，亦係他對整個 IP 的定位。**唔要把網站做成「成功人士自我表揚」。**
2. **討厭假東西。** 所有「未準備好」的資料寧願隱藏，都唔要 placeholder。這是 `site.ts` 空字串設計的來源。
3. **要「工業現場感」，唔要「PPT 顧問感」。** 真實照片（工廠、機械、現場）優先於插圖、圖表、abstract gradient。
4. **中英都要，但英文版是「給東南亞客戶看的敲門磚」**，唔需要完美文學性，只需要清楚。
5. **不想被當成「47 歲回中國打工」的人** —— 他選擇用 AI + 內容重新創業，網站要反映「一人公司」的運作方式（`Lab` 區塊就是在講這個）。
6. **對 VPS 極度謹慎。** 同一部 VPS 跑住 gai-store、hoff-industrial、n8n。任何改動**不能影響其他站**（見 §11）。
7. **偏好「一頁過濾客戶」** —— 寧願訪客看了三秒就離開，都不要引來不合適的詢價。

### 9.6 交接時最容易踩的 3 個坑

1. **以為 `web/` 新啲**（因為它在頂層、資料夾名更短）→ 其實係廢棄的舊版。
2. **以為 `README.md` 可信** → 其實係 Astro 範本原文，完全冇更新。
3. **以為 `tailwind.config.mjs` 應該存在** → v4 世界冇這回事，加了反而會白底白字。

---

## §10 改版注意事項

### 10.0 三個改動共通的三條鐵律

在做 (a)(b)(c) 任何一項之前，先記住這三件事。它們是本專案**所有**改動的共同風險來源：

1. **首頁與 `/projects` 的中英文是「兩份獨立檔案」，不是一個模板 + 字典。**
   `src/pages/index.astro` / `src/pages/en/index.astro`、`src/pages/projects.astro` / `src/pages/en/projects.astro` 全部係各自手寫。
   → 你改中文那份，**必須逐項同步改英文那份**。沒有 `t()` 函數、沒有 `zh.json`。漏改的後果是英文版直接說錯話（不是排版走位這麼簡單）。

2. **每個區塊自己擁有 anchor id，而 Header 是 `fixed` 的。**
   `ConversionEntries` 內部就係一個 `<section id="conversion">`；Footer 的 CTA、`Contact` 在 `FORMS.*` 為空時的 fallback、`Lab` / `/projects` 的 `formHref` fallback，**全部指向 `#conversion`**。
   → 重新排序時如果把 `ConversionEntries` 移走、或改成條件渲染，這些連結會靜靜失效（不報錯、不 build fail，只是點了沒反應）。
   → 任何新 `<section>` 必須加 `scroll-mt-*`（例如 `scroll-mt-28`），否則 `fixed` Header 會蓋住標題。

3. **`src/data/site.ts` 是唯一 SSOT。**
   新區塊如果需要「三個案例」的標題／描述／連結／icon，**加進 `site.ts`**，不要在 `.astro` 裡 hardcode `https://gai-store.com`。
   一旦 hardcode，日後改網址要翻遍全站；而且 `llms.txt`（手寫維護）會與真實內容脫節。

---

### 10.1 (a) 首頁區塊重新排序 ＋ 新增「三個實證」區塊

**現時首頁區塊順序（中英一致）**

```
Layout
└─ Hero                 ← 3 個 CTA，第 3 個已指向 /about-brendon
   ConversionEntries    ← <section id="conversion">（三個轉化入口）
   Facets
   Milestones
   MatrixPreview
   Contact              ← 必須在最後（它是轉化終點）
```

**會牽涉的檔案**

| 檔案 | 要改什麼 | 風險 |
|---|---|---|
| `src/pages/index.astro`（29 行） | 調整 component import 順序 + 標籤順序 | 漏改英文 → 中英版結構不一致 |
| `src/pages/en/index.astro`（29 行） | 同上，**逐行對稱** | 兩份檔案無共用常數，改動容易漂移 |
| `src/components/Hero.astro` | 若「三個實證」要放 Hero 之上／之下，需確認 CTA 不重複 | Hero 有 touch 翻牌 script（`matchMedia` + 點擊 toggle），改動結構時唔好拆掉 `data-*` 屬性 |
| 新檔 `src/components/ProofPoints.astro`（建議名） | 新區塊本體 | 內含文案 → 用 `isEn ? {} : {}` 三元，跟現有 10 個 component 一致 |
| `src/data/site.ts` | 若要資料驅動，加一個 `PROOF_POINTS` 陣列 | 改 SSOT → 要檢查有無其他地方 import 整份物件 |
| `public/llms.txt` | 若新區塊有新的主張／數字，需手動更新 | 此檔是手寫的，不會自動同步 |

**具體風險**

| # | 風險 | 嚴重度 | 說明 |
|---|---|---|---|
| 1 | `#conversion` 錨點失效 | **高** | Footer / Contact / Lab / projects 的 fallback 都靠它。若 `ConversionEntries` 被移出首頁或包進條件渲染，全站 CTA 會變成死連結 |
| 2 | 中英不同步 | **高** | 兩個 29 行檔案獨立，沒有型別檢查幫你抓「中文加了、英文沒加」 |
| 3 | `fixed` Header 遮住新區塊標題 | 中 | 新 section 必須 `scroll-mt-28`（Header 高度約 `h-20` + padding） |
| 4 | 「三個實證」與 `ConversionEntries` 語意重疊 | 中 | `ConversionEntries` 已經係「三個」轉化入口（sea-leap / gai-store / hoff-industrial）。如果「三個實證」也是同樣三個站，會變成同一個意思講兩次 → 建議「實證」講**結果／數據／現場照片**，「入口」講**點擊去哪裡**，並在文案上明確區分 |
| 5 | `Milestones` 圖片路徑 | 低 | 它用 `/hero-*.jpg`（`public/` 根目錄），不是 `_web_ready/`。搬動區塊時不要順手改路徑 |
| 6 | `Facets` 的英文標籤未翻譯 | 低 | 已知 bug（§9.3）。若新區塊參照 `Facets` 的寫法，會一併複製這個問題 |

**建議做法（低風險路徑）**

1. 先在 `src/data/site.ts` 加 `PROOF_POINTS`（zh/en 各 3 條，欄位：`title` / `metric` / `desc` / `href`）。
2. 新建 `ProofPoints.astro`，只讀 `PROOF_POINTS`，內部用 `isEn` 三元切換。
3. 在兩個 `index.astro` **同一個位置**插入（建議放在 `Milestones` 之後、`MatrixPreview` 之前 —— 這是「先給證據、再給方法」的敘事順序）。
4. 排序時**不要動 `ConversionEntries` 與 `Contact` 的相對位置**（前者是漏斗、後者是終點）。
5. 手動在 `llms.txt` 補一句新區塊的主張。

---

### 10.2 (b) `/projects` 改成三個案例

**這是三個改動中風險最高的一項。**

**現況（先看清楚再動手）**

| 項目 | 事實 |
|---|---|
| 檔案 | `src/pages/projects.astro`（**214 行**）、`src/pages/en/projects.astro`（**214 行**） |
| 關係 | **兩份完全獨立的手寫檔案**，不是模板 + 資料 |
| 案例數量 | 2 個，各自 hardcode 一個 `<article>` |
| 案例標記 | `FILE_ID: CROSS_BORDER_AI`、`FILE_ID: BIO_HACKING`（純視覺標籤，不是資料 key） |
| 共享資料 | **冇**。`src/data/` 內沒有任何 project／case 資料檔 |
| 頁內額外 component | `Lab` **只在這兩頁出現**（全站唯一） |
| 頁面級 `<style is:global>` | 有，而且會覆寫 `body { background-color: #Fdfbf7 }` |
| 視覺語言 | 復古檔案櫃（Neo-brutalism）：3 點視窗 chrome、硬陰影 `shadow-[8px_8px_0_rgba(41,37,36,1)]`、「水面之上 / 水面之下」分割 |
| CTA | 「解鎖資源」→ `FORMS.resourceRequest`，**目前是空字串** → 全部 fallback 到 `#conversion` |

**會牽涉的檔案**

| 檔案 | 改動 |
|---|---|
| `src/pages/projects.astro` | 加第 3 個 `<article>`；或改成 map 一個資料陣列 |
| `src/pages/en/projects.astro` | **同上，英文文案逐段對應** |
| `src/data/site.ts` 或新檔 `src/data/projects.ts` | 若選擇資料驅動，案例內容搬來這裡（建議新檔，避免 `site.ts` 過度膨脹） |
| `src/components/Lab.astro` | 若第三個案例要放「方法論」段，需確認 `Lab` 仍只渲染一次 |
| `public/llms.txt` | 案例清單變動需手動同步 |

**具體風險**

| # | 風險 | 嚴重度 | 說明 |
|---|---|---|---|
| 1 | **雙檔重複地獄** | **極高** | 214 × 2 行的手寫 HTML。加第三個案例 = 在兩份檔案各複製貼上一大段。任何一處 class 或文案漏改，中英版就永久不一致。**建議先抽資料層，再加第三個案例**，否則第三次改版會更痛 |
| 2 | `is:global` 的 body 背景 | **高** | 這一頁用 `is:global` 把 body 改成 `#Fdfbf7`。目前安全（每次都是完整頁面載入），但**一旦引入 Astro View Transitions，這個背景會殘留到其他頁**。若 Claude 順手加 transitions，全站會變成米色底 |
| 3 | 硬陰影／3 點 chrome 要逐個複製 | 中 | 這些是 inline Tailwind class，不是共用 component。第 3 個案例要人手複製整套視覺，容易走樣（例如陰影 offset 不一致） |
| 4 | 「水面之上 / 水面之下」分割邏輯 | 中 | 這是頁面獨有的敘事結構（公開成果 vs 未公開方法）。第三個案例是否也需要？若要，等於再寫一套；若不要，視覺會突然斷裂 |
| 5 | `Lab` 的位置 | 中 | `Lab` 嵌在同一頁，且全站只此一處。加長頁面後要把 `Lab` 放對位置（通常在案例之後、Contact 之前），不要讓它被擠到很下面 |
| 6 | `resourceRequest` 為空 | 中 | 所有「解鎖資源」CTA 目前 fallback `#conversion`。第三個案例若也用這個 CTA，會出現「三個案例、同一個 fallback」，訪客感覺重複。要麼先填 Google Form，要麼改用不同 CTA 文案 |
| 7 | 兩個 `Contact` | 低 | 確認新版本仍然只有一個 `<Contact />`，且在頁尾 |

**建議做法**

1. **先重構、後加內容**：建 `src/data/projects.ts`，把現有兩個案例的 zh/en 文案、`FILE_ID`、標籤、連結全部結構化；`projects.astro` 改成 `PROJECTS.map()`。
2. 在資料層加第三個案例 → 一次改動、中英同步。
3. 視覺 shell（3 點 chrome、硬陰影）抽成一個 `CaseFile.astro`，避免三份複製。
4. **不要**在這個階段引入 View Transitions。若要引入，先處理 `is:global` body 背景（搬進 `Layout.astro` 用 `bodyClass` 控制）。

---

### 10.3 (c) books schema 加一個可選欄位 `project`

**這是三項中最安全的一項，但有一個必踩的坑。**

**現況**

`src/content.config.ts`（30 行）用 `glob` loader + `z` schema。現有 4 篇 `src/content/books/*.md` 全部通過驗證。

**會牽涉的檔案**

| 檔案 | 改動 | 必要性 |
|---|---|---|
| `src/content.config.ts` | 加 `project: z.string().optional()` | **必須** |
| `src/content/books/*.md`（4 篇） | 可選擇性補 `project:` frontmatter | 選填 |
| `src/pages/hub/index.astro` + `src/pages/en/hub/index.astro` | 若要顯示 `project`，需在卡片上加一行 | 只在「要顯示」時 |
| `src/pages/hub/[slug].astro` + `src/pages/en/hub/[slug].astro` | 同上；另外 JSON-LD（`VideoObject` / `Article`）區塊可能要加欄位 | 只在「要顯示」時 |
| `src/pages/insights/*` | **不受影響** | — |

**具體風險**

| # | 風險 | 嚴重度 | 說明 |
|---|---|---|---|
| 1 | **忘記 `.optional()` → 4 篇全部 build fail** | **極高** | Astro content collections 是嚴格驗證。加了必填欄位而 4 篇 md 都沒填，`npm run build` 會直接報錯並中止。這是本次改動唯一會「一改就爆」的地方 |
| 2 | 用 `z.enum([...])` 而不是 `z.string()` | 中 | 若專案名稱寫錯一個字（例如 `gai_store` vs `gai-store`），build 直接 fail。`cabinet` 欄位已經是 enum，證明這個 schema 是嚴格的。除非你確定專案集合永遠不變，否則用 `z.string().optional()` |
| 3 | 顯示層漏改 | 中 | 加了 schema 不等於會顯示。若 Brendon 期望「Hub 卡片上看到專案名」，要另外改 4 個 hub 檔案（中英各 2） |
| 4 | `hub/index.astro` 的 cabinet 是 hardcode | 中 | 四個櫃（corporate / published / future / methodology）在頁面裡是手寫的，不是從 schema 生成。加 `project` 不會自動產生新分組 |
| 5 | `image` 欄位的前車之鑑 | 低 | schema 已經有 `image?`，但 **4 篇書全部沒用**。說明「加了欄位但沒人填」是本專案的常態 → 加 `project` 前先確認 Brendon 真的會填 |

**建議做法**

```ts
// src/content.config.ts —— 只加這一行，放在 schema 物件內
project: z.string().optional(),
```

1. 先只改 schema + build 一次，確認 4 篇現有 md 全部通過。
2. 再決定是否在 hub 卡片顯示（若要，中英 4 個檔案一起改）。
3. 不要在這次改動中同時把 `cabinet` 改成自由字串 —— 那會影響 `hub/index.astro` 的分組邏輯。

---

### 10.4 三項改動的風險排序

| 改動 | 檔案數 | 中英同步難度 | Build 失敗風險 | 靜默失效風險 | 綜合 |
|---|---|---|---|---|---|
| (a) 首頁重排 + 新區塊 | 4–6 | 中（兩個 29 行檔案） | 低 | **高**（`#conversion` 錨點） | 🟡 中 |
| (b) `/projects` 三個案例 | 4–6 | **極高**（214 × 2 行手寫） | 低 | 中（`is:global` body 背景） | 🔴 高 |
| (c) schema 加 `project` | 1–5 | 低 | **高**（忘記 `.optional()`） | 低 | 🟡 中 |

**建議執行順序**：(c) → (a) → (b)。
先做最獨立、最容易驗證的 schema 改動；再做首頁（改動小、可即時肉眼驗證）；最後才碰 `/projects`（改動最大，且最好先重構再加內容）。

---

## §11 VPS 風險警告（最高優先閱讀）

> ⚠️ **這一節是整份文件最重要的部分。**
> 如果你（Claude）只讀一節，請讀這一節。
> 這部 VPS **不是** brendonlai.com 專屬。它同時跑住 **gai-store.com**、**hoff-industrial.com** 和 **n8n**。
> 一個看似無害的指令，可以令三個站同時下線。

### 11.0 一句話版本

**你只需要動 GitHub repository。**
**你不需要、也不應該 SSH 進入 VPS 做任何事。**
部署由 GitHub Actions 自動完成：build 在雲端、`rsync` 只寫入一個目錄、`docker compose` 只重建一個 container。

### 11.1 三條紅線（絕對不可以跨越）

| # | 紅線 | 為什麼 | 跨越後果 |
|---|---|---|---|
| **1** | **絕對不要在 VPS 上安裝 host-level nginx / Apache / Caddy** | VPS 的 80 / 443 端口**已經被 Traefik 佔用**（container `n8n-traefik-1`，v3.6.8）。Traefik 是所有站（brendonlai、gai-store、hoff-industrial、n8n）的唯一入口 | 端口衝突 → Traefik 起不來 → **四個服務同時 502**。而且 host nginx 會搶佔 80，令 ACME 憑證續期失敗，全站 HTTPS 逐個過期 |
| **2** | **絕對不要在 VPS 上 `npm install` / `npm run build`** | 這是一個靜態站，build **只在 GitHub Actions 的 runner 上做**。VPS 只存放 build 好的 `dist/` | 佔用 VPS 記憶體／CPU（可能拖死 n8n）；而且 Astro 6 需要 Node ≥22.12，VPS 上的 Node 版本未必符合，會產生難以診斷的錯誤 |
| **3** | **絕對不要改動其他專案的目錄、container、compose 檔** | `/var/www/` 下有 `brendonlai.com`、`gai-*`、`his-*`；`/docker/` 下有 `brendonlai/` 以及 n8n 的 compose。它們共享同一個 Docker daemon 和 Traefik network | 改錯 compose → 其他站重建失敗或掉線。這是最容易「好心做壞事」的地方 |

### 11.2 VPS 現況拓撲（你要知道自己在哪一格）

```
VPS <VPS IP：見 GitHub Secret VPS_HOST>  (<VPS hostname>)
│
├─ :80 / :443  ← 只有一個 listener：Traefik v3.6.8
│                container: n8n-traefik-1
│                network:   n8n_default（external）
│                ACME:      certresolver=mytlschallenge
│
├─ container: brendon-site        （nginx:alpine，唯讀掛載）
│    └─ /var/www/brendonlai.com/  ← rsync 的目標，約 2 MB
│
├─ container: gai-site            （gai-store.com）
├─ container: his-site            （hoff-industrial.com）
├─ container: n8n-*               （自動化 workflow）
│
└─ /docker/brendonlai/docker-compose.yml   ← 只屬於 brendonlai 的 compose project
```

**重點**：`brendon-site` 只是 Traefik 背後其中一個 upstream。它掛掉，其他站不受影響；但**你動 Traefik 或 80/443，四個站一起死**。

### 11.3 Traefik：共享的、全域的、不可亂碰的

Traefik 透過 Docker label 發現服務。brendonlai.com 靠這幾類 label 被接入：

| Label 類型 | 作用 | 你的責任 |
|---|---|---|
| `traefik.enable=true` | 讓 Traefik 接管這個 container | 保持 |
| `traefik.http.routers.brendon-*.rule=Host(...)` | 域名路由 | **名稱必須以 `brendon-` 開頭**，不可與 gai/his/n8n 撞名 |
| `traefik.http.routers.brendon-*.entrypoints=websecure` | 走 443 | 保持 |
| `traefik.http.routers.brendon-*.tls.certresolver=mytlschallenge` | 用共享 ACME resolver | **不要改成自己的 resolver**（會另開 ACME 帳戶／挑戰，可能撞 rate limit） |
| `traefik.http.services.brendon-*.loadbalancer.server.port=80` | 指向 container 內部 80 | 保持 |
| `traefik.docker.network=n8n_default` | 指定 Traefik 走哪個 network | **不要刪**，否則 Traefik 找不到這個 container → 404 |

**風險**：

- Router / service / middleware 名稱**全域唯一**。若你把 `brendon-site` 改叫 `site` 或 `web`，會與其他專案潛在撞名，Traefik 可能覆寫別人的 router。
- 改 `certresolver` 名 → 憑證簽不出來 → 全站 HTTPS 失效（而且瀏覽器會記住 HSTS）。
- 刪 `traefik.docker.network` → Traefik 看不到 container → 回 404，但 container 本身 running，極難診斷。

### 11.4 端口：80 / 443 是禁區

| 端口 | 現況 | 你可以做 |
|---|---|---|
| 80 | Traefik | ❌ 不可綁定任何其他東西 |
| 443 | Traefik | ❌ 同上 |
| 22 | SSH（GitHub Actions 用） | ⚠️ 只可經 `VPS_SSH_KEY` 使用，不要改 `sshd_config` |
| 其他 | 由各 container 內部使用 | 新服務應避免 `ports:` 直接映射，改用 Traefik label |

**特別注意**：`docker-compose.yml` 內**不要**加 `ports: - "80:80"` 或 `"443:443"`。靜態站只需要 `expose: 80` + Traefik label。

### 11.5 `rsync --delete`：最危險的一行

部署腳本使用 `rsync --delete` 把 `dist/` 同步到 `/var/www/brendonlai.com/`。

**這個參數的含義**：目標目錄內、來源沒有的檔案，**會被刪除**。

**安全前提**：`--delete` **必須**嚴格限定在 `/var/www/brendonlai.com/` 之內。

| 如果…… | 後果 |
|---|---|
| 路徑打成 `/var/www/` | **會刪掉 gai-store、hoff-industrial 的所有檔案** |
| 路徑打成 `/var/www/brendonlai.com` 少了結尾斜線 | rsync 語意改變，可能產生 `brendonlai.com/dist` 嵌套目錄，舊檔案不會被清 → 網站出現新舊混合 |
| 加了 `--delete-excluded` 或放寬 exclude | 可能刪掉不該刪的（例如上傳的圖片、憑證驗證檔） |

**交接要求**：**不要改動 deploy workflow 內的 rsync 路徑**。若真的要改，改完必須在 PR 描述寫明「目標路徑仍然是 `/var/www/brendonlai.com/`」。

### 11.6 `docker compose`：範圍要清楚

| 指令 | 在哪裡執行 | 影響範圍 |
|---|---|---|
| `docker compose up -d` | `/docker/brendonlai/` | ✅ 只重建 `brendon-site` |
| `docker compose down` | `/docker/brendonlai/` | ✅ 只停 `brendon-site`；**`/var/www/` 的檔案不受影響**（bind mount，不是 volume） |
| `docker compose down` | **在其他專案的目錄** | ❌ 會停掉別人的站 |
| `docker system prune -a` | 任何地方 | ❌ **絕對不要**。會刪掉所有未被使用的 image，包括 n8n / gai / his 的，下次重啟要重新 pull，期間全部 502 |
| `docker network prune` | 任何地方 | ❌ 可能刪掉 `n8n_default`，Traefik 直接失去所有 upstream |

**建議**：永遠用 `docker compose -f /docker/brendonlai/docker-compose.yml ...` 明確指定檔案，不要靠 `cd`。

### 11.7 GitHub Secrets：只讀，不要重新生成

部署依賴 4 個 repository secrets：

| Secret | 用途 | 注意 |
|---|---|---|
| `VPS_HOST` | `<VPS IP：見 GitHub Secret VPS_HOST>` | 不要改 |
| `VPS_PORT` | SSH 端口 | 不要改 |
| `VPS_USER` | 部署用戶 | 不要改 |
| `VPS_SSH_KEY` | 私鑰 | **不要重新生成**。一旦替換，舊公鑰失效，部署會立即失敗；而且如果該 key 同時用於其他專案，會一併斷掉 |

**風險**：Claude 若「為了安全」而 rotate SSH key，等於切斷自己和其他 CI 的部署通道，而且需要人手登入 VPS 改 `authorized_keys` 才能恢復。

### 11.8 DNS：已經設定好，不要碰

| Record | 值 |
|---|---|
| `A @` | `<VPS IP：見 GitHub Secret VPS_HOST>` |
| `A www` | `<VPS IP：見 GitHub Secret VPS_HOST>` |

**風險**：改 DNS 會影響整個域名（包括 `blog.brendonlai.com`，它是 WordPress，供 `posts.ts` 在 build 時抓取）。若 `blog.` 失效，`getPosts()` 會 catch 成 `[]`，**build 不會失敗**，但 `/insights` 會變成空頁 —— 這是一個靜默失敗（見 §5.4）。

### 11.9 部署流程：你唯一需要理解的路徑

```
git push origin main
   ↓
GitHub Actions (.github/workflows/deploy.yml)
   ↓  npm ci && npm run build        ← 在 GitHub runner，不是 VPS
   ↓  rsync --delete dist/ → VPS:/var/www/brendonlai.com/
   ↓  ssh: docker compose -f /docker/brendonlai/docker-compose.yml up -d
   ↓
Traefik 自動偵測 label → 對外服務
```

**你要遵守的**：

1. 只 push 到 `main` 就會自動部署。**沒有 staging 環境。**
2. 若只想預覽，用 `npm run dev`（本地 4321，`strictPort: true`）。
3. 部署失敗時，**不要**登入 VPS 手動修 —— 先看 Actions log。手動改 `/var/www/` 會被下一次 `rsync --delete` 覆蓋，製造「改了但沒生效」的假象。

### 11.10 「好心做壞事」清單（Claude 最可能犯的 8 個錯）

| # | 看似合理的動作 | 實際後果 |
|---|---|---|
| 1 | 「幫你裝個 nginx 做 reverse proxy 啦」 | 80/443 衝突 → 四站全掛 |
| 2 | 「在 VPS 上 build 一次試試」 | 記憶體不足 → n8n 被 OOM kill |
| 3 | 「`docker system prune` 清下空間」 | 刪掉其他站的 image → 重啟時全部 502 |
| 4 | 「`rsync -av --delete dist/ /var/www/`」 | 路徑少了 `brendonlai.com/` → 刪光其他站 |
| 5 | 「把 container 改名做 `web` 更清楚」 | Traefik router 撞名 / label 失效 → 404 |
| 6 | 「加個 `ports: 8080:80` 方便測試」 | 佔用端口；若剛好是別人用的，直接衝突 |
| 7 | 「rotate 一下 SSH key 比較安全」 | CI 部署斷掉，需要人手救 |
| 8 | 「加 View Transitions 提升體驗」 | `projects.astro` 的 `is:global` body 背景會殘留到全站（見 §7.4） |

### 11.11 動手前的安全檢查清單

在合併任何 PR 之前，逐項確認：

- [ ] 沒有新增任何 `ports:` 映射到 80 / 443
- [ ] 沒有改動 `traefik.http.routers.*` 的名稱前綴（必須仍是 `brendon-`）
- [ ] 沒有改動 `certresolver=mytlschallenge`
- [ ] 沒有改動 `traefik.docker.network=n8n_default`
- [ ] `rsync` 目標仍然是 `/var/www/brendonlai.com/`（有結尾斜線）
- [ ] 沒有新增 `docker system prune` / `network prune` 到任何腳本
- [ ] 沒有改動 4 個 GitHub Secrets
- [ ] 沒有改動 DNS
- [ ] `npm run build` 在本地通過（特別是 schema 改動後）
- [ ] 中英文兩份頁面都已同步

### 11.12 如果真的出事：回滾

| 情況 | 處理 |
|---|---|
| 部署後網站 404 | 檢查 container 是否 running：`docker ps`；檢查 Traefik label 是否仍在 |
| 部署後白屏／樣式全失 | 幾乎肯定是 Tailwind v4 token 問題（見 §7.3）：確認沒有 `tailwind.config.mjs`、`global.css` 的 `@theme` 仍在 |
| 影響到其他站 | **立即**在 GitHub revert 最後一個 commit 並 push，讓 Actions 重新部署回上一個版本。**不要**在 VPS 上手工操作 |
| Traefik 掛掉 | 這超出本專案範圍。找 Brendon，他需要檢查 `n8n-traefik-1` 的 log。**不要自行重啟 Traefik** —— 重啟可能令所有 ACME 憑證重新協商 |

**回滾原則**：**Git 是唯一真相**。VPS 上的檔案是產物，不是來源。任何「在 VPS 上修好」的做法，都會在下一次部署時被覆蓋，並且令問題更難追。

---

> **給 Claude 的最後一段話**
>
> 這個專案的程式碼本身不複雜 —— 14 個頁面、10 個 component、4 個資料檔。真正複雜的是**它與其他三個服務共用一部 VPS**。
>
> 如果你只改 `.astro`、`.ts`、`.md` 檔案，然後 push 到 `main`，基本上不會出事。
> 一旦你開始想「順手優化一下伺服器」，風險會指數上升。
>
> 有疑問的地方，寧願問 Brendon，都不要「先做再算」。

---

*文件結束。最後更新：2026-10-20。*


