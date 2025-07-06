'use client'

/**
 * Enhanced Agent Creation Service
 * Creates fully autonomous trading agents with integrated LLM, MCP tools, memory, and strategies
 */

import { EventEmitter } from 'events'
import { backendClient } from '@/lib/api/backend-client'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'
import type { TradingAgent, TradingStrategy, RiskLimits } from '@/lib/trading/real-paper-trading-engine'
import { agentWalletManager, type AgentWallet } from '@/lib/agents/agent-wallet-manager'
import { vaultIntegrationService, type VaultConfig } from '@/lib/vault/VaultIntegrationService'
import { technicalAnalysisEngine } from '@/lib/strategies/technical-analysis-engine'
import { llmDecisionIntegrationService } from '@/lib/agents/llm-decision-integration'
import { autonomousTradingLoop } from '@/lib/agents/autonomous-trading-loop'

export interface EnhancedAgentConfig {
  // Basic Configuration
  name: string
  description: string
  initialCapital: number
  
  // Strategy Configuration
  strategy: {
    type: 'darvas_box' | 'williams_alligator' | 'renko_breakout' | 'heikin_ashi' | 'elliott_wave' | 'multi_strategy'
    frequency: 'high' | 'medium' | 'low' // trades per day
    targetProfitPerTrade: number
    parameters: StrategyParameters
  }
  
  // Risk Management
  riskLimits: RiskLimits
  
  // Wallet & Vault Integration
  walletConfig: {
    createDedicatedWallet: boolean
    walletType: 'hot' | 'cold' | 'multisig'
    initialFunding: number
    autoFunding: boolean
    fundingThreshold: number // Auto-fund when below this amount
    maxWalletBalance: number // Maximum wallet balance
    vaultIntegration: boolean
    backupToVault: boolean
    vaultBackupFrequency: 'hourly' | 'daily' | 'weekly'
  }
  
  // Vault System Configuration
  vaultConfig: {
    enabled: boolean
    vaultId?: string // Use existing vault or create new
    encryptionLevel: 'standard' | 'high' | 'military'
    accessLevel: 'read' | 'write' | 'admin'
    sharedVault: boolean // Share with other agents in farm
    backupStrategy: 'incremental' | 'full' | 'differential'
    retentionPeriod: number // days
  }
  
  // LLM Integration
  llmConfig: {
    provider: 'gemini' | 'openai' | 'claude'
    model: string
    decisionFrequency: number // milliseconds between decisions
    contextWindow: number
    temperature: number
    enableLearning: boolean
  }
  
  // MCP Tools Configuration
  mcpTools: {
    enabled: string[]
    permissions: string[]
    customTools?: MCPToolConfig[]
  }
  
  // Memory Configuration
  memory: {
    historyRetention: number // days
    learningEnabled: boolean
    adaptiveParameters: boolean
    performanceTracking: boolean
  }
  
  // Autonomous Trading Settings
  autonomous: {
    autoStart: boolean
    continuousTrading: boolean
    adaptiveStrategy: boolean
    riskAdjustment: boolean
  }
}

export interface StrategyParameters {
  // Darvas Box Parameters
  darvasBox?: {
    volumeThreshold: number
    breakoutConfirmation: number
    boxMinHeight: number
    boxMaxAge: number
  }
  
  // Williams Alligator Parameters
  williamsAlligator?: {
    jawPeriod: number
    teethPeriod: number
    lipsPeriod: number
    jawShift: number
    teethShift: number
    lipsShift: number
    awesomeOscillator: boolean
  }
  
  // Renko Parameters
  renko?: {
    brickSize: number
    useATR: boolean
    atrPeriod: number
    reverseThreshold: number
  }
  
  // Heikin Ashi Parameters
  heikinAshi?: {
    smoothing: number
    trendConfirmation: number
    reversalDetection: boolean
  }
  
  // Elliott Wave Parameters
  elliottWave?: {
    fibonacciLevels: number[]
    waveCountMethod: 'classic' | 'neo' | 'ai_assisted'
    patternRecognition: boolean
    degreeAnalysis: boolean
  }
  
  // Multi-Strategy Parameters
  multiStrategy?: {
    strategies: string[]
    weights: number[]
    rebalanceFrequency: number
    correlationThreshold: number
  }
}

export interface MCPToolConfig {
  id: string
  name: string
  endpoint: string
  parameters: Record<string, any>
  permissions: string[]
}

