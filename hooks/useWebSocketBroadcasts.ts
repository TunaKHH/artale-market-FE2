"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { BroadcastMessage } from "@/lib/api"

// WebSocket 連線狀態
export type WebSocketConnectionState = 
  | "connecting" 
  | "connected" 
  | "disconnected" 
  | "error" 
  | "reconnecting"

// WebSocket 訊息類型
interface WebSocketMessage {
  type: string
  request_id?: string
  payload?: any
}

// WebSocket 請求類型
interface WebSocketRequest {
  type: "get_latest" | "get_before" | "subscribe_new" | "unsubscribe" | "ping"
  request_id: string
  payload?: any
}

// WebSocket 回應類型
interface WebSocketResponse {
  type: "latest_data" | "history_data" | "new_message" | "subscription_confirmed" | "unsubscription_confirmed" | "pong" | "error" | "connection_info"
  request_id?: string
  payload?: any
}

// 擴展廣播訊息類型以包含新訊息標記
interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
}

// Hook 配置選項
interface UseWebSocketBroadcastsOptions {
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  pingInterval?: number
  initialMessageLimit?: number
  enableAutoSubscribe?: boolean
}

// Hook 返回值類型
interface UseWebSocketBroadcastsReturn {
  // WebSocket 狀態
  connectionState: WebSocketConnectionState
  isConnected: boolean
  
  // 訊息資料
  messages: ExtendedBroadcastMessage[]
  hasMoreHistory: boolean
  
  // 載入狀態
  isLoadingLatest: boolean
  isLoadingHistory: boolean
  
  // 錯誤狀態
  error: string | null
  
  // 統計資訊
  connectionAttempts: number
  messageCount: number
  
  // 操作方法
  connect: () => void
  disconnect: () => void
  subscribeToNewMessages: () => void
  unsubscribeFromNewMessages: () => void
  loadLatestMessages: (limit?: number) => void
  loadHistoryBefore: (timestamp: string, limit?: number) => void
  clearMessages: () => void
  clearError: () => void
  
  // 訂閱狀態
  isSubscribed: boolean
}

