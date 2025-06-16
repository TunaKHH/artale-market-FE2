// API 服務層 - 廣播訊息相關 API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

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
  hours = 24,
  messageType,
  playerName,
  keyword
}: {
  page?: number
  pageSize?: number
  hours?: number
  messageType?: string
  playerName?: string
  keyword?: string
} = {}): Promise<BroadcastsResponse> {
  // 強制限制每頁最多 50 筆，防止過載
  const limitedPageSize = Math.min(Math.max(pageSize, 1), 50)
  
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: limitedPageSize.toString(),
    hours: hours.toString(),
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

  const response = await fetch(`${API_BASE_URL}/broadcasts?${params}`)
  
  if (!response.ok) {
    throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// 取得廣播統計資料
export async function getBroadcastStats(hours = 24): Promise<BroadcastStats> {
  const response = await fetch(`${API_BASE_URL}/broadcasts/stats?hours=${hours}`)
  
  if (!response.ok) {
    throw new Error(`統計資料請求失敗: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// 取得單一廣播訊息
export async function getBroadcastById(messageId: number): Promise<BroadcastMessage> {
  const response = await fetch(`${API_BASE_URL}/broadcasts/${messageId}`)
  
  if (!response.ok) {
    throw new Error(`廣播訊息請求失敗: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// 取得玩家廣播訊息
export async function getPlayerBroadcasts(playerName: string, hours = 24): Promise<BroadcastMessage[]> {
  const params = new URLSearchParams({
    hours: hours.toString()
  })
  
  const response = await fetch(`${API_BASE_URL}/broadcasts/players/${encodeURIComponent(playerName)}?${params}`)
  
  if (!response.ok) {
    throw new Error(`玩家廣播請求失敗: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// 搜尋廣播訊息（使用一般端點的 keyword 參數）
export async function searchBroadcasts({
  query,
  messageType,
  hours = 24,
  page = 1,
  pageSize = 50
}: {
  query: string
  messageType?: string
  hours?: number
  page?: number
  pageSize?: number
}): Promise<BroadcastsResponse> {
  // 強制限制每頁最多 50 筆，防止過載
  const limitedPageSize = Math.min(Math.max(pageSize, 1), 50)
  
  const params = new URLSearchParams({
    keyword: query, // 改用 keyword 參數
    hours: hours.toString(),
    page: page.toString(),
    page_size: limitedPageSize.toString(),
  })

  if (messageType && messageType !== 'all') {
    params.append('message_type', messageType)
  }

  // 使用一般端點而非專門的搜尋端點
  const response = await fetch(`${API_BASE_URL}/broadcasts?${params}`)
  
  if (!response.ok) {
    throw new Error(`搜尋請求失敗: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}