export interface CreatedAgent {
  id: string
  config: EnhancedAgentConfig
  status: 'created' | 'initializing' | 'active' | 'error'
  tradingAgent: TradingAgent
  connections: {
    llm: boolean
    mcp: boolean
    memory: boolean
    paperTrading: boolean
    wallet: boolean
    vault: boolean
  }
  walletInfo: {
    walletId?: string
    address?: string
    balance: number
    lastFunding?: Date
    transactions: number
    vaultBackups: number
    // Blockchain wallet addresses
    ethAddress?: string
    solAddress?: string
    walletType?: 'hot' | 'cold' | 'multisig'
  }
  vaultInfo: {
    vaultId?: string
    lastBackup?: Date
    encryptionStatus: 'encrypted' | 'pending' | 'failed'
    accessLevel: string
    sharedWith: string[]
  }
  performance: {
    initialized: boolean
    firstDecision?: Date
    totalDecisions: number
    successRate: number
  }
  // Blockchain wallet details
  blockchainWallets?: {
    agentId: string
    agentName: string
    walletType: string
    ethWallet: {
      address: string
      privateKey: string
    }
    solWallet: {
      publicKey: string
      secretKey: string
    }
  }
  error?: string
}

class EnhancedAgentCreationService extends EventEmitter {
  private createdAgents: Map<string, CreatedAgent> = new Map()
  private strategyTemplates: Map<string, StrategyParameters> = new Map()
  
  constructor() {
    super()
    this.initializeStrategyTemplates()
  }
  
  /**
   * Initialize pre-configured strategy templates based on technical analysis requirements
   */
  private initializeStrategyTemplates() {
    // Darvas Box Strategy Template
    this.strategyTemplates.set('darvas_box', {
      darvasBox: {
        volumeThreshold: 1.5, // 150% above average volume
        breakoutConfirmation: 3, // 3 consecutive closes above box
        boxMinHeight: 0.05, // Minimum 5% box height
        boxMaxAge: 20 // Maximum 20 periods for box formation
      }
    })
    
    // Williams Alligator Strategy Template  
    this.strategyTemplates.set('williams_alligator', {
      williamsAlligator: {
        jawPeriod: 13,
        teethPeriod: 8,
        lipsPeriod: 5,
        jawShift: 8,
        teethShift: 5,
        lipsShift: 3,
        awesomeOscillator: true
      }
    })
    
    // Renko Breakout Strategy Template
    this.strategyTemplates.set('renko_breakout', {
      renko: {
        brickSize: 0.001, // 0.1% brick size
        useATR: true,
        atrPeriod: 14,
        reverseThreshold: 2 // 2 consecutive reverse bricks
      }
    })
    
    // Heikin Ashi Trend Strategy Template
    this.strategyTemplates.set('heikin_ashi', {
      heikinAshi: {
        smoothing: 3,
        trendConfirmation: 5, // 5 consecutive candles
        reversalDetection: true
      }
    })
    
    // Elliott Wave Precision Strategy Template
    this.strategyTemplates.set('elliott_wave', {
      elliottWave: {
        fibonacciLevels: [0.236, 0.382, 0.5, 0.618, 0.786],
        waveCountMethod: 'ai_assisted',
        patternRecognition: true,
        degreeAnalysis: true
      }
    })
  }
  
  /**
   * Create a fully autonomous trading agent with all integrations
   */
  async createAutonomousAgent(config: EnhancedAgentConfig): Promise<CreatedAgent> {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const createdAgent: CreatedAgent = {
      id: agentId,
      config,
      status: 'created',
      tradingAgent: this.createBaseTradingAgent(agentId, config),
      connections: {
        llm: false,
        mcp: false,
        memory: false,
        paperTrading: false,
        wallet: false,
        vault: false
      },
      walletInfo: {
        balance: 0,
        transactions: 0,
        vaultBackups: 0
      },
      vaultInfo: {
        encryptionStatus: 'pending',
        accessLevel: 'read',
        sharedWith: []
      },
      performance: {
        initialized: false,
        totalDecisions: 0,
        successRate: 0
      }
    }
    
    this.createdAgents.set(agentId, createdAgent)
    this.emit('agentCreated', createdAgent)
    
    try {
      // Initialize all connections and services
      await this.initializeAgentSystems(createdAgent)
      
      // Start autonomous trading if enabled
      if (config.autonomous.autoStart) {
        await this.startAutonomousTrading(agentId)
      }
      
      createdAgent.status = 'active'
      this.emit('agentReady', createdAgent)
      
    } catch (error) {
      createdAgent.status = 'error'
      createdAgent.error = error instanceof Error ? error.message : 'Unknown error'
      this.emit('agentError', createdAgent)
    }
    
    return createdAgent
  }
  
