# Code Review 修正清單

> **專案**: Tool Maple Market Frontend
> **檢查時間**: 2024-12-19
> **檢查範圍**: Git 工作區的 WebSocket 廣播和自動收藏功能

## 🚨 高優先級問題 (需立即修正)

### 1. 型別不一致導致的潛在執行時錯誤

**問題描述**: 專案中存在兩個不同的廣播訊息型別定義，導致型別不匹配和潛在的執行時錯誤。

**影響檔案**:
- `lib/types.ts` - 定義了 `BroadcastMessageWithFavorite`
- `@/lib/api` - 定義了 `BroadcastMessage` (需確認)
- `hooks/useWebSocketBroadcasts.ts` - 使用 `BroadcastMessage`
- `hooks/useMatchingProcessor.ts` - 期望 `BroadcastMessageWithFavorite`
- `lib/autoFavoriteUtils.ts` - 期望 `BroadcastMessageWithFavorite`

**問題詳情**:
```typescript
// lib/autoFavoriteUtils.ts:137
export const checkAutoFavoriteRules = (
  message: BroadcastMessageWithFavorite,  // 期望這個型別
  rules: AutoFavoriteRule[]
)

// hooks/useWebSocketBroadcasts.ts:47
interface ExtendedBroadcastMessage extends BroadcastMessage {  // 但使用這個型別
  isNew?: boolean
  newMessageTimestamp?: number
}
```

**修正建議**:
1. **統一型別定義** - 在 `lib/types.ts` 中創建統一的廣播訊息型別
2. **更新所有引用** - 將所有檔案改為使用統一型別
3. **添加型別檢查** - 使用 TypeScript strict mode 防止類似問題

**修正範例**:
```typescript
// lib/types.ts - 統一型別定義
export interface UnifiedBroadcastMessage {
  id: number
  content: string
  channel: string
  player_name: string
  player_id?: string
  message_type: "buy" | "sell" | "team" | "other"
  timestamp: string
  ai_analyzed: boolean
  ai_confidence?: number
  ai_result?: AIAnalysisResult

  // 收藏相關 (可選)
  isFavorited?: boolean
  favorited_at?: string
  autoFavorited?: boolean
  matchedRule?: string
  matchedKeywords?: string[]

  // WebSocket 相關 (可選)
  isNew?: boolean
  newMessageTimestamp?: number
}

// 更新所有檔案使用這個統一型別
```

**預估工時**: 2-3 小時

---

### 2. 非同步處理邏輯錯誤

**問題描述**: `hooks/useMatchingProcessor.ts` 中對同步函式使用了不必要的 `await`，可能導致效能問題和邏輯混亂。

**影響檔案**:
- `hooks/useMatchingProcessor.ts:23-33`

**問題詳情**:
```typescript
// 錯誤的非同步處理
const processMessage = useCallback(async (
  message: BroadcastMessageWithFavorite | FavoriteMessage
): Promise<MessageMatchEvent | null> => {
  const allMatches: MatchResult[] = [];

  for (const rule of rules.filter(r => r.isActive)) {
    const result = await checkAutoFavoriteRules(message, [rule]);  // 這裡不應該用 await
    // ...
  }
}, [rules]);
```

**修正建議**:
1. **移除不必要的 async/await** - `checkAutoFavoriteRules` 是同步函式
2. **簡化邏輯** - 直接使用同步呼叫
3. **優化效能** - 避免不必要的 Promise 包裝

**修正範例**:
```typescript
// 修正後的同步處理
const processMessage = useCallback((
  message: UnifiedBroadcastMessage
): MessageMatchEvent | null => {
  const allMatches: MatchResult[] = [];

  const activeRules = rules.filter(r => r.isActive);

  for (const rule of activeRules) {
    const result = checkAutoFavoriteRules(message, [rule]);  // 移除 await
    if (result.shouldAutoFavorite) {
      result.matchedRules.forEach(matchedRule => {
        allMatches.push({
          matched: true,
          matchedKeywords: matchedRule.matchedKeywords,
          rule: matchedRule.rule
        });
      });
    }
  }

  return allMatches.length > 0 ? { message, matchResults: allMatches } : null;
}, [rules]);
```

**預估工時**: 1 小時

---

## ⚠️ 中優先級問題 (建議儘快修正)

### 3. Memory Leak 風險

**問題描述**: `useWebSocketBroadcasts` hook 中的定時器和 WebSocket 連線在元件卸載時沒有正確清理。

**影響檔案**:
- `hooks/useWebSocketBroadcasts.ts`

