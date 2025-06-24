"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseInfiniteScrollOptions {
  hasMore: boolean
  isLoading: boolean
  threshold?: number
  rootMargin?: string
  enabled?: boolean
  onLoadMore: () => Promise<any> | void
}

interface UseInfiniteScrollReturn {
  loadMoreRef: React.RefObject<HTMLDivElement>
  isFetching: boolean
  error: string | null
  retry: () => void
  reset: () => void
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  threshold = 0.1,
  rootMargin = "100px",
  enabled = true,
  onLoadMore
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isLoadingRef = useRef(false)
  
  // 載入更多資料
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !enabled || isLoadingRef.current) {
      return
    }
    
    try {
      setIsFetching(true)
      setError(null)
      isLoadingRef.current = true
      
      await onLoadMore()
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "載入失敗"
      setError(errorMessage)
      console.error("無限滾動載入錯誤:", err)
      
    } finally {
      setIsFetching(false)
      isLoadingRef.current = false
    }
  }, [hasMore, isLoading, enabled, onLoadMore])
  
  // 重試載入
  const retry = useCallback(() => {
    setError(null)
    loadMore()
  }, [loadMore])
  
  // 重置狀態
  const reset = useCallback(() => {
    setIsFetching(false)
    setError(null)
    isLoadingRef.current = false
  }, [])
  
  // 設置 Intersection Observer
  useEffect(() => {
    if (!enabled || !loadMoreRef.current) {
      return
    }
    
    const element = loadMoreRef.current
    
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting) {
          loadMore()
        }
      },
      {
        threshold,
        rootMargin
      }
    )
    
    observer.observe(element)
    observerRef.current = observer
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [enabled, threshold, rootMargin, loadMore])
  
  // 清理
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])
  
  return {
    loadMoreRef,
    isFetching,
    error,
    retry,
    reset
  }
}