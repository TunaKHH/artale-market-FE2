import { logger } from "@/lib/logger"
// 測試用假資料
export interface MockBroadcastMessage {
  id: number
  content: string
  channel: string
  player_name: string
  player_id?: string
  message_type: "buy" | "sell" | "team" | "other"
  timestamp: string
  ai_analyzed: boolean
  ai_confidence?: number
  ai_result?: unknown
}

// 生成隨機時間戳（最近30分鐘內）
const generateRecentTimestamp = () => {
  const now = new Date()
  const randomMinutes = Math.floor(Math.random() * 30) // 0-30分鐘前
  const timestamp = new Date(now.getTime() - randomMinutes * 60 * 1000)
  return timestamp.toISOString()
}

// 隨機玩家名稱池
const playerNames = [
  "楓葉戰士",
  "魔法師小明",
  "弓箭手小美",
  "盜賊阿強",
  "騎士團長",
  "火焰法師",
  "冰霜射手",
  "暗影刺客",
  "聖騎士",
  "龍騎士",
  "星光法師",
  "風暴射手",
  "影舞者",
  "光明使者",
  "黑暗領主",
  "雷電法師",
  "神射手",
  "忍者大師",
  "聖光騎士",
  "惡魔獵人",
  "元素法師",
  "精靈射手",
  "刺客聯盟",
  "守護騎士",
  "戰神",
  "冰雪女王",
  "烈火戰士",
  "疾風劍客",
  "雷霆法師",
  "月影刺客",
]

// 隨機頻道池
const channels = ["全體", "交易", "組隊", "公會", "世界", "區域"]

// 隨機訊息內容池
const messageTemplates = {
  sell: [
    "出售 {item}，價格優惠，密我！",
    "賣 {item}，品質保證，快來搶購！",
    "便宜出售 {item}，有需要的快聯絡！",
    "{item} 大特價，數量有限！",
    "清倉大拍賣！{item} 超低價出售！",
    "出 {item}，價格可議，誠意者優先！",
  ],
  buy: [
    "收購 {item}，價格好談！",
    "急需 {item}，高價收購！",
    "長期收購 {item}，價格公道！",
    "大量收購 {item}，現金交易！",
    "誠收 {item}，價格面議！",
    "高價求購 {item}，有的快來！",
  ],
  team: [
    "組隊打 {dungeon}，還差 {count} 人！",
    "{dungeon} 組隊中，歡迎加入！",
    "開團打 {dungeon}，經驗豐富優先！",
    "組隊刷 {dungeon}，長期合作！",
    "{dungeon} 速刷團，效率優先！",
    "新手友善團，一起打 {dungeon}！",
  ],
  other: [
    "新手求帶，會聽指揮！",
    "公會招人，福利優厚！",
    "交個朋友，一起遊戲！",
    "尋找師父，願意學習！",
    "組建公會，有興趣的來！",
    "分享遊戲心得，歡迎交流！",
  ],
}

// 物品名稱池
const items = [
  "生命藥水",
  "魔力藥水",
  "高級防禦藥水",
  "高級攻擊藥水",
  "高級速度藥水",
  "鋼鐵劍",
  "魔法法杖",
  "精靈弓",
  "暗影匕首",
  "聖光盾牌",
  "皮革護甲",
  "鎖子甲",
  "板甲",
  "法師袍",
  "弓手服",
  "力量戒指",
  "智慧戒指",
  "敏捷戒指",
  "體力戒指",
  "幸運戒指",
  "火焰寶石",
  "冰霜寶石",
  "雷電寶石",
  "暗影寶石",
  "聖光寶石",
  "龍鱗",
  "鳳凰羽毛",
  "獨角獸角",
  "精靈之淚",
  "惡魔之心",
]

// 地下城名稱池
const dungeons = [
  "螞蟻洞穴",
  "蘑菇城堡",
  "玩具城",
  "海盜船",
  "天空之城",
  "冰雪神殿",
  "火焰山谷",
  "暗影森林",
  "光明聖殿",
  "龍之巢穴",
  "魔法塔",
  "地下墓穴",
  "水晶洞窟",
  "風暴高原",
  "雷電峽谷",
]

