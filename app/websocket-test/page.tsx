"use client"

import React from "react"
import { WebSocketBroadcasts } from "@/components/websocket"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function WebSocketTestPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          WebSocket 即時廣播測試
        </h1>
        <p className="text-gray-600">
          測試 WebSocket 即時通信功能，驗證新訊息推送、歷史載入和連線管理
        </p>
      </div>
      
      {/* 功能說明 */}
      <Alert className="mb-6">
        <AlertDescription>
          <strong>測試功能：</strong>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>即時接收新廣播訊息</li>
            <li>自動滾動到新訊息</li>
            <li>載入歷史訊息（向上滑動）</li>
            <li>連線狀態監控和重連</li>
            <li>訊息篩選和搜尋</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      {/* WebSocket 測試區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要測試區域 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>WebSocket 廣播訊息</CardTitle>
              <CardDescription>
                即時顯示廣播訊息，支援自動推送和歷史載入
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebSocketBroadcasts
                autoConnect={true}
                showConnectionStatus={true}
                showFilters={true}
                maxHeight="700px"
              />
            </CardContent>
          </Card>
        </div>
        
        {/* 側邊欄資訊 */}
        <div className="space-y-6">
          {/* 測試說明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">測試步驟</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">1. 檢查連線狀態</h4>
                <p className="text-gray-600">
                  確認 WebSocket 顯示為「已連線」且「已訂閱」狀態
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. 測試即時推送</h4>
                <p className="text-gray-600">
                  使用後端測試端點發送測試訊息：
                  <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                    POST /api/v1/test/broadcast
                  </code>
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. 測試歷史載入</h4>
                <p className="text-gray-600">
                  滾動到訊息列表頂部，點擊「載入更多」按鈕
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">4. 測試篩選功能</h4>
                <p className="text-gray-600">
                  使用搜尋框和類型篩選器測試訊息篩選
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">5. 測試重連機制</h4>
                <p className="text-gray-600">
                  斷開連線後觀察自動重連行為
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* 技術規格 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">技術規格</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">WebSocket 端點：</span>
                <code className="block text-xs bg-gray-100 p-1 rounded mt-1">
                  wss://maple-market-api.zeabur.app/ws/broadcasts
                </code>
              </div>
              
              <div>
                <span className="font-medium">支援的訊息類型：</span>
                <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                  <li>get_latest - 獲取最新訊息</li>
                  <li>get_before - 獲取歷史訊息</li>
                  <li>subscribe_new - 訂閱新訊息</li>
                  <li>ping - 心跳檢測</li>
                </ul>
              </div>
              
              <div>
                <span className="font-medium">自動功能：</span>
                <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                  <li>自動連線和重連</li>
                  <li>自動訂閱推送</li>
                  <li>自動滾動到新訊息</li>
                  <li>30秒心跳檢測</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* 效能指標 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">預期效能</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>新訊息延遲:</span>
                <span className="font-medium text-green-600">&lt; 2 秒</span>
              </div>
              <div className="flex justify-between">
                <span>歷史載入時間:</span>
                <span className="font-medium text-green-600">&lt; 3 秒</span>
              </div>
              <div className="flex justify-between">
                <span>支援並發連線:</span>
                <span className="font-medium text-blue-600">3,000+</span>
              </div>
              <div className="flex justify-between">
                <span>記憶體使用:</span>
                <span className="font-medium text-blue-600">優化的</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 除錯資訊 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">除錯提示</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">常見問題：</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 連線失敗：檢查網路連線和後端服務狀態</li>
                <li>• 訊息不更新：確認已訂閱新訊息推送</li>
                <li>• 重複訊息：檢查去重邏輯是否正常運作</li>
                <li>• 效能問題：監控記憶體使用和訊息數量</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">測試 API：</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <code>/api/v1/health</code> - 檢查後端狀態</li>
                <li>• <code>/api/v1/test/broadcast</code> - 發送測試訊息</li>
                <li>• <code>/ws/broadcasts</code> - WebSocket 端點</li>
                <li>• 瀏覽器開發者工具網路面板</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}