"use client"

import React, { useState } from 'react'
import { Plus, Settings, Trash2, Edit, Eye, EyeOff, TestTube } from 'lucide-react'
import { AutoFavoriteRule } from '@/lib/types'
import { useAutoFavoriteRules } from '@/hooks/useAutoFavoriteRules'
import { testKeywordMatch } from '@/lib/autoFavoriteUtils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

interface AutoFavoriteManagerProps {
  trigger?: React.ReactNode
}

interface RuleFormData {
  name: string
  keywords: string[]
  messageTypes: ('buy' | 'sell' | 'team' | 'other')[]
  matchMode: 'contains' | 'exact' | 'regex'
}

const initialFormData: RuleFormData = {
  name: '',
  keywords: [],
  messageTypes: [],
  matchMode: 'contains'
}

export const AutoFavoriteManager: React.FC<AutoFavoriteManagerProps> = ({ 
  trigger 
}) => {
  const { 
    rules, 
    isLoading, 
    addRule, 
    updateRule, 
    deleteRule, 
    toggleRule, 
    resetMatchCounts 
  } = useAutoFavoriteRules()

  const [isOpen, setIsOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoFavoriteRule | null>(null)
  const [formData, setFormData] = useState<RuleFormData>(initialFormData)
  const [keywordInput, setKeywordInput] = useState('')
  const [testContent, setTestContent] = useState('')
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  // 重置表單
  const resetForm = () => {
    setFormData(initialFormData)
    setKeywordInput('')
    setEditingRule(null)
    setTestContent('')
    setTestResults({})
  }

  // 開始編輯規則
  const startEdit = (rule: AutoFavoriteRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      keywords: rule.keywords,
      messageTypes: rule.messageTypes || [],
      matchMode: rule.matchMode
    })
    setKeywordInput(rule.keywords.join(', '))
  }

  // 處理關鍵字輸入
  const handleKeywordInputChange = (value: string) => {
    setKeywordInput(value)
    const keywords = value.split(',').map(k => k.trim()).filter(k => k)
    setFormData(prev => ({ ...prev, keywords }))
  }

  // 處理訊息類型選擇
  const handleMessageTypeToggle = (type: 'buy' | 'sell' | 'team' | 'other') => {
    setFormData(prev => ({
      ...prev,
      messageTypes: prev.messageTypes.includes(type)
        ? prev.messageTypes.filter(t => t !== type)
        : [...prev.messageTypes, type]
    }))
  }

  // 提交表單
  const handleSubmit = () => {
    if (!formData.name.trim() || formData.keywords.length === 0) {
      alert('請填寫規則名稱和至少一個關鍵字')
      return
    }

    if (editingRule) {
      updateRule(editingRule.id, {
        name: formData.name.trim(),
        keywords: formData.keywords,
        messageTypes: formData.messageTypes,
        matchMode: formData.matchMode
      })
    } else {
      addRule({
        name: formData.name.trim(),
        keywords: formData.keywords,
        messageTypes: formData.messageTypes,
        matchMode: formData.matchMode,
        isActive: true
      })
    }

    resetForm()
  }

  // 測試關鍵字匹配
  const handleTestMatch = () => {
    if (!testContent.trim()) {
      alert('請輸入測試內容')
      return
    }

    const results: Record<string, boolean> = {}
    formData.keywords.forEach(keyword => {
      const result = testKeywordMatch(testContent, keyword, formData.matchMode)
      results[keyword] = result.isMatch
    })
    setTestResults(results)
  }

  // 獲取訊息類型標籤
  const getMessageTypeLabel = (type: string) => {
    const labels = {
      buy: '收購',
      sell: '販售',
      team: '組隊',
      other: '其他'
    }
    return labels[type as keyof typeof labels] || type
  }

  // 獲取匹配模式標籤
  const getMatchModeLabel = (mode: string) => {
    const labels = {
      contains: '包含',
      exact: '精確',
      regex: '正則'
    }
    return labels[mode as keyof typeof labels] || mode
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Settings className="w-4 h-4 mr-2" />
      自動收藏設定
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>自動收藏規則管理</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rules">規則列表</TabsTrigger>
            <TabsTrigger value="add">
              {editingRule ? '編輯規則' : '新增規則'}
            </TabsTrigger>
          </TabsList>

          {/* 規則列表 */}
          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                共 {rules.length} 條規則，{rules.filter(r => r.isActive).length} 條啟用
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetMatchCounts}
                disabled={isLoading}
              >
                重置計數
              </Button>
            </div>

            <div className="space-y-3">
              {rules.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">尚未設定任何自動收藏規則</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      點擊「新增規則」開始設定關鍵字自動收藏
                    </p>
                  </CardContent>
                </Card>
              ) : (
                rules.map(rule => (
                  <Card key={rule.id} className={rule.isActive ? '' : 'opacity-50'}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {rule.name}
                          {rule.isActive ? (
                            <Badge variant="default" className="text-xs">啟用</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">停用</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              startEdit(rule)
                              // 切換到編輯標籤頁
                              const tabsList = document.querySelector('[role="tablist"]') as HTMLElement
                              const editTab = tabsList?.querySelector('[value="add"]') as HTMLElement
                              editTab?.click()
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('確定要刪除這條規則嗎？')) {
                                deleteRule(rule.id)
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">關鍵字</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rule.keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>匹配模式: {getMatchModeLabel(rule.matchMode)}</span>
                          <span>匹配次數: {rule.matchCount}</span>
                          {rule.messageTypes && rule.messageTypes.length > 0 && (
                            <span>
                              類型: {rule.messageTypes.map(getMessageTypeLabel).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* 新增/編輯規則 */}
          <TabsContent value="add" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name">規則名稱</Label>
                <Input
                  id="rule-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：稀有裝備收購"
                />
              </div>

              <div>
                <Label htmlFor="keywords">關鍵字（用逗號分隔）</Label>
                <Textarea
                  id="keywords"
                  value={keywordInput}
                  onChange={(e) => handleKeywordInputChange(e.target.value)}
                  placeholder="例如：稀有裝備, 傳說武器, 史詩防具"
                  rows={3}
                />
                {formData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>匹配模式</Label>
                <Select 
                  value={formData.matchMode} 
                  onValueChange={(value: 'contains' | 'exact' | 'regex') => 
                    setFormData(prev => ({ ...prev, matchMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">包含匹配（推薦）</SelectItem>
                    <SelectItem value="exact">精確匹配</SelectItem>
                    <SelectItem value="regex">正則表達式</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>訊息類型篩選（可選）</Label>
                <div className="flex gap-2 mt-2">
                  {(['buy', 'sell', 'team', 'other'] as const).map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant={formData.messageTypes.includes(type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMessageTypeToggle(type)}
                    >
                      {getMessageTypeLabel(type)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  不選擇則匹配所有類型的訊息
                </p>
              </div>

              {/* 關鍵字測試 */}
              <div className="border-t pt-4">
                <Label>測試關鍵字匹配</Label>
                <div className="space-y-2 mt-2">
                  <Textarea
                    value={testContent}
                    onChange={(e) => setTestContent(e.target.value)}
                    placeholder="輸入測試內容，例如：收購稀有裝備，高價收購"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestMatch}
                    disabled={!testContent.trim() || formData.keywords.length === 0}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    測試匹配
                  </Button>
                  
                  {Object.keys(testResults).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">測試結果：</p>
                      {Object.entries(testResults).map(([keyword, isMatch]) => (
                        <div key={keyword} className="flex items-center gap-2 text-sm">
                          <Badge variant={isMatch ? "default" : "secondary"}>
                            {keyword}
                          </Badge>
                          <span className={isMatch ? "text-green-600" : "text-muted-foreground"}>
                            {isMatch ? "✅ 匹配" : "❌ 不匹配"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {editingRule ? '更新規則' : '新增規則'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  取消
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}