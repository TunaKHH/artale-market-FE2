"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Header } from "../components/header"

// Mock data for demonstration
const mockItems = [
  {
    id: 9070,
    name: "Health Potion",
    category: "consumables",
    sellOffers: 5,
    buyOffers: 3,
    price: 10,
    image: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 9071,
    name: "Mana Potion",
    category: "consumables",
    sellOffers: 8,
    buyOffers: 2,
    price: 12,
    image: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 9072,
    name: "Steel Sword",
    category: "weapons",
    sellOffers: 2,
    buyOffers: 1,
    price: 150,
    image: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 9073,
    name: "Magic Staff",
    category: "weapons",
    sellOffers: 3,
    buyOffers: 4,
    price: 200,
    image: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 9074,
    name: "Leather Armor",
    category: "armors",
    sellOffers: 6,
    buyOffers: 2,
    price: 80,
    image: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 9075,
    name: "Ring of Power",
    category: "rings",
    sellOffers: 1,
    buyOffers: 5,
    price: 300,
    image: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 9076,
    name: "Speed Boost",
    category: "abilities",
    sellOffers: 4,
    buyOffers: 1,
    price: 50,
    image: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 9077,
    name: "Pet Egg",
    category: "pet-eggs",
    sellOffers: 2,
    buyOffers: 3,
    price: 100,
    image: "/placeholder.svg?height=32&width=32",
  },
]

const categories = [
  { id: "all", name: "All", count: mockItems.length },
  { id: "popular", name: "Popular", count: 8 },
  { id: "consumables", name: "Consumables", count: mockItems.filter((item) => item.category === "consumables").length },
  { id: "weapons", name: "Weapons", count: mockItems.filter((item) => item.category === "weapons").length },
  { id: "armors", name: "Armors", count: mockItems.filter((item) => item.category === "armors").length },
  { id: "abilities", name: "Abilities", count: mockItems.filter((item) => item.category === "abilities").length },
  { id: "rings", name: "Rings", count: mockItems.filter((item) => item.category === "rings").length },
  { id: "misc", name: "Misc", count: 0 },
  { id: "pet-eggs", name: "Pet Eggs", count: mockItems.filter((item) => item.category === "pet-eggs").length },
]

export default function TradingPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showOffers, setShowOffers] = useState("25")

  const filteredItems = mockItems
    .filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .slice(0, Number.parseInt(showOffers))

  const totalOffers = mockItems.reduce((sum, item) => sum + item.sellOffers + item.buyOffers, 0)
  const totalPlayers = 76

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Current Offers</h1>
          <div className="text-gray-600 mb-4">
            There are <span className="font-semibold text-blue-600">{totalOffers}</span> offers by{" "}
            <span className="font-semibold text-blue-600">{totalPlayers}</span> players to choose from. Numbers in the{" "}
            <span className="font-semibold text-red-600">top</span> and{" "}
            <span className="font-semibold text-blue-600">bottom</span> right corner indicate how many offers are there
            to <span className="font-semibold text-red-600">sell</span> or{" "}
            <span className="font-semibold text-blue-600">buy</span> the item. Click on them to see the actual offers!
            If none of them suits you, then{" "}
            <Link href="#" className="text-blue-600 hover:underline font-semibold">
              post your own offer!
            </Link>{" "}
            <Link href="#" className="text-blue-600 hover:underline">
              Click here to see how!
            </Link>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
            <span>Show the number of</span>
            <Select value={showOffers} onValueChange={setShowOffers}>
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
            <span>at each item.</span>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search items..."
              className="max-w-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <Card key={item.id} className="relative hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-2">
                <div className="relative">
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-8 h-8 mx-auto mb-1" />

                  {/* Sell offers (top right, red) */}
                  {item.sellOffers > 0 && (
                    <Link href={`/offers-to/sell/${item.id}`}>
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 min-w-4 flex items-center justify-center hover:bg-red-700"
                      >
                        {item.sellOffers}
                      </Badge>
                    </Link>
                  )}

                  {/* Buy offers (bottom right, blue) */}
                  {item.buyOffers > 0 && (
                    <Link href={`/offers-to/buy/${item.id}`}>
                      <Badge className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-4 min-w-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700">
                        {item.buyOffers}
                      </Badge>
                    </Link>
                  )}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {item.name} - {item.price}g
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  )
}
