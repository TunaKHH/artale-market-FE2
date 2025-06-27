import { AutoFavoriteRule, BroadcastMessageWithFavorite } from './types'

// 繁簡體字符對照表（部分常用字符）
const TRADITIONAL_TO_SIMPLIFIED: Record<string, string> = {
  '裝': '装', '備': '备', '購': '购', '賣': '卖', '買': '买',
  '組': '组', '隊': '队', '團': '团', '會': '会', '開': '开',
  '關': '关', '強': '强', '點': '点', '線': '线', '網': '网',
  '學': '学', '習': '习', '練': '练', '級': '级', '經': '经',
  '驗': '验', '錢': '钱', '幣': '币', '價': '价', '格': '格',
  '個': '个', '這': '这', '那': '那', '時': '时', '間': '间',
  '來': '来', '過': '过', '現': '现', '發': '发', '問': '问',
  '題': '题', '數': '数', '量': '量', '長': '长', '短': '短'
}

const SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {}
for (const [trad, simp] of Object.entries(TRADITIONAL_TO_SIMPLIFIED)) {
  SIMPLIFIED_TO_TRADITIONAL[simp] = trad
}

/**
 * 正規化文字：移除標點符號、統一大小寫、處理繁簡體
 */
export const normalizeText = (text: string): string => {
  if (!text) return ''
  
  // 移除標點符號和特殊字符，保留中文、英文、數字
  let normalized = text.replace(/[^\u4e00-\u9fff\w\s]/g, ' ')
  
  // 統一為小寫
  normalized = normalized.toLowerCase()
  
  // 移除多餘空格
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

/**
 * 轉換繁簡體（雙向）
 */
export const convertTraditionalSimplified = (text: string): string[] => {
  const results = [text]
  
  // 轉換為簡體
  let simplified = text
  for (const [trad, simp] of Object.entries(TRADITIONAL_TO_SIMPLIFIED)) {
    simplified = simplified.replace(new RegExp(trad, 'g'), simp)
  }
  if (simplified !== text) results.push(simplified)
  
  // 轉換為繁體
  let traditional = text
  for (const [simp, trad] of Object.entries(SIMPLIFIED_TO_TRADITIONAL)) {
    traditional = traditional.replace(new RegExp(simp, 'g'), trad)
  }
  if (traditional !== text) results.push(traditional)
  
  return [...new Set(results)] // 去重
}

/**
 * 檢查關鍵字是否匹配文字內容
 */
export const isKeywordMatch = (
  content: string,
  keyword: string,
  matchMode: 'contains' | 'exact' | 'regex'
): boolean => {
  if (!content || !keyword) return false
  
  try {
    switch (matchMode) {
      case 'exact': {
        const normalizedContent = normalizeText(content)
        const normalizedKeyword = normalizeText(keyword)
        
        // 檢查完全匹配
        if (normalizedContent === normalizedKeyword) return true
        
        // 檢查繁簡體版本
        const keywordVariants = convertTraditionalSimplified(normalizedKeyword)
        return keywordVariants.some(variant => normalizedContent === variant)
      }
      
      case 'regex': {
        const flags = 'i' // 大小寫不敏感
        const regex = new RegExp(keyword, flags)
        return regex.test(content)
      }
      
      case 'contains':
      default: {
        const normalizedContent = normalizeText(content)
        const normalizedKeyword = normalizeText(keyword)
        
        // 檢查包含匹配
        if (normalizedContent.includes(normalizedKeyword)) return true
        
        // 檢查繁簡體版本
        const keywordVariants = convertTraditionalSimplified(normalizedKeyword)
        return keywordVariants.some(variant => normalizedContent.includes(variant))
      }
    }
  } catch (error) {
    console.warn('Keyword matching error:', error)
    return false
  }
}

/**
 * 檢查規則是否匹配廣播訊息
 */
export const isRuleMatch = (
  message: BroadcastMessageWithFavorite,
  rule: AutoFavoriteRule
): { isMatch: boolean; matchedKeywords: string[] } => {
  console.log(`🔎 檢查規則: "${rule.name}"`)
  console.log(`  - 狀態: ${rule.isActive ? '啟用' : '停用'}`)
  console.log(`  - 關鍵字: [${rule.keywords.join(', ')}]`)
  console.log(`  - 訊息內容: "${message.content}"`)
  
  if (!rule.isActive) {
    console.log(`  ❌ 規則已停用`)
    return { isMatch: false, matchedKeywords: [] }
  }
  
  // 檢查訊息類型篩選
  if (rule.messageTypes && rule.messageTypes.length > 0) {
    if (!rule.messageTypes.includes(message.message_type)) {
      console.log(`  ❌ 訊息類型不匹配: ${message.message_type} 不在 [${rule.messageTypes.join(', ')}]`)
      return { isMatch: false, matchedKeywords: [] }
    }
  }
  
  const matchedKeywords: string[] = []
  
  // 檢查每個關鍵字
  for (const keyword of rule.keywords) {
    const keywordMatch = isKeywordMatch(message.content, keyword, rule.matchMode)
    console.log(`    檢查關鍵字 "${keyword}": ${keywordMatch ? '✅ 匹配' : '❌ 不匹配'}`)
    
    if (keywordMatch) {
      matchedKeywords.push(keyword)
    }
  }
  
  const isMatch = matchedKeywords.length > 0
  console.log(`  結果: ${isMatch ? '✅' : '❌'} 匹配了 ${matchedKeywords.length} 個關鍵字`)
  
  // 如果有任何關鍵字匹配，則規則匹配
  return {
    isMatch,
    matchedKeywords
  }
}

/**
 * 檢查廣播訊息是否匹配任何規則
 */
export const checkAutoFavoriteRules = (
  message: BroadcastMessageWithFavorite,
  rules: AutoFavoriteRule[]
): {
  shouldAutoFavorite: boolean
  matchedRules: Array<{
    rule: AutoFavoriteRule
    matchedKeywords: string[]
  }>
} => {
  console.log("🚀 開始檢查自動收藏規則 @", new Date().toISOString())
  console.log("📋 當前規則列表:", rules.map(r => ({ id: r.id, name: r.name, keywords: r.keywords, isActive: r.isActive })))
  console.log("📝 規則數量:", rules.length)
  console.log("📄 待檢查訊息:", {
    id: message.id,
    content: message.content,
    type: message.message_type,
    player: message.player_name
  })
  
  // 詳細顯示每個規則的狀態
  rules.forEach((rule, index) => {
    console.log(`📌 規則 ${index + 1}:`, {
      name: rule.name,
      keywords: rule.keywords,
      isActive: rule.isActive,
      messageTypes: rule.messageTypes,
      matchMode: rule.matchMode,
      matchCount: rule.matchCount
    })
  })
  
  const matchedRules: Array<{
    rule: AutoFavoriteRule
    matchedKeywords: string[]
  }> = []
  
  for (const rule of rules) {
    const { isMatch, matchedKeywords } = isRuleMatch(message, rule)
    
    if (isMatch) {
      matchedRules.push({
        rule,
        matchedKeywords
      })
    }
  }
  
  console.log("🎯 最終匹配結果:", {
    shouldAutoFavorite: matchedRules.length > 0,
    matchedRulesCount: matchedRules.length,
    matchedRules: matchedRules.map(r => ({
      ruleName: r.rule.name,
      matchedKeywords: r.matchedKeywords
    }))
  })
  
  return {
    shouldAutoFavorite: matchedRules.length > 0,
    matchedRules
  }
}

/**
 * 測試關鍵字匹配（用於規則測試）
 */
export const testKeywordMatch = (
  testContent: string,
  keyword: string,
  matchMode: 'contains' | 'exact' | 'regex'
): {
  isMatch: boolean
  normalizedContent: string
  normalizedKeyword: string
  error?: string
} => {
  try {
    const normalizedContent = normalizeText(testContent)
    const normalizedKeyword = normalizeText(keyword)
    const isMatch = isKeywordMatch(testContent, keyword, matchMode)
    
    return {
      isMatch,
      normalizedContent,
      normalizedKeyword
    }
  } catch (error) {
    return {
      isMatch: false,
      normalizedContent: '',
      normalizedKeyword: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}