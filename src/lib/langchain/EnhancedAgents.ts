/**
 * Enhanced AI Agents with LLM-Powered Decision Making
 * Specialized trading agents using LangChain for intelligent market analysis
 * Each agent type has unique prompts and reasoning capabilities
 */

import { langChainService } from './LangChainService'
import { TradingDecision } from './TradingWorkflow'
import { persistentTradingEngine } from '@/lib/paper-trading/PersistentTradingEngine'

export interface AgentAnalysisResult {
  agent: string
  analysis: string
  confidence: number
  reasoning: string
  signals: any[]
  riskAssessment: number
  timeframe: string
  nextReview: number
}

export interface MarketContext {
  symbol: string
  price: number
  volume: number
  technicalIndicators: any
  marketConditions: any
  portfolio: any
  riskLimits: any
  recentTrades: any[]
  newsEvents: any[]
}

/**
 * Momentum Trading Agent - Specialized in trend following and breakout detection
 */
export class MomentumAgent {
  private agentId: string
  private name: string = 'LLM Momentum Specialist'

  constructor(agentId: string) {
    this.agentId = agentId
  }

  async analyze(context: MarketContext): Promise<AgentAnalysisResult> {
    const prompt = `You are an expert momentum trading specialist. Analyze ${context.symbol} for momentum trading opportunities.

Current Market Data:
- Price: $${context.price}
- Volume: ${context.volume}
- Recent price action and volume patterns

Portfolio Context:
- Available cash: $${context.portfolio?.cashBalance || 0}
- Current positions: ${context.portfolio?.positions?.length || 0}
- Total value: $${context.portfolio?.totalValue || 0}

Momentum Analysis Framework:
1. **Trend Identification**: Is there a clear directional trend?
2. **Breakout Detection**: Are we seeing volume-confirmed breakouts?
3. **Momentum Indicators**: RSI, MACD, Volume profile analysis
4. **Support/Resistance**: Key levels being broken or holding
5. **Volume Confirmation**: Is volume supporting the price movement?

Provide your analysis:
- Current trend strength (1-10)
- Breakout probability (0-100%)
- Entry/exit signals
- Risk/reward assessment
- Position sizing recommendation
- Stop loss placement
- Time horizon for the trade

Be specific about momentum patterns you observe and provide actionable insights.

Format response as JSON with: trendStrength, breakoutProb, signals, riskReward, positionSize, stopLoss, timeHorizon, reasoning, confidence`

    try {
      const analysis = await langChainService.generateTradingAnalysis(
        prompt,
        context,
        { modelPreference: 'openai' }
      )

      if (!analysis) {
        throw new Error('Failed to get momentum analysis')
      }

      let parsedAnalysis
      try {
        parsedAnalysis = JSON.parse(analysis.analysis)
      } catch {
        parsedAnalysis = {
          trendStrength: 5,
          breakoutProb: 50,
          signals: ['neutral'],
          riskReward: 1.5,
          positionSize: 0,
          reasoning: analysis.analysis,
          confidence: analysis.confidence
        }
      }

      return {
        agent: this.name,
        analysis: analysis.analysis,
        confidence: analysis.confidence,
        reasoning: parsedAnalysis.reasoning || analysis.reasoning,
        signals: parsedAnalysis.signals || [],
        riskAssessment: Math.max(0, 100 - parsedAnalysis.trendStrength * 10),
        timeframe: parsedAnalysis.timeHorizon || '1-4 hours',
        nextReview: Date.now() + (15 * 60 * 1000) // 15 minutes
      }
    } catch (error) {
      console.error('Momentum agent analysis failed:', error)
      return {
        agent: this.name,
        analysis: `Analysis failed: ${error}`,
        confidence: 0,
        reasoning: 'Unable to perform momentum analysis due to technical error',
        signals: ['error'],
        riskAssessment: 100,
        timeframe: 'unknown',
        nextReview: Date.now() + (5 * 60 * 1000)
      }
    }
  }

