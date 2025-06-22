#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Console 語句替換映射
const consoleReplacements = {
  'console.log("🚀 正式站環境（環境變數設定）")': 'logger.info("正式站環境（環境變數設定）")',
  'console.warn("⚠️ 所有端點都不健康，使用第一個端點")': 'logger.warn("所有端點都不健康，使用第一個端點")',
  'console.log(`🔄 [故障轉移] 嘗試伺服器 ${attempt + 1}`)': 'logger.failover(`嘗試伺服器 ${attempt + 1}`)',
  'console.log(`✅ [故障轉移] 成功連接到伺服器`)': 'logger.failover("成功連接到伺服器")',
  'console.warn(`❌ [故障轉移] 伺服器 ${attempt + 1} 連線失敗`)': 'logger.failover(`伺服器 ${attempt + 1} 連線失敗`)',
  'console.log(`⏳ 等待 ${attempt + 1} 秒後重試...`)': 'logger.failover(`等待 ${attempt + 1} 秒後重試`)',
  'console.error("Rate limit exceeded:", errorInfo)': 'logger.error("Rate limit exceeded", errorInfo)',
  'console.log(`🧪 [測試模式] 生成假資料...`)': 'logger.test("生成假資料")',
  'console.log("🧪 [假資料] 生成回應:", { page, pageSize, messageType, playerName, keyword })': 'logger.test("生成回應", { page, pageSize, messageType, playerName, keyword })',
};

// 通用 console 語句正則表達式
const consolePatterns = [
  {
    pattern: /console\.log\("🚀 ([^"]+)"\)/g,
    replacement: 'logger.info("$1")'
  },
  {
    pattern: /console\.warn\("⚠️ ([^"]+)"\)/g,
    replacement: 'logger.warn("$1")'
  },
  {
    pattern: /console\.log\(`🔄 \[故障轉移\] ([^`]+)`\)/g,
    replacement: 'logger.failover(`$1`)'
  },
  {
    pattern: /console\.log\(`✅ \[故障轉移\] ([^`]+)`\)/g,
    replacement: 'logger.failover(`$1`)'
  },
  {
    pattern: /console\.warn\(`❌ \[故障轉移\] ([^`]+)`\)/g,
    replacement: 'logger.failover(`$1`)'
  },
  {
    pattern: /console\.log\(`🧪 \[測試模式\] ([^`]+)`\)/g,
    replacement: 'logger.test(`$1`)'
  },
  {
    pattern: /console\.log\("📡 \[API\] ([^"]+)", ([^)]+)\)/g,
    replacement: 'logger.api("$1", $2)'
  },
  {
    pattern: /console\.error\("❌ \[([^\]]+)\] ([^"]+)", ([^)]+)\)/g,
    replacement: 'logger.error("[$1] $2", $3)'
  },
];

function replaceConsoleInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // 檢查是否需要添加 logger import
  const needsLoggerImport = content.includes('console.') && !content.includes('import { logger }');

  // 應用替換
  consolePatterns.forEach(({ pattern, replacement }) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      hasChanges = true;
    }
  });

  // 添加 logger import
  if (needsLoggerImport && hasChanges) {
    const importLine = 'import { logger } from "@/lib/logger"\n';
    if (content.includes('import ')) {
      // 在最後一個 import 後添加
      content = content.replace(
        /(import[^;]+;)(?![^]*import)/,
        `$1\n${importLine}`
      );
    } else {
      content = importLine + content;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ 已更新: ${filePath}`);
  }
}

// 主執行函數
function main() {
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', '.next/**', 'scripts/**', 'lib/logger.ts']
  });

  console.log(`🔍 找到 ${files.length} 個檔案需要檢查...`);

  files.forEach(replaceConsoleInFile);

  console.log('🎉 Console 語句替換完成！');
}

if (require.main === module) {
  main();
}

module.exports = { replaceConsoleInFile, consolePatterns };