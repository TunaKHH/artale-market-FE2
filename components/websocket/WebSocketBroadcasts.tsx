"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useWebSocketBroadcasts } from "@/hooks/useWebSocketBroadcasts"
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
  showConnectionStatus = true,
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
  const [filteredMessages, setFilteredMessages] = useState<ExtendedBroadcastMessage[]>([])
  const [showCompactStatus, setShowCompactStatus] = useState(false)
  
  // 篩選訊息
  const filterMessages = useCallback(() => {
    let filtered = messages
    
    // 按訊息類型篩選
    if (messageTypeFilter !== "all") {
      filtered = filtered.filter(msg => msg.message_type === messageTypeFilter)
    }
    
    // 按搜尋關鍵字篩選
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(msg => 
        msg.content.toLowerCase().includes(searchLower) ||
        msg.player_name.toLowerCase().includes(searchLower)
      )
    }
    
    setFilteredMessages(filtered)
  }, [messages, messageTypeFilter, searchTerm])
  
  // 監聽訊息變化並重新篩選
  useEffect(() => {
    filterMessages()
  }, [filterMessages])
  
  // 載入歷史訊息 (返回 Promise)
  const handleLoadMore = useCallback(async () => {
    if (filteredMessages.length > 0) {
      const oldestMessage = filteredMessages[filteredMessages.length - 1]
      return await loadHistoryBefore(oldestMessage.timestamp, 50)
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
  
  // 計算訊息統計
  const getMessageStats = useCallback(() => {
    const stats = {
      total: filteredMessages.length,
      buy: filteredMessages.filter(m => m.message_type === "buy").length,
      sell: filteredMessages.filter(m => m.message_type === "sell").length,
      team: filteredMessages.filter(m => m.message_type === "team").length,
      other: filteredMessages.filter(m => m.message_type === "other").length,
      newMessages: filteredMessages.filter(m => m.isNew).length
    }
    return stats
  }, [filteredMessages])
  
  const stats = getMessageStats()
  
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
          <div className="flex-1 min-w-48">
            <Input
              placeholder="搜尋訊息內容或玩家名稱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>
          
          {/* 訊息類型篩選 */}
          <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類型</SelectItem>
              <SelectItem value="buy">收購</SelectItem>
              <SelectItem value="sell">販售</SelectItem>
              <SelectItem value="team">組隊</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* 統計資訊 */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline">總計: {stats.total}</Badge>
        {stats.buy > 0 && <Badge variant="outline" className="bg-blue-50">收購: {stats.buy}</Badge>}
        {stats.sell > 0 && <Badge variant="outline" className="bg-green-50">販售: {stats.sell}</Badge>}
        {stats.team > 0 && <Badge variant="outline" className="bg-purple-50">組隊: {stats.team}</Badge>}
        {stats.other > 0 && <Badge variant="outline" className="bg-gray-50">其他: {stats.other}</Badge>}
        {stats.newMessages > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 animate-pulse">
            新訊息: {stats.newMessages}
          </Badge>
        )}
      </div>
      
      {/* 訊息列表 */}
      <div className="flex-1">
        <InfiniteMessageList
          messages={filteredMessages}
          loading={isLoadingLatest || isLoadingHistory}
          hasMoreHistory={hasMoreHistory}
          onLoadMore={handleLoadMore}
          onMessageClick={handleMessageClick}
          maxHeight={maxHeight}
          autoScroll={!searchTerm && messageTypeFilter === "all"}
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
          {searchTerm || messageTypeFilter !== "all" 
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