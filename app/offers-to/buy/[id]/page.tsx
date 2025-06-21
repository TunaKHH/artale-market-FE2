"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, MessageCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Header } from "../../../components/header"
import { useAnalytics } from "@/hooks/useAnalytics"

// Mock data for the specific item
const itemData = {
  id: 9065,
  name: "高級防禦藥水",
  image: "/placeholder.svg?height=32&width=32",
}

// Mock data for buy offers
const offers = [
  {
    id: 1,
    selling: [{ item: "/placeholder.svg?height=24&width=24", quantity: 1, name: "生命藥水" }],
    buying: [{ item: "/placeholder.svg?height=24&width=24", quantity: 40, name: "高級防禦藥水" }],
    quantity: 1,
    addedTime: "~2小時前",
    playerName: "藥水收購者",
    lastSeen: "~2小時前",
    server: "USW3",
  },
  {
    id: 2,
    selling: [{ item: "/placeholder.svg?height=24&width=24", quantity: 1, name: "魔力藥水" }],
    buying: [{ item: "/placeholder.svg?height=24&width=24", quantity: 8, name: "高級防禦藥水" }],
    quantity: 1,
    addedTime: "~4小時前",
    playerName: "防禦收集者",
    lastSeen: "~4小時前",
    server: "EUW2",
  },
  {
    id: 3,
    selling: [{ item: "/placeholder.svg?height=24&width=24", quantity: 2, name: "彩虹藥水" }],
    buying: [{ item: "/placeholder.svg?height=24&width=24", quantity: 50, name: "高級防禦藥水" }],
    quantity: 1,
    addedTime: "~6小時前",
    playerName: "大宗交易者",
    lastSeen: "~6小時前",
    server: "USEast",
  },
]

