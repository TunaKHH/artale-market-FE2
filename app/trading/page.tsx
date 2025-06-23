"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Header } from "../components/header"
import { useAnalytics } from "@/hooks/useAnalytics"
import { useRouter, useSearchParams } from "next/navigation"

// Mock data for demonstration
const mockItems = [
  {
    id: 9070,
    name: "生命藥水",
    category: "consumables",
    sellOffers: 5,
    buyOffers: 3,
    price: 10,
    image: "/10.png",
  },
  {
    id: 9071,
    name: "魔力藥水",
    category: "consumables",
    sellOffers: 8,
    buyOffers: 2,
    price: 12,
    image: "/10.png",
  },
  {
    id: 9072,
    name: "鋼鐵劍",
    category: "weapons",
    sellOffers: 2,
    buyOffers: 1,
    price: 150,
    image: "/10.png",
  },
  {
    id: 9073,
    name: "魔法法杖",
    category: "weapons",
    sellOffers: 3,
    buyOffers: 4,
    price: 200,
    image: "/10.png",
  },
  {
    id: 9074,
    name: "皮革護甲",
    category: "armors",
    sellOffers: 6,
    buyOffers: 2,
    price: 80,
    image: "/10.png",
  },
  {
    id: 9075,
    name: "力量戒指",
    category: "rings",
    sellOffers: 1,
    buyOffers: 5,
    price: 300,
    image: "/10.png",
  },
  {
    id: 9076,
    name: "速度提升",
    category: "abilities",
    sellOffers: 4,
    buyOffers: 1,
    price: 50,
    image: "/10.png",
  },
  {
    id: 9077,
    name: "寵物蛋",
    category: "pet-eggs",
    sellOffers: 2,
    buyOffers: 3,
    price: 100,
    image: "/10.png",
  },
]

const categories = [
  { id: "all", name: "全部", count: mockItems.length },
  { id: "popular", name: "熱門", count: 8 },
  { id: "consumables", name: "消耗品", count: mockItems.filter((item) => item.category === "consumables").length },
  { id: "weapons", name: "武器", count: mockItems.filter((item) => item.category === "weapons").length },
  { id: "armors", name: "防具", count: mockItems.filter((item) => item.category === "armors").length },
  { id: "abilities", name: "技能", count: mockItems.filter((item) => item.category === "abilities").length },
  { id: "rings", name: "戒指", count: mockItems.filter((item) => item.category === "rings").length },
  { id: "misc", name: "雜項", count: 0 },
  { id: "pet-eggs", name: "寵物蛋", count: mockItems.filter((item) => item.category === "pet-eggs").length },
]

