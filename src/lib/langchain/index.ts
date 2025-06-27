/**
 * LangChain Integration Index
 * Provides lazy-loaded access to all LangChain services
 * Prevents circular dependencies through service locator pattern
 */

// NO STATIC IMPORTS to prevent circular dependencies

// Lazy service getters - prevents circular dependencies
export async function getLangChainService() {
  const { loaders } = await import('./lazy-loader')
  return loaders.langChainService()
}

export async function getLangGraphOrchestrator() {
  const { loaders } = await import('./lazy-loader')
  return loaders.langGraphOrchestrator()
}

export async function getAgentMemorySystem() {
  const { loaders } = await import('./lazy-loader')
  return loaders.agentMemorySystem()
}

export async function getAGUIHandlers() {
  const { loaders } = await import('./lazy-loader')
  return loaders.aguiHandlers()
}

export async function getChainlinkPriceFeedService() {
  const { loaders } = await import('./lazy-loader')
  return loaders.chainlinkPriceFeed()
}

export async function getTestnetDeFiService() {
  const { loaders } = await import('./lazy-loader')
  return loaders.testnetDeFi()
}

// Type exports
export type * from './types'

// Utility function
export async function clearServiceCache() {
  const { clearServiceCache: clear } = await import('./lazy-loader')
  return clear()
}