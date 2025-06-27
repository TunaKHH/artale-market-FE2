"use client"

import React from "react"
import { Header } from "../components/header"
import { WebSocketBroadcastsPage } from "@/components/feature/websocket/WebSocketBroadcastsPage"

export default function BroadcastsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WebSocketBroadcastsPage />
      </main>
    </div>
  )
}