"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Clock, Search, AlertCircle, Copy, Check, ChevronLeft, ChevronRight, X, TestTube, Bookmark } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "../components/header"
import { ConnectionStatus } from "@/components/connection-status"
import { HighlightText } from "@/components/HighlightText"
import { useBroadcasts } from "@/hooks/useBroadcasts"
import { useAnalytics } from "@/hooks/useAnalytics"
import { isTestEnvironment } from "@/lib/mock-data"

// 時間格式化組件 - 避免 hydration 錯誤
const TimeAgo = ({ timestamp }: { timestamp: string }) => {
  const [timeAgo, setTimeAgo] = useState<string>("")
  const [fullTimestamp, setFullTimestamp] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const updateTimeAgo = () => {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()

      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) setTimeAgo("剛剛")
      else if (minutes < 60) setTimeAgo(`${minutes}分鐘前`)
      else if (hours < 24) setTimeAgo(`${hours}小時前`)
      else setTimeAgo(`${days}天前`)

      // 設定完整的時間戳顯示 (台灣時間格式)
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
    }

    updateTimeAgo()
    // 每分鐘更新一次
    const interval = setInterval(updateTimeAgo, 60000)

    return () => clearInterval(interval)
  }, [timestamp])

  // 避免 hydration 錯誤，在客戶端掛載前顯示靜態內容
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
const PlayerCopyButton = ({
  playerName,
  playerId,
  analytics,
}: { playerName: string; playerId?: string; analytics: any }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const textToCopy = playerId ? `${playerName}#${playerId}` : playerName
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // 2秒後恢復原狀

      // 追蹤複製行為
      analytics.trackAction("player_name_copy", "user_behavior", {
        player_name: playerName,
        has_player_id: !!playerId,
        copy_format: playerId ? "name_with_id" : "name_only",
      })
    } catch (err) {
      console.error("複製失敗:", err)
      analytics.trackError("copy_failed", `Failed to copy player name: ${playerName}`)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center w-4 h-4 ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title={`複製 ${playerId ? `${playerName}#${playerId}` : playerName}`}
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

// 收藏按鈕組件
const FavoriteButton = ({
  broadcast,
  onFavoriteChange,
  analytics,
}: { broadcast: any; onFavoriteChange?: () => void; analytics?: any }) => {
  const [isFavorited, setIsFavorited] = useState(false)

  // 檢查是否已收藏
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")
    setIsFavorited(favorites.some((fav: any) => fav.id === broadcast.id))
  }, [broadcast.id])

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡

    try {
      const favorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")

      if (isFavorited) {
        // 取消收藏
        const newFavorites = favorites.filter((fav: any) => fav.id !== broadcast.id)
        localStorage.setItem("broadcast-favorites", JSON.stringify(newFavorites))
        setIsFavorited(false)
        console.log("🔖 已取消收藏:", broadcast.player_name, broadcast.content.slice(0, 30) + "...")

        // 追蹤取消收藏
        if (analytics) {
          analytics.trackAction("unfavorite", "user_behavior", {
            broadcast_id: broadcast.id,
            player_name: broadcast.player_name,
            message_type: broadcast.message_type,
          })
        }
      } else {
        // 添加收藏
        const favoriteItem = {
          ...broadcast,
          favorited_at: new Date().toISOString(),
        }
        favorites.push(favoriteItem)
        localStorage.setItem("broadcast-favorites", JSON.stringify(favorites))
        setIsFavorited(true)
        console.log("📖 已收藏:", broadcast.player_name, broadcast.content.slice(0, 30) + "...")

        // 追蹤收藏行為
        if (analytics) {
          analytics.trackAction("favorite", "user_behavior", {
            broadcast_id: broadcast.id,
            player_name: broadcast.player_name,
            message_type: broadcast.message_type,
            content_length: broadcast.content.length,
          })
        }
      }

      // 通知父組件收藏狀態改變
      if (onFavoriteChange) {
        onFavoriteChange()
      }
    } catch (err) {
      console.error("收藏操作失敗:", err)
    }
  }

  return (
    <button
      onClick={handleFavorite}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 hover:scale-105 ${
        isFavorited
          ? "text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-400"
          : "text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
      }`}
      title={isFavorited ? "取消收藏" : "收藏此訊息"}
    >
      <Bookmark className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
    </button>
  )
}

// 載入中骨架組件
const BroadcastSkeleton = () => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-12 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </CardContent>
  </Card>
)

const getBadgeColor = (type: string) => {
  switch (type) {
    case "sell":
      return "destructive"
    case "buy":
      return "default"
    case "team":
      return "secondary"
    case "other":
      return "outline"
    default:
      return "default"
  }
}

const getBadgeText = (type: string) => {
  switch (type) {
    case "sell":
      return "賣"
    case "buy":
      return "買"
    case "team":
      return "組隊"
    case "other":
      return "其他"
    default:
      return type
  }
}

export default function BroadcastsPage() {
  const [searchInput, setSearchInput] = useState("")
  const [mounted, setMounted] = useState(false)
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<number | null>(null)
  const [showTestMode, setShowTestMode] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [favoriteMessages, setFavoriteMessages] = useState<any[]>([])
  const [pageStartTime, setPageStartTime] = useState<number>(0)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(-1)

  // 分析追蹤
  const analytics = useAnalytics()

  // 客戶端掛載檢測
  useEffect(() => {
    setMounted(true)
    setShowTestMode(isTestEnvironment())
    updateFavoriteCount()
    loadSearchHistory() // 添加這行
    setPageStartTime(Date.now())

    // 追蹤頁面瀏覽
    analytics.trackPageView("broadcasts", {
      test_mode: isTestEnvironment(),
      auto_refresh: true,
    })
  }, [])

  // 追蹤頁面停留時間
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pageStartTime > 0) {
        const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000)
        analytics.trackTimeSpent("broadcasts", timeSpent)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [pageStartTime, analytics])

  // 更新收藏數量
  const updateFavoriteCount = () => {
    if (typeof window !== "undefined") {
      const favorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")
      setFavoriteCount(favorites.length)
      setFavoriteMessages(favorites)
    }
  }

  // 更新搜尋歷史
  const updateSearchHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return

    const trimmedTerm = searchTerm.trim()
    const history = JSON.parse(localStorage.getItem("search-history") || "[]")

    // 移除重複項目並添加到開頭
    const newHistory = [trimmedTerm, ...history.filter((term: string) => term !== trimmedTerm)].slice(0, 10) // 最多保存 10 個搜尋記錄

    localStorage.setItem("search-history", JSON.stringify(newHistory))
    setSearchHistory(newHistory)
  }

  // 載入搜尋歷史
  const loadSearchHistory = () => {
    if (typeof window !== "undefined") {
      const history = JSON.parse(localStorage.getItem("search-history") || "[]")
      setSearchHistory(history)
    }
  }

  // 清除搜尋歷史
  const clearSearchHistory = () => {
    localStorage.removeItem("search-history")
    setSearchHistory([])
    setShowSearchHistory(false)

    analytics.trackAction("clear_search_history", "user_behavior", {
      history_count: searchHistory.length,
    })
  }

  // 使用歷史搜尋詞
  const useHistorySearch = (term: string) => {
    setSearchInput(term)
    updateFilters({ keyword: term })
    setShowSearchHistory(false)
    setSelectedHistoryIndex(-1)

    analytics.trackAction("use_search_history", "user_behavior", {
      search_term: term,
      history_position: searchHistory.indexOf(term),
    })
  }

  // 使用自定義 Hook 取得廣播資料
  const {
    broadcasts,
    totalCount,
    typeCounts,
    loading,
    isInitialLoading,
    error,
    rateLimitError,
    filters,
    updateFilters,
    hasNext,
    hasPrev,
    currentPage,
    goToPage,
    clearRateLimitError,
  } = useBroadcasts({
    autoRefresh: true,
    refreshInterval: 3000,
  })

  const clearSearch = useCallback(() => {
    setSearchInput("")
    updateFilters({ keyword: "" })
    setShowSearchHistory(false)
    setSelectedHistoryIndex(-1)
    analytics.trackAction("clear_search", "search", {
      previous_keyword: filters.keyword,
      result_count: broadcasts.length,
    })
  }, [analytics, filters.keyword, broadcasts.length, updateFilters])

  // 處理搜尋輸入 - 改為即時搜尋
  const handleInputChange = (value: string) => {
    setSearchInput(value)
    // 即時更新篩選條件
    updateFilters({ keyword: value })

    // 追蹤搜尋行為（防抖動）
    if (value.trim()) {
      const timer = setTimeout(() => {
        analytics.trackSearch(value, filters.messageType, broadcasts.length)
        analytics.trackAction("search", "feature_usage", {
          search_length: value.length,
          has_filters: filters.messageType !== "all",
          current_message_type: filters.messageType,
          search_type: "client_side",
        })
      }, 500)

      return () => clearTimeout(timer)
    }
  }

  // 執行搜尋 - 現在主要用於追蹤
  const handleSearch = () => {
    const searchTerm = searchInput.trim()

    // 追蹤手動搜尋行為
    if (searchTerm) {
      updateSearchHistory(searchTerm) // 添加這行
      analytics.trackSearch(searchTerm, filters.messageType, broadcasts.length)
      analytics.trackAction("manual_search", "feature_usage", {
        search_length: searchTerm.length,
        has_filters: filters.messageType !== "all",
        current_message_type: filters.messageType,
        search_type: "client_side",
      })
    }
    setShowSearchHistory(false) // 添加這行
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
    const isExpanding = selectedBroadcastId !== broadcastId
    setSelectedBroadcastId((prev) => (prev === broadcastId ? null : broadcastId))

    // 追蹤卡片互動
    analytics.trackAction(isExpanding ? "expand" : "collapse", "broadcast_card_click", {
      broadcast_id: broadcastId,
      current_filter: filters.messageType,
    })
  }

  // 處理分類 Badge 點擊
  const handleBadgeClick = useCallback(
    (e: React.MouseEvent, messageType: string) => {
      e.stopPropagation() // 阻止事件冒泡，避免觸發卡片點擊

      // 如果當前已經是該分類，則切換到全部
      const newMessageType = filters.messageType === messageType ? "all" : messageType
      updateFilters({ messageType: newMessageType })

      // 追蹤篩選行為
      analytics.trackFilter("message_type", newMessageType)
      analytics.trackAction("badge_click", "user_behavior", {
        from_type: filters.messageType,
        to_type: newMessageType,
        action: newMessageType === "all" ? "clear_filter" : "apply_filter",
      })

      // 提供視覺反饋
      console.log(`🏷️ 切換到分類: ${newMessageType === "all" ? "全部" : getBadgeText(newMessageType)}`)
    },
    [analytics, filters.messageType, updateFilters],
  )

  // 處理收藏狀態改變
  const handleFavoriteChange = () => {
    updateFavoriteCount()
  }

  // 取得廣播類型選項
  const broadcastTypes = [
    { id: "all", name: "全部", count: totalCount },
    { id: "sell", name: "賣", count: typeCounts.sell },
    { id: "buy", name: "買", count: typeCounts.buy },
    { id: "team", name: "組隊", count: typeCounts.team },
    { id: "other", name: "其他", count: typeCounts.other },
    { id: "favorites", name: "收藏", count: favoriteCount },
  ]

  // 根據當前篩選條件決定要顯示的訊息
  const displayMessages = filters.messageType === "favorites" ? favoriteMessages : broadcasts

  // 在未掛載時顯示載入狀態
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-foreground">廣播訊息</h1>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">載入中...</p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <BroadcastSkeleton key={index} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Description */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-foreground">廣播訊息</h1>
              {/* 測試模式指示器 */}
              {showTestMode && (
                <Badge variant="outline" className="flex items-center space-x-1 text-orange-600 border-orange-300">
                  <TestTube className="w-3 h-3" />
                  <span>測試模式</span>
                </Badge>
              )}
            </div>
          </div>

          <p className="text-muted-foreground mb-6">
            {filters.messageType === "favorites" ? (
              <>
                顯示您收藏的廣播訊息。 目前有 <span className="font-semibold text-blue-600">{favoriteCount}</span>{" "}
                條收藏訊息。
              </>
            ) : (
              <>
                即時顯示遊戲內的廣播訊息，包括交易、組隊、公會招募等。
                {showTestMode && (
                  <span className="ml-2 text-orange-600">🧪 目前使用測試資料，API 連線失敗時會自動切換。</span>
                )}
              </>
            )}
          </p>

          {/* 連線狀態指示器 */}
          <ConnectionStatus />

          {/* Error Alert */}
          {error && filters.messageType !== "favorites" && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {showTestMode && (
                  <div className="mt-2 text-sm">💡 由於您在測試環境中，系統已自動使用假資料繼續運作。</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Rate Limit Error Alert */}
          {rateLimitError && filters.messageType !== "favorites" && (
            <Alert
              variant="default"
              className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
            >
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="flex-1 ml-2">
                  <AlertDescription className="text-orange-800 dark:text-orange-200">{rateLimitError}</AlertDescription>
                </div>
                <button
                  onClick={clearRateLimitError}
                  className="ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 transition-colors"
                  title="關閉提醒"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Alert>
          )}

          {/* Filters */}
          {filters.messageType !== "favorites" && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex items-center space-x-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <div className="relative">
                  <Input
                    placeholder="即時搜尋玩家或訊息內容..."
                    className="max-w-md pr-8"
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
                          className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between group ${
                            index === selectedHistoryIndex ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                        >
                          <span className="truncate">{term}</span>
                          <Search
                            className={`w-3 h-3 transition-opacity ${
                              index === selectedHistoryIndex
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
        {filters.keyword.trim() && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              搜尋「<span className="font-semibold">{filters.keyword}</span>」找到 {broadcasts.length} 條結果
              {filters.messageType !== "all" && <span> (僅顯示「{getBadgeText(filters.messageType)}」類型)</span>}
            </p>
            <button onClick={clearSearch} className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
              清除搜尋
            </button>
          </div>
        )}

        {/* Type Tabs */}
        <Tabs
          value={filters.messageType}
          onValueChange={(value) => updateFilters({ messageType: value })}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-6 gap-1">
            {broadcastTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-sm px-3 py-2">
                <div className="flex items-center space-x-1">
                  {type.id === "favorites" && <Bookmark className="w-3 h-3" />}
                  <span>{type.name}</span>
                  {type.id === "favorites" && type.count > 0 && (
                    <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">{type.count}</span>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Broadcasts List */}
        <div className="space-y-4">
          {isInitialLoading &&
            filters.messageType !== "favorites" &&
            // 顯示載入中骨架
            Array.from({ length: 5 }).map((_, index) => <BroadcastSkeleton key={index} />)}

          {displayMessages.map((broadcast: any) => (
            <Card
              key={broadcast.id}
              className={`transition-all duration-500 cursor-pointer ${
                selectedBroadcastId === broadcast.id
                  ? "shadow-lg border-primary bg-primary/5"
                  : "hover:shadow-md hover:border-muted-foreground"
              } ${
                filters.messageType === "favorites"
                  ? "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/30"
                  : ""
              } ${
                broadcast.isNew
                  ? "border-green-400 bg-green-50/50 dark:border-green-600 dark:bg-green-950/30 shadow-md animate-in slide-in-from-top-2 duration-500"
                  : ""
              }`}
              onClick={() => handleBroadcastClick(broadcast.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {/* 新訊息指示器 */}
                      {broadcast.isNew && (
                        <Badge
                          variant="outline"
                          className="text-green-700 border-green-400 bg-green-100 dark:text-green-400 dark:border-green-600 dark:bg-green-950 animate-pulse"
                        >
                          新
                        </Badge>
                      )}
                      <Badge
                        variant={getBadgeColor(broadcast.message_type) as any}
                        className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm ${
                          filters.messageType === broadcast.message_type ? "ring-2 ring-primary ring-offset-1" : ""
                        }`}
                        onClick={(e) => handleBadgeClick(e, broadcast.message_type)}
                        title={`點擊篩選「${getBadgeText(broadcast.message_type)}」類型的訊息`}
                      >
                        {getBadgeText(broadcast.message_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{broadcast.channel}</span>
                      <div className="flex items-center">
                        <HighlightText
                          text={broadcast.player_name}
                          searchTerm={filters.keyword}
                          className={`text-sm font-medium ${
                            selectedBroadcastId === broadcast.id ? "text-primary" : "text-primary"
                          } ${broadcast.isNew ? "text-green-700 dark:text-green-400" : ""}`}
                        />
                        {broadcast.player_id && (
                          <span className="text-xs text-muted-foreground">#{broadcast.player_id}</span>
                        )}
                        <PlayerCopyButton
                          playerName={broadcast.player_name}
                          playerId={broadcast.player_id}
                          analytics={analytics}
                        />
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        <TimeAgo timestamp={broadcast.timestamp} />
                      </div>
                      {filters.messageType === "favorites" && broadcast.favorited_at && (
                        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                          <Bookmark className="w-3 h-3 mr-1 fill-current" />
                          <span>收藏於 {new Date(broadcast.favorited_at).toLocaleDateString("zh-TW")}</span>
                        </div>
                      )}
                    </div>
                    <HighlightText
                      text={broadcast.content}
                      searchTerm={filters.keyword}
                      className={`mb-2 ${
                        selectedBroadcastId === broadcast.id ? "text-foreground font-medium" : "text-foreground"
                      } ${broadcast.isNew ? "text-green-800 dark:text-green-300 font-medium" : ""}`}
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <FavoriteButton
                      broadcast={broadcast}
                      onFavoriteChange={handleFavoriteChange}
                      analytics={analytics}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {!isInitialLoading && displayMessages.length === 0 && (
          <div className="text-center py-12">
            {filters.messageType === "favorites" ? (
              <div className="space-y-2">
                <Bookmark className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">您還沒有收藏任何廣播訊息。</p>
                <p className="text-sm text-muted-foreground">點擊訊息右側的書籤圖標來收藏感興趣的訊息！</p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">{error ? "無法載入廣播訊息" : "找不到符合條件的廣播訊息。"}</p>
                {showTestMode && error && (
                  <p className="text-sm text-orange-600 mt-2">
                    🧪 測試模式：如果看到此訊息，表示假資料生成可能有問題。
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Pagination - 只在非收藏模式下顯示 */}
        {!isInitialLoading && filters.messageType !== "favorites" && (hasNext || hasPrev || totalCount > 0) && (
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  goToPage(currentPage - 1)
                  analytics.trackAction("pagination", "user_behavior", {
                    action: "previous_page",
                    from_page: currentPage,
                    to_page: currentPage - 1,
                    total_pages: Math.ceil(totalCount / 50),
                  })
                }}
                disabled={!hasPrev}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一頁</span>
              </Button>

              <span className="text-sm text-muted-foreground">第 {currentPage} 頁</span>

              <Button
                onClick={() => {
                  goToPage(currentPage + 1)
                  analytics.trackAction("pagination", "user_behavior", {
                    action: "next_page",
                    from_page: currentPage,
                    to_page: currentPage + 1,
                    total_pages: Math.ceil(totalCount / 50),
                  })
                }}
                disabled={!hasNext}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>下一頁</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              每頁顯示 50 筆，共 {totalCount} 筆{filters.keyword && `「${filters.keyword}」搜尋結果`}
              {!filters.keyword && "訊息"}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
