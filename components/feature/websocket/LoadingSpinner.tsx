"use client"

import React, { memo } from "react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

// 🚀 性能優化：使用 memo 和輕量級 CSS
export const LoadingSpinner = memo(function LoadingSpinner({
  size = "md",
  text = "載入中...",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-2 border-muted border-t-primary rounded-full animate-spin`}
        role="status"
        aria-label="載入中"
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
})

// 🚀 性能優化：預設載入頁面組件
export const BroadcastsPageSkeleton = memo(function BroadcastsPageSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 標題骨架 */}
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
      </div>

      {/* 搜尋框骨架 */}
      <div className="h-10 bg-muted rounded animate-pulse" />

      {/* 分類標籤骨架 */}
      <div className="flex space-x-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded px-4 animate-pulse flex-1" />
        ))}
      </div>

      {/* 訊息列表骨架 */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border border-border rounded-lg space-y-2 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-16" />
            </div>
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
})