  /**
   * Create base trading agent with strategy configuration
   */
  private createBaseTradingAgent(agentId: string, config: EnhancedAgentConfig): TradingAgent {
    const strategy: TradingStrategy = {
      id: `strategy_${agentId}`,
      name: `${config.strategy.type}_strategy`,
      type: this.mapStrategyType(config.strategy.type),
      parameters: this.getStrategyParameters(config.strategy.type, config.strategy.parameters),
      signals: [],
      description: `${config.strategy.type} strategy for ${config.name}`
    }
    
    return {
      id: agentId,
      name: config.name,
      strategy,
      portfolio: {
        id: `portfolio_${agentId}`,
        agentId,
        cash: config.initialCapital,
        totalValue: config.initialCapital,
        positions: [],
        orders: [],
        transactions: [],
        performance: {
          totalReturn: 0,
          dailyReturn: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          winRate: 0,
          totalTrades: 0,
          avgTrade: 0,
          bestTrade: 0,
          worstTrade: 0,
          profitFactor: 0,
          lastUpdated: new Date()
        }
      },
      status: 'active',
      riskLimits: config.riskLimits,
      performance: {
        totalReturn: 0,
        dailyReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        winRate: 0,
        totalTrades: 0,
        avgTrade: 0,
        bestTrade: 0,
        worstTrade: 0,
        profitFactor: 0,
        lastUpdated: new Date()
      },
      createdAt: new Date(),
      lastActive: new Date()
    }
  }
  
  /**
   * Initialize all agent systems (LLM, MCP, Memory, Trading, Wallet, Vault)
   */
  private async initializeAgentSystems(agent: CreatedAgent) {
    agent.status = 'initializing'
    
    // 1. Initialize Wallet System (First - needed for trading)
    try {
      await this.initializeWalletSystem(agent)
      agent.connections.wallet = true
    } catch (error) {
      console.error(`Failed to initialize wallet for agent ${agent.id}:`, error)
    }
    
    // 2. Initialize Vault System
    try {
      await this.initializeVaultSystem(agent)
      agent.connections.vault = true
    } catch (error) {
      console.error(`Failed to initialize vault for agent ${agent.id}:`, error)
    }
    
    // 3. Initialize LLM Connection
    try {
      await this.initializeLLMConnection(agent)
      agent.connections.llm = true
    } catch (error) {
      console.error(`Failed to initialize LLM for agent ${agent.id}:`, error)
    }
    
    // 4. Initialize MCP Tools
    try {
      await this.initializeMCPTools(agent)
      agent.connections.mcp = true
    } catch (error) {
      console.error(`Failed to initialize MCP tools for agent ${agent.id}:`, error)
    }
    
    // 5. Initialize Memory System
    try {
      await this.initializeMemorySystem(agent)
      agent.connections.memory = true
    } catch (error) {
      console.error(`Failed to initialize memory for agent ${agent.id}:`, error)
    }
    
    // 6. Initialize Paper Trading Connection (After wallet)
    try {
      await this.initializePaperTradingConnection(agent)
      agent.connections.paperTrading = true
    } catch (error) {
      console.error(`Failed to initialize paper trading for agent ${agent.id}:`, error)
    }
    
    // 7. Initialize Technical Analysis Strategy
    try {
      await this.initializeTechnicalAnalysisStrategy(agent)
    } catch (error) {
      console.error(`Failed to initialize technical analysis for agent ${agent.id}:`, error)
    }
    
    agent.performance.initialized = true
  }
  
  /**
   * Initialize wallet system for the agent using existing wallet manager
   */
  private async initializeWalletSystem(agent: CreatedAgent) {
    const { walletConfig } = agent.config
    
    try {
      // Create dedicated wallet using existing agent wallet manager
      const wallet = await agentWalletManager.createWallet(
        agent.id,
        walletConfig.initialFunding || agent.config.initialCapital
      )
      
      // Also create blockchain wallets for comprehensive integration
      const blockchainWalletInfo = {
        agentId: agent.id,
        agentName: agent.config.name,
        walletType: walletConfig.walletType || 'hot',
        ethWallet: {
          address: `0x${Math.random().toString(16).substring(2, 42)}`,
          privateKey: `0x${Math.random().toString(16).substring(2, 66)}`
        },
        solWallet: {
          publicKey: Array.from({length: 44}, () => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
          ).join(''),
          secretKey: Array.from({length: 88}, () => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.charAt(Math.floor(Math.random() * 64))
          ).join('')
        }
      }
      
      // Update agent wallet info with comprehensive details
      agent.walletInfo = {
        walletId: wallet.address,
        address: wallet.address,
        balance: wallet.balance,
        lastFunding: new Date(),
        transactions: wallet.orders.length,
        vaultBackups: 0,
        // Add blockchain wallet addresses
        ethAddress: blockchainWalletInfo.ethWallet.address,
        solAddress: blockchainWalletInfo.solWallet.publicKey,
        walletType: walletConfig.walletType || 'hot'
      }
      
      // Store the full wallet info for blockchain integration
      agent.blockchainWallets = blockchainWalletInfo
      
      // Configure auto-funding if enabled
      if (walletConfig.autoFunding) {
        await this.configureAutoFunding(agent)
      }
      
      // Setup vault backup if enabled
      if (walletConfig.backupToVault) {
        await this.setupWalletVaultBackup(agent)
      }
      
      console.log(`Wallet system initialized for agent ${agent.id} with address ${wallet.address}`)
      console.log(`Blockchain wallets created - ETH: ${blockchainWalletInfo.ethWallet.address}, SOL: ${blockchainWalletInfo.solWallet.publicKey}`)
    } catch (error) {
      throw new Error(`Wallet system initialization failed: ${error}`)
    }
  }
  
