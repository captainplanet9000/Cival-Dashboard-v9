/**
 * Autonomous Startup Service
 * Initializes and coordinates all autonomous trading components
 */

import { getAutonomousTradingOrchestrator } from './AutonomousTradingOrchestrator'
import { getMarketDataSimulator } from './MarketDataSimulator'

// Lazy load persistent trading engine to avoid circular dependencies
const getPersistentTradingEngine = () => import('@/lib/paper-trading/PersistentTradingEngine').then(m => m.persistentTradingEngine)

export class AutonomousStartupService {
  private isInitialized = false
  private isRunning = false
  private persistentTradingEngine: any = null

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log('🚀 Initializing Autonomous Trading System...')

    try {
      // Load persistent trading engine
      if (!this.persistentTradingEngine) {
        this.persistentTradingEngine = await getPersistentTradingEngine()
      }
      // 1. Initialize market data simulator
      console.log('📊 Starting Market Data Simulator...')
      await getMarketDataSimulator().start()

      // 2. Create initial portfolios for agents
      console.log('💰 Initializing Agent Portfolios...')
      await this.initializeAgentPortfolios()

      // 3. Start feeding mock market data
      console.log('📈 Loading Initial Market Data...')
      await this.loadInitialMarketData()

      // 4. Initialize trading orchestrator
      console.log('🤖 Initializing Trading Orchestrator...')
      // Note: Don't auto-start the orchestrator, let user control it

      this.isInitialized = true
      console.log('✅ Autonomous Trading System Initialized Successfully!')

    } catch (error) {
      console.error('❌ Failed to initialize Autonomous Trading System:', error)
      throw error
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (this.isRunning) return

    console.log('▶️ Starting Autonomous Trading System...')

    // Start the orchestrator
    await getAutonomousTradingOrchestrator().start()
    this.isRunning = true

    console.log('✅ Autonomous Trading System Started!')
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return

    console.log('⏹️ Stopping Autonomous Trading System...')

    // Stop the orchestrator
    await getAutonomousTradingOrchestrator().stop()
    
    // Keep market simulator running for data
    // getMarketDataSimulator().stop()

    this.isRunning = false
    console.log('✅ Autonomous Trading System Stopped!')
  }

  private async initializeAgentPortfolios(): Promise<void> {
    const agents = getAutonomousTradingOrchestrator().getAgents()
    
    for (const agent of agents) {
      try {
        // Check if portfolio already exists
        const existing = this.persistentTradingEngine.getPortfolio(agent.portfolio)
        
        if (!existing) {
          await this.persistentTradingEngine.createPortfolio(
            agent.portfolio, 
            agent.config.initialCapital
          )
          console.log(`📊 Created portfolio for ${agent.name}: $${agent.config.initialCapital}`)
        } else {
          console.log(`📊 Portfolio exists for ${agent.name}: $${existing.totalValue.toFixed(2)}`)
        }
      } catch (error) {
        console.error(`Failed to initialize portfolio for ${agent.name}:`, error)
      }
    }
  }

  private async loadInitialMarketData(): Promise<void> {
    // Add some popular trading pairs to the simulator
    const tradingPairs = [
      { symbol: 'BTC/USD', price: 65000 },
      { symbol: 'ETH/USD', price: 3500 },
      { symbol: 'SOL/USD', price: 180 },
      { symbol: 'ADA/USD', price: 0.65 },
      { symbol: 'MATIC/USD', price: 1.25 },
      { symbol: 'AVAX/USD', price: 45 },
      { symbol: 'DOT/USD', price: 8.5 },
      { symbol: 'LINK/USD', price: 18 },
      { symbol: 'UNI/USD', price: 12 },
      { symbol: 'AAVE/USD', price: 320 }
    ]

    for (const pair of tradingPairs) {
      getMarketDataSimulator().addSymbol(pair.symbol, pair.price)
      
      // Also update the paper trading engine directly
      this.persistentTradingEngine.updateMarketData(pair.symbol, {
        symbol: pair.symbol,
        price: pair.price,
        bid: pair.price * 0.999,
        ask: pair.price * 1.001,
        volume: Math.random() * 1000000 + 100000,
        timestamp: Date.now(),
        change24h: (Math.random() - 0.5) * pair.price * 0.1,
        changePercent24h: (Math.random() - 0.5) * 10
      })
    }

    console.log(`📈 Loaded ${tradingPairs.length} trading pairs`)
  }