  async makeDecision(context: MarketContext): Promise<TradingDecision | null> {
    const analysis = await this.analyze(context)
    
    if (analysis.confidence < 60) {
      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: `Momentum signals unclear - confidence too low (${analysis.confidence}%)`,
        confidence: analysis.confidence,
        urgency: 'low',
        riskScore: analysis.riskAssessment
      }
    }

    // Extract decision from analysis
    try {
      const parsed = JSON.parse(analysis.analysis)
      const action = parsed.signals?.includes('buy') ? 'buy' :
                   parsed.signals?.includes('sell') ? 'sell' : 'hold'

      return {
        action,
        symbol: context.symbol,
        quantity: parsed.positionSize || 0,
        stopLoss: parsed.stopLoss,
        reasoning: `Momentum analysis: ${parsed.reasoning}`,
        confidence: analysis.confidence,
        urgency: parsed.trendStrength > 7 ? 'high' : 'medium',
        riskScore: analysis.riskAssessment
      }
    } catch {
      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: 'Could not parse momentum decision',
        confidence: 25,
        urgency: 'low',
        riskScore: 80
      }
    }
  }
}

/**
 * Mean Reversion Agent - Specialized in identifying oversold/overbought conditions
 */
export class MeanReversionAgent {
  private agentId: string
  private name: string = 'LLM Mean Reversion Specialist'

  constructor(agentId: string) {
    this.agentId = agentId
  }

  async analyze(context: MarketContext): Promise<AgentAnalysisResult> {
    const prompt = `You are an expert mean reversion trading specialist. Analyze ${context.symbol} for mean reversion opportunities.

Current Market Data:
- Price: $${context.price}
- Volume: ${context.volume}
- Technical indicators and price levels

Mean Reversion Analysis Framework:
1. **Deviation from Mean**: How far is price from moving averages?
2. **Oscillator Signals**: RSI, Stochastic, Williams %R readings
3. **Support/Resistance**: Are we near key reversal levels?
4. **Volume Divergence**: Is volume confirming or contradicting price action?
5. **Market Structure**: Is this a ranging or trending market?
6. **Time-based Patterns**: Intraday/weekly mean reversion tendencies

Key Questions:
- Is the asset oversold or overbought?
- What's the probability of reversion to mean?
- Where are the logical entry/exit points?
- What's the risk if the trend continues?

Provide assessment:
- Deviation from mean (standard deviations)
- Oscillator readings and signals
- Probability of reversion (0-100%)
- Entry/exit levels
- Risk management approach
- Expected time to reversion

Format response as JSON with: meanDeviation, oscillatorSignals, reversionProb, entryLevel, exitLevel, riskManagement, timeToReversion, reasoning, confidence`

    try {
      const analysis = await langChainService.generateTradingAnalysis(
        prompt,
        context,
        { modelPreference: 'anthropic' }
      )

      if (!analysis) {
        throw new Error('Failed to get mean reversion analysis')
      }

      let parsedAnalysis
      try {
        parsedAnalysis = JSON.parse(analysis.analysis)
      } catch {
        parsedAnalysis = {
          meanDeviation: 0,
          reversionProb: 50,
          reasoning: analysis.analysis,
          confidence: analysis.confidence
        }
      }

      return {
        agent: this.name,
        analysis: analysis.analysis,
        confidence: analysis.confidence,
        reasoning: parsedAnalysis.reasoning || analysis.reasoning,
        signals: parsedAnalysis.oscillatorSignals || [],
        riskAssessment: Math.max(20, 100 - parsedAnalysis.reversionProb),
        timeframe: parsedAnalysis.timeToReversion || '2-8 hours',
        nextReview: Date.now() + (30 * 60 * 1000) // 30 minutes
      }
    } catch (error) {
      console.error('Mean reversion agent analysis failed:', error)
      return {
        agent: this.name,
        analysis: `Analysis failed: ${error}`,
        confidence: 0,
        reasoning: 'Unable to perform mean reversion analysis due to technical error',
        signals: ['error'],
        riskAssessment: 100,
        timeframe: 'unknown',
        nextReview: Date.now() + (5 * 60 * 1000)
      }
    }
  }

