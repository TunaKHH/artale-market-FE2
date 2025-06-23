"use client"

import React, { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BroadcastMessage } from "@/lib/api"

// 擴展訊息類型
interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
}

interface MessageItemProps {
  message: ExtendedBroadcastMessage
  onClick?: (message: ExtendedBroadcastMessage) => void
  isFirst?: boolean
  isLast?: boolean
  showTimestamp?: boolean
  showPlayerInfo?: boolean
  compact?: boolean
}

export const MessageItem = memo<MessageItemProps>(({
  message,
  onClick,
  isFirst = false,
  isLast = false,
  showTimestamp = true,
  showPlayerInfo = true,
  compact = false
}) => {
  
  // 訊息類型配置
  const getMessageTypeConfig = (type: string) => {
    switch (type) {
      case "buy":
        return {
          label: "收購",
          color: "bg-blue-100 text-blue-800",
          icon: "🛒",
          borderColor: "border-blue-200"
        }
      case "sell":
        return {
          label: "販售",
          color: "bg-green-100 text-green-800",
          icon: "💰",
          borderColor: "border-green-200"
        }
      case "team":
        return {
          label: "組隊",
          color: "bg-purple-100 text-purple-800",
          icon: "👥",
          borderColor: "border-purple-200"
        }
      default:
        return {
          label: "其他",
          color: "bg-gray-100 text-gray-800",
          icon: "💬",
          borderColor: "border-gray-200"
        }
    }
  }
  
  // 格式化時間
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 1) {
      return "剛剛"
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分鐘前`
    } else if (diffHours < 24) {
      return `${diffHours}小時前`
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString("zh-TW", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    }
  }
  
  // 格式化完整時間
  const formatFullTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }
  
  // 處理玩家名稱點擊
  const handlePlayerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 這裡可以實作跳轉到玩家詳情頁面
    console.log("點擊玩家:", message.player_name)
  }
  
  // 處理訊息點擊
  const handleMessageClick = () => {
    if (onClick) {
      onClick(message)
    }
  }
  
  const typeConfig = getMessageTypeConfig(message.message_type)
  
  return (
    <div 
      className={`
        group relative transition-all duration-200 ease-in-out
        ${message.isNew ? 'animate-slideInFromTop' : ''}
        ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}
        ${compact ? 'py-2' : 'py-3'}
        px-4 rounded-lg border ${typeConfig.borderColor}
        ${message.isNew ? 'bg-yellow-50 border-yellow-300 shadow-md' : 'bg-white hover:shadow-sm'}
      `}
      onClick={handleMessageClick}
    >
      {/* 新訊息指示器 */}
      {message.isNew && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}
      
      <div className="flex items-start space-x-3">
        {/* 訊息類型圖示 */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0
          ${typeConfig.color}
        `}>
          {typeConfig.icon}
        </div>
        
        {/* 訊息內容 */}
        <div className="flex-1 min-w-0">
          {/* 頭部資訊 */}
          <div className="flex items-center space-x-2 mb-1">
            {/* 訊息類型標籤 */}
            <Badge variant="secondary" className={`text-xs ${typeConfig.color}`}>
              {typeConfig.label}
            </Badge>
            
            {/* 玩家名稱 */}
            {showPlayerInfo && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-sm font-medium text-gray-700 hover:text-blue-600"
                onClick={handlePlayerClick}
              >
                {message.player_name}
              </Button>
            )}
            
            {/* 時間戳 */}
            {showTimestamp && (
              <span 
                className="text-xs text-gray-500"
                title={formatFullTime(message.timestamp)}
              >
                {formatTime(message.timestamp)}
              </span>
            )}
            
            {/* AI 分析標籤 */}
            {message.ai_analyzed && message.ai_confidence && (
              <Badge variant="outline" className="text-xs">
                AI {Math.round(message.ai_confidence * 100)}%
              </Badge>
            )}
          </div>
          
          {/* 訊息內容 */}
          <div className={`
            text-gray-900 break-words
            ${compact ? 'text-sm' : 'text-base'}
            ${message.isNew ? 'font-medium' : ''}
          `}>
            {message.content}
          </div>
          
          {/* 頻道資訊 */}
          {message.channel && (
            <div className="mt-1 text-xs text-gray-400">
              頻道: {message.channel}
            </div>
          )}
        </div>
        
        {/* 操作按鈕（hover 時顯示） */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            title="複製訊息"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(message.content)
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            title="分享訊息"
            onClick={(e) => {
              e.stopPropagation()
              const shareText = `${message.player_name}: ${message.content}`
              if (navigator.share) {
                navigator.share({ text: shareText })
              } else {
                navigator.clipboard.writeText(shareText)
              }
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
})

MessageItem.displayName = "MessageItem"