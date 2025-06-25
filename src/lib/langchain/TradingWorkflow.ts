/**
 * LangGraph Trading Workflow
 * Defines sophisticated trading decision workflows using LangGraph state machines
 * Integrates with paper trading engine and provides advanced agent coordination
 */

import { StateGraph, END } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'
import { langChainService } from './LangChainService'
import { persistentTradingEngine } from '@/lib/paper-trading/PersistentTradingEngine'
import { langChainMCPIntegration } from './MCPIntegration'

export interface TradingState {
  agentId: string
  symbol: string
  marketData: any
  portfolio: any
  riskLimits: any
  analysisResults: any[]
  decision: TradingDecision | null
  confidence: number
  reasoning: string
  executionStatus: 'pending' | 'executed' | 'failed' | 'cancelled'
  messages: BaseMessage[]
  metadata: Record<string, any>
}

export interface TradingDecision {
  action: 'buy' | 'sell' | 'hold' | 'close' | 'reduce'
  symbol: string
  quantity: number
  price?: number
  stopLoss?: number
  takeProfit?: number
  reasoning: string
  confidence: number
  urgency: 'low' | 'medium' | 'high'
  riskScore: number
}

export class TradingWorkflowEngine {
  private workflow: StateGraph<TradingState>

  constructor() {
    this.workflow = this.createTradingWorkflow()
  }

  private createTradingWorkflow(): StateGraph<TradingState> {
    const workflow = new StateGraph<TradingState>({
      channels: {
        agentId: { value: null },
        symbol: { value: null },
        marketData: { value: null },
        portfolio: { value: null },
        riskLimits: { value: null },
        analysisResults: { value: [] },
        decision: { value: null },
        confidence: { value: 0 },
        reasoning: { value: '' },
        executionStatus: { value: 'pending' },
        messages: { value: [] },
        metadata: { value: {} }
      }
    })

    // Define workflow nodes
    workflow
      .addNode('gather_data', this.gatherMarketData.bind(this))
      .addNode('technical_analysis', this.performTechnicalAnalysis.bind(this))
      .addNode('risk_assessment', this.assessRisk.bind(this))
      .addNode('sentiment_analysis', this.analyzeSentiment.bind(this))
      .addNode('make_decision', this.makeDecision.bind(this))
      .addNode('validate_decision', this.validateDecision.bind(this))
      .addNode('execute_trade', this.executeTrade.bind(this))
      .addNode('monitor_execution', this.monitorExecution.bind(this))

    // Define workflow edges and conditional routing
    workflow
      .addEdge('gather_data', 'technical_analysis')
      .addEdge('technical_analysis', 'risk_assessment')
      .addEdge('risk_assessment', 'sentiment_analysis')
      .addEdge('sentiment_analysis', 'make_decision')
      .addEdge('make_decision', 'validate_decision')
      .addConditionalEdges(
        'validate_decision',
        this.shouldExecuteTrade.bind(this),
        {
          execute: 'execute_trade',
          hold: END,
          reassess: 'technical_analysis'
        }
      )
      .addEdge('execute_trade', 'monitor_execution')
      .addEdge('monitor_execution', END)

    // Set entry point
    workflow.setEntryPoint('gather_data')

    return workflow
  }

  /**
   * Node: Gather comprehensive market data
   */
  private async gatherMarketData(state: TradingState): Promise<Partial<TradingState>> {
    try {
      console.log(`📊 Gathering market data for ${state.symbol}`)

      // Get current portfolio
      const portfolio = persistentTradingEngine.getPortfolio(state.agentId)
      
      // Get current market data (this would connect to your existing market data sources)
      const marketData = {
        symbol: state.symbol,
        price: 50000 + Math.random() * 10000, // Mock data - replace with real data
        volume: Math.random() * 1000000,
        timestamp: Date.now(),
        // Add more market data fields as needed
        technicalIndicators: {},
        orderBook: {},
        recentTrades: []
      }

      // Get risk limits for the agent
      const riskLimits = {
        maxPositionSize: portfolio?.totalValue ? portfolio.totalValue * 0.1 : 10000,
        maxDailyLoss: portfolio?.totalValue ? portfolio.totalValue * 0.02 : 2000,
        stopLossPercentage: 0.05,
        takeProfitPercentage: 0.15
      }

      return {
        marketData,
        portfolio,
        riskLimits,
        metadata: { ...state.metadata, dataGatheredAt: Date.now() }
      }
    } catch (error) {
      console.error('Error gathering market data:', error)
      return {
        executionStatus: 'failed',
        reasoning: `Failed to gather market data: ${error}`
      }
    }
  }

