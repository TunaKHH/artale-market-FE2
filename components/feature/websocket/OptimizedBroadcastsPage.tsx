"use client"

import React, { useState, useCallback, useEffect, useMemo, memo } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useSearchDebounce } from "@/hooks/useDebounce"
import { useWebSocketBroadcasts } from "@/hooks/useWebSocketBroadcasts"
import { useRouter, useSearchParams } from "next/navigation"
import type { BroadcastMessage } from "@/lib/api"

import SearchSection from "./SearchSection"
import { FilterTabs } from "./FilterTabs"
import { VirtualizedMessageList } from "./VirtualizedMessageList"
import { WebSocketErrorBoundary } from "./ErrorBoundary"
import { WebSocketToast } from "./WebSocketToast"

// 擴展訊息類型
interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
  favorited_at?: string
}

interface OptimizedBroadcastsPageProps {
  className?: string
}

const OptimizedBroadcastsPage = memo(function OptimizedBroadcastsPage({
  className
}: OptimizedBroadcastsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 🚀 性能優化：集中狀態管理
  const [searchInput, setSearchInput] = useState("")
  const [messageTypeFilter, setMessageTypeFilter] = useState("all")
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [favoriteMessages, setFavoriteMessages] = useState<ExtendedBroadcastMessage[]>([])
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<number | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // 防抖搜尋（增加延遲時間）
  const { debouncedSearchTerm, isSearching } = useSearchDebounce(searchInput, 800)

  // WebSocket Hook
  const {
    connectionState,
    messages,
    error,
    messageCount,
    isSubscribed,
    connect,
  } = useWebSocketBroadcasts()

  // 🚀 性能優化：useMemo 快取計算結果
  const stats = useMemo(() => {
    const result = { total: 0, sell: 0, buy: 0, team: 0, other: 0 }
    messages.forEach(msg => {
      result.total++
      if (msg.message_type && msg.message_type in result) {
        result[msg.message_type as keyof typeof result]++
      } else {
        result.other++
      }
    })
    return result
  }, [messages])

  // 🚀 性能優化：useMemo 過濾和搜尋邏輯
  const filteredMessages = useMemo(() => {
    let filtered = messages

    // 分類過濾
    if (messageTypeFilter === "favorites") {
      filtered = favoriteMessages
    } else if (messageTypeFilter !== "all") {
      filtered = messages.filter(msg => msg.message_type === messageTypeFilter)
    }

    // 搜尋過濾（只要有輸入就進行搜尋）
    if (debouncedSearchTerm && debouncedSearchTerm.trim().length > 0) {
      const searchTerms = debouncedSearchTerm.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0)
      if (searchTerms.length > 0) {
        filtered = filtered.filter(msg => {
          const searchableText = `${msg.content} ${msg.channel} ${msg.player_name || ''}`.toLowerCase()
          return searchTerms.every(term => searchableText.includes(term))
        })
      }
    }

    return filtered
  }, [messages, favoriteMessages, messageTypeFilter, debouncedSearchTerm])

  // 🚀 性能優化：useCallback 事件處理器
  const handleInputChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  const handleSearch = useCallback(() => {
    if (searchInput.trim()) {
      const trimmedTerm = searchInput.trim()
      setSearchHistory(prev => {
        const newHistory = [trimmedTerm, ...prev.filter(item => item !== trimmedTerm)]
        return newHistory.slice(0, 10)
      })
    }
  }, [searchInput])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }, [handleSearch])

  const handleUseHistorySearch = useCallback((term: string) => {
    setSearchInput(term)
  }, [])

  const handleClearSearchHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  const handleBroadcastClick = useCallback((broadcastId: number) => {
    setSelectedBroadcastId(broadcastId)
  }, [])

  const handleFavoriteChange = useCallback((isAdding?: boolean) => {
    // 更新收藏數量
    const favorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")
    setFavoriteCount(favorites.length)
    setFavoriteMessages(favorites)
  }, [])

  const handleSwitchToFavorites = useCallback(() => {
    setMessageTypeFilter("favorites")
  }, [])

  // 🚀 性能優化：廣播類型配置
  const broadcastTypes = useMemo(() => [
    { id: "all", name: "全部", count: stats.total },
    { id: "sell", name: "賣", count: stats.sell },
    { id: "buy", name: "買", count: stats.buy },
    { id: "team", name: "組隊", count: stats.team },
    { id: "other", name: "其他", count: stats.other },
    { id: "favorites", name: "收藏", count: favoriteCount },
  ], [stats, favoriteCount])

  // 組件掛載效果
  useEffect(() => {
    setMounted(true)

    // 載入收藏訊息
    const favorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")
    setFavoriteCount(favorites.length)
    setFavoriteMessages(favorites)

    // 載入搜尋歷史
    const history = JSON.parse(localStorage.getItem("broadcast-search-history") || "[]")
    setSearchHistory(history)
  }, [])

  // 保存搜尋歷史
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("broadcast-search-history", JSON.stringify(searchHistory))
    }
  }, [searchHistory, mounted])

  if (!mounted) {
    return null // 避免 hydration 問題
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

        {/* 標題和描述 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">廣播訊息</h1>
          </div>

          <p className="text-muted-foreground mb-6">
            {messageTypeFilter === "favorites" ? (
              <>
                顯示您收藏的廣播訊息。目前有{" "}
                <span className="font-semibold text-blue-600">{favoriteCount}</span> 條收藏訊息。
              </>
            ) : (
              "即時顯示遊戲內的廣播訊息，包括交易、組隊、公會招募等。"
            )}
          </p>

          {/* 網路狀態警告 */}
          {typeof navigator !== "undefined" && !navigator.onLine && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ 網路連線異常，WebSocket 功能可能受限
              </AlertDescription>
            </Alert>
          )}

          {/* 搜尋功能 */}
          {messageTypeFilter !== "favorites" && (
            <SearchSection
              searchInput={searchInput}
              onInputChange={handleInputChange}
              onSearch={handleSearch}
              onKeyDown={handleKeyDown}
              searchHistory={searchHistory}
              onUseHistorySearch={handleUseHistorySearch}
              onClearSearchHistory={handleClearSearchHistory}
              isSearching={isSearching}
            />
          )}

          {/* 分類標籤 */}
          <FilterTabs
            currentFilter={messageTypeFilter}
            onFilterChange={setMessageTypeFilter}
            broadcastTypes={broadcastTypes}
          />

          {/* 訊息列表 */}
          <VirtualizedMessageList
            messages={filteredMessages}
            searchTerm={debouncedSearchTerm}
            onBroadcastClick={handleBroadcastClick}
            onFavoriteChange={handleFavoriteChange}
            onSwitchToFavorites={handleSwitchToFavorites}
            selectedBroadcastId={selectedBroadcastId}
          />
        </div>
      </div>
    </WebSocketErrorBoundary>
  )
})

export default OptimizedBroadcastsPage