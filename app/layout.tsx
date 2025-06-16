import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Artale 廣播監控 - 楓之谷 Worlds 訊息分類平台",
  description: "即時監控 Artale 遊戲廣播訊息，自動分類收購、販售、組隊等資訊",
  generator: "Tuna",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
