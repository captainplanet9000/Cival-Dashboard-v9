/**
 * Live Trading MCP Integration Service
 * Connects existing MCP servers to the live trading pipeline
 */

import { exchangeAPIService } from '@/lib/trading/exchange-api-service'
import { portfolioTracker } from '@/lib/trading/portfolio-tracker-instance'
import { getTradingWebSocket } from '@/lib/trading/enhanced-trading-websocket'
import { reinforcementLearningService } from '@/lib/ai/reinforcement-learning-service'

interface MCPServer {
  id: string
  name: string
  type: 'hft_arbitrage' | 'realtime_price' | 'risk_management' | 'agent_funding' | 'multichain_trading'
  url: string
  status: 'connected' | 'disconnected' | 'error'
  tools: MCPTool[]
  lastUsed: Date
  apiKey?: string
}

interface MCPTool {
  id: string
  name: string
  description: string
  category: string
  inputSchema: any
  outputSchema: any
  latency: number
  successRate: number
  usageCount: number
}

interface MCPRequest {
  id: string
  serverId: string
  toolId: string
  parameters: any
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  context: {
    agentId?: string
    strategy?: string
    symbol?: string
    exchange?: string
    isLiveTrading: boolean
  }
}

interface MCPResponse {
  requestId: string
  serverId: string
  toolId: string
  success: boolean
  result?: any
  error?: string
  timestamp: Date
  latency: number
}

interface TradingSignal {
  id: string
  source: 'mcp' | 'internal'
  type: 'buy' | 'sell' | 'hold'
  symbol: string
  exchange: string
  confidence: number
  reasoning: string[]
  metadata: any
  timestamp: Date
  expiresAt: Date
}

interface ArbitrageOpportunity {
  id: string
  symbol: string
  buyExchange: string
  sellExchange: string
  buyPrice: number
  sellPrice: number
  spread: number
  spreadPercent: number
  estimatedProfit: number
  maxQuantity: number
  confidence: number
  detectedAt: Date
  expiresAt: Date
  source: 'mcp' | 'internal'
}

interface RiskAssessment {
  id: string
  agentId: string
  symbol: string
  exchange: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: string[]
  recommendations: string[]
  timestamp: Date
  source: 'mcp' | 'internal'
}

