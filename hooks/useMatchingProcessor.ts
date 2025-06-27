import { useCallback } from 'react';
import { 
  BroadcastMessageWithFavorite,
  FavoriteMessage,
  AutoFavoriteRule,
  MatchResult,
  MessageMatchEvent,
  MessageMatchHandler,
  MatchEventHandler,
  MatchingProcessorEvent,
  MatchingProcessorEventHandler
} from '@/lib/types';
import { checkAutoFavoriteRules } from '@/lib/autoFavoriteUtils';

interface UseMatchingProcessorOptions {
  rules: AutoFavoriteRule[];
  onMatchEvent?: MatchEventHandler;
  onProcessorEvent?: MatchingProcessorEventHandler;
}

export function useMatchingProcessor({ 
  rules, 
  onMatchEvent, 
  onProcessorEvent 
}: UseMatchingProcessorOptions) {

  // 處理單個訊息的匹配邏輯
  const processMessage = useCallback((
    message: BroadcastMessageWithFavorite | FavoriteMessage
  ): MessageMatchEvent | null => {
    console.log("🔄 MatchingProcessor: 開始處理訊息", message.id);
    
    try {
      // 檢查是否有規則存在
      if (!rules || rules.length === 0) {
        console.log("📋 MatchingProcessor: 沒有設定任何規則");
        return null;
      }

      // 只處理啟用的規則
      const activeRules = rules.filter(rule => rule.isActive);
      
      if (activeRules.length === 0) {
        console.log("📋 MatchingProcessor: 沒有啟用的規則");
        return null;
      }

      // 檢查所有匹配規則 - 確保訊息符合預期格式
      const broadcastMessage = message as BroadcastMessageWithFavorite;
      const { shouldAutoFavorite, matchedRules } = checkAutoFavoriteRules(broadcastMessage, activeRules);
      
      if (shouldAutoFavorite && matchedRules.length > 0) {
        const matchResults: MatchResult[] = matchedRules.map(({ rule, matchedKeywords }) => ({
          matched: true,
          matchedKeywords,
          rule
        }));

        const matchEvent: MessageMatchEvent = {
          message,
          matchResults
        };

        console.log("✅ MatchingProcessor: 找到匹配", {
          messageId: message.id,
          matchCount: matchResults.length,
          rules: matchResults.map(r => r.rule.name)
        });

        // 發送處理器事件
        onProcessorEvent?.({
          type: 'message_matched',
          message,
          matchResults
        });

        return matchEvent;
      }

      console.log("❌ MatchingProcessor: 無匹配結果");
      return null;

    } catch (error) {
      console.error("❌ MatchingProcessor: 處理訊息時發生錯誤", error);
      
      // 發送錯誤事件
      onProcessorEvent?.({
        type: 'match_processed',
        message,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return null;
    }
  }, [rules, onProcessorEvent]);

  // 處理匹配事件
  const handleMatchEvent = useCallback((event: MessageMatchEvent) => {
    console.log("🎯 MatchingProcessor: 處理匹配事件", {
      messageId: event.message.id,
      matchCount: event.matchResults.length
    });

    try {
      // 觸發匹配事件回調
      onMatchEvent?.(event);

      // 發送處理完成事件
      onProcessorEvent?.({
        type: 'match_processed',
        message: event.message,
        matchResults: event.matchResults
      });

    } catch (error) {
      console.error("❌ MatchingProcessor: 處理匹配事件時發生錯誤", error);
      
      onProcessorEvent?.({
        type: 'match_processed',
        message: event.message,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [onMatchEvent, onProcessorEvent]);

  // 統一的處理入口
  const processAndHandle: MessageMatchHandler = useCallback((message) => {
    const matchEvent = processMessage(message);
    if (matchEvent) {
      handleMatchEvent(matchEvent);
    }
  }, [processMessage, handleMatchEvent]);

  return {
    processMessage,
    handleMatchEvent,
    processAndHandle
  };
}