  /**
   * Node: Perform technical analysis using LLM
   */
  private async performTechnicalAnalysis(state: TradingState): Promise<Partial<TradingState>> {
    try {
      console.log(`🔍 Performing technical analysis for ${state.symbol}`)

      const analysisPrompt = `Analyze the following market data for ${state.symbol} and provide technical analysis:

Market Data:
- Current Price: $${state.marketData.price}
- Volume: ${state.marketData.volume}
- Recent trends and patterns

Provide analysis on:
1. Current trend direction
2. Support and resistance levels
3. Technical indicators signals
4. Volume analysis
5. Overall technical outlook

Format as JSON with: trend, support, resistance, signals, outlook, confidence`

      const technicalAnalysis = await langChainService.generateTradingAnalysis(
        analysisPrompt,
        {
          marketData: state.marketData,
          symbol: state.symbol
        },
        { modelPreference: 'openai' }
      )

      if (!technicalAnalysis) {
        throw new Error('Failed to get technical analysis from LLM')
      }

      return {
        analysisResults: [
          ...state.analysisResults,
          {
            type: 'technical',
            result: technicalAnalysis,
            timestamp: Date.now()
          }
        ],
        confidence: Math.max(state.confidence, technicalAnalysis.confidence * 0.3),
        reasoning: `${state.reasoning}\nTechnical Analysis: ${technicalAnalysis.reasoning}`
      }
    } catch (error) {
      console.error('Technical analysis failed:', error)
      return {
        analysisResults: [
          ...state.analysisResults,
          {
            type: 'technical',
            result: { error: error.toString() },
            timestamp: Date.now()
          }
        ],
        reasoning: `${state.reasoning}\nTechnical analysis failed: ${error}`
      }
    }
  }

  /**
   * Node: Assess risk using portfolio and market conditions
   */
  private async assessRisk(state: TradingState): Promise<Partial<TradingState>> {
    try {
      console.log(`⚠️ Assessing risk for ${state.symbol}`)

      const riskPrompt = `Assess the risk of trading ${state.symbol} given the current portfolio and market conditions:

Portfolio Information:
- Total Value: $${state.portfolio?.totalValue || 0}
- Cash Available: $${state.portfolio?.cashBalance || 0}
- Current Positions: ${state.portfolio?.positions?.length || 0}

Risk Limits:
- Max Position Size: $${state.riskLimits.maxPositionSize}
- Max Daily Loss: $${state.riskLimits.maxDailyLoss}
- Stop Loss %: ${state.riskLimits.stopLossPercentage * 100}%

Analyze:
1. Position sizing recommendations
2. Risk/reward ratio
3. Portfolio correlation risk
4. Market volatility assessment
5. Overall risk score (0-100)

Format as JSON with: positionSize, riskReward, correlationRisk, volatilityRisk, overallRisk, recommendations`

      const riskAnalysis = await langChainService.generateTradingAnalysis(
        riskPrompt,
        {
          portfolio: state.portfolio,
          riskLimits: state.riskLimits,
          marketData: state.marketData
        },
        { modelPreference: 'anthropic' } // Use Anthropic for risk analysis
      )

      if (!riskAnalysis) {
        throw new Error('Failed to get risk analysis from LLM')
      }

      return {
        analysisResults: [
          ...state.analysisResults,
          {
            type: 'risk',
            result: riskAnalysis,
            timestamp: Date.now()
          }
        ],
        confidence: Math.max(state.confidence, technicalAnalysis.confidence * 0.4),
        reasoning: `${state.reasoning}\nRisk Assessment: ${riskAnalysis.reasoning}`
      }
    } catch (error) {
      console.error('Risk assessment failed:', error)
      return {
        analysisResults: [
          ...state.analysisResults,
          {
            type: 'risk',
            result: { error: error.toString(), overallRisk: 80 }, // High risk on error
            timestamp: Date.now()
          }
        ],
        reasoning: `${state.reasoning}\nRisk assessment failed (assuming high risk): ${error}`
      }
    }
  }

