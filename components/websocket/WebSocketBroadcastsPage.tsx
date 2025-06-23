"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { Clock, Search, AlertCircle, Copy, Check, X, TestTube, Bookmark } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchDebounce } from "@/hooks/useDebounce"
import { useWebSocketBroadcasts } from "@/hooks/useWebSocketBroadcasts"
import { InfiniteMessageList } from "./InfiniteMessageList"
import { MessageItem, MessageFavoriteButton } from "./MessageItem"
import { ConnectionStatus } from "./ConnectionStatus"
import { WebSocketErrorBoundary } from "./ErrorBoundary"
import { WebSocketToast } from "./WebSocketToast"
import { HighlightText } from "@/components/HighlightText"
import { useRouter, useSearchParams } from "next/navigation"
import type { BroadcastMessage } from "@/lib/api"

// 擴展訊息類型
interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
  favorited_at?: string
}

// 時間格式化組件
const TimeAgo = ({ timestamp }: { timestamp: string }) => {
  const [timeAgo, setTimeAgo] = useState<string>("")
  const [fullTimestamp, setFullTimestamp] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const updateTimeAgo = () => {
      try {
        const date = new Date(timestamp)

        // 檢查時間戳是否有效
        if (isNaN(date.getTime())) {
          console.error("時間戳格式不正確:", timestamp)
          setTimeAgo("無效時間")
          setFullTimestamp("無效時間")
          return
        }

        const now = new Date()
        const diff = now.getTime() - date.getTime()

        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) setTimeAgo("剛剛")
        else if (minutes < 60) setTimeAgo(`${minutes}分鐘前`)
        else if (hours < 24) setTimeAgo(`${hours}小時前`)
        else setTimeAgo(`${days}天前`)

        setFullTimestamp(
          date.toLocaleString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
        )
      } catch (error) {
        console.error("時間格式化錯誤:", error, "timestamp:", timestamp)
        setTimeAgo("格式錯誤")
        setFullTimestamp("格式錯誤")
      }
    }

    updateTimeAgo()

    // 只有當時間差小於1天時才需要定期更新，否則顯示會很穩定
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000)

    if (diffHours < 24) {
      const interval = setInterval(updateTimeAgo, 60000)  // 1分鐘更新一次
      return () => clearInterval(interval)
    }
  }, [timestamp])

  if (!mounted) {
    return <span>載入中...</span>
  }

  return (
    <span
      title={fullTimestamp}
      className="cursor-help border-b border-dotted border-muted-foreground hover:border-foreground transition-colors"
    >
      {timeAgo}
    </span>
  )
}

