# 環境變數配置說明

## 環境控制

本專案使用 `NEXT_PUBLIC_IS_PRODUCTION` 環境變數來控制是否為正式站環境。

### 設定方式

#### 本地開發
在 `.env.local` 檔案中設定：
\`\`\`bash
NEXT_PUBLIC_IS_PRODUCTION=false  # 開發環境，會使用假資料
\`\`\`

#### 正式站部署
在 `.env.production` 或 Vercel 環境變數中設定：
\`\`\`bash
NEXT_PUBLIC_IS_PRODUCTION=true   # 正式站，不使用假資料
\`\`\`

### 環境檢測邏輯

1. **優先順序**: 環境變數 > 域名檢測 > NODE_ENV
2. **正式站域名**: 
   - `artale-love.com`
   - `www.artale-love.com`
   - `artale-market-fe.vercel.app`

### 行為差異

| 環境 | 假資料 | API 失敗處理 | 測試模式提示 |
|------|--------|------------|------------|
| 開發/測試 | ✅ 使用 | 自動切換假資料 | ✅ 顯示 |
| 正式站 | ❌ 不使用 | 顯示錯誤訊息 | ❌ 隱藏 |

### Vercel 部署設定

在 Vercel 專案設定中加入環境變數：
\`\`\`
NEXT_PUBLIC_IS_PRODUCTION=true
\`\`\`

### 除錯

開啟瀏覽器 Console 可以看到環境檢測資訊：
\`\`\`
🔍 環境檢測: { hostname: "localhost", isProduction: false, env: "false" }
\`\`\`
