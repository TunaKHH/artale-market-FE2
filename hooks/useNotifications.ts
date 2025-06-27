"use client"

import { useState, useEffect, useCallback } from 'react'

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  // 檢查瀏覽器支援
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window)
      if ('Notification' in window) {
        setPermission(Notification.permission)
      }
    }
  }, [])

  // 請求通知權限
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('此瀏覽器不支援通知功能')
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('請求通知權限失敗:', error)
      return 'denied'
    }
  }, [isSupported])

  // 發送通知
  const sendNotification = useCallback(async (options: NotificationOptions): Promise<Notification | null> => {
    if (!isSupported) {
      console.warn('此瀏覽器不支援通知功能')
      return null
    }

    if (permission === 'denied') {
      console.warn('通知權限被拒絕')
      return null
    }

    if (permission === 'default') {
      const newPermission = await requestPermission()
      if (newPermission !== 'granted') {
        console.warn('用戶拒絕通知權限')
        return null
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      })

      // 自動關閉通知（5秒後）
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    } catch (error) {
      console.error('發送通知失敗:', error)
      return null
    }
  }, [isSupported, permission, requestPermission])

  // 發送自動收藏通知
  const sendAutoFavoriteNotification = useCallback(async (
    messageContent: string,
    matchedKeywords: string[],
    ruleName: string
  ) => {
    return sendNotification({
      title: '🔖 自動收藏通知',
      body: `匹配關鍵字「${matchedKeywords.join('、')}」\n${messageContent.slice(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
      tag: `auto-favorite-${Date.now()}`, // 使用唯一的 tag 避免通知被替換
      requireInteraction: false,
      silent: false
    })
  }, [sendNotification])

  // 檢查文件可見性（避免在用戶正在瀏覽時發送通知）
  const shouldSendNotification = useCallback(() => {
    if (typeof document === 'undefined') return false
    return document.hidden || document.visibilityState === 'hidden'
  }, [])

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    sendAutoFavoriteNotification,
    shouldSendNotification,
    canSendNotifications: permission === 'granted' && isSupported
  }
}