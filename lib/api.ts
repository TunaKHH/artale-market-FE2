// API 服務層 - 廣播訊息相關 API
import {
  generateMockBroadcasts,
  filterMockBroadcasts,
  paginateMockBroadcasts,
  generateMockStats,
  isTestEnvironment,
  type MockBroadcastMessage,
} from "./mock-data"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

// 簡化的 API 追蹤 (只追蹤錯誤和搜尋)
const trackApiCall = (endpoint: string, success: boolean, searchTerm?: string) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    if (!success) {
      // 只追蹤失敗的 API 調用
      ;(window as any).gtag("event", "api_error", {
        api_endpoint: endpoint,
      })
    } else if (searchTerm) {
      // 追蹤搜尋行為
      ;(window as any).gtag("event", "search", {
        search_term: searchTerm,
      })
    }
  }
}

// 自定義錯誤類別
export class RateLimitError extends Error {
  public rateLimitInfo: any
  public retryAfter?: number

  constructor(message: string, rateLimitInfo: any, retryAfter?: number) {
    super(message)
    this.name = "RateLimitError"
    this.rateLimitInfo = rateLimitInfo
    this.retryAfter = retryAfter
  }
}

// 取得 API 速率限制資訊
export async function getRateLimits() {
  const response = await fetch(`${API_BASE_URL}/rate-limits`)

  if (!response.ok) {
    throw new Error(`速率限制資訊請求失敗: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// 通用 API 錯誤處理
async function handleApiResponse(response: Response, endpoint?: string): Promise<any> {
  if (response.ok) {
    // 追蹤成功的 API 調用
    if (endpoint) trackApiCall(endpoint, true)
    return response.json()
  }

  if (response.status === 429) {
    // 速率限制錯誤 - 自動取得限制資訊
    const retryAfter = response.headers.get("Retry-After")
    console.log("Response headers for 429:", {
      "retry-after": retryAfter,
      "x-ratelimit-limit": response.headers.get("X-RateLimit-Limit"),
      "x-ratelimit-remaining": response.headers.get("X-RateLimit-Remaining"),
      "x-ratelimit-reset": response.headers.get("X-RateLimit-Reset"),
      "all-headers": Array.from(response.headers.entries()),
    })
    const retrySeconds = retryAfter ? Number.parseInt(retryAfter) : undefined

    // 格式化等待時間訊息
    const formatWaitTime = (seconds?: number): string => {
      if (!seconds) return "請稍後再試"

      if (seconds < 60) {
        return `請等待 ${seconds} 秒後重試`
      }
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      if (remainingSeconds > 0) {
        return `請等待 ${minutes} 分 ${remainingSeconds} 秒後重試`
      }
      return `請等待 ${minutes} 分鐘後重試`
    }

    const waitMessage = formatWaitTime(retrySeconds)
    let rateLimitInfo = null

    // 嘗試獲取限制資訊，但不讓失敗影響主要錯誤訊息
    try {
      rateLimitInfo = await getRateLimits()
    } catch (rateLimitFetchError) {
      // 忽略獲取限制資訊的錯誤，使用 null
      console.warn("無法獲取速率限制資訊:", rateLimitFetchError)
    }

    const errorMessage = `API 請求頻率過高，${waitMessage}`
    console.log("RateLimitError created:", { errorMessage, retrySeconds, rateLimitInfo })

    throw new RateLimitError(errorMessage, rateLimitInfo, retrySeconds)
  }

  throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`)
}

export interface BroadcastMessage {
  id: number
  content: string
  channel: string
  player_name: string
  player_id?: string
  message_type: "buy" | "sell" | "team" | "other"
  timestamp: string
  ai_analyzed: boolean
  ai_confidence?: number
  ai_result?: any
}

export interface BroadcastStats {
  total_messages: number
  buy_messages: number
  sell_messages: number
  team_messages: number
  other_messages: number
  unique_players: number
  hourly_breakdown: Array<{
    hour: number
    count: number
  }>
}

export interface BroadcastsResponse {
  messages: BroadcastMessage[]
  total: number
  page: number
  page_size: number
  has_next: boolean
  has_prev: boolean
}

// 全域假資料快取
let mockBroadcastsCache: MockBroadcastMessage[] | null = null

// 取得或生成假資料
const getMockBroadcasts = (): MockBroadcastMessage[] => {
  if (!mockBroadcastsCache) {
    console.log("🧪 [測試模式] 生成假資料...")
    mockBroadcastsCache = generateMockBroadcasts(100) // 生成100筆假資料
  }
  return mockBroadcastsCache
}

// 使用假資料的廣播訊息 API
const getMockBroadcastsResponse = ({
  page = 1,
  pageSize = 50,
  messageType,
  playerName,
  keyword,
}: {
  page?: number
  pageSize?: number
  messageType?: string
  playerName?: string
  keyword?: string
}): BroadcastsResponse => {
  console.log("🧪 [假資料] 生成回應:", { page, pageSize, messageType, playerName, keyword })

  const allMockBroadcasts = getMockBroadcasts()

  // 應用篩選
  const filteredBroadcasts = filterMockBroadcasts(allMockBroadcasts, {
    messageType,
    playerName,
    keyword,
  })

  // 按時間排序（最新的在前面）
  filteredBroadcasts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // 分頁
  const result = paginateMockBroadcasts(filteredBroadcasts, page, Math.min(pageSize, 50))

  console.log("🧪 [假資料] 回應結果:", {
    總數: result.total,
    當前頁: result.page,
    訊息數量: result.messages.length,
    有下一頁: result.has_next,
  })

  return result
}

// 檢查是否應該直接使用假資料
const shouldDirectlyUseMockData = (): boolean => {
  // 如果在測試環境且 API_BASE_URL 指向不存在的服務，直接使用假資料
  const isTest = isTestEnvironment()
  const hasInvalidApi = !API_BASE_URL || API_BASE_URL.includes("localhost:8000")

  console.log("🔍 直接使用假資料檢查:", { isTest, hasInvalidApi, API_BASE_URL })

  return isTest && hasInvalidApi
}

// 取得廣播訊息列表
export async function getBroadcasts({
  page = 1,
  pageSize = 50,
  messageType,
  playerName,
  keyword,
}: {
  page?: number
  pageSize?: number
  messageType?: string
  playerName?: string
  keyword?: string
} = {}): Promise<BroadcastsResponse> {
  console.log("📡 [API] 開始請求廣播訊息:", { page, pageSize, messageType, playerName, keyword })

  // 檢查是否應該直接使用假資料
  if (shouldDirectlyUseMockData()) {
    console.log("🧪 [測試模式] 直接使用假資料，跳過 API 請求")
    return getMockBroadcastsResponse({
      page,
      pageSize: Math.min(Math.max(pageSize, 1), 50),
      messageType,
      playerName,
      keyword,
    })
  }

  // 強制限制每頁最多 50 筆，防止過載
  const limitedPageSize = Math.min(Math.max(pageSize, 1), 50)

  const params = new URLSearchParams({
    page: page.toString(),
    page_size: limitedPageSize.toString(),
  })

  if (messageType && messageType !== "all") {
    params.append("message_type", messageType)
  }

  if (playerName) {
    params.append("player_name", playerName)
  }

  if (keyword) {
    params.append("keyword", keyword)
  }

  try {
    console.log("📡 [API] 發送請求到:", `${API_BASE_URL}/broadcasts/?${params}`)

    const response = await fetch(`${API_BASE_URL}/broadcasts/?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // 設置超時時間
      signal: AbortSignal.timeout(10000), // 10秒超時
    })

    const endpoint = "/broadcasts"

    // 追蹤搜尋和篩選行為
    if (keyword) {
      trackApiCall(`${endpoint}/search`, response.ok, keyword)
    } else if (messageType && messageType !== "all") {
      trackApiCall(`${endpoint}/filter`, response.ok, messageType)
    } else {
      trackApiCall(endpoint, response.ok)
    }

    const result = await handleApiResponse(response, endpoint)
    console.log("✅ [API] 請求成功:", result)
    return result
  } catch (error) {
    console.error("❌ [API] 請求失敗:", error)

    // 在測試環境下使用假資料
    if (isTestEnvironment()) {
      console.log("🧪 [測試模式] API 失敗，切換到假資料")

      // 追蹤 API 失敗但使用假資料成功
      trackApiCall("/broadcasts", false)

      return getMockBroadcastsResponse({
        page,
        pageSize: limitedPageSize,
        messageType,
        playerName,
        keyword,
      })
    }

    // 非測試環境直接拋出錯誤
    throw error
  }
}

// 取得廣播統計資料
export async function getBroadcastStats(hours = 24): Promise<BroadcastStats> {
  console.log("📊 [API] 開始請求統計資料")

  // 檢查是否應該直接使用假資料
  if (shouldDirectlyUseMockData()) {
    console.log("🧪 [測試模式] 直接使用假統計資料")
    const mockBroadcasts = getMockBroadcasts()
    return generateMockStats(mockBroadcasts)
  }

  try {
    const response = await fetch(`${API_BASE_URL}/broadcasts/stats/?hours=${hours}`, {
      signal: AbortSignal.timeout(10000), // 10秒超時
    })
    const endpoint = "/broadcasts/stats"

    // 追蹤統計資料查詢
    trackApiCall(endpoint, response.ok, `hours_${hours}`)

    const result = await handleApiResponse(response, endpoint)
    console.log("✅ [統計] 請求成功:", result)
    return result
  } catch (error) {
    console.error("❌ [統計] 請求失敗:", error)

    // 在測試環境下使用假資料
    if (isTestEnvironment()) {
      console.log("🧪 [測試模式] 統計 API 失敗，使用假資料")
      const mockBroadcasts = getMockBroadcasts()
      return generateMockStats(mockBroadcasts)
    }

    throw error
  }
}

// 取得單一廣播訊息
export async function getBroadcastById(messageId: number): Promise<BroadcastMessage> {
  console.log("📄 [API] 開始請求單一廣播:", messageId)

  // 檢查是否應該直接使用假資料
  if (shouldDirectlyUseMockData()) {
    console.log("🧪 [測試模式] 直接使用假資料查找單一廣播")
    const mockBroadcasts = getMockBroadcasts()
    const broadcast = mockBroadcasts.find((b) => b.id === messageId)
    if (broadcast) {
      return broadcast
    }
    throw new Error("找不到指定的廣播訊息")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/broadcasts/${messageId}`, {
      signal: AbortSignal.timeout(10000), // 10秒超時
    })
    const result = await handleApiResponse(response)
    console.log("✅ [單一廣播] 請求成功:", result)
    return result
  } catch (error) {
    console.error("❌ [單一廣播] 請求失敗:", error)

    // 在測試環境下使用假資料
    if (isTestEnvironment()) {
      console.log("🧪 [測試模式] 單一廣播 API 失敗，使用假資料")
      const mockBroadcasts = getMockBroadcasts()
      const broadcast = mockBroadcasts.find((b) => b.id === messageId)
      if (broadcast) {
        return broadcast
      }
    }

    throw error
  }
}

// 取得玩家廣播訊息
export async function getPlayerBroadcasts(playerName: string, hours = 24): Promise<BroadcastMessage[]> {
  console.log("👤 [API] 開始請求玩家廣播:", playerName)

  // 檢查是否應該直接使用假資料
  if (shouldDirectlyUseMockData()) {
    console.log("🧪 [測試模式] 直接使用假資料查找玩家廣播")
    const mockBroadcasts = getMockBroadcasts()
    return mockBroadcasts.filter((b) => b.player_name.toLowerCase().includes(playerName.toLowerCase()))
  }

  const params = new URLSearchParams({
    hours: hours.toString(),
  })

  try {
    const response = await fetch(`${API_BASE_URL}/broadcasts/players/${encodeURIComponent(playerName)}?${params}`, {
      signal: AbortSignal.timeout(10000), // 10秒超時
    })
    const result = await handleApiResponse(response)
    console.log("✅ [玩家廣播] 請求成功:", result)
    return result
  } catch (error) {
    console.error("❌ [玩家廣播] 請求失敗:", error)

    // 在測試環境下使用假資料
    if (isTestEnvironment()) {
      console.log("🧪 [測試模式] 玩家廣播 API 失敗，使用假資料")
      const mockBroadcasts = getMockBroadcasts()
      return mockBroadcasts.filter((b) => b.player_name.toLowerCase().includes(playerName.toLowerCase()))
    }

    throw error
  }
}

// 搜尋廣播訊息（使用一般端點的 keyword 參數）
export async function searchBroadcasts({
  query,
  messageType,
  page = 1,
  pageSize = 50,
}: {
  query: string
  messageType?: string
  page?: number
  pageSize?: number
}): Promise<BroadcastsResponse> {
  console.log("🔍 [API] 開始搜尋廣播:", { query, messageType, page, pageSize })

  // 檢查是否應該直接使用假資料
  if (shouldDirectlyUseMockData()) {
    console.log("🧪 [測試模式] 直接使用假資料搜尋")
    return getMockBroadcastsResponse({
      page,
      pageSize: Math.min(Math.max(pageSize, 1), 50),
      messageType,
      keyword: query,
    })
  }

  // 強制限制每頁最多 50 筆，防止過載
  const limitedPageSize = Math.min(Math.max(pageSize, 1), 50)

  const params = new URLSearchParams({
    keyword: query, // 改用 keyword 參數
    page: page.toString(),
    page_size: limitedPageSize.toString(),
  })

  if (messageType && messageType !== "all") {
    params.append("message_type", messageType)
  }

  try {
    // 使用一般端點而非專門的搜尋端點
    const response = await fetch(`${API_BASE_URL}/broadcasts/?${params}`, {
      signal: AbortSignal.timeout(10000), // 10秒超時
    })
    const result = await handleApiResponse(response)
    console.log("✅ [搜尋] 請求成功:", result)
    return result
  } catch (error) {
    console.error("❌ [搜尋] 請求失敗:", error)

    // 在測試環境下使用假資料
    if (isTestEnvironment()) {
      console.log("🧪 [測試模式] 搜尋 API 失敗，使用假資料")

      return getMockBroadcastsResponse({
        page,
        pageSize: limitedPageSize,
        messageType,
        keyword: query,
      })
    }

    throw error
  }
}
