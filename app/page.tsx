"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "./components/header"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/trading")
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">正在跳轉至交易市場...</p>
        </div>
      </main>
    </div>
  )
}