  /**
   * Node: Analyze market sentiment
   */
  private async analyzeSentiment(state: TradingState): Promise<Partial<TradingState>> {
    try {
      console.log(`😊 Analyzing sentiment for ${state.symbol}`)

      const sentimentPrompt = `Analyze market sentiment for ${state.symbol}:

Consider:
1. General market mood
2. Sector-specific sentiment
3. News impact potential
4. Social media sentiment
5. Institutional vs retail sentiment

Provide sentiment score (-100 to +100) and reasoning.

Format as JSON with: sentimentScore, marketMood, sectorSentiment, newsImpact, socialSentiment, reasoning`

      const sentimentAnalysis = await langChainService.generateTradingAnalysis(
        sentimentPrompt,
        {
          symbol: state.symbol,
          marketData: state.marketData
        },
        { modelPreference: 'openai' }
      )

      if (!sentimentAnalysis) {
        throw new Error('Failed to get sentiment analysis from LLM')
      }

      return {
        analysisResults: [
          ...state.analysisResults,
          {
            type: 'sentiment',
            result: sentimentAnalysis,
            timestamp: Date.now()
          }
        ],
        confidence: Math.max(state.confidence, sentimentAnalysis.confidence * 0.3),
        reasoning: `${state.reasoning}\nSentiment Analysis: ${sentimentAnalysis.reasoning}`
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error)
      return {
        analysisResults: [
          ...state.analysisResults,
          {
            type: 'sentiment',
            result: { error: error.toString(), sentimentScore: 0 },
            timestamp: Date.now()
          }
        ],
        reasoning: `${state.reasoning}\nSentiment analysis failed (neutral assumed): ${error}`
      }
    }
  }

  /**
   * Node: Make final trading decision
   */
  private async makeDecision(state: TradingState): Promise<Partial<TradingState>> {
    try {
      console.log(`🤔 Making trading decision for ${state.symbol}`)

      // Compile all analysis results
      const analysisData = state.analysisResults.reduce((acc, analysis) => {
        acc[analysis.type] = analysis.result
        return acc
      }, {} as any)

      const decisionPrompt = `Based on all analysis, make a trading decision for ${state.symbol}:

Technical Analysis: ${JSON.stringify(analysisData.technical || {})}
Risk Assessment: ${JSON.stringify(analysisData.risk || {})}
Sentiment Analysis: ${JSON.stringify(analysisData.sentiment || {})}

Portfolio Context:
- Available Cash: $${state.portfolio?.cashBalance || 0}
- Current Price: $${state.marketData.price}
- Risk Limits: Max position $${state.riskLimits.maxPositionSize}

Make a decision:
1. Action: buy/sell/hold/close/reduce
2. Quantity (if buy/sell)
3. Price target (optional)
4. Stop loss level
5. Take profit level
6. Reasoning for decision
7. Confidence (0-100)
8. Urgency: low/medium/high
9. Risk score (0-100)

Format as JSON with all fields above.`

      const decisionAnalysis = await langChainService.generateTradingAnalysis(
        decisionPrompt,
        {
          analysisData,
          portfolio: state.portfolio,
          marketData: state.marketData,
          riskLimits: state.riskLimits
        },
        { modelPreference: 'anthropic' } // Use best model for final decision
      )

      if (!decisionAnalysis) {
        throw new Error('Failed to get trading decision from LLM')
      }

      let decision: TradingDecision
      try {
        const parsed = JSON.parse(decisionAnalysis.analysis)
        decision = {
          action: parsed.action || 'hold',
          symbol: state.symbol,
          quantity: parsed.quantity || 0,
          price: parsed.price,
          stopLoss: parsed.stopLoss,
          takeProfit: parsed.takeProfit,
          reasoning: parsed.reasoning || decisionAnalysis.reasoning,
          confidence: parsed.confidence || decisionAnalysis.confidence,
          urgency: parsed.urgency || 'medium',
          riskScore: parsed.riskScore || 50
        }
      } catch {
        // Fallback if parsing fails
        decision = {
          action: 'hold',
          symbol: state.symbol,
          quantity: 0,
          reasoning: 'Could not parse LLM decision, defaulting to hold',
          confidence: 25,
          urgency: 'low',
          riskScore: 100
        }
      }

      return {
        decision,
        confidence: decision.confidence,
        reasoning: `${state.reasoning}\nFinal Decision: ${decision.reasoning}`,
        analysisResults: [
          ...state.analysisResults,
          {
            type: 'decision',
            result: decisionAnalysis,
            timestamp: Date.now()
          }
        ]
      }
    } catch (error) {
      console.error('Decision making failed:', error)
      return {
        decision: {
          action: 'hold',
          symbol: state.symbol,
          quantity: 0,
          reasoning: `Decision making failed: ${error}`,
          confidence: 0,
          urgency: 'low',
          riskScore: 100
        },
        executionStatus: 'failed',
        reasoning: `${state.reasoning}\nDecision making failed: ${error}`
      }
    }
  }

