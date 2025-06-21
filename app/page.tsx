"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "./components/header"
import { useAnalytics } from "@/hooks/useAnalytics"

export default function HomePage() {
  const router = useRouter()
  const analytics = useAnalytics()

  useEffect(() => {
    // 追蹤首頁瀏覽
    analytics.trackPageView('home', { 
      redirect_target: '/broadcasts',
      is_auto_redirect: true 
    })
    
    // 追蹤重導向行為
    analytics.trackAction('auto_redirect', 'navigation', {
      from: 'home',
      to: 'broadcasts'
    })
    
    router.push("/broadcasts")
  }, [router, analytics])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">正在跳轉至廣播訊息...</p>
        </div>
      </main>
    </div>
  )
}
