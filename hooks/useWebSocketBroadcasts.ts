"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { BroadcastMessage } from "@/lib/api"

// 常數定義
const MAX_MESSAGES = 1000              // 最大訊息保留數量
const NEW_MESSAGE_TIMEOUT = 5000       // 新訊息標記超時時間 (ms)
const CLEANUP_INTERVAL = 2000          // 訊息清理間隔時間 (ms)

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
  const [hasMoreHistory, setHasMoreHistory] = useState(false)  // 暫時停用
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

    // 解析 API URL 以獲取基本域名
    let baseUrl: string
    try {
      const url = new URL(apiUrl)
      // 移除路徑部分，只保留協議和域名
      baseUrl = `${url.protocol}//${url.host}`
    } catch (error) {
      // 如果 URL 解析失敗，使用原始邏輯
      console.warn("API URL 解析失敗，使用原始邏輯:", apiUrl)
      baseUrl = apiUrl
    }

    // 將 HTTP(S) URL 轉換為 WebSocket URL
    let wsUrl: string
    if (baseUrl.startsWith('http://')) {
      wsUrl = baseUrl.replace('http://', 'ws://')
    } else if (baseUrl.startsWith('https://')) {
      wsUrl = baseUrl.replace('https://', 'wss://')
    } else {
      // 假設是域名，使用當前協議
      wsUrl = `${protocol}//${baseUrl}`
    }

    // 確保 URL 格式正確
    const finalUrl = `${wsUrl}/ws/broadcasts`
    return finalUrl
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

      const messageStr = JSON.stringify(request)
      wsRef.current.send(messageStr)
    } catch (error) {
      console.error("WebSocket 發送訊息失敗:", error)
      setError("發送訊息失敗")
    }
  }, [])

  // 處理 WebSocket 訊息
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const response: WebSocketResponse = JSON.parse(event.data)

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
              if (exists) {
                return prev
              }

              // 將新訊息加到頂部，限制總數量避免記憶體問題
              const updated = [newMessage, ...prev]
              return updated.slice(0, MAX_MESSAGES)
            })
          }
          break

        case "connection_info":
          // console.log("📊 WebSocket 連線資訊:", response.payload)
          break

        case "error":
          const errorPayload = response.payload || {}
          const errorMessage = errorPayload.message || errorPayload.error || "連線發生錯誤"

          console.error("❌ WebSocket 伺服器錯誤:", errorMessage, errorPayload)
          setError(errorMessage)
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

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnectionState("connected")
        setConnectionAttempts(prev => prev + 1)
        reconnectAttemptsRef.current = 0

        // 啟動心跳檢測
        startPing()

        // 自動訂閱新訊息
        if (enableAutoSubscribe) {
          subscribeToNewMessages()
        }

      }

      ws.onclose = (event) => {
        console.log("🔌 WebSocket 連線關閉:", event.code, event.reason)
        setConnectionState("disconnected")
        setIsSubscribed(false)
        stopPing()

        // 提供更詳細的關閉原因
        if (event.code === 1006) {
          setError("WebSocket 連線異常中斷，可能是網路問題或伺服器未啟動")
        } else if (event.code === 1000) {
          console.log("✅ WebSocket 正常關閉")
        }

        if (!isManualDisconnectRef.current) {
          reconnectAttemptsRef.current++
          scheduleReconnect()
        }
      }

      ws.onerror = (error) => {
        console.error("❌ WebSocket 連線錯誤:", error)
        console.error("🔧 WebSocket URL:", wsUrl)
        console.error("🔧 WebSocket 狀態:", ws.readyState)
        setConnectionState("error")
        setError(`WebSocket 連線失敗，請檢查後端服務是否啟動 (${wsUrl})`)
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
        const errorMsg = response.payload?.message || response.payload?.error || "載入最新訊息失敗"
        console.error("❌ 載入最新訊息錯誤:", errorMsg, response.payload)
        setError(errorMsg)
      }
    })
  }, [sendMessage, generateRequestId, initialMessageLimit])

  // 載入歷史訊息（暫時停用）
  const loadHistoryBefore = useCallback((timestamp: string, limit: number = 50) => {
    console.log("🚫 載入歷史訊息功能已暫時停用")
    return Promise.resolve([])
  }, [])

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
              Date.now() - msg.newMessageTimestamp > NEW_MESSAGE_TIMEOUT) {
            return { ...msg, isNew: false, newMessageTimestamp: undefined }
          }
          return msg
        })
      )
    }, CLEANUP_INTERVAL)

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