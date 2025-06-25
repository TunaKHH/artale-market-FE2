"use client"

import React, { memo, useState, useRef, useEffect } from "react"
import { Search, History, X, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SearchSectionProps {
  searchInput: string
  onInputChange: (value: string) => void
  onSearch: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  searchHistory: string[]
  onUseHistorySearch: (term: string) => void
  onClearSearchHistory: () => void
  isSearching: boolean
}

const SearchSection = memo(function SearchSection({
  searchInput,
  onInputChange,
  onSearch,
  onKeyDown,
  searchHistory,
  onUseHistorySearch,
  onClearSearchHistory,
  isSearching
}: SearchSectionProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 處理輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e.target.value)
  }

  // 處理搜尋歷史項目點擊
  const handleHistoryItemClick = (term: string) => {
    onUseHistorySearch(term)
    setHistoryOpen(false)
    inputRef.current?.focus()
  }

  // 清除搜尋內容
  const handleClearInput = () => {
    onInputChange("")
    inputRef.current?.focus()
  }

  // 處理清除歷史
  const handleClearHistory = () => {
    onClearSearchHistory()
    setHistoryOpen(false)
  }

  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder="搜尋廣播內容、頻道或玩家名稱..."
            value={searchInput}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            className="pl-10 pr-12"
          />

          {/* 搜尋圖標或載入指示器 */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>

          {/* 清除按鈕 */}
          {searchInput && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearInput}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* 搜尋歷史按鈕 */}
        {searchHistory.length > 0 && (
          <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <History className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">搜尋歷史</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    清除全部
                  </Button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {searchHistory.map((term, index) => (
                    <button
                      key={`${term}-${index}`}
                      onClick={() => handleHistoryItemClick(term)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* 搜尋狀態提示 */}
      {isSearching && searchInput.length > 0 && (
        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          正在搜尋中...
        </p>
      )}
    </div>
  )
})

export default SearchSection