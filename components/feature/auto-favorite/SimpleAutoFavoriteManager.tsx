"use client"

import React, { useState, useEffect } from 'react'
import { Settings, Plus, Trash2, TestTube, Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAutoFavoriteRules } from '@/hooks/useAutoFavoriteRules'
import { useNotifications } from '@/hooks/useNotifications'
import { checkAutoFavoriteRules } from '@/lib/autoFavoriteUtils'

export const SimpleAutoFavoriteManager: React.FC = () => {
  const { rules, addRule, deleteRule, toggleRule } = useAutoFavoriteRules()
  const {
    permission,
    isSupported,
    requestPermission,
    sendAutoFavoriteNotification,
    canSendNotifications
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)


  // 載入通知設定
  useEffect(() => {
    const saved = localStorage.getItem('auto-favorite-notifications-enabled')
    setNotificationsEnabled(saved === 'true')
  }, [])

  // 儲存通知設定 - 使用 ref 避免初始化時觸發
  const isInitialized = React.useRef(false)
  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem('auto-favorite-notifications-enabled', notificationsEnabled.toString())
    } else {
      isInitialized.current = true
    }
  }, [notificationsEnabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedKeyword = newKeyword.trim()
    
    if (!trimmedKeyword) {
      return
    }
    
    console.log("📝 表單提交，創建規則:", trimmedKeyword)
    
    addRule({
      name: `關鍵字: ${trimmedKeyword}`,
      keywords: [trimmedKeyword],
      messageTypes: [],
      matchMode: 'contains',
      isActive: true
    })
    setNewKeyword('')
  }

  const handleDeleteRule = (id: string) => {
    if (confirm('確定要刪除這條規則嗎？')) {
      deleteRule(id)
    }
  }

  // 切換通知功能
  const toggleNotifications = async () => {
    if (!isSupported) {
      alert('您的瀏覽器不支援推播通知功能')
      return
    }

    if (permission === 'denied') {
      alert('通知權限已被拒絕，請在瀏覽器設定中允許通知')
      return
    }

    if (!canSendNotifications) {
      const newPermission = await requestPermission()
      if (newPermission === 'granted') {
        setNotificationsEnabled(true)
        // 發送測試通知
        sendAutoFavoriteNotification(
          '測試通知：這是一個測試推播通知',
          ['測試'],
          '測試規則'
        )
      } else {
        alert('需要通知權限才能使用推播通知功能')
      }
    } else {
      setNotificationsEnabled(!notificationsEnabled)
      if (!notificationsEnabled) {
        // 發送測試通知
        sendAutoFavoriteNotification(
          '通知已啟用：您將收到自動收藏的推播通知',
          ['通知'],
          '系統通知'
        )
      }
    }
  }

  // 測試自動收藏功能
  const testAutoFavorite = () => {
    const testMessage = {
      id: Date.now(),
      content: "收購稀有裝備，高價收購",
      channel: "自由市場",
      player_name: "測試玩家",
      player_id: "12345",
      message_type: "buy" as const,
      timestamp: new Date().toISOString(),
      ai_analyzed: false
    }

    console.log("🧪 測試自動收藏功能")
    console.log("測試訊息:", testMessage)
    console.log("當前規則:", rules)

    const { shouldAutoFavorite, matchedRules } = checkAutoFavoriteRules(testMessage, rules)

    console.log("匹配結果:", { shouldAutoFavorite, matchedRules })

    if (shouldAutoFavorite) {
      // 模擬自動收藏
      const existingFavorites = JSON.parse(localStorage.getItem("broadcast-favorites") || "[]")
      const favoriteItem = {
        ...testMessage,
        favorited_at: new Date().toISOString(),
        autoFavorited: true,
        matchedRule: matchedRules[0]?.rule?.name,
        matchedKeywords: matchedRules[0]?.matchedKeywords
      }

      const newFavorites = [favoriteItem, ...existingFavorites]
      localStorage.setItem("broadcast-favorites", JSON.stringify(newFavorites))

      // 如果啟用了通知，發送測試通知
      if (notificationsEnabled && canSendNotifications) {
        sendAutoFavoriteNotification(
          testMessage.content,
          matchedRules[0]?.matchedKeywords || [],
          matchedRules[0]?.rule?.name || '測試規則'
        )
      }

      alert(`✅ 測試成功！訊息已自動收藏\n匹配規則: ${matchedRules.map(r => r.rule.name).join(', ')}`)
    } else {
      alert("❌ 測試失敗：沒有匹配的規則")
    }
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Settings className="w-4 h-4 mr-2" />
        自動收藏設定 ({rules.filter(r => r.isActive).length})
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">自動收藏規則</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          {/* 新增規則 */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="輸入關鍵字..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              required
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {/* 規則列表 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                尚未設定任何規則
              </p>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={() => toggleRule(rule.id)}
                      className="rounded"
                    />
                    <span className={rule.isActive ? '' : 'text-muted-foreground'}>
                      {rule.keywords.join(', ')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (匹配 {rule.matchCount} 次)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* 通知設定 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">推播通知</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleNotifications}
                className={`h-8 ${notificationsEnabled && canSendNotifications ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {notificationsEnabled && canSendNotifications ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {!isSupported ? '瀏覽器不支援通知功能' :
                permission === 'denied' ? '通知權限已被拒絕' :
                  notificationsEnabled && canSendNotifications ? '自動收藏時會發送推播通知' :
                    '點擊鈴鐺圖標啟用推播通知'}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              已啟用 {rules.filter(r => r.isActive).length} / {rules.length} 條規則
            </div>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={testAutoFavorite}
              className="text-xs h-7"
            >
              <TestTube className="w-3 h-3 mr-1" />
              測試功能
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  )
}