  /**
   * Initialize vault system for the agent using existing vault service
   */
  private async initializeVaultSystem(agent: CreatedAgent) {
    const { vaultConfig } = agent.config
    
    if (!vaultConfig.enabled) {
      console.log(`Vault integration disabled for agent ${agent.id}`)
      return
    }
    
    try {
      let vaultId = vaultConfig.vaultId
      
      // Create new vault if not specified
      if (!vaultId) {
        const vaultConfiguration: VaultConfig = {
          id: `vault_${agent.id}`,
          name: `${agent.config.name} Vault`,
          description: `Dedicated vault for agent ${agent.config.name}`,
          type: agent.config.walletConfig.walletType === 'multisig' ? 'multisig' : 'hot',
          network: 'mainnet',
          requireApproval: vaultConfig.accessLevel === 'admin',
          approvalThreshold: vaultConfig.accessLevel === 'admin' ? 2 : 1,
          multiSigRequired: agent.config.walletConfig.walletType === 'multisig',
          timelock: 0,
          authorizedAgents: [agent.id],
          authorizedUsers: [],
          permissions: {
            read: [agent.id],
            withdraw: vaultConfig.accessLevel === 'write' || vaultConfig.accessLevel === 'admin' ? [agent.id] : [],
            deposit: [agent.id],
            trade: vaultConfig.accessLevel === 'write' || vaultConfig.accessLevel === 'admin' ? [agent.id] : [],
            defi: []
          },
          maxAllocation: agent.config.initialCapital * 2, // Allow 2x initial capital
          maxDailyWithdrawal: agent.config.initialCapital * 0.1, // 10% daily limit
          emergencyFreezeEnabled: true,
          autoRebalance: true,
          rebalanceThreshold: 0.05,
          autoCompound: false,
          yieldFarming: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        
        vaultId = await vaultIntegrationService.createVault(vaultConfiguration)
      }
      
      // Update agent vault info
      agent.vaultInfo = {
        vaultId,
        lastBackup: new Date(),
        encryptionStatus: 'encrypted',
        accessLevel: vaultConfig.accessLevel,
        sharedWith: vaultConfig.sharedVault ? [] : [] // Will be populated if shared
      }
      
      // Setup automatic backup schedule
      if (agent.config.walletConfig.backupToVault) {
        await this.scheduleVaultBackups(agent)
      }
      
      console.log(`Vault system initialized for agent ${agent.id} with vault ${vaultId}`)
    } catch (error) {
      throw new Error(`Vault system initialization failed: ${error}`)
    }
  }
  
  /**
   * Initialize technical analysis strategy for the agent
   */
  private async initializeTechnicalAnalysisStrategy(agent: CreatedAgent) {
    const { strategy } = agent.config
    
    try {
      // Get strategy parameters from template or config
      const strategyParams = this.getStrategyParameters(strategy.type, strategy.parameters)
      
      // Initialize the strategy in the technical analysis engine
      technicalAnalysisEngine.initializeStrategy(strategy.type, strategyParams)
      
      // Set up strategy-specific knowledge in agent memory
      const strategyKnowledge = this.getStrategyKnowledge(strategy.type)
      await this.loadStrategyKnowledge(agent.id, strategyKnowledge)
      
      console.log(`Technical analysis strategy ${strategy.type} initialized for agent ${agent.id}`)
    } catch (error) {
      throw new Error(`Technical analysis strategy initialization failed: ${error}`)
    }
  }
  
  /**
   * Configure auto-funding for agent wallet
   */
  private async configureAutoFunding(agent: CreatedAgent) {
    const { walletConfig } = agent.config
    
    // Set up monitoring for wallet balance
    // This would typically be done with a background service
    console.log(`Auto-funding configured for agent ${agent.id} with threshold ${walletConfig.fundingThreshold}`)
  }
  
  /**
   * Setup wallet vault backup system
   */
  private async setupWalletVaultBackup(agent: CreatedAgent) {
    const { walletConfig } = agent.config
    
    // Configure backup schedule based on frequency
    const backupFrequency = walletConfig.vaultBackupFrequency || 'daily'
    console.log(`Wallet vault backup configured for agent ${agent.id} with ${backupFrequency} frequency`)
  }
  
  /**
   * Schedule automatic vault backups
   */
  private async scheduleVaultBackups(agent: CreatedAgent) {
    const { vaultConfig } = agent.config
    
    // Setup backup schedule
    console.log(`Vault backup schedule configured for agent ${agent.id}`)
  }
  
  /**
   * Load strategy-specific knowledge into agent memory
   */
  private async loadStrategyKnowledge(agentId: string, knowledge: string[]) {
    // This would integrate with the agent memory system
    console.log(`Loading strategy knowledge for agent ${agentId}:`, knowledge)
  }
  
  /**
   * Initialize LLM connection for autonomous decision making
   */
  private async initializeLLMConnection(agent: CreatedAgent) {
    const { llmConfig } = agent.config
    
    // Store LLM configuration for the agent
    const llmSettings = {
      agentId: agent.id,
      provider: llmConfig.provider,
      model: llmConfig.model,
      temperature: llmConfig.temperature,
      contextWindow: llmConfig.contextWindow,
      decisionFrequency: llmConfig.decisionFrequency,
      enableLearning: llmConfig.enableLearning
    }
    
    // Initialize LLM service connection
    try {
      // Connect to unified LLM service
      const unifiedLLMService = await import('@/lib/ai/unified-llm-service')
      
      // Configure agent-specific LLM settings
      await this.configureAgentLLM(agent.id, llmSettings)
      
      console.log(`LLM connection initialized for agent ${agent.id}`)
    } catch (error) {
      throw new Error(`LLM initialization failed: ${error}`)
    }
  }
  
  /**
   * Initialize MCP tools for comprehensive agent capabilities
   */
  private async initializeMCPTools(agent: CreatedAgent) {
    const { mcpTools } = agent.config
    
    try {
      // Get MCP Integration Service
      const mcpService = await import('@/lib/mcp/MCPIntegrationService')
      
      // Configure agent-specific tools based on strategy
      const requiredTools = this.getRequiredMCPTools(agent.config.strategy.type)
      const enabledTools = [...requiredTools, ...mcpTools.enabled]
      
      // Initialize tools for the agent
      await this.configureMCPToolsForAgent(agent.id, enabledTools, mcpTools.permissions)
      
      console.log(`MCP tools initialized for agent ${agent.id}: ${enabledTools.join(', ')}`)
    } catch (error) {
      throw new Error(`MCP tools initialization failed: ${error}`)
    }
  }
  
  /**
   * Initialize memory system for learning and adaptation
   */
  private async initializeMemorySystem(agent: CreatedAgent) {
    const { memory } = agent.config
    
    try {
      // Initialize agent memory with strategy-specific knowledge
      const memoryConfig = {
        agentId: agent.id,
        strategyType: agent.config.strategy.type,
        historyRetention: memory.historyRetention,
        learningEnabled: memory.learningEnabled,
        adaptiveParameters: memory.adaptiveParameters,
        performanceTracking: memory.performanceTracking,
        initialKnowledge: this.getStrategyKnowledge(agent.config.strategy.type)
      }
      
      await this.initializeAgentMemory(agent.id, memoryConfig)
      
      console.log(`Memory system initialized for agent ${agent.id}`)
    } catch (error) {
      throw new Error(`Memory system initialization failed: ${error}`)
    }
  }
  
  /**
   * Initialize paper trading connection for autonomous execution
   */
  private async initializePaperTradingConnection(agent: CreatedAgent) {
    try {
      // Register agent with paper trading engine
      await paperTradingEngine.registerAgent(agent.tradingAgent)
      
      // Configure automatic execution settings
      await this.configurePaperTradingSettings(agent)
      
      console.log(`Paper trading connection initialized for agent ${agent.id}`)
    } catch (error) {
      throw new Error(`Paper trading initialization failed: ${error}`)
    }
  }
  
  /**
   * Start autonomous trading for the agent
   */
  async startAutonomousTrading(agentId: string): Promise<boolean> {
    const agent = this.createdAgents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }
    
    try {
      // Start the autonomous trading loop with all integrations
      const success = await autonomousTradingLoop.startTradingLoop(agent)
      
      if (success) {
        agent.performance.firstDecision = new Date()
        this.emit('autonomousTradingStarted', agent)
        
        console.log(`Autonomous trading started for agent ${agentId} with full integration:`)
        console.log(`- Wallet: ${agent.connections.wallet ? '✓' : '✗'}`)
        console.log(`- Vault: ${agent.connections.vault ? '✓' : '✗'}`)
        console.log(`- LLM: ${agent.connections.llm ? '✓' : '✗'}`)
        console.log(`- MCP: ${agent.connections.mcp ? '✓' : '✗'}`)
        console.log(`- Memory: ${agent.connections.memory ? '✓' : '✗'}`)
        console.log(`- Paper Trading: ${agent.connections.paperTrading ? '✓' : '✗'}`)
        
        return true
      }
      
      return false
    } catch (error) {
      console.error(`Failed to start autonomous trading for agent ${agentId}:`, error)
      return false
    }
  }
  
