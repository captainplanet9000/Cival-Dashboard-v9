'use client'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { 
  TradingAgentCoordinator, 
  AgentDecision, 
  MarketData, 
  NewsData 
} from './advanced-trading-agents'

// Import real market data service
import { useMarketData } from '@/lib/market/market-data-service'

// Import paper trading engine
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'

// Import notification service
import { appriseNotificationService } from '@/lib/notifications/apprise-service'

// Import Supabase for storage
import { supabase } from '@/lib/supabase/client'

export interface RealAgentDecision extends AgentDecision {
  marketData: MarketData
  newsData: NewsData[]
  executionPlan?: {
    symbol: string
    action: 'BUY' | 'SELL' | 'HOLD'
    quantity?: number
    price?: number
    stopLoss?: number
    takeProfit?: number
  }
  backendId?: string
  paperTradeId?: string
}

export interface AgentAnalysisSession {
  id: string
  timestamp: Date
  marketConditions: {
    volatility: number
    trend: 'bullish' | 'bearish' | 'sideways'
    volume: number
    sentiment: number
  }
  agentDecisions: RealAgentDecision[]
  finalRecommendation: RealAgentDecision
  consensus: number
  executed: boolean
  paperTradeResults?: any
}

class RealTradingAgentsService {
  private geminiAI: GoogleGenerativeAI | null = null
  private coordinator: TradingAgentCoordinator
  private isInitialized = false
  private analysisHistory: AgentAnalysisSession[] = []
  private isAnalyzing = false
  private autoMode = false
  private watchedSymbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD']

  constructor() {
    this.coordinator = new TradingAgentCoordinator()
    this.initializeGemini()
  }

