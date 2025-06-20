// API 服務層 - 廣播訊息相關 API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// 自定義錯誤類別
export class RateLimitError extends Error {
  public rateLimitInfo: any
  public retryAfter?: number
  
  constructor(message: string, rateLimitInfo: any, retryAfter?: number) {
    super(message)
    this.name = 'RateLimitError'
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
async function handleApiResponse(response: Response): Promise<any> {
  if (response.ok) {
    return response.json()
  }
  
  if (response.status === 429) {
    // 速率限制錯誤 - 自動取得限制資訊
    const retryAfter = response.headers.get('Retry-After')
    console.log('Response headers for 429:', {
      'retry-after': retryAfter,
      'x-ratelimit-limit': response.headers.get('X-RateLimit-Limit'),
      'x-ratelimit-remaining': response.headers.get('X-RateLimit-Remaining'),
      'x-ratelimit-reset': response.headers.get('X-RateLimit-Reset'),
      'all-headers': Array.from(response.headers.entries())
    })
    const retrySeconds = retryAfter ? parseInt(retryAfter) : undefined
    
    // 格式化等待時間訊息
    const formatWaitTime = (seconds?: number): string => {
      if (!seconds) return '請稍後再試'
      
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
      console.warn('無法獲取速率限制資訊:', rateLimitFetchError)
    }
    
    const errorMessage = `API 請求頻率過高，${waitMessage}`
    console.log('RateLimitError created:', { errorMessage, retrySeconds, rateLimitInfo })
    
    throw new RateLimitError(
      errorMessage,
      rateLimitInfo,
      retrySeconds
    )
  }
  
  throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`)
}

export interface BroadcastMessage {
  id: number
  content: string
  channel: string
  player_name: string
  player_id?: string
  message_type: 'buy' | 'sell' | 'team' | 'other'
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

// 取得廣播訊息列表
export async function getBroadcasts({
  page = 1,
  pageSize = 50,
  messageType,
  playerName,
  keyword
}: {
  page?: number
  pageSize?: number
  messageType?: string
  playerName?: string
  keyword?: string
} = {}): Promise<BroadcastsResponse> {
  // 強制限制每頁最多 50 筆，防止過載
  const limitedPageSize = Math.min(Math.max(pageSize, 1), 50)
  
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: limitedPageSize.toString(),
  })

  if (messageType && messageType !== 'all') {
    params.append('message_type', messageType)
  }
  
  if (playerName) {
    params.append('player_name', playerName)
  }
  
  if (keyword) {
    params.append('keyword', keyword)
  }

  const response = await fetch(`${API_BASE_URL}/broadcasts/?${params}`)
  return handleApiResponse(response)
}

// 取得廣播統計資料
export async function getBroadcastStats(hours = 24): Promise<BroadcastStats> {
  const response = await fetch(`${API_BASE_URL}/broadcasts/stats/?hours=${hours}`)
  return handleApiResponse(response)
}

// 取得單一廣播訊息
export async function getBroadcastById(messageId: number): Promise<BroadcastMessage> {
  const response = await fetch(`${API_BASE_URL}/broadcasts/${messageId}`)
  return handleApiResponse(response)
}

// 取得玩家廣播訊息
export async function getPlayerBroadcasts(playerName: string, hours = 24): Promise<BroadcastMessage[]> {
  const params = new URLSearchParams({
    hours: hours.toString()
  })
  
  const response = await fetch(`${API_BASE_URL}/broadcasts/players/${encodeURIComponent(playerName)}?${params}`)
  return handleApiResponse(response)
}

// 搜尋廣播訊息（使用一般端點的 keyword 參數）
export async function searchBroadcasts({
  query,
  messageType,
  page = 1,
  pageSize = 50
}: {
  query: string
  messageType?: string
  page?: number
  pageSize?: number
}): Promise<BroadcastsResponse> {
  // 強制限制每頁最多 50 筆，防止過載
  const limitedPageSize = Math.min(Math.max(pageSize, 1), 50)
  
  const params = new URLSearchParams({
    keyword: query, // 改用 keyword 參數
    page: page.toString(),
    page_size: limitedPageSize.toString(),
  })

  if (messageType && messageType !== 'all') {
    params.append('message_type', messageType)
  }

  // 使用一般端點而非專門的搜尋端點
  const response = await fetch(`${API_BASE_URL}/broadcasts/?${params}`)
  return handleApiResponse(response)
}