export default function TradingPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showOffers, setShowOffers] = useState("25")
  const [pageStartTime] = useState(Date.now())

  // Next.js router hooks
  const router = useRouter()
  const searchParams = useSearchParams()

  const analytics = useAnalytics()

  // 計算數據（移到 useEffect 之前避免 linter 錯誤）
  const filteredItems = mockItems
    .filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .slice(0, Number.parseInt(showOffers))

  const totalOffers = mockItems.reduce((sum, item) => sum + item.sellOffers + item.buyOffers, 0)
  const totalPlayers = 76

  // 更新 URL 搜尋參數
  const updateUrlSearchParam = (searchTerm: string) => {
    const currentUrl = new URL(window.location.href)

    if (searchTerm.trim()) {
      currentUrl.searchParams.set('q', searchTerm.trim())
    } else {
      currentUrl.searchParams.delete('q')
    }

    // 使用 replace 而不是 push，避免在搜尋時建立過多的歷史記錄
    router.replace(currentUrl.pathname + currentUrl.search, { scroll: false })
  }

  // 客戶端掛載時從 URL 參數讀取搜尋內容
  useEffect(() => {
    const queryParam = searchParams.get('q')
    if (queryParam) {
      setSearchQuery(queryParam)
    }
  }, [searchParams])

  // 頁面瀏覽追蹤
  useEffect(() => {
    const queryParam = searchParams.get('q')
    analytics.trackPageView('trading', {
      total_items: mockItems.length,
      total_offers: totalOffers,
      total_players: totalPlayers,
      initial_search_query: queryParam || '',
    })

    // 頁面離開時追蹤停留時間
    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000)
      analytics.trackTimeSpent('trading', timeSpent)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [analytics, pageStartTime, searchParams])

  // 搜尋追蹤
  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        analytics.trackSearch(searchQuery, 'item', filteredItems.length)
        analytics.trackAction("search", "feature_usage", {
          search_length: searchQuery.length,
          search_type: "client_side",
          has_url_param: true,
          result_count: filteredItems.length,
        })
      }, 500) // 防抖動，避免每個按鍵都發送事件

      return () => clearTimeout(timer)
    }
  }, [searchQuery, filteredItems.length, analytics])

  // 分類篩選追蹤
  useEffect(() => {
    if (selectedCategory !== "all") {
      analytics.trackFilter('category', selectedCategory)
    }
  }, [selectedCategory, analytics])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">當前報價</h1>
          <div className="text-gray-600 mb-4">
            目前有 <span className="font-semibold text-blue-600">{totalOffers}</span> 個報價，來自{" "}
            <span className="font-semibold text-blue-600">{totalPlayers}</span> 位玩家。右上角的{" "}
            <span className="font-semibold text-red-600">紅色</span>和右下角的{" "}
            <span className="font-semibold text-blue-600">藍色</span>數字分別表示該物品的{" "}
            <span className="font-semibold text-red-600">出售</span>和{" "}
            <span className="font-semibold text-blue-600">收購</span>報價數量。點擊數字可查看詳細報價！
            如果沒有找到合適的報價，{" "}
            <Link href="#" className="text-blue-600 hover:underline font-semibold">
              發布您自己的報價！
            </Link>{" "}
            <Link href="#" className="text-blue-600 hover:underline">
              點此了解如何操作！
            </Link>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
            <span>每個物品顯示</span>
            <Select value={showOffers} onValueChange={(value) => {
              setShowOffers(value)
              analytics.trackAction('offers_per_page_change', 'trading', {
                offers_count: value,
                previous_count: showOffers
              })
            }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>個報價。</span>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜尋物品..."
              className="max-w-md"
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value
                setSearchQuery(value)
                updateUrlSearchParam(value)
              }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs px-2 py-1">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Items Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-2">
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              href={`/offers-to/sell/${item.id}`}
              onClick={() => {
                analytics.trackAction('item_click', 'trading', {
                  item_id: item.id,
                  item_name: item.name,
                  item_category: item.category,
                  target_page: 'sell_offers',
                  sell_offers: item.sellOffers,
                  buy_offers: item.buyOffers
                })
              }}
            >
              <Card className="relative hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-2">
                  <div className="relative">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-8 h-8 mx-auto mb-1" />

                    {/* Sell offers (top right, red) */}
                    {item.sellOffers > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 min-w-4 flex items-center justify-center hover:bg-red-700"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          analytics.trackAction('badge_click', 'trading', {
                            item_id: item.id,
                            item_name: item.name,
                            badge_type: 'sell_offers',
                            offers_count: item.sellOffers
                          })
                          window.location.href = `/offers-to/sell/${item.id}`
                        }}
                      >
                        {item.sellOffers}
                      </Badge>
                    )}

                    {/* Buy offers (bottom right, blue) */}
                    {item.buyOffers > 0 && (
                      <Badge
                        className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-4 min-w-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          analytics.trackAction('badge_click', 'trading', {
                            item_id: item.id,
                            item_name: item.name,
                            badge_type: 'buy_offers',
                            offers_count: item.buyOffers
                          })
                          window.location.href = `/offers-to/buy/${item.id}`
                        }}
                      >
                        {item.buyOffers}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">找不到符合條件的物品。</p>
          </div>
        )}
      </main>
    </div>
  )
}
