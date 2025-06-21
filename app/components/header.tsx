"use client"

import { useState } from "react"
import { Menu, MessageSquare, Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import Link from "next/link"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [shareCopied, setShareCopied] = useState(false)

  // 分享功能
  const handleShare = async () => {
    const shareData = {
      title: 'Artale Love - 楓之谷世界廣播監控',
      text: '來看看楓之谷世界的即時廣播訊息，包含交易、組隊、公會招募等資訊！',
      url: window.location.href
    }

    try {
      // 優先使用 Web Share API（行動裝置支援較好）
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        return
      }
    } catch (err) {
      console.log('Web Share API 失敗，改用複製連結')
    }

    // 備用方案：複製連結到剪貼簿
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      } else {
        // 最後備用方案：使用傳統的複製方法
        const textArea = document.createElement('textarea')
        textArea.value = window.location.href
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          // eslint-disable-next-line deprecation/deprecation
          document.execCommand('copy')
          setShareCopied(true)
          setTimeout(() => setShareCopied(false), 2000)
        } catch (err) {
          console.error('傳統複製方法也失敗:', err)
          // 靜默失敗，不顯示 alert
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('複製連結失敗:', err)
      // 靜默失敗，不顯示 alert
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              {/* 移除包含 "RE" 文字的 div */}
              <span className="text-xl font-bold text-gray-900">Artale Love</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* <Link href="/trading" className="text-blue-600 font-medium">
              交易市場
            </Link> */}
            <Link href="/broadcasts" className="text-gray-700 hover:text-blue-600 font-medium">
              廣播訊息
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* 分享按鈕 - 桌面版 */}
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="hidden md:flex text-gray-700 hover:text-blue-600"
              title={shareCopied ? "連結已複製！" : "分享此頁面"}
            >
              {shareCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  <span className="text-green-600">已複製</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  分享
                </>
              )}
            </Button>

            {/* 分享按鈕 - 手機版 */}
            <Button
              onClick={handleShare}
              variant="outline"
              size="icon"
              className="md:hidden"
              title={shareCopied ? "連結已複製！" : "分享此頁面"}
            >
              {shareCopied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>

            {/* 意見回饋按鈕 - 桌面版 */}
            <a
              href="https://app.sli.do/event/96njtqMVu3GVdxcf6eDAka"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block"
            >
              <Button
                variant="outline"
                size="sm"
                className="text-gray-700 hover:text-blue-600"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                意見回饋
              </Button>
            </a>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="sr-only">導航選單</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-8">
                  <Input placeholder="搜尋..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <nav className="flex flex-col space-y-4">
                    {/* <Link href="/trading" className="text-blue-600 font-medium">
                      交易市場
                    </Link> */}
                    <Link href="/broadcasts" className="text-gray-700 hover:text-blue-600 font-medium">
                      廣播訊息
                    </Link>

                    {/* 手機版意見回饋 */}
                    <div className="border-t pt-4 mt-4">
                      <a
                        href="https://app.sli.do/event/96njtqMVu3GVdxcf6eDAka"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-gray-700 hover:text-blue-600"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        意見回饋
                      </a>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