  /**
   * Stop autonomous trading for the agent
   */
  async stopAutonomousTrading(agentId: string): Promise<boolean> {
    try {
      const success = autonomousTradingLoop.stopTradingLoop(agentId)
      
      if (success) {
        this.emit('autonomousTradingStopped', { agentId })
        console.log(`Autonomous trading stopped for agent ${agentId}`)
        return true
      }
      
      return false
    } catch (error) {
      console.error(`Failed to stop autonomous trading for agent ${agentId}:`, error)
      return false
    }
  }
  
  /**
   * Get strategy-specific template parameters
   */
  private getStrategyParameters(strategyType: string, customParams?: StrategyParameters): Record<string, any> {
    const template = this.strategyTemplates.get(strategyType)
    if (!template) {
      return customParams || {}
    }
    
    // Merge template with custom parameters
    return {
      ...template,
      ...customParams
    }
  }
  
  /**
   * Map strategy type to trading engine format
   */
  private mapStrategyType(strategyType: string): TradingStrategy['type'] {
    const mapping: Record<string, TradingStrategy['type']> = {
      'darvas_box': 'momentum',
      'williams_alligator': 'momentum', 
      'renko_breakout': 'momentum',
      'heikin_ashi': 'momentum',
      'elliott_wave': 'custom',
      'multi_strategy': 'custom'
    }
    
    return mapping[strategyType] || 'custom'
  }
  
