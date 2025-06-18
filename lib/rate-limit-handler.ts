// 速率限制處理工具
import { RateLimitError } from './api'

// 格式化重試時間
export function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} 秒`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0 
    ? `${minutes} 分 ${remainingSeconds} 秒`
    : `${minutes} 分鐘`
}

// 速率限制錯誤處理器
export function handleRateLimitError(error: RateLimitError): {
  title: string
  message: string
  details?: any
  retryAfter?: number
} {
  const { rateLimitInfo, retryAfter } = error
  
  let message = '您的請求頻率過高，請稍後再試。'
  
  if (retryAfter) {
    message += `請等待 ${formatRetryTime(retryAfter)} 後重試。`
  }
  
  let details = null
  if (rateLimitInfo?.endpoint_limits) {
    details = {
      title: '當前 API 限制',
      limits: rateLimitInfo.endpoint_limits,
      devMode: rateLimitInfo.dev_mode
    }
  }
  
  return {
    title: 'API 請求限制',
    message,
    details,
    retryAfter
  }
}

// React Hook 範例（可選）
export function useRateLimitHandler() {
  const handleError = (error: unknown) => {
    if (error instanceof RateLimitError) {
      const errorInfo = handleRateLimitError(error)
      
      // 這裡可以整合你的通知系統
      console.error('Rate limit exceeded:', errorInfo)
      
      // 可以觸發 toast 通知或模態框
      return errorInfo
    }
    
    // 處理其他錯誤
    throw error
  }
  
  return { handleError }
}