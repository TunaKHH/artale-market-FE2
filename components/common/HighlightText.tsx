import type React from "react"

interface HighlightTextProps {
  text: string
  searchTerm: string
  className?: string
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, searchTerm, className = "" }) => {
  // 如果沒有搜尋詞，直接返回原文
  if (!searchTerm.trim()) {
    return <span className={className}>{text}</span>
  }

  // 使用正則表達式進行不區分大小寫的搜尋
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // 檢查這個部分是否匹配搜尋詞
        const isMatch = regex.test(part)

        // 重置正則表達式的 lastIndex
        regex.lastIndex = 0

        return isMatch ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-0.5 rounded-sm font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
    </span>
  )
}