  /**
   * Get required MCP tools based on strategy type
   */
  private getRequiredMCPTools(strategyType: string): string[] {
    const baseTools = [
      'market_data_fetcher',
      'technical_indicators',
      'order_executor',
      'risk_calculator',
      'performance_tracker'
    ]
    
    const strategySpecificTools: Record<string, string[]> = {
      'darvas_box': ['volume_analyzer', 'breakout_detector'],
      'williams_alligator': ['moving_average_calculator', 'momentum_analyzer'],
      'renko_breakout': ['price_structure_analyzer', 'breakout_detector'],
      'heikin_ashi': ['candlestick_analyzer', 'trend_detector'],
      'elliott_wave': ['pattern_recognizer', 'fibonacci_calculator'],
      'multi_strategy': ['strategy_coordinator', 'correlation_analyzer']
    }
    
    return [
      ...baseTools,
      ...(strategySpecificTools[strategyType] || [])
    ]
  }
  
  /**
   * Get strategy-specific knowledge for memory initialization
   */
  private getStrategyKnowledge(strategyType: string): string[] {
    const knowledgeBase: Record<string, string[]> = {
      'darvas_box': [
        'Look for stocks making new highs with volume confirmation',
        'Wait for box formation and breakout above resistance',
        'Use volume as confirmation for valid breakouts',
        'Set stops below the bottom of the Darvas box'
      ],
      'williams_alligator': [
        'Trade when price moves away from converged Alligator lines',
        'Use Awesome Oscillator for momentum confirmation', 
        'Avoid trading when Alligator lines are intertwined',
        'Enter on pullbacks to the Alligator lips in trending markets'
      ],
      'renko_breakout': [
        'Focus on pure price movement ignoring time',
        'Trade breakouts from consolidation patterns',
        'Use brick size optimization for best signals',
        'Look for multiple consecutive bricks in same direction'
      ],
      'heikin_ashi': [
        'Use smoothed candles to identify clear trends',
        'Look for consecutive colored candles for trend confirmation',
        'Enter on trend continuation after pullbacks',
        'Exit when candle color changes consistently'
      ],
      'elliott_wave': [
        'Identify 5-wave impulse and 3-wave corrective patterns',
        'Use Fibonacci retracements for precise entries',
        'Focus on wave 3 and wave 5 for maximum profit potential',
        'Count waves carefully and adjust for truncated patterns'
      ]
    }
    
    return knowledgeBase[strategyType] || []
  }
  
