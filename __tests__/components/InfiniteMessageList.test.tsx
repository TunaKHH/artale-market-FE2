import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { InfiniteMessageList } from '@/components/feature/websocket'
import type { BroadcastMessage } from '@/lib/api'

// Mock hooks
jest.mock('@/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: jest.fn(() => ({
    loadMoreRef: { current: null },
    isFetching: false,
    error: null,
    retry: jest.fn()
  }))
}))

// Mock 訊息項目組件
jest.mock('@/components/feature/websocket', () => ({
  ...jest.requireActual('@/components/feature/websocket'),
  MessageItem: ({ message, onClick }: any) => (
    <div
      data-testid={`message-${message.id}`}
      onClick={() => onClick?.(message)}
      className={message.isNew ? 'new-message' : ''}
    >
      {message.content}
    </div>
  )
}))

// Mock UI 組件
jest.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
  MessageSkeleton: ({ count }: any) => (
    <div data-testid="message-skeleton">載入骨架 x{count}</div>
  )
}))

jest.mock('@/components/ui/error-display', () => ({
  LoadErrorDisplay: ({ message, onRetry }: any) => (
    <div data-testid="load-error">
      <span>{message}</span>
      <button onClick={onRetry}>重試</button>
    </div>
  )
}))

jest.mock('@/components/ui/progress-bar', () => ({
  IndeterminateProgressBar: () => <div data-testid="progress-bar">載入中...</div>
}))

// 建立測試用訊息
const createMockMessage = (id: string, content: string, isNew = false): BroadcastMessage => ({
  id,
  content,
  player_name: 'TestPlayer',
  timestamp: new Date().toISOString(),
  message_type: 'other',
  isNew
})

describe('InfiniteMessageList', () => {
  const mockOnLoadMore = jest.fn()
  const mockOnMessageClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnLoadMore.mockResolvedValue([])
  })

  it('應該顯示空狀態', () => {
    render(
      <InfiniteMessageList
        messages={[]}
        onLoadMore={mockOnLoadMore}
      />
    )

    expect(screen.getByText('尚無廣播訊息')).toBeInTheDocument()
    expect(screen.getByText('等待玩家發送廣播訊息...')).toBeInTheDocument()
  })

  it('應該顯示載入骨架', () => {
    render(
      <InfiniteMessageList
        messages={[]}
        loading={true}
        onLoadMore={mockOnLoadMore}
      />
    )

    expect(screen.getByTestId('message-skeleton')).toBeInTheDocument()
  })

  it('應該渲染訊息列表', () => {
    const messages = [
      createMockMessage('1', '測試訊息 1'),
      createMockMessage('2', '測試訊息 2'),
      createMockMessage('3', '測試訊息 3', true) // 新訊息
    ]

    render(
      <InfiniteMessageList
        messages={messages}
        onLoadMore={mockOnLoadMore}
        onMessageClick={mockOnMessageClick}
      />
    )

    expect(screen.getByTestId('message-1')).toBeInTheDocument()
    expect(screen.getByTestId('message-2')).toBeInTheDocument()
    expect(screen.getByTestId('message-3')).toBeInTheDocument()

    // 檢查新訊息標記
    expect(screen.getByTestId('message-3')).toHaveClass('new-message')
  })

  it('應該處理訊息點擊', () => {
    const messages = [createMockMessage('1', '測試訊息')]

    render(
      <InfiniteMessageList
        messages={messages}
        onLoadMore={mockOnLoadMore}
        onMessageClick={mockOnMessageClick}
      />
    )

    fireEvent.click(screen.getByTestId('message-1'))
    expect(mockOnMessageClick).toHaveBeenCalledWith(messages[0])
  })

  it('應該顯示載入更多按鈕', () => {
    const messages = [createMockMessage('1', '測試訊息')]

    render(
      <InfiniteMessageList
        messages={messages}
        hasMoreHistory={true}
        onLoadMore={mockOnLoadMore}
      />
    )

    expect(screen.getByText('載入更多歷史訊息')).toBeInTheDocument()
  })

  it('應該處理手動載入更多', async () => {
    const messages = [createMockMessage('1', '測試訊息')]

    render(
      <InfiniteMessageList
        messages={messages}
        hasMoreHistory={true}
        onLoadMore={mockOnLoadMore}
      />
    )

    fireEvent.click(screen.getByText('載入更多歷史訊息'))

    await waitFor(() => {
      expect(mockOnLoadMore).toHaveBeenCalled()
    })
  })

  it('應該顯示統計資訊', () => {
    const messages = [
      createMockMessage('1', '測試訊息 1'),
      createMockMessage('2', '測試訊息 2')
    ]

    render(
      <InfiniteMessageList
        messages={messages}
        onLoadMore={mockOnLoadMore}
      />
    )

    expect(screen.getByText('共 2 筆訊息')).toBeInTheDocument()
  })

  it('應該顯示更多歷史訊息提示', () => {
    const messages = [createMockMessage('1', '測試訊息')]

    render(
      <InfiniteMessageList
        messages={messages}
        hasMoreHistory={true}
        onLoadMore={mockOnLoadMore}
      />
    )

    expect(screen.getByText('還有更多歷史訊息')).toBeInTheDocument()
  })

  it('應該顯示完成載入提示', () => {
    const messages = [createMockMessage('1', '測試訊息')]

    render(
      <InfiniteMessageList
        messages={messages}
        hasMoreHistory={false}
        onLoadMore={mockOnLoadMore}
      />
    )

    expect(screen.getByText('已載入所有歷史訊息')).toBeInTheDocument()
  })

  it('應該處理載入錯誤', () => {
    // 使用實際的 useInfiniteScroll mock 返回錯誤
    const useInfiniteScrollMock = require('@/hooks/useInfiniteScroll').useInfiniteScroll
    useInfiniteScrollMock.mockReturnValueOnce({
      loadMoreRef: { current: null },
      isFetching: false,
      error: '載入失敗',
      retry: jest.fn()
    })

    const messages = [createMockMessage('1', '測試訊息')]

    render(
      <InfiniteMessageList
        messages={messages}
        hasMoreHistory={true}
        onLoadMore={mockOnLoadMore}
      />
    )

    expect(screen.getByTestId('load-error')).toBeInTheDocument()
    expect(screen.getByText('載入失敗')).toBeInTheDocument()
  })

  it('應該處理載入中狀態', () => {
    const messages = [createMockMessage('1', '測試訊息')]

    render(
      <InfiniteMessageList
        messages={messages}
        loading={true}
        hasMoreHistory={true}
        onLoadMore={mockOnLoadMore}
      />
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('載入歷史訊息...')).toBeInTheDocument()
  })
})