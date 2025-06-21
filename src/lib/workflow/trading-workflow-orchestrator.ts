/**
 * Trading Workflow Orchestrator
 * Integrates AG-UI, LLM Service, Paper Trading, and MCP Infrastructure
 */

import { EventEmitter } from 'events'
import { getLLMService, type AgentDecisionRequest, type AgentDecisionResponse } from '@/lib/llm/llm-service'
import { PaperTradingEngine, type PaperTradeOrder } from '@/lib/paper-trading/PaperTradingEngine'
import { getAGUIClient, type AGUIMessageType, type AgentDecisionData } from '@/lib/websocket/ag-ui-client'
import { mcpRegistry } from '@/lib/mcp/registry'
import { useMCPInfrastructureStore } from '@/lib/stores/mcp-infrastructure-store'

// Workflow Types
export interface TradingWorkflow {
  id: string
  name: string
  agentId: string
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed'
  steps: WorkflowStep[]
  currentStepIndex: number
  context: WorkflowContext
  results: WorkflowStepResult[]
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'market_analysis' | 'risk_assessment' | 'decision_making' | 'trade_execution' | 'portfolio_update' | 'notification'
  configuration: Record<string, any>
  dependencies?: string[]
  timeout?: number
  retryCount?: number
  condition?: (context: WorkflowContext) => boolean
}

export interface WorkflowContext {
  agentId: string
  agentConfig: {
    name: string
    type: string
    riskTolerance: number
    maxPositionSize: number
    llmProvider: string
    llmModel: string
  }
  marketData: Record<string, any>
  portfolioData: {
    balance: number
    positions: Array<{
      symbol: string
      quantity: number
      avgPrice: number
      currentValue: number
    }>
    totalValue: number
    totalPnl: number
  }
  tradeSignals: Array<{
    symbol: string
    action: 'buy' | 'sell' | 'hold'
    confidence: number
    reasoning: string
  }>
  riskMetrics: {
    portfolioRisk: number
    positionRisk: number
    correlationRisk: number
  }
  executedTrades: Array<{
    id: string
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    executedPrice: number
    timestamp: string
  }>
  variables: Record<string, any>
}

export interface WorkflowStepResult {
  stepId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  result?: any
  error?: string
  executionTime?: number
  timestamp: Date
}

