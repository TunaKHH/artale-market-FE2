"use client"

import { useState } from "react"
import { Clock, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "../components/header"

// Mock data for broadcasts
const mockBroadcasts = [
  {
    id: 1,
    type: "sell",
    player: "DragonSlayer",
    message: "DragonSlayer: 賣 Draconis 換 8 Life",
    timestamp: "2分鐘前",
    server: "USW3",
    item: "Draconis",
    price: "8 Life",
  },
  {
    id: 2,
    type: "buy",
    player: "MagicUser",
    message: "MagicUser: 收 40 Def 給 1 Life",
    timestamp: "5分鐘前",
    server: "EUW2",
    item: "40 Def",
    price: "1 Life",
  },
  {
    id: 3,
    type: "team",
    player: "LootHunter",
    message: "LootHunter: 組隊打 Oryx Castle，需要 Priest",
    timestamp: "8分鐘前",
    server: "USEast",
    dungeon: "Oryx Castle",
    needClass: "Priest",
  },
  {
    id: 4,
    type: "other",
    player: "GuildMaster",
    message: "GuildMaster: 公會 'Elite Warriors' 招收新成員",
    timestamp: "12分鐘前",
    server: "Asia",
    guild: "Elite Warriors",
  },
  {
    id: 5,
    type: "sell",
    player: "Warrior123",
    message: "Warrior123: 賣 Acclaim 換 4 Life",
    timestamp: "15分鐘前",
    server: "USW3",
    item: "Acclaim",
    price: "4 Life",
  },
  {
    id: 6,
    type: "buy",
    player: "ProPlayer",
    message: "ProPlayer: 收 Rainbow Potion 給 2 Life",
    timestamp: "20分鐘前",
    server: "EUW2",
    item: "Rainbow Potion",
    price: "2 Life",
  },
  {
    id: 7,
    type: "team",
    player: "TeamLeader",
    message: "TeamLeader: 組隊刷 Abyss，來 3 個人",
    timestamp: "25分鐘前",
    server: "USW3",
    dungeon: "Abyss",
    needPlayers: "3",
  },
  {
    id: 8,
    type: "other",
    player: "Helper",
    message: "Helper: 免費給新手裝備，在 Nexus",
    timestamp: "30分鐘前",
    server: "EUW2",
    location: "Nexus",
  },
]

const broadcastTypes = [
  { id: "all", name: "全部", count: mockBroadcasts.length },
  { id: "sell", name: "賣", count: mockBroadcasts.filter((b) => b.type === "sell").length },
  { id: "buy", name: "買", count: mockBroadcasts.filter((b) => b.type === "buy").length },
  { id: "team", name: "組隊", count: mockBroadcasts.filter((b) => b.type === "team").length },
  { id: "other", name: "其他", count: mockBroadcasts.filter((b) => b.type === "other").length },
]

const getBadgeColor = (type: string) => {
  switch (type) {
    case "sell":
      return "destructive"
    case "buy":
      return "default"
    case "team":
      return "secondary"
    case "other":
      return "outline"
    default:
      return "default"
  }
}

const getBadgeText = (type: string) => {
  switch (type) {
    case "sell":
      return "賣"
    case "buy":
      return "買"
    case "team":
      return "組隊"
    case "other":
      return "其他"
    default:
      return type
  }
}

export default function BroadcastsPage() {
  const [selectedType, setSelectedType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [serverFilter, setServerFilter] = useState("all")

  const filteredBroadcasts = mockBroadcasts.filter((broadcast) => {
    const matchesType = selectedType === "all" || broadcast.type === selectedType
    const matchesSearch =
      broadcast.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broadcast.player.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesServer = serverFilter === "all" || broadcast.server === serverFilter
    return matchesType && matchesSearch && matchesServer
  })

  const servers = ["all", ...Array.from(new Set(mockBroadcasts.map((b) => b.server)))]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Description */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">廣播訊息</h1>
          <p className="text-gray-600 mb-6">
            即時顯示遊戲內的重要訊息，包括交易、組隊、公會招募等。 目前顯示{" "}
            <span className="font-semibold text-blue-600">{filteredBroadcasts.length}</span> 條廣播訊息。
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜尋玩家或訊息..."
                className="max-w-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={serverFilter} onValueChange={setServerFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有伺服器</SelectItem>
                  {servers
                    .filter((s) => s !== "all")
                    .map((server) => (
                      <SelectItem key={server} value={server}>
                        {server}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Type Tabs */}
        <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-8">
          <TabsList className="grid w-full grid-cols-5 gap-1">
            {broadcastTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-sm px-3 py-2">
                {type.name} ({type.count})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Broadcasts List */}
        <div className="space-y-4">
          {filteredBroadcasts.map((broadcast) => (
            <Card key={broadcast.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={getBadgeColor(broadcast.type) as any}>{getBadgeText(broadcast.type)}</Badge>
                      <span className="text-sm text-gray-500">{broadcast.server}</span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {broadcast.timestamp}
                      </div>
                    </div>
                    <p className="text-gray-900 mb-2">{broadcast.message}</p>

                    {/* Additional info based on type */}
                    {broadcast.type === "sell" && broadcast.item && broadcast.price && (
                      <div className="text-sm text-gray-600">
                        物品: {broadcast.item} | 價格: {broadcast.price}
                      </div>
                    )}
                    {broadcast.type === "buy" && broadcast.item && broadcast.price && (
                      <div className="text-sm text-gray-600">
                        收購: {broadcast.item} | 出價: {broadcast.price}
                      </div>
                    )}
                    {broadcast.type === "team" && (
                      <div className="text-sm text-gray-600">
                        {broadcast.dungeon && `地城: ${broadcast.dungeon}`}
                        {broadcast.needClass && ` | 需要職業: ${broadcast.needClass}`}
                        {broadcast.needPlayers && ` | 需要人數: ${broadcast.needPlayers}`}
                      </div>
                    )}
                    {broadcast.type === "other" && (
                      <div className="text-sm text-gray-600">
                        {broadcast.guild && `公會: ${broadcast.guild}`}
                        {broadcast.location && `地點: ${broadcast.location}`}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {filteredBroadcasts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">找不到符合條件的廣播訊息。</p>
          </div>
        )}

        {/* Auto-refresh notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">廣播訊息每30秒自動更新一次</p>
        </div>
      </main>
    </div>
  )
}
