"use client"

import React, { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { WebSocketConnectionState } from "@/hooks/useWebSocketBroadcasts"

interface ConnectionStatusProps {
  connectionState: WebSocketConnectionState
  isSubscribed?: boolean
  connectionAttempts?: number
  messageCount?: number
  error?: string | null
  onReconnect?: () => void
  onClearError?: () => void
  compact?: boolean
  className?: string
}

export const ConnectionStatus = memo<ConnectionStatusProps>(({
  connectionState,
  isSubscribed = false,
  connectionAttempts = 0,
  messageCount = 0,
  error = null,
  onReconnect,
  onClearError,
  compact = false,
  className = ""
}) => {
  
  // 連線狀態配置
  const getConnectionConfig = (state: WebSocketConnectionState) => {
    switch (state) {
      case "connected":
        return {
          label: "已連線",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: "🟢",
          indicator: "connected"
        }
      case "connecting":
        return {
          label: "連線中",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: "🟡",
          indicator: "connecting"
        }
      case "reconnecting":
        return {
          label: "重新連線中",
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: "🟠",
          indicator: "connecting"
        }
      case "disconnected":
        return {
          label: "已斷線",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "⚫",
          indicator: "disconnected"
        }
      case "error":
        return {
          label: "連線錯誤",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: "🔴",
          indicator: "error"
        }
      default:
        return {
          label: "未知狀態",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "❓",
          indicator: "disconnected"
        }
    }
  }
  
  const config = getConnectionConfig(connectionState)
  
  // 緊湊模式
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`connection-indicator ${config.indicator}`}>
          <span className="text-xs font-medium">{config.icon}</span>
        </div>
        {error && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-red-600 hover:text-red-800"
            onClick={onClearError}
          >
            清除錯誤
          </Button>
        )}
      </div>
    )
  }
  
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      {/* 標題 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">WebSocket 連線狀態</h3>
        {onReconnect && connectionState !== "connected" && connectionState !== "connecting" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReconnect}
            className="text-xs"
          >
            重新連線
          </Button>
        )}
      </div>
      
      {/* 連線狀態 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">連線狀態:</span>
          <Badge className={config.color}>
            {config.icon} {config.label}
          </Badge>
        </div>
        
        {/* 訂閱狀態 */}
        {connectionState === "connected" && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">訊息推送:</span>
            <Badge className={isSubscribed ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
              {isSubscribed ? "✅ 已訂閱" : "❌ 未訂閱"}
            </Badge>
          </div>
        )}
        
        {/* 統計資訊 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">連線次數:</span>
            <span className="ml-2 font-medium">{connectionAttempts}</span>
          </div>
          <div>
            <span className="text-gray-600">訊息數量:</span>
            <span className="ml-2 font-medium">{messageCount}</span>
          </div>
        </div>
        
        {/* 錯誤訊息 */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">連線錯誤</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              {onClearError && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-red-600 hover:text-red-800"
                  onClick={onClearError}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* 連線說明 */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          {connectionState === "connected" && "即時接收廣播訊息推送"}
          {connectionState === "connecting" && "正在建立 WebSocket 連線..."}
          {connectionState === "reconnecting" && "連線中斷，正在嘗試重新連線..."}
          {connectionState === "disconnected" && "WebSocket 連線已斷開，點擊重新連線"}
          {connectionState === "error" && "WebSocket 連線發生錯誤，請檢查網路連線"}
        </div>
      </div>
    </div>
  )
})

ConnectionStatus.displayName = "ConnectionStatus"