**問題詳情**:
```typescript
// 缺少清理邏輯的 refs
const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
const requestCallbacksRef = useRef<Map<string, (response: WebSocketResponse) => void>>(new Map())
```

**修正建議**:
1. **添加清理邏輯** - 在 `useEffect` cleanup 中清理所有資源
2. **改善連線管理** - 確保 WebSocket 連線正確關閉
3. **清理回調函式** - 清空 request callbacks map

**修正範例**:
```typescript
// 在 useWebSocketBroadcasts hook 中添加
useEffect(() => {
  return () => {
    // 清理定時器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // 清理 WebSocket 連線
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }

    // 清理回調函式
    requestCallbacksRef.current.clear();
  };
}, []);
```

**預估工時**: 1-2 小時

---

### 4. 狀態管理不一致

**問題描述**: 收藏訊息的狀態散落在多個地方，容易造成資料不同步。

**影響檔案**:
- `components/feature/websocket/WebSocketBroadcastsPage.tsx`

**問題詳情**:
```typescript
// 多個相關狀態分散管理
const [favoriteCount, setFavoriteCount] = useState(0)
const [favoriteMessages, setFavoriteMessages] = useState<ExtendedBroadcastMessage[]>([])

// localStorage 操作分散在各處
const updateFavoriteCount = useCallback(() => {
  if (typeof window !== "undefined") {
    const favorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")
    setFavoriteCount(favorites.length)
    setFavoriteMessages(favorites)
  }
}, [])
```

**修正建議**:
1. **創建統一的收藏管理 hook** - `useFavoriteMessages`
2. **封裝 localStorage 操作** - 統一管理本地儲存
3. **使用 Context 或狀態管理庫** - 跨元件狀態共享

**修正範例**:
```typescript
// hooks/useFavoriteMessages.ts
export const useFavoriteMessages = () => {
  const [favorites, setFavorites] = useState<UnifiedBroadcastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem('broadcast-favorites');
      const parsed = stored ? JSON.parse(stored) : [];
      setFavorites(parsed);
    } catch (error) {
      console.error('載入收藏失敗:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addFavorite = useCallback((message: UnifiedBroadcastMessage, autoFavorited = false) => {
    const favoriteItem = {
      ...message,
      isFavorited: true,
      favorited_at: new Date().toISOString(),
      autoFavorited
    };

    setFavorites(prev => {
      const newFavorites = [favoriteItem, ...prev];
      localStorage.setItem('broadcast-favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const removeFavorite = useCallback((messageId: number) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(msg => msg.id !== messageId);
      localStorage.setItem('broadcast-favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    favoriteCount: favorites.length,
    isLoading,
    addFavorite,
    removeFavorite,
    reload: loadFavorites
  };
};
```

**預估工時**: 3-4 小時

---

### 5. 重複的規則檢查邏輯

**問題描述**: 規則啟用狀態的檢查在多個地方重複進行，造成不必要的效能損耗。

**影響檔案**:
- `lib/autoFavoriteUtils.ts:111` (isRuleMatch 函式)
- `lib/autoFavoriteUtils.ts:178` (checkAutoFavoriteRules 函式)

**問題詳情**:
```typescript
// isRuleMatch 中檢查
if (!rule.isActive) {
  console.log(`  ❌ 規則已停用`)
  return { isMatch: false, matchedKeywords: [] }
}

// checkAutoFavoriteRules 中又檢查一次
for (const rule of rules) {  // 應該過濾 isActive
  const { isMatch, matchedKeywords } = isRuleMatch(message, rule)
  // ...
}
```

**修正建議**:
1. **統一規則過濾邏輯** - 在呼叫端過濾啟用的規則
2. **簡化 isRuleMatch** - 移除內部的啟用狀態檢查
3. **優化效能** - 減少不必要的函式呼叫

