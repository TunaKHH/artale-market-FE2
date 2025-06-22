// 智能日誌管理工具
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogOptions {
  level: LogLevel
  category?: string
  data?: Record<string, unknown>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isVerbose = process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true'

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    if (this.isVerbose) return true

    // 生產環境只記錄 warn 和 error
    return level === 'warn' || level === 'error'
  }

  private formatMessage(message: string, options?: LogOptions): string {
    const timestamp = new Date().toISOString()
    const category = options?.category ? `[${options.category}]` : ''
    return `${timestamp} ${category} ${message}`
  }

  debug(message: string, data?: Record<string, unknown>) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage(`🔍 ${message}`, { level: 'debug', data }), data)
    }
  }

  info(message: string, data?: Record<string, unknown>) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(`ℹ️ ${message}`, { level: 'info', data }), data)
    }
  }

  warn(message: string, data?: Record<string, unknown>) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(`⚠️ ${message}`, { level: 'warn', data }), data)
    }
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(`❌ ${message}`, { level: 'error', data }), error, data)
    }
  }

  // API 專用日誌
  api(message: string, data?: Record<string, unknown>) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage(`📡 [API] ${message}`, { level: 'info', category: 'API', data }), data)
    }
  }

  // 故障轉移專用日誌
  failover(message: string, data?: Record<string, unknown>) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage(`🔄 [故障轉移] ${message}`, { level: 'info', category: 'FAILOVER', data }), data)
    }
  }

  // 測試模式專用日誌
  test(message: string, data?: Record<string, unknown>) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage(`🧪 [測試模式] ${message}`, { level: 'debug', category: 'TEST', data }), data)
    }
  }
}

export const logger = new Logger()

// 向後相容的快捷方法
export const debugLog = logger.debug.bind(logger)
export const infoLog = logger.info.bind(logger)
export const warnLog = logger.warn.bind(logger)
export const errorLog = logger.error.bind(logger)
export const apiLog = logger.api.bind(logger)
export const failoverLog = logger.failover.bind(logger)
export const testLog = logger.test.bind(logger)