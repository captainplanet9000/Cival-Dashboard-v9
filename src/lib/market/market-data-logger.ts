/**
 * Market Data Logger
 * Centralized logging system for market data operations
 */

export interface MarketDataLogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  provider: string
  symbol?: string
  message: string
  details?: any
  requestUrl?: string
  responseStatus?: number
  responseTime?: number
}

class MarketDataLogger {
  private static instance: MarketDataLogger
  private logs: MarketDataLogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 entries

  private constructor() {}

  public static getInstance(): MarketDataLogger {
    if (!MarketDataLogger.instance) {
      MarketDataLogger.instance = new MarketDataLogger()
    }
    return MarketDataLogger.instance
  }

  public log(entry: Omit<MarketDataLogEntry, 'timestamp'>): void {
    const logEntry: MarketDataLogEntry = {
      ...entry,
      timestamp: new Date()
    }

    this.logs.push(logEntry)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const logMessage = `[${entry.level.toUpperCase()}] ${entry.provider}: ${entry.message}`
      
      switch (entry.level) {
        case 'error':
          console.error(logMessage, entry.details)
          break
        case 'warn':
          console.warn(logMessage, entry.details)
          break
        default:
          console.log(logMessage, entry.details)
      }
    }
  }

  public info(provider: string, message: string, details?: any): void {
    this.log({ level: 'info', provider, message, details })
  }

  public warn(provider: string, message: string, details?: any): void {
    this.log({ level: 'warn', provider, message, details })
  }

  public error(provider: string, message: string, details?: any): void {
    this.log({ level: 'error', provider, message, details })
  }

  public logApiRequest(
    provider: string,
    url: string,
    responseStatus: number,
    responseTime: number,
    symbol?: string
  ): void {
    const level = responseStatus >= 400 ? 'error' : responseStatus >= 300 ? 'warn' : 'info'
    const message = `API request ${responseStatus >= 400 ? 'failed' : 'completed'} (${responseTime}ms)`
    
    this.log({
      level,
      provider,
      symbol,
      message,
      requestUrl: url,
      responseStatus,
      responseTime
    })
  }

  public logRateLimit(provider: string, details?: any): void {
    this.warn(provider, 'Rate limit encountered', {
      ...details,
      suggestion: 'Consider implementing exponential backoff or using fallback providers'
    })
  }

  public logFallback(provider: string, reason: string): void {
    this.warn(provider, `Falling back to next provider: ${reason}`)
  }

  public logSuccess(provider: string, symbolCount: number, responseTime?: number): void {
    this.info(provider, `Successfully fetched ${symbolCount} symbols${responseTime ? ` in ${responseTime}ms` : ''}`)
  }

  public getLogs(filters?: {
    level?: MarketDataLogEntry['level']
    provider?: string
    since?: Date
    limit?: number
  }): MarketDataLogEntry[] {
    let filteredLogs = [...this.logs]

    if (filters?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level)
    }

    if (filters?.provider) {
      filteredLogs = filteredLogs.filter(log => log.provider === filters.provider)
    }

    if (filters?.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since!)
    }

    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit)
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  public getStats(): {
    totalLogs: number
    errorCount: number
    warnCount: number
    infoCount: number
    providerStats: Record<string, { total: number; errors: number; warnings: number }>
  } {
    const stats = {
      totalLogs: this.logs.length,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      providerStats: {} as Record<string, { total: number; errors: number; warnings: number }>
    }

    this.logs.forEach(log => {
      // Count by level
      switch (log.level) {
        case 'error':
          stats.errorCount++
          break
        case 'warn':
          stats.warnCount++
          break
        case 'info':
          stats.infoCount++
          break
      }

      // Count by provider
      if (!stats.providerStats[log.provider]) {
        stats.providerStats[log.provider] = { total: 0, errors: 0, warnings: 0 }
      }
      
      stats.providerStats[log.provider].total++
      if (log.level === 'error') {
        stats.providerStats[log.provider].errors++
      } else if (log.level === 'warn') {
        stats.providerStats[log.provider].warnings++
      }
    })

    return stats
  }

  public clearLogs(): void {
    this.logs = []
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Export singleton instance
export const marketDataLogger = MarketDataLogger.getInstance()
export default marketDataLogger