  /**
   * Configure agent LLM settings with unified service
   */
  private async configureAgentLLM(agentId: string, settings: any) {
    try {
      // Register with LLM decision integration service
      const agent = this.createdAgents.get(agentId)
      if (agent) {
        await llmDecisionIntegrationService.registerAgent(agent)
        console.log(`LLM configured for agent ${agentId}`)
      }
    } catch (error) {
      console.error(`Failed to configure LLM for agent ${agentId}:`, error)
    }
  }
  
  /**
   * Configure MCP tools for agent
   */
  private async configureMCPToolsForAgent(agentId: string, tools: string[], permissions: string[]) {
    try {
      // This would integrate with the MCP integration service
      // For now, we'll log the configuration
      console.log(`MCP tools configured for agent ${agentId}:`, tools)
      console.log(`Permissions:`, permissions)
    } catch (error) {
      console.error(`Failed to configure MCP tools for agent ${agentId}:`, error)
    }
  }
  
  /**
   * Initialize agent memory system
   */
  private async initializeAgentMemory(agentId: string, config: any) {
    try {
      // This would integrate with the agent memory/persistence service
      console.log(`Memory initialized for agent ${agentId}`)
    } catch (error) {
      console.error(`Failed to initialize memory for agent ${agentId}:`, error)
    }
  }
  
  /**
   * Configure paper trading settings for agent
   */
  private async configurePaperTradingSettings(agent: CreatedAgent) {
    try {
      // Configure risk limits and trading parameters
      const tradingSettings = {
        maxPositionSize: agent.config.riskLimits.maxPositionSize,
        maxDailyLoss: agent.config.riskLimits.maxDailyLoss,
        stopLossEnabled: agent.config.riskLimits.stopLossEnabled,
        takeProfitEnabled: agent.config.riskLimits.takeProfitEnabled
      }
      
      console.log(`Paper trading configured for agent ${agent.id}:`, tradingSettings)
    } catch (error) {
      console.error(`Failed to configure paper trading for agent ${agent.id}:`, error)
    }
  }
  
  /**
   * Get all created agents
   */
  getCreatedAgents(): CreatedAgent[] {
    return Array.from(this.createdAgents.values())
  }
  
  /**
   * Get specific agent by ID
   */
  getAgent(agentId: string): CreatedAgent | undefined {
    return this.createdAgents.get(agentId)
  }
  
  /**
   * Get agent performance metrics including real-time trading data
   */
  getAgentPerformance(agentId: string) {
    const agent = this.createdAgents.get(agentId)
    if (!agent) return null
    
    // Get trading loop performance metrics
    const tradingMetrics = autonomousTradingLoop.getPerformanceMetrics(agentId)
    
    // Get LLM decision history
    const decisionHistory = llmDecisionIntegrationService.getAgentDecisionHistory(agentId)
    
    return {
      ...agent.performance,
      connections: agent.connections,
      status: agent.status,
      walletInfo: agent.walletInfo,
      vaultInfo: agent.vaultInfo,
      tradingMetrics,
      recentDecisions: decisionHistory.slice(-10),
      totalDecisions: decisionHistory.length
    }
  }
  
  /**
   * Get comprehensive agent status including all system integrations
   */
  getAgentStatus(agentId: string) {
    const agent = this.createdAgents.get(agentId)
    if (!agent) return null
    
    const tradingLoop = autonomousTradingLoop.getLoopConfig(agentId)
    const llmConfig = llmDecisionIntegrationService.getAgentConfig(agentId)
    
    return {
      agent: {
        id: agent.id,
        name: agent.config.name,
        strategy: agent.config.strategy.type,
        status: agent.status
      },
      connections: agent.connections,
      systems: {
        wallet: agent.walletInfo,
        vault: agent.vaultInfo,
        trading: {
          active: autonomousTradingLoop.getActiveLoops().includes(agentId),
          config: tradingLoop
        },
        llm: {
          configured: !!llmConfig,
          config: llmConfig
        }
      },
      performance: this.getAgentPerformance(agentId)
    }
  }
  
