// 通用型別定義
export interface AIAnalysisResult {
  confidence?: number
  categories?: string[]
  keywords?: string[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  metadata?: Record<string, unknown>
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
  endpoint?: string
  endpoint_limits?: Record<string, {
    limit: number
    remaining: number
    reset: number
  }>
  dev_mode?: boolean
}

export interface ErrorDetails {
  code?: string
  message: string
  timestamp?: string
  endpoint?: string
  statusCode?: number
}

export interface PlayerInfo {
  playerName: string
  playerId?: string
  server?: string
  level?: number
  guild?: string
}

export interface FavoriteMessage {
  id: number
  content: string
  playerName: string
  timestamp: string
  messageType: string
  addedAt: string
}

export interface AnalyticsEvent {
  event: string
  category?: string
  action?: string
  label?: string
  value?: number
  customDimensions?: Record<string, string | number>
}

// 廣播相關型別
export interface BroadcastMessageWithFavorite {
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
  isFavorited?: boolean
}

// 組件 Props 型別
export interface PlayerInfoProps {
  playerName: string
  playerId?: string
  analytics: AnalyticsEvent
}

export interface BroadcastCardProps {
  broadcast: BroadcastMessageWithFavorite
  onFavoriteChange?: () => void
  analytics?: AnalyticsEvent
}

// 通用回調型別
export type EventCallback = () => void
export type ErrorCallback = (error: Error) => void
export type DataCallback<T> = (data: T) => void