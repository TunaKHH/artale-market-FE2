import { renderHook, act, waitFor } from '@testing-library/react'
import { useWebSocketBroadcasts } from '@/hooks/useWebSocketBroadcasts'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
    // 模擬非同步連線
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 100)
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
    // 可以在這裡添加模擬響應邏輯
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }))
    }
  }
}

// 設置全域 WebSocket mock
global.WebSocket = MockWebSocket as any

describe('useWebSocketBroadcasts', () => {
  beforeEach(() => {
    // 清理任何現有的 WebSocket 實例
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('應該初始化為 disconnected 狀態', () => {
    const { result } = renderHook(() => 
      useWebSocketBroadcasts({ autoConnect: false })
    )

    expect(result.current.connectionState).toBe('disconnected')
    expect(result.current.isConnected).toBe(false)
    expect(result.current.messages).toEqual([])
    expect(result.current.messageCount).toBe(0)
  })

  it('應該能夠手動連線', async () => {
    const { result } = renderHook(() => 
      useWebSocketBroadcasts({ autoConnect: false })
    )

    act(() => {
      result.current.connect()
    })

    expect(result.current.connectionState).toBe('connecting')

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
      expect(result.current.isConnected).toBe(true)
    }, { timeout: 200 })
  })

  it('應該能夠手動斷線', async () => {
    const { result } = renderHook(() => 
      useWebSocketBroadcasts({ autoConnect: false })
    )

    // 先連線
    act(() => {
      result.current.connect()
    })

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // 再斷線
    act(() => {
      result.current.disconnect()
    })

    expect(result.current.connectionState).toBe('disconnected')
    expect(result.current.isConnected).toBe(false)
  })

  it('應該清除訊息', () => {
    const { result } = renderHook(() => 
      useWebSocketBroadcasts({ autoConnect: false })
    )

    // 假設有一些訊息
    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toEqual([])
    expect(result.current.messageCount).toBe(0)
  })

  it('應該清除錯誤', () => {
    const { result } = renderHook(() => 
      useWebSocketBroadcasts({ autoConnect: false })
    )

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('應該管理訂閱狀態', async () => {
    const { result } = renderHook(() => 
      useWebSocketBroadcasts({ autoConnect: false })
    )

    // 先連線
    act(() => {
      result.current.connect()
    })

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // 初始應該未訂閱
    expect(result.current.isSubscribed).toBe(false)

    // 訂閱
    act(() => {
      result.current.subscribeToNewMessages()
    })

    // 取消訂閱
    act(() => {
      result.current.unsubscribeFromNewMessages()
    })
  })

  it('應該處理自動連線選項', async () => {
    const { result } = renderHook(() => 
      useWebSocketBroadcasts({ autoConnect: true })
    )

    // 應該自動開始連線
    expect(result.current.connectionState).toBe('connecting')

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    }, { timeout: 200 })
  })
})