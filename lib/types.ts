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
  autoFavorited?: boolean
  matchedRule?: string
  matchedKeywords?: string[]
}

export interface AutoFavoriteRule {
  id: string
  name: string
  keywords: string[]
  messageTypes?: ('buy' | 'sell' | 'team' | 'other')[]
  matchMode: 'contains' | 'exact' | 'regex'
  isActive: boolean
  createdAt: string
  matchCount: number
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

// 匹配事件相關型別
export interface MatchResult {
  matched: boolean
  matchedKeywords: string[]
  rule: AutoFavoriteRule
}

export interface MessageMatchEvent {
  message: BroadcastMessageWithFavorite | FavoriteMessage
  matchResults: MatchResult[]
}

// 匹配處理器事件類型
export interface MatchingProcessorEvent {
  type: 'message_matched' | 'match_processed' | 'auto_favorite_triggered'
  message: BroadcastMessageWithFavorite | FavoriteMessage
  matchResults?: MatchResult[]
  error?: string
}

// 匹配處理器回調函數類型
export type MessageMatchHandler = (message: BroadcastMessageWithFavorite | FavoriteMessage) => void | Promise<void>
export type MatchEventHandler = (event: MessageMatchEvent) => void | Promise<void>
export type MatchingProcessorEventHandler = (event: MatchingProcessorEvent) => void

// 通用回調型別
export type EventCallback = () => void
export type ErrorCallback = (error: Error) => void
export type DataCallback<T> = (data: T) => void