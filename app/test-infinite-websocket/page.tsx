"use client"

import React from "react"
import { WebSocketBroadcasts } from "@/components/websocket"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestInfiniteWebSocketPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">無限滾動 WebSocket 測試</h1>
        <p className="text-gray-600">
          測試 WebSocket 即時廣播監控與無限滾動功能
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 主要測試區域 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>📡 WebSocket 廣播監控</CardTitle>
            <CardDescription>
              展示即時接收楓之谷廣播訊息，支援無限滾動載入歷史記錄
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WebSocketBroadcasts
              className="border rounded-lg"
              autoConnect={true}
              showConnectionStatus={true}
              showFilters={true}
              maxHeight="700px"
              enableToasts={true}
              enableErrorBoundary={true}
            />
          </CardContent>
        </Card>

        {/* 功能說明 */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 新功能特色</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold">無限滾動載入</h4>
              <p className="text-sm text-gray-600">
                當滾動到頂部時自動載入更多歷史訊息，支援時間戳分頁
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">智能滾動控制</h4>
              <p className="text-sm text-gray-600">
                檢測用戶滾動行為，新訊息僅在用戶停止滾動時自動滾動到底部
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">載入狀態管理</h4>
              <p className="text-sm text-gray-600">
                顯示載入動畫、錯誤提示，支援手動重試載入
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">滾動輔助功能</h4>
              <p className="text-sm text-gray-600">
                提供「回到頂部」和「回到底部」快捷按鈕
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 測試指南 */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 測試指南</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold">基礎功能測試</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 檢查 WebSocket 自動連線</li>
                <li>• 確認即時訊息推送</li>
                <li>• 測試篩選和搜尋功能</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">無限滾動測試</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 滾動到頂部觸發自動載入</li>
                <li>• 點擊「載入更多」手動載入</li>
                <li>• 確認載入動畫顯示</li>
                <li>• 驗證載入錯誤重試機制</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">用戶體驗測試</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 測試自動滾動邏輯</li>
                <li>• 驗證滾動按鈕功能</li>
                <li>• 檢查新訊息標記效果</li>
                <li>• 確認響應式佈局</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 開發者信息 */}
      <Card>
        <CardHeader>
          <CardTitle>👨‍💻 開發者信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">實現的組件</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• InfiniteMessageList - 無限滾動訊息列表</li>
                <li>• useInfiniteScroll - 無限滾動 Hook</li>
                <li>• useWebSocketBroadcasts - WebSocket 管理</li>
                <li>• WebSocketBroadcasts - 主容器組件</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">技術特性</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Intersection Observer API 滾動監聽</li>
                <li>• Promise-based 異步載入機制</li>
                <li>• 智能去重和時間排序</li>
                <li>• TypeScript 類型安全</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}