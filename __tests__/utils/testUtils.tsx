import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import type { BroadcastMessage } from '@/lib/api'

// 建立測試包裝器 (如果需要 Provider)
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// 自訂 render 函數
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// 測試工具函數
export const createMockBroadcastMessage = (
  overrides: Partial<BroadcastMessage> = {}
): BroadcastMessage => ({
  id: 'mock-id-' + Math.random().toString(36).substr(2, 9),
  content: '測試廣播訊息',
  player_name: 'TestPlayer',
  timestamp: new Date().toISOString(),
  message_type: 'other',
  ...overrides,
})

export const createMockMessages = (count: number): BroadcastMessage[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockBroadcastMessage({
      id: `mock-${index}`,
      content: `測試訊息 ${index + 1}`,
      timestamp: new Date(Date.now() - index * 1000).toISOString(),
    })
  )
}

// WebSocket Mock 輔助工具
export class WebSocketMockBuilder {
  private mockWS: any = {}

  withConnectionState(state: 'connecting' | 'connected' | 'disconnected' | 'error') {
    this.mockWS.connectionState = state
    this.mockWS.isConnected = state === 'connected'
    return this
  }

  withMessages(messages: BroadcastMessage[]) {
    this.mockWS.messages = messages
    this.mockWS.messageCount = messages.length
    return this
  }

  withLoadingState(isLoading: boolean) {
    this.mockWS.isLoadingLatest = isLoading
    this.mockWS.isLoadingHistory = isLoading
    return this
  }

  withError(error: string | null) {
    this.mockWS.error = error
    return this
  }

  withSubscriptionState(isSubscribed: boolean) {
    this.mockWS.isSubscribed = isSubscribed
    return this
  }

  build() {
    return {
      connectionState: 'disconnected',
      isConnected: false,
      messages: [],
      hasMoreHistory: false,
      isLoadingLatest: false,
      isLoadingHistory: false,
      error: null,
      connectionAttempts: 0,
      messageCount: 0,
      isSubscribed: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscribeToNewMessages: jest.fn(),
      unsubscribeFromNewMessages: jest.fn(),
      loadLatestMessages: jest.fn(),
      loadHistoryBefore: jest.fn(),
      clearMessages: jest.fn(),
      clearError: jest.fn(),
      ...this.mockWS,
    }
  }
}

// 等待函數
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// 時間模擬
export const advanceTimersAndPromises = async (ms: number) => {
  jest.advanceTimersByTime(ms)
  await waitForNextTick()
}

// 重新導出 testing-library 所有功能
export * from '@testing-library/react'
export { customRender as render }