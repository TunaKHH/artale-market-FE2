"use client"

import React, { memo, useRef, useEffect, useCallback, useState } from "react"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { MessageItem } from "./MessageItem"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { BroadcastMessage } from "@/lib/api"

// 擴展訊息類型
interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
}

interface InfiniteMessageListProps {
  messages: ExtendedBroadcastMessage[]
  loading?: boolean
  hasMoreHistory?: boolean
  onLoadMore: () => Promise<ExtendedBroadcastMessage[]>
  onMessageClick?: (message: ExtendedBroadcastMessage) => void
  className?: string
  autoScroll?: boolean
  maxHeight?: string
  pageSize?: number
  enableInfiniteScroll?: boolean
}

export const InfiniteMessageList = memo<InfiniteMessageListProps>(({
  messages,
  loading = false,
  hasMoreHistory = false,
  onLoadMore,
  onMessageClick,
  className = "",
  autoScroll = true,
  maxHeight = "600px",
  pageSize = 50,
  enableInfiniteScroll = true
}) => {
  const listRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(messages.length)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  
  // 無限滾動 Hook
  const {
    loadMoreRef,
    isFetching,
    error: loadError,
    retry
  } = useInfiniteScroll({
    hasMore: hasMoreHistory,
    isLoading: loading || isFetching,
    threshold: 0.1,
    rootMargin: "50px",
    enabled: enableInfiniteScroll && messages.length > 0,
    onLoadMore: async () => {
      if (messages.length > 0) {
        const oldestMessage = messages[messages.length - 1]
        return await onLoadMore()
      }
    }
  })
  
  // 檢測用戶滾動行為
  const handleScroll = useCallback(() => {
    if (!listRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10
    const isNearTop = scrollTop < 50
    
    setScrollPosition(scrollTop)
    setShowScrollToBottom(!isAtBottom && scrollHeight > clientHeight)
    
    // 標記用戶正在手動滾動
    isUserScrollingRef.current = true
    
    // 清除之前的計時器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // 500ms 後認為用戶停止滾動
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 500)
  }, [])
  
  // 滾動到底部
  const scrollToBottom = useCallback((smooth = true) => {
    if (!listRef.current) return
    
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    })
  }, [])
  
  // 滾動到頂部
  const scrollToTop = useCallback((smooth = true) => {
    if (!listRef.current) return
    
    listRef.current.scrollTo({
      top: 0,
      behavior: smooth ? "smooth" : "auto"
    })
  }, [])
  
  // 手動載入更多
  const handleManualLoadMore = useCallback(async () => {
    if (!hasMoreHistory || loading || isFetching) return
    
    try {
      await onLoadMore()
    } catch (error) {
      console.error("手動載入更多失敗:", error)
    }
  }, [hasMoreHistory, loading, isFetching, onLoadMore])
  
  // 當有新訊息時自動滾動（僅在用戶未手動滾動時）
  useEffect(() => {
    const currentMessageCount = messages.length
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current
    
    if (hasNewMessages && !isUserScrollingRef.current && autoScroll) {
      // 檢查是否有真正的新訊息（isNew 標記）
      const hasRealNewMessages = messages.some(msg => msg.isNew)
      
      if (hasRealNewMessages) {
        setTimeout(() => scrollToBottom(true), 100)
      }
    }
    
    lastMessageCountRef.current = currentMessageCount
  }, [messages, scrollToBottom, autoScroll])
  
  // 初始載入時滾動到底部
  useEffect(() => {
    if (messages.length > 0 && lastMessageCountRef.current === 0) {
      setTimeout(() => scrollToBottom(false), 200)
    }
  }, [messages.length, scrollToBottom])
  
  // 清理函數
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])
  
  // 載入中骨架屏
  const LoadingSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
  
  // 空狀態
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.13 8.13 0 01-2.939-.543l-3.718 1.239a.75.75 0 01-.935-.935l1.239-3.718A8.13 8.13 0 014 12C4 7.582 7.582 4 12 4s8 3.582 8 8z" />
        </svg>
      </div>
      <p className="text-lg font-medium mb-2">尚無廣播訊息</p>
      <p className="text-sm">等待玩家發送廣播訊息...</p>
    </div>
  )
  
  // 載入更多指示器
  const LoadMoreIndicator = () => (
    <div className="py-4">
      {loadError ? (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>載入失敗: {loadError}</span>
            <Button variant="outline" size="sm" onClick={retry}>
              重試
            </Button>
          </AlertDescription>
        </Alert>
      ) : (loading || isFetching) ? (
        <div className="flex items-center justify-center text-gray-500">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          載入歷史訊息...
        </div>
      ) : hasMoreHistory ? (
        <div className="flex items-center justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualLoadMore}
            className="text-blue-600 hover:text-blue-800"
          >
            載入更多歷史訊息
          </Button>
        </div>
      ) : (
        <div className="text-center text-gray-400 text-sm">
          已載入所有歷史訊息
        </div>
      )}
    </div>
  )
  
  return (
    <div className={`flex flex-col relative ${className}`}>
      {/* 滾動到底部按鈕 */}
      {showScrollToBottom && (
        <Button
          className="absolute bottom-4 right-4 z-10 shadow-lg"
          size="sm"
          onClick={() => scrollToBottom(true)}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          回到底部
        </Button>
      )}
      
      {/* 訊息列表 */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{ maxHeight }}
        onScroll={handleScroll}
        data-message-list
      >
        {/* 載入更多觸發器（頂部） */}
        {enableInfiniteScroll && messages.length > 0 && (
          <div ref={loadMoreRef} className="h-1" />
        )}
        
        {/* 頂部載入指示器 */}
        {messages.length > 0 && (hasMoreHistory || loading || isFetching || loadError) && (
          <LoadMoreIndicator />
        )}
        
        {/* 主要內容 */}
        {loading && messages.length === 0 ? (
          <LoadingSkeleton count={5} />
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 p-4">
            {messages.map((message, index) => (
              <MessageItem
                key={`${message.id}-${message.timestamp}`}
                message={message}
                onClick={onMessageClick}
                isFirst={index === 0}
                isLast={index === messages.length - 1}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 底部狀態欄 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>共 {messages.length} 筆訊息</span>
          {hasMoreHistory && (
            <span className="text-blue-600">
              還有更多歷史訊息
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {scrollPosition > 100 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToTop(true)}
              className="h-6 text-xs"
            >
              回到頂部
            </Button>
          )}
          {autoScroll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToBottom(true)}
              className="h-6 text-xs"
            >
              滾動到底部
            </Button>
          )}
        </div>
      </div>
    </div>
  )
})

InfiniteMessageList.displayName = "InfiniteMessageList"