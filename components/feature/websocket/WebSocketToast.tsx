"use client"

import React, { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { WebSocketConnectionState } from "@/hooks/useWebSocketBroadcasts"

interface WebSocketToastProps {
  connectionState: WebSocketConnectionState
  error?: string | null
  isSubscribed?: boolean
  messageCount?: number
  showConnectionToasts?: boolean
  showErrorToasts?: boolean
  showNewMessageToasts?: boolean
}

export function WebSocketToast({
  connectionState,
  error = null,
  isSubscribed = false,
  messageCount = 0,
  showConnectionToasts = true,
  showErrorToasts = true,
  showNewMessageToasts = false
}: WebSocketToastProps) {
  const { toast } = useToast()
  const [previousState, setPreviousState] = useState<WebSocketConnectionState>("disconnected")
  const [previousMessageCount, setPreviousMessageCount] = useState(0)
  const [previousError, setPreviousError] = useState<string | null>(null)
  
  // 連線狀態變化通知
  useEffect(() => {
    if (!showConnectionToasts) return
    
    if (previousState !== connectionState) {
      switch (connectionState) {
        case "connected":
          if (previousState !== "connecting") {
            toast({
              title: "WebSocket 已連線",
              description: "即時廣播功能已啟用",
              duration: 3000,
            })
          }
          break
          
        case "connecting":
          if (previousState === "disconnected" || previousState === "error") {
            toast({
              title: "正在連線",
              description: "建立 WebSocket 連線中...",
              duration: 2000,
            })
          }
          break
          
        case "reconnecting":
          toast({
            title: "重新連線中",
            description: "嘗試恢復 WebSocket 連線",
            duration: 3000,
          })
          break
          
        case "disconnected":
          if (previousState === "connected") {
            toast({
              title: "連線已斷開",
              description: "WebSocket 連線中斷",
              variant: "destructive",
              duration: 4000,
            })
          }
          break
          
        case "error":
          if (previousState !== "error") {
            toast({
              title: "連線錯誤",
              description: "WebSocket 連線發生錯誤",
              variant: "destructive",
              duration: 5000,
            })
          }
          break
      }
      
      setPreviousState(connectionState)
    }
  }, [connectionState, previousState, showConnectionToasts, toast])
  
  // 錯誤訊息通知
  useEffect(() => {
    if (!showErrorToasts) return
    
    if (error && error !== previousError) {
      toast({
        title: "WebSocket 錯誤",
        description: error,
        variant: "destructive",
        duration: 6000,
        action: (
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-sm bg-white text-red-600 rounded hover:bg-gray-50"
          >
            重新載入
          </button>
        ),
      })
      setPreviousError(error)
    }
    
    // 清除錯誤時重置
    if (!error && previousError) {
      setPreviousError(null)
    }
  }, [error, previousError, showErrorToasts, toast])
  
  // 新訊息通知
  useEffect(() => {
    if (!showNewMessageToasts) return
    
    const newMessages = messageCount - previousMessageCount
    
    if (newMessages > 0 && previousMessageCount > 0) {
      // 避免初始載入時的通知
      toast({
        title: `收到 ${newMessages} 則新訊息`,
        description: "點擊查看最新廣播",
        duration: 3000,
        action: (
          <button
            onClick={() => {
              // 滾動到最新訊息
              const messageList = document.querySelector('[data-message-list]')
              if (messageList) {
                messageList.scrollTo({
                  top: messageList.scrollHeight,
                  behavior: "smooth"
                })
              }
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            查看
          </button>
        ),
      })
    }
    
    setPreviousMessageCount(messageCount)
  }, [messageCount, previousMessageCount, showNewMessageToasts, toast])
  
  // 訂閱狀態變化通知
  useEffect(() => {
    if (!showConnectionToasts) return
    
    if (connectionState === "connected") {
      if (isSubscribed) {
        toast({
          title: "訊息推送已啟用",
          description: "將即時接收新廣播訊息",
          duration: 2000,
        })
      }
    }
  }, [isSubscribed, connectionState, showConnectionToasts, toast])
  
  return null // 這個組件不渲染任何內容，只處理通知
}

// Hook 版本，更容易整合
export function useWebSocketToast(options: Omit<WebSocketToastProps, 'children'>) {
  return <WebSocketToast {...options} />
}