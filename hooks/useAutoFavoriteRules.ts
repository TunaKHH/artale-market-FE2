import { useState, useEffect, useCallback } from 'react'
import { AutoFavoriteRule } from '@/lib/types'

const STORAGE_KEY = 'auto-favorite-rules'

export const useAutoFavoriteRules = () => {
  const [rules, setRules] = useState<AutoFavoriteRule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 從 localStorage 載入規則
  const loadRules = useCallback(() => {
    try {
      console.log('📥 載入自動收藏規則從 localStorage')
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedRules = JSON.parse(stored) as AutoFavoriteRule[]
        console.log('📋 載入的規則:', parsedRules.map(r => ({ id: r.id, name: r.name, isActive: r.isActive })))
        setRules(parsedRules)
      } else {
        console.log('📋 localStorage 中沒有保存的規則')
        setRules([])
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
      console.log('🔄 保存自動收藏規則到 localStorage:', {
        key: STORAGE_KEY,
        rulesCount: newRules.length,
        rules: newRules.map(r => ({ id: r.id, name: r.name, isActive: r.isActive }))
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules))
      
      // 驗證保存結果
      const saved = localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) : []
      console.log('✅ 保存結果驗證:', {
        savedCount: parsed.length,
        success: parsed.length === newRules.length
      })
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
    console.log('🗑️ 刪除自動收藏規則:', id)
    setRules(prevRules => {
      console.log('📋 刪除前規則列表:', prevRules.map(r => ({ id: r.id, name: r.name })))
      const newRules = prevRules.filter(rule => rule.id !== id)
      console.log('📋 刪除後規則列表:', newRules.map(r => ({ id: r.id, name: r.name })))
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