**修正範例**:
```typescript
// 修正後的邏輯
export const checkAutoFavoriteRules = (
  message: UnifiedBroadcastMessage,
  rules: AutoFavoriteRule[]
): {
  shouldAutoFavorite: boolean
  matchedRules: Array<{
    rule: AutoFavoriteRule
    matchedKeywords: string[]
  }>
} => {
  console.log("🚀 開始檢查自動收藏規則");

  // 在這裡統一過濾啟用的規則
  const activeRules = rules.filter(rule => rule.isActive);
  console.log(`📋 啟用的規則數量: ${activeRules.length}`);

  const matchedRules: Array<{
    rule: AutoFavoriteRule
    matchedKeywords: string[]
  }> = [];

  for (const rule of activeRules) {
    const { isMatch, matchedKeywords } = isRuleMatch(message, rule); // 移除內部檢查

    if (isMatch) {
      matchedRules.push({ rule, matchedKeywords });
    }
  }

  return {
    shouldAutoFavorite: matchedRules.length > 0,
    matchedRules
  };
};

// 簡化後的 isRuleMatch (移除 isActive 檢查)
export const isRuleMatch = (
  message: UnifiedBroadcastMessage,
  rule: AutoFavoriteRule
): { isMatch: boolean; matchedKeywords: string[] } => {
  console.log(`🔎 檢查規則: "${rule.name}"`);

  // 檢查訊息類型篩選
  if (rule.messageTypes && rule.messageTypes.length > 0) {
    if (!rule.messageTypes.includes(message.message_type)) {
      console.log(`  ❌ 訊息類型不匹配`);
      return { isMatch: false, matchedKeywords: [] };
    }
  }

  // 檢查關鍵字匹配
  const matchedKeywords: string[] = [];

  for (const keyword of rule.keywords) {
    if (isKeywordMatch(message.content, keyword, rule.matchMode)) {
      matchedKeywords.push(keyword);
    }
  }

  return {
    isMatch: matchedKeywords.length > 0,
    matchedKeywords
  };
};
```

**預估工時**: 1-2 小時

---

## 📋 低優先級問題 (有時間再處理)

### 6. 效能優化 - TimeAgo 元件

**問題描述**: 每個 `TimeAgo` 元件都有自己的定時器，在大量訊息時會造成效能問題。

**影響檔案**:
- `components/feature/websocket/WebSocketBroadcastsPage.tsx:36-89`

**修正建議**:
1. **使用全域定時器** - 一個定時器更新所有時間顯示
2. **優化更新頻率** - 根據時間差動態調整更新頻率
3. **使用 memo 優化** - 避免不必要的重新渲染

**修正範例**:
```typescript
// hooks/useGlobalTimeUpdater.ts
export const useGlobalTimeUpdater = () => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // 每分鐘更新一次

    return () => clearInterval(interval);
  }, []);

  return currentTime;
};

// 優化後的 TimeAgo 元件
const TimeAgo = React.memo(({ timestamp }: { timestamp: string }) => {
  const currentTime = useGlobalTimeUpdater();

  const timeDisplay = useMemo(() => {
    // 計算時間差邏輯
    // ...
  }, [timestamp, currentTime]);

  return <span>{timeDisplay}</span>;
});
```

**預估工時**: 2-3 小時

---

### 7. 錯誤處理改進

**問題描述**: WebSocket 連線錯誤處理不夠完善，缺少針對不同錯誤類型的處理策略。

**影響檔案**:
- `hooks/useWebSocketBroadcasts.ts`

**修正建議**:
1. **分類錯誤處理** - 網路錯誤、認證錯誤、伺服器錯誤等
2. **添加重試策略** - 指數退避演算法
3. **使用者友善的錯誤訊息** - 根據錯誤類型顯示適當訊息

**修正範例**:
```typescript
// 錯誤處理增強
const handleWebSocketError = useCallback((event: Event) => {
  console.error('WebSocket 連線錯誤:', event);

  // 根據錯誤類型設定不同的處理策略
  let errorMessage = '連線發生錯誤';
  let shouldRetry = true;
  let retryDelay = reconnectInterval;

  if (event instanceof ErrorEvent) {
    switch (event.error?.code) {
      case 'NETWORK_ERROR':
        errorMessage = '網路連線異常，請檢查網路設定';
        retryDelay = Math.min(retryDelay * 2, 30000); // 指數退避
        break;
      case 'AUTH_ERROR':
        errorMessage = '認證失敗，請重新登入';
        shouldRetry = false;
        break;
      case 'SERVER_ERROR':
        errorMessage = '伺服器暫時無法回應，稍後將自動重試';
        break;
      default:
        errorMessage = '未知錯誤，正在嘗試重新連線';
    }
  }

  setError(errorMessage);
  setConnectionState('error');

  if (shouldRetry && reconnectAttemptsRef.current < maxReconnectAttempts) {
    setTimeout(() => {
      if (!isManualDisconnectRef.current) {
        connect();
      }
    }, retryDelay);
  }
}, [reconnectInterval, maxReconnectAttempts, connect]);
```

**預估工時**: 2-3 小時

---

---

## 🚨 品質指南違規問題 (需立即修正)

### 8. 大量 Console 語句違規

**問題描述**: 根據品質指南，不應直接使用 `console.log` 等語句，應使用結構化的 `@/lib/logger` 系統，但多個檔案仍存在大量 console 語句。

