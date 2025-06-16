"use client"

import { useState, useEffect } from "react"
import { Clock, Filter, Search, RefreshCw, AlertCircle, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "../components/header"
import { useBroadcasts } from "@/hooks/useBroadcasts"
import type { BroadcastMessage } from "@/lib/api"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")

  // 使用自定義 Hook 取得廣播資料
  const {
    broadcasts,
    totalCount,
    typeCounts,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
    hasNext,
    hasPrev,
    currentPage,
    goToPage
  } = useBroadcasts({
    autoRefresh: true,
    refreshInterval: 30000
  })

  // 處理搜尋 (延遲更新)
  const handleSearch = (value: string) => {
    setSearchInput(value)
    // 延遲500ms更新實際搜尋，避免頻繁API調用
    const timer = setTimeout(() => {
      updateFilters({ keyword: value })
    }, 500)
    return () => clearTimeout(timer)
  }

  // 取得廣播類型選項
  const broadcastTypes = [
    { id: "all", name: "全部", count: typeCounts.all },
    { id: "sell", name: "賣", count: typeCounts.sell },
    { id: "buy", name: "買", count: typeCounts.buy },
    { id: "team", name: "組隊", count: typeCounts.team },
    { id: "other", name: "其他", count: typeCounts.other },
  ]

  // 獲取可用的伺服器列表 (從當前廣播中提取)
  const servers = ["all", ...Array.from(new Set(broadcasts.map((b) => b.channel)))]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Description */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">廣播訊息</h1>
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

          <p className="text-gray-600 mb-6">
            即時顯示遊戲內的重要訊息，包括交易、組隊、公會招募等。 目前顯示{" "}
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

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜尋玩家或訊息..."
                className="max-w-md"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  handleSearch(e.target.value)
                }}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select
                value={filters.hours?.toString() || '24'}
                onValueChange={(value) => updateFilters({ hours: parseInt(value) })}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1小時內</SelectItem>
                  <SelectItem value="6">6小時內</SelectItem>
                  <SelectItem value="24">24小時內</SelectItem>
                  <SelectItem value="72">3天內</SelectItem>
                  <SelectItem value="168">7天內</SelectItem>
                </SelectContent>
              </Select>
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
        <div className="space-y-4">
          {loading && (
            // 顯示載入中骨架
            Array.from({ length: 5 }).map((_, index) => (
              <BroadcastSkeleton key={index} />
            ))
          )}

          {!loading && broadcasts.map((broadcast) => (
            <Card key={broadcast.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={getBadgeColor(broadcast.message_type) as any}>
                        {getBadgeText(broadcast.message_type)}
                      </Badge>
                      <span className="text-sm text-gray-500">{broadcast.channel}</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-blue-600">{broadcast.player_name}</span>
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
                    <p className="text-gray-900 mb-2">{broadcast.content}</p>
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

        {/* Auto-refresh notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">廣播訊息每30秒自動更新一次</p>
        </div>
      </main>
    </div>
  )
}
