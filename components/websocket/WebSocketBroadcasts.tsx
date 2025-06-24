"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { useWebSocketBroadcasts } from "@/hooks/useWebSocketBroadcasts"
import { useSearchDebounce, useDebouncedCallback } from "@/hooks/useDebounce"
import { InfiniteMessageList } from "./InfiniteMessageList"
import { ConnectionStatus } from "./ConnectionStatus"
import { WebSocketErrorBoundary } from "./ErrorBoundary"
import { WebSocketToast } from "./WebSocketToast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { BroadcastMessage } from "@/lib/api"

interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
}

interface WebSocketBroadcastsProps {
  className?: string
  autoConnect?: boolean
  showConnectionStatus?: boolean
  showFilters?: boolean
  maxHeight?: string
  compact?: boolean
  enableToasts?: boolean
  enableErrorBoundary?: boolean
}

function WebSocketBroadcastsContent({
  className = "",
  autoConnect = true,
  showConnectionStatus = false,  // 默認隱藏連線狀態
  showFilters = true,
  maxHeight = "600px",
  compact = false,
  enableToasts = true
}: Omit<WebSocketBroadcastsProps, 'enableErrorBoundary'>) {

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
    autoConnect,
    initialMessageLimit: 20,
    enableAutoSubscribe: true
  })

  // 本地狀態
  const [searchTerm, setSearchTerm] = useState("")
  const [messageTypeFilter, setMessageTypeFilter] = useState("all")
  const [showCompactStatus, setShowCompactStatus] = useState(false)

  // 防抖搜尋
  const { debouncedSearchTerm, isSearching } = useSearchDebounce(searchTerm, 300)

  // 篩選訊息 (使用 useMemo 優化效能)
  const filteredMessages = useMemo(() => {
    let filtered = messages

    // 按訊息類型篩選
    if (messageTypeFilter !== "all") {
      filtered = filtered.filter(msg => msg.message_type === messageTypeFilter)
    }

    // 按搜尋關鍵字篩選 (使用防抖後的搜尋詞)
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(msg =>
        msg.content.toLowerCase().includes(searchLower) ||
        msg.player_name.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [messages, messageTypeFilter, debouncedSearchTerm])

  // 載入歷史訊息 (返回 Promise)
  const handleLoadMore = useCallback(async (): Promise<ExtendedBroadcastMessage[]> => {
    if (filteredMessages.length > 0) {
      const oldestMessage = filteredMessages[filteredMessages.length - 1]
      const result = await loadHistoryBefore(oldestMessage.timestamp, 50)
      return Array.isArray(result) ? result : []
    }
    return []
  }, [filteredMessages, loadHistoryBefore])

  // 訊息點擊處理
  const handleMessageClick = useCallback((message: ExtendedBroadcastMessage) => {
    console.log("點擊訊息:", message)
    // 這裡可以實作訊息詳情彈窗或跳轉
  }, [])

  // 重新連線
  const handleReconnect = useCallback(() => {
    clearError()
    connect()
  }, [clearError, connect])

  // 切換訂閱狀態
  const handleToggleSubscription = useCallback(() => {
    if (isSubscribed) {
      unsubscribeFromNewMessages()
    } else {
      subscribeToNewMessages()
    }
  }, [isSubscribed, subscribeToNewMessages, unsubscribeFromNewMessages])

  // 刷新最新訊息
  const handleRefresh = useCallback(() => {
    loadLatestMessages(20)
  }, [loadLatestMessages])

  // 計算訊息統計 (使用 useMemo 優化效能)
  // 分為兩個統計：全域統計（用於選項數字）和篩選統計（用於顯示）
  const globalStats = useMemo(() => {
    // 全域統計使用所有訊息，用於顯示在選項標籤中
    return {
      total: messages.length,
      buy: messages.filter(m => m.message_type === "buy").length,
      sell: messages.filter(m => m.message_type === "sell").length,
      team: messages.filter(m => m.message_type === "team").length,
      other: messages.filter(m => m.message_type === "other").length,
    }
  }, [messages])

  const stats = useMemo(() => {
    // 當前篩選結果的統計（新訊息通知已移除）
    return {
      total: filteredMessages.length,
      buy: filteredMessages.filter(m => m.message_type === "buy").length,
      sell: filteredMessages.filter(m => m.message_type === "sell").length,
      team: filteredMessages.filter(m => m.message_type === "team").length,
      other: filteredMessages.filter(m => m.message_type === "other").length,
    }
  }, [filteredMessages])

  return (
    <>
      {/* Toast 通知 */}
      {enableToasts && (
        <WebSocketToast
          connectionState={connectionState}
          error={error}
          isSubscribed={isSubscribed}
          messageCount={messageCount}
          showConnectionToasts={true}
          showErrorToasts={true}
          showNewMessageToasts={false}
        />
      )}

      <div className={`flex flex-col space-y-4 ${className}`}>
        {/* 網路狀態警告 */}
        {!navigator.onLine && (
          <Alert>
            <AlertDescription>
              ⚠️ 網路連線異常，WebSocket 功能可能受限
            </AlertDescription>
          </Alert>
        )}

        {/* 連線狀態 */}
        {showConnectionStatus && (
          <ConnectionStatus
            connectionState={connectionState}
            isSubscribed={isSubscribed}
            connectionAttempts={connectionAttempts}
            messageCount={messageCount}
            error={error}
            onReconnect={handleReconnect}
            onClearError={clearError}
            compact={showCompactStatus}
          />
        )}

        {/* 控制按鈕 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {/* 連線控制 */}
            {isConnected ? (
              <Button variant="outline" size="sm" onClick={disconnect}>
                斷開連線
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={connect}>
                連線 WebSocket
              </Button>
            )}

            {/* 訂閱控制 */}
            {isConnected && (
              <Button
                variant={isSubscribed ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleSubscription}
              >
                {isSubscribed ? "取消訂閱" : "訂閱推送"}
              </Button>
            )}

            {/* 刷新按鈕 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={!isConnected || isLoadingLatest}
            >
              {isLoadingLatest ? "載入中..." : "刷新"}
            </Button>

            {/* 清除訊息 */}
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              清除
            </Button>
          </div>

          {/* 狀態切換 */}
          {showConnectionStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompactStatus(!showCompactStatus)}
            >
              {showCompactStatus ? "詳細狀態" : "簡化狀態"}
            </Button>
          )}
        </div>

        {/* 篩選器 */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3">
            {/* 搜尋框 */}
            <div className="flex-1 min-w-48 relative">
              <Input
                placeholder="搜尋訊息內容或玩家名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm pr-8"
              />
              {isSearching && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>

            {/* 訊息類型篩選 */}
            <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="全部類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類型 ({globalStats.total})</SelectItem>
                <SelectItem value="buy">收購 ({globalStats.buy})</SelectItem>
                <SelectItem value="sell">販售 ({globalStats.sell})</SelectItem>
                <SelectItem value="team">組隊 ({globalStats.team})</SelectItem>
                <SelectItem value="other">其他 ({globalStats.other})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 新訊息提示已移除 */}

        {/* 訊息列表 */}
        <div className="flex-1">
          <InfiniteMessageList
            messages={filteredMessages}
            loading={isLoadingLatest || isLoadingHistory}
            hasMoreHistory={hasMoreHistory}
            onLoadMore={handleLoadMore}
            onMessageClick={handleMessageClick}
            maxHeight={maxHeight}
            autoScroll={!debouncedSearchTerm && messageTypeFilter === "all"}
            pageSize={50}
            enableInfiniteScroll={true}
          />
        </div>

        {/* 底部狀態欄 */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-2">
          <span>
            {isConnected ? (
              isSubscribed ? (
                <span className="text-green-600">🟢 即時推送已啟用</span>
              ) : (
                <span className="text-yellow-600">🟡 已連線，未訂閱推送</span>
              )
            ) : (
              <span className="text-red-600">🔴 WebSocket 未連線</span>
            )}
          </span>

          <span>
            {debouncedSearchTerm || messageTypeFilter !== "all"
              ? `篩選結果: ${stats.total} 筆`
              : `載入訊息: ${messageCount} 筆`
            }
          </span>
        </div>
      </div>
    </>
  )
}

// 主要導出組件，包含錯誤邊界
export function WebSocketBroadcasts({
  enableErrorBoundary = true,
  ...props
}: WebSocketBroadcastsProps) {

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error("WebSocket 組件錯誤:", error, errorInfo)

    // 上報到錯誤監控服務
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "exception", {
        description: `WebSocket Error: ${error.message}`,
        fatal: false,
        custom_map: {
          component_stack: errorInfo.componentStack?.substring(0, 500)
        }
      })
    }
  }

  if (enableErrorBoundary) {
    return (
      <WebSocketErrorBoundary onError={handleError}>
        <WebSocketBroadcastsContent {...props} />
      </WebSocketErrorBoundary>
    )
  }

  return <WebSocketBroadcastsContent {...props} />
}