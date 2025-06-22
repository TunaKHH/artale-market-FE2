#!/usr/bin/env node
const fs = require('fs');
const glob = require('glob');

// Any 型別替換映射
const typeReplacements = [
  {
    pattern: /: any\[\]/g,
    replacement: ': unknown[]',
    description: 'Array any → unknown array'
  },
  {
    pattern: /: any(?=[,\)\s\}])/g,
    replacement: ': unknown',
    description: 'Simple any → unknown'
  },
  {
    pattern: /analytics: any/g,
    replacement: 'analytics: AnalyticsEvent',
    description: 'Analytics any → AnalyticsEvent'
  },
  {
    pattern: /broadcast: any/g,
    replacement: 'broadcast: BroadcastMessageWithFavorite',
    description: 'Broadcast any → BroadcastMessageWithFavorite'
  },
  {
    pattern: /details\?: any/g,
    replacement: 'details?: ErrorDetails',
    description: 'Details any → ErrorDetails'
  },
  {
    pattern: /rateLimitInfo: any/g,
    replacement: 'rateLimitInfo: RateLimitInfo',
    description: 'RateLimitInfo any → RateLimitInfo'
  },
];

// 需要添加的 import 映射
const importMappings = {
  'AnalyticsEvent': 'import type { AnalyticsEvent } from "@/lib/types"',
  'BroadcastMessageWithFavorite': 'import type { BroadcastMessageWithFavorite } from "@/lib/types"',
  'ErrorDetails': 'import type { ErrorDetails } from "@/lib/types"',
  'RateLimitInfo': 'import type { RateLimitInfo } from "@/lib/types"',
};

function fixTypesInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  const usedTypes = new Set();

  // 應用型別替換
  typeReplacements.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      hasChanges = true;

      // 記錄使用的型別
      const typeMatch = replacement.match(/: (\w+)/);
      if (typeMatch) {
        usedTypes.add(typeMatch[1]);
      }

      console.log(`  ✓ ${description}: ${matches.length} 處`);
    }
  });

  // 添加必要的 import
  if (hasChanges && usedTypes.size > 0) {
    const existingImports = content.match(/import.*from.*types/);

    if (!existingImports) {
      const importsToAdd = Array.from(usedTypes)
        .filter(type => importMappings[type])
        .map(type => importMappings[type]);

      if (importsToAdd.length > 0) {
        const importBlock = importsToAdd.join('\n') + '\n';

        if (content.includes('import ')) {
          content = content.replace(
            /(import[^;]+from[^;]+;)(?![^]*import)/,
            `$1\n${importBlock}`
          );
        } else {
          content = importBlock + content;
        }
      }
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ 已更新: ${filePath}`);
  }

  return hasChanges;
}

// 主執行函數
function main() {
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', '.next/**', 'scripts/**', 'lib/types.ts']
  });

  console.log(`🔍 找到 ${files.length} 個檔案需要檢查型別...`);

  let totalChanges = 0;
  files.forEach(file => {
    const hasChanges = fixTypesInFile(file);
    if (hasChanges) totalChanges++;
  });

  console.log(`🎉 型別修正完成！共修正 ${totalChanges} 個檔案`);
}

if (require.main === module) {
  main();
}

module.exports = { fixTypesInFile, typeReplacements };