"use client"

import { useState } from "react"
import { LogIn, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
            <Button variant="outline" size="sm" className="hidden md:flex">
              <LogIn className="w-4 h-4 mr-2" />
              登入
            </Button>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  <Input placeholder="搜尋..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <nav className="flex flex-col space-y-4">
                    {/* <Link href="/trading" className="text-blue-600 font-medium">
                      交易市場
                    </Link> */}
                    <Link href="/broadcasts" className="text-gray-700 hover:text-blue-600 font-medium">
                      廣播訊息
                    </Link>
                  </nav>
                  <Button variant="outline" className="w-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    登入
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