  // Status methods
  isSystemInitialized(): boolean {
    return this.isInitialized
  }

  isSystemRunning(): boolean {
    return this.isRunning
  }

  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      orchestratorRunning: getAutonomousTradingOrchestrator().isRunning(),
      simulatorRunning: getMarketDataSimulator().isSimulatorRunning(),
      agents: getAutonomousTradingOrchestrator().getAgents().length,
      activeAgents: getAutonomousTradingOrchestrator().getAgents().filter(a => a.status === 'active').length
    }
  }

  // Market simulation controls
  async triggerMarketEvent(type: 'crash' | 'rally', intensity: number = 0.15): Promise<void> {
    if (type === 'crash') {
      getMarketDataSimulator().triggerMarketCrash(intensity)
      console.log(`💥 Triggered market crash with ${intensity * 100}% intensity`)
    } else {
      getMarketDataSimulator().triggerMarketRally(intensity)
      console.log(`🚀 Triggered market rally with ${intensity * 100}% intensity`)
    }
  }

  async setMarketConditions(config: {
    volatilityMultiplier?: number
    trendBias?: number
    enableNews?: boolean
    enableVolatilitySpikes?: boolean
  }): Promise<void> {
    getMarketDataSimulator().setConfig(config)
    console.log('⚙️ Updated market simulation config:', config)
  }

  // Agent management
  async addCustomAgent(config: {
    name: string
    type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'risk_manager'
    initialCapital: number
    tradingPairs: string[]
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  }): Promise<string> {
    const agentId = await getAutonomousTradingOrchestrator().addAgent({
      name: config.name,
      type: config.type,
      config: {
        tradingPairs: config.tradingPairs,
        initialCapital: config.initialCapital,
        riskTolerance: config.riskTolerance,
        timeHorizon: 'intraday',
        enableStopLoss: true,
        enableTakeProfit: true,
        enableTrailingStop: false,
        rebalanceFrequency: 60,
        decisionCooldown: 300
      }
    })

    // Initialize the portfolio
    await this.persistentTradingEngine.createPortfolio(agentId, config.initialCapital)
    
    console.log(`🤖 Added custom agent: ${config.name} (${agentId})`)
    return agentId
  }

  // Performance monitoring
  getPerformanceMetrics() {
    const agents = getAutonomousTradingOrchestrator().getAgents()
    const totalValue = agents.reduce((sum, agent) => {
      const portfolio = this.persistentTradingEngine.getPortfolio(agent.portfolio)
      return sum + (portfolio?.totalValue || 0)
    }, 0)

    const totalInitialCapital = agents.reduce((sum, agent) => sum + agent.config.initialCapital, 0)
    const totalReturn = totalValue - totalInitialCapital
    const totalReturnPercent = totalInitialCapital > 0 ? (totalReturn / totalInitialCapital) * 100 : 0

    const avgWinRate = agents.length > 0 ? 
      agents.reduce((sum, agent) => sum + agent.performance.winRate, 0) / agents.length : 0

    const totalTrades = agents.reduce((sum, agent) => sum + agent.performance.totalTrades, 0)

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      totalValue,
      totalReturn,
      totalReturnPercent,
      avgWinRate,
      totalTrades,
      marketConditions: getAutonomousTradingOrchestrator().getMarketConditions()
    }
  }

  // Auto-start on import (for development)
  async autoStart(): Promise<void> {
    // Only auto-initialize, don't auto-start trading
    if (typeof window !== 'undefined' && !this.isInitialized) {
      try {
        await this.initialize()
      } catch (error) {
        console.warn('Auto-initialization failed:', error)
      }
    }
  }
}

// Export lazy singleton to prevent circular dependencies
let _autonomousStartupService: AutonomousStartupService | null = null

export function getAutonomousStartupService(): AutonomousStartupService {
  if (!_autonomousStartupService) {
    _autonomousStartupService = new AutonomousStartupService()
    // Auto-start only when first accessed
    _autonomousStartupService.autoStart()
  }
  return _autonomousStartupService
}

// Keep the old export for backward compatibility but make it lazy
// Using a function instead of Proxy to prevent circular dependency issues
export const autonomousStartupService = {
  get: () => getAutonomousStartupService()
}

export default autonomousStartupService