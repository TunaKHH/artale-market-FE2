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

  // 儲存規則到 localStorage
  const saveRules = useCallback((newRules: AutoFavoriteRule[]) => {
    console.log("🔄 儲存規則到 localStorage", newRules);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules))
      setRules(newRules)
      console.log("✅ 規則已成功儲存，數量:", newRules.length);
    } catch (error) {
      console.error('Failed to save auto-favorite rules:', error)
    }
  }, [])

  // 新增規則
  const addRule = useCallback((rule: Omit<AutoFavoriteRule, 'id' | 'createdAt' | 'matchCount'>) => {
    const newRule: AutoFavoriteRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      matchCount: 0
    }

    const newRules = [...rules, newRule]
    saveRules(newRules)
    return newRule
  }, [rules, saveRules])

  // 更新規則
  const updateRule = useCallback((id: string, updates: Partial<AutoFavoriteRule>) => {
    const newRules = rules.map(rule =>
      rule.id === id ? { ...rule, ...updates } : rule
    )
    saveRules(newRules)
  }, [rules, saveRules])

  // 刪除規則
  const deleteRule = useCallback((id: string) => {
    console.log("🗑️ 刪除規則:", id)
    console.log("📋 刪除前規則數量:", rules.length)
    const newRules = rules.filter(rule => rule.id !== id)
    console.log("📋 刪除後規則數量:", newRules.length)
    console.log("📋 新的規則列表:", newRules.map(r => ({ id: r.id, name: r.name })))
    saveRules(newRules)
  }, [rules, saveRules])

  // 切換規則啟用狀態
  const toggleRule = useCallback((id: string) => {
    updateRule(id, { isActive: !rules.find(r => r.id === id)?.isActive })
  }, [rules, updateRule])

  // 增加匹配計數
  const incrementMatchCount = useCallback((id: string) => {
    const rule = rules.find(r => r.id === id)
    if (rule) {
      updateRule(id, { matchCount: rule.matchCount + 1 })
    }
  }, [rules, updateRule])

  // 獲取啟用的規則
  const getActiveRules = useCallback(() => {
    return rules.filter(rule => rule.isActive)
  }, [rules])

  // 重置所有匹配計數
  const resetMatchCounts = useCallback(() => {
    const newRules = rules.map(rule => ({ ...rule, matchCount: 0 }))
    saveRules(newRules)
  }, [rules, saveRules])

  // 初始化時載入規則
  useEffect(() => {
    loadRules()
  }, [loadRules])

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