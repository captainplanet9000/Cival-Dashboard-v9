/**
 * AG-UI Protocol v2 - Mock Implementation
 * Basic implementation for build compatibility
 */

export interface TradingEvents {
  'portfolio.value_updated': { total_value: number; change_24h: number; change_percentage: number }
  'trade.order_placed': { symbol: string; side: string; order_id: string; quantity?: number; price?: number }
  'trade.order_filled': { symbol: string; side: string; quantity: number; fill_price: number; order_id: string; fees?: number; exchange: string }
  'trade.order_cancelled': { order_id: string; reason?: string }
  'trade.signal_generated': { symbol: string; action: string; confidence: number; timestamp?: number; price?: number; strategy?: string }
  'trade.position_update': { position_id: string; symbol: string; current_value: number; unrealized_pnl: number }
  'trade.executed': any
  'market_data.price_update': { symbol: string; price: number; timestamp?: number; volume?: number }
}

export interface AgentEvents {
  'agent.started': { agent_id: string; timestamp?: number }
  'agent.stopped': { agent_id: string; reason: string; timestamp?: number }
  'agent.decision_made': { agent_id: string; decision: string }
  'agent.communication': { from_agent: string; to_agent: string; message: string }
  'agent.consensus_reached': { decision_id: string; participants: string[]; agreement_level: number; decision?: string; reasoning?: string }
  'agent.performance_update': { agent_id: string; metrics: any }
  'conversation.create': { topic: string; participants: string[]; context: any; timestamp?: number }
  'conversation.send_message': { conversation_id: string; sender_id: string; content: string; timestamp?: number }
}

export interface WalletEvents {
  'portfolio.risk_alert': { message: string; value?: number }
  'portfolio.margin_warning': { utilization: number; threshold: number }
  'system.notification': { type: string; message: string; level: string; timestamp?: number }
  'connection.established': Record<string, never>
  'connection.lost': Record<string, never>
}

type EventName = keyof (TradingEvents & AgentEvents & WalletEvents)
type EventData<T extends EventName> = (TradingEvents & AgentEvents & WalletEvents)[T]

export interface EventSubscription {
  unsubscribe: () => void
}

export function subscribe<T extends EventName>(
  eventName: T, 
  callback: (event: { data: EventData<T> }) => void
): EventSubscription {
  // Mock implementation
  return {
    unsubscribe: () => {}
  }
}

export function emit<T extends EventName>(eventName: T, data: EventData<T>): void {
  // Mock implementation
}

export interface AGUIEventBus {
  initialize: () => Promise<void>
}

export function getAGUIEventBus(): AGUIEventBus {
  return {
    initialize: async () => {
      // Mock implementation
    }
  }
}