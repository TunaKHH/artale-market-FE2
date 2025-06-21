import { sendGAEvent } from '@next/third-parties/google'

export const useMapleAnalytics = () => {
  // 只追蹤楓之谷交易平台特有的行為
  
  // 搜尋物品 (最重要)
  const trackSearch = (searchTerm: string, messageType?: string) => {
    sendGAEvent('event', 'search', {
      search_term: searchTerm,
      message_type: messageType || 'all'
    })
  }

  // 篩選訊息類型 (買/賣/組隊)
  const trackFilter = (messageType: 'buy' | 'sell' | 'team' | 'other') => {
    sendGAEvent('event', 'filter_messages', {
      message_type: messageType
    })
  }

  // API 錯誤 (速率限制等)
  const trackApiError = (errorType: string, endpoint: string) => {
    sendGAEvent('event', 'api_error', {
      error_type: errorType,
      endpoint: endpoint
    })
  }

  return {
    trackSearch,
    trackFilter,
    trackApiError
  }
}
