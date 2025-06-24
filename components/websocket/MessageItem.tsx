"use client"

import React, { memo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { HighlightText } from "@/components/HighlightText"
import type { BroadcastMessage } from "@/lib/api"

// 擴展訊息類型
interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
}

// 玩家複製按鈕組件
const PlayerCopyButton = ({
  playerName,
  playerId,
  onSwitchToFavorites
}: {
  playerName: string;
  playerId?: string;
  onSwitchToFavorites?: () => void;
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const textToCopy = playerId ? `${playerName}#${playerId}` : playerName
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      // 複製成功後自動切換到收藏分類
      if (onSwitchToFavorites) {
        setTimeout(() => {
          onSwitchToFavorites()
        }, 300) // 給一點延遲讓用戶看到複製成功的反饋
      }
    } catch (err) {
      console.error("複製失敗:", err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
      title={`複製 ${playerId ? `${playerName}#${playerId}` : playerName}`}
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

// 訊息收藏按鈕組件
export const MessageFavoriteButton = ({
  message,
  onFavoriteChange
}: {
  message: ExtendedBroadcastMessage
  onFavoriteChange?: (isAdding?: boolean) => void
}) => {
  const [isFavorited, setIsFavorited] = useState(false)

  // 檢查收藏狀態
  React.useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")
    setIsFavorited(favorites.some((fav: any) => fav.id === message.id))
  }, [message.id])

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const favorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")

      if (isFavorited) {
        const newFavorites = favorites.filter((fav: any) => fav.id !== message.id)
        localStorage.setItem("broadcast-favorites", JSON.stringify(newFavorites))
        setIsFavorited(false)
        // 呼叫回調函數通知父組件（移除收藏）
        if (onFavoriteChange) {
          onFavoriteChange(false)
        }
      } else {
        const favoriteItem = {
          ...message,
          favorited_at: new Date().toISOString(),
        }
        favorites.push(favoriteItem)
        localStorage.setItem("broadcast-favorites", JSON.stringify(favorites))
        setIsFavorited(true)
        // 呼叫回調函數通知父組件（新增收藏）
        if (onFavoriteChange) {
          onFavoriteChange(true)
        }
      }
    } catch (err) {
      console.error("收藏操作失敗:", err)
    }
  }

  return (
    <button
      onClick={handleFavorite}
      className={`inline-flex items-center justify-center w-4 h-4 transition-colors ${isFavorited
        ? "text-blue-500 hover:text-blue-600"
        : "text-muted-foreground hover:text-blue-500"
        }`}
      title={isFavorited ? "取消收藏" : "收藏此訊息"}
    >
      <svg
        className="w-3 h-3"
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}

interface MessageItemProps {
  message: ExtendedBroadcastMessage
  onClick?: (message: ExtendedBroadcastMessage) => void
  onSwitchToFavorites?: () => void
  onFavoriteChange?: (isAdding?: boolean) => void
  searchTerm?: string
  isFirst?: boolean
  isLast?: boolean
  showTimestamp?: boolean
  showPlayerInfo?: boolean
  compact?: boolean
}

export const MessageItem = memo<MessageItemProps>(({
  message,
  onClick,
  onSwitchToFavorites,
  onFavoriteChange,
  searchTerm = "",
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
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
          icon: "🛒",
          borderColor: "border-blue-200 dark:border-blue-700/50"
        }
      case "sell":
        return {
          label: "販售",
          color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
          icon: "💰",
          borderColor: "border-green-200 dark:border-green-700/50"
        }
      case "team":
        return {
          label: "組隊",
          color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
          icon: "👥",
          borderColor: "border-purple-200 dark:border-purple-700/50"
        }
      default:
        return {
          label: "其他",
          color: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
          icon: "💬",
          borderColor: "border-gray-200 dark:border-gray-700/50"
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
        ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
        ${compact ? 'py-2' : 'py-3'}
        px-4 rounded-lg border ${typeConfig.borderColor}
        ${message.isNew ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600 shadow-md' : 'bg-transparent hover:shadow-sm'}
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

            {/* 玩家名稱和 ID */}
            {showPlayerInfo && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-sm font-medium text-gray-700 hover:text-blue-600"
                  onClick={handlePlayerClick}
                >
                  <HighlightText
                    text={message.player_id ? `${message.player_name}#${message.player_id}` : message.player_name}
                    searchTerm={searchTerm}
                  />
                </Button>
                <PlayerCopyButton
                  playerName={message.player_name}
                  playerId={message.player_id}
                  onSwitchToFavorites={onSwitchToFavorites}
                />
              </div>
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
            text-gray-900 dark:text-gray-100 break-words
            ${compact ? 'text-sm' : 'text-base'}
            ${message.isNew ? 'font-medium' : ''}
          `}>
            <HighlightText
              text={message.content}
              searchTerm={searchTerm}
            />
          </div>

          {/* 頻道資訊 */}
          {message.channel && (
            <div className="mt-1 text-xs text-gray-400">
              頻道: {message.channel}
            </div>
          )}
        </div>

        {/* 收藏按鈕 */}
        <div className="flex items-center space-x-2">
          <MessageFavoriteButton message={message} onFavoriteChange={onFavoriteChange} />
        </div>
      </div>
    </div>
  )
})

MessageItem.displayName = "MessageItem"