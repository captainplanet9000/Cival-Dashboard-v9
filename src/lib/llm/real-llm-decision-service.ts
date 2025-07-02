'use client'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { OpenAI } from 'openai'
import { redisAgentService } from '@/lib/redis/redis-agent-service'
import { strategyService } from '@/lib/supabase/strategy-service'

export interface MarketContext {
  symbol: string
  price: number
  volume: number
  volatility: number
  trend: 'bullish' | 'bearish' | 'sideways'
  technicalIndicators: {
    rsi: number
    macd: { signal: number; histogram: number }
    ema20: number
    ema50: number
    support: number
    resistance: number
  }
  marketSentiment: number // -1 to 1
  newsImpact: 'positive' | 'negative' | 'neutral'
}

export interface AgentDecisionContext {
  agentId: string
  strategy: string
  portfolioValue: number
  currentPositions: any[]
  availableCash: number
  riskLimits: {
    maxPositionSize: number
    maxDailyLoss: number
    maxDrawdown: number
  }
  recentPerformance: {
    winRate: number
    avgReturn: number
    sharpeRatio: number
    maxDrawdown: number
  }
  marketContext: MarketContext
  recentThoughts: string[]
  learningData: any
}

export interface LLMDecision {
  action: 'buy' | 'sell' | 'hold' | 'reduce' | 'increase'
  symbol: string
  quantity: number
  confidence: number
  reasoning: string
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high'
    maxLoss: number
    expectedReturn: number
    timeHorizon: string
  }
  technicalAnalysis: {
    signals: string[]
    patterns: string[]
    indicators: Record<string, number>
  }
  sentiment: string
  stopLoss?: number
  takeProfit?: number
  metadata: {
    modelUsed: string
    processingTime: number
    contextTokens: number
    responseTokens: number
  }
}

