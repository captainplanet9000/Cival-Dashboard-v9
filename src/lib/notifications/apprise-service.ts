'use client'

// Enhanced Notification System using Apprise
// Supports multiple channels: Discord, Telegram, Slack, Email, SMS, etc.

export interface NotificationChannel {
  id: string
  name: string
  type: 'discord' | 'telegram' | 'slack' | 'email' | 'sms' | 'webhook' | 'custom'
  url: string
  enabled: boolean
  priority: 'low' | 'normal' | 'high' | 'emergency'
  filters?: NotificationFilter[]
}

export interface NotificationFilter {
  type: 'trading' | 'risk' | 'goal' | 'farm' | 'agent' | 'system'
  priority: 'low' | 'normal' | 'high' | 'emergency'
  keywords?: string[]
  excludeKeywords?: string[]
}

export interface NotificationMessage {
  title: string
  body: string
  type: 'trading' | 'risk' | 'goal' | 'farm' | 'agent' | 'system'
  priority: 'low' | 'normal' | 'high' | 'emergency'
  data?: any
  timestamp: Date
  channels?: string[] // Specific channels to send to
}

export interface NotificationPreferences {
  globalEnabled: boolean
  channels: NotificationChannel[]
  defaultPriority: 'low' | 'normal' | 'high'
  emergencyOnly: boolean
  quietHours?: {
    enabled: boolean
    start: string // HH:MM format
    end: string   // HH:MM format
    timezone: string
  }
  rateLimiting?: {
    enabled: boolean
    maxPerHour: number
    maxPerDay: number
  }
}

class AppriseNotificationService {
  private preferences: NotificationPreferences
  private messageQueue: NotificationMessage[] = []
  private rateLimitCounters: Map<string, { hour: number; day: number; lastReset: Date }> = new Map()
  private isProcessing = false

  constructor() {
    this.preferences = this.loadPreferences()
    this.startMessageProcessor()
  }

  // Send notification to configured channels
  async sendNotification(message: NotificationMessage): Promise<{
    success: boolean
    results: Array<{ channel: string; success: boolean; error?: string }>
  }> {
    try {
      if (!this.preferences.globalEnabled) {
        return { success: false, results: [{ channel: 'global', success: false, error: 'Notifications disabled' }] }
      }

      // Check quiet hours
      if (this.isQuietHours()) {
        if (message.priority !== 'emergency') {
          return { success: false, results: [{ channel: 'global', success: false, error: 'Quiet hours active' }] }
        }
      }

      // Emergency only mode
      if (this.preferences.emergencyOnly && message.priority !== 'emergency') {
        return { success: false, results: [{ channel: 'global', success: false, error: 'Emergency only mode' }] }
      }

      // Add to queue for processing
      this.messageQueue.push(message)
      
      // Process immediately for high/emergency priority
      if (message.priority === 'high' || message.priority === 'emergency') {
        return await this.processMessage(message)
      }

      return { success: true, results: [{ channel: 'queue', success: true }] }
    } catch (error) {
      console.error('Error sending notification:', error)
      return { success: false, results: [{ channel: 'error', success: false, error: error.message }] }
    }
  }

  // Process individual message through Apprise-like logic
  private async processMessage(message: NotificationMessage): Promise<{
    success: boolean
    results: Array<{ channel: string; success: boolean; error?: string }>
  }> {
    const results: Array<{ channel: string; success: boolean; error?: string }> = []
    let overallSuccess = false

    // Determine which channels to use
    const targetChannels = message.channels
      ? this.preferences.channels.filter(c => message.channels!.includes(c.id))
      : this.preferences.channels.filter(c => this.shouldSendToChannel(c, message))

    for (const channel of targetChannels) {
      try {
        if (!channel.enabled) {
          results.push({ channel: channel.name, success: false, error: 'Channel disabled' })
          continue
        }

        // Check rate limiting
        if (!this.checkRateLimit(channel.id)) {
          results.push({ channel: channel.name, success: false, error: 'Rate limit exceeded' })
          continue
        }

        // Send to specific channel
        const channelResult = await this.sendToChannel(channel, message)
        results.push(channelResult)

        if (channelResult.success) {
          overallSuccess = true
          this.updateRateLimit(channel.id)
        }
      } catch (error) {
        results.push({ channel: channel.name, success: false, error: error.message })
      }
    }

    return { success: overallSuccess, results }
  }