  async makeDecision(context: MarketContext): Promise<TradingDecision | null> {
    const analysis = await this.analyze(context)
    
    if (analysis.confidence < 65) {
      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: `Mean reversion signals unclear - confidence too low (${analysis.confidence}%)`,
        confidence: analysis.confidence,
        urgency: 'low',
        riskScore: analysis.riskAssessment
      }
    }

    try {
      const parsed = JSON.parse(analysis.analysis)
      
      let action: 'buy' | 'sell' | 'hold' = 'hold'
      if (parsed.reversionProb > 70) {
        action = parsed.meanDeviation > 0 ? 'sell' : 'buy' // Sell if above mean, buy if below
      }

      return {
        action,
        symbol: context.symbol,
        quantity: Math.abs(parsed.meanDeviation || 0) * 1000, // Size based on deviation
        price: parsed.entryLevel,
        takeProfit: parsed.exitLevel,
        reasoning: `Mean reversion: ${parsed.reasoning}`,
        confidence: analysis.confidence,
        urgency: parsed.reversionProb > 80 ? 'high' : 'medium',
        riskScore: analysis.riskAssessment
      }
    } catch {
      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: 'Could not parse mean reversion decision',
        confidence: 25,
        urgency: 'low',
        riskScore: 80
      }
    }
  }
}

/**
 * Risk Management Agent - Specialized in portfolio risk assessment and position sizing
 */
export class RiskManagementAgent {
  private agentId: string
  private name: string = 'LLM Risk Management Specialist'

  constructor(agentId: string) {
    this.agentId = agentId
  }

  async analyze(context: MarketContext): Promise<AgentAnalysisResult> {
    const prompt = `You are an expert risk management specialist. Analyze the risk profile for ${context.symbol} trading.

Portfolio Status:
- Total Value: $${context.portfolio?.totalValue || 0}
- Cash Available: $${context.portfolio?.cashBalance || 0}
- Open Positions: ${context.portfolio?.positions?.length || 0}
- Current P&L: $${context.portfolio?.totalPnL || 0}

Market Context:
- Current Price: $${context.price}
- Volume: ${context.volume}
- Volatility indicators
- Market conditions

Risk Management Framework:
1. **Portfolio Concentration**: Are we overexposed to any asset/sector?
2. **Position Sizing**: What's the optimal position size for this trade?
3. **Correlation Risk**: How does this correlate with existing positions?
4. **Volatility Assessment**: What's the current volatility environment?
5. **Drawdown Risk**: What's the maximum acceptable loss?
6. **Liquidity Risk**: Can we exit positions quickly if needed?

Risk Assessment:
- Maximum position size for this symbol
- Recommended stop loss levels
- Portfolio heat (total risk)
- Correlation with existing positions
- Volatility-adjusted position sizing
- Risk/reward scenarios

Format response as JSON with: maxPositionSize, stopLossLevel, portfolioHeat, correlationRisk, volatilityAdjustment, riskRewardScenarios, recommendations, reasoning, confidence`

    try {
      const analysis = await langChainService.generateTradingAnalysis(
        prompt,
        context,
        { modelPreference: 'claude-3-sonnet' }
      )

      if (!analysis) {
        throw new Error('Failed to get risk analysis')
      }

      let parsedAnalysis
      try {
        parsedAnalysis = JSON.parse(analysis.analysis)
      } catch {
        parsedAnalysis = {
          maxPositionSize: context.portfolio?.totalValue * 0.05 || 5000,
          portfolioHeat: 50,
          reasoning: analysis.analysis,
          confidence: analysis.confidence
        }
      }

      return {
        agent: this.name,
        analysis: analysis.analysis,
        confidence: analysis.confidence,
        reasoning: parsedAnalysis.reasoning || analysis.reasoning,
        signals: parsedAnalysis.recommendations || [],
        riskAssessment: parsedAnalysis.portfolioHeat || 50,
        timeframe: 'ongoing',
        nextReview: Date.now() + (10 * 60 * 1000) // 10 minutes
      }
    } catch (error) {
      console.error('Risk management agent analysis failed:', error)
      return {
        agent: this.name,
        analysis: `Analysis failed: ${error}`,
        confidence: 0,
        reasoning: 'Unable to perform risk analysis due to technical error',
        signals: ['high_risk'],
        riskAssessment: 100,
        timeframe: 'immediate',
        nextReview: Date.now() + (5 * 60 * 1000)
      }
    }
  }

