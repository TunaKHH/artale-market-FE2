"use client"

import React, { Component, ReactNode } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class WebSocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("WebSocket ErrorBoundary caught an error:", error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
    
    // 呼叫外部錯誤處理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // 上報錯誤到監控系統
    this.reportError(error, errorInfo)
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 這裡可以整合錯誤監控服務 (如 Sentry)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    console.error("WebSocket Error Report:", errorReport)
    
    // 發送到錯誤追蹤服務
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "exception", {
        description: error.message,
        fatal: false,
        custom_map: {
          component: "WebSocket",
          stack: error.stack?.substring(0, 500) // 限制長度
        }
      })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // 使用自定義錯誤 UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 預設錯誤 UI
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              WebSocket 組件錯誤
            </CardTitle>
            <CardDescription>
              WebSocket 廣播組件發生錯誤，請嘗試重新載入或聯繫技術支援
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 錯誤詳情 */}
            <Alert>
              <AlertDescription>
                <strong>錯誤訊息：</strong>{this.state.error?.message}
              </AlertDescription>
            </Alert>
            
            {/* 操作按鈕 */}
            <div className="flex items-center space-x-3">
              <Button onClick={this.handleRetry} className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重試
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新載入頁面
              </Button>
            </div>
            
            {/* 除錯資訊（開發模式） */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                  除錯資訊 (僅開發模式)
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
                  <div className="mb-2">
                    <strong>錯誤堆疊：</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-red-600">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>組件堆疊：</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-blue-600">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}