"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ActivityStatusProps {
  activityInfo: {
    isPageVisible: boolean
    isUserActive: boolean
    shouldPauseRequests: boolean
    timeSinceLastActivity: number
    recommendedInterval: number
  }
  currentInterval: number
}

export function ActivityStatus({ activityInfo, currentInterval }: ActivityStatusProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}時${minutes % 60}分${seconds % 60}秒`
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  const formatInterval = (ms: number) => {
    return `${ms / 1000}秒`
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm font-medium">智能 API 請求狀態</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">頁面狀態</span>
          <Badge variant={activityInfo.isPageVisible ? "default" : "secondary"}>
            {activityInfo.isPageVisible ? "🟢 可見" : "🔴 隱藏"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">用戶活動</span>
          <Badge variant={activityInfo.isUserActive ? "default" : "secondary"}>
            {activityInfo.isUserActive ? "🟢 活躍" : "🟡 非活躍"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">API 請求</span>
          <Badge variant={activityInfo.shouldPauseRequests ? "destructive" : "default"}>
            {activityInfo.shouldPauseRequests ? "⏸️ 暫停" : "▶️ 運行"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">上次活動</span>
          <span className="text-sm font-mono">
            {formatTime(activityInfo.timeSinceLastActivity)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">基礎間隔</span>
          <span className="text-sm font-mono">
            {formatInterval(currentInterval)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">智能間隔</span>
          <span className="text-sm font-mono text-blue-600">
            {formatInterval(activityInfo.recommendedInterval)}
          </span>
        </div>
        
        {activityInfo.recommendedInterval !== currentInterval && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            💡 間隔已從 {formatInterval(currentInterval)} 調整為 {formatInterval(activityInfo.recommendedInterval)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}