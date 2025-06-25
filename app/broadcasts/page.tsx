"use client"

import React, { Suspense } from "react"
import { Header } from "../components/header"
import { BroadcastsPageSkeleton } from "@/components/feature/websocket/LoadingSpinner"

// 🚀 性能優化：動態載入主要組件
const WebSocketBroadcastsPage = React.lazy(() =>
  import("@/components/feature/websocket").then(module => ({
    default: module.WebSocketBroadcastsPage
  }))
)

export default function BroadcastsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 🚀 性能優化：使用 Suspense 進行程式碼分割 */}
        <Suspense fallback={<BroadcastsPageSkeleton />}>
          <WebSocketBroadcastsPage />
        </Suspense>
      </main>
    </div>
  )
}