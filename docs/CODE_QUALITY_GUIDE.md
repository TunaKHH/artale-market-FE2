# 程式碼品質指南

## 🎯 品質標準

### TypeScript 型別安全
- ❌ 禁用 `any` 型別
- ✅ 使用具體型別或 `unknown`
- ✅ 為所有 props 和函數參數定義型別
- ✅ 使用型別守衛處理未知資料

### 日誌管理
- ❌ 不使用 `console.log` 直接輸出
- ✅ 使用 `@/lib/logger` 進行結構化日誌
- ✅ 生產環境自動過濾除錯日誌
- ✅ 錯誤日誌包含足夠的上下文資訊

### React 最佳實踐
- ✅ Hook 只在組件或自訂 Hook 中使用
- ✅ useEffect 依賴陣列正確填寫
- ✅ 避免在 render 中執行副作用
- ✅ 使用 TypeScript 嚴格模式

### 程式碼結構
- ✅ 遵循 DRY (Don't Repeat Yourself) 原則
- ✅ 保持 KISS (Keep It Simple, Stupid) 原則
- ✅ 應用 SOLID 原則
- ✅ YAGNI (You Aren't Gonna Need It) 原則

## 🛠️ 工具使用

### 自動修正工具
```bash
# 修正所有 console 語句
pnpm run fix:console

# 修正型別問題
pnpm run fix:types

# 一鍵修正所有問題
pnpm run fix:all

# 品質檢查
pnpm run quality:check
```

### 開發前檢查清單
- [ ] 執行 `pnpm lint` 確保無錯誤
- [ ] 執行 `pnpm build` 確保可建置
- [ ] 檢查 TypeScript 錯誤
- [ ] 確認無 console 語句洩漏

### 提交前檢查清單
- [ ] 程式碼遵循專案規範
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 錯誤或警告
- [ ] 建置成功
- [ ] 功能測試通過

## 🚨 常見問題

### 1. Any 型別問題
```typescript
// ❌ 錯誤
function processData(data: any) {
  return data.something
}

// ✅ 正確
interface DataType {
  something: string
}
function processData(data: DataType) {
  return data.something
}
```

### 2. Console 語句問題
```typescript
// ❌ 錯誤
console.log("API 請求成功", response)

// ✅ 正確
import { logger } from "@/lib/logger"
logger.api("請求成功", { response })
```

### 3. React Hook 問題
```typescript
// ❌ 錯誤
function handleClick() {
  const data = useCustomHook() // Hook 在事件處理器中
}

// ✅ 正確
function Component() {
  const data = useCustomHook() // Hook 在組件頂層

  function handleClick() {
    // 使用 data
  }
}
```

## 📊 品質指標

目標指標：
- ESLint 錯誤: 0
- TypeScript 錯誤: 0
- 建置警告: < 5
- Console 語句: 0 (除了 logger 檔案)
- Any 型別使用: 0

## 🔄 持續改進

每週品質檢查：
1. 執行完整品質檢查
2. 檢視品質指標
3. 識別改進機會
4. 更新品質標準

---

*遵循這些指南，我們可以維持高品質的程式碼標準！* 🎉