  async makeDecision(context: MarketContext): Promise<TradingDecision | null> {
    const analysis = await this.analyze(context)
    
    // Risk manager rarely initiates trades, mostly provides risk adjustments
    try {
      const parsed = JSON.parse(analysis.analysis)
      
      if (parsed.portfolioHeat > 80) {
        return {
          action: 'reduce',
          symbol: context.symbol,
          quantity: 0,
          reasoning: `Portfolio risk too high (${parsed.portfolioHeat}%) - recommend reducing exposure`,
          confidence: analysis.confidence,
          urgency: 'high',
          riskScore: 90
        }
      }

      if (parsed.portfolioHeat < 30 && analysis.confidence > 70) {
        return {
          action: 'hold',
          symbol: context.symbol,
          quantity: parsed.maxPositionSize || 0,
          reasoning: `Risk levels acceptable - can consider new positions up to $${parsed.maxPositionSize}`,
          confidence: analysis.confidence,
          urgency: 'low',
          riskScore: parsed.portfolioHeat
        }
      }

      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: `Risk monitoring - portfolio heat at ${parsed.portfolioHeat}%`,
        confidence: analysis.confidence,
        urgency: 'low',
        riskScore: parsed.portfolioHeat
      }
    } catch {
      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: 'Risk analysis inconclusive - maintaining cautious stance',
        confidence: 25,
        urgency: 'medium',
        riskScore: 75
      }
    }
  }
}

/**
 * Sentiment Analysis Agent - Specialized in market sentiment and news analysis
 */
export class SentimentAgent {
  private agentId: string
  private name: string = 'LLM Sentiment Analyst'

  constructor(agentId: string) {
    this.agentId = agentId
  }

  async analyze(context: MarketContext): Promise<AgentAnalysisResult> {
    const prompt = `You are an expert market sentiment analyst. Analyze sentiment and market psychology for ${context.symbol}.

Market Context:
- Current Price: $${context.price}
- Volume: ${context.volume}
- Recent price action

Sentiment Analysis Framework:
1. **General Market Sentiment**: Bull/bear market psychology
2. **Asset-Specific Sentiment**: How traders feel about this specific asset
3. **News Impact**: Recent news and its potential market impact
4. **Social Sentiment**: What retail traders are discussing
5. **Institutional Sentiment**: Likely institutional positioning
6. **Fear/Greed Indicators**: Market psychology indicators

Sentiment Factors to Consider:
- Recent news events and their impact
- Market volatility and fear levels
- Trading volume patterns (fear vs greed)
- Social media mentions and sentiment
- Contrarian indicators
- Market structure and participant behavior

Provide Assessment:
- Overall sentiment score (-100 to +100)
- Market psychology state
- News impact assessment
- Crowd sentiment vs smart money
- Contrarian signals
- Sentiment-driven trading opportunities

Format response as JSON with: sentimentScore, marketPsychology, newsImpact, crowdSentiment, smartMoney, contrarianSignals, opportunities, reasoning, confidence`

    try {
      const analysis = await langChainService.generateTradingAnalysis(
        prompt,
        context,
        { modelPreference: 'openai' }
      )

      if (!analysis) {
        throw new Error('Failed to get sentiment analysis')
      }

      let parsedAnalysis
      try {
        parsedAnalysis = JSON.parse(analysis.analysis)
      } catch {
        parsedAnalysis = {
          sentimentScore: 0,
          marketPsychology: 'neutral',
          reasoning: analysis.analysis,
          confidence: analysis.confidence
        }
      }

      return {
        agent: this.name,
        analysis: analysis.analysis,
        confidence: analysis.confidence,
        reasoning: parsedAnalysis.reasoning || analysis.reasoning,
        signals: parsedAnalysis.opportunities || [],
        riskAssessment: Math.abs(parsedAnalysis.sentimentScore || 0),
        timeframe: '1-24 hours',
        nextReview: Date.now() + (60 * 60 * 1000) // 1 hour
      }
    } catch (error) {
      console.error('Sentiment agent analysis failed:', error)
      return {
        agent: this.name,
        analysis: `Analysis failed: ${error}`,
        confidence: 0,
        reasoning: 'Unable to perform sentiment analysis due to technical error',
        signals: ['neutral'],
        riskAssessment: 50,
        timeframe: 'unknown',
        nextReview: Date.now() + (15 * 60 * 1000)
      }
    }
  }