// Pre-defined Workflow Templates
export const WORKFLOW_TEMPLATES = {
  COMPLETE_TRADING_CYCLE: {
    id: 'complete_trading_cycle',
    name: 'Complete Trading Cycle',
    description: 'Full automated trading workflow with AI decision making',
    steps: [
      {
        id: 'market_data_collection',
        name: 'Collect Market Data',
        type: 'market_analysis' as const,
        configuration: {
          symbols: ['BTC', 'ETH', 'SOL'],
          timeframes: ['1h', '4h', '1d'],
          indicators: ['rsi', 'macd', 'bollinger_bands']
        }
      },
      {
        id: 'portfolio_assessment',
        name: 'Assess Current Portfolio',
        type: 'portfolio_update' as const,
        configuration: {
          includeUnrealizedPnl: true,
          calculateMetrics: true
        }
      },
      {
        id: 'risk_evaluation',
        name: 'Evaluate Risk Levels',
        type: 'risk_assessment' as const,
        configuration: {
          checkPositionLimits: true,
          calculateVaR: true,
          correlationAnalysis: true
        },
        dependencies: ['portfolio_assessment']
      },
      {
        id: 'ai_decision',
        name: 'AI Decision Making',
        type: 'decision_making' as const,
        configuration: {
          includeMarketAnalysis: true,
          includeRiskAssessment: true,
          confidenceThreshold: 0.7
        },
        dependencies: ['market_data_collection', 'risk_evaluation']
      },
      {
        id: 'trade_execution',
        name: 'Execute Trades',
        type: 'trade_execution' as const,
        configuration: {
          paperTradingMode: true,
          maxTradeSize: 50, // $50 max per trade
          requireConfirmation: false
        },
        dependencies: ['ai_decision'],
        condition: (context) => context.tradeSignals.some(signal => signal.confidence > 0.7)
      },
      {
        id: 'portfolio_sync',
        name: 'Sync Portfolio Data',
        type: 'portfolio_update' as const,
        configuration: {
          updateMetrics: true,
          broadcastUpdate: true
        },
        dependencies: ['trade_execution']
      },
      {
        id: 'notifications',
        name: 'Send Notifications',
        type: 'notification' as const,
        configuration: {
          channels: ['ag_ui', 'dashboard'],
          includeSummary: true
        },
        dependencies: ['portfolio_sync']
      }
    ]
  },

  RISK_MONITORING: {
    id: 'risk_monitoring',
    name: 'Continuous Risk Monitoring',
    description: 'Monitor portfolio risk and send alerts',
    steps: [
      {
        id: 'portfolio_check',
        name: 'Check Portfolio Status',
        type: 'portfolio_update' as const,
        configuration: {}
      },
      {
        id: 'risk_analysis',
        name: 'Analyze Risk Metrics',
        type: 'risk_assessment' as const,
        configuration: {
          thresholds: {
            maxDrawdown: 0.15,
            positionSize: 0.2,
            correlation: 0.8
          }
        },
        dependencies: ['portfolio_check']
      },
      {
        id: 'alert_if_needed',
        name: 'Send Risk Alerts',
        type: 'notification' as const,
        configuration: {
          alertTypes: ['risk_breach', 'position_limit', 'drawdown_warning']
        },
        dependencies: ['risk_analysis'],
        condition: (context) => context.riskMetrics.portfolioRisk > 0.8
      }
    ]
  },

  MARKET_OPPORTUNITY_SCANNER: {
    id: 'market_scanner',
    name: 'Market Opportunity Scanner',
    description: 'Scan for trading opportunities across multiple symbols',
    steps: [
      {
        id: 'scan_markets',
        name: 'Scan Market Data',
        type: 'market_analysis' as const,
        configuration: {
          symbols: ['BTC', 'ETH', 'SOL', 'AAPL', 'GOOGL', 'TSLA'],
          scanTypes: ['technical_breakout', 'volume_spike', 'sentiment_shift'],
          minConfidence: 0.6
        }
      },
      {
        id: 'opportunity_analysis',
        name: 'Analyze Opportunities',
        type: 'decision_making' as const,
        configuration: {
          rankByConfidence: true,
          maxOpportunities: 3
        },
        dependencies: ['scan_markets']
      },
      {
        id: 'notify_opportunities',
        name: 'Notify of Opportunities',
        type: 'notification' as const,
        configuration: {
          includeAnalysis: true,
          urgentThreshold: 0.9
        },
        dependencies: ['opportunity_analysis'],
        condition: (context) => context.tradeSignals.length > 0
      }
    ]
  }
}

export class TradingWorkflowOrchestrator extends EventEmitter {
  private workflows = new Map<string, TradingWorkflow>()
  private activeExecutions = new Set<string>()
  private llmService = getLLMService()
  private aguilClient = getAGUIClient()
  private mcpStore = useMCPInfrastructureStore.getState()

  constructor() {
    super()
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    // Listen for AG-UI events
    this.aguilClient.on('agent_decision', (data: AgentDecisionData) => {
      this.handleAgentDecision(data)
    })

    // Listen for MCP infrastructure events
    this.mcpStore.actions.addCommunication({
      id: `workflow_init_${Date.now()}`,
      senderId: 'workflow_orchestrator',
      receiverId: 'system',
      messageType: 'status',
      content: 'Workflow orchestrator initialized',
      timestamp: new Date(),
      status: 'sent',
      priority: 'low'
    })
  }

