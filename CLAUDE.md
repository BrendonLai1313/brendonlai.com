# brendonlai.com — AI 協作規則

任何 AI（Claude、Trae 或其他）喺呢個 repo 做嘢之前，必須先讀完呢份文件。
完整背景見 `docs/SITE_HANDOFF.md`（2026-10-20 盤點）；**已確認嘅決定見 `docs/DECISIONS.md`**（兩者有衝突時以 DECISIONS 為準）。有疑問就問 Brendon，唔好「先做再算」。

## 1. 呢個站係咩

- Brendon Lai 嘅個人 IP 樞紐：一條主線「一個人 × AI = 一支團隊」，導流去轉化入口（sea-leap.com、gai-store.com）。hoff-industrial.com 已於 2026-10-21 撤出轉化入口，見 `docs/DECISIONS.md`。
- Astro 6.1.3 純靜態站 + Tailwind CSS 4.2.2（CSS-first `@theme`，冇 `tailwind.config.mjs`）。Node ≥ 22.12。
- 主工程就係呢個 repo 嘅根目錄（本機路徑 `REF_Brendonlai.com_Content_Hub_底层架构/website_engine/`）。Google Drive 頂層嗰個 `web/` 係廢棄舊版，唔好參考、唔好照抄。
- `README.md` 仍係 Astro 範本原文，唔可信；以呢份文件為準。

## 2. 工作流程（必守）

1. 開始前 `git pull`，確認冇人同時改緊（同一時間只由一個 AI 改）。
2. 一律開分支（例：`claude/<主題>`、`trae/<主題>`），**唔好直接 push `main`**。
3. 本地 `npm ci && npm run build` 必須通過；改版面要附預覽截圖。
4. 開 PR，由 Brendon 確認後合併。
5. **合併入 `main` = 即刻自動上線**（GitHub Actions → rsync → VPS），冇 staging。

## 3. 絕對唔可以掂（VPS 同其他站共用）

同一部 VPS 仲跑緊 gai-store.com、hoff-industrial.com 同 n8n，共用一個 Traefik。

- 唔好 SSH 入 VPS 做任何嘢；唔好喺 VPS 上 `npm install` / build。
- 唔好改 `.github/workflows/deploy.yml` 嘅 rsync 路徑（必須仍然係 `/var/www/brendonlai.com/`，有結尾斜線）。
- 唔好改 `deploy/docker-compose.yml` 嘅 Traefik label（`brendon-` 前綴、`certresolver=mytlschallenge`、`traefik.docker.network=n8n_default`），唔好加 `ports:` 映射 80 / 443。
- 唔好改 4 個 GitHub Secrets、唔好 rotate SSH key、唔好改 DNS。
- 唔好加 `docker system prune` / `network prune` 去任何腳本。
- 出事：喺 GitHub revert 上一個 commit 再 push，唔好喺 VPS 手動修。

## 4. 程式碼規則

- **`src/data/site.ts` 係唯一真理源**：轉化入口網址、聯絡方式、社群、表單全部喺度改，唔好喺 component 寫死 `https://gai-store.com` 之類。空字串 = 隱藏該項，係刻意設計，唔好加返 `href="#"` 或假資料。
- **中英文係兩份獨立檔案**：改 `src/pages/x.astro` 就要同步改 `src/pages/en/x.astro`；component 內 `isEn ? {} : {}` 兩個分支都要改。`/projects` 同 `/about-brendon` 最易漏。
- **`#conversion` 錨點**由 `ConversionEntries` 獨家擁有，全站 fallback 連結都靠佢；首頁唔可以移走或條件渲染呢個區塊。`Contact` 保持喺頁尾。
- 新 `<section>` 要加 `scroll-mt-*`（Header 係 fixed）。
- content collection（`src/content.config.ts`）係嚴格驗證：新欄位一定要 `.optional()`，否則現有 md 全部 build fail。
- 唔好引入 View Transitions（`projects.astro` 嘅 `is:global` body 背景會殘留全站）。
- 唔好一次過換走 Font Awesome 或重構成 i18n 字典。
- `public/llms.txt` 係人手維護：改主張、入口或案例時要同步更新。

## 5. 內容紅線（關乎法律，必守）

- **不點名**：唔提任何具體私營公司名（尤其唔好寫合資公司嘅名）。用「一間合資公司」「過往實戰案例」等匿名寫法。
  - **例外（2026-10-21 Brendon 批准）**：Brendon 嘅前僱主（Suntan Technology、Sumida、United Chemi-Con、RS Components、猎芯网 ichunt、Hoffmann Group）可以點名，只限僱傭事實（職位、年份、做過咩）；唔放 logo、唔寫成合作或代理、唔講公司結束或離職原因。2025 年嗰間東南亞公司**唔適用**，仍然匿名。
- **不講金額**：唔寫營業額、盈虧、毛利、投入、薪資等具體財務數字。
- **不指控**：唔講股東糾紛、法律爭議、離職是非。
- 品牌分離：個人站唔係 gai-store 產品目錄，唔放產品推銷。
- 唔寫任何密碼、Token、Key。
- GEO 可讀性優先於美觀。

## 6. 文案風格

- 網站中文用**簡體**（zh-CN），英文係俾東南亞客戶睇嘅敲門磚，清楚就得。
- 「輕鬆的人，硬核的事」：問題係主角，Brendon 係載體；唔好寫成成功人士自我表揚。
- 要「工業現場感」：真實照片優先，唔要 PPT 顧問感。
- 寧願訪客三秒就走，都唔好引來唔合適嘅詢價。

## 7. 改版路線圖（2026-10-20 已確認）

1. Hub：`content.config.ts` 加可選欄位 `project`；修正《一人公司第一课》摘要嘅紅線字眼；修 `Facets` 中文第三個標籤。
2. 首頁：新增「三個實證」區塊（資料放 `src/data/proofs.ts`），次序改為 Hero → 三個實證 → 轉化入口 → Facets → Milestones → Contact；`MatrixPreview` 移離首頁；更新 `<title>` 同 `llms.txt`。
3. `/projects`：先抽成 `src/data/projects.ts` + `CaseFile.astro`，再改為三個案例（A 東南亞 0→1 公司、B GAI 跨境出海、C EduStory）；導航中文「在途项目」改「实证案例」。
4. 每條新片上線後，喺 `src/content/books/` 加一篇並標 `project`。

每一步都要 Brendon 確認先做下一步。
