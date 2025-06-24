import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebouncedCallback, useSearchDebounce } from '@/hooks/useDebounce'

// 設置假時鐘
jest.useFakeTimers()

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('應該延遲更新值', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // 初始值
    expect(result.current).toBe('initial')

    // 更新值
    rerender({ value: 'updated', delay: 500 })

    // 值還沒更新
    expect(result.current).toBe('initial')

    // 等待防抖時間
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // 現在值應該更新了
    expect(result.current).toBe('updated')
  })

  it('應該在連續更新時重置計時器', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // 快速連續更新
    rerender({ value: 'update1', delay: 500 })
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    rerender({ value: 'update2', delay: 500 })
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    rerender({ value: 'final', delay: 500 })

    // 值還沒更新
    expect(result.current).toBe('initial')

    // 等待完整的防抖時間
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // 應該是最後的值
    expect(result.current).toBe('final')
  })
})

describe('useDebouncedCallback', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('應該延遲執行回調函數', () => {
    const mockCallback = jest.fn()
    const { result } = renderHook(() => 
      useDebouncedCallback(mockCallback, 500)
    )

    // 呼叫防抖函數
    act(() => {
      result.current('test')
    })

    // 回調還沒執行
    expect(mockCallback).not.toHaveBeenCalled()

    // 等待防抖時間
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // 現在回調應該執行了
    expect(mockCallback).toHaveBeenCalledWith('test')
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('應該在連續呼叫時取消前一個計時器', () => {
    const mockCallback = jest.fn()
    const { result } = renderHook(() => 
      useDebouncedCallback(mockCallback, 500)
    )

    // 快速連續呼叫
    act(() => {
      result.current('call1')
    })
    
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    act(() => {
      result.current('call2')
    })

    // 等待防抖時間
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // 只有最後一次呼叫應該執行
    expect(mockCallback).toHaveBeenCalledWith('call2')
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })
})

describe('useSearchDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('應該處理搜尋防抖', () => {
    const { result, rerender } = renderHook(
      ({ searchTerm }) => useSearchDebounce(searchTerm, 300),
      { initialProps: { searchTerm: '' } }
    )

    // 初始狀態
    expect(result.current.debouncedSearchTerm).toBe('')
    expect(result.current.isSearching).toBe(false)

    // 開始搜尋
    rerender({ searchTerm: 'test' })

    // 應該標記為搜尋中
    expect(result.current.isSearching).toBe(true)
    expect(result.current.debouncedSearchTerm).toBe('') // 還沒更新

    // 等待防抖時間
    act(() => {
      jest.advanceTimersByTime(300)
    })

    // 現在應該更新了搜尋詞並停止搜尋
    expect(result.current.debouncedSearchTerm).toBe('test')
    expect(result.current.isSearching).toBe(false)
  })

  it('應該在連續搜尋時保持搜尋狀態', () => {
    const { result, rerender } = renderHook(
      ({ searchTerm }) => useSearchDebounce(searchTerm, 300),
      { initialProps: { searchTerm: '' } }
    )

    // 連續搜尋更新
    rerender({ searchTerm: 't' })
    expect(result.current.isSearching).toBe(true)

    act(() => {
      jest.advanceTimersByTime(100)
    })

    rerender({ searchTerm: 'te' })
    expect(result.current.isSearching).toBe(true)

    act(() => {
      jest.advanceTimersByTime(100)
    })

    rerender({ searchTerm: 'test' })
    expect(result.current.isSearching).toBe(true)

    // 等待完整防抖時間
    act(() => {
      jest.advanceTimersByTime(300)
    })

    // 最後應該停止搜尋並更新搜尋詞
    expect(result.current.isSearching).toBe(false)
    expect(result.current.debouncedSearchTerm).toBe('test')
  })
})