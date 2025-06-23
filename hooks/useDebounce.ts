"use client"

import { useState, useEffect, useRef, useCallback } from "react"

/**
 * 防抖 Hook - 延遲執行直到一段時間內沒有新的調用
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 防抖函數 Hook - 返回防抖版本的函數
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay, ...deps]
  ) as T

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * 節流 Hook - 限制函數在指定時間內最多執行一次
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const lastExecRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastExecRef.current >= delay) {
        lastExecRef.current = now
        callback(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          lastExecRef.current = Date.now()
          callback(...args)
        }, delay - (now - lastExecRef.current))
      }
    },
    [callback, delay, ...deps]
  ) as T

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}

/**
 * 搜尋防抖 Hook - 專門用於搜尋功能的防抖
 */
export function useSearchDebounce(
  searchTerm: string,
  delay: number = 300
): {
  debouncedSearchTerm: string
  isSearching: boolean
} {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    setIsSearching(true)
    
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, delay])

  return {
    debouncedSearchTerm,
    isSearching
  }
}