// 玩家複製按鈕組件
const PlayerCopyButton = ({ playerName, playerId, onSwitchToFavorites }: { playerName: string; playerId?: string; onSwitchToFavorites: () => void }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const textToCopy = playerId ? `${playerName}#${playerId}` : playerName
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("複製失敗:", err)
    }
  }

  return (
    <button
      onClick={() => {
        handleCopy()
        onSwitchToFavorites()
      }}
      className="inline-flex items-center justify-center w-4 h-4 ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title={`複製 ${playerId ? `${playerName}#${playerId}` : playerName}`}
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

// 收藏按鈕組件


const getBadgeColor = (type: string) => {
  switch (type) {
    case "sell": return "destructive"
    case "buy": return "default"
    case "team": return "secondary"
    case "other": return "outline"
    default: return "default"
  }
}

const getBadgeText = (type: string) => {
  switch (type) {
    case "sell": return "賣"
    case "buy": return "買"
    case "team": return "組隊"
    case "other": return "其他"
    default: return type
  }
}

interface WebSocketBroadcastsPageProps {
  className?: string
}

export function WebSocketBroadcastsPage({ className }: WebSocketBroadcastsPageProps) {
  // Next.js router hooks
  const router = useRouter()
  const searchParams = useSearchParams()

  // 本地狀態
  const [searchInput, setSearchInput] = useState("")
  const [messageTypeFilter, setMessageTypeFilter] = useState("all")
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [favoriteMessages, setFavoriteMessages] = useState<ExtendedBroadcastMessage[]>([])
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<number | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(-1)
  const [mounted, setMounted] = useState(false)
  const [isTestMode, setIsTestMode] = useState(false)

  // 防抖搜尋
  const { debouncedSearchTerm, isSearching } = useSearchDebounce(searchInput, 300)

  // WebSocket Hook
  const {
    connectionState,
    isConnected,
    messages,
    hasMoreHistory,
    isLoadingLatest,
    isLoadingHistory,
    error,
    connectionAttempts,
    messageCount,
    isSubscribed,
    connect,
    disconnect,
    subscribeToNewMessages,
    unsubscribeFromNewMessages,
    loadLatestMessages,
    loadHistoryBefore,
    clearMessages,
    clearError
  } = useWebSocketBroadcasts({
    autoConnect: true,
    initialMessageLimit: 50,
    enableAutoSubscribe: true
  })

  // 客戶端掛載檢測
  useEffect(() => {
    setMounted(true)

    // 安全檢查環境
    try {
      const checkTestMode = () => {
        if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_IS_PRODUCTION === "true") {
          return false
        }
        if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
          return false
        }
        return true
      }

      setIsTestMode(checkTestMode())
      updateFavoriteCount()
      loadSearchHistory()

      // 從 URL 參數讀取搜尋內容
      const queryParam = searchParams.get('q')
      if (queryParam) {
        setSearchInput(queryParam)
      }
    } catch (error) {
      console.error("初始化錯誤:", error)
      setIsTestMode(false)
    }
  }, [searchParams])

  // 篩選訊息 (使用 useMemo 優化效能)
  const filteredMessages = useMemo(() => {
    let filtered = messages

    // 按訊息類型篩選
    if (messageTypeFilter !== "all" && messageTypeFilter !== "favorites") {
      filtered = filtered.filter(msg => msg.message_type === messageTypeFilter)
    }

    // 按搜尋關鍵字篩選 (使用防抖後的搜尋詞)
    if (debouncedSearchTerm.trim()) {
      // 將搜尋詞按空白分割成多個關鍵字
      const searchKeywords = debouncedSearchTerm.trim().toLowerCase().split(/\s+/).filter(keyword => keyword.length > 0)

      filtered = filtered.filter(msg => {
        const contentLower = msg.content.toLowerCase()
        const playerNameLower = msg.player_name.toLowerCase()

        // 所有關鍵字都必須在內容或玩家名稱中找到 (AND 邏輯)
        return searchKeywords.every(keyword =>
          contentLower.includes(keyword) || playerNameLower.includes(keyword)
        )
      })
    }

    return filtered
  }, [messages, messageTypeFilter, debouncedSearchTerm])

  // 根據當前篩選條件決定要顯示的訊息
  const displayMessages = messageTypeFilter === "favorites" ? favoriteMessages : filteredMessages

  // 計算訊息統計 (使用 useMemo 優化效能) - 統計應該基於所有訊息，而不是當前篩選的訊息
  const stats = useMemo(() => {
    // 統計使用所有 WebSocket 訊息 (不包含收藏)，避免循環依賴
    const allMessages = messages // 直接使用 WebSocket 的所有訊息
    return {
      total: allMessages.length,
      buy: allMessages.filter(m => m.message_type === "buy").length,
      sell: allMessages.filter(m => m.message_type === "sell").length,
      team: allMessages.filter(m => m.message_type === "team").length,
      other: allMessages.filter(m => m.message_type === "other").length,
    }
  }, [messages]) // 只依賴原始的 messages，避免循環依賴

  // 更新收藏數量
  const updateFavoriteCount = () => {
    if (typeof window !== "undefined") {
      const favorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")
      setFavoriteCount(favorites.length)
      setFavoriteMessages(favorites)
    }
  }

  // 載入搜尋歷史
  const loadSearchHistory = () => {
    if (typeof window !== "undefined") {
      const history = JSON.parse(localStorage.getItem("search-history") || "[]")
      setSearchHistory(history)
    }
  }

  // 更新搜尋歷史
  const updateSearchHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return

    const trimmedTerm = searchTerm.trim()
    const history = JSON.parse(localStorage.getItem("search-history") || "[]")
    const newHistory = [trimmedTerm, ...history.filter((term: string) => term !== trimmedTerm)].slice(0, 10)

    localStorage.setItem("search-history", JSON.stringify(newHistory))
    setSearchHistory(newHistory)
  }

  // 更新 URL 搜尋參數
  const updateUrlSearchParam = (searchTerm: string) => {
    const currentUrl = new URL(window.location.href)

    if (searchTerm.trim()) {
      currentUrl.searchParams.set('q', searchTerm.trim())
    } else {
      currentUrl.searchParams.delete('q')
    }

    router.replace(currentUrl.pathname + currentUrl.search, { scroll: false })
  }

  // 載入歷史訊息 (暫時停用)
  const handleLoadMore = useCallback(async () => {
    console.log("🚫 載入更多功能已暫時停用")
    return []
  }, [])

  // 處理搜尋輸入
  const handleInputChange = (value: string) => {
    setSearchInput(value)
    updateUrlSearchParam(value)
  }

  // 執行搜尋
  const handleSearch = () => {
    const searchTerm = searchInput.trim()
    if (searchTerm) {
      updateSearchHistory(searchTerm)
    }
    setShowSearchHistory(false)
  }

  // 清除搜尋
  const clearSearch = useCallback(() => {
    setSearchInput("")
    updateUrlSearchParam("")
    setShowSearchHistory(false)
    setSelectedHistoryIndex(-1)
  }, [])

  // 使用歷史搜尋詞
  const useHistorySearch = (term: string) => {
    setSearchInput(term)
    updateUrlSearchParam(term)
    setShowSearchHistory(false)
    setSelectedHistoryIndex(-1)
  }

  // 清除搜尋歷史
  const clearSearchHistory = () => {
    localStorage.removeItem("search-history")
    setSearchHistory([])
    setShowSearchHistory(false)
  }

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchHistory || searchHistory.length === 0) {
      if (e.key === "Enter") {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedHistoryIndex((prev) => (prev < searchHistory.length - 1 ? prev + 1 : prev))
        if (!showSearchHistory) {
          setShowSearchHistory(true)
        }
        break

      case "ArrowUp":
        e.preventDefault()
        setSelectedHistoryIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break

      case "Enter":
        e.preventDefault()
        if (selectedHistoryIndex >= 0 && selectedHistoryIndex < searchHistory.length) {
          useHistorySearch(searchHistory[selectedHistoryIndex])
        } else {
          handleSearch()
        }
        break

      case "Escape":
        setShowSearchHistory(false)
        setSelectedHistoryIndex(-1)
        break
    }
  }

  // 處理卡片點擊
  const handleBroadcastClick = (broadcastId: number) => {
    setSelectedBroadcastId((prev) => (prev === broadcastId ? null : broadcastId))
  }

  // 處理分類 Badge 點擊
  const handleBadgeClick = useCallback(
    (e: React.MouseEvent, messageType: string) => {
      e.stopPropagation()
      const newMessageType = messageTypeFilter === messageType ? "all" : messageType
      setMessageTypeFilter(newMessageType)
      console.log(`🏷️ 切換到分類: ${newMessageType === "all" ? "全部" : getBadgeText(newMessageType)}`)
    },
    [messageTypeFilter]
  )

  // 處理收藏狀態改變
  const handleFavoriteChange = (isAdding?: boolean) => {
    updateFavoriteCount()
    // 移除自動跳轉邏輯，讓用戶手動選擇何時查看收藏
  }

  // 取得廣播類型選項
  const broadcastTypes = [
    { id: "all", name: "全部", count: stats.total },
    { id: "sell", name: "賣", count: stats.sell },
    { id: "buy", name: "買", count: stats.buy },
    { id: "team", name: "組隊", count: stats.team },
    { id: "other", name: "其他", count: stats.other },
    { id: "favorites", name: "收藏", count: favoriteCount },
  ]

  // 訊息點擊處理
  const handleMessageClick = useCallback((message: ExtendedBroadcastMessage) => {
    console.log("點擊訊息:", message)
  }, [])

  // 在未掛載時顯示載入狀態
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <WebSocketErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Toast 通知 */}
        <WebSocketToast
          connectionState={connectionState}
          error={error}
          isSubscribed={isSubscribed}
          messageCount={messageCount}
          showConnectionToasts={true}
          showErrorToasts={true}
          showNewMessageToasts={false}
        />

        {/* Title and Description */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-foreground">廣播訊息</h1>
              {isTestMode && (
                <Badge variant="outline" className="flex items-center space-x-1 text-orange-600 border-orange-300">
                  <TestTube className="w-3 h-3" />
                  <span>測試模式</span>
                </Badge>
              )}
            </div>
          </div>

          <p className="text-muted-foreground mb-6">
            {messageTypeFilter === "favorites" ? (
              <>
                顯示您收藏的廣播訊息。 目前有 <span className="font-semibold text-blue-600">{favoriteCount}</span>{" "}
                條收藏訊息。
              </>
            ) : (
              <>
                即時顯示遊戲內的廣播訊息，包括交易、組隊、公會招募等。
                {isTestMode && (
                  <span className="ml-2 text-orange-600">🧪 目前使用測試資料，API 連線失敗時會自動切換。</span>
                )}
              </>
            )}
          </p>

          {/* 連線狀態指示器 - 已隱藏 */}
          {/* <ConnectionStatus
            connectionState={connectionState}
            isSubscribed={isSubscribed}
            connectionAttempts={connectionAttempts}
            messageCount={messageCount}
            error={error}
            onReconnect={connect}
            onClearError={clearError}
            compact={false}
          /> */}

          {/* 網路狀態警告 */}
          {mounted && typeof navigator !== "undefined" && !navigator.onLine && (
            <Alert className="mb-4">
              <AlertDescription>
                ⚠️ 網路連線異常，WebSocket 功能可能受限
              </AlertDescription>
            </Alert>
          )}

          {/* WebSocket 錯誤提示 */}
          {error && messageTypeFilter !== "favorites" && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {isTestMode && (
                  <div className="mt-2 text-sm">💡 由於您在測試環境中，系統已自動使用假資料繼續運作。</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 搜尋功能 */}
          {messageTypeFilter !== "favorites" && (
            <div className="mb-6">
              <div className="relative flex items-center space-x-2">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="relative flex-1">
                  <Input
                    placeholder="即時搜尋玩家或訊息內容... (可用空白分隔多個關鍵字)"
                    className="w-full pr-8"
                    value={searchInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (searchHistory.length > 0) {
                        setShowSearchHistory(true)
                        setSelectedHistoryIndex(-1)
                      }
                    }}
                    onBlur={() =>
                      setTimeout(() => {
                        setShowSearchHistory(false)
                        setSelectedHistoryIndex(-1)
                      }, 200)
                    }
                  />
                  {searchHistory.length > 0 && (
                    <button
                      onClick={() => setShowSearchHistory(!showSearchHistory)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title="搜尋歷史"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  )}

                  {/* 搜尋歷史下拉選單 */}
                  {showSearchHistory && searchHistory.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-border flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">搜尋歷史</span>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                          title="清除歷史"
                        >
                          清除
                        </button>
                      </div>
                      {searchHistory.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => useHistorySearch(term)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between group ${index === selectedHistoryIndex ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            }`}
                        >
                          <span className="truncate">{term}</span>
                          <Search
                            className={`w-3 h-3 transition-opacity ${index === selectedHistoryIndex
                              ? "text-primary-foreground opacity-100"
                              : "text-muted-foreground opacity-0 group-hover:opacity-100"
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 搜尋結果提示 */}
        {debouncedSearchTerm.trim() && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {(() => {
                const keywords = debouncedSearchTerm.trim().split(/\s+/).filter(k => k.length > 0)
                return keywords.length > 1
                  ? <>搜尋包含所有關鍵字「<span className="font-semibold">{keywords.join('、')}</span>」的訊息，找到 {filteredMessages.length} 條結果</>
                  : <>搜尋「<span className="font-semibold">{debouncedSearchTerm}</span>」找到 {filteredMessages.length} 條結果</>
              })()}
              {messageTypeFilter !== "all" && messageTypeFilter !== "favorites" && (
                <span> (僅顯示「{getBadgeText(messageTypeFilter)}」類型)</span>
              )}
            </p>
            <button onClick={clearSearch} className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
              清除搜尋
            </button>
          </div>
        )}

        {/* Type Tabs - 整合統計數字 */}
        <Tabs value={messageTypeFilter} onValueChange={setMessageTypeFilter} className="mb-8">
          <TabsList className="grid w-full grid-cols-6 gap-1">
            {broadcastTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-sm px-3 py-2">
                <div className="flex items-center space-x-1">
                  {type.id === "favorites" && <Bookmark className="w-3 h-3" />}
                  <span>{type.name}</span>
                  {/* 顯示分類數量 */}
                  <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full ml-1">
                    {type.count}
                  </span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* 新訊息提示已移除 */}

        {/* 控制按鈕 - 已隱藏 WebSocket 相關操作 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {/* WebSocket 連線控制按鈕已隱藏 */}
            {/* {isConnected ? (
              <Button variant="outline" size="sm" onClick={disconnect}>
                斷開連線
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={connect}>
                連線 WebSocket
              </Button>
            )} */}

            {/* WebSocket 訂閱控制按鈕已隱藏 */}
            {/* {isConnected && (
              <Button
                variant={isSubscribed ? "secondary" : "outline"}
                size="sm"
                onClick={isSubscribed ? unsubscribeFromNewMessages : subscribeToNewMessages}
              >
                {isSubscribed ? "取消訂閱" : "訂閱推送"}
              </Button>
            )} */}

            {/* 測試載入按鈕已隱藏 */}
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => loadLatestMessages(10)}
              disabled={!isConnected || isLoadingLatest}
            >
              {isLoadingLatest ? "載入中..." : "測試載入"}
            </Button> */}

            {/* 清除訊息按鈕已移除 */}
          </div>
        </div>

        {/* 訊息列表 */}
        <div className="space-y-4">
          {displayMessages.length === 0 && !isLoadingLatest ? (
            <div className="text-center py-12">
              {messageTypeFilter === "favorites" ? (
                <div className="space-y-2">
                  <Bookmark className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">您還沒有收藏任何廣播訊息。</p>
                  <p className="text-sm text-muted-foreground">點擊訊息右側的書籤圖標來收藏感興趣的訊息！</p>
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground">{error ? "無法載入廣播訊息" : "找不到符合條件的廣播訊息。"}</p>
                  {isTestMode && error && (
                    <p className="text-sm text-orange-600 mt-2">
                      🧪 測試模式：如果看到此訊息，表示假資料生成可能有問題。
                    </p>
                  )}
                </>
              )}
            </div>
          ) : messageTypeFilter === "favorites" ? (
            // 收藏訊息用傳統列表
            <div className="space-y-4">
              {favoriteMessages.map((broadcast) => (
                <Card
                  key={broadcast.id}
                  className={`transition-all duration-500 cursor-pointer border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/30 ${selectedBroadcastId === broadcast.id
                    ? "shadow-lg border-primary bg-primary/5"
                    : "hover:shadow-md hover:border-muted-foreground"
                    }`}
                  onClick={() => handleBroadcastClick(broadcast.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={getBadgeColor(broadcast.message_type) as any}>
                            {getBadgeText(broadcast.message_type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{broadcast.channel}</span>
                          <div className="flex items-center">
                            <HighlightText
                              text={broadcast.player_id ? `${broadcast.player_name}#${broadcast.player_id}` : broadcast.player_name}
                              searchTerm={debouncedSearchTerm}
                              className="text-sm font-medium text-primary"
                            />
                            <PlayerCopyButton
                              playerName={broadcast.player_name}
                              playerId={broadcast.player_id}
                              onSwitchToFavorites={() => setMessageTypeFilter("favorites")}
                            />
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            <TimeAgo timestamp={broadcast.timestamp} />
                          </div>
                          {broadcast.favorited_at && (
                            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                              <Bookmark className="w-3 h-3 mr-1 fill-current" />
                              <span>收藏於 {new Date(broadcast.favorited_at).toLocaleDateString("zh-TW")}</span>
                            </div>
                          )}
                        </div>
                        <HighlightText
                          text={broadcast.content}
                          searchTerm={debouncedSearchTerm}
                          className="mb-2 text-foreground"
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <MessageFavoriteButton
                          message={broadcast}
                          onFavoriteChange={handleFavoriteChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // 一般訊息用無限滾動列表
            <InfiniteMessageList
              messages={displayMessages}
              loading={isLoadingLatest || isLoadingHistory}
              hasMoreHistory={false}
              onLoadMore={handleLoadMore}
              onMessageClick={handleMessageClick}
              onSwitchToFavorites={() => setMessageTypeFilter("favorites")}
              onFavoriteChange={handleFavoriteChange}
              searchTerm={debouncedSearchTerm}
              maxHeight="700px"
              autoScroll={false}
              pageSize={50}
              enableInfiniteScroll={false}
            />
          )}
        </div>

        {/* 底部狀態欄 */}
        <div className="flex items-center justify-end text-xs text-gray-500 px-2">
          {/* WebSocket 連線狀態已隱藏 */}
          {/* <span>
            {isConnected ? (
              isSubscribed ? (
                <span className="text-green-600">🟢 即時推送已啟用</span>
              ) : (
                <span className="text-yellow-600">🟡 已連線，未訂閱推送</span>
              )
            ) : (
              <span className="text-red-600">🔴 WebSocket 未連線</span>
            )}
          </span> */}

          <span>
            {debouncedSearchTerm || messageTypeFilter !== "all"
              ? `篩選結果: ${stats.total} 筆`
              : `顯示訊息: ${messageCount} 筆`
            }
          </span>
        </div>
      </div>
    </WebSocketErrorBoundary>
  )
}