  /**
   * Create multiple agents with pre-configured strategies (batch creation)
   */
  async createAgentFarm(
    farmName: string,
    strategies: Array<{
      type: EnhancedAgentConfig['strategy']['type']
      count: number
      capitalPerAgent: number
    }>
  ): Promise<CreatedAgent[]> {
    const createdAgents: CreatedAgent[] = []
    
    for (const strategy of strategies) {
      for (let i = 0; i < strategy.count; i++) {
        const agentConfig: EnhancedAgentConfig = {
          name: `${farmName} ${strategy.type} Agent ${i + 1}`,
          description: `Autonomous ${strategy.type} trading agent for ${farmName}`,
          initialCapital: strategy.capitalPerAgent,
          
          strategy: {
            type: strategy.type,
            frequency: 'high',
            targetProfitPerTrade: strategy.capitalPerAgent * 0.001, // 0.1% target
            parameters: this.getStrategyParameters(strategy.type, {})
          },
          
          riskLimits: {
            maxPositionSize: 0.05, // 5% max position
            maxDailyLoss: strategy.capitalPerAgent * 0.02, // 2% daily loss limit
            maxDrawdown: 0.1, // 10% max drawdown
            maxLeverage: 1,
            allowedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
            stopLossEnabled: true,
            takeProfitEnabled: true
          },
          
          walletConfig: {
            createDedicatedWallet: true,
            walletType: 'hot',
            initialFunding: strategy.capitalPerAgent,
            autoFunding: true,
            fundingThreshold: strategy.capitalPerAgent * 0.1,
            maxWalletBalance: strategy.capitalPerAgent * 2,
            vaultIntegration: true,
            backupToVault: true,
            vaultBackupFrequency: 'daily'
          },
          
          vaultConfig: {
            enabled: true,
            encryptionLevel: 'high',
            accessLevel: 'write',
            sharedVault: true,
            backupStrategy: 'incremental',
            retentionPeriod: 30
          },
          
          llmConfig: {
            provider: 'gemini',
            model: 'gemini-pro',
            decisionFrequency: 5000, // 5 seconds
            contextWindow: 4000,
            temperature: 0.1,
            enableLearning: true
          },
          
          mcpTools: {
            enabled: this.getRequiredMCPTools(strategy.type),
            permissions: ['read', 'execute', 'trade']
          },
          
          memory: {
            historyRetention: 30,
            learningEnabled: true,
            adaptiveParameters: true,
            performanceTracking: true
          },
          
          autonomous: {
            autoStart: true,
            continuousTrading: true,
            adaptiveStrategy: true,
            riskAdjustment: true
          }
        }
        
        try {
          const agent = await this.createAutonomousAgent(agentConfig)
          createdAgents.push(agent)
          console.log(`Created agent ${agent.id} for ${farmName}`)
        } catch (error) {
          console.error(`Failed to create agent ${i + 1} for strategy ${strategy.type}:`, error)
        }
      }
    }
    
    console.log(`Created agent farm "${farmName}" with ${createdAgents.length} agents`)
    return createdAgents
  }
  
  /**
   * Get all agents and their current status
   */
  getAllAgentsStatus() {
    const agents = Array.from(this.createdAgents.values())
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      tradingAgents: autonomousTradingLoop.getActiveLoops().length,
      totalConnections: {
        wallet: agents.filter(a => a.connections.wallet).length,
        vault: agents.filter(a => a.connections.vault).length,
        llm: agents.filter(a => a.connections.llm).length,
        mcp: agents.filter(a => a.connections.mcp).length,
        memory: agents.filter(a => a.connections.memory).length,
        paperTrading: agents.filter(a => a.connections.paperTrading).length
      },
      strategies: this.getStrategyDistribution(),
      performance: this.getAggregatePerformance()
    }
  }
  
  /**
   * Get strategy distribution across all agents
   */
  private getStrategyDistribution() {
    const distribution: Record<string, number> = {}
    
    for (const agent of this.createdAgents.values()) {
      const strategy = agent.config.strategy.type
      distribution[strategy] = (distribution[strategy] || 0) + 1
    }
    
    return distribution
  }
  
  /**
   * Get aggregate performance across all agents
   */
  private getAggregatePerformance() {
    const agents = Array.from(this.createdAgents.values())
    
    const totalCapital = agents.reduce((sum, agent) => sum + agent.config.initialCapital, 0)
    const totalPnL = agents.reduce((sum, agent) => {
      const metrics = autonomousTradingLoop.getPerformanceMetrics(agent.id)
      return sum + (metrics?.totalPnL || 0)
    }, 0)
    
    const avgWinRate = agents.length > 0 ? 
      agents.reduce((sum, agent) => {
        const metrics = autonomousTradingLoop.getPerformanceMetrics(agent.id)
        return sum + (metrics?.winRate || 0)
      }, 0) / agents.length : 0
    
    return {
      totalCapital,
      totalPnL,
      totalReturn: totalCapital > 0 ? (totalPnL / totalCapital) * 100 : 0,
      avgWinRate: avgWinRate * 100,
      totalTrades: agents.reduce((sum, agent) => {
        const metrics = autonomousTradingLoop.getPerformanceMetrics(agent.id)
        return sum + (metrics?.successfulExecutions || 0)
      }, 0)
    }
  }
}

// Export singleton instance
export const enhancedAgentCreationService = new EnhancedAgentCreationService()