'use client'

/**
 * Supabase Queue Service
 * Provides reliable message queuing for AI agents, trading operations, and system events
 * Built on top of Supabase's pgmq extension for guaranteed delivery and exactly-once processing
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

// Queue message types
export interface QueueMessage<T = any> {
  id: string
  payload: T
  queue_name: string
  enqueued_at: Date
  vt: Date  // visibility timeout
  read_ct: number  // read count
}

export interface AgentMessage {
  type: 'decision' | 'thought' | 'memory_update' | 'coordination'
  agentId: string
  data: any
  priority: number
  correlationId?: string
}

export interface TradingMessage {
  type: 'order' | 'signal' | 'execution' | 'settlement'
  symbol: string
  data: any
  priority: number
  timestamp: Date
}

export interface RiskMessage {
  type: 'alert' | 'violation' | 'mitigation' | 'stress_test'
  level: 'low' | 'medium' | 'high' | 'critical'
  data: any
  timestamp: Date
}

export interface MemoryMessage {
  type: 'connection' | 'thought' | 'decision' | 'learning'
  agentId: string
  data: any
  memoryId?: string
  timestamp: Date
}

export interface DashboardMessage {
  type: 'portfolio_update' | 'market_data' | 'agent_status' | 'system_event'
  component: string
  data: any
  timestamp: Date
}

// Queue configuration
export interface QueueConfig {
  name: string
  visibility_timeout_seconds: number
  max_retries: number
  dead_letter_queue?: string
}

// Default queue configurations
const QUEUE_CONFIGS: Record<string, QueueConfig> = {
  'agent_messages': {
    name: 'agent_messages',
    visibility_timeout_seconds: 30,
    max_retries: 3,
    dead_letter_queue: 'agent_messages_dlq'
  },
  'trading_orders': {
    name: 'trading_orders',
    visibility_timeout_seconds: 60,
    max_retries: 5,
    dead_letter_queue: 'trading_orders_dlq'
  },
  'risk_alerts': {
    name: 'risk_alerts',
    visibility_timeout_seconds: 10,
    max_retries: 3,
    dead_letter_queue: 'risk_alerts_dlq'
  },
  'memory_updates': {
    name: 'memory_updates',
    visibility_timeout_seconds: 30,
    max_retries: 3,
    dead_letter_queue: 'memory_updates_dlq'
  },
  'dashboard_updates': {
    name: 'dashboard_updates',
    visibility_timeout_seconds: 15,
    max_retries: 2,
    dead_letter_queue: 'dashboard_updates_dlq'
  },
  'market_data': {
    name: 'market_data',
    visibility_timeout_seconds: 5,
    max_retries: 1,
    dead_letter_queue: 'market_data_dlq'
  }
}

export class SupabaseQueueService {
  private supabase: SupabaseClient
  private initialized = false
  private messageHandlers = new Map<string, Array<(message: QueueMessage) => Promise<void>>>()
  private pollingIntervals = new Map<string, NodeJS.Timeout>()

  constructor() {
    // Use shared Supabase client to avoid multiple instances
    this.supabase = supabase
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Create all queues
      for (const config of Object.values(QUEUE_CONFIGS)) {
        await this.createQueue(config)
      }

      this.initialized = true
      console.log('✅ Supabase Queue Service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Supabase Queue Service:', error)
      throw error
    }
  }

  private async createQueue(config: QueueConfig): Promise<void> {
    try {
      // Create main queue
      const { error: mainError } = await this.supabase.rpc('pgmq_create', {
        queue_name: config.name
      })

      if (mainError && !mainError.message.includes('already exists')) {
        throw mainError
      }

      // Create dead letter queue if specified
      if (config.dead_letter_queue) {
        const { error: dlqError } = await this.supabase.rpc('pgmq_create', {
          queue_name: config.dead_letter_queue
        })

        if (dlqError && !dlqError.message.includes('already exists')) {
          throw dlqError
        }
      }

      console.log(`✅ Queue ${config.name} ready`)
    } catch (error) {
      console.error(`❌ Failed to create queue ${config.name}:`, error)
      throw error
    }
  }

  // Agent messaging
  async sendAgentMessage(message: AgentMessage): Promise<void> {
    await this.enqueue('agent_messages', message)
  }

  async receiveAgentMessages(handler: (message: QueueMessage<AgentMessage>) => Promise<void>): Promise<void> {
    await this.subscribe('agent_messages', handler)
  }

  // Trading operations
  async sendTradingOrder(order: TradingMessage): Promise<void> {
    await this.enqueue('trading_orders', order)
  }

  async receiveTradingOrders(handler: (message: QueueMessage<TradingMessage>) => Promise<void>): Promise<void> {
    await this.subscribe('trading_orders', handler)
  }

  // Risk management
  async sendRiskAlert(alert: RiskMessage): Promise<void> {
    await this.enqueue('risk_alerts', alert)
  }

  async receiveRiskAlerts(handler: (message: QueueMessage<RiskMessage>) => Promise<void>): Promise<void> {
    await this.subscribe('risk_alerts', handler)
  }

  // Memory system
  async sendMemoryUpdate(update: MemoryMessage): Promise<void> {
    await this.enqueue('memory_updates', update)
  }

  async receiveMemoryUpdates(handler: (message: QueueMessage<MemoryMessage>) => Promise<void>): Promise<void> {
    await this.subscribe('memory_updates', handler)
  }

  // Dashboard updates
  async sendDashboardUpdate(update: DashboardMessage): Promise<void> {
    await this.enqueue('dashboard_updates', update)
  }

  async receiveDashboardUpdates(handler: (message: QueueMessage<DashboardMessage>) => Promise<void>): Promise<void> {
    await this.subscribe('dashboard_updates', handler)
  }

  // Market data
  async sendMarketData(data: any): Promise<void> {
    await this.enqueue('market_data', {
      type: 'price_update',
      data,
      timestamp: new Date()
    })
  }

  async receiveMarketData(handler: (message: QueueMessage) => Promise<void>): Promise<void> {
    await this.subscribe('market_data', handler)
  }

  // Core queue operations
  private async enqueue(queueName: string, payload: any): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      const { error } = await this.supabase.rpc('pgmq_send', {
        queue_name: queueName,
        msg: JSON.stringify(payload)
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error(`❌ Failed to enqueue message to ${queueName}:`, error)
      throw error
    }
  }

  private async dequeue(queueName: string, visibilityTimeoutSeconds: number = 30): Promise<QueueMessage | null> {
    try {
      const { data, error } = await this.supabase.rpc('pgmq_read', {
        queue_name: queueName,
        vt: visibilityTimeoutSeconds
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        return null
      }

      const message = data[0]
      return {
        id: message.msg_id,
        payload: JSON.parse(message.message),
        queue_name: queueName,
        enqueued_at: new Date(message.enqueued_at),
        vt: new Date(message.vt),
        read_ct: message.read_ct
      }
    } catch (error) {
      console.error(`❌ Failed to dequeue message from ${queueName}:`, error)
      return null
    }
  }

  private async deleteMessage(queueName: string, messageId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('pgmq_delete', {
        queue_name: queueName,
        msg_id: parseInt(messageId)
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error(`❌ Failed to delete message ${messageId} from ${queueName}:`, error)
      throw error
    }
  }

  private async subscribe(queueName: string, handler: (message: QueueMessage) => Promise<void>): Promise<void> {
    if (!this.messageHandlers.has(queueName)) {
      this.messageHandlers.set(queueName, [])
    }
    
    this.messageHandlers.get(queueName)!.push(handler)

    // Start polling if not already started for this queue
    if (!this.pollingIntervals.has(queueName)) {
      this.startPolling(queueName)
    }
  }

  private startPolling(queueName: string): void {
    const config = QUEUE_CONFIGS[queueName]
    if (!config) {
      console.error(`❌ No configuration found for queue ${queueName}`)
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const message = await this.dequeue(queueName, config.visibility_timeout_seconds)
        if (message) {
          const handlers = this.messageHandlers.get(queueName) || []
          
          for (const handler of handlers) {
            try {
              await handler(message)
              // Delete message after successful processing
              await this.deleteMessage(queueName, message.id)
            } catch (error) {
              console.error(`❌ Message handler failed for queue ${queueName}:`, error)
              
              // Check if message should be moved to DLQ
              if (message.read_ct >= config.max_retries && config.dead_letter_queue) {
                await this.moveToDeadLetterQueue(queueName, message, config.dead_letter_queue)
                await this.deleteMessage(queueName, message.id)
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Polling error for queue ${queueName}:`, error)
      }
    }, 1000) // Poll every second

    this.pollingIntervals.set(queueName, pollInterval)
  }

  private async moveToDeadLetterQueue(originalQueue: string, message: QueueMessage, dlqName: string): Promise<void> {
    try {
      const dlqPayload = {
        original_queue: originalQueue,
        original_message: message.payload,
        failed_at: new Date(),
        read_count: message.read_ct
      }

      await this.enqueue(dlqName, dlqPayload)
      console.warn(`⚠️ Moved message ${message.id} from ${originalQueue} to ${dlqName}`)
    } catch (error) {
      console.error(`❌ Failed to move message to DLQ:`, error)
    }
  }

  // Queue monitoring
  async getQueueStats(queueName: string): Promise<any> {
    try {
      const { data: metrics, error } = await this.supabase.rpc('pgmq_metrics', {
        queue_name: queueName
      })

      if (error) {
        throw error
      }

      return metrics?.[0] || null
    } catch (error) {
      console.error(`❌ Failed to get queue stats for ${queueName}:`, error)
      return null
    }
  }

  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {}
    
    for (const queueName of Object.keys(QUEUE_CONFIGS)) {
      stats[queueName] = await this.getQueueStats(queueName)
    }

    return stats
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Stop all polling intervals
    for (const [queueName, interval] of this.pollingIntervals) {
      clearInterval(interval)
    }
    
    this.pollingIntervals.clear()
    this.messageHandlers.clear()
    
    console.log('✅ Supabase Queue Service cleaned up')
  }
}

// Singleton instance
let queueService: SupabaseQueueService | null = null

export function getSupabaseQueueService(): SupabaseQueueService {
  if (!queueService) {
    queueService = new SupabaseQueueService()
  }
  return queueService
}

export default SupabaseQueueService