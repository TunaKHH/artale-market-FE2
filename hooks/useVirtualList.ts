"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"

interface UseVirtualListOptions {
  itemHeight: number | ((index: number) => number)
  containerHeight: number
  itemCount: number
  overscan?: number
  scrollingDelay?: number
  getScrollElement?: () => HTMLElement | null
}

interface VirtualItem {
  index: number
  start: number
  end: number
  size: number
}

interface UseVirtualListReturn {
  virtualItems: VirtualItem[]
  totalSize: number
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void
  scrollToOffset: (offset: number) => void
  isScrolling: boolean
}

/**
 * 虛擬滾動 Hook - 用於大量數據的高效渲染
 */
export function useVirtualList({
  itemHeight,
  containerHeight,
  itemCount,
  overscan = 5,
  scrollingDelay = 150,
  getScrollElement
}: UseVirtualListOptions): UseVirtualListReturn {
  
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollingTimeoutRef = useRef<NodeJS.Timeout>()
  
  // 計算項目尺寸
  const itemSizes = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return new Array(itemCount).fill(itemHeight)
    }
    
    return Array.from({ length: itemCount }, (_, index) => itemHeight(index))
  }, [itemHeight, itemCount])
  
  // 計算累積偏移量
  const itemOffsets = useMemo(() => {
    const offsets = [0]
    for (let i = 0; i < itemSizes.length; i++) {
      offsets.push(offsets[i] + itemSizes[i])
    }
    return offsets
  }, [itemSizes])
  
  // 總尺寸
  const totalSize = useMemo(() => {
    return itemOffsets[itemOffsets.length - 1] || 0
  }, [itemOffsets])
  
  // 查找範圍
  const findRange = useCallback((scrollTop: number, containerHeight: number) => {
    if (itemCount === 0) {
      return { start: 0, end: 0 }
    }
    
    // 二分查找起始索引
    let start = 0
    let end = itemCount - 1
    
    while (start <= end) {
      const mid = Math.floor((start + end) / 2)
      const offset = itemOffsets[mid]
      
      if (offset < scrollTop) {
        start = mid + 1
      } else {
        end = mid - 1
      }
    }
    
    const startIndex = Math.max(0, start - overscan)
    
    // 查找結束索引
    let endIndex = startIndex
    let currentOffset = itemOffsets[startIndex]
    
    while (endIndex < itemCount && currentOffset < scrollTop + containerHeight + itemSizes[endIndex]) {
      currentOffset += itemSizes[endIndex]
      endIndex++
    }
    
    endIndex = Math.min(itemCount - 1, endIndex + overscan)
    
    return { start: startIndex, end: endIndex }
  }, [itemCount, itemOffsets, itemSizes, overscan])
  
  // 計算虛擬項目
  const virtualItems = useMemo(() => {
    const { start, end } = findRange(scrollTop, containerHeight)
    const items: VirtualItem[] = []
    
    for (let i = start; i <= end; i++) {
      items.push({
        index: i,
        start: itemOffsets[i],
        end: itemOffsets[i + 1],
        size: itemSizes[i]
      })
    }
    
    return items
  }, [scrollTop, containerHeight, findRange, itemOffsets, itemSizes])
  
  // 滾動到指定索引
  const scrollToIndex = useCallback((
    index: number, 
    align: 'start' | 'center' | 'end' | 'auto' = 'auto'
  ) => {
    if (index < 0 || index >= itemCount) return
    
    const scrollElement = getScrollElement?.()
    if (!scrollElement) return
    
    const itemStart = itemOffsets[index]
    const itemEnd = itemOffsets[index + 1]
    const itemSize = itemSizes[index]
    
    let targetScrollTop = itemStart
    
    switch (align) {
      case 'start':
        targetScrollTop = itemStart
        break
      case 'center':
        targetScrollTop = itemStart - (containerHeight - itemSize) / 2
        break
      case 'end':
        targetScrollTop = itemEnd - containerHeight
        break
      case 'auto':
        const currentScrollTop = scrollElement.scrollTop
        const currentScrollBottom = currentScrollTop + containerHeight
        
        if (itemStart < currentScrollTop) {
          targetScrollTop = itemStart
        } else if (itemEnd > currentScrollBottom) {
          targetScrollTop = itemEnd - containerHeight
        } else {
          return // 已經在可見範圍內
        }
        break
    }
    
    scrollElement.scrollTo({
      top: Math.max(0, Math.min(targetScrollTop, totalSize - containerHeight)),
      behavior: 'smooth'
    })
  }, [itemCount, itemOffsets, itemSizes, containerHeight, totalSize, getScrollElement])
  
  // 滾動到指定偏移量
  const scrollToOffset = useCallback((offset: number) => {
    const scrollElement = getScrollElement?.()
    if (!scrollElement) return
    
    scrollElement.scrollTo({
      top: Math.max(0, Math.min(offset, totalSize - containerHeight)),
      behavior: 'smooth'
    })
  }, [totalSize, containerHeight, getScrollElement])
  
  // 監聽滾動事件
  useEffect(() => {
    const scrollElement = getScrollElement?.()
    if (!scrollElement) return
    
    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop)
      setIsScrolling(true)
      
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current)
      }
      
      scrollingTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, scrollingDelay)
    }
    
    handleScroll() // 初始化
    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current)
      }
    }
  }, [getScrollElement, scrollingDelay])
  
  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
    isScrolling
  }
}

/**
 * 簡化版虛擬滾動 Hook - 用於固定高度項目
 */
export function useSimpleVirtualList(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan: number = 5
) {
  return useMemo(() => {
    if (itemCount === 0) {
      return {
        virtualItems: [],
        totalSize: 0,
        startIndex: 0,
        endIndex: 0
      }
    }
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    
    const virtualItems = Array.from(
      { length: endIndex - startIndex + 1 },
      (_, index) => {
        const itemIndex = startIndex + index
        return {
          index: itemIndex,
          start: itemIndex * itemHeight,
          end: (itemIndex + 1) * itemHeight,
          size: itemHeight
        }
      }
    )
    
    return {
      virtualItems,
      totalSize: itemCount * itemHeight,
      startIndex,
      endIndex
    }
  }, [itemCount, itemHeight, containerHeight, scrollTop, overscan])
}