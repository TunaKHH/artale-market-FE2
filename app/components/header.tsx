"use client"

import { useState, useEffect } from "react"
import { Menu, MessageSquare, Share2, Check, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useAnalytics } from "@/hooks/useAnalytics"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [shareCopied, setShareCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const analytics = useAnalytics()

  // 防止 hydration 錯誤
  useEffect(() => {
    setMounted(true)
  }, [])

  // 分享功能
  const handleShare = async () => {
    analytics.trackAction('share_attempt', 'header', {
      page_url: window.location.href,
      method: 'button_click'
    })

    const shareData = {
      title: "Artale Love - 楓之谷世界廣播監控",
      text: "來看看楓之谷世界的即時廣播訊息，包含交易、組隊、公會招募等資訊！",
      url: window.location.href,
    }

    try {
      // 優先使用 Web Share API（行動裝置支援較好）
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        analytics.trackAction('share_success', 'header', {
          method: 'web_share_api'
        })
        return
      }
    } catch (err) {
      console.log("Web Share API 失敗，改用複製連結")
      analytics.trackError('share_web_api_failed', err?.toString() || 'Unknown error')
    }

    // 備用方案：複製連結到剪貼簿
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
        analytics.trackAction('share_success', 'header', {
          method: 'clipboard_api'
        })
      } else {
        // 最後備用方案：使用傳統的複製方法
        const textArea = document.createElement("textarea")
        textArea.value = window.location.href
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          // eslint-disable-next-line deprecation/deprecation
          document.execCommand("copy")
          setShareCopied(true)
          setTimeout(() => setShareCopied(false), 2000)
          analytics.trackAction('share_success', 'header', {
            method: 'exec_command'
          })
        } catch (err) {
          console.error("傳統複製方法也失敗:", err)
          analytics.trackError('share_exec_command_failed', err?.toString() || 'Unknown error')
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error("複製連結失敗:", err)
      analytics.trackError('share_clipboard_failed', err?.toString() || 'Unknown error')
    }
  }

  // 切換主題
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    analytics.trackAction('theme_toggle', 'header', {
      from_theme: theme,
      to_theme: newTheme
    })
  }

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2"
              onClick={() => {
                analytics.trackAction('logo_click', 'header', {
                  target: 'home'
                })
              }}
            >
              <span className="text-xl font-bold text-foreground">Artale Love</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/broadcasts"
              className="text-muted-foreground hover:text-primary font-medium transition-colors"
              onClick={() => {
                analytics.trackAction('nav_click', 'header', {
                  target: 'broadcasts',
                  device_type: 'desktop'
                })
              }}
            >
              廣播訊息
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* 主題切換按鈕 - 桌面版 */}
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="sm"
              className="hidden md:flex"
              title={mounted ? (theme === "dark" ? "切換到淺色模式" : "切換到深色模式") : "主題切換"}
              suppressHydrationWarning
            >
              {!mounted ? (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  主題
                </>
              ) : theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  淺色
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  深色
                </>
              )}
            </Button>

            {/* 主題切換按鈕 - 手機版 */}
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="md:hidden"
              title={mounted ? (theme === "dark" ? "切換到淺色模式" : "切換到深色模式") : "主題切換"}
              suppressHydrationWarning
            >
              {!mounted ? (
                <Moon className="w-4 h-4" />
              ) : theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* 分享按鈕 - 桌面版 */}
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="hidden md:flex text-muted-foreground hover:text-primary"
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
              {shareCopied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            </Button>

            {/* 意見回饋按鈕 - 桌面版 */}
            <a
              href="https://app.sli.do/event/96njtqMVu3GVdxcf6eDAka"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block"
              onClick={() => {
                analytics.trackAction('feedback_click', 'header', {
                  target: 'slido',
                  device_type: 'desktop'
                })
              }}
            >
              <Button variant="outline" size="sm" className="text-muted-foreground hover:text-primary">
                <MessageSquare className="w-4 h-4 mr-2" />
                意見回饋
              </Button>
            </a>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  onClick={() => {
                    analytics.trackAction('mobile_menu_open', 'header', {
                      device_type: 'mobile'
                    })
                  }}
                >
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
                    <Link
                      href="/broadcasts"
                      className="text-muted-foreground hover:text-primary font-medium transition-colors"
                      onClick={() => {
                        analytics.trackAction('nav_click', 'header', {
                          target: 'broadcasts',
                          device_type: 'mobile'
                        })
                      }}
                    >
                      廣播訊息
                    </Link>

                    {/* 手機版主題切換 */}
                    <div className="border-t pt-4 mt-4">
                      <button
                        onClick={toggleTheme}
                        className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {theme === "dark" ? (
                          <>
                            <Sun className="w-4 h-4 mr-2" />
                            切換到淺色模式
                          </>
                        ) : (
                          <>
                            <Moon className="w-4 h-4 mr-2" />
                            切換到深色模式
                          </>
                        )}
                      </button>
                    </div>

                    {/* 手機版意見回饋 */}
                    <div className="border-t pt-4 mt-4">
                      <a
                        href="https://app.sli.do/event/96njtqMVu3GVdxcf6eDAka"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => {
                          analytics.trackAction('feedback_click', 'header', {
                            target: 'slido',
                            device_type: 'mobile'
                          })
                        }}
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
