"use client"

import React, { memo, useRef, useEffect, useCallback } from "react"
import { MessageItem } from "./MessageItem"
import type { BroadcastMessage } from "@/lib/api"

// 擴展訊息類型
interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
}

interface MessageListProps {
  messages: ExtendedBroadcastMessage[]
  loading?: boolean
  hasMoreHistory?: boolean
  onLoadMore?: () => void
  onMessageClick?: (message: ExtendedBroadcastMessage) => void
  className?: string
  autoScroll?: boolean
  maxHeight?: string
}

export const MessageList = memo<MessageListProps>(({
  messages,
  loading = false,
  hasMoreHistory = false,
  onLoadMore,
  onMessageClick,
  className = "",
  autoScroll = true,
  maxHeight = "600px"
}) => {
  const listRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(messages.length)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 檢測用戶是否在手動滾動
  const handleScroll = useCallback(() => {
    if (!listRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5
    
    // 如果用戶滾動到接近頂部，觸發載入更多
    if (scrollTop < 100 && hasMoreHistory && onLoadMore && !loading) {
      onLoadMore()
    }
    
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
  }, [hasMoreHistory, onLoadMore, loading])
  
  // 自動滾動到底部（僅限新訊息）
  const scrollToBottom = useCallback((smooth = true) => {
    if (!listRef.current || !autoScroll) return
    
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    })
  }, [autoScroll])
  
  // 當有新訊息時自動滾動
  useEffect(() => {
    const currentMessageCount = messages.length
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current
    
    if (hasNewMessages && !isUserScrollingRef.current) {
      // 檢查是否有真正的新訊息（isNew 標記）
      const hasRealNewMessages = messages.some(msg => msg.isNew)
      
      if (hasRealNewMessages) {
        setTimeout(() => scrollToBottom(true), 100)
      }
    }
    
    lastMessageCountRef.current = currentMessageCount
  }, [messages, scrollToBottom])
  
  // 初始載入時滾動到底部
  useEffect(() => {
    if (messages.length > 0 && lastMessageCountRef.current === 0) {
      setTimeout(() => scrollToBottom(false), 100)
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
  const LoadingSkeleton = () => (
    <div className="space-y-3 p-4">
      {Array.from({ length: 3 }).map((_, index) => (
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
    <div className="flex items-center justify-center py-4 text-gray-500">
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          載入中...
        </>
      ) : hasMoreHistory ? (
        <button 
          onClick={onLoadMore}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          載入更多歷史訊息
        </button>
      ) : (
        <span className="text-gray-400">已載入所有歷史訊息</span>
      )}
    </div>
  )
  
  return (
    <div className={`flex flex-col ${className}`}>
      {/* 載入更多按鈕（頂部） */}
      {(hasMoreHistory || loading) && messages.length > 0 && (
        <LoadMoreIndicator />
      )}
      
      {/* 訊息列表 */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{ maxHeight }}
        onScroll={handleScroll}
      >
        {loading && messages.length === 0 ? (
          <LoadingSkeleton />
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
      
      {/* 訊息計數器 */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t text-sm text-gray-500">
          <span>共 {messages.length} 筆訊息</span>
          {autoScroll && (
            <button
              onClick={() => scrollToBottom(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              滾動到底部
            </button>
          )}
        </div>
      )}
    </div>
  )
})

MessageList.displayName = "MessageList"