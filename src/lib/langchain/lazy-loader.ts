/**
 * Lazy Loader for LangChain Services
 * Ensures all services are loaded only when needed with no circular dependencies
 */

// Service cache
const serviceCache = new Map<string, any>()

// Dynamic service loaders
export const loaders = {
  async langChainService() {
    if (!serviceCache.has('langchain')) {
      const langChainModule = await import('./services/LangChainService')
      serviceCache.set('langchain', new langChainModule.LangChainService())
    }
    return serviceCache.get('langchain')
  },

  async langGraphOrchestrator() {
    if (!serviceCache.has('langgraph')) {
      const langGraphModule = await import('./orchestrators/LangGraphOrchestrator')
      serviceCache.set('langgraph', new langGraphModule.LangGraphOrchestrator())
    }
    return serviceCache.get('langgraph')
  },

  async agentMemorySystem() {
    if (!serviceCache.has('memory')) {
      const memoryModule = await import('./memory/AgentMemorySystem')
      serviceCache.set('memory', new memoryModule.AgentMemorySystem())
    }
    return serviceCache.get('memory')
  },

  async aguiHandlers() {
    if (!serviceCache.has('agui')) {
      const aguiModule = await import('./handlers/AGUIHandlers')
      serviceCache.set('agui', new aguiModule.AGUIHandlers())
    }
    return serviceCache.get('agui')
  },

  async chainlinkPriceFeed() {
    if (!serviceCache.has('chainlink')) {
      const chainlinkModule = await import('./integrations/ChainlinkPriceFeedService')
      serviceCache.set('chainlink', new chainlinkModule.ChainlinkPriceFeedService())
    }
    return serviceCache.get('chainlink')
  },

  async testnetDeFi() {
    if (!serviceCache.has('testnet')) {
      const testnetModule = await import('./integrations/TestnetDeFiService')
      serviceCache.set('testnet', new testnetModule.TestnetDeFiService())
    }
    return serviceCache.get('testnet')
  }
}

// Clear cache utility
export function clearServiceCache() {
  serviceCache.clear()
}