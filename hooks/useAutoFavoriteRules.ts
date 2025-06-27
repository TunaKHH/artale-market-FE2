import { useState, useEffect, useCallback } from 'react'
import { AutoFavoriteRule } from '@/lib/types'

const STORAGE_KEY = 'auto-favorite-rules'

export const useAutoFavoriteRules = () => {
  const [rules, setRules] = useState<AutoFavoriteRule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 從 localStorage 載入規則
  const loadRules = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedRules = JSON.parse(stored) as AutoFavoriteRule[]
        setRules(parsedRules)
      }
    } catch (error) {
      console.warn('Failed to load auto-favorite rules:', error)
      setRules([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 儲存規則到 localStorage 的輔助函數
  const saveToLocalStorage = (newRules: AutoFavoriteRule[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules))
    } catch (error) {
      console.error('Failed to save auto-favorite rules:', error)
    }
  }

  // 新增規則
  const addRule = useCallback((rule: Omit<AutoFavoriteRule, 'id' | 'createdAt' | 'matchCount'>) => {
    const newRule: AutoFavoriteRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      matchCount: 0
    }

    setRules(prevRules => {
      const newRules = [...prevRules, newRule]
      saveToLocalStorage(newRules)
      return newRules
    })
    
    return newRule
  }, [])

  // 更新規則
  const updateRule = useCallback((id: string, updates: Partial<AutoFavoriteRule>) => {
    setRules(prevRules => {
      const newRules = prevRules.map(rule =>
        rule.id === id ? { ...rule, ...updates } : rule
      )
      saveToLocalStorage(newRules)
      return newRules
    })
  }, [])

  // 刪除規則
  const deleteRule = useCallback((id: string) => {
    setRules(prevRules => {
      const newRules = prevRules.filter(rule => rule.id !== id)
      saveToLocalStorage(newRules)
      return newRules
    })
  }, [])

  // 切換規則啟用狀態
  const toggleRule = useCallback((id: string) => {
    setRules(prevRules => {
      const newRules = prevRules.map(rule =>
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
      )
      saveToLocalStorage(newRules)
      return newRules
    })
  }, [])

  // 增加匹配計數
  const incrementMatchCount = useCallback((id: string) => {
    setRules(prevRules => {
      const newRules = prevRules.map(rule =>
        rule.id === id ? { ...rule, matchCount: rule.matchCount + 1 } : rule
      )
      saveToLocalStorage(newRules)
      return newRules
    })
  }, [])

  // 獲取啟用的規則
  const getActiveRules = useCallback(() => {
    return rules.filter(rule => rule.isActive)
  }, [rules])

  // 重置所有匹配計數
  const resetMatchCounts = useCallback(() => {
    setRules(prevRules => {
      const newRules = prevRules.map(rule => ({ ...rule, matchCount: 0 }))
      saveToLocalStorage(newRules)
      return newRules
    })
  }, [])

  // 初始化時載入規則
  useEffect(() => {
    loadRules()
  }, [])


  return {
    rules,
    isLoading,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    incrementMatchCount,
    getActiveRules,
    resetMatchCounts,
    reload: loadRules
  }
}