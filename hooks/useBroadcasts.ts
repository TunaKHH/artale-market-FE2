"use client"

import { useState, useEffect, useCallback } from "react"
import { getBroadcasts, type BroadcastMessage, type BroadcastsResponse } from "@/lib/api"
import { useActivityDetection } from "./useActivityDetection"

interface UseBroadcastsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  initialPageSize?: number
}

// 擴展 BroadcastMessage 類型以包含新訊息標記
interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
}

export function useBroadcasts({
  autoRefresh = true,
  refreshInterval = 3000, // 3秒
  initialPageSize = 100,
}: UseBroadcastsOptions = {}) {
  const [broadcasts, setBroadcasts] = useState<ExtendedBroadcastMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [savedCountdown, setSavedCountdown] = useState(0)

  // 活動檢測
  const activityState = useActivityDetection({
    inactivityThreshold: 5 * 60 * 1000, // 5分鐘無活動
    checkInterval: 1000, // 每秒檢查
  })

  const [allBroadcasts, setAllBroadcasts] = useState<ExtendedBroadcastMessage[]>([]) // 儲存所有廣播資料
  const [filteredBroadcasts, setFilteredBroadcasts] = useState<ExtendedBroadcastMessage[]>([]) // 搜尋後的結果
  const [previousBroadcastIds, setPreviousBroadcastIds] = useState<Set<number>>(new Set()) // 追蹤之前的訊息 ID

  // 篩選狀態
  const [filters, setFilters] = useState({
    messageType: "all",
    keyword: "",
    playerName: "",
    server: "all",
  })

  // 標記新訊息的函數
  const markNewMessages = useCallback(
    (newMessages: BroadcastMessage[], isInitialLoad = false): ExtendedBroadcastMessage[] => {
      if (isInitialLoad) {
        // 初始載入時不標記任何訊息為新訊息
        return newMessages.map((msg) => ({ ...msg, isNew: false }))
      }

      const now = Date.now()
      return newMessages.map((msg) => {
        const isNewMessage = !previousBroadcastIds.has(msg.id)
        return {
          ...msg,
          isNew: isNewMessage,
          newMessageTimestamp: isNewMessage ? now : undefined,
        }
      })
    },
    [previousBroadcastIds],
  )

  // 移除過期的新訊息標記
  const removeExpiredNewFlags = useCallback((messages: ExtendedBroadcastMessage[]) => {
    const now = Date.now()
    const NEW_MESSAGE_DURATION = 5000 // 5秒後移除新訊息標記

    return messages.map((msg) => {
      if (msg.isNew && msg.newMessageTimestamp && now - msg.newMessageTimestamp > NEW_MESSAGE_DURATION) {
        return { ...msg, isNew: false, newMessageTimestamp: undefined }
      }
      return msg
    })
  }, [])

  // 載入廣播訊息
  const loadBroadcasts = useCallback(
    async (page = 1, isRefresh = false) => {
      try {
        if (!isRefresh) {
          setLoading(true)
        }
        setError(null)
        setRateLimitError(null)

        let response: BroadcastsResponse

        // 判斷是否為首次載入
        const isInitialLoad = previousBroadcastIds.size === 0
        
        // 首次載入時不傳送 messageType 篩選，獲取所有資料
        response = await getBroadcasts({
          page,
          pageSize: isInitialLoad ? 5000 : Math.min(initialPageSize, 200), // 首次載入時不限制，後續為 100 筆
          messageType: isInitialLoad ? undefined : (filters.messageType === "all" ? undefined : filters.messageType),
          playerName: filters.playerName || undefined,
          initialLoad: isInitialLoad, // 傳遞首次載入標記
        })

        // 標記新訊息
        const messagesWithNewFlags = markNewMessages(response.messages, isInitialLoad)

        // 更新之前的訊息 ID 集合
        const newIds = new Set(response.messages.map((msg) => msg.id))
        setPreviousBroadcastIds(newIds)

        // 如果是第一頁，儲存所有資料用於搜尋
        if (page === 1) {
          setAllBroadcasts(messagesWithNewFlags)
        }

        setBroadcasts(messagesWithNewFlags)
        setHasNext(response.has_next)
        setHasPrev(response.has_prev)
        setCurrentPage(response.page)

        // 如果有新訊息，在控制台顯示通知
        const newMessagesCount = messagesWithNewFlags.filter((msg) => msg.isNew).length
        if (newMessagesCount > 0 && !isInitialLoad) {
          console.log(`🆕 收到 ${newMessagesCount} 條新廣播訊息`)
        }
      } catch (err) {
        console.error("載入廣播訊息失敗:", err)

        if (err instanceof Error && err.message.includes("429")) {
          setRateLimitError("請求過於頻繁，請稍後再試。後端伺服器正在保護 API 不被過度使用。")
        } else {
          setError(err instanceof Error ? err.message : "載入廣播訊息失敗")
        }
      } finally {
        setLoading(false)
        setIsInitialLoading(false)
      }
    },
    [filters.playerName, initialPageSize, mounted, markNewMessages, previousBroadcastIds.size],
  )

  // 更新篩選條件
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // 重置頁數
  }, [])

  // 刷新資料
  const refresh = useCallback(() => {
    loadBroadcasts(currentPage, true)
    // 手動刷新後重新開始倒數計時
    if (!isPaused && autoRefresh) {
      setCountdown(Math.floor(refreshInterval / 1000))
    }
  }, [loadBroadcasts, currentPage, isPaused, autoRefresh, refreshInterval])

  // 清除 rate limit 錯誤
  const clearRateLimitError = useCallback(() => {
    setRateLimitError(null)
  }, [])

  // 切換暫停/恢復刷新
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev)
  }, [])

  // 設置 hover 狀態
  const setHoverState = useCallback(
    (hovering: boolean) => {
      if (hovering) {
        // 進入 hover 時保存當前倒數
        setSavedCountdown(countdown)
      } else {
        // 離開 hover 時恢復倒數
        if (savedCountdown > 0) {
          setCountdown(savedCountdown)
        }
      }
      setIsHovering(hovering)
    },
    [countdown, savedCountdown],
  )

  // 換頁
  const goToPage = useCallback(
    (page: number) => {
      loadBroadcasts(page)
    },
    [loadBroadcasts],
  )

  // 客戶端掛載
  useEffect(() => {
    setMounted(true)
  }, [])

  // 客戶端搜尋函數
  const performClientSearch = useCallback(
    (searchTerm: string, messageType: string) => {
      if (!searchTerm.trim()) {
        setFilteredBroadcasts([])
        return
      }

      const keyword = searchTerm.toLowerCase()
      const filtered = allBroadcasts.filter((broadcast) => {
        // 訊息類型篩選
        if (messageType !== "all" && broadcast.message_type !== messageType) {
          return false
        }

        // 關鍵字搜尋（搜尋內容和玩家名稱）
        const searchText = `${broadcast.content} ${broadcast.player_name}`.toLowerCase()
        return searchText.includes(keyword)
      })

      setFilteredBroadcasts(filtered)
    },
    [allBroadcasts],
  )

  // 當搜尋關鍵字或訊息類型改變時執行搜尋
  useEffect(() => {
    if (filters.keyword.trim()) {
      performClientSearch(filters.keyword, filters.messageType)
    } else {
      setFilteredBroadcasts([])
    }
  }, [filters.keyword, filters.messageType, performClientSearch])

  // 初始載入和篩選變更時重新載入
  useEffect(() => {
    if (mounted) {
      loadBroadcasts(1)
    }
  }, [loadBroadcasts, mounted])

  // 自動刷新與倒數計時 - 整合智能間隔
  useEffect(() => {
    if (!autoRefresh || !mounted || isPaused) {
      if (!isHovering) {
        setCountdown(0)
      }
      return
    }

    // 如果頁面不可見或用戶非活躍，暫停請求
    if (activityState.shouldPauseRequests) {
      console.log(`⏸️ 暫停 API 請求 - 頁面可見: ${activityState.isPageVisible}, 用戶活躍: ${activityState.isUserActive}`)
      setCountdown(0)
      return
    }

    if (isHovering) {
      // hover 時不進行倒數，但保持當前值
      return
    }

    // 獲取智能調整後的間隔
    const smartInterval = activityState.getRecommendedInterval(refreshInterval)
    const smartCountdown = Math.floor(smartInterval / 1000)

    // 如果沒有有效的倒數，重新開始
    if (countdown <= 0) {
      setCountdown(smartCountdown)
      console.log(`🤖 智能間隔調整: ${refreshInterval}ms → ${smartInterval}ms (${smartCountdown}秒)`)
    }

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refresh()
          return smartCountdown
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [
    autoRefresh, 
    refreshInterval, 
    refresh, 
    mounted, 
    isPaused, 
    isHovering, 
    countdown,
    activityState.shouldPauseRequests,
    activityState.getRecommendedInterval,
    activityState.isPageVisible,
    activityState.isUserActive
  ])

  // 定期移除過期的新訊息標記
  useEffect(() => {
    const interval = setInterval(() => {
      setBroadcasts((prev) => removeExpiredNewFlags(prev))
      setAllBroadcasts((prev) => removeExpiredNewFlags(prev))
      setFilteredBroadcasts((prev) => removeExpiredNewFlags(prev))
    }, 1000) // 每秒檢查一次

    return () => clearInterval(interval)
  }, [removeExpiredNewFlags])

  // 取得統計資料 - 智能統計邏輯
  const getTypeCounts = useCallback(() => {
    const currentData = filters.keyword.trim() ? filteredBroadcasts : broadcasts

    // 如果有選擇特定類型篩選，只顯示當前篩選結果的統計
    if (filters.messageType !== "all") {
      return {
        all: currentData.length,
        sell: filters.messageType === "sell" ? currentData.length : 0,
        buy: filters.messageType === "buy" ? currentData.length : 0,
        team: filters.messageType === "team" ? currentData.length : 0,
        other: filters.messageType === "other" ? currentData.length : 0,
      }
    }

    // 沒有類型篩選時，顯示當前載入資料的統計
    return {
      all: currentData.length,
      sell: currentData.filter((b) => b.message_type === "sell").length,
      buy: currentData.filter((b) => b.message_type === "buy").length,
      team: currentData.filter((b) => b.message_type === "team").length,
      other: currentData.filter((b) => b.message_type === "other").length,
    }
  }, [broadcasts, filteredBroadcasts, filters.messageType, filters.keyword])

  // 根據 messageType 篩選資料
  const getFilteredBroadcasts = useCallback(() => {
    if (!mounted) return []
    
    let data = filters.keyword.trim() ? filteredBroadcasts : broadcasts
    
    // 根據分類篩選
    if (filters.messageType !== "all") {
      data = data.filter(broadcast => broadcast.message_type === filters.messageType)
    }
    
    // 無搜尋時限制顯示 30 筆，有搜尋時顯示全部篩選結果
    if (!filters.keyword.trim()) {
      data = data.slice(0, 30)
    }
    
    return data
  }, [mounted, filters.keyword, filteredBroadcasts, broadcasts, filters.messageType])

  const displayedBroadcasts = getFilteredBroadcasts()

  // 計算實際總資料量
  const getActualTotalCount = useCallback(() => {
    if (!mounted) return 0
    
    // 如果有搜尋，返回搜尋結果的總量
    if (filters.keyword.trim()) {
      let searchData = filteredBroadcasts
      // 根據分類篩選
      if (filters.messageType !== "all") {
        searchData = searchData.filter(broadcast => broadcast.message_type === filters.messageType)
      }
      return searchData.length
    }
    
    // 無搜尋時，返回當前分類的全部資料量
    if (filters.messageType !== "all") {
      return broadcasts.filter(broadcast => broadcast.message_type === filters.messageType).length
    }
    
    // 無搜尋且無分類篩選時，返回全部資料量
    return broadcasts.length
  }, [mounted, filters.keyword, filters.messageType, filteredBroadcasts, broadcasts])

  return {
    // 資料 - 經過關鍵字和分類篩選的資料
    broadcasts: displayedBroadcasts,
    totalCount: getActualTotalCount(),
    displayedCount: mounted ? displayedBroadcasts.length : 0,
    typeCounts: mounted ? getTypeCounts() : { all: 0, sell: 0, buy: 0, team: 0, other: 0 },

    // 其他狀態保持不變...
    loading: mounted ? loading : true,
    isInitialLoading: mounted ? isInitialLoading : true,
    error: mounted ? error : null,
    rateLimitError: mounted ? rateLimitError : null,
    hasNext: mounted ? (filters.keyword.trim() ? false : hasNext) : false, // 搜尋模式下不分頁
    hasPrev: mounted ? (filters.keyword.trim() ? false : hasPrev) : false, // 搜尋模式下不分頁
    currentPage: mounted ? (filters.keyword.trim() ? 1 : currentPage) : 1, // 搜尋模式下頁碼重置為 1
    isPaused: mounted ? isPaused : false,
    isHovering: mounted ? isHovering : false,
    countdown: mounted ? countdown : 0,

    // 篩選
    filters,
    updateFilters,

    // 操作
    refresh,
    goToPage,
    loadBroadcasts,
    clearRateLimitError,
    togglePause,
    setHoverState,

    // 活動狀態資訊
    activityInfo: {
      isPageVisible: activityState.isPageVisible,
      isUserActive: activityState.isUserActive,
      shouldPauseRequests: activityState.shouldPauseRequests,
      timeSinceLastActivity: activityState.timeSinceLastActivity,
      recommendedInterval: activityState.getRecommendedInterval(refreshInterval),
    },
  }
}