  // Create workflow from template
  createWorkflowFromTemplate(
    templateId: keyof typeof WORKFLOW_TEMPLATES,
    agentId: string,
    customConfig?: Partial<WorkflowContext>
  ): TradingWorkflow {
    const template = WORKFLOW_TEMPLATES[templateId]
    
    const workflow: TradingWorkflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      agentId,
      status: 'idle',
      steps: template.steps,
      currentStepIndex: 0,
      context: {
        agentId,
        agentConfig: {
          name: `Agent ${agentId}`,
          type: 'momentum',
          riskTolerance: 0.7,
          maxPositionSize: 50,
          llmProvider: 'openai-gpt4',
          llmModel: 'gpt-4-turbo-preview'
        },
        marketData: {},
        portfolioData: {
          balance: 100,
          positions: [],
          totalValue: 100,
          totalPnl: 0
        },
        tradeSignals: [],
        riskMetrics: {
          portfolioRisk: 0,
          positionRisk: 0,
          correlationRisk: 0
        },
        executedTrades: [],
        variables: {},
        ...customConfig
      },
      results: template.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
        timestamp: new Date()
      }))
    }

    this.workflows.set(workflow.id, workflow)
    this.emit('workflow_created', workflow)

    return workflow
  }

  // Start workflow execution
  async startWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    if (this.activeExecutions.has(workflowId)) {
      throw new Error(`Workflow ${workflowId} is already running`)
    }

    workflow.status = 'running'
    workflow.startedAt = new Date()
    workflow.currentStepIndex = 0
    this.activeExecutions.add(workflowId)

    this.emit('workflow_started', workflow)

    // Start MCP workflow tracking
    this.mcpStore.actions.startWorkflow({
      id: workflowId,
      name: workflow.name,
      status: 'running',
      progress: 0,
      agents: [workflow.agentId],
      startTime: new Date().toTimeString(),
      runtime: '0m',
      actions: 0,
      stepDetails: {
        currentStep: 1,
        totalSteps: workflow.steps.length,
        stepName: workflow.steps[0]?.name || 'Starting',
        stepStatus: 'pending'
      },
      metadata: {
        strategy: workflow.context.agentConfig.type,
        riskLevel: workflow.context.agentConfig.riskTolerance > 0.7 ? 'high' : 'medium',
        allocatedCapital: workflow.context.portfolioData.balance
      }
    })

    try {
      await this.executeWorkflow(workflow)
    } catch (error: any) {
      workflow.status = 'failed'
      workflow.error = error.message
      this.activeExecutions.delete(workflowId)
      this.emit('workflow_failed', { workflow, error })
    }
  }

  // Execute workflow steps
  private async executeWorkflow(workflow: TradingWorkflow): Promise<void> {
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i]
      workflow.currentStepIndex = i

      // Check dependencies
      if (step.dependencies) {
        const unmetDeps = step.dependencies.filter(depId => {
          const depResult = workflow.results.find(r => r.stepId === depId)
          return !depResult || depResult.status !== 'completed'
        })

        if (unmetDeps.length > 0) {
          throw new Error(`Unmet dependencies for step ${step.id}: ${unmetDeps.join(', ')}`)
        }
      }

      // Check condition
      if (step.condition && !step.condition(workflow.context)) {
        const result = workflow.results.find(r => r.stepId === step.id)!
        result.status = 'skipped'
        result.timestamp = new Date()
        continue
      }

      // Update MCP progress
      const progress = ((i + 1) / workflow.steps.length) * 100
      this.mcpStore.actions.updateWorkflowProgress(workflow.id, progress, {
        currentStep: i + 1,
        stepName: step.name,
        stepStatus: 'running'
      })

      try {
        await this.executeStep(workflow, step)
      } catch (error: any) {
        const result = workflow.results.find(r => r.stepId === step.id)!
        result.status = 'failed'
        result.error = error.message
        result.timestamp = new Date()
        throw error
      }
    }

    // Mark workflow as completed
    workflow.status = 'completed'
    workflow.completedAt = new Date()
    this.activeExecutions.delete(workflow.id)

    // Update MCP status
    this.mcpStore.actions.updateWorkflowProgress(workflow.id, 100, {
      currentStep: workflow.steps.length,
      stepName: 'Completed',
      stepStatus: 'completed'
    })

    this.emit('workflow_completed', workflow)
  }

  // Execute individual step
  private async executeStep(workflow: TradingWorkflow, step: WorkflowStep): Promise<void> {
    const result = workflow.results.find(r => r.stepId === step.id)!
    result.status = 'running'
    result.timestamp = new Date()

    const startTime = Date.now()

    try {
      switch (step.type) {
        case 'market_analysis':
          await this.executeMarketAnalysis(workflow, step)
          break

        case 'portfolio_update':
          await this.executePortfolioUpdate(workflow, step)
          break

        case 'risk_assessment':
          await this.executeRiskAssessment(workflow, step)
          break

        case 'decision_making':
          await this.executeDecisionMaking(workflow, step)
          break

        case 'trade_execution':
          await this.executeTradeExecution(workflow, step)
          break

        case 'notification':
          await this.executeNotification(workflow, step)
          break

        default:
          throw new Error(`Unknown step type: ${step.type}`)
      }

      result.status = 'completed'
      result.executionTime = Date.now() - startTime
      result.timestamp = new Date()

    } catch (error: any) {
      result.status = 'failed'
      result.error = error.message
      result.executionTime = Date.now() - startTime
      result.timestamp = new Date()
      throw error
    }
  }

  // Step Implementations
  private async executeMarketAnalysis(workflow: TradingWorkflow, step: WorkflowStep): Promise<void> {
    const { symbols, timeframes, indicators } = step.configuration

    // Mock market data collection - in production, use MCP market data servers
    const marketData: Record<string, any> = {}
    
    for (const symbol of symbols || ['BTC']) {
      marketData[symbol] = {
        price: Math.random() * 50000 + 20000,
        volume: Math.random() * 1000000,
        change: (Math.random() - 0.5) * 10,
        indicators: {
          rsi: Math.random() * 100,
          macd: Math.random() * 100 - 50,
          bollinger_position: Math.random()
        },
        timeframes: timeframes?.reduce((acc: any, tf: string) => {
          acc[tf] = {
            open: Math.random() * 50000 + 20000,
            high: Math.random() * 51000 + 20000,
            low: Math.random() * 49000 + 20000,
            close: Math.random() * 50000 + 20000
          }
          return acc
        }, {})
      }
    }

    workflow.context.marketData = marketData
  }

  private async executePortfolioUpdate(workflow: TradingWorkflow, step: WorkflowStep): Promise<void> {
    const engine = new PaperTradingEngine(workflow.agentId)
    
    try {
      const account = await engine.initializeAccount('Primary Account', 100.00)
      const portfolio = await engine.getPortfolio(account.id)
      const metrics = await engine.calculateMetrics(account.id)

      workflow.context.portfolioData = {
        balance: account.currentBalance,
        positions: portfolio.map(pos => ({
          symbol: pos.symbol,
          quantity: pos.quantity,
          avgPrice: pos.avgPrice,
          currentValue: pos.marketValue
        })),
        totalValue: account.currentBalance + portfolio.reduce((sum, pos) => sum + pos.marketValue, 0),
        totalPnl: metrics.totalPnl
      }
    } catch (error) {
      // Fallback to mock data
      workflow.context.portfolioData = {
        balance: 100,
        positions: [],
        totalValue: 100,
        totalPnl: 0
      }
    }
  }

  private async executeRiskAssessment(workflow: TradingWorkflow, step: WorkflowStep): Promise<void> {
    const { portfolioData } = workflow.context
    const { thresholds } = step.configuration

    // Calculate risk metrics
    const totalValue = portfolioData.totalValue
    const maxPositionValue = Math.max(...portfolioData.positions.map(p => p.currentValue), 0)
    const positionRisk = totalValue > 0 ? maxPositionValue / totalValue : 0

    // Mock correlation calculation
    const correlationRisk = portfolioData.positions.length > 1 ? Math.random() * 0.8 : 0

    // Portfolio risk score (0-1)
    const portfolioRisk = Math.min(1, (positionRisk * 0.5) + (correlationRisk * 0.3) + (Math.abs(portfolioData.totalPnl) / totalValue * 0.2))

    workflow.context.riskMetrics = {
      portfolioRisk,
      positionRisk,
      correlationRisk
    }

    // Check against thresholds
    if (thresholds) {
      if (positionRisk > (thresholds.positionSize || 0.2)) {
        throw new Error(`Position size risk exceeded: ${(positionRisk * 100).toFixed(1)}%`)
      }
      if (correlationRisk > (thresholds.correlation || 0.8)) {
        throw new Error(`Correlation risk exceeded: ${(correlationRisk * 100).toFixed(1)}%`)
      }
    }
  }

  private async executeDecisionMaking(workflow: TradingWorkflow, step: WorkflowStep): Promise<void> {
    const { confidenceThreshold = 0.7 } = step.configuration
    const { agentConfig, marketData, portfolioData, riskMetrics } = workflow.context

    const request: AgentDecisionRequest = {
      agentId: workflow.agentId,
      agentName: agentConfig.name,
      agentType: agentConfig.type,
      personality: {
        riskTolerance: agentConfig.riskTolerance,
        maxPositionSize: agentConfig.maxPositionSize,
        tradingStyle: agentConfig.type
      },
      marketData,
      portfolioStatus: portfolioData,
      riskLimits: {
        maxDrawdown: 0.15,
        maxPositionSize: agentConfig.maxPositionSize / 100,
        riskPerTrade: 0.05
      },
      context: `Analyze current market conditions and portfolio status. Make trading recommendations.`,
      availableFunctions: ['place_order', 'cancel_order', 'get_market_data', 'analyze_risk']
    }

    const decision = await this.llmService.generateAgentDecision(agentConfig.llmProvider, request)

    // Convert decision to trade signals
    const tradeSignals = []

    if (decision.decisionType === 'trade' && decision.action && decision.symbol && decision.confidence >= confidenceThreshold) {
      tradeSignals.push({
        symbol: decision.symbol,
        action: decision.action,
        confidence: decision.confidence,
        reasoning: decision.reasoning
      })
    }

    workflow.context.tradeSignals = tradeSignals

    // Send decision via AG-UI
    this.aguilClient.sendAgentDecision(workflow.agentId, {
      agentId: workflow.agentId,
      agentName: agentConfig.name,
      decisionType: decision.decisionType,
      symbol: decision.symbol,
      reasoning: decision.reasoning,
      confidenceScore: decision.confidence,
      marketData: { llmDecision: decision },
      actionTaken: tradeSignals.length > 0
    })
  }

  private async executeTradeExecution(workflow: TradingWorkflow, step: WorkflowStep): Promise<void> {
    const { paperTradingMode = true, maxTradeSize = 50 } = step.configuration
    const { agentConfig, tradeSignals } = workflow.context

    if (!paperTradingMode) {
      throw new Error('Live trading not implemented yet')
    }

    const engine = new PaperTradingEngine(workflow.agentId)
    const account = await engine.initializeAccount('Primary Account', 100.00)
    const executedTrades = []

    for (const signal of tradeSignals) {
      try {
        const order: PaperTradeOrder = {
          agentId: workflow.agentId,
          accountId: account.id,
          symbol: signal.symbol,
          side: signal.action === 'hold' ? 'buy' : signal.action, // Default hold to buy
          orderType: 'market',
          quantity: Math.min(maxTradeSize, signal.confidence * maxTradeSize),
          price: 0,
          strategy: 'workflow_automated',
          reasoning: signal.reasoning
        }

        const tradeId = await engine.placeOrder(order)
        
        executedTrades.push({
          id: tradeId,
          symbol: signal.symbol,
          side: order.side,
          quantity: order.quantity,
          executedPrice: 0, // Will be filled by engine
          timestamp: new Date().toISOString()
        })

        // Send trade notification via AG-UI
        this.aguilClient.sendTradeSignal({
          agentId: workflow.agentId,
          symbol: signal.symbol,
          side: order.side,
          orderType: 'market',
          quantity: order.quantity,
          strategy: 'workflow_automated',
          reasoning: signal.reasoning,
          confidence: signal.confidence
        })

      } catch (error: any) {
        console.error(`Failed to execute trade for ${signal.symbol}:`, error.message)
      }
    }

    workflow.context.executedTrades = executedTrades
  }

  private async executeNotification(workflow: TradingWorkflow, step: WorkflowStep): Promise<void> {
    const { channels = ['ag_ui'], includeSummary = true } = step.configuration
    const { executedTrades, portfolioData, tradeSignals } = workflow.context

    const summary = includeSummary ? {
      workflowName: workflow.name,
      agentId: workflow.agentId,
      executedTrades: executedTrades.length,
      totalSignals: tradeSignals.length,
      portfolioValue: portfolioData.totalValue,
      portfolioPnL: portfolioData.totalPnl,
      completedAt: new Date().toISOString()
    } : null

    if (channels.includes('ag_ui')) {
      this.aguilClient.sendMessage('notification' as AGUIMessageType, {
        type: 'workflow_completed',
        workflowId: workflow.id,
        agentId: workflow.agentId,
        summary,
        timestamp: new Date().toISOString()
      })
    }

    if (channels.includes('mcp')) {
      this.mcpStore.actions.addCommunication({
        id: `workflow_notification_${Date.now()}`,
        senderId: workflow.agentId,
        receiverId: 'system',
        messageType: 'workflow_completed',
        content: `Workflow ${workflow.name} completed with ${executedTrades.length} trades executed`,
        timestamp: new Date(),
        status: 'sent',
        priority: 'medium',
        metadata: summary
      })
    }

    this.emit('notification_sent', { workflow, summary })
  }

  // Event Handlers
  private handleAgentDecision(data: AgentDecisionData): void {
    // Find workflows for this agent
    const agentWorkflows = Array.from(this.workflows.values())
      .filter(wf => wf.agentId === data.agentId && wf.status === 'running')

    // Update workflow context with decision data
    agentWorkflows.forEach(workflow => {
      workflow.context.variables.lastDecision = data
      workflow.context.variables.lastDecisionTime = new Date().toISOString()
    })
  }

  // Public API
  getWorkflow(workflowId: string): TradingWorkflow | undefined {
    return this.workflows.get(workflowId)
  }

  getAllWorkflows(): TradingWorkflow[] {
    return Array.from(this.workflows.values())
  }

  getActiveWorkflows(): TradingWorkflow[] {
    return Array.from(this.workflows.values()).filter(wf => wf.status === 'running')
  }

  pauseWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId)
    if (workflow && workflow.status === 'running') {
      workflow.status = 'paused'
      this.activeExecutions.delete(workflowId)
      this.mcpStore.actions.pauseWorkflow(workflowId)
      this.emit('workflow_paused', workflow)
    }
  }

  resumeWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId)
    if (workflow && workflow.status === 'paused') {
      workflow.status = 'running'
      this.activeExecutions.add(workflowId)
      this.mcpStore.actions.resumeWorkflow(workflowId)
      this.emit('workflow_resumed', workflow)
      
      // Continue execution from current step
      this.executeWorkflow(workflow).catch(error => {
        workflow.status = 'failed'
        workflow.error = error.message
        this.activeExecutions.delete(workflowId)
        this.emit('workflow_failed', { workflow, error })
      })
    }
  }

  stopWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId)
    if (workflow && (workflow.status === 'running' || workflow.status === 'paused')) {
      workflow.status = 'completed'
      workflow.completedAt = new Date()
      this.activeExecutions.delete(workflowId)
      this.mcpStore.actions.stopWorkflow(workflowId)
      this.emit('workflow_stopped', workflow)
    }
  }

  deleteWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId)
    if (workflow) {
      if (workflow.status === 'running') {
        this.stopWorkflow(workflowId)
      }
      this.workflows.delete(workflowId)
      this.emit('workflow_deleted', workflow)
      return true
    }
    return false
  }
}

// Singleton instance
let orchestrator: TradingWorkflowOrchestrator | null = null

export function getTradingWorkflowOrchestrator(): TradingWorkflowOrchestrator {
  if (!orchestrator) {
    orchestrator = new TradingWorkflowOrchestrator()
  }
  return orchestrator
}

export default TradingWorkflowOrchestrator