**影響檔案**:
- `hooks/useWebSocketBroadcasts.ts` - 多處 console.log、console.error
- `lib/autoFavoriteUtils.ts` - 大量除錯用的 console.log
- `components/feature/websocket/WebSocketBroadcastsPage.tsx` - console.error 使用
- `components/feature/websocket/ErrorBoundary.tsx` - console.error 使用
- `components/feature/auto-favorite/SimpleAutoFavoriteManager.tsx` - console.log 使用

**問題詳情**:
```typescript
// ❌ 違規範例 - hooks/useWebSocketBroadcasts.ts
console.error("❌ WebSocket 伺服器錯誤:", errorMessage, errorPayload)
console.log("🔄 WebSocket 將在 ${delay}ms 後重連")
console.log("🔌 手動斷開 WebSocket 連線")

// ❌ 違規範例 - lib/autoFavoriteUtils.ts
console.log("🚀 開始檢查自動收藏規則 @", new Date().toISOString())
console.log("📋 當前規則列表:", rules.map(...))
console.log(`🔎 檢查規則: "${rule.name}"`)
```

**修正建議**:
1. **全面替換 console 語句** - 使用專案現有的 `@/lib/logger` 系統
2. **執行自動修正腳本** - 專案已有 `scripts/replace-console.js` 工具
3. **更新 ESLint 配置** - 將 `no-console` 從 `warn` 提升為 `error`

**修正範例**:
```typescript
// ✅ 修正後 - 使用 logger 系統
import { logger } from "@/lib/logger"

// 替換 console.error
logger.error("WebSocket 伺服器錯誤", { errorMessage, errorPayload })

// 替換 console.log (連線相關)
logger.info(`WebSocket 將在 ${delay}ms 後重連`, { attempt: reconnectAttemptsRef.current + 1 })

// 替換 console.log (規則檢查)
logger.debug("開始檢查自動收藏規則", { rulesCount: rules.length })
logger.debug(`檢查規則: ${rule.name}`, { rule: { id: rule.id, keywords: rule.keywords } })
```

**自動修正命令**:
```bash
# 執行專案提供的自動修正工具
pnpm run fix:console
```

**預估工時**: 2-3 小時

---

### 9. any 型別使用問題

**問題描述**: 品質指南禁止使用 `any` 型別，但在 WebSocket 相關檔案中仍有使用。

**影響檔案**:
- `hooks/useWebSocketBroadcasts.ts:25` - `payload?: any`

**問題詳情**:
```typescript
// ❌ 違規範例
interface WebSocketMessage {
  type: string
  request_id?: string
  payload?: any  // 違反品質指南
}

interface WebSocketRequest {
  type: "get_latest" | "get_before" | "subscribe_new" | "unsubscribe" | "ping"
  request_id: string
  payload?: any  // 違反品質指南
}

interface WebSocketResponse {
  type: "latest_data" | "history_data" | "new_message" | "subscription_confirmed" | "unsubscription_confirmed" | "pong" | "error" | "connection_info"
  request_id?: string
  payload?: any  // 違反品質指南
}
```

**修正建議**:
1. **定義具體的 payload 型別** - 根據不同的訊息類型定義聯合型別
2. **使用 unknown 型別** - 對於真正未知的資料使用 `unknown` 而非 `any`
3. **添加型別守衛** - 在處理 payload 時進行型別檢查

**修正範例**:
```typescript
// ✅ 修正後 - 定義具體型別
interface WebSocketRequestPayload {
  limit?: number
  timestamp?: string
  before?: string
}

interface WebSocketResponsePayload {
  messages?: BroadcastMessage[]
  message?: BroadcastMessage
  count?: number
  hasMore?: boolean
  error?: string
}

interface WebSocketMessage {
  type: string
  request_id?: string
  payload?: unknown  // 使用 unknown 替代 any
}

interface WebSocketRequest {
  type: "get_latest" | "get_before" | "subscribe_new" | "unsubscribe" | "ping"
  request_id: string
  payload?: WebSocketRequestPayload
}

interface WebSocketResponse {
  type: "latest_data" | "history_data" | "new_message" | "subscription_confirmed" | "unsubscription_confirmed" | "pong" | "error" | "connection_info"
  request_id?: string
  payload?: WebSocketResponsePayload
}

// 添加型別守衛
const isValidPayload = (payload: unknown): payload is WebSocketResponsePayload => {
  return payload !== null && typeof payload === 'object'
}
```

**預估工時**: 1-2 小時

---

### 10. TypeScript 嚴格模式配置不足

