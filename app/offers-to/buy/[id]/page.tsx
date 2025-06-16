"use client"

import { useState } from "react"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Header } from "../../../components/header"

// Mock data for the specific item
const itemData = {
  id: 9065,
  name: "Greater Potion of Defense",
  image: "/placeholder.svg?height=32&width=32",
}

// Mock data for buy offers
const offers = [
  {
    id: 1,
    selling: [{ item: "/placeholder.svg?height=24&width=24", quantity: 1, name: "Life Potion" }],
    buying: [{ item: "/placeholder.svg?height=24&width=24", quantity: 40, name: "Greater Potion of Defense" }],
    quantity: 1,
    addedTime: "~2 hours ago",
    playerName: "PotionBuyer",
    lastSeen: "~2 hours ago",
    server: "USW3",
  },
  {
    id: 2,
    selling: [{ item: "/placeholder.svg?height=24&width=24", quantity: 1, name: "Mana Potion" }],
    buying: [{ item: "/placeholder.svg?height=24&width=24", quantity: 8, name: "Greater Potion of Defense" }],
    quantity: 1,
    addedTime: "~4 hours ago",
    playerName: "DefenseCollector",
    lastSeen: "~4 hours ago",
    server: "EUW2",
  },
  {
    id: 3,
    selling: [{ item: "/placeholder.svg?height=24&width=24", quantity: 2, name: "Rainbow Potion" }],
    buying: [{ item: "/placeholder.svg?height=24&width=24", quantity: 50, name: "Greater Potion of Defense" }],
    quantity: 1,
    addedTime: "~6 hours ago",
    playerName: "BulkTrader",
    lastSeen: "~6 hours ago",
    server: "USEast",
  },
]

export default function BuyOffersPage({ params }: { params: { id: string } }) {
  const [whoFilter, setWhoFilter] = useState("buying")
  const [forFilter, setForFilter] = useState("anything")

  const totalOffers = offers.length
  const uniquePlayers = [...new Set(offers.map((offer) => offer.playerName))].length

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/trading">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trading
            </Button>
          </Link>
        </div>

        {/* Title and Description */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Offers</h1>
          <p className="text-gray-600 mb-6">
            There are <span className="font-semibold">{totalOffers}</span> offers made by{" "}
            <span className="font-semibold">{uniquePlayers}</span> RotMG players in the past two days who are{" "}
            <span className="font-semibold">buying {itemData.name}</span> on RealmEye.
          </p>

          {/* Instructions */}
          <div className="space-y-2 text-gray-600 mb-6">
            <div className="flex items-start space-x-2">
              <span className="text-gray-400">•</span>
              <p>
                If you've found some offers you are interested in, then contact the players in-game, or send them a
                message through RealmEye, if they're not online.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-gray-400">•</span>
              <p>
                If you haven't found among the{" "}
                <Link href="/trading" className="text-blue-600 hover:underline">
                  current offers
                </Link>{" "}
                what you are looking for, just{" "}
                <Link href="#" className="text-blue-600 hover:underline font-semibold">
                  post an offer
                </Link>{" "}
                for it!{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  Click here to see how!
                </Link>
              </p>
            </div>
          </div>

          {/* Filter Section */}
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-gray-700">Who is</span>
            <Select value={whoFilter} onValueChange={setWhoFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selling">Selling</SelectItem>
                <SelectItem value="buying">Buying</SelectItem>
              </SelectContent>
            </Select>
            <img src={itemData.image || "/placeholder.svg"} alt={itemData.name} className="w-8 h-8" />
            <span className="text-gray-700">for</span>
            <Select value={forFilter} onValueChange={setForFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anything">Anything</SelectItem>
                <SelectItem value="life">Life Potion</SelectItem>
                <SelectItem value="mana">Mana Potion</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-gray-700">?</span>
          </div>
        </div>

        {/* Offers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Selling</TableHead>
                  <TableHead className="font-semibold">Buying</TableHead>
                  <TableHead className="font-semibold text-center">Qty.</TableHead>
                  <TableHead className="font-semibold">Added</TableHead>
                  <TableHead className="font-semibold">Offer by</TableHead>
                  <TableHead className="font-semibold">Last seen</TableHead>
                  <TableHead className="font-semibold">Srv.</TableHead>
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
                        <Link href="#" className="text-blue-600 hover:underline">
                          {offer.playerName}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{offer.lastSeen}</TableCell>
                    <TableCell className="text-gray-600">{offer.server}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <MessageCircle className="w-4 h-4 mr-2" />
            Post Your Own Offer
          </Button>
          <Button variant="outline">
            <Link href={`/offers-to/sell/${params.id}`}>View Sell Offers</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
