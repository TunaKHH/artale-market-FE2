"use client"

import { useState } from "react"
import { Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Header } from "./components/header"

// Mock data for forum topics
const forumTopics = [
  {
    id: 1,
    title: "The White Bag Thread v3",
    category: "Community Hub",
    categoryColor: "bg-blue-500",
    posts: 3743,
    views: 92350,
    lastActivity: "an hour ago",
  },
  {
    id: 2,
    title: "Stellar Ascend Engraving",
    category: "Questions & Answers",
    categoryColor: "bg-red-500",
    posts: 2,
    views: 49,
    lastActivity: "11 hours ago",
  },
  {
    id: 3,
    title: "Trading Discussion",
    category: "Trading",
    categoryColor: "bg-green-500",
    posts: 156,
    views: 2340,
    lastActivity: "2 hours ago",
  },
]

// Mock data for recent deaths
const recentDeaths = [
  {
    id: 1,
    playerName: "RingyRangy",
    characterIcon: "/placeholder.svg?height=32&width=32",
    diedOn: "2025-06-04 17:48",
    baseFame: 1003,
    totalFame: "4,381",
    experience: "1,984,860",
    equipment: [
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
    ],
    killedBy: "SpecPan Soulwarden Murcian",
  },
  {
    id: 2,
    playerName: "Astralyzer",
    characterIcon: "/placeholder.svg?height=32&width=32",
    diedOn: "2025-06-04 17:46",
    baseFame: 3234,
    totalFame: "9,501",
    experience: "6,447,874",
    equipment: [
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
    ],
    killedBy: "Sigma Werewolf",
  },
  {
    id: 3,
    playerName: "Gimaxt",
    characterIcon: "/placeholder.svg?height=32&width=32",
    diedOn: "2025-06-04 17:46",
    baseFame: 10303,
    totalFame: "27,493",
    experience: "20,585,325",
    equipment: [
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
      "/placeholder.svg?height=20&width=20",
    ],
    killedBy: "KSW Kogbold Flying Machine",
  },
]

export default function HomePage() {
  const [playerSearch, setPlayerSearch] = useState("")
  const [guildSearch, setGuildSearch] = useState("")

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-300">
              <Eye className="w-16 h-16 text-gray-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-8">We are watching you!</h1>

          {/* Search Bars */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <Input
              placeholder="Player search"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="text-center"
            />
            <Input
              placeholder="Guild search"
              value={guildSearch}
              onChange={(e) => setGuildSearch(e.target.value)}
              className="text-center"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-1 gap-8">
          {/* Forum Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Hot topics on the{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  RealmEye Forum
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Posts</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead>Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forumTopics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell>
                        <Link href="#" className="text-blue-600 hover:underline">
                          {topic.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${topic.categoryColor} text-white`}>{topic.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{topic.posts.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{topic.views.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-600">{topic.lastActivity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Deaths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                The most recent public 8/8 deaths.{" "}
                <Link href="#" className="text-blue-600 hover:underline text-sm font-normal">
                  See more
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Died on</TableHead>
                    <TableHead>BF*</TableHead>
                    <TableHead>TF</TableHead>
                    <TableHead>Exp*</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Killed by</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDeaths.map((death) => (
                    <TableRow key={death.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <img src={death.characterIcon || "/placeholder.svg"} alt="Character" className="w-8 h-8" />
                          <Link href="#" className="text-blue-600 hover:underline">
                            {death.playerName}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{death.diedOn}</TableCell>
                      <TableCell>{death.baseFame}</TableCell>
                      <TableCell>{death.totalFame}</TableCell>
                      <TableCell>{death.experience}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {death.equipment.map((item, index) => (
                            <img key={index} src={item || "/placeholder.svg"} alt="Equipment" className="w-5 h-5" />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{death.killedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
