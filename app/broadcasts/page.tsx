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
    type: "death",
    player: "DragonSlayer",
    message: "DragonSlayer died at level 20, killed by Oryx the Mad God",
    timestamp: "2分鐘前",
    server: "USW3",
    fame: 1250,
    totalFame: 45000,
  },
  {
    id: 2,
    type: "level",
    player: "MagicUser",
    message: "MagicUser achieved level 20 on Wizard",
    timestamp: "5分鐘前",
    server: "EUW2",
    class: "Wizard",
  },
  {
    id: 3,
    type: "drop",
    player: "LootHunter",
    message: "LootHunter found Draconis",
    timestamp: "8分鐘前",
    server: "USEast",
    item: "Draconis",
  },
  {
    id: 4,
    type: "guild",
    player: "GuildMaster",
    message: "GuildMaster founded the guild 'Elite Warriors'",
    timestamp: "12分鐘前",
    server: "Asia",
    guild: "Elite Warriors",
  },
  {
    id: 5,
    type: "death",
    player: "Warrior123",
    message: "Warrior123 died at level 18, killed by Skull Shrine",
    timestamp: "15分鐘前",
    server: "USW3",
    fame: 890,
    totalFame: 23000,
  },
  {
    id: 6,
    type: "achievement",
    player: "ProPlayer",
    message: "ProPlayer completed 'Tunnel Rat' achievement",
    timestamp: "20分鐘前",
    server: "EUW2",
    achievement: "Tunnel Rat",
  },
]

const broadcastTypes = [
  { id: "all", name: "全部", count: mockBroadcasts.length },
  { id: "death", name: "死亡", count: mockBroadcasts.filter((b) => b.type === "death").length },
  { id: "level", name: "升級", count: mockBroadcasts.filter((b) => b.type === "level").length },
  { id: "drop", name: "掉落", count: mockBroadcasts.filter((b) => b.type === "drop").length },
  { id: "guild", name: "公會", count: mockBroadcasts.filter((b) => b.type === "guild").length },
  { id: "achievement", name: "成就", count: mockBroadcasts.filter((b) => b.type === "achievement").length },
]

const getBadgeColor = (type: string) => {
  switch (type) {
    case "death":
      return "destructive"
    case "level":
      return "default"
    case "drop":
      return "secondary"
    case "guild":
      return "outline"
    case "achievement":
      return "default"
    default:
      return "default"
  }
}

const getBadgeText = (type: string) => {
  switch (type) {
    case "death":
      return "死亡"
    case "level":
      return "升級"
    case "drop":
      return "掉落"
    case "guild":
      return "公會"
    case "achievement":
      return "成就"
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
            即時顯示遊戲內的重要事件，包括玩家死亡、升級、稀有物品掉落、公會活動等訊息。 目前顯示{" "}
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
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
            {broadcastTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-xs px-2 py-1">
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
                    {broadcast.type === "death" && broadcast.fame && (
                      <div className="text-sm text-gray-600">
                        獲得聲望: {broadcast.fame} | 總聲望: {broadcast.totalFame}
                      </div>
                    )}
                    {broadcast.type === "level" && broadcast.class && (
                      <div className="text-sm text-gray-600">職業: {broadcast.class}</div>
                    )}
                    {broadcast.type === "drop" && broadcast.item && (
                      <div className="text-sm text-gray-600">物品: {broadcast.item}</div>
                    )}
                    {broadcast.type === "guild" && broadcast.guild && (
                      <div className="text-sm text-gray-600">公會: {broadcast.guild}</div>
                    )}
                    {broadcast.type === "achievement" && broadcast.achievement && (
                      <div className="text-sm text-gray-600">成就: {broadcast.achievement}</div>
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
