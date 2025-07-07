# Tool Maple Market Frontend

一個具有智慧自動收藏和智能選擇功能的即時 WebSocket 廣播監控工具。

## 功能特色

- 🔄 **即時 WebSocket 監控**: 監控即時廣播和交易訊息
- ⭐ **自動收藏**: 根據可自訂規則自動收藏訊息
- 🎯 **智能選擇**: 智慧訊息過濾和標亮功能
- 📊 **交易儀表板**: 追蹤買賣報價並提供詳細檢視
- 🌐 **多語言支援**: 提供多語言介面

## 技術 stack

- **框架**: Next.js 15 with React 19
- **樣式**: Tailwind CSS 與自訂元件
- **UI 元件**: Radix UI 原始元件
- **狀態管理**: React hooks 和 context
- **TypeScript**: 完整的類型安全
- **測試**: Jest 與 React Testing Library
- **套件管理**: pnpm

## 開始使用

### 前置需求

- Node.js 18+
- pnpm 9.0+

### 安裝

1. 複製儲存庫：
   ```bash
   git clone https://github.com/TunaKHH/artale-market-FE2.git
   cd artale-market-FE2
   ```

2. 安裝依賴：
   ```bash
   pnpm install
   ```

3. 設定環境變數：
   ```bash
   cp .env.example .env.local
   ```

   然後編輯 `.env.local` 文件，設定以下變數：
   ```
   # API 伺服器位址
   NEXT_PUBLIC_API_URL=https://your-api-server.com

   # 環境控制 (開發環境設為 false)
   NEXT_PUBLIC_IS_PRODUCTION=false
   ```

4. 啟動開發伺服器：
   ```bash
   pnpm dev
   ```

5. 在瀏覽器中打開 [http://localhost:3000](http://localhost:3000)

### 可用腳本

- `pnpm dev` - 啟動開發伺服器
- `pnpm build` - 建置生產版本
- `pnpm start` - 啟動生產伺服器
- `pnpm lint` - 執行 ESLint
- `pnpm test` - 執行測試
- `pnpm type-check` - 執行 TypeScript 檢查
- `pnpm quality:check` - 執行所有品質檢查 (lint, type-check, build)

## 專案結構

```
├── app/                    # Next.js app router 頁面
├── components/            # 可重複使用的 UI 元件
├── hooks/                 # 自訂 React hooks
├── lib/                   # 工具函式
├── __tests__/             # 測試檔案
└── public/                # 靜態資源
```

## 貢獻

1. Fork 此儲存庫
2. 建立功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -am 'Add your feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 開啟 Pull Request

## 授權條款

此專案採用 MIT 授權條款 - 詳情請見 [LICENSE](LICENSE) 檔案。