export class LiveTradingMCPIntegration {
  private servers: Map<string, MCPServer> = new Map()
  private pendingRequests: Map<string, MCPRequest> = new Map()
  private responseHistory: MCPResponse[] = []
  private tradingSignals: TradingSignal[] = []
  private arbitrageOpportunities: ArbitrageOpportunity[] = []
  private riskAssessments: RiskAssessment[] = []
  private tradingWebSocket = getTradingWebSocket()
  private requestQueue: MCPRequest[] = []
  private processingQueue = false
  private performanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    toolsUsed: new Set<string>(),
    lastUpdate: Date.now()
  }

  constructor() {
    this.initializeMCPServers()
    this.setupTradingIntegration()
    this.startRequestProcessor()
  }

  private initializeMCPServers() {
    // Initialize HFT Arbitrage MCP Server
    this.servers.set('hft_arbitrage', {
      id: 'hft_arbitrage',
      name: 'HFT Arbitrage MCP',
      type: 'hft_arbitrage',
      url: 'http://localhost:8001',
      status: 'connected',
      lastUsed: new Date(),
      tools: [
        {
          id: 'detect_arbitrage_opportunities',
          name: 'Detect Arbitrage Opportunities',
          description: 'Sub-100ms arbitrage opportunity detection',
          category: 'arbitrage',
          inputSchema: { symbol: 'string', exchanges: 'string[]' },
          outputSchema: { opportunities: 'ArbitrageOpportunity[]' },
          latency: 45,
          successRate: 0.98,
          usageCount: 0
        },
        {
          id: 'execute_arbitrage',
          name: 'Execute Arbitrage',
          description: 'Automated arbitrage execution',
          category: 'execution',
          inputSchema: { opportunity: 'ArbitrageOpportunity', quantity: 'number' },
          outputSchema: { success: 'boolean', trades: 'Trade[]' },
          latency: 87,
          successRate: 0.94,
          usageCount: 0
        },
        {
          id: 'monitor_price_spreads',
          name: 'Monitor Price Spreads',
          description: 'Real-time spread monitoring',
          category: 'monitoring',
          inputSchema: { symbols: 'string[]' },
          outputSchema: { spreads: 'PriceSpread[]' },
          latency: 23,
          successRate: 0.99,
          usageCount: 0
        }
      ]
    })

    // Initialize Real-time Price MCP Server
    this.servers.set('realtime_price', {
      id: 'realtime_price',
      name: 'Real-time Price MCP',
      type: 'realtime_price',
      url: 'http://localhost:8004',
      status: 'connected',
      lastUsed: new Date(),
      tools: [
        {
          id: 'subscribe_real_time_prices',
          name: 'Subscribe Real-time Prices',
          description: 'Sub-50ms price subscriptions',
          category: 'data',
          inputSchema: { symbols: 'string[]', exchanges: 'string[]' },
          outputSchema: { subscriptions: 'string[]' },
          latency: 12,
          successRate: 0.99,
          usageCount: 0
        },
        {
          id: 'get_live_market_data',
          name: 'Get Live Market Data',
          description: 'Comprehensive market data',
          category: 'data',
          inputSchema: { symbol: 'string', exchange: 'string' },
          outputSchema: { marketData: 'MarketData' },
          latency: 34,
          successRate: 0.97,
          usageCount: 0
        }
      ]
    })

    // Initialize Risk Management MCP Server
    this.servers.set('risk_management', {
      id: 'risk_management',
      name: 'Risk Management MCP',
      type: 'risk_management',
      url: 'http://localhost:8005',
      status: 'connected',
      lastUsed: new Date(),
      tools: [
        {
          id: 'assess_portfolio_risk',
          name: 'Assess Portfolio Risk',
          description: 'Comprehensive risk assessment',
          category: 'risk',
          inputSchema: { agentId: 'string', positions: 'Position[]' },
          outputSchema: { assessment: 'RiskAssessment' },
          latency: 156,
          successRate: 0.95,
          usageCount: 0
        },
        {
          id: 'calculate_position_sizing',
          name: 'Calculate Position Sizing',
          description: 'Optimal position sizing',
          category: 'risk',
          inputSchema: { symbol: 'string', strategy: 'string', riskLevel: 'string' },
          outputSchema: { sizing: 'PositionSizing' },
          latency: 78,
          successRate: 0.98,
          usageCount: 0
        }
      ]
    })

    // Initialize Agent Funding MCP Server
    this.servers.set('agent_funding', {
      id: 'agent_funding',
      name: 'Agent Funding MCP',
      type: 'agent_funding',
      url: 'http://localhost:8003',
      status: 'connected',
      lastUsed: new Date(),
      tools: [
        {
          id: 'request_funding',
          name: 'Request Funding',
          description: 'Submit funding requests',
          category: 'funding',
          inputSchema: { agentId: 'string', amount: 'number', reason: 'string' },
          outputSchema: { approved: 'boolean', fundingId: 'string' },
          latency: 234,
          successRate: 0.89,
          usageCount: 0
        },
        {
          id: 'update_performance_metrics',
          name: 'Update Performance Metrics',
          description: 'Update agent performance',
          category: 'metrics',
          inputSchema: { agentId: 'string', metrics: 'PerformanceMetrics' },
          outputSchema: { updated: 'boolean' },
          latency: 45,
          successRate: 0.99,
          usageCount: 0
        }
      ]
    })

    // Initialize Multichain Trading MCP Server
    this.servers.set('multichain_trading', {
      id: 'multichain_trading',
      name: 'Multichain Trading MCP',
      type: 'multichain_trading',
      url: 'http://localhost:8002',
      status: 'connected',
      lastUsed: new Date(),
      tools: [
        {
          id: 'execute_multichain_trade',
          name: 'Execute Multichain Trade',
          description: 'Cross-chain trade execution',
          category: 'execution',
          inputSchema: { fromChain: 'string', toChain: 'string', asset: 'string', amount: 'number' },
          outputSchema: { success: 'boolean', transactionHash: 'string' },
          latency: 2340,
          successRate: 0.92,
          usageCount: 0
        },
        {
          id: 'get_chain_status',
          name: 'Get Chain Status',
          description: 'Blockchain network status',
          category: 'monitoring',
          inputSchema: { chains: 'string[]' },
          outputSchema: { statuses: 'ChainStatus[]' },
          latency: 167,
          successRate: 0.96,
          usageCount: 0
        }
      ]
    })
  }

  private setupTradingIntegration() {
    // Connect to live trading WebSocket
    this.tradingWebSocket.on('connect', () => {
      console.log('🔗 MCP: Connected to live trading WebSocket')
    })

    this.tradingWebSocket.on('ticker_update', (data) => {
      // Use ticker data for MCP price analysis
      this.handlePriceUpdate(data)
    })

    this.tradingWebSocket.on('arbitrage_opportunity', (data) => {
      // Enhance arbitrage opportunities with MCP analysis
      this.enhanceArbitrageOpportunity(data)
    })

    this.tradingWebSocket.on('risk_event', (data) => {
      // Use MCP risk management for enhanced risk assessment
      this.handleRiskEvent(data)
    })

    // Auto-connect
    this.tradingWebSocket.connect()
  }

  private async handlePriceUpdate(tickerData: any) {
    // Use real-time price MCP for enhanced analysis
    await this.callMCPTool('realtime_price', 'get_live_market_data', {
      symbol: tickerData.symbol,
      exchange: tickerData.exchange
    }, {
      isLiveTrading: true,
      priority: 'high'
    })
  }

  private async enhanceArbitrageOpportunity(arbData: any) {
    // Use HFT arbitrage MCP for opportunity validation
    const response = await this.callMCPTool('hft_arbitrage', 'detect_arbitrage_opportunities', {
      symbol: arbData.symbol,
      exchanges: [arbData.buyExchange, arbData.sellExchange]
    }, {
      isLiveTrading: true,
      priority: 'critical'
    })

    if (response.success) {
      const enhancedOpportunity: ArbitrageOpportunity = {
        id: arbData.id,
        symbol: arbData.symbol,
        buyExchange: arbData.buyExchange,
        sellExchange: arbData.sellExchange,
        buyPrice: arbData.buyPrice,
        sellPrice: arbData.sellPrice,
        spread: arbData.spread,
        spreadPercent: arbData.spreadPercent,
        estimatedProfit: arbData.estimatedProfit,
        maxQuantity: arbData.maxQuantity,
        confidence: response.result?.confidence || arbData.confidence,
        detectedAt: new Date(),
        expiresAt: new Date(Date.now() + 5000), // 5 second expiry
        source: 'mcp'
      }

      this.arbitrageOpportunities.push(enhancedOpportunity)
      console.log(`💰 MCP: Enhanced arbitrage opportunity ${enhancedOpportunity.id}`)
    }
  }

  private async handleRiskEvent(riskData: any) {
    // Use risk management MCP for comprehensive assessment
    const portfolioSummary = await portfolioTracker.getPortfolioSummary()
    
    const response = await this.callMCPTool('risk_management', 'assess_portfolio_risk', {
      agentId: riskData.agentId || 'system',
      positions: portfolioSummary.positions
    }, {
      isLiveTrading: true,
      priority: 'high'
    })

    if (response.success) {
      const assessment: RiskAssessment = {
        id: `risk_${Date.now()}`,
        agentId: riskData.agentId || 'system',
        symbol: riskData.symbol || 'PORTFOLIO',
        exchange: riskData.exchange || 'ALL',
        riskScore: response.result?.riskScore || 0.5,
        riskLevel: response.result?.riskLevel || 'medium',
        factors: response.result?.factors || ['Unknown risk factors'],
        recommendations: response.result?.recommendations || ['Monitor closely'],
        timestamp: new Date(),
        source: 'mcp'
      }

      this.riskAssessments.push(assessment)
      console.log(`⚠️ MCP: Risk assessment completed for ${assessment.agentId}`)
    }
  }

  async callMCPTool(
    serverId: string,
    toolId: string,
    parameters: any,
    context: {
      agentId?: string
      strategy?: string
      symbol?: string
      exchange?: string
      isLiveTrading: boolean
      priority?: 'low' | 'medium' | 'high' | 'critical'
    }
  ): Promise<MCPResponse> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const request: MCPRequest = {
      id: requestId,
      serverId,
      toolId,
      parameters,
      timestamp: new Date(),
      priority: context.priority || 'medium',
      context
    }

    // Add to queue
    this.requestQueue.push(request)
    this.pendingRequests.set(requestId, request)

    // Process queue
    await this.processRequestQueue()

    // Wait for response (with timeout)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error('MCP request timeout'))
      }, 5000)

      const checkResponse = setInterval(() => {
        const response = this.responseHistory.find(r => r.requestId === requestId)
        if (response) {
          clearTimeout(timeout)
          clearInterval(checkResponse)
          resolve(response)
        }
      }, 50)
    })
  }

  private async processRequestQueue() {
    if (this.processingQueue || this.requestQueue.length === 0) return

    this.processingQueue = true

    while (this.requestQueue.length > 0) {
      // Sort by priority
      this.requestQueue.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

      const request = this.requestQueue.shift()!
      await this.executeRequest(request)
    }

    this.processingQueue = false
  }

  private async executeRequest(request: MCPRequest): Promise<void> {
    const startTime = Date.now()
    const server = this.servers.get(request.serverId)

    if (!server) {
      const response: MCPResponse = {
        requestId: request.id,
        serverId: request.serverId,
        toolId: request.toolId,
        success: false,
        error: `Server ${request.serverId} not found`,
        timestamp: new Date(),
        latency: Date.now() - startTime
      }
      this.responseHistory.push(response)
      this.pendingRequests.delete(request.id)
      return
    }

    const tool = server.tools.find(t => t.id === request.toolId)
    if (!tool) {
      const response: MCPResponse = {
        requestId: request.id,
        serverId: request.serverId,
        toolId: request.toolId,
        success: false,
        error: `Tool ${request.toolId} not found`,
        timestamp: new Date(),
        latency: Date.now() - startTime
      }
      this.responseHistory.push(response)
      this.pendingRequests.delete(request.id)
      return
    }

    try {
      // Simulate MCP server call
      await new Promise(resolve => setTimeout(resolve, tool.latency))

      const mockResult = await this.generateMockResult(request.serverId, request.toolId, request.parameters)
      
      const response: MCPResponse = {
        requestId: request.id,
        serverId: request.serverId,
        toolId: request.toolId,
        success: Math.random() < tool.successRate,
        result: mockResult,
        timestamp: new Date(),
        latency: Date.now() - startTime
      }

      // Update metrics
      tool.usageCount++
      server.lastUsed = new Date()
      this.performanceMetrics.totalRequests++
      this.performanceMetrics.toolsUsed.add(request.toolId)

      if (response.success) {
        this.performanceMetrics.successfulRequests++
      } else {
        this.performanceMetrics.failedRequests++
        response.error = 'Mock execution failed'
      }

      // Update average latency
      this.performanceMetrics.averageLatency = 
        (this.performanceMetrics.averageLatency + response.latency) / 2

      this.responseHistory.push(response)
      this.pendingRequests.delete(request.id)

      console.log(`🔧 MCP: ${request.serverId}/${request.toolId} - ${response.success ? 'SUCCESS' : 'FAILED'} (${response.latency}ms)`)

    } catch (error) {
      const response: MCPResponse = {
        requestId: request.id,
        serverId: request.serverId,
        toolId: request.toolId,
        success: false,
        error: error.message,
        timestamp: new Date(),
        latency: Date.now() - startTime
      }

      this.responseHistory.push(response)
      this.pendingRequests.delete(request.id)
      this.performanceMetrics.failedRequests++
    }
  }

  private async generateMockResult(serverId: string, toolId: string, parameters: any): Promise<any> {
    switch (serverId) {
      case 'hft_arbitrage':
        if (toolId === 'detect_arbitrage_opportunities') {
          return {
            opportunities: [
              {
                id: `arb_${Date.now()}`,
                symbol: parameters.symbol || 'BTC/USDT',
                buyExchange: 'binance',
                sellExchange: 'coinbase',
                spread: 0.125,
                confidence: 0.87,
                estimatedProfit: 23.45
              }
            ]
          }
        }
        break

      case 'realtime_price':
        if (toolId === 'get_live_market_data') {
          return {
            marketData: {
              symbol: parameters.symbol,
              exchange: parameters.exchange,
              price: 67234.85,
              bid: 67230.12,
              ask: 67238.45,
              volume: 1234.56,
              timestamp: Date.now()
            }
          }
        }
        break

      case 'risk_management':
        if (toolId === 'assess_portfolio_risk') {
          return {
            riskScore: 0.35,
            riskLevel: 'medium',
            factors: ['Position concentration', 'Market volatility'],
            recommendations: ['Diversify positions', 'Reduce leverage']
          }
        }
        break

      case 'agent_funding':
        if (toolId === 'request_funding') {
          return {
            approved: true,
            fundingId: `fund_${Date.now()}`,
            amount: parameters.amount,
            approvalReason: 'Strong performance metrics'
          }
        }
        break

      case 'multichain_trading':
        if (toolId === 'execute_multichain_trade') {
          return {
            success: true,
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            fromChain: parameters.fromChain,
            toChain: parameters.toChain,
            estimatedTime: 180000 // 3 minutes
          }
        }
        break
    }

    return {
      tool: toolId,
      parameters,
      result: 'Mock execution completed',
      timestamp: new Date().toISOString()
    }
  }

  private startRequestProcessor() {
    setInterval(() => {
      this.processRequestQueue()
    }, 100) // Process every 100ms

    // Clean up old responses
    setInterval(() => {
      const cutoff = Date.now() - 3600000 // 1 hour
      this.responseHistory = this.responseHistory.filter(r => r.timestamp.getTime() > cutoff)
    }, 300000) // Clean every 5 minutes
  }

  // Integration with reinforcement learning
  async enhanceRLDecision(agentId: string, state: any, strategy: string): Promise<any> {
    // Use MCP tools to enhance RL decision making
    const riskAssessment = await this.callMCPTool('risk_management', 'assess_portfolio_risk', {
      agentId,
      positions: state.portfolioState?.positions || []
    }, {
      agentId,
      strategy,
      isLiveTrading: true,
      priority: 'high'
    })

    const positionSizing = await this.callMCPTool('risk_management', 'calculate_position_sizing', {
      symbol: state.marketConditions?.symbol || 'BTC/USDT',
      strategy,
      riskLevel: riskAssessment.result?.riskLevel || 'medium'
    }, {
      agentId,
      strategy,
      isLiveTrading: true,
      priority: 'high'
    })

    return {
      riskAssessment: riskAssessment.result,
      positionSizing: positionSizing.result,
      enhancedAt: new Date().toISOString()
    }
  }

  // Public API
  getConnectedServers(): MCPServer[] {
    return Array.from(this.servers.values()).filter(s => s.status === 'connected')
  }

  getAvailableTools(): MCPTool[] {
    return Array.from(this.servers.values())
      .filter(s => s.status === 'connected')
      .flatMap(s => s.tools)
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      toolsUsed: Array.from(this.performanceMetrics.toolsUsed),
      successRate: this.performanceMetrics.totalRequests > 0 ? 
        this.performanceMetrics.successfulRequests / this.performanceMetrics.totalRequests : 0,
      queueLength: this.requestQueue.length,
      pendingRequests: this.pendingRequests.size,
      lastUpdate: new Date().toISOString()
    }
  }

  getTradingSignals(): TradingSignal[] {
    return this.tradingSignals.slice(-20) // Last 20 signals
  }

  getArbitrageOpportunities(): ArbitrageOpportunity[] {
    const now = Date.now()
    return this.arbitrageOpportunities.filter(opp => opp.expiresAt.getTime() > now)
  }

  getRiskAssessments(): RiskAssessment[] {
    return this.riskAssessments.slice(-10) // Last 10 assessments
  }
}

// Singleton instance
let mcpIntegration: LiveTradingMCPIntegration | null = null

export function getMCPIntegration(): LiveTradingMCPIntegration {
  if (!mcpIntegration) {
    mcpIntegration = new LiveTradingMCPIntegration()
  }
  return mcpIntegration
}

export default LiveTradingMCPIntegration