"use client"

import { Alert, AlertDescription } from "../../ui/alert"
import { Button } from "../../ui/button"
import { Wifi, WifiOff, RefreshCw, X, AlertCircle } from "lucide-react"
import type { WebSocketConnectionState } from "@/hooks/useWebSocketBroadcasts"

interface ConnectionStatusProps {
  connectionState: WebSocketConnectionState
  isSubscribed: boolean
  connectionAttempts: number
  messageCount: number
  error: string | null
  onReconnect: () => void
  onClearError: () => void
  compact?: boolean
}

export function ConnectionStatus({
  connectionState,
  isSubscribed,
  connectionAttempts,
  messageCount,
  error,
  onReconnect,
  onClearError,
  compact = false
}: ConnectionStatusProps) {

  // 如果有錯誤訊息，優先顯示錯誤
  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800 mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <div className="font-medium">WebSocket 連線錯誤</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onReconnect}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-800 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              重新連線
            </Button>
            <Button
              onClick={onClearError}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-100"
              title="關閉錯誤訊息"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // 如果是緊湊模式，只顯示基本狀態
  if (compact) {
    return (
      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
        <div className="flex items-center space-x-2">
          {connectionState === "connected" ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <span>
            {connectionState === "connected" ? "已連線" :
              connectionState === "connecting" ? "連線中..." :
                connectionState === "reconnecting" ? "重新連線中..." :
                  "未連線"}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <span>訊息: {messageCount}</span>
          <span>嘗試: {connectionAttempts}</span>
        </div>
      </div>
    )
  }

  // 詳細狀態顯示
  const getStatusInfo = () => {
    switch (connectionState) {
      case "connected":
        return {
          icon: <Wifi className="h-4 w-4 text-green-600" />,
          title: "WebSocket 已連線",
          description: isSubscribed ? "即時推送已啟用" : "已連線，但未訂閱推送",
          alertClass: "border-green-200 bg-green-50 text-green-800"
        }
      case "connecting":
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />,
          title: "正在連線",
          description: "建立 WebSocket 連線中...",
          alertClass: "border-blue-200 bg-blue-50 text-blue-800"
        }
      case "reconnecting":
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin text-orange-600" />,
          title: "重新連線中",
          description: `正在嘗試重新連線 (第 ${connectionAttempts} 次)`,
          alertClass: "border-orange-200 bg-orange-50 text-orange-800"
        }
      case "disconnected":
        return {
          icon: <WifiOff className="h-4 w-4 text-gray-600" />,
          title: "連線已斷開",
          description: "WebSocket 連線中斷",
          alertClass: "border-gray-200 bg-gray-50 text-gray-800"
        }
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-600" />,
          title: "連線錯誤",
          description: "WebSocket 連線發生錯誤",
          alertClass: "border-red-200 bg-red-50 text-red-800"
        }
      default:
        return {
          icon: <WifiOff className="h-4 w-4 text-gray-600" />,
          title: "未知狀態",
          description: "連線狀態未知",
          alertClass: "border-gray-200 bg-gray-50 text-gray-800"
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Alert className={`${statusInfo.alertClass} mb-4`}>
      {statusInfo.icon}
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium">{statusInfo.title}</div>
          <div className="text-sm mt-1">{statusInfo.description}</div>
          <div className="text-xs mt-2 space-x-4">
            <span>訊息數量: {messageCount}</span>
            <span>連線嘗試: {connectionAttempts}</span>
            {isSubscribed && <span className="text-green-600">✓ 已訂閱推送</span>}
          </div>
        </div>

        {(connectionState === "disconnected" || connectionState === "error") && (
          <Button
            onClick={onReconnect}
            size="sm"
            variant="outline"
            className="ml-4"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            重新連線
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