class RealLLMDecisionService {
  private geminiClient: GoogleGenerativeAI | null = null
  private openaiClient: OpenAI | null = null
  private defaultProvider: 'gemini' | 'openai' = 'gemini'

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    // Initialize Gemini
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (geminiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiKey)
      console.log('✅ Gemini LLM client initialized')
    }

    // Initialize OpenAI as backup
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      this.openaiClient = new OpenAI({
        apiKey: openaiKey,
        dangerouslyAllowBrowser: true // Note: In production, proxy through backend
      })
      console.log('✅ OpenAI LLM client initialized as backup')
    }

    if (!this.geminiClient && !this.openaiClient) {
      console.warn('⚠️ No LLM clients available - using mock responses')
    }
  }

  async makeDecision(context: AgentDecisionContext): Promise<LLMDecision> {
    const startTime = Date.now()
    
    try {
      // Try primary provider first
      if (this.defaultProvider === 'gemini' && this.geminiClient) {
        return await this.makeGeminiDecision(context, startTime)
      } else if (this.defaultProvider === 'openai' && this.openaiClient) {
        return await this.makeOpenAIDecision(context, startTime)
      }

      // Fallback to available provider
      if (this.geminiClient) {
        return await this.makeGeminiDecision(context, startTime)
      } else if (this.openaiClient) {
        return await this.makeOpenAIDecision(context, startTime)
      }

      // Final fallback to mock decision
      return this.makeMockDecision(context, startTime)

    } catch (error) {
      console.error('LLM decision error:', error)
      return this.makeMockDecision(context, startTime)
    }
  }

  private async makeGeminiDecision(context: AgentDecisionContext, startTime: number): Promise<LLMDecision> {
    const model = this.geminiClient!.getGenerativeModel({ model: 'gemini-pro' })
    
    const prompt = this.buildTradingPrompt(context)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    return this.parseDecisionResponse(text, 'gemini', startTime, context)
  }

  private async makeOpenAIDecision(context: AgentDecisionContext, startTime: number): Promise<LLMDecision> {
    const completion = await this.openaiClient!.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI trading agent with deep knowledge of technical analysis, risk management, and market psychology. Make precise trading decisions based on comprehensive market analysis.'
        },
        {
          role: 'user',
          content: this.buildTradingPrompt(context)
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const text = completion.choices[0]?.message?.content || ''
    
    return this.parseDecisionResponse(text, 'openai', startTime, context)
  }

  private buildTradingPrompt(context: AgentDecisionContext): string {
    const { agentId, strategy, portfolioValue, currentPositions, availableCash, riskLimits, recentPerformance, marketContext, recentThoughts, learningData } = context

    return `# EXPERT TRADING AGENT DECISION REQUEST

## AGENT PROFILE
- Agent ID: ${agentId}
- Strategy: ${strategy.replace('_', ' ').toUpperCase()}
- Portfolio Value: $${portfolioValue.toLocaleString()}
- Available Cash: $${availableCash.toLocaleString()}
- Current Positions: ${currentPositions.length}

## RISK PARAMETERS
- Max Position Size: $${riskLimits.maxPositionSize.toLocaleString()}
- Max Daily Loss: $${riskLimits.maxDailyLoss.toLocaleString()}
- Max Drawdown: ${(riskLimits.maxDrawdown * 100).toFixed(1)}%

## RECENT PERFORMANCE
- Win Rate: ${(recentPerformance.winRate * 100).toFixed(1)}%
- Avg Return: ${(recentPerformance.avgReturn * 100).toFixed(2)}%
- Sharpe Ratio: ${recentPerformance.sharpeRatio.toFixed(2)}
- Max Drawdown: ${(recentPerformance.maxDrawdown * 100).toFixed(1)}%

## CURRENT MARKET CONDITIONS
- Symbol: ${marketContext.symbol}
- Price: $${marketContext.price.toLocaleString()}
- Volume: ${marketContext.volume.toLocaleString()}
- Volatility: ${(marketContext.volatility * 100).toFixed(1)}%
- Trend: ${marketContext.trend.toUpperCase()}
- Market Sentiment: ${marketContext.marketSentiment > 0 ? 'Positive' : marketContext.marketSentiment < 0 ? 'Negative' : 'Neutral'} (${marketContext.marketSentiment.toFixed(2)})
- News Impact: ${marketContext.newsImpact.toUpperCase()}

## TECHNICAL INDICATORS
- RSI: ${marketContext.technicalIndicators.rsi.toFixed(1)}
- MACD Signal: ${marketContext.technicalIndicators.macd.signal.toFixed(3)}
- MACD Histogram: ${marketContext.technicalIndicators.macd.histogram.toFixed(3)}
- EMA 20: $${marketContext.technicalIndicators.ema20.toFixed(2)}
- EMA 50: $${marketContext.technicalIndicators.ema50.toFixed(2)}
- Support Level: $${marketContext.technicalIndicators.support.toFixed(2)}
- Resistance Level: $${marketContext.technicalIndicators.resistance.toFixed(2)}

## RECENT AGENT THOUGHTS
${recentThoughts.slice(0, 3).map((thought, i) => `${i + 1}. ${thought}`).join('\n')}

## STRATEGY-SPECIFIC ANALYSIS
${this.getStrategyGuidance(strategy)}

## LEARNING DATA INSIGHTS
${this.formatLearningData(learningData)}

---

**TASK:** Based on this comprehensive analysis, make a precise trading decision. Consider:

1. **Strategy Alignment**: Does this opportunity align with your ${strategy.replace('_', ' ')} strategy?
2. **Risk Management**: Is the risk-reward ratio favorable given your limits?
3. **Technical Setup**: Are the technical indicators confirming your strategy signals?
4. **Market Conditions**: Are current conditions favorable for this strategy?
5. **Position Sizing**: What's the optimal position size given volatility and portfolio size?

**RESPOND IN THIS EXACT JSON FORMAT:**
\`\`\`json
{
  "action": "buy|sell|hold|reduce|increase",
  "symbol": "${marketContext.symbol}",
  "quantity": 0.0,
  "confidence": 0.85,
  "reasoning": "Detailed explanation of your decision...",
  "riskAssessment": {
    "riskLevel": "low|medium|high",
    "maxLoss": 500,
    "expectedReturn": 1200,
    "timeHorizon": "1-3 days"
  },
  "technicalAnalysis": {
    "signals": ["RSI oversold", "MACD bullish crossover"],
    "patterns": ["Bull flag", "Higher lows"],
    "indicators": {"rsi": ${marketContext.technicalIndicators.rsi}, "macd": ${marketContext.technicalIndicators.macd.signal}}
  },
  "sentiment": "Your market sentiment analysis...",
  "stopLoss": 0.0,
  "takeProfit": 0.0
}
\`\`\`

**IMPORTANT**: Respond ONLY with the JSON. No additional text.`
  }

  private getStrategyGuidance(strategy: string): string {
    const guides = {
      darvas_box: `
DARVAS BOX STRATEGY FOCUS:
- Look for stocks making new highs with volume confirmation
- Wait for consolidation boxes to form
- Enter on breakout above box high with 3x average volume
- Set stop-loss just below box low
- Target next resistance level or 20% gain`,

      williams_alligator: `
WILLIAMS ALLIGATOR STRATEGY FOCUS:
- Monitor jaw (blue), teeth (red), lips (green) alignment
- Enter when all lines are aligned and spread apart (feeding)
- Trade in direction of alligator mouth opening
- Exit when lines converge (alligator sleeping)
- Avoid choppy markets when lines are intertwined`,

      renko_breakout: `
RENKO BREAKOUT STRATEGY FOCUS:
- Focus on price movement without time factor
- Enter on brick color change with momentum
- Look for multiple consecutive bricks in same direction
- Use support/resistance from brick formations
- Exit on brick reversal or momentum loss`,

      heikin_ashi: `
HEIKIN ASHI STRATEGY FOCUS:
- Trade in direction of candle color trend
- Enter on first green candle after red sequence
- Exit on first red candle after green sequence
- Look for indecision candles (small bodies) for reversals
- Strong trends show consecutive same-color candles`,

      elliott_wave: `
ELLIOTT WAVE STRATEGY FOCUS:
- Identify 5-wave impulse patterns in trend direction
- Trade wave 3 (strongest and longest wave)
- Use Fibonacci retracements for wave targets
- Count waves carefully: 1-2-3-4-5, then A-B-C correction
- Enter at wave 2 or 4 retracements, exit at wave 5 target`
    }

    return guides[strategy as keyof typeof guides] || 'Apply general technical analysis principles.'
  }

  private formatLearningData(learningData: any): string {
    if (!learningData || typeof learningData !== 'object') {
      return 'No significant learning patterns identified yet.'
    }

    const patterns = learningData.patterns || []
    const insights = learningData.insights || []

    let formatted = 'LEARNED PATTERNS:\n'
    patterns.slice(0, 3).forEach((pattern: any, i: number) => {
      formatted += `${i + 1}. ${pattern.description || pattern.type}: ${(pattern.success_rate * 100).toFixed(0)}% success rate\n`
    })

    if (insights.length > 0) {
      formatted += '\nKEY INSIGHTS:\n'
      insights.slice(0, 2).forEach((insight: any, i: number) => {
        formatted += `${i + 1}. ${insight.insight || insight.content}\n`
      })
    }

    return formatted || 'Learning data analysis in progress...'
  }

  private parseDecisionResponse(text: string, modelUsed: string, startTime: number, context: AgentDecisionContext): LLMDecision {
    const processingTime = Date.now() - startTime

    try {
      // Extract JSON from response
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const decision = JSON.parse(jsonStr)

      // Validate and enhance the decision
      const enhancedDecision: LLMDecision = {
        action: decision.action || 'hold',
        symbol: decision.symbol || context.marketContext.symbol,
        quantity: Math.max(0, Number(decision.quantity || 0)),
        confidence: Math.min(1, Math.max(0, Number(decision.confidence || 0.5))),
        reasoning: decision.reasoning || 'AI analysis based on current market conditions',
        riskAssessment: {
          riskLevel: decision.riskAssessment?.riskLevel || 'medium',
          maxLoss: Number(decision.riskAssessment?.maxLoss || 0),
          expectedReturn: Number(decision.riskAssessment?.expectedReturn || 0),
          timeHorizon: decision.riskAssessment?.timeHorizon || '1-2 days'
        },
        technicalAnalysis: {
          signals: decision.technicalAnalysis?.signals || [],
          patterns: decision.technicalAnalysis?.patterns || [],
          indicators: decision.technicalAnalysis?.indicators || {}
        },
        sentiment: decision.sentiment || 'Neutral market conditions',
        stopLoss: Number(decision.stopLoss) || undefined,
        takeProfit: Number(decision.takeProfit) || undefined,
        metadata: {
          modelUsed,
          processingTime,
          contextTokens: text.length / 4, // Rough estimate
          responseTokens: text.length / 4
        }
      }

      // Apply risk limits
      enhancedDecision.quantity = Math.min(
        enhancedDecision.quantity,
        context.riskLimits.maxPositionSize / context.marketContext.price
      )

      return enhancedDecision

    } catch (error) {
      console.error('Error parsing LLM response:', error)
      console.log('Raw response:', text)
      
      // Return fallback decision
      return this.makeMockDecision(context, startTime, modelUsed)
    }
  }

  private makeMockDecision(context: AgentDecisionContext, startTime: number, modelUsed: string = 'mock'): LLMDecision {
    const processingTime = Date.now() - startTime
    const { marketContext, strategy, portfolioValue, riskLimits } = context

    // Simple logic for mock decision
    const rsi = marketContext.technicalIndicators.rsi
    const trend = marketContext.trend
    const sentiment = marketContext.marketSentiment

    let action: LLMDecision['action'] = 'hold'
    let confidence = 0.6
    let reasoning = 'Conservative hold position due to mixed signals'

    // Basic decision logic
    if (rsi < 30 && trend !== 'bearish' && sentiment > -0.3) {
      action = 'buy'
      confidence = 0.75
      reasoning = 'RSI oversold with neutral+ sentiment suggests buying opportunity'
    } else if (rsi > 70 && trend !== 'bullish' && sentiment < 0.3) {
      action = 'sell'
      confidence = 0.7
      reasoning = 'RSI overbought with neutral- sentiment suggests selling opportunity'
    }

    const maxQuantity = riskLimits.maxPositionSize / marketContext.price
    const quantity = action === 'hold' ? 0 : maxQuantity * 0.5 // Conservative 50% of max

    return {
      action,
      symbol: marketContext.symbol,
      quantity,
      confidence,
      reasoning,
      riskAssessment: {
        riskLevel: quantity > maxQuantity * 0.7 ? 'high' : quantity > maxQuantity * 0.3 ? 'medium' : 'low',
        maxLoss: quantity * marketContext.price * 0.02, // 2% risk
        expectedReturn: quantity * marketContext.price * 0.05, // 5% target
        timeHorizon: '1-3 days'
      },
      technicalAnalysis: {
        signals: rsi < 30 ? ['RSI oversold'] : rsi > 70 ? ['RSI overbought'] : ['RSI neutral'],
        patterns: ['Consolidation'],
        indicators: { rsi, trend_strength: Math.abs(sentiment) }
      },
      sentiment: sentiment > 0.2 ? 'Positive market sentiment' : sentiment < -0.2 ? 'Negative market sentiment' : 'Neutral sentiment',
      stopLoss: action === 'buy' ? marketContext.price * 0.98 : action === 'sell' ? marketContext.price * 1.02 : undefined,
      takeProfit: action === 'buy' ? marketContext.price * 1.05 : action === 'sell' ? marketContext.price * 0.95 : undefined,
      metadata: {
        modelUsed,
        processingTime,
        contextTokens: 0,
        responseTokens: 0
      }
    }
  }

  async storeDecision(agentId: string, decision: LLMDecision): Promise<void> {
    try {
      // Store decision in Redis
      await redisAgentService.addDecision({
        agentId,
        timestamp: new Date().toISOString(),
        action: decision.action,
        symbol: decision.symbol,
        quantity: decision.quantity,
        price: 0, // Will be filled when executed
        reasoning: decision.reasoning,
        expectedOutcome: {
          target: decision.takeProfit || 0,
          stopLoss: decision.stopLoss || 0,
          probability: decision.confidence
        }
      })

      // Store thought process
      await redisAgentService.addThought({
        agentId,
        timestamp: new Date().toISOString(),
        type: 'decision',
        content: `${decision.action.toUpperCase()} ${decision.symbol}: ${decision.reasoning}`,
        reasoning: `Confidence: ${(decision.confidence * 100).toFixed(0)}% | Risk: ${decision.riskAssessment.riskLevel} | Model: ${decision.metadata.modelUsed}`,
        confidence: decision.confidence,
        marketContext: {
          symbol: decision.symbol,
          price: 0, // Current price
          sentiment: decision.sentiment
        },
        technicalSignals: {
          signal: decision.action,
          strength: decision.confidence,
          indicators: decision.technicalAnalysis.signals
        }
      })

      console.log(`💡 LLM Decision stored for agent ${agentId}: ${decision.action} ${decision.symbol}`)
      
    } catch (error) {
      console.error('Error storing LLM decision:', error)
    }
  }

  async getDecisionHistory(agentId: string, limit: number = 20): Promise<LLMDecision[]> {
    try {
      const decisions = await redisAgentService.getRecentDecisions(agentId, limit)
      
      // Convert Redis decisions to LLMDecision format
      return decisions.map(decision => ({
        action: decision.action,
        symbol: decision.symbol,
        quantity: decision.quantity,
        confidence: decision.expectedOutcome?.probability || 0.5,
        reasoning: decision.reasoning,
        riskAssessment: {
          riskLevel: 'medium' as const,
          maxLoss: 0,
          expectedReturn: 0,
          timeHorizon: '1-2 days'
        },
        technicalAnalysis: {
          signals: [],
          patterns: [],
          indicators: {}
        },
        sentiment: 'Historical decision',
        metadata: {
          modelUsed: 'redis-stored',
          processingTime: 0,
          contextTokens: 0,
          responseTokens: 0
        }
      }))
      
    } catch (error) {
      console.error('Error getting decision history:', error)
      return []
    }
  }

  // Method to switch between providers
  switchProvider(provider: 'gemini' | 'openai') {
    this.defaultProvider = provider
    console.log(`🔄 Switched LLM provider to: ${provider}`)
  }

  // Health check for LLM services
  async healthCheck(): Promise<{ gemini: boolean; openai: boolean; active: string }> {
    return {
      gemini: !!this.geminiClient,
      openai: !!this.openaiClient,
      active: this.defaultProvider
    }
  }
}

// Export singleton instance
export const realLLMDecisionService = new RealLLMDecisionService()

// Export types
export type { AgentDecisionContext, LLMDecision, MarketContext }