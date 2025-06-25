"use client"

import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from "react"
import { MessageItem } from "./MessageItem"
import type { BroadcastMessage } from "@/lib/api"

interface ExtendedBroadcastMessage extends BroadcastMessage {
  isNew?: boolean
  newMessageTimestamp?: number
  favorited_at?: string
}

interface VirtualizedMessageListProps {
  messages: ExtendedBroadcastMessage[]
  searchTerm: string
  onBroadcastClick: (broadcastId: number) => void
  onFavoriteChange: (isAdding?: boolean) => void
  onSwitchToFavorites: () => void
  selectedBroadcastId: number | null
  className?: string
}

// 🚀 性能優化：自適應虛擬化列表參數
const ESTIMATED_ITEM_HEIGHT = 120 // 預估項目高度
const OVERSCAN_COUNT = 5 // 緩衝區項目數量
const MAX_VISIBLE_ITEMS = 50 // 最大同時渲染項目數

// 🚀 性能優化：使用 memo 避免不必要的重渲染
export const VirtualizedMessageList = memo(function VirtualizedMessageList({
  messages,
  searchTerm,
  onBroadcastClick,
  onFavoriteChange,
  onSwitchToFavorites,
  selectedBroadcastId,
  className = "",
}: VirtualizedMessageListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const measureRequestRef = useRef<number | null>(null)

  // 🚀 性能優化：測量容器高度
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const maxHeight = Math.min(viewportHeight * 0.7, 800) // 最大70%視窗高度或800px
        const minHeight = 400 // 最小高度
        setContainerHeight(Math.max(minHeight, Math.min(maxHeight, rect.height || 600)))
      }
    }

    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
    return () => window.removeEventListener('resize', updateContainerHeight)
  }, [])

  // 🚀 修復：延遲測量項目高度，避免在渲染期間更新狀態
  useEffect(() => {
    const measureAllItems = () => {
      const updates = new Map<number, number>()
      let hasUpdates = false

      itemRefs.current.forEach((element, index) => {
        if (element) {
          const height = element.getBoundingClientRect().height
          const currentHeight = itemHeights.get(index)

          // 只有當高度實際變化時才更新
          if (currentHeight !== height && height > 0) {
            updates.set(index, height)
            hasUpdates = true
          }
        }
      })

      if (hasUpdates) {
        setItemHeights(prev => {
          const newMap = new Map(prev)
          updates.forEach((height, index) => {
            newMap.set(index, height)
          })
          return newMap
        })
      }
    }

    // 使用 requestAnimationFrame 延遲測量
    if (measureRequestRef.current) {
      cancelAnimationFrame(measureRequestRef.current)
    }

    measureRequestRef.current = requestAnimationFrame(measureAllItems)

    return () => {
      if (measureRequestRef.current) {
        cancelAnimationFrame(measureRequestRef.current)
      }
    }
  }, [messages.length]) // 只在訊息數量變化時重新測量

  // 🚀 性能優化：項目引用回調（不直接觸發狀態更新）
  const setItemRef = useCallback((index: number) => {
    return (element: HTMLDivElement | null) => {
      if (element) {
        itemRefs.current.set(index, element)
      } else {
        itemRefs.current.delete(index)
      }
    }
  }, [])

  // 🚀 性能優化：計算累積高度
  const getItemOffset = useCallback((index: number) => {
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += itemHeights.get(i) || ESTIMATED_ITEM_HEIGHT
    }
    return offset
  }, [itemHeights])

  // 🚀 性能優化：計算總高度
  const totalHeight = useMemo(() => {
    let height = 0
    for (let i = 0; i < messages.length; i++) {
      height += itemHeights.get(i) || ESTIMATED_ITEM_HEIGHT
    }
    return height
  }, [messages.length, itemHeights])

  // 🚀 性能優化：計算可見項目範圍
  const visibleRange = useMemo(() => {
    let startIndex = 0
    let endIndex = Math.min(messages.length, MAX_VISIBLE_ITEMS)

    // 如果有很多訊息，才進行虛擬化
    if (messages.length > MAX_VISIBLE_ITEMS) {
      let accumulatedHeight = 0

      // 找到開始索引
      for (let i = 0; i < messages.length; i++) {
        const itemHeight = itemHeights.get(i) || ESTIMATED_ITEM_HEIGHT
        if (accumulatedHeight + itemHeight > scrollTop) {
          startIndex = Math.max(0, i - OVERSCAN_COUNT)
          break
        }
        accumulatedHeight += itemHeight
      }

      // 找到結束索引
      accumulatedHeight = getItemOffset(startIndex)
      for (let i = startIndex; i < messages.length; i++) {
        const itemHeight = itemHeights.get(i) || ESTIMATED_ITEM_HEIGHT
        if (accumulatedHeight > scrollTop + containerHeight + (OVERSCAN_COUNT * ESTIMATED_ITEM_HEIGHT)) {
          endIndex = Math.min(messages.length, i + OVERSCAN_COUNT)
          break
        }
        accumulatedHeight += itemHeight
      }
    }

    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, messages.length, itemHeights, getItemOffset])

  // 🚀 性能優化：只渲染可見的項目
  const visibleMessages = useMemo(() => {
    return messages.slice(visibleRange.startIndex, visibleRange.endIndex).map((message, index) => ({
      ...message,
      virtualIndex: visibleRange.startIndex + index,
      actualIndex: visibleRange.startIndex + index,
    }))
  }, [messages, visibleRange])

  // 🚀 性能優化：滾動處理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    // 使用 requestAnimationFrame 來優化滾動性能
    requestAnimationFrame(() => {
      setScrollTop(newScrollTop)
    })
  }, [])

  // 🚀 性能優化：訊息點擊處理
  const handleMessageClick = useCallback((message: ExtendedBroadcastMessage) => {
    onBroadcastClick(message.id)
  }, [onBroadcastClick])

  // 🚀 性能優化：計算偏移量
  const offsetY = useMemo(() => getItemOffset(visibleRange.startIndex), [getItemOffset, visibleRange.startIndex])

  // 如果沒有訊息，顯示空狀態
  if (messages.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 text-muted-foreground ${className}`}>
        <div className="text-center">
          <p className="text-lg mb-2">📭 目前沒有訊息</p>
          <p className="text-sm">等待新的廣播訊息...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-auto border rounded-lg ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      ref={containerRef}
    >
      {/* 虛擬空間 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 可見項目容器 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleMessages.map((message) => (
            <div
              key={message.id}
              ref={setItemRef(message.actualIndex)}
              className={`px-4 border-b border-border transition-colors ${selectedBroadcastId === message.id ? 'bg-muted' : 'hover:bg-muted/50'
                }`}
              style={{ minHeight: ESTIMATED_ITEM_HEIGHT }}
            >
              <MessageItem
                message={message}
                searchTerm={searchTerm}
                onClick={handleMessageClick}
                onFavoriteChange={onFavoriteChange}
                onSwitchToFavorites={onSwitchToFavorites}
                compact={false} // 改為非緊湊模式，允許自適應高度
              />
            </div>
          ))}
        </div>
      </div>

      {/* 滾動指示器 */}
      {messages.length > 20 && (
        <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-xs text-muted-foreground border shadow-sm">
          {visibleRange.startIndex + Math.floor((visibleRange.endIndex - visibleRange.startIndex) / 2)} / {messages.length}
        </div>
      )}
    </div>
  )
})