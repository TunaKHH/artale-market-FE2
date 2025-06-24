"use client"

import React, { memo, useRef, useEffect, useCallback, useState } from "react"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { MessageItem } from "./MessageItem"
import { Button } from "@/components/ui/button"
import { LoadingSpinner, MessageSkeleton } from "@/components/ui/loading-spinner"
import { ErrorDisplay, LoadErrorDisplay } from "@/components/ui/error-display"
import { IndeterminateProgressBar } from "@/components/ui/progress-bar"
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
  onSwitchToFavorites?: () => void
  onFavoriteChange?: (isAdding?: boolean) => void
  searchTerm?: string
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
  onSwitchToFavorites,
  onFavoriteChange,
  searchTerm = "",
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
  const [loadingProgress, setLoadingProgress] = useState(0)

  // 無限滾動 Hook
  const {
    loadMoreRef,
    isFetching,
    error: loadError,
    retry
  } = useInfiniteScroll({
    hasMore: hasMoreHistory,
    isLoading: loading,
    threshold: 0.1,
    rootMargin: "50px",
    enabled: enableInfiniteScroll && messages.length > 0,
    onLoadMore: async () => {
      if (messages.length > 0) {
        setLoadingProgress(0)
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => Math.min(prev + 10, 90))
        }, 100)

        try {
          const result = await onLoadMore()
          setLoadingProgress(100)
          setTimeout(() => {
            clearInterval(progressInterval)
            setLoadingProgress(0)
          }, 300)
          return result
        } catch (error) {
          clearInterval(progressInterval)
          setLoadingProgress(0)
          throw error
        }
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

  // 當有新訊息時不自動滾動 - 已停用
  useEffect(() => {
    const currentMessageCount = messages.length
    lastMessageCountRef.current = currentMessageCount
  }, [messages.length])

  // 初始載入時不自動滾動到底部 - 已停用
  // useEffect(() => {
  //   if (messages.length > 0 && lastMessageCountRef.current === 0) {
  //     setTimeout(() => scrollToBottom(false), 200)
  //   }
  // }, [messages.length, scrollToBottom])

  // 清理函數
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // 空狀態
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 animate-fadeInUp">
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800/30 flex items-center justify-center">
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
    <div className="py-4 animate-slideDown">
      {loadError ? (
        <LoadErrorDisplay
          message={loadError}
          onRetry={retry}
          className="mx-4"
        />
      ) : (loading || isFetching) ? (
        <div className="space-y-3">
          {/* 載入進度條 */}
          {loadingProgress > 0 && (
            <div className="px-4">
              <IndeterminateProgressBar size="sm" />
            </div>
          )}

          {/* 載入訊息 */}
          <div className="flex items-center justify-center">
            <LoadingSpinner
              size="sm"
              text="載入歷史訊息..."
              className="text-gray-500"
            />
          </div>
        </div>
      ) : hasMoreHistory ? (
        <div className="flex items-center justify-center animate-scaleIn">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualLoadMore}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            載入更多歷史訊息
          </Button>
        </div>
      ) : (
        <div className="text-center text-gray-400 text-sm py-2 animate-fadeInUp">
          <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
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
          className="absolute bottom-4 right-4 z-10 shadow-lg animate-scaleIn hover:scale-105 transition-transform duration-200"
          size="sm"
          onClick={() => scrollToBottom(true)}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          回到底部
        </Button>
      )}

      {/* 載入遮罩 */}
      {loading && messages.length === 0 && (
        <div className="absolute inset-0 z-20 loading-overlay flex items-center justify-center">
          <LoadingSpinner size="lg" text="載入廣播訊息..." />
        </div>
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
          <MessageSkeleton count={5} />
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.id}-${message.timestamp}`}
                className={`${message.isNew ? 'animate-slideInFromTop' : 'animate-fadeInUp'}`}
                style={{
                  animationDelay: message.isNew ? '0ms' : `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                <MessageItem
                  message={message}
                  onClick={onMessageClick}
                  onSwitchToFavorites={onSwitchToFavorites}
                  onFavoriteChange={onFavoriteChange}
                  isFirst={index === 0}
                  isLast={index === messages.length - 1}
                  searchTerm={searchTerm}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

InfiniteMessageList.displayName = "InfiniteMessageList"