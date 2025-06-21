import { sendGAEvent } from '@next/third-parties/google'

// 使用者行為追蹤介面
interface UserSession {
  sessionId: string
  startTime: number
  pageViews: number
  interactions: number
  searchCount: number
  lastActivity: number
}

// 取得或創建使用者 session
const getUserSession = (): UserSession => {
  if (typeof window === 'undefined') return {
    sessionId: '',
    startTime: Date.now(),
    pageViews: 0,
    interactions: 0,
    searchCount: 0,
    lastActivity: Date.now()
  }

  const sessionKey = 'analytics_session'
  const stored = localStorage.getItem(sessionKey)

  if (stored) {
    const session = JSON.parse(stored) as UserSession
    // 如果超過 30 分鐘沒活動，創建新 session
    if (Date.now() - session.lastActivity > 30 * 60 * 1000) {
      const newSession: UserSession = {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        pageViews: 0,
        interactions: 0,
        searchCount: 0,
        lastActivity: Date.now()
      }
      localStorage.setItem(sessionKey, JSON.stringify(newSession))
      return newSession
    }
    return session
  }

  const newSession: UserSession = {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    pageViews: 0,
    interactions: 0,
    searchCount: 0,
    lastActivity: Date.now()
  }
  localStorage.setItem(sessionKey, JSON.stringify(newSession))
  return newSession
}

// 更新使用者 session（優化版本，避免不必要的寫入）
const updateUserSession = (updates: Partial<UserSession>) => {
  if (typeof window === 'undefined') return

  const current = getUserSession()
  const updated = {
    ...current,
    ...updates,
    lastActivity: Date.now()
  }
  
  // 只在真的有變化時寫入 localStorage
  if (JSON.stringify(current) !== JSON.stringify(updated)) {
    localStorage.setItem('analytics_session', JSON.stringify(updated))
  }
}

// 取得使用者環境資訊（僅保留必要資訊）
const getUserEnvironment = () => {
  if (typeof window === 'undefined') return {}

  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    is_mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
}

export const useAnalytics = () => {
    // 追蹤廣播搜尋（增強版）
  const trackSearch = (query: string, messageType?: string, resultCount?: number) => {
    const session = getUserSession()
    const environment = getUserEnvironment()

    // 更新 session 搜尋計數
    updateUserSession({
      searchCount: session.searchCount + 1,
      interactions: session.interactions + 1
    })

    sendGAEvent('event', 'search', {
      search_term: query,
      message_type: messageType || 'all',
      result_count: resultCount || 0,
      has_results: (resultCount || 0) > 0,
      session_id: session.sessionId,
      search_sequence: session.searchCount + 1,
      session_duration: Math.floor((Date.now() - session.startTime) / 1000),
      ...environment
    })

    // 追蹤無結果搜尋
    if ((resultCount || 0) === 0) {
      sendGAEvent('event', 'search_no_results', {
        search_term: query,
        message_type: messageType || 'all',
        session_id: session.sessionId,
        search_sequence: session.searchCount + 1
      })
    }
  }

  // 追蹤搜尋後的用戶行為
  const trackSearchInteraction = (action: 'click' | 'copy' | 'share', searchTerm: string, itemId?: string) => {
    sendGAEvent('event', 'search_interaction', {
      interaction_type: action,
      search_term: searchTerm,
      item_id: itemId
    })
  }

  // 追蹤廣播篩選
  const trackFilter = (filterType: string, filterValue: string) => {
    sendGAEvent('event', 'filter_broadcasts', {
      filter_type: filterType,
      filter_value: filterValue
    })
  }

  // 追蹤頁面瀏覽（增強版）
  const trackPageView = (page: string, additionalData?: Record<string, any>) => {
    const session = getUserSession()
    const environment = getUserEnvironment()

    // 更新 session 頁面瀏覽計數
    updateUserSession({
      pageViews: session.pageViews + 1,
      interactions: session.interactions + 1
    })

    sendGAEvent('event', 'page_view', {
      page_title: page,
      session_id: session.sessionId,
      page_sequence: session.pageViews + 1,
      session_duration: Math.floor((Date.now() - session.startTime) / 1000),
      total_interactions: session.interactions + 1,
      ...environment,
      ...additionalData
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

  // 統一的動作追蹤（合併多個重複函數）
  const trackAction = (action: string, category: string, context?: Record<string, any>) => {
    const session = getUserSession()

    updateUserSession({
      interactions: session.interactions + 1
    })

    sendGAEvent('event', 'user_action', {
      action_type: action,
      action_category: category,
      session_id: session.sessionId,
      session_duration: Math.floor((Date.now() - session.startTime) / 1000),
      total_interactions: session.interactions + 1,
      ...context
    })
  }

  // 追蹤停留時間
  const trackTimeSpent = (page: string, timeSpent: number) => {
    const session = getUserSession()

    sendGAEvent('event', 'time_on_page', {
      page_title: page,
      time_spent_seconds: timeSpent,
      session_id: session.sessionId,
      engagement_level: timeSpent > 60 ? 'high' : timeSpent > 30 ? 'medium' : 'low'
    })
  }

  // 取得使用者 session 資訊（供其他組件使用）
  const getSessionInfo = () => {
    return getUserSession()
  }

  // 重置使用者 session（登出或重置時使用）
  const resetSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_session')
    }
  }

  return {
    // 核心功能
    trackSearch,
    trackSearchInteraction,
    trackFilter,
    trackPageView,
    trackApiUsage,
    trackError,

    // 統一動作追蹤
    trackAction,
    trackTimeSpent,

    // 工具函數
    getSessionInfo,
    resetSession
  }
}
