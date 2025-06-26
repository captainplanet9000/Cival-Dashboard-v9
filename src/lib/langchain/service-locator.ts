/**
 * Service Locator for LangChain Services
 * Prevents circular dependencies by providing lazy loading of services
 */

let _services: {
  langChainService?: any
  langGraphOrchestrator?: any
  tradingWorkflowEngine?: any
  agentFactory?: any
  langChainMCPIntegration?: any
} = {}

export const ServiceLocator = {
  getLangChainService: () => {
    if (!_services.langChainService) {
      const { LangChainService } = require('./LangChainService')
      _services.langChainService = new LangChainService()
    }
    return _services.langChainService
  },

  getLangGraphOrchestrator: () => {
    if (!_services.langGraphOrchestrator) {
      const { LangGraphOrchestrator } = require('./LangGraphOrchestrator')
      _services.langGraphOrchestrator = new LangGraphOrchestrator()
    }
    return _services.langGraphOrchestrator
  },

  getTradingWorkflowEngine: () => {
    if (!_services.tradingWorkflowEngine) {
      const { TradingWorkflowEngine } = require('./TradingWorkflow')
      _services.tradingWorkflowEngine = new TradingWorkflowEngine()
    }
    return _services.tradingWorkflowEngine
  },

  getAgentFactory: () => {
    if (!_services.agentFactory) {
      const { agentFactory } = require('./EnhancedAgents')
      _services.agentFactory = agentFactory
    }
    return _services.agentFactory
  },

  getLangChainMCPIntegration: () => {
    if (!_services.langChainMCPIntegration) {
      const { LangChainMCPIntegration } = require('./MCPIntegration')
      _services.langChainMCPIntegration = new LangChainMCPIntegration()
    }
    return _services.langChainMCPIntegration
  },

  // Clear all services (useful for testing)
  clearServices: () => {
    _services = {}
  }
}