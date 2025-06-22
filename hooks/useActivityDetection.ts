"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface ActivityState {
  isPageVisible: boolean
  isUserActive: boolean
  lastActivity: number
  shouldPauseRequests: boolean
}

interface UseActivityDetectionOptions {
  inactivityThreshold?: number // 多久沒活動就視為非活躍 (毫秒)
  checkInterval?: number // 檢查間隔 (毫秒)
}

export function useActivityDetection({
  inactivityThreshold = 5 * 60 * 1000, // 5分鐘
  checkInterval = 1000, // 1秒
}: UseActivityDetectionOptions = {}) {
  const [activityState, setActivityState] = useState<ActivityState>({
    isPageVisible: true,
    isUserActive: true,
    lastActivity: Date.now(),
    shouldPauseRequests: false,
  })

  const lastActivityRef = useRef(Date.now())
  const timersRef = useRef<{
    activityCheck?: NodeJS.Timeout
    cleanup?: (() => void)[]
  }>({
    cleanup: [],
  })

  // 更新最後活動時間
  const updateLastActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    setActivityState(prev => ({
      ...prev,
      lastActivity: now,
      isUserActive: true,
      shouldPauseRequests: false,
    }))
  }, [])

  // 檢查用戶是否活躍
  const checkUserActivity = useCallback(() => {
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityRef.current
    const isActive = timeSinceLastActivity < inactivityThreshold
    
    setActivityState(prev => ({
      ...prev,
      isUserActive: isActive,
      shouldPauseRequests: !prev.isPageVisible || !isActive,
    }))
  }, [inactivityThreshold])

  // 處理頁面可見性變化
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden
    console.log(`🔍 頁面可見性變更: ${isVisible ? '可見' : '隱藏'}`)
    
    setActivityState(prev => ({
      ...prev,
      isPageVisible: isVisible,
      shouldPauseRequests: !isVisible || !prev.isUserActive,
    }))

    // 頁面變為可見時更新活動時間
    if (isVisible) {
      updateLastActivity()
    }
  }, [updateLastActivity])

  // 設置事件監聽器
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // 添加用戶活動事件監聽器
    const handleUserActivity = () => {
      updateLastActivity()
    }

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // 頁面可見性 API
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 清理函數
    const cleanup = () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }

    timersRef.current.cleanup = [cleanup]

    return cleanup
  }, [updateLastActivity, handleVisibilityChange])

  // 定期檢查用戶活動狀態
  useEffect(() => {
    timersRef.current.activityCheck = setInterval(checkUserActivity, checkInterval)

    return () => {
      if (timersRef.current.activityCheck) {
        clearInterval(timersRef.current.activityCheck)
      }
    }
  }, [checkUserActivity, checkInterval])

  // 獲取建議的刷新間隔
  const getRecommendedInterval = useCallback((baseInterval: number) => {
    if (!activityState.isPageVisible) {
      // 頁面在背景時，大幅降低頻率
      return baseInterval * 10 // 延長 10 倍
    }
    
    if (!activityState.isUserActive) {
      // 用戶不活躍時，適度降低頻率
      return baseInterval * 3 // 延長 3 倍
    }
    
    // 用戶活躍時使用原本間隔
    return baseInterval
  }, [activityState.isPageVisible, activityState.isUserActive])

  // 清理定時器
  useEffect(() => {
    return () => {
      timersRef.current.cleanup?.forEach(cleanup => cleanup())
      if (timersRef.current.activityCheck) {
        clearInterval(timersRef.current.activityCheck)
      }
    }
  }, [])

  return {
    ...activityState,
    updateLastActivity,
    getRecommendedInterval,
    // 除錯信息
    timeSinceLastActivity: Date.now() - activityState.lastActivity,
    inactivityThreshold,
  }
}