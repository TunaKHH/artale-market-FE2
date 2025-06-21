"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, Search, RefreshCw, AlertCircle, Copy, Check, ChevronLeft, ChevronRight, Loader2, X, Pause, Play } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "../components/header"
import { useBroadcasts } from "@/hooks/useBroadcasts"

// 時間格式化組件 - 避免 hydration 錯誤
const TimeAgo = ({ timestamp }: { timestamp: string }) => {
  const [timeAgo, setTimeAgo] = useState<string>('')
  const [fullTimestamp, setFullTimestamp] = useState<string>('')
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

      if (minutes < 1) setTimeAgo('剛剛')
      else if (minutes < 60) setTimeAgo(`${minutes}分鐘前`)
      else if (hours < 24) setTimeAgo(`${hours}小時前`)
      else setTimeAgo(`${days}天前`)

      // 設定完整的時間戳顯示 (台灣時間格式)
      setFullTimestamp(date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }))
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
      className="cursor-help border-b border-dotted border-gray-400 hover:border-gray-600"
    >
      {timeAgo}
    </span>
  )
}

// 玩家複製按鈕組件
const PlayerCopyButton = ({ playerName, playerId }: { playerName: string, playerId?: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const textToCopy = playerId ? `${playerName}#${playerId}` : playerName
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // 2秒後恢復原狀
    } catch (err) {
      console.error('複製失敗:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-gray-600 transition-colors"
      title={`複製 ${playerId ? `${playerName}#${playerId}` : playerName}`}
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
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
            <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
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
  const [isSearching, setIsSearching] = useState(false)
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 客戶端掛載檢測
  useEffect(() => {
    setMounted(true)
  }, [])

  // 使用自定義 Hook 取得廣播資料
  const {
    broadcasts,
    totalCount,
    typeCounts,
    loading,
    error,
    rateLimitError,
    filters,
    updateFilters,
    refresh,
    hasNext,
    hasPrev,
    currentPage,
    goToPage,
    clearRateLimitError,
    isPaused,
    togglePause,
    countdown,
    isHovering,
    setHoverState
  } = useBroadcasts({
    autoRefresh: true,
    refreshInterval: 30000
  })

  // 處理搜尋 (防抖機制)
  const handleSearch = (value: string) => {
    setSearchInput(value)

    // 清除之前的 timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 如果有輸入內容，顯示搜尋中狀態
    if (value.trim()) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }

    // 設定新的 timeout，延遲 800ms 執行搜尋
    searchTimeoutRef.current = setTimeout(() => {
      updateFilters({ keyword: value.trim() })
      setIsSearching(false) // 搜尋完成，取消載入狀態
    }, 800)
  }

  // 清理 timeout 和搜尋狀態
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      setIsSearching(false)
    }
  }, [])

  // 處理卡片點擊
  const handleBroadcastClick = (broadcastId: string) => {
    setSelectedBroadcastId(prev => prev === broadcastId ? null : broadcastId)
  }

  // 取得廣播類型選項
  const broadcastTypes = [
    { id: "all", name: "全部", count: typeCounts.all },
    { id: "sell", name: "賣", count: typeCounts.sell },
    { id: "buy", name: "買", count: typeCounts.buy },
    { id: "team", name: "組隊", count: typeCounts.team },
    { id: "other", name: "其他", count: typeCounts.other },
  ]


  // 在未掛載時顯示載入狀態
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">廣播訊息</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-orange-300 rounded-md bg-orange-50 text-orange-400"
                >
                  <Pause className="w-4 h-4" />
                  <span>暫停</span>
                </button>
                <button
                  disabled
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-400"
                >
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  <span>刷新</span>
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-6">載入中...</p>
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Description */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">廣播訊息</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={togglePause}
                variant={(isPaused || isHovering) ? "default" : "outline"}
                size="sm"
                className={`flex items-center space-x-2 ${
                  isPaused 
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                    : isHovering
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                    : "border-orange-500 text-orange-600 hover:bg-orange-50"
                }`}
                title={
                  isPaused 
                    ? "恢復自動刷新" 
                    : isHovering 
                    ? "滑鼠懸停時自動暫停" 
                    : "暫停自動刷新"
                }
              >
                {(isPaused || isHovering) ? (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{isPaused ? "恢復" : "懸停中"}</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>
                      {countdown > 0 ? `暫停 (${countdown}s)` : "暫停"}
                    </span>
                  </>
                )}
              </Button>
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>刷新</span>
              </Button>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            即時顯示遊戲內的廣播訊息( 30 分鐘內 )，包括交易、組隊、公會招募等。 目前顯示{" "}
            <span className="font-semibold text-blue-600">{totalCount}</span> 條廣播訊息。
          </p>


          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Rate Limit Error Alert */}
          {rateLimitError && (
            <Alert variant="default" className="mb-6 border-orange-200 bg-orange-50">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="flex-1 ml-2">
                  <AlertDescription className="text-orange-800">
                    {rateLimitError}
                  </AlertDescription>
                </div>
                <button
                  onClick={clearRateLimitError}
                  className="ml-2 text-orange-600 hover:text-orange-800 transition-colors"
                  title="關閉提醒"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Alert>
          )}


          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-gray-400" />
              )}
              <Input
                placeholder="搜尋玩家或訊息..."
                className="max-w-md"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* Type Tabs */}
        <Tabs
          value={filters.messageType}
          onValueChange={(value) => updateFilters({ messageType: value })}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-5 gap-1">
            {broadcastTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-sm px-3 py-2">
                {type.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Broadcasts List */}
        <div 
          className="space-y-4"
          onMouseEnter={() => setHoverState(true)}
          onMouseLeave={() => setHoverState(false)}
        >
          {loading && (
            // 顯示載入中骨架
            Array.from({ length: 5 }).map((_, index) => (
              <BroadcastSkeleton key={index} />
            ))
          )}

          {!loading && broadcasts.map((broadcast) => (
            <Card 
              key={broadcast.id} 
              className={`transition-all duration-200 cursor-pointer ${
                selectedBroadcastId === broadcast.id
                  ? "shadow-lg border-blue-500 bg-blue-50"
                  : "hover:shadow-md hover:border-gray-300"
              }`}
              onClick={() => handleBroadcastClick(broadcast.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={getBadgeColor(broadcast.message_type) as any}>
                        {getBadgeText(broadcast.message_type)}
                      </Badge>
                      <span className="text-sm text-gray-500">{broadcast.channel}</span>
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          selectedBroadcastId === broadcast.id ? "text-blue-700" : "text-blue-600"
                        }`}>
                          {broadcast.player_name}
                        </span>
                        {broadcast.player_id && (
                          <span className="text-xs text-gray-400">#{broadcast.player_id}</span>
                        )}
                        <PlayerCopyButton
                          playerName={broadcast.player_name}
                          playerId={broadcast.player_id}
                        />
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <TimeAgo timestamp={broadcast.timestamp} />
                      </div>
                    </div>
                    <p className={`mb-2 ${
                      selectedBroadcastId === broadcast.id ? "text-gray-800 font-medium" : "text-gray-900"
                    }`}>
                      {broadcast.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {!loading && broadcasts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {error ? '無法載入廣播訊息' : '找不到符合條件的廣播訊息。'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && (hasNext || hasPrev || totalCount > 0) && (
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => goToPage(currentPage - 1)}
                disabled={!hasPrev}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>上一頁</span>
              </Button>

              <span className="text-sm text-gray-600">
                第 {currentPage} 頁
              </span>

              <Button
                onClick={() => goToPage(currentPage + 1)}
                disabled={!hasNext}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>下一頁</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              每頁顯示 50 筆，共 {totalCount} 筆
              {filters.keyword && `「${filters.keyword}」搜尋結果`}
              {!filters.keyword && '訊息'}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
