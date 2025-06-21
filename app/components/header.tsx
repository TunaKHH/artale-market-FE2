"use client"

import { useState } from "react"
import { Menu, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import Link from "next/link"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")

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
          <div className="flex items-center space-x-4">
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