  // Send to specific channel type
  private async sendToChannel(channel: NotificationChannel, message: NotificationMessage): Promise<{
    channel: string
    success: boolean
    error?: string
  }> {
    try {
      switch (channel.type) {
        case 'discord':
          return await this.sendToDiscord(channel, message)
        case 'telegram':
          return await this.sendToTelegram(channel, message)
        case 'slack':
          return await this.sendToSlack(channel, message)
        case 'email':
          return await this.sendToEmail(channel, message)
        case 'webhook':
          return await this.sendToWebhook(channel, message)
        default:
          return { channel: channel.name, success: false, error: 'Unsupported channel type' }
      }
    } catch (error) {
      return { channel: channel.name, success: false, error: error.message }
    }
  }

  // Discord webhook implementation
  private async sendToDiscord(channel: NotificationChannel, message: NotificationMessage): Promise<{
    channel: string
    success: boolean
    error?: string
  }> {
    try {
      const embed = {
        title: message.title,
        description: message.body,
        color: this.getPriorityColor(message.priority),
        timestamp: message.timestamp.toISOString(),
        fields: message.data ? Object.entries(message.data).slice(0, 5).map(([key, value]) => ({
          name: key,
          value: String(value),
          inline: true
        })) : undefined,
        footer: {
          text: `Cival Trading Dashboard • ${message.type.toUpperCase()}`
        }
      }

      const response = await fetch(channel.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [embed],
          username: 'Cival Trading Bot'
        })
      })

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`)
      }

      return { channel: channel.name, success: true }
    } catch (error) {
      return { channel: channel.name, success: false, error: error.message }
    }
  }

  // Telegram bot implementation
  private async sendToTelegram(channel: NotificationChannel, message: NotificationMessage): Promise<{
    channel: string
    success: boolean
    error?: string
  }> {
    try {
      const urlParts = channel.url.match(/telegram:\/\/([^\/]+)\/(.+)/)
      if (!urlParts) {
        throw new Error('Invalid Telegram URL format')
      }

      const [, botToken, chatId] = urlParts
      const telegramText = `🤖 *${message.title}*\n\n${message.body}\n\n_${message.type.toUpperCase()} • ${message.priority.toUpperCase()}_`

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramText,
          parse_mode: 'Markdown'
        })
      })

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`)
      }

      return { channel: channel.name, success: true }
    } catch (error) {
      return { channel: channel.name, success: false, error: error.message }
    }
  }

  // Slack webhook implementation
  private async sendToSlack(channel: NotificationChannel, message: NotificationMessage): Promise<{
    channel: string
    success: boolean
    error?: string
  }> {
    try {
      const slackMessage = {
        text: message.title,
        attachments: [{
          color: this.getPriorityColorHex(message.priority),
          fields: [
            { title: 'Message', value: message.body, short: false },
            { title: 'Type', value: message.type.toUpperCase(), short: true },
            { title: 'Priority', value: message.priority.toUpperCase(), short: true }
          ],
          ts: Math.floor(message.timestamp.getTime() / 1000)
        }]
      }

      const response = await fetch(channel.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`)
      }

      return { channel: channel.name, success: true }
    } catch (error) {
      return { channel: channel.name, success: false, error: error.message }
    }
  }

  // Email implementation (requires email service)
  private async sendToEmail(channel: NotificationChannel, message: NotificationMessage): Promise<{
    channel: string
    success: boolean
    error?: string
  }> {
    try {
      // This would integrate with your email service
      // For now, we'll simulate the email sending
      console.log(`Sending email to ${channel.url}:`, {
        subject: `[${message.priority.toUpperCase()}] ${message.title}`,
        body: message.body,
        type: message.type
      })

      return { channel: channel.name, success: true }
    } catch (error) {
      return { channel: channel.name, success: false, error: error.message }
    }
  }

  // Generic webhook implementation
  private async sendToWebhook(channel: NotificationChannel, message: NotificationMessage): Promise<{
    channel: string
    success: boolean
    error?: string
  }> {
    try {
      const payload = {
        title: message.title,
        body: message.body,
        type: message.type,
        priority: message.priority,
        timestamp: message.timestamp.toISOString(),
        data: message.data
      }

      const response = await fetch(channel.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`)
      }

      return { channel: channel.name, success: true }
    } catch (error) {
      return { channel: channel.name, success: false, error: error.message }
    }
  }

  // Utility methods
  private shouldSendToChannel(channel: NotificationChannel, message: NotificationMessage): boolean {
    if (!channel.filters || channel.filters.length === 0) return true

    return channel.filters.some(filter => {
      // Type filter
      if (filter.type !== message.type) return false

      // Priority filter
      const priorityOrder = ['low', 'normal', 'high', 'emergency']
      const filterPriorityIndex = priorityOrder.indexOf(filter.priority)
      const messagePriorityIndex = priorityOrder.indexOf(message.priority)
      if (messagePriorityIndex < filterPriorityIndex) return false

      // Keyword filters
      if (filter.keywords && filter.keywords.length > 0) {
        const content = `${message.title} ${message.body}`.toLowerCase()
        const hasKeyword = filter.keywords.some(keyword => content.includes(keyword.toLowerCase()))
        if (!hasKeyword) return false
      }

      // Exclude keyword filters
      if (filter.excludeKeywords && filter.excludeKeywords.length > 0) {
        const content = `${message.title} ${message.body}`.toLowerCase()
        const hasExcludeKeyword = filter.excludeKeywords.some(keyword => content.includes(keyword.toLowerCase()))
        if (hasExcludeKeyword) return false
      }

      return true
    })
  }

  private isQuietHours(): boolean {
    if (!this.preferences.quietHours?.enabled) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const start = this.preferences.quietHours.start
    const end = this.preferences.quietHours.end

    // Handle overnight quiet hours (e.g., 22:00 to 06:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end
    }
    
    return currentTime >= start && currentTime <= end
  }

  private checkRateLimit(channelId: string): boolean {
    if (!this.preferences.rateLimiting?.enabled) return true

    const now = new Date()
    const counter = this.rateLimitCounters.get(channelId) || { hour: 0, day: 0, lastReset: now }

    // Reset counters if needed
    const hoursSinceReset = (now.getTime() - counter.lastReset.getTime()) / (1000 * 60 * 60)
    if (hoursSinceReset >= 24) {
      counter.hour = 0
      counter.day = 0
      counter.lastReset = now
    } else if (hoursSinceReset >= 1) {
      counter.hour = 0
    }

    // Check limits
    const { maxPerHour, maxPerDay } = this.preferences.rateLimiting
    return counter.hour < maxPerHour && counter.day < maxPerDay
  }

  private updateRateLimit(channelId: string): void {
    if (!this.preferences.rateLimiting?.enabled) return

    const counter = this.rateLimitCounters.get(channelId) || { hour: 0, day: 0, lastReset: new Date() }
    counter.hour++
    counter.day++
    this.rateLimitCounters.set(channelId, counter)
  }

  private getPriorityColor(priority: string): number {
    switch (priority) {
      case 'emergency': return 16711680 // Red
      case 'high': return 16753920     // Orange  
      case 'normal': return 3447003    // Blue
      case 'low': return 8947848       // Grey
      default: return 3447003
    }
  }

  private getPriorityColorHex(priority: string): string {
    switch (priority) {
      case 'emergency': return '#ff0000'
      case 'high': return '#ff8c00'
      case 'normal': return '#3498db'
      case 'low': return '#95a5a6'
      default: return '#3498db'
    }
  }

  // Message queue processor
  private startMessageProcessor(): void {
    setInterval(async () => {
      if (this.isProcessing || this.messageQueue.length === 0) return

      this.isProcessing = true
      try {
        const message = this.messageQueue.shift()
        if (message) {
          await this.processMessage(message)
        }
      } catch (error) {
        console.error('Error processing message queue:', error)
      } finally {
        this.isProcessing = false
      }
    }, 1000) // Process every second
  }

  // Configuration management
  private loadPreferences(): NotificationPreferences {
    try {
      const saved = localStorage.getItem('notification-preferences')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Error loading notification preferences:', error)
    }

    // Default preferences
    return {
      globalEnabled: true,
      channels: [],
      defaultPriority: 'normal',
      emergencyOnly: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '06:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      rateLimiting: {
        enabled: true,
        maxPerHour: 10,
        maxPerDay: 50
      }
    }
  }

  savePreferences(preferences: NotificationPreferences): void {
    try {
      this.preferences = preferences
      localStorage.setItem('notification-preferences', JSON.stringify(preferences))
    } catch (error) {
      console.error('Error saving notification preferences:', error)
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }

  // Quick notification methods for common use cases
  async notifyTrade(symbol: string, action: string, quantity: number, price: number, success: boolean): Promise<void> {
    const message: NotificationMessage = {
      title: `Trade ${success ? 'Executed' : 'Failed'}: ${action} ${symbol}`,
      body: `${action.toUpperCase()} ${quantity} ${symbol} at $${price.toFixed(2)}${success ? '' : ' - FAILED'}`,
      type: 'trading',
      priority: success ? 'normal' : 'high',
      timestamp: new Date(),
      data: { symbol, action, quantity, price, success }
    }

    await this.sendNotification(message)
  }

  async notifyRiskAlert(message: string, riskLevel: 'low' | 'medium' | 'high'): Promise<void> {
    const notification: NotificationMessage = {
      title: `Risk Alert: ${riskLevel.toUpperCase()}`,
      body: message,
      type: 'risk',
      priority: riskLevel === 'high' ? 'emergency' : 'high',
      timestamp: new Date()
    }

    await this.sendNotification(notification)
  }

  async notifyGoalProgress(goalName: string, progress: number, target: number): Promise<void> {
    const percentage = (progress / target * 100).toFixed(1)
    const message: NotificationMessage = {
      title: `Goal Progress: ${goalName}`,
      body: `${percentage}% complete (${progress}/${target})`,
      type: 'goal',
      priority: 'normal',
      timestamp: new Date(),
      data: { goalName, progress, target, percentage }
    }

    await this.sendNotification(message)
  }

  async notifyAgentDecision(agentName: string, decision: string, confidence: number): Promise<void> {
    const message: NotificationMessage = {
      title: `Agent Decision: ${agentName}`,
      body: `Recommendation: ${decision} (${confidence}% confidence)`,
      type: 'agent',
      priority: confidence > 80 ? 'high' : 'normal',
      timestamp: new Date(),
      data: { agentName, decision, confidence }
    }

    await this.sendNotification(message)
  }
}

