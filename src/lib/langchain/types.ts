/**
 * LangChain Integration Types
 * Comprehensive type definitions for all LangChain services
 */

import { BaseMessage } from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'

// Core LangChain Types
export interface LangChainConfig {
  modelName: string
  temperature: number
  maxTokens: number
  apiKey?: string
  baseURL?: string
}

export interface AgentConfig {
  id: string
  name: string
  type: 'trading' | 'analysis' | 'risk' | 'coordination'
  model: BaseChatModel
  systemPrompt: string
  tools: string[]
  memory: boolean
  maxHistory: number
}

export interface AgentDecision {
  id: string
  agentId: string
  timestamp: Date
  action: 'buy' | 'sell' | 'hold' | 'analyze'
  reasoning: string
  confidence: number
  data: any
  metadata: {
    model: string
    tokenUsage: number
    processingTime: number
  }
}

export interface ConversationState {
  id: string
  agentId: string
  messages: BaseMessage[]
  context: Record<string, any>
  lastUpdated: Date
}

// LangGraph Types
export interface WorkflowNode {
  id: string
  name: string
  type: 'agent' | 'tool' | 'condition' | 'parallel'
  config: any
  edges: string[]
}

export interface WorkflowState {
  id: string
  currentNode: string
  data: Record<string, any>
  history: WorkflowNode[]
  status: 'running' | 'completed' | 'failed' | 'paused'
}

export interface TradingWorkflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  triggers: string[]
  schedule?: {
    interval: number
    unit: 'seconds' | 'minutes' | 'hours'
  }
}

// Memory System Types
export interface MemoryItem {
  id: string
  agentId: string
  type: 'conversation' | 'decision' | 'market_data' | 'performance'
  content: any
  importance: number
  timestamp: Date
  expiresAt?: Date
}

export interface MemoryQuery {
  agentId?: string
  type?: string
  timeRange?: {
    start: Date
    end: Date
  }
  importance?: {
    min: number
    max: number
  }
  limit?: number
}

// Trading Integration Types
export interface TradingSignal {
  id: string
  symbol: string
  action: 'buy' | 'sell'
  price: number
  quantity: number
  confidence: number
  reasoning: string
  timestamp: Date
  agentId: string
}

export interface MarketAnalysis {
  symbol: string
  trend: 'bullish' | 'bearish' | 'neutral'
  strength: number
  indicators: {
    name: string
    value: number
    signal: 'buy' | 'sell' | 'neutral'
  }[]
  priceTarget?: number
  stopLoss?: number
  timeframe: string
  timestamp: Date
}

// Service Status Types
export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  lastCheck: Date
  responseTime: number
  errorCount: number
  version: string
}

export interface LangChainMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  tokensUsed: number
  costEstimate: number
  lastReset: Date
}

// Error Types
export interface LangChainError {
  code: string
  message: string
  service: string
  timestamp: Date
  context?: any
  stack?: string
}

// AG-UI Integration Types
export interface AGUIMessage {
  id: string
  type: 'request' | 'response' | 'event' | 'error'
  agentId?: string
  data: any
  timestamp: Date
}

export interface AGUIHandlerConfig {
  handlers: string[]
  enableLogging: boolean
  retryAttempts: number
  timeout: number
}

// Chainlink Integration Types
export interface PriceFeedData {
  symbol: string
  price: number
  timestamp: Date
  decimals: number
  source: 'chainlink' | 'api' | 'cache'
  confidence: number
}

export interface ChainlinkConfig {
  network: 'mainnet' | 'testnet'
  providerUrl: string
  contractAddresses: Record<string, string>
  updateInterval: number
}

// DeFi Integration Types
export interface DeFiPosition {
  protocol: string
  token: string
  amount: number
  value: number
  apy: number
  risk: 'low' | 'medium' | 'high'
  timestamp: Date
}

export interface TestnetConfig {
  networks: string[]
  testTokens: Record<string, string>
  mockMode: boolean
  simulationSpeed: number
}