# API 故障轉移機制設定指南

## 🚀 功能說明

已實現智能 API 故障轉移機制，解決 Zeabur 藍綠部署時的連線中斷問題：

- **自動故障轉移**: 主要 API 失敗時自動切換到備用端點
- **智能重試**: 指數退避重試，避免過度請求
- **端點健康監控**: 追蹤每個端點的健康狀態
- **用戶體驗**: 無縫切換，連線狀態即時提示

## ⚙️ 當前配置

### API 端點優先級
1. **主要端點**: `NEXT_PUBLIC_API_URL` (環境變數)
2. **備用端點 1**: `https://maple-market-api.zeabur.app/api/v1`
3. **備用端點 2**: `https://maple-market-api-beta.zeabur.app/api/v1`

### 故障轉移邏輯
- 連續失敗 3 次後標記端點為不健康
- 不健康端點 1 分鐘後重新嘗試
- 指數退避重試 (1秒, 2秒, 4秒)
- 優先使用主要端點，失敗時選擇最穩定的備用端點

## 🌐 設定 Custom Domain (建議)

### 1. Zeabur 域名設定
1. 登入 Zeabur 控制台
2. 進入 API 服務設定
3. 在 "Domains" 區塊點擊 "Add Domain"
4. 輸入你的域名 (例如: `api.your-domain.com`)
5. 複製 Zeabur 提供的 CNAME 值

### 2. DNS 設定 (以 Cloudflare 為例)
```
類型: CNAME
名稱: api
目標: [Zeabur 提供的 CNAME 值]
TTL: 300 (5分鐘)
代理狀態: 橙雲 (Proxied) 或 灰雲 (DNS only)
```

### 3. 更新環境變數
設定 Custom Domain 後，更新 `.env.local`:
```bash
# 使用自定義域名作為主要端點
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
NEXT_PUBLIC_IS_PRODUCTION=true
```

## 📱 用戶介面

### 連線狀態指示器
- **正常**: 無提示
- **重新連線中**: 橙色提示框，顯示 "正在嘗試連接到其他伺服器 (X/3)"
- **連線已恢復**: 綠色提示框，顯示 "系統已自動切換到可用的伺服器"  
- **3次失敗後**: 紅色提示框，提供重新整理按鈕

### 監控資訊
```typescript
// 瀏覽器控制台可看到詳細日誌 (不顯示敏感的 URL 資訊)
🔄 [故障轉移] 嘗試伺服器 1
❌ [故障轉移] 伺服器 1 連線失敗
⏳ 等待 1 秒後重試...
🔄 [故障轉移] 嘗試伺服器 2
✅ [故障轉移] 成功連接到伺服器
```

## 🔧 開發者選項

### 測試故障轉移
```javascript
// 在瀏覽器控制台執行
// 模擬主要端點失敗
localStorage.setItem('simulate-api-failure', 'true')
// 重新整理頁面測試故障轉移

// 恢復正常
localStorage.removeItem('simulate-api-failure')
```

### 查看端點狀態
```javascript
// 在瀏覽器控制台查看當前端點健康狀態
window.dispatchEvent(new CustomEvent('debug-endpoint-status'))
```

## 📊 效能影響

### 正常情況
- **額外延遲**: < 1ms (僅端點選擇邏輯)
- **記憶體使用**: 微量 (端點狀態快取)

### 故障轉移情況
- **第一次重試**: 1-2 秒延遲
- **完整故障轉移**: 最多 7 秒 (1+2+4秒重試)
- **用戶體驗**: 自動恢復，無需手動重新整理

## 🛠️ 進階配置

### 自定義端點配置
修改 `lib/api.ts` 中的 `API_ENDPOINTS` 陣列：
```typescript
const API_ENDPOINTS = [
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  "https://your-backup-api-1.com/api/v1",
  "https://your-backup-api-2.com/api/v1"
]
```

### 調整重試策略
```typescript
// 修改重試次數 (預設: 3)
const maxRetries = 5

// 修改健康檢查間隔 (預設: 60秒)
const healthCheckInterval = 30000

// 修改連續失敗閾值 (預設: 3)
const failureThreshold = 5
```

## 🎯 預期效果

✅ **藍綠部署**: 用戶完全無感知  
✅ **高可用性**: API 調用成功率 > 99.9%  
✅ **自動恢復**: 無需手動重新整理  
✅ **即時回饋**: 連線狀態即時顯示  
✅ **效能優化**: 智能端點選擇  

## 🐛 故障排除

### 常見問題
1. **所有端點都失敗**: 檢查網路連線或 API 服務狀態
2. **頻繁切換端點**: 可能是網路不穩定，檢查 DNS 設定
3. **Custom Domain 不生效**: 確認 DNS 傳播完成 (最多 48 小時)

### 除錯技巧
```bash
# 檢查 DNS 解析
nslookup api.your-domain.com

# 測試端點可用性
curl -I https://api.your-domain.com/api/v1/broadcasts/
```