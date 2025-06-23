"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
  showText?: boolean
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  text = "載入中...",
  showText = true
}: LoadingSpinnerProps) {
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }
  
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <svg 
        className={cn(
          "animate-spin text-blue-600",
          sizeClasses[size]
        )}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {showText && (
        <span className={cn("text-gray-600", textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  )
}

// 載入骨架屏組件
export function MessageSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex items-start space-x-3">
            {/* 頭像骨架 */}
            <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              {/* 玩家名稱和時間 */}
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
              {/* 訊息內容 */}
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              {/* 標籤 */}
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-12" />
                <div className="h-6 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// 連線狀態指示器
export function ConnectionIndicator({ 
  isConnected, 
  className 
}: { 
  isConnected: boolean
  className?: string 
}) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div 
        className={cn(
          "w-2 h-2 rounded-full transition-colors duration-300",
          isConnected 
            ? "bg-green-500 animate-pulse" 
            : "bg-red-500"
        )}
      />
      <span className={cn(
        "text-xs font-medium transition-colors duration-300",
        isConnected ? "text-green-600" : "text-red-600"
      )}>
        {isConnected ? "已連線" : "未連線"}
      </span>
    </div>
  )
}

// 脈動載入動畫
export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: "0.6s"
          }}
        />
      ))}
    </div>
  )
}