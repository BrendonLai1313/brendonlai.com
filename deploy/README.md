# brendonlai.com 部署說明

本目錄係 **brendonlai.com** 靜態站嘅部署設定。架構完全跟隨 VPS 上已有嘅 `gai-store.com` / `hoff-industrial.com`（同一套 Docker + Traefik）。

---

## 一、架構總覽

```
GitHub  BrendonLai1313/brendonlai.com  (branch: main)
   │  git push
   ▼
GitHub Actions  ──  npm ci && npm run build   ← 雲端 build，唔食 VPS 資源
   │  rsync over SSH（用 VPS_SSH_KEY）
   ▼
VPS  72.60.208.120  (srv1036376.hstgr.cloud)
   /var/www/brendonlai.com/          ← 純靜態 dist（約 2 MB）
   │  bind mount（唯讀 :ro）
   ▼
容器 brendon-site  (nginx:alpine)  ── Traefik labels（Host + certresolver=mytlschallenge）
   │  加入既有 network  n8n_default
   ▼
Traefik v3.6.8  (n8n-traefik-1)  ── 自動 Let's Encrypt TLS-ALPN-01，自動續期
   ▼
https://brendonlai.com   ✅
```

**三個硬性約束（已遵守）**
1. 只用 Docker 容器 + Traefik labels，**唔喺主機層裝 nginx**（避免同 Traefik 撞 port 80/443）。
2. **唔喺 VPS 上 build**：build 一律喺 GitHub Actions（或本地）完成，只推成品靜態檔。
3. **完全隔離**：獨立目錄 `/var/www/brendonlai.com/`、獨立容器 `brendon-site`、獨立 compose 專案 `/docker/brendonlai/`，同 hoff / gai / n8n 互不影響。

---

## 二、一次性設定（Setup，只需做一次）

### 1. DNS
將 `brendonlai.com` 嘅 DNS 由 Hostinger 共用主機改指去 VPS：

| 類型 | 名稱 | 值 | TTL |
|------|------|----|----|
| A | `@` | `72.60.208.120` | 預設 |
| A | `www` | `72.60.208.120` | 預設 |

> Traefik 要等 DNS 指過嚟、同 port 443 通到，先可以自動簽到 HTTPS 憑證（TLS-ALPN-01）。一般 5 分鐘內完成。

### 2. GitHub Actions Secrets
去 `https://github.com/BrendonLai1313/brendonlai.com/settings/secrets/actions`，
新增 4 個 **Repository secrets**：

| Secret 名稱 | 值 |
|-------------|----|
| `VPS_HOST` | `72.60.208.120` |
| `VPS_PORT` | `22` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | VPS 上 `/root/.ssh/github_actions` 嘅完整內容（含 `-----BEGIN/END` 頭尾） |

### 3. 起容器（VPS 上，只一次）
```bash
cd /docker/brendonlai
docker compose up -d
```

---

## 三、日常更新（之後每次改網站）

```bash
git add -A
git commit -m "更新內容"
git push
```
推上 `main` 之後，GitHub Actions 會自動 build ＋ 部署，**唔使再手動做任何嘢**。

想即刻手動觸發：GitHub repo → **Actions** → `Deploy to VPS (brendonlai.com)` → **Run workflow**。

---

## 四、維運常用指令（VPS 上）

```bash
cd /docker/brendonlai

docker compose ps            # 睇容器狀態
docker compose logs -f       # 睇 nginx log
docker compose restart       # 重啟
docker compose down          # 停站 + 刪容器（/var/www 檔案保留）
docker compose up -d         # 重新起站

# 改完檔案唔使重啟（nginx 直接讀檔）
ls -la /var/www/brendonlai.com
```

---

## 五、回滾 / 出事點算

- **改壞容器設定**：`docker compose down && docker compose up -d`
- **改壞網站內容**：喺 GitHub push 返上一個好版本，等 Actions 自動覆蓋；或喺本機 `npm run build` 後手動 `rsync` 上去。
- **憑證問題**：確認 DNS 已指向 `72.60.208.120`、port 443 對外開放；Traefik 會自動重簽，可睇 `docker logs n8n-traefik-1`。

---

## 六、檔案說明

| 檔案 | 用途 |
|------|------|
| `docker-compose.yml` | nginx:alpine 容器 + Traefik labels（VPS 上放 `/docker/brendonlai/`） |
| `../.github/workflows/deploy.yml` | GitHub Actions：push → build → rsync 上 VPS |
| `README.md` | 本文件 |
