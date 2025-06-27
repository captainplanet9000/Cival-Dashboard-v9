/**
 * LangChain Integration Index
 * Provides lazy-loaded access to all LangChain services
 * Prevents circular dependencies through service locator pattern
 */

// Service registry for lazy initialization
const services = new Map<string, any>()

// Lazy service getters - prevents circular dependencies
export async function getLangChainService() {
  if (!services.has('langchain')) {
    const { LangChainService } = await import('./services/LangChainService')
    services.set('langchain', new LangChainService())
  }
  return services.get('langchain')
}

export async function getLangGraphOrchestrator() {
  if (!services.has('langgraph')) {
    const { LangGraphOrchestrator } = await import('./orchestrators/LangGraphOrchestrator')
    services.set('langgraph', new LangGraphOrchestrator())
  }
  return services.get('langgraph')
}

export async function getAgentMemorySystem() {
  if (!services.has('memory')) {
    const { AgentMemorySystem } = await import('./memory/AgentMemorySystem')
    services.set('memory', new AgentMemorySystem())
  }
  return services.get('memory')
}

export async function getAGUIHandlers() {
  if (!services.has('agui')) {
    const { AGUIHandlers } = await import('./handlers/AGUIHandlers')
    services.set('agui', new AGUIHandlers())
  }
  return services.get('agui')
}

export async function getChainlinkPriceFeedService() {
  if (!services.has('chainlink')) {
    const { ChainlinkPriceFeedService } = await import('./integrations/ChainlinkPriceFeedService')
    services.set('chainlink', new ChainlinkPriceFeedService())
  }
  return services.get('chainlink')
}

export async function getTestnetDeFiService() {
  if (!services.has('testnet')) {
    const { TestnetDeFiService } = await import('./integrations/TestnetDeFiService')
    services.set('testnet', new TestnetDeFiService())
  }
  return services.get('testnet')
}

// Type exports
export type * from './types'

// Utility functions
export function clearServiceCache() {
  services.clear()
}

export function getServiceRegistry() {
  return new Map(services)
}