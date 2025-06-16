"use client"

import { useState } from "react"
import { Search, LogIn, Menu } from "lucide-react"
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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RE</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RealmEye</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#" className="text-gray-600 hover:text-gray-900">
              Guides
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900">
              Players
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900">
              Characters
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900">
              Pets
            </Link>
            <Link href="/trading" className="text-gray-600 hover:text-gray-900">
              Trading
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900">
              Help
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900">
              Wiki
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900">
              Forum
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="hidden md:flex">
              <LogIn className="w-4 h-4 mr-2" />
              Log In
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
                  <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <nav className="flex flex-col space-y-4">
                    <Link href="#" className="text-gray-600">
                      Guides
                    </Link>
                    <Link href="#" className="text-gray-600">
                      Players
                    </Link>
                    <Link href="#" className="text-gray-600">
                      Characters
                    </Link>
                    <Link href="#" className="text-gray-600">
                      Pets
                    </Link>
                    <Link href="/trading" className="text-gray-600">
                      Trading
                    </Link>
                    <Link href="#" className="text-gray-600">
                      Help
                    </Link>
                    <Link href="#" className="text-gray-600">
                      Wiki
                    </Link>
                    <Link href="#" className="text-gray-600">
                      Forum
                    </Link>
                  </nav>
                  <Button variant="outline" className="w-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    Log In
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
