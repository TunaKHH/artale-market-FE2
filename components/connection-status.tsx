"use client"

import { useConnectionStatus } from "../hooks/useConnectionStatus"
import { Alert, AlertDescription } from "./ui/alert"
import { Button } from "./ui/button"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"

export function ConnectionStatus() {
  const { isConnected, failoverCount, lastFailover } = useConnectionStatus()
  const [showSuccessAlert, setShowSuccessAlert] = useState(true)

  // 當連線恢復且有故障轉移時，3秒後自動隱藏成功提示
  useEffect(() => {
    if (isConnected && failoverCount > 0) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isConnected, failoverCount])

  // 當故障轉移次數變化時，重新顯示提示
  useEffect(() => {
    if (failoverCount > 0) {
      setShowSuccessAlert(true)
    }
  }, [failoverCount])

  // 如果連線正常且沒有故障轉移，不顯示任何內容
  if (isConnected && failoverCount === 0) {
    return null
  }

  // 3次失敗後建議重新整理
  if (failoverCount >= 3) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800 mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="font-medium">連線發生問題</div>
            <div className="text-sm mt-1">
              嘗試了多個伺服器都無法連線，建議重新整理頁面
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            className="ml-4 bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            重新整理
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // 顯示故障轉移成功的提示
  if (isConnected && failoverCount > 0 && showSuccessAlert) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-800 mb-4">
        <Wifi className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">連線已恢復</div>
          <div className="text-sm mt-1">
            系統已自動切換到可用的伺服器
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // 顯示連線重試中的提示
  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-4">
      <RefreshCw className="h-4 w-4 animate-spin" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <div className="font-medium">正在重新連線...</div>
          <div className="text-sm mt-1">
            正在嘗試連接到其他伺服器 ({failoverCount}/3)
          </div>
        </div>
        <Button
          onClick={() => window.location.reload()}
          size="sm"
          variant="outline"
          className="ml-4 border-orange-300 text-orange-800 hover:bg-orange-100"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          重新整理
        </Button>
      </AlertDescription>
    </Alert>
  )
}