// 生成隨機訊息內容
const generateMessageContent = (type: string): string => {
  const templates = messageTemplates[type as keyof typeof messageTemplates] || messageTemplates.other
  const template = templates[Math.floor(Math.random() * templates.length)]

  let content = template

  // 替換物品名稱
  if (content.includes("{item}")) {
    const item = items[Math.floor(Math.random() * items.length)]
    content = content.replace("{item}", item)
  }

  // 替換地下城名稱
  if (content.includes("{dungeon}")) {
    const dungeon = dungeons[Math.floor(Math.random() * dungeons.length)]
    content = content.replace("{dungeon}", dungeon)
  }

  // 替換人數
  if (content.includes("{count}")) {
    const count = Math.floor(Math.random() * 3) + 1 // 1-3人
    content = content.replace("{count}", count.toString())
  }

  return content
}

// 生成單筆假資料
export const generateMockBroadcast = (id: number): MockBroadcastMessage => {
  const messageTypes = ["sell", "buy", "team", "other"] as const
  const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)]
  const playerName = playerNames[Math.floor(Math.random() * playerNames.length)]
  const channel = channels[Math.floor(Math.random() * channels.length)]
  const playerId =
    Math.random() > 0.3
      ? Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, "0")
      : undefined

  return {
    id,
    content: generateMessageContent(messageType),
    channel,
    player_name: playerName,
    player_id: playerId,
    message_type: messageType,
    timestamp: generateRecentTimestamp(),
    ai_analyzed: Math.random() > 0.2, // 80% 已分析
    ai_confidence: Math.random() > 0.2 ? Math.random() * 0.4 + 0.6 : undefined, // 60-100% 信心度
    ai_result: null,
  }
}

// 生成多筆假資料
export const generateMockBroadcasts = (count = 50): MockBroadcastMessage[] => {
  return Array.from({ length: count }, (_, index) => generateMockBroadcast(index + 1))
}

// 根據篩選條件過濾假資料
export const filterMockBroadcasts = (
  broadcasts: MockBroadcastMessage[],
  filters: {
    messageType?: string
    keyword?: string
    playerName?: string
  },
): MockBroadcastMessage[] => {
  return broadcasts.filter((broadcast) => {
    // 訊息類型篩選
    if (filters.messageType && filters.messageType !== "all" && broadcast.message_type !== filters.messageType) {
      return false
    }

    // 關鍵字搜尋
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const searchText = `${broadcast.content} ${broadcast.player_name}`.toLowerCase()
      if (!searchText.includes(keyword)) {
        return false
      }
    }

    // 玩家名稱篩選
    if (filters.playerName && !broadcast.player_name.toLowerCase().includes(filters.playerName.toLowerCase())) {
      return false
    }

    return true
  })
}

// 分頁處理
export const paginateMockBroadcasts = (broadcasts: MockBroadcastMessage[], page = 1, pageSize = 50) => {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedBroadcasts = broadcasts.slice(startIndex, endIndex)

  return {
    messages: paginatedBroadcasts,
    total: broadcasts.length,
    page,
    page_size: pageSize,
    has_next: endIndex < broadcasts.length,
    has_prev: page > 1,
  }
}

// 生成統計資料
export const generateMockStats = (broadcasts: MockBroadcastMessage[]) => {
  const stats = {
    total_messages: broadcasts.length,
    buy_messages: broadcasts.filter((b) => b.message_type === "buy").length,
    sell_messages: broadcasts.filter((b) => b.message_type === "sell").length,
    team_messages: broadcasts.filter((b) => b.message_type === "team").length,
    other_messages: broadcasts.filter((b) => b.message_type === "other").length,
    unique_players: new Set(broadcasts.map((b) => b.player_name)).size,
    hourly_breakdown: [] as Array<{ hour: number; count: number }>,
  }

  // 生成每小時統計（過去24小時）
  for (let i = 0; i < 24; i++) {
    stats.hourly_breakdown.push({
      hour: i,
      count: Math.floor(Math.random() * 20) + 1,
    })
  }

  return stats
}

// 檢查是否為正式站環境
export const isProductionEnvironment = (): boolean => {
  // 優先檢查環境變數 NEXT_PUBLIC_IS_PRODUCTION
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_IS_PRODUCTION === "true") {
    return true
  }

  // 在服務器環境中檢測
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    return true
  }

  return false
}

// 檢查是否為測試環境 - 與正式站相反
export const isTestEnvironment = (): boolean => {
  return !isProductionEnvironment()
}

// 強制使用假資料的函數（用於調試）
export const shouldUseMockData = (): boolean => {
  // 總是在測試環境使用假資料，或者當 API 失敗時
  return isTestEnvironment()
}
