// API 服務層 - 廣播訊息相關 API
import {
  generateMockBroadcasts,
  filterMockBroadcasts,
  paginateMockBroadcasts,
  generateMockStats,
  isTestEnvironment,
  type MockBroadcastMessage,
} from "./mock-data"
import { emitConnectionChange } from "../hooks/useConnectionStatus"

// 多端點配置 - 支援故障轉移
const API_ENDPOINTS = [
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  "https://api.artale-love.com",
  "https://maple-market-api.zeabur.app",
  "https://maple-market-api-beta.zeabur.app",
].filter(Boolean) // 移除空值

const API_BASE_URL = API_ENDPOINTS[0] // 預設主要端點

// 端點狀態快取
interface EndpointStatus {
  url: string
  isHealthy: boolean
  lastChecked: number
  consecutiveFailures: number
}

const endpointStatuses: EndpointStatus[] = API_ENDPOINTS.map((url) => ({
  url,
  isHealthy: true,
  lastChecked: 0,
  consecutiveFailures: 0,
}))

// 取得健康的端點
const getHealthyEndpoint = (): string => {
  const now = Date.now()
  const healthyEndpoints = endpointStatuses.filter(
    (status) => status.isHealthy || now - status.lastChecked > 60000, // 1分鐘後重試
  )

  if (healthyEndpoints.length === 0) {
    console.warn("⚠️ 所有端點都不健康，使用第一個端點")
    return API_ENDPOINTS[0]
  }

  // 優先選擇主要端點，然後是失敗次數最少的
  const sorted = healthyEndpoints.sort((a, b) => a.consecutiveFailures - b.consecutiveFailures)
  return sorted[0].url
}

// 標記端點為失敗
const markEndpointFailed = (url: string) => {
  const status = endpointStatuses.find((s) => s.url === url)
  if (status) {
    status.consecutiveFailures++
    status.lastChecked = Date.now()
    if (status.consecutiveFailures >= 3) {
      status.isHealthy = false
      console.warn(`⚠️ 伺服器標記為不健康 (連續失敗 ${status.consecutiveFailures} 次)`)
    }
  }
}

// 標記端點為成功
const markEndpointSuccess = (url: string) => {
  const status = endpointStatuses.find((s) => s.url === url)
  if (status) {
    status.isHealthy = true
    status.consecutiveFailures = 0
    status.lastChecked = Date.now()
  }
}

// 智能重試 fetch 函數
const fetchWithFailover = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  let lastError: Error | null = null
  let totalFailoverCount = 0

  // 最多嘗試 3 次 (所有端點)
  const maxAttempts = 3
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const baseUrl = getHealthyEndpoint()
    const fullUrl = `${baseUrl}/api/v1${endpoint}`

    try {
      console.log(`🔄 [故障轉移] 嘗試伺服器 ${attempt + 1}`)

      const response = await fetch(fullUrl, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10秒超時
      })

      markEndpointSuccess(baseUrl)
      console.log(`✅ [故障轉移] 成功連接到伺服器`)

      // 發送連線成功事件 (不包含 URL)
      emitConnectionChange(true, `server_${attempt + 1}`, totalFailoverCount)

      return response
    } catch (error) {
      console.warn(`❌ [故障轉移] 伺服器 ${attempt + 1} 連線失敗`)
      markEndpointFailed(baseUrl)
      lastError = error as Error
      totalFailoverCount++

      // 發送連線失敗事件 (不包含 URL)
      emitConnectionChange(false, `server_${attempt + 1}`, totalFailoverCount)

      // 如果不是最後一次嘗試，等待一下再重試
      if (attempt < maxAttempts - 1) {
        console.log(`⏳ 等待 ${attempt + 1} 秒後重試...`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))) // 指數退避
      }
    }
  }

  throw lastError || new Error("所有 API 端點都無法存取")
}

// 增強的 API 追蹤 (追蹤錯誤、搜尋和結果)
const trackApiCall = (endpoint: string, success: boolean, searchTerm?: string, resultCount?: number) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    if (!success) {
      // 追蹤失敗的 API 調用
      ;(window as any).gtag("event", "api_error", {
        api_endpoint: endpoint,
        search_term: searchTerm || "unknown",
      })
    } else if (searchTerm) {
      // 追蹤搜尋行為和結果
      ;(window as any).gtag("event", "search", {
        search_term: searchTerm,
        result_count: resultCount || 0,
        has_results: (resultCount || 0) > 0,
        endpoint: endpoint,
      })

      // 特別追蹤無結果搜尋
      if ((resultCount || 0) === 0) {
        ;(window as any).gtag("event", "search_no_results", {
          search_term: searchTerm,
          endpoint: endpoint,
        })
      }
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
  const response = await fetchWithFailover("/rate-limits")

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
  // 強制使用真實 API 進行測試
  const forceUseRealApi = true
  if (forceUseRealApi) {
    console.log("🚀 [強制模式] 使用真實 API，跳過假資料")
    return false
  }

  // 如果在測試環境且 API_BASE_URL 指向不存在的服務，直接使用假資料
  const isTest = isTestEnvironment()
  const hasInvalidApi = !API_BASE_URL

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
  initialLoad = false,
  hours = 168, // 預設搜尋 7 天 (168 小時)
}: {
  page?: number
  pageSize?: number
  messageType?: string
  playerName?: string
  keyword?: string
  initialLoad?: boolean
  hours?: number
} = {}): Promise<BroadcastsResponse> {
  console.log("📡 [API] 開始請求廣播訊息:", { page, pageSize, messageType, playerName, keyword, initialLoad, hours })

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

  // 首次載入時使用 5000（後端會忽略此值並返回全部），否則限制為500筆
  const limitedPageSize = initialLoad ? 5000 : Math.min(Math.max(pageSize, 1), 500)

  const params = new URLSearchParams({
    page: page.toString(),
    page_size: limitedPageSize.toString(),
    hours: hours.toString(), // 加入時間範圍參數
  })

  // 加入首次載入參數
  if (initialLoad) {
    params.append("initial_load", "true")
  }

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
    console.log("📡 [API] 發送請求:", `/broadcasts/?${params}`)

    const response = await fetchWithFailover(`/broadcasts/?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const endpoint = "/broadcasts"

    const result = await handleApiResponse(response, endpoint)
    const resultCount = result?.total || result?.messages?.length || 0

    // 追蹤搜尋和篩選行為
    if (keyword) {
      trackApiCall(`${endpoint}/search`, response.ok, keyword, resultCount)
    } else if (messageType && messageType !== "all") {
      trackApiCall(`${endpoint}/filter`, response.ok, messageType, resultCount)
    } else {
      trackApiCall(endpoint, response.ok, undefined, resultCount)
    }

    console.log("✅ [API] 請求成功:", result)
    return result
  } catch (error) {
    console.error("❌ [API] 請求失敗:", error)

    // 在測試環境下使用假資料
    if (isTestEnvironment()) {
      console.log("🧪 [測試模式] API 失敗，切換到假資料")

      // 追蹤 API 失敗但使用假資料成功
      trackApiCall("/broadcasts", false, keyword || messageType)

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
    const response = await fetchWithFailover(`/broadcasts/stats/?hours=${hours}`)
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
    const response = await fetchWithFailover(`/broadcasts/${messageId}`)
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
    const response = await fetchWithFailover(`/broadcasts/players/${encodeURIComponent(playerName)}?${params}`)
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

// 移除整個 searchBroadcasts 函數，因為改用客戶端搜尋
// export async function searchBroadcasts({ ... }) { ... }