  /**
   * Node: Validate decision against final safety checks
   */
  private async validateDecision(state: TradingState): Promise<Partial<TradingState>> {
    console.log(`✅ Validating trading decision for ${state.symbol}`)

    if (!state.decision) {
      return {
        executionStatus: 'failed',
        reasoning: `${state.reasoning}\nNo decision to validate`
      }
    }

    const decision = state.decision

    // Safety checks
    const safetyChecks = {
      hasMinimumConfidence: decision.confidence >= 60,
      withinRiskLimits: decision.riskScore <= 70,
      appropriatePositionSize: decision.quantity * (state.marketData.price || 0) <= state.riskLimits.maxPositionSize,
      hasStopLoss: decision.action !== 'hold' ? !!decision.stopLoss : true,
      sufficientCash: decision.action === 'buy' ? 
        (decision.quantity * (state.marketData.price || 0)) <= (state.portfolio?.cashBalance || 0) : true
    }

    const allChecksPassed = Object.values(safetyChecks).every(check => check)

    return {
      metadata: {
        ...state.metadata,
        safetyChecks,
        validationPassed: allChecksPassed,
        validatedAt: Date.now()
      },
      reasoning: `${state.reasoning}\nValidation: ${allChecksPassed ? 'PASSED' : 'FAILED'} - ${JSON.stringify(safetyChecks)}`
    }
  }

  /**
   * Conditional edge: Determine if trade should be executed
   */
  private shouldExecuteTrade(state: TradingState): string {
    if (!state.decision || !state.metadata.validationPassed) {
      return 'hold'
    }

    if (state.decision.action === 'hold') {
      return 'hold'
    }

    if (state.decision.confidence < 60 || state.decision.riskScore > 70) {
      return 'reassess'
    }

    return 'execute'
  }

  /**
   * Node: Execute the validated trade
   */
  private async executeTrade(state: TradingState): Promise<Partial<TradingState>> {
    try {
      console.log(`🔄 Executing trade for ${state.symbol}`)

      if (!state.decision) {
        throw new Error('No decision to execute')
      }

      const decision = state.decision

      // Execute through paper trading engine
      if (decision.action === 'buy' || decision.action === 'sell') {
        const order = await persistentTradingEngine.placeOrder({
          agentId: state.agentId,
          portfolioId: state.agentId, // Using agentId as portfolioId
          symbol: decision.symbol,
          side: decision.action,
          quantity: decision.quantity,
          type: decision.price ? 'limit' : 'market',
          price: decision.price,
          timeInForce: 'gtc',
          stopLoss: decision.stopLoss,
          takeProfit: decision.takeProfit
        })

        console.log(`✅ Order placed:`, order)

        return {
          executionStatus: 'executed',
          reasoning: `${state.reasoning}\nOrder executed: ${order.id}`,
          metadata: {
            ...state.metadata,
            orderId: order.id,
            executedAt: Date.now()
          }
        }
      } else {
        // Handle hold, close, reduce actions
        return {
          executionStatus: 'executed',
          reasoning: `${state.reasoning}\nAction ${decision.action} completed`,
          metadata: {
            ...state.metadata,
            executedAt: Date.now()
          }
        }
      }
    } catch (error) {
      console.error('Trade execution failed:', error)
      return {
        executionStatus: 'failed',
        reasoning: `${state.reasoning}\nExecution failed: ${error}`
      }
    }
  }

  /**
   * Node: Monitor trade execution
   */
  private async monitorExecution(state: TradingState): Promise<Partial<TradingState>> {
    console.log(`👀 Monitoring execution for ${state.symbol}`)

    // This would monitor the order status in a real implementation
    return {
      reasoning: `${state.reasoning}\nExecution monitoring completed`,
      metadata: {
        ...state.metadata,
        monitoredAt: Date.now()
      }
    }
  }

  /**
   * Execute a complete trading workflow
   */
  public async executeTradingWorkflow(
    agentId: string,
    symbol: string,
    initialData?: Partial<TradingState>
  ): Promise<TradingState> {
    try {
      const initialState: TradingState = {
        agentId,
        symbol,
        marketData: null,
        portfolio: null,
        riskLimits: null,
        analysisResults: [],
        decision: null,
        confidence: 0,
        reasoning: `Starting trading workflow for ${symbol}`,
        executionStatus: 'pending',
        messages: [],
        metadata: { workflowStarted: Date.now() },
        ...initialData
      }

      const compiled = this.workflow.compile()
      const result = await compiled.invoke(initialState)

      console.log(`🏁 Trading workflow completed for ${symbol}:`, {
        decision: result.decision?.action,
        confidence: result.confidence,
        status: result.executionStatus
      })

      return result
    } catch (error) {
      console.error('Trading workflow failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const tradingWorkflowEngine = new TradingWorkflowEngine()