// Export singleton instance
export const appriseNotificationService = new AppriseNotificationService()

// React hook for notifications
export function useNotifications() {
  const sendNotification = (message: NotificationMessage) => {
    return appriseNotificationService.sendNotification(message)
  }

  const getPreferences = () => {
    return appriseNotificationService.getPreferences()
  }

  const savePreferences = (preferences: NotificationPreferences) => {
    appriseNotificationService.savePreferences(preferences)
  }

  const notifyTrade = (symbol: string, action: string, quantity: number, price: number, success: boolean) => {
    return appriseNotificationService.notifyTrade(symbol, action, quantity, price, success)
  }

  const notifyRiskAlert = (message: string, riskLevel: 'low' | 'medium' | 'high') => {
    return appriseNotificationService.notifyRiskAlert(message, riskLevel)
  }

  const notifyGoalProgress = (goalName: string, progress: number, target: number) => {
    return appriseNotificationService.notifyGoalProgress(goalName, progress, target)
  }

  const notifyAgentDecision = (agentName: string, decision: string, confidence: number) => {
    return appriseNotificationService.notifyAgentDecision(agentName, decision, confidence)
  }

  return {
    sendNotification,
    getPreferences,
    savePreferences,
    notifyTrade,
    notifyRiskAlert,
    notifyGoalProgress,
    notifyAgentDecision
  }
}