  async makeDecision(context: MarketContext): Promise<TradingDecision | null> {
    const analysis = await this.analyze(context)
    
    if (analysis.confidence < 55) {
      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: `Sentiment signals unclear - confidence too low (${analysis.confidence}%)`,
        confidence: analysis.confidence,
        urgency: 'low',
        riskScore: analysis.riskAssessment
      }
    }

    try {
      const parsed = JSON.parse(analysis.analysis)
      
      let action: 'buy' | 'sell' | 'hold' = 'hold'
      const sentimentScore = parsed.sentimentScore || 0
      
      // Sentiment-based trading logic
      if (Math.abs(sentimentScore) > 60) {
        // Strong sentiment - consider contrarian approach or momentum play
        if (parsed.contrarianSignals?.length > 0) {
          action = sentimentScore > 0 ? 'sell' : 'buy' // Contrarian
        } else if (parsed.opportunities?.includes('momentum')) {
          action = sentimentScore > 0 ? 'buy' : 'sell' // Momentum
        }
      }

      return {
        action,
        symbol: context.symbol,
        quantity: Math.abs(sentimentScore) * 10, // Size based on sentiment strength
        reasoning: `Sentiment analysis: ${parsed.reasoning}`,
        confidence: analysis.confidence,
        urgency: Math.abs(sentimentScore) > 80 ? 'high' : 'medium',
        riskScore: analysis.riskAssessment
      }
    } catch {
      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: 'Could not parse sentiment decision',
        confidence: 25,
        urgency: 'low',
        riskScore: 60
      }
    }
  }
}

/**
 * Arbitrage Agent - Specialized in finding price discrepancies and market inefficiencies
 */
export class ArbitrageAgent {
  private agentId: string
  private name: string = 'LLM Arbitrage Specialist'

  constructor(agentId: string) {
    this.agentId = agentId
  }

  async analyze(context: MarketContext): Promise<AgentAnalysisResult> {
    const prompt = `You are an expert arbitrage trading specialist. Analyze ${context.symbol} for arbitrage opportunities.

Market Data:
- Current Price: $${context.price}
- Volume: ${context.volume}
- Market structure and liquidity

Arbitrage Analysis Framework:
1. **Price Discrepancies**: Are there price differences across exchanges/markets?
2. **Time-based Arbitrage**: Temporary price inefficiencies
3. **Statistical Arbitrage**: Price relationships with correlated assets
4. **Market Microstructure**: Bid-ask spreads and order book analysis
5. **Execution Costs**: Transaction costs vs opportunity size
6. **Speed Requirements**: How quickly must we act?

Arbitrage Opportunities:
- Cross-exchange price differences
- Spread trading opportunities
- Market making potential
- Mean reversion plays
- Correlation-based trades
- Risk-free or low-risk profit potential

Assessment Criteria:
- Opportunity size (profit potential)
- Execution requirements (speed/capital)
- Risk level (market/execution risk)
- Competition (how many others see this?)
- Sustainability (how long will opportunity last?)

Format response as JSON with: opportunityType, profitPotential, executionSpeed, riskLevel, competition, sustainability, tradeSetup, reasoning, confidence`

    try {
      const analysis = await langChainService.generateTradingAnalysis(
        prompt,
        context,
        { modelPreference: 'anthropic' }
      )

      if (!analysis) {
        throw new Error('Failed to get arbitrage analysis')
      }

      let parsedAnalysis
      try {
        parsedAnalysis = JSON.parse(analysis.analysis)
      } catch {
        parsedAnalysis = {
          opportunityType: 'none',
          profitPotential: 0,
          reasoning: analysis.analysis,
          confidence: analysis.confidence
        }
      }

      return {
        agent: this.name,
        analysis: analysis.analysis,
        confidence: analysis.confidence,
        reasoning: parsedAnalysis.reasoning || analysis.reasoning,
        signals: [parsedAnalysis.opportunityType || 'none'],
        riskAssessment: parsedAnalysis.riskLevel || 30,
        timeframe: parsedAnalysis.sustainability || '5-30 minutes',
        nextReview: Date.now() + (5 * 60 * 1000) // 5 minutes
      }
    } catch (error) {
      console.error('Arbitrage agent analysis failed:', error)
      return {
        agent: this.name,
        analysis: `Analysis failed: ${error}`,
        confidence: 0,
        reasoning: 'Unable to perform arbitrage analysis due to technical error',
        signals: ['error'],
        riskAssessment: 100,
        timeframe: 'unknown',
        nextReview: Date.now() + (5 * 60 * 1000)
      }
    }
  }