export default function BuyOffersPage({ params }: { params: { id: string } }) {
  const [whoFilter, setWhoFilter] = useState("buying")
  const [forFilter, setForFilter] = useState("anything")
  const [pageStartTime] = useState(Date.now())
  
  const analytics = useAnalytics()
  
  const totalOffers = offers.length
  const uniquePlayers = [...new Set(offers.map((offer) => offer.playerName))].length

  // 頁面瀏覽追蹤
  useEffect(() => {
    analytics.trackPageView('buy_offers', {
      item_id: params.id,
      item_name: itemData.name,
      total_offers: totalOffers,
      unique_players: uniquePlayers
    })
    
    // 頁面離開時追蹤停留時間
    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000)
      analytics.trackTimeSpent('buy_offers', timeSpent)
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [analytics, params.id, pageStartTime, totalOffers, uniquePlayers])

  // 篩選追蹤
  useEffect(() => {
    if (whoFilter !== "buying") {
      analytics.trackFilter('who_filter', whoFilter)
    }
  }, [whoFilter, analytics])

  useEffect(() => {
    if (forFilter !== "anything") {
      analytics.trackFilter('for_filter', forFilter)
    }
  }, [forFilter, analytics])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/trading"
            onClick={() => {
              analytics.trackAction('back_to_trading', 'navigation', {
                from_page: 'buy_offers',
                item_id: params.id
              })
            }}
          >
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回交易市場
            </Button>
          </Link>
        </div>

        {/* Title and Description */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">報價列表</h1>
          <p className="text-gray-600 mb-6">
            過去兩天內有 <span className="font-semibold">{totalOffers}</span> 個報價，來自{" "}
            <span className="font-semibold">{uniquePlayers}</span> 位 RotMG 玩家，他們正在{" "}
            <span className="font-semibold">收購 {itemData.name}</span>。
          </p>

          {/* Instructions */}
          <div className="space-y-2 text-gray-600 mb-6">
            <div className="flex items-start space-x-2">
              <span className="text-gray-400">•</span>
              <p>如果您找到感興趣的報價，可以在遊戲中聯絡玩家，或者如果他們不在線上，可以透過 RealmEye 發送訊息。</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-gray-400">•</span>
              <p>
                如果您在{" "}
                <Link href="/trading" className="text-blue-600 hover:underline">
                  當前報價
                </Link>{" "}
                中沒有找到您要的物品，請{" "}
                <Link href="#" className="text-blue-600 hover:underline font-semibold">
                  發布報價
                </Link>
                ！{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  點此了解如何操作！
                </Link>
              </p>
            </div>
          </div>

          {/* Filter Section */}
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-gray-700">誰在</span>
            <Select value={whoFilter} onValueChange={setWhoFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selling">出售</SelectItem>
                <SelectItem value="buying">收購</SelectItem>
              </SelectContent>
            </Select>
            <img src={itemData.image || "/placeholder.svg"} alt={itemData.name} className="w-8 h-8" />
            <span className="text-gray-700">換取</span>
            <Select value={forFilter} onValueChange={setForFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anything">任何物品</SelectItem>
                <SelectItem value="life">生命藥水</SelectItem>
                <SelectItem value="mana">魔力藥水</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-gray-700">？</span>
          </div>
        </div>

        {/* Offers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">出售</TableHead>
                  <TableHead className="font-semibold">收購</TableHead>
                  <TableHead className="font-semibold text-center">數量</TableHead>
                  <TableHead className="font-semibold">發布時間</TableHead>
                  <TableHead className="font-semibold">發布者</TableHead>
                  <TableHead className="font-semibold">最後上線</TableHead>
                  <TableHead className="font-semibold">伺服器</TableHead>
                  <TableHead className="font-semibold">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {offer.selling.map((item, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <div className="relative">
                              <img src={item.item || "/placeholder.svg"} alt={item.name} className="w-6 h-6" />
                              <span className="absolute -bottom-1 -right-1 text-xs bg-gray-800 text-white px-1 rounded">
                                ×{item.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {offer.buying.map((item, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <div className="relative">
                              <img src={item.item || "/placeholder.svg"} alt={item.name} className="w-6 h-6" />
                              <span className="absolute -bottom-1 -right-1 text-xs bg-gray-800 text-white px-1 rounded">
                                ×{item.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{offer.quantity}</TableCell>
                    <TableCell className="text-gray-600">{offer.addedTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                        <Link 
                          href="#" 
                          className="text-blue-600 hover:underline"
                          onClick={() => {
                            analytics.trackAction('player_name_click', 'buy_offers', {
                              player_name: offer.playerName,
                              item_id: params.id,
                              offer_id: offer.id
                            })
                          }}
                        >
                          {offer.playerName}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{offer.lastSeen}</TableCell>
                    <TableCell className="text-gray-600">{offer.server}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const offerText = `出售: ${offer.selling.map((item) => `${item.name} x${item.quantity}`).join(", ")} | 收購: ${offer.buying.map((item) => `${item.name} x${item.quantity}`).join(", ")}`
                          
                          try {
                            navigator.clipboard.writeText(offerText)
                            analytics.trackAction('copy_offer', 'buy_offers', {
                              item_id: params.id,
                              offer_id: offer.id,
                              player_name: offer.playerName,
                              success: true
                            })
                            alert("已複製報價資訊！您可以使用此資訊發布相似的報價。")
                          } catch (error) {
                            analytics.trackError('copy_offer_failed', error?.toString() || 'Unknown error')
                            alert("複製失敗，請手動複製報價資訊。")
                          }
                        }}
                        title="複製此報價"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              analytics.trackAction('post_offer_click', 'buy_offers', {
                item_id: params.id,
                item_name: itemData.name
              })
            }}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            發布您的報價
          </Button>
          <Button variant="outline">
            <Link 
              href={`/offers-to/sell/${params.id}`}
              onClick={() => {
                analytics.trackAction('view_sell_offers', 'buy_offers', {
                  item_id: params.id,
                  item_name: itemData.name
                })
              }}
            >
              查看出售報價
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
