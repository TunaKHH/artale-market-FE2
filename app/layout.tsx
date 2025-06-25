import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"
import { ThemeProvider } from "@/components/layout"
import "./globals.css"

// 🚀 性能優化：字體優化
const inter = Inter({
  subsets: ["latin"],
  display: 'swap', // 改善字體載入性能
  preload: true,
})

export const metadata: Metadata = {
  title: "Artale 廣播 - 楓之谷廣播分類平台",
  description: "即時監控 Artale 遊戲廣播訊息，自動分類收購、販售、組隊等資訊",
  generator: "Tuna",
  // 🚀 性能優化：改善 SEO 和載入性能
  keywords: ["Artale", "楓之谷", "廣播", "遊戲", "交易", "組隊"],
  authors: [{ name: "Tuna" }],
  creator: "Tuna",
  openGraph: {
    title: "Artale 廣播 - 楓之谷廣播分類平台",
    description: "即時監控 Artale 遊戲廣播訊息，自動分類收購、販售、組隊等資訊",
    type: "website",
    locale: "zh_TW",
  },
  twitter: {
    card: "summary_large_image",
    title: "Artale 廣播 - 楓之谷廣播分類平台",
    description: "即時監控 Artale 遊戲廣播訊息，自動分類收購、販售、組隊等資訊",
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
    ],
  },
}

// 🚀 性能優化：視窗設定（修正 Next.js 15 警告）
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        {/* 🚀 性能優化：關鍵資源預載入 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_API_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        )}

        {/* 🚀 性能優化：DNS 預解析 */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* 🚀 性能優化：關鍵 CSS 內聯提示 */}
        <link rel="preload" href="/api/broadcasts" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  )
}
