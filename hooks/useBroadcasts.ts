"use client"

import { useState, useEffect, useCallback } from "react"
import { getBroadcasts, type BroadcastMessage, type BroadcastsResponse } from "@/lib/api"

interface UseBroadcastsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  initialPageSize?: number
}

export function useBroadcasts({
  autoRefresh = true,
  refreshInterval = 30000, // 30秒
  initialPageSize = 50,
}: UseBroadcastsOptions = {}) {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [savedCountdown, setSavedCountdown] = useState(0)

  const [allBroadcasts, setAllBroadcasts] = useState<BroadcastMessage[]>([]) // 儲存所有廣播資料
  const [filteredBroadcasts, setFilteredBroadcasts] = useState<BroadcastMessage[]>([]) // 搜尋後的結果

  // 篩選狀態
  const [filters, setFilters] = useState({
    messageType: "all",
    keyword: "",
    playerName: "",
    server: "all",
  })

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

        // 移除搜尋邏輯，只使用一般列表 API
        response = await getBroadcasts({
          page,
          pageSize: Math.min(initialPageSize, 50),
          messageType: filters.messageType === "all" ? undefined : filters.messageType,
          playerName: filters.playerName || undefined,
        })

        // 如果是第一頁，儲存所有資料用於搜尋
        if (page === 1) {
          setAllBroadcasts(response.messages)
        }

        setBroadcasts(response.messages)
        setTotalCount(response.total)
        setHasNext(response.has_next)
        setHasPrev(response.has_prev)
        setCurrentPage(response.page)
      } catch (err) {
        console.error("載入廣播訊息失敗:", err)

        if (err instanceof Error && err.message.includes("429")) {
          setRateLimitError("請求過於頻繁，請稍後再試。後端伺服器正在保護 API 不被過度使用。")
        } else {
          setError(err instanceof Error ? err.message : "載入廣播訊息失敗")
        }
      } finally {
        setLoading(false)
      }
    },
    [filters.messageType, filters.playerName, initialPageSize, mounted],
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

  // 自動刷新與倒數計時
  useEffect(() => {
    if (!autoRefresh || !mounted || isPaused) {
      if (!isHovering) {
        setCountdown(0)
      }
      return
    }

    if (isHovering) {
      // hover 時不進行倒數，但保持當前值
      return
    }

    // 如果沒有有效的倒數，重新開始
    if (countdown <= 0) {
      setCountdown(Math.floor(refreshInterval / 1000))
    }

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refresh()
          return Math.floor(refreshInterval / 1000)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [autoRefresh, refreshInterval, refresh, mounted, isPaused, isHovering, countdown])

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

  return {
    // 資料 - 如果有搜尋關鍵字就顯示搜尋結果，否則顯示原始資料
    broadcasts: mounted ? (filters.keyword.trim() ? filteredBroadcasts : broadcasts) : [],
    totalCount: mounted ? (filters.keyword.trim() ? filteredBroadcasts.length : totalCount) : 0,
    typeCounts: mounted ? getTypeCounts() : { all: 0, sell: 0, buy: 0, team: 0, other: 0 },

    // 其他狀態保持不變...
    loading: mounted ? loading : true,
    error: mounted ? error : null,
    rateLimitError: mounted ? rateLimitError : null,
    hasNext: mounted ? (filters.keyword.trim() ? false : hasNext) : false, // 搜尋模式下不分頁
    hasPrev: mounted ? (filters.keyword.trim() ? false : hasPrev) : false, // 搜尋模式下不分頁
    currentPage: mounted ? currentPage : 1,
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
  }
}
