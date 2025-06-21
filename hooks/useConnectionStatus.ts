import { useState, useEffect } from 'react'

interface ConnectionStatus {
  isConnected: boolean
  currentEndpoint: string | null
  failoverCount: number
  lastFailover: number | null
}

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: true,
    currentEndpoint: null,
    failoverCount: 0,
    lastFailover: null
  })

  useEffect(() => {
    let mounted = true

    // 監聽全域的連線事件（需要從 api.ts 發送）
    const handleConnectionChange = (event: CustomEvent) => {
      if (!mounted) return
      
      const { isConnected, endpoint, failoverCount } = event.detail
      setStatus(prev => ({
        isConnected,
        currentEndpoint: endpoint,
        failoverCount,
        lastFailover: !isConnected ? Date.now() : prev.lastFailover
      }))
    }

    // 添加事件監聽器
    window.addEventListener('api-connection-change', handleConnectionChange as EventListener)

    return () => {
      mounted = false
      window.removeEventListener('api-connection-change', handleConnectionChange as EventListener)
    }
  }, [])

  return status
}

// 工具函數：發送連線狀態事件（在 api.ts 中使用）
export const emitConnectionChange = (isConnected: boolean, endpoint: string, failoverCount: number) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api-connection-change', {
      detail: { isConnected, endpoint, failoverCount }
    }))
  }
}