export function useWebSocketBroadcasts({
  autoConnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  pingInterval = 30000,
  initialMessageLimit = 10,
  enableAutoSubscribe = true,
}: UseWebSocketBroadcastsOptions = {}): UseWebSocketBroadcastsReturn {
  
  // WebSocket 相關狀態
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>("disconnected")
  const [messages, setMessages] = useState<ExtendedBroadcastMessage[]>([])
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const [isLoadingLatest, setIsLoadingLatest] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  // WebSocket 引用和內部狀態
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const requestCallbacksRef = useRef<Map<string, (response: WebSocketResponse) => void>>(new Map())
  const reconnectAttemptsRef = useRef(0)
  const isManualDisconnectRef = useRef(false)
  
  // 獲取 WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    
    // 將 HTTP(S) URL 轉換為 WebSocket URL
    let wsUrl: string
    if (apiUrl.startsWith('http://')) {
      wsUrl = apiUrl.replace('http://', 'ws://')
    } else if (apiUrl.startsWith('https://')) {
      wsUrl = apiUrl.replace('https://', 'wss://')
    } else {
      // 假設是域名，使用當前協議
      wsUrl = `${protocol}//${apiUrl}`
    }
    
    return `${wsUrl}/ws/broadcasts`
  }, [])
  
  // 生成唯一請求 ID
  const generateRequestId = useCallback(() => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])
  
  // 發送 WebSocket 訊息
  const sendMessage = useCallback((request: WebSocketRequest, callback?: (response: WebSocketResponse) => void) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket 未連線，無法發送訊息")
      return
    }
    
    try {
      if (callback) {
        requestCallbacksRef.current.set(request.request_id, callback)
      }
      
      wsRef.current.send(JSON.stringify(request))
      console.log("📤 WebSocket 發送訊息:", request.type)
    } catch (error) {
      console.error("WebSocket 發送訊息失敗:", error)
      setError("發送訊息失敗")
    }
  }, [])
  
  // 處理 WebSocket 訊息
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const response: WebSocketResponse = JSON.parse(event.data)
      console.log("📥 WebSocket 收到訊息:", response.type)
      
      // 處理請求回應
      if (response.request_id) {
        const callback = requestCallbacksRef.current.get(response.request_id)
        if (callback) {
          callback(response)
          requestCallbacksRef.current.delete(response.request_id)
          return
        }
      }
      
      // 處理廣播訊息
      switch (response.type) {
        case "new_message":
          if (response.payload) {
            const newMessage: ExtendedBroadcastMessage = {
              ...response.payload,
              isNew: true,
              newMessageTimestamp: Date.now()
            }
            
            setMessages(prev => {
              // 檢查是否已存在相同訊息（去重）
              const exists = prev.some(msg => msg.id === newMessage.id)
              if (exists) return prev
              
              // 將新訊息加到頂部
              return [newMessage, ...prev]
            })
          }
          break
          
        case "connection_info":
          console.log("📊 WebSocket 連線資訊:", response.payload)
          break
          
        case "error":
          console.error("❌ WebSocket 伺服器錯誤:", response.payload)
          setError(response.payload?.message || "伺服器錯誤")
          break
      }
    } catch (error) {
      console.error("解析 WebSocket 訊息失敗:", error)
      setError("解析訊息失敗")
    }
  }, [])
  
  // 啟動心跳檢測
  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: "ping",
          request_id: generateRequestId()
        })
      }
    }, pingInterval)
  }, [sendMessage, generateRequestId, pingInterval])
  
  // 停止心跳檢測
  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])
  
  // 重連邏輯
  const scheduleReconnect = useCallback(() => {
    if (isManualDisconnectRef.current || reconnectAttemptsRef.current >= maxReconnectAttempts) {
      return
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current), 30000)
    console.log(`🔄 WebSocket 將在 ${delay}ms 後重連 (嘗試 ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
    
    setConnectionState("reconnecting")
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, delay)
  }, [reconnectInterval, maxReconnectAttempts])
  
  // 連線 WebSocket
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket 已經連線")
      return
    }
    
    try {
      setConnectionState("connecting")
      setError(null)
      isManualDisconnectRef.current = false
      
      const wsUrl = getWebSocketUrl()
      console.log("🔌 WebSocket 嘗試連線:", wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      ws.onopen = () => {
        console.log("✅ WebSocket 連線成功")
        setConnectionState("connected")
        setConnectionAttempts(prev => prev + 1)
        reconnectAttemptsRef.current = 0
        
        // 啟動心跳檢測
        startPing()
        
        // 自動訂閱新訊息
        if (enableAutoSubscribe) {
          subscribeToNewMessages()
        }
        
        // 自動載入最新訊息
        loadLatestMessages(initialMessageLimit)
      }
      
      ws.onclose = (event) => {
        console.log("🔌 WebSocket 連線關閉:", event.code, event.reason)
        setConnectionState("disconnected")
        setIsSubscribed(false)
        stopPing()
        
        if (!isManualDisconnectRef.current) {
          reconnectAttemptsRef.current++
          scheduleReconnect()
        }
      }
      
      ws.onerror = (error) => {
        console.error("❌ WebSocket 連線錯誤:", error)
        setConnectionState("error")
        setError("WebSocket 連線錯誤")
      }
      
      ws.onmessage = handleMessage
      
    } catch (error) {
      console.error("建立 WebSocket 連線失敗:", error)
      setConnectionState("error")
      setError("建立連線失敗")
      scheduleReconnect()
    }
  }, [getWebSocketUrl, startPing, enableAutoSubscribe, initialMessageLimit, scheduleReconnect, handleMessage])
  
  // 斷開 WebSocket
  const disconnect = useCallback(() => {
    console.log("🔌 手動斷開 WebSocket 連線")
    isManualDisconnectRef.current = true
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    stopPing()
    
    if (wsRef.current) {
      wsRef.current.close(1000, "手動斷開")
      wsRef.current = null
    }
    
    setConnectionState("disconnected")
    setIsSubscribed(false)
  }, [stopPing])
  
  // 訂閱新訊息
  const subscribeToNewMessages = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket 未連線，無法訂閱")
      return
    }
    
    sendMessage({
      type: "subscribe_new",
      request_id: generateRequestId()
    }, (response) => {
      if (response.type === "subscription_confirmed") {
        setIsSubscribed(true)
        console.log("✅ 已訂閱新訊息推送")
      }
    })
  }, [sendMessage, generateRequestId])
  
  // 取消訂閱新訊息
  const unsubscribeFromNewMessages = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }
    
    sendMessage({
      type: "unsubscribe",
      request_id: generateRequestId()
    }, (response) => {
      if (response.type === "unsubscription_confirmed") {
        setIsSubscribed(false)
        console.log("✅ 已取消訂閱新訊息推送")
      }
    })
  }, [sendMessage, generateRequestId])
  
  // 載入最新訊息
  const loadLatestMessages = useCallback((limit: number = initialMessageLimit) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket 未連線，無法載入最新訊息")
      return
    }
    
    setIsLoadingLatest(true)
    setError(null)
    
    sendMessage({
      type: "get_latest",
      request_id: generateRequestId(),
      payload: { limit }
    }, (response) => {
      setIsLoadingLatest(false)
      
      if (response.type === "latest_data" && response.payload) {
        const latestMessages: ExtendedBroadcastMessage[] = response.payload.map((msg: any) => ({
          ...msg,
          isNew: false
        }))
        
        setMessages(latestMessages)
        setHasMoreHistory(latestMessages.length === limit)
        console.log(`📥 載入了 ${latestMessages.length} 筆最新訊息`)
      } else if (response.type === "error") {
        setError(response.payload?.message || "載入最新訊息失敗")
      }
    })
  }, [sendMessage, generateRequestId, initialMessageLimit])
  
  // 載入歷史訊息
  const loadHistoryBefore = useCallback((timestamp: string, limit: number = 50) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket 未連線，無法載入歷史訊息")
      return Promise.resolve([])
    }
    
    setIsLoadingHistory(true)
    setError(null)
    
    return new Promise<ExtendedBroadcastMessage[]>((resolve) => {
      sendMessage({
        type: "get_before",
        request_id: generateRequestId(),
        payload: { before: timestamp, limit }
      }, (response) => {
        setIsLoadingHistory(false)
        
        if (response.type === "history_data" && response.payload) {
          const historyMessages: ExtendedBroadcastMessage[] = response.payload.map((msg: any) => ({
            ...msg,
            isNew: false
          }))
          
          setMessages(prev => {
            // 過濾重複訊息
            const existingIds = new Set(prev.map(msg => msg.id))
            const newMessages = historyMessages.filter(msg => !existingIds.has(msg.id))
            
            // 合併並按時間排序
            const combined = [...prev, ...newMessages]
            return combined.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
          })
          
          setHasMoreHistory(historyMessages.length === limit)
          console.log(`📥 載入了 ${historyMessages.length} 筆歷史訊息`)
          resolve(historyMessages)
        } else if (response.type === "error") {
          const errorMsg = response.payload?.message || "載入歷史訊息失敗"
          setError(errorMsg)
          resolve([])
        }
      })
    })
  }, [sendMessage, generateRequestId])
  
  // 清除訊息
  const clearMessages = useCallback(() => {
    setMessages([])
    setHasMoreHistory(true)
  }, [])
  
  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  // 自動連線
  useEffect(() => {
    if (autoConnect) {
      connect()
    }
    
    // 清理函數
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])
  
  // 清理過期的新訊息標記
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prev => 
        prev.map(msg => {
          if (msg.isNew && msg.newMessageTimestamp && 
              Date.now() - msg.newMessageTimestamp > 5000) {
            return { ...msg, isNew: false, newMessageTimestamp: undefined }
          }
          return msg
        })
      )
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return {
    // WebSocket 狀態
    connectionState,
    isConnected: connectionState === "connected",
    
    // 訊息資料
    messages,
    hasMoreHistory,
    
    // 載入狀態
    isLoadingLatest,
    isLoadingHistory,
    
    // 錯誤狀態
    error,
    
    // 統計資訊
    connectionAttempts,
    messageCount: messages.length,
    
    // 操作方法
    connect,
    disconnect,
    subscribeToNewMessages,
    unsubscribeFromNewMessages,
    loadLatestMessages,
    loadHistoryBefore,
    clearMessages,
    clearError,
    
    // 訂閱狀態
    isSubscribed,
  }
}