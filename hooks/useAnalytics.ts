import { sendGAEvent } from '@next/third-parties/google'

export const useAnalytics = () => {
  // 追蹤廣播搜尋
  const trackSearch = (query: string, messageType?: string) => {
    sendGAEvent('event', 'search', {
      search_term: query,
      message_type: messageType || 'all'
    })
  }

  // 追蹤廣播篩選
  const trackFilter = (filterType: string, filterValue: string) => {
    sendGAEvent('event', 'filter_broadcasts', {
      filter_type: filterType,
      filter_value: filterValue
    })
  }

  // 追蹤頁面瀏覽
  const trackPageView = (page: string) => {
    sendGAEvent('event', 'page_view', {
      page_title: page
    })
  }

  // 追蹤用戶交互
  const trackUserAction = (action: string, category: string, label?: string) => {
    sendGAEvent('event', action, {
      event_category: category,
      event_label: label
    })
  }

  // 追蹤 API 使用情況
  const trackApiUsage = (endpoint: string, success: boolean) => {
    sendGAEvent('event', 'api_call', {
      api_endpoint: endpoint,
      success: success.toString()
    })
  }

  // 追蹤錯誤
  const trackError = (errorType: string, errorMessage: string) => {
    sendGAEvent('event', 'error', {
      error_type: errorType,
      error_message: errorMessage
    })
  }

  return {
    trackSearch,
    trackFilter,
    trackPageView,
    trackUserAction,
    trackApiUsage,
    trackError
  }
}