  private initializeGemini() {
    try {
      // Try to get Gemini API key from environment
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY
      if (apiKey) {
        this.geminiAI = new GoogleGenerativeAI(apiKey)
        this.isInitialized = true
        console.log('✅ Gemini AI initialized for real trading analysis')
      } else {
        console.warn('⚠️ Gemini API key not found, using mock analysis')
        this.isInitialized = false
      }
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error)
      this.isInitialized = false
    }
  }

  // Get real market data from the existing market service
  public getRealMarketData(symbol: string, existingPrices: any[]): MarketData {
    try {
      // Find price data for the symbol from the existing market data
      const priceData = existingPrices.find(p => 
        p.symbol === symbol || 
        p.symbol === symbol.replace('/USD', '') || 
        p.symbol === symbol.split('/')[0]
      )

      if (!priceData) {
        console.warn(`No price data found for ${symbol}, using fallback`)
        throw new Error('Price data not found')
      }

      // Convert to MarketData format with technical indicators
      const marketData: MarketData = {
        symbol: symbol,
        price: priceData.price || 0,
        volume: priceData.volume24h || 0,
        change24h: priceData.changePercent24h || 0,
        timestamp: new Date(priceData.lastUpdate || Date.now()),
        technicals: {
          rsi: this.calculateRSI(priceData.price),
          ma50: priceData.price * (0.98 + Math.random() * 0.04), // Simulated MA50
          ma200: priceData.price * (0.95 + Math.random() * 0.1), // Simulated MA200
          bollinger: {
            upper: priceData.price * 1.02,
            middle: priceData.price,
            lower: priceData.price * 0.98
          }
        }
      }

      return marketData
    } catch (error) {
      console.error(`Error processing market data for ${symbol}:`, error)
      
      // Fallback to mock data
      return {
        symbol,
        price: Math.random() * 50000 + 10000,
        volume: Math.random() * 1000000 + 100000,
        change24h: (Math.random() - 0.5) * 10,
        timestamp: new Date(),
        technicals: {
          rsi: Math.random() * 100,
          ma50: Math.random() * 45000 + 15000,
          ma200: Math.random() * 40000 + 20000,
          bollinger: {
            upper: Math.random() * 55000 + 20000,
            middle: Math.random() * 50000 + 15000,
            lower: Math.random() * 45000 + 10000
          }
        }
      }
    }
  }

  // Get real news data for sentiment analysis
  private async getRealNewsData(symbol: string): Promise<NewsData[]> {
    try {
      // Fetch from news API or use existing news service
      const response = await fetch('/api/market/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, limit: 10 })
      })

      if (response.ok) {
        const data = await response.json()
        return data.news || []
      }
    } catch (error) {
      console.error('Error fetching real news data:', error)
    }

    // Fallback to mock news data
    return [
      {
        title: `${symbol} Market Analysis: Technical Indicators Show Mixed Signals`,
        content: `Recent trading activity in ${symbol} shows consolidation patterns with moderate volume.`,
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
        source: 'MarketWatch',
        timestamp: new Date(),
        relevanceScore: 0.8
      },
      {
        title: `Institutional Interest in ${symbol} Continues to Grow`,
        content: `Major institutions continue to show interest in ${symbol} despite market volatility.`,
        sentiment: 'positive',
        source: 'CoinDesk',
        timestamp: new Date(),
        relevanceScore: 0.9
      },
      {
        title: `${symbol} Technical Analysis: Key Support and Resistance Levels`,
        content: `Analysis of key technical levels for ${symbol} trading opportunities.`,
        sentiment: 'neutral',
        source: 'TradingView',
        timestamp: new Date(),
        relevanceScore: 0.7
      }
    ]
  }

  // Enhanced analysis with Gemini AI
  private async enhanceAnalysisWithGemini(
    agentDecision: AgentDecision,
    marketData: MarketData,
    newsData: NewsData[]
  ): Promise<AgentDecision> {
    if (!this.isInitialized || !this.geminiAI) {
      return agentDecision // Return original decision if Gemini not available
    }

    try {
      const model = this.geminiAI.getGenerativeModel({ model: 'gemini-pro' })

      const prompt = `
As a ${agentDecision.agentType} trading analyst, enhance this trading analysis with deep market insights:

Current Analysis:
- Recommendation: ${agentDecision.recommendation}
- Confidence: ${agentDecision.confidence}%
- Risk Level: ${agentDecision.riskLevel}
- Reasoning: ${agentDecision.reasoning}

Market Data:
- Symbol: ${marketData.symbol}
- Price: $${marketData.price}
- 24h Change: ${marketData.change24h}%
- Volume: ${marketData.volume}
- RSI: ${marketData.technicals?.rsi}
- MA50: $${marketData.technicals?.ma50}
- MA200: $${marketData.technicals?.ma200}

Recent News:
${newsData.map(news => `- ${news.title} (${news.sentiment})`).join('\n')}

Provide an enhanced analysis that:
1. Validates or adjusts the recommendation
2. Provides specific entry/exit points
3. Identifies key risk factors
4. Suggests position sizing
5. Sets stop-loss and take-profit levels

Respond in JSON format:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 0-100,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "enhancedReasoning": "detailed analysis",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "positionSize": "percentage of portfolio",
  "keyRisks": ["risk1", "risk2"],
  "timeframe": "short|medium|long term"
}
`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse Gemini response
      try {
        const enhancedAnalysis = JSON.parse(text)
        
        return {
          ...agentDecision,
          recommendation: enhancedAnalysis.recommendation || agentDecision.recommendation,
          confidence: Math.min(enhancedAnalysis.confidence || agentDecision.confidence, 100),
          riskLevel: enhancedAnalysis.riskLevel || agentDecision.riskLevel,
          reasoning: enhancedAnalysis.enhancedReasoning || agentDecision.reasoning,
          supportingData: {
            ...agentDecision.supportingData,
            geminiEnhanced: true,
            entryPrice: enhancedAnalysis.entryPrice,
            stopLoss: enhancedAnalysis.stopLoss,
            takeProfit: enhancedAnalysis.takeProfit,
            positionSize: enhancedAnalysis.positionSize,
            keyRisks: enhancedAnalysis.keyRisks,
            timeframe: enhancedAnalysis.timeframe
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini response, using original analysis')
        return agentDecision
      }

    } catch (error) {
      console.error('Error enhancing analysis with Gemini:', error)
      return agentDecision
    }
  }

  // Store analysis session in backend
  private async storeAnalysisSession(session: AgentAnalysisSession): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('agent_analysis_sessions')
        .insert({
          session_id: session.id,
          timestamp: session.timestamp.toISOString(),
          market_conditions: session.marketConditions,
          agent_decisions: session.agentDecisions,
          final_recommendation: session.finalRecommendation,
          consensus: session.consensus,
          executed: session.executed,
          symbols: this.watchedSymbols
        })
        .select()
        .single()

      if (error) {
        console.error('Error storing analysis session:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error storing analysis session:', error)
      return null
    }
  }

  // Execute trades through paper trading engine
  private async executePaperTrade(decision: RealAgentDecision): Promise<string | null> {
    if (decision.recommendation === 'HOLD') {
      return null
    }

    try {
      // Get or create agent in paper trading engine
      let agentId = 'advanced-ai-agent'
      const existingAgent = paperTradingEngine.getAgent(agentId)
      
      if (!existingAgent) {
        agentId = await paperTradingEngine.createAgent({
          name: 'Advanced AI Trading Agent',
          strategy: {
            id: 'ai-multi-agent',
            name: 'Multi-Agent AI Strategy',
            type: 'custom',
            parameters: {
              useGeminiAI: true,
              multiAgentConsensus: true,
              riskManagement: true
            },
            signals: [],
            description: 'Advanced AI trading with multi-agent consensus and Gemini enhancement'
          },
          initialCapital: 10000,
          riskLimits: {
            maxPositionSize: 0.1, // 10% max position
            maxDailyLoss: 0.05, // 5% max daily loss
            stopLossEnabled: true,
            takeProfitEnabled: true
          }
        })
      }

      // Calculate position size based on risk level and confidence
      const portfolio = paperTradingEngine.getPortfolio(agentId)
      if (!portfolio) {
        throw new Error('Portfolio not found')
      }

      const basePositionSize = decision.riskLevel === 'LOW' ? 0.05 : 
                              decision.riskLevel === 'MEDIUM' ? 0.03 : 0.02
      const confidenceMultiplier = decision.confidence / 100
      const positionSize = basePositionSize * confidenceMultiplier
      const quantity = (portfolio.totalValue * positionSize) / decision.marketData.price

      // Place order
      const orderId = await paperTradingEngine.placeOrder(agentId, {
        symbol: decision.marketData.symbol,
        type: 'market',
        side: decision.recommendation.toLowerCase() as 'buy' | 'sell',
        quantity,
        timeInForce: 'ioc',
        stopLoss: decision.supportingData?.stopLoss,
        takeProfit: decision.supportingData?.takeProfit
      })

      console.log(`✅ Paper trade executed: ${decision.recommendation} ${quantity.toFixed(4)} ${decision.marketData.symbol}`)
      
      // Send notification
      await appriseNotificationService.notifyTrade(
        decision.marketData.symbol,
        decision.recommendation,
        quantity,
        decision.marketData.price,
        true
      )

      return orderId
    } catch (error) {
      console.error('Error executing paper trade:', error)
      
      // Send failure notification
      await appriseNotificationService.notifyTrade(
        decision.marketData.symbol,
        decision.recommendation,
        0,
        decision.marketData.price,
        false
      )
      
      return null
    }
  }

  // Main analysis function - now accepts existing market prices
  async runRealAnalysis(symbol: string = 'BTC/USD', existingPrices: any[] = []): Promise<AgentAnalysisSession> {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress')
    }

    this.isAnalyzing = true

    try {
      console.log(`🔄 Starting real analysis for ${symbol}...`)

      // Get real market data and news
      const marketData = this.getRealMarketData(symbol, existingPrices)
      const newsData = await this.getRealNewsData(symbol)

      console.log(`📊 Market data: ${symbol} at $${marketData.price} (${marketData.change24h > 0 ? '+' : ''}${marketData.change24h.toFixed(2)}%)`)

      // Run multi-agent analysis
      const analysisResult = await this.coordinator.analyzeAndDecide({
        marketData,
        newsData,
        portfolioValue: 10000,
        currentPositions: [],
        marketVolatility: Math.abs(marketData.change24h) / 100
      })

      // Enhance each agent decision with Gemini AI
      const enhancedDecisions: RealAgentDecision[] = []
      
      for (const decision of analysisResult.agentDecisions) {
        const enhanced = await this.enhanceAnalysisWithGemini(decision, marketData, newsData)
        const realDecision: RealAgentDecision = {
          ...enhanced,
          marketData,
          newsData,
          executionPlan: {
            symbol: marketData.symbol,
            action: enhanced.recommendation,
            quantity: enhanced.supportingData?.positionSize,
            price: enhanced.supportingData?.entryPrice || marketData.price,
            stopLoss: enhanced.supportingData?.stopLoss,
            takeProfit: enhanced.supportingData?.takeProfit
          }
        }
        
        enhancedDecisions.push(realDecision)
      }

      // Enhance final decision
      const enhancedFinal = await this.enhanceAnalysisWithGemini(
        analysisResult.finalDecision, 
        marketData, 
        newsData
      )

      const finalDecision: RealAgentDecision = {
        ...enhancedFinal,
        marketData,
        newsData,
        executionPlan: {
          symbol: marketData.symbol,
          action: enhancedFinal.recommendation,
          quantity: enhancedFinal.supportingData?.positionSize,
          price: enhancedFinal.supportingData?.entryPrice || marketData.price,
          stopLoss: enhancedFinal.supportingData?.stopLoss,
          takeProfit: enhancedFinal.supportingData?.takeProfit
        }
      }

      // Create analysis session
      const session: AgentAnalysisSession = {
        id: `session_${Date.now()}`,
        timestamp: new Date(),
        marketConditions: {
          volatility: Math.abs(marketData.change24h) / 100,
          trend: marketData.change24h > 2 ? 'bullish' : marketData.change24h < -2 ? 'bearish' : 'sideways',
          volume: marketData.volume,
          sentiment: newsData.reduce((acc, news) => {
            return acc + (news.sentiment === 'positive' ? 1 : news.sentiment === 'negative' ? -1 : 0)
          }, 0) / newsData.length
        },
        agentDecisions: enhancedDecisions,
        finalRecommendation: finalDecision,
        consensus: analysisResult.consensus,
        executed: false
      }

      // Store in backend
      const backendId = await this.storeAnalysisSession(session)
      if (backendId) {
        finalDecision.backendId = backendId
      }

      // Execute paper trade if confidence is high enough
      if (finalDecision.confidence > 70 && finalDecision.recommendation !== 'HOLD') {
        const paperTradeId = await this.executePaperTrade(finalDecision)
        if (paperTradeId) {
          finalDecision.paperTradeId = paperTradeId
          session.executed = true
        }
      }

      // Send agent decision notification
      if (finalDecision.confidence > 80) {
        await appriseNotificationService.notifyAgentDecision(
          'Advanced Trading Agents',
          finalDecision.recommendation,
          finalDecision.confidence
        )
      }

      // Add to history
      this.analysisHistory.unshift(session)
      if (this.analysisHistory.length > 50) {
        this.analysisHistory = this.analysisHistory.slice(0, 50)
      }

      console.log(`✅ Analysis complete: ${finalDecision.recommendation} with ${finalDecision.confidence}% confidence`)

      return session

    } catch (error) {
      console.error('Error in real analysis:', error)
      throw error
    } finally {
      this.isAnalyzing = false
    }
  }

  // Auto-analysis mode - now requires market prices to be passed
  async startAutoAnalysis(intervalMinutes: number = 15, getMarketPrices?: () => any[]) {
    if (this.autoMode) {
      console.warn('Auto analysis already running')
      return
    }

    this.autoMode = true
    console.log(`🚀 Starting auto analysis every ${intervalMinutes} minutes`)

    const runAnalysis = async () => {
      if (!this.autoMode) return

      try {
        // Get current market prices
        const currentPrices = getMarketPrices ? getMarketPrices() : []
        
        for (const symbol of this.watchedSymbols) {
          if (!this.autoMode) break
          
          await this.runRealAnalysis(symbol, currentPrices)
          
          // Wait 10 seconds between symbols to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 10000))
        }
      } catch (error) {
        console.error('Error in auto analysis:', error)
      }

      // Schedule next analysis
      if (this.autoMode) {
        setTimeout(runAnalysis, intervalMinutes * 60 * 1000)
      }
    }

    // Start first analysis
    runAnalysis()
  }

  stopAutoAnalysis() {
    this.autoMode = false
    console.log('🛑 Auto analysis stopped')
  }

  // Utility methods
  private calculateRSI(price: number): number {
    // Simplified RSI calculation (normally requires price history)
    return 30 + Math.random() * 40 // Mock RSI between 30-70
  }

  // Getters
  getAnalysisHistory(): AgentAnalysisSession[] {
    return [...this.analysisHistory]
  }

  isAutoModeActive(): boolean {
    return this.autoMode
  }

  isCurrentlyAnalyzing(): boolean {
    return this.isAnalyzing
  }

  getWatchedSymbols(): string[] {
    return [...this.watchedSymbols]
  }

  setWatchedSymbols(symbols: string[]) {
    this.watchedSymbols = symbols
  }

  // Get current paper trading performance
  async getPaperTradingPerformance(): Promise<any> {
    try {
      const agentId = 'advanced-ai-agent'
      const portfolio = paperTradingEngine.getPortfolio(agentId)
      const agent = paperTradingEngine.getAgent(agentId)
      
      return {
        portfolio,
        performance: agent?.performance,
        recentTrades: portfolio?.transactions.slice(-10) || []
      }
    } catch (error) {
      console.error('Error getting paper trading performance:', error)
      return null
    }
  }
}

// Export singleton instance
export const realTradingAgentsService = new RealTradingAgentsService()

// React hook for easy integration
export function useRealTradingAgents() {
  return {
    runAnalysis: (symbol?: string, existingPrices?: any[]) => realTradingAgentsService.runRealAnalysis(symbol, existingPrices),
    startAutoAnalysis: (interval?: number, getMarketPrices?: () => any[]) => realTradingAgentsService.startAutoAnalysis(interval, getMarketPrices),
    stopAutoAnalysis: () => realTradingAgentsService.stopAutoAnalysis(),
    getHistory: () => realTradingAgentsService.getAnalysisHistory(),
    isAutoActive: () => realTradingAgentsService.isAutoModeActive(),
    isAnalyzing: () => realTradingAgentsService.isCurrentlyAnalyzing(),
    getWatchedSymbols: () => realTradingAgentsService.getWatchedSymbols(),
    setWatchedSymbols: (symbols: string[]) => realTradingAgentsService.setWatchedSymbols(symbols),
    getPaperTradingPerformance: () => realTradingAgentsService.getPaperTradingPerformance(),
    getRealMarketData: (symbol: string, prices: any[]) => realTradingAgentsService.getRealMarketData(symbol, prices)
  }
}