/**
 * AG-UI Integration Index
 * Central exports for AG-UI components and LangChain integration
 */

// Core AG-UI
export { AGUIClient, createAGUIClient, getAGUIClient, disconnectAGUI } from './client'

// Types
export type * from './types'

// Service registry for lazy initialization
const aguiServices = new Map<string, any>()

// Lazy-loaded LangChain AG-UI Handlers
export async function getAGUIHandlers() {
  if (!aguiServices.has('handlers')) {
    const { AGUIHandlers } = await import('../langchain/handlers/AGUIHandlers')
    aguiServices.set('handlers', new AGUIHandlers())
  }
  return aguiServices.get('handlers')
}

// Lazy-loaded LangChain service getters (re-exported for convenience)
export async function getLangChainService() {
  const { getLangChainService } = await import('../langchain/index')
  return getLangChainService()
}

export async function getLangGraphOrchestrator() {
  const { getLangGraphOrchestrator } = await import('../langchain/index')
  return getLangGraphOrchestrator()
}

export async function getAgentMemorySystem() {
  const { getAgentMemorySystem } = await import('../langchain/index')
  return getAgentMemorySystem()
}

// LangChain types for AG-UI integration
export type {
  AGUIMessage,
  AGUIHandlerConfig,
  AgentDecision,
  TradingSignal,
  MarketAnalysis,
  LangChainConfig,
  AgentConfig,
  ConversationState,
  WorkflowState,
  TradingWorkflow,
  MemoryItem,
  MemoryQuery,
  ServiceStatus,
  LangChainMetrics,
  LangChainError
} from '../langchain/types'

// Utility functions
export function clearAGUIServiceCache() {
  aguiServices.clear()
}

export function getAGUIServiceRegistry() {
  return new Map(aguiServices)
}

// AG-UI Protocol Integration Helpers
export async function processAGUIMessage(message: any) {
  const handlers = await getAGUIHandlers()
  return handlers.processMessage(message)
}

export async function registerAGUIHandler(messageType: string, handler: (message: AGUIMessage) => Promise<AGUIMessage | null>) {
  const handlers = await getAGUIHandlers()
  return handlers.registerHandler(messageType, handler)
}

export async function getAGUIHandlerStats() {
  const handlers = await getAGUIHandlers()
  return handlers.getHandlerStats()
}