"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorDisplayProps {
  error: string | Error | null
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  variant?: "default" | "destructive" | "warning"
  showRetry?: boolean
  showDismiss?: boolean
  title?: string
  icon?: React.ReactNode
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className,
  variant = "destructive",
  showRetry = true,
  showDismiss = true,
  title = "發生錯誤",
  icon
}: ErrorDisplayProps) {
  
  if (!error) return null
  
  const errorMessage = error instanceof Error ? error.message : error
  
  const defaultIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    </svg>
  )
  
  return (
    <Alert variant={variant} className={cn("border-l-4", className)}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon || defaultIcon}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-medium text-sm mb-1">
              {title}
            </h4>
          )}
          
          <AlertDescription className="text-sm">
            {errorMessage}
          </AlertDescription>
          
          {(showRetry || showDismiss) && (
            <div className="flex items-center space-x-2 mt-3">
              {showRetry && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 text-xs"
                >
                  重試
                </Button>
              )}
              
              {showDismiss && onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-7 text-xs"
                >
                  關閉
                </Button>
              )}
            </div>
          )}
        </div>
        
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="flex-shrink-0 w-6 h-6 p-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>
    </Alert>
  )
}

// 網路錯誤特化組件
export function NetworkErrorDisplay({
  onRetry,
  className
}: {
  onRetry?: () => void
  className?: string
}) {
  return (
    <ErrorDisplay
      error="網路連線失敗，請檢查您的網路設定"
      onRetry={onRetry}
      title="網路錯誤"
      variant="warning"
      className={className}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
          />
        </svg>
      }
    />
  )
}

// WebSocket 錯誤特化組件
export function WebSocketErrorDisplay({
  error,
  onReconnect,
  className
}: {
  error: string | null
  onReconnect?: () => void
  className?: string
}) {
  if (!error) return null
  
  return (
    <ErrorDisplay
      error={error}
      onRetry={onReconnect}
      title="WebSocket 連線錯誤"
      variant="destructive"
      className={className}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 10V3L4 14h7v7l9-11h-7z" 
          />
        </svg>
      }
    />
  )
}

// 載入錯誤組件
export function LoadErrorDisplay({
  message = "載入資料失敗",
  onRetry,
  className
}: {
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 text-center space-y-3",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-medium text-gray-900">載入失敗</h3>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
      
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          重新載入
        </Button>
      )}
    </div>
  )
}