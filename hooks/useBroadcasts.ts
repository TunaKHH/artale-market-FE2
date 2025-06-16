import { useState, useEffect, useCallback } from 'react'
import { getBroadcasts, searchBroadcasts, type BroadcastMessage, type BroadcastsResponse } from '@/lib/api'

interface UseBroadcastsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  initialHours?: number
  initialPageSize?: number
}

export function useBroadcasts({
  autoRefresh = true,
  refreshInterval = 30000, // 30秒
  initialHours = 24,
  initialPageSize = 50
}: UseBroadcastsOptions = {}) {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // 篩選狀態
  const [filters, setFilters] = useState({
    messageType: 'all',
    hours: initialHours,
    keyword: '',
    playerName: '',
    server: 'all'
  })

  // 載入廣播訊息
  const loadBroadcasts = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true)
      }
      setError(null)

      let response: BroadcastsResponse

      if (filters.keyword.trim()) {
        // 使用搜尋 API，強制限制每頁最多 50 筆
        response = await searchBroadcasts({
          query: filters.keyword,
          messageType: filters.messageType,
          hours: filters.hours,
          page,
          pageSize: Math.min(initialPageSize, 50) // 確保搜尋結果每頁最多 50 筆
        })
      } else {
        // 使用一般列表 API，同樣限制每頁最多 50 筆
        response = await getBroadcasts({
          page,
          pageSize: Math.min(initialPageSize, 50), // 確保一般瀏覽每頁最多 50 筆
          hours: filters.hours,
          messageType: filters.messageType,
          playerName: filters.playerName || undefined
        })
      }

      setBroadcasts(response.messages)
      setTotalCount(response.total)
      setHasNext(response.has_next)
      setHasPrev(response.has_prev)
      setCurrentPage(response.page)
    } catch (err) {
      console.error('載入廣播訊息失敗:', err)
      setError(err instanceof Error ? err.message : '載入廣播訊息失敗')
    } finally {
      setLoading(false)
    }
  }, [filters, initialPageSize])

  // 更新篩選條件
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // 重置頁數
  }, [])

  // 刷新資料
  const refresh = useCallback(() => {
    loadBroadcasts(currentPage, true)
  }, [loadBroadcasts, currentPage])

  // 換頁
  const goToPage = useCallback((page: number) => {
    loadBroadcasts(page)
  }, [loadBroadcasts])

  // 初始載入和篩選變更時重新載入
  useEffect(() => {
    loadBroadcasts(1)
  }, [loadBroadcasts])

  // 自動刷新
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refresh])

  // 取得統計資料 - 智能統計邏輯
  const getTypeCounts = useCallback(() => {
    // 如果有選擇特定類型篩選，只顯示當前篩選結果的統計
    if (filters.messageType !== 'all') {
      return {
        all: totalCount, // 顯示篩選後的總數
        sell: filters.messageType === 'sell' ? totalCount : 0,
        buy: filters.messageType === 'buy' ? totalCount : 0,
        team: filters.messageType === 'team' ? totalCount : 0,
        other: filters.messageType === 'other' ? totalCount : 0,
      }
    }
    
    // 沒有類型篩選時，顯示當前載入資料的統計
    return {
      all: broadcasts.length,
      sell: broadcasts.filter(b => b.message_type === 'sell').length,
      buy: broadcasts.filter(b => b.message_type === 'buy').length,
      team: broadcasts.filter(b => b.message_type === 'team').length,
      other: broadcasts.filter(b => b.message_type === 'other').length,
    }
  }, [broadcasts, filters.messageType, totalCount])

  return {
    // 資料
    broadcasts,
    totalCount,
    typeCounts: getTypeCounts(),

    // 狀態
    loading,
    error,
    hasNext,
    hasPrev,
    currentPage,

    // 篩選
    filters,
    updateFilters,

    // 操作
    refresh,
    goToPage,
    loadBroadcasts
  }
}