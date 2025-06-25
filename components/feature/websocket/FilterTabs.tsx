"use client"

import React, { memo, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface BroadcastType {
  id: string
  name: string
  count: number
}

interface FilterTabsProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  broadcastTypes: BroadcastType[]
}

// 🚀 性能優化：使用 memo 避免不必要的重渲染
export const FilterTabs = memo(function FilterTabs({
  currentFilter,
  onFilterChange,
  broadcastTypes,
}: FilterTabsProps) {
  // 🚀 性能優化：使用 useMemo 快取計算結果
  const tabTriggers = useMemo(() => {
    return broadcastTypes.map((type) => (
      <TabsTrigger
        key={type.id}
        value={type.id}
        className="flex items-center space-x-2 px-4 py-2 transition-all duration-200"
      >
        <span>{type.name}</span>
        {type.count > 0 && (
          <Badge
            variant={currentFilter === type.id ? "default" : "secondary"}
            className="ml-1 text-xs px-1.5 py-0.5 min-w-[20px] justify-center"
          >
            {type.count > 999 ? "999+" : type.count}
          </Badge>
        )}
      </TabsTrigger>
    ))
  }, [broadcastTypes, currentFilter])

  return (
    <div className="mb-6">
      <Tabs
        value={currentFilter}
        onValueChange={onFilterChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-6 h-auto gap-1 p-1">
          {tabTriggers}
        </TabsList>
      </Tabs>
    </div>
  )
})