  async makeDecision(context: MarketContext): Promise<TradingDecision | null> {
    const analysis = await this.analyze(context)
    
    if (analysis.confidence < 70) {
      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: `No arbitrage opportunities identified with sufficient confidence (${analysis.confidence}%)`,
        confidence: analysis.confidence,
        urgency: 'low',
        riskScore: analysis.riskAssessment
      }
    }

    try {
      const parsed = JSON.parse(analysis.analysis)
      
      if (parsed.opportunityType === 'none' || parsed.profitPotential < 0.1) {
        return {
          action: 'hold',
          symbol: context.symbol,
          quantity: 0,
          reasoning: 'No profitable arbitrage opportunities detected',
          confidence: analysis.confidence,
          urgency: 'low',
          riskScore: analysis.riskAssessment
        }
      }

      // Execute arbitrage if profitable and low risk
      const action = parsed.tradeSetup?.direction || 'hold'
      
      return {
        action: action === 'long' ? 'buy' : action === 'short' ? 'sell' : 'hold',
        symbol: context.symbol,
        quantity: parsed.tradeSetup?.quantity || 0,
        price: parsed.tradeSetup?.entryPrice,
        reasoning: `Arbitrage opportunity: ${parsed.reasoning}`,
        confidence: analysis.confidence,
        urgency: 'high', // Arbitrage requires fast execution
        riskScore: analysis.riskAssessment
      }
    } catch {
      return {
        action: 'hold',
        symbol: context.symbol,
        quantity: 0,
        reasoning: 'Could not parse arbitrage decision',
        confidence: 25,
        urgency: 'low',
        riskScore: 80
      }
    }
  }
}

/**
 * Agent Factory - Creates and manages specialized agent instances
 */
export class AgentFactory {
  private agents: Map<string, any> = new Map()

  createAgent(type: string, agentId: string): any {
    const existingAgent = this.agents.get(agentId)
    if (existingAgent) return existingAgent

    let agent
    switch (type) {
      case 'momentum':
        agent = new MomentumAgent(agentId)
        break
      case 'mean_reversion':
        agent = new MeanReversionAgent(agentId)
        break
      case 'risk_manager':
        agent = new RiskManagementAgent(agentId)
        break
      case 'sentiment':
        agent = new SentimentAgent(agentId)
        break
      case 'arbitrage':
        agent = new ArbitrageAgent(agentId)
        break
      default:
        throw new Error(`Unknown agent type: ${type}`)
    }

    this.agents.set(agentId, agent)
    return agent
  }

  getAgent(agentId: string): any {
    return this.agents.get(agentId)
  }

  removeAgent(agentId: string): boolean {
    return this.agents.delete(agentId)
  }

  getAllAgents(): Map<string, any> {
    return this.agents
  }
}

// Export lazy singleton to prevent circular dependencies
let _agentFactory: AgentFactory | null = null

export function getAgentFactory(): AgentFactory {
  if (!_agentFactory) {
    _agentFactory = new AgentFactory()
  }
  return _agentFactory
}

// Keep the old export for backward compatibility but make it lazy
export const agentFactory = new Proxy({} as AgentFactory, {
  get(target, prop) {
    return getAgentFactory()[prop as keyof AgentFactory]
  }
})