**問題描述**: 品質指南要求使用 TypeScript 嚴格模式，但目前 `tsconfig.json` 配置可能不夠嚴格。

**影響檔案**:
- `tsconfig.json`

**問題詳情**:
```json
// 當前配置可能缺少一些嚴格檢查
{
  "compilerOptions": {
    "strict": true,
    // 可能缺少其他嚴格選項
  }
}
```

**修正建議**:
1. **啟用所有嚴格檢查** - 確保型別安全性
2. **添加額外的嚴格選項** - 提高程式碼品質
3. **更新 ESLint 配置** - 與 TypeScript 配置保持一致

**修正範例**:
```json
// ✅ 加強版 tsconfig.json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "target": "ES6",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,

    // 添加額外的嚴格檢查
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**預估工時**: 30 分鐘

---

## 🔧 其他改進建議

### 11. 程式碼品質提升

**建議項目**:
1. **添加 ESLint 規則** - 強制一致的程式碼風格
2. **使用 Prettier** - 自動格式化程式碼
3. **添加單元測試** - 特別是 hooks 和工具函式
4. **添加 TypeScript strict 設定** - 提高型別安全性

### 12. 使用者體驗改進

**建議項目**:
1. **載入狀態指示器** - 顯示資料載入進度
2. **錯誤重試按鈕** - 讓使用者手動重試失敗的操作
3. **通知權限引導** - 更好的通知權限請求流程
4. **離線狀態處理** - 網路斷線時的降級處理

### 13. 除錯程式碼清理

**問題描述**: 多個檔案包含大量除錯用的 console 語句，影響生產環境效能。

**修正建議**:
1. **移除除錯程式碼** - 特別是 `lib/autoFavoriteUtils.ts` 中的詳細日誌
2. **條件式日誌** - 使用環境變數控制日誌等級
3. **效能優化** - 減少不必要的字串處理和物件建立

**修正範例**:
```typescript
// ❌ 當前過度詳細的除錯日誌
console.log("📋 當前規則列表:", rules.map(r => ({ id: r.id, name: r.name, keywords: r.keywords, isActive: r.isActive })))
rules.forEach((rule, index) => {
  console.log(`📌 規則 ${index + 1}:`, {
    name: rule.name,
    keywords: rule.keywords,
    isActive: rule.isActive,
    messageTypes: rule.messageTypes,
    matchMode: rule.matchMode,
    matchCount: rule.matchCount
  })
})

// ✅ 修正後 - 簡化且條件式日誌
if (process.env.NODE_ENV === 'development') {
  logger.debug("檢查自動收藏規則", {
    rulesCount: rules.length,
    activeRulesCount: rules.filter(r => r.isActive).length
  })
}
```

**預估工時**: 1-2 小時

---

## 📝 修正優先級排序

1. **立即修正** (影響功能正常運作):
   - 型別不一致問題
   - 非同步處理邏輯錯誤
   - **大量 Console 語句違規** ⭐ (品質指南違規)
   - **any 型別使用問題** ⭐ (品質指南違規)

2. **儘快修正** (影響穩定性和效能):
   - Memory Leak 風險
   - 狀態管理不一致
   - 重複的規則檢查邏輯
   - TypeScript 嚴格模式配置不足

3. **有時間再處理** (優化使用者體驗):
   - TimeAgo 元件效能優化
   - 錯誤處理改進
   - 除錯程式碼清理
   - 其他品質提升項目

---

## 📊 預估總工時

- **高優先級**: 7-10 小時 (新增品質指南相關修正)
- **中優先級**: 7-10 小時
- **低優先級**: 6-9 小時
- **總計**: 20-29 小時

**建議執行順序**:
1. **第一階段** (4-5 小時): 執行自動修正工具處理 console 和 any 型別問題
2. **第二階段** (3-5 小時): 修正型別不一致和非同步邏輯問題
3. **第三階段** (7-10 小時): 處理記憶體洩漏和狀態管理問題
4. **第四階段** (6-9 小時): 效能優化和使用者體驗改進

## 🚀 快速修正命令

專案已提供自動修正工具，可快速處理品質指南相關問題：

```bash
# 修正所有 console 語句 (約節省 2 小時手動工作)
pnpm run fix:console

# 修正型別問題 (約節省 1 小時手動工作)
pnpm run fix:types

# 一鍵修正所有問題
pnpm run fix:all

# 品質檢查
pnpm run quality:check
```

使用這些工具可將總工時從 20-29 小時減少到 17-26 小時。

---

*最後更新時間: 2024-12-19*
*檢查者: Claude Assistant*