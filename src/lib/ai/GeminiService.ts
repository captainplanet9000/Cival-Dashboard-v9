/**
 * Gemini AI Service
 * Free LLM integration for agent decision making and analysis
 */

import { MarketData, PersistentPosition, AgentPortfolio } from '@/lib/paper-trading/PersistentTradingEngine'

export interface AIDecisionRequest {
  agentId: string
  agentType: string
  portfolio: AgentPortfolio
  marketData: MarketData[]
  currentPositions: PersistentPosition[]
  riskProfile: {
    riskTolerance: number
    maxDrawdown: number
    timeHorizon: string
  }
  tradingHistory: any[]
  context?: string
}

export interface AIDecision {
  decision: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE'
  symbol: string
  confidence: number
  reasoning: string
  suggestedSize?: number
  suggestedPrice?: number
  stopLoss?: number
  takeProfit?: number
  timeframe: string
  riskScore: number
  timestamp: number
}

export interface MemoryEntry {
  id: string
  agentId: string
  type: 'decision' | 'observation' | 'learning' | 'strategy_update'
  content: string
  context: any
  importance: number
  timestamp: number
  tags: string[]
}

class GeminiService {
  private apiKey: string | null = null
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  private model = 'gemini-pro'
  private agentMemories: Map<string, MemoryEntry[]> = new Map()
  private maxMemoryEntries = 100

  constructor() {
    // Try to get API key from environment or localStorage
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                  localStorage.getItem('gemini_api_key') ||
                  null
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey
    localStorage.setItem('gemini_api_key', apiKey)
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  // Main AI decision making method
  async makeDecision(request: AIDecisionRequest): Promise<AIDecision> {
    try {
      if (!this.isConfigured()) {
        return this.createFallbackDecision(request)
      }

      // Get agent memory context
      const memories = this.getAgentMemory(request.agentId)
      const memoryContext = memories
        .slice(-10) // Last 10 memories
        .map(m => `${m.type}: ${m.content}`)
        .join('\n')

      // Build comprehensive prompt
      const prompt = this.buildDecisionPrompt(request, memoryContext)

      // Call Gemini API
      const response = await this.callGeminiAPI(prompt)
      const decision = this.parseAIResponse(response, request)

      // Store decision in memory
      this.addToMemory(request.agentId, {
        id: `decision_${Date.now()}`,
        agentId: request.agentId,
        type: 'decision',
        content: `Decision: ${decision.decision} ${decision.symbol} - ${decision.reasoning}`,
        context: { decision, request },
        importance: decision.confidence,
        timestamp: Date.now(),
        tags: [decision.decision.toLowerCase(), decision.symbol, request.agentType]
      })

      return decision

    } catch (error) {
      console.error('Gemini API error:', error)
      
      // Store error in memory
      this.addToMemory(request.agentId, {
        id: `error_${Date.now()}`,
        agentId: request.agentId,
        type: 'observation',
        content: `AI service error: ${error}. Using fallback decision.`,
        context: { error: error?.toString() },
        importance: 0.3,
        timestamp: Date.now(),
        tags: ['error', 'fallback']
      })

      return this.createFallbackDecision(request)
    }
  }

  // Market analysis method
  async analyzeMarket(
    symbols: string[], 
    marketData: MarketData[], 
    timeframe: string = '1h'
  ): Promise<{
    sentiment: 'bullish' | 'bearish' | 'neutral'
    confidence: number
    analysis: string
    recommendations: string[]
  }> {
    try {
      if (!this.isConfigured()) {
        return this.createFallbackAnalysis(marketData)
      }

      const prompt = this.buildMarketAnalysisPrompt(symbols, marketData, timeframe)
      const response = await this.callGeminiAPI(prompt)
      
      return this.parseMarketAnalysis(response)

    } catch (error) {
      console.error('Market analysis error:', error)
      return this.createFallbackAnalysis(marketData)
    }
  }

  // Risk assessment method
  async assessRisk(
    portfolio: AgentPortfolio,
    marketData: MarketData[],
    positions: PersistentPosition[]
  ): Promise<{
    riskScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    concerns: string[]
    recommendations: string[]
  }> {
    try {
      if (!this.isConfigured()) {
        return this.createFallbackRiskAssessment(portfolio, positions)
      }

      const prompt = this.buildRiskAssessmentPrompt(portfolio, marketData, positions)
      const response = await this.callGeminiAPI(prompt)
      
      return this.parseRiskAssessment(response)

    } catch (error) {
      console.error('Risk assessment error:', error)
      return this.createFallbackRiskAssessment(portfolio, positions)
    }
  }

  // Memory management
  private addToMemory(agentId: string, entry: MemoryEntry): void {
    if (!this.agentMemories.has(agentId)) {
      this.agentMemories.set(agentId, [])
    }

    const memories = this.agentMemories.get(agentId)!
    memories.push(entry)

    // Maintain memory limit
    if (memories.length > this.maxMemoryEntries) {
      // Remove oldest, least important memories
      memories.sort((a, b) => (b.importance * b.timestamp) - (a.importance * a.timestamp))
      memories.splice(this.maxMemoryEntries)
    }

    // Persist to localStorage
    this.persistMemories()
  }

  getAgentMemory(agentId: string): MemoryEntry[] {
    return this.agentMemories.get(agentId) || []
  }

  clearAgentMemory(agentId: string): void {
    this.agentMemories.delete(agentId)
    this.persistMemories()
  }

  // API interaction methods
  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API')
    }

    return data.candidates[0].content.parts[0].text
  }

  // Prompt building methods
  private buildDecisionPrompt(request: AIDecisionRequest, memoryContext: string): string {
    return `You are a ${request.agentType} trading agent making decisions for portfolio ${request.agentId}.

CURRENT PORTFOLIO:
- Cash: $${request.portfolio.cash.toFixed(2)}
- Total Value: $${request.portfolio.totalValue.toFixed(2)}
- Unrealized P&L: $${request.portfolio.unrealizedPnL.toFixed(2)}
- Realized P&L: $${request.portfolio.realizedPnL.toFixed(2)}

RISK PROFILE:
- Risk Tolerance: ${request.riskProfile.riskTolerance}%
- Max Drawdown: ${request.riskProfile.maxDrawdown}%
- Time Horizon: ${request.riskProfile.timeHorizon}

CURRENT POSITIONS:
${request.currentPositions.map(p => 
  `- ${p.symbol}: ${p.side} ${p.size} @ $${p.entryPrice} (P&L: $${p.unrealizedPnL.toFixed(2)})`
).join('\n')}

MARKET DATA:
${request.marketData.map(m => 
  `- ${m.symbol}: $${m.price.toFixed(2)} (24h: ${m.changePercent24h.toFixed(2)}%)`
).join('\n')}

RECENT MEMORY:
${memoryContext}

CONTEXT: ${request.context || 'Regular trading session'}

Based on this information, make a trading decision. Respond in this exact JSON format:
{
  "decision": "BUY|SELL|HOLD|CLOSE",
  "symbol": "symbol to trade",
  "confidence": 0.8,
  "reasoning": "detailed explanation",
  "suggestedSize": 0.1,
  "suggestedPrice": 45000,
  "stopLoss": 44000,
  "takeProfit": 47000,
  "timeframe": "1h",
  "riskScore": 6.5
}`
  }

  private buildMarketAnalysisPrompt(symbols: string[], marketData: MarketData[], timeframe: string): string {
    return `Analyze the current market conditions for these symbols: ${symbols.join(', ')}

MARKET DATA:
${marketData.map(m => 
  `${m.symbol}: $${m.price.toFixed(2)} (24h change: ${m.changePercent24h.toFixed(2)}%, volume: ${m.volume.toLocaleString()})`
).join('\n')}

TIMEFRAME: ${timeframe}

Provide a comprehensive market analysis. Respond in this JSON format:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.75,
  "analysis": "detailed market analysis",
  "recommendations": ["recommendation 1", "recommendation 2"]
}`
  }

  private buildRiskAssessmentPrompt(
    portfolio: AgentPortfolio,
    marketData: MarketData[],
    positions: PersistentPosition[]
  ): string {
    return `Assess the risk level of this trading portfolio:

PORTFOLIO:
- Total Value: $${portfolio.totalValue.toFixed(2)}
- Cash: $${portfolio.cash.toFixed(2)}
- Unrealized P&L: $${portfolio.unrealizedPnL.toFixed(2)}
- Margin Used: $${portfolio.marginUsed.toFixed(2)}

POSITIONS:
${positions.map(p => 
  `- ${p.symbol}: ${p.side} ${p.size} @ $${p.entryPrice} (Current: $${p.currentPrice}, P&L: $${p.unrealizedPnL.toFixed(2)})`
).join('\n')}

MARKET CONDITIONS:
${marketData.map(m => 
  `${m.symbol}: $${m.price.toFixed(2)} (24h: ${m.changePercent24h.toFixed(2)}%)`
).join('\n')}

Assess the risk and provide recommendations. Respond in this JSON format:
{
  "riskScore": 7.2,
  "riskLevel": "HIGH",
  "concerns": ["concern 1", "concern 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`
  }

  // Response parsing methods
  private parseAIResponse(response: string, request: AIDecisionRequest): AIDecision {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          decision: parsed.decision || 'HOLD',
          symbol: parsed.symbol || request.marketData[0]?.symbol || 'BTC/USDT',
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
          reasoning: parsed.reasoning || 'AI analysis',
          suggestedSize: parsed.suggestedSize,
          suggestedPrice: parsed.suggestedPrice,
          stopLoss: parsed.stopLoss,
          takeProfit: parsed.takeProfit,
          timeframe: parsed.timeframe || '1h',
          riskScore: Math.max(0, Math.min(10, parsed.riskScore || 5)),
          timestamp: Date.now()
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
    }

    // Fallback parsing
    const decision = response.includes('BUY') ? 'BUY' : 
                    response.includes('SELL') ? 'SELL' : 
                    response.includes('CLOSE') ? 'CLOSE' : 'HOLD'

    return {
      decision: decision as AIDecision['decision'],
      symbol: request.marketData[0]?.symbol || 'BTC/USDT',
      confidence: 0.5,
      reasoning: response.substring(0, 200),
      timeframe: '1h',
      riskScore: 5,
      timestamp: Date.now()
    }
  }

  private parseMarketAnalysis(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Failed to parse market analysis:', error)
    }

    return {
      sentiment: 'neutral',
      confidence: 0.5,
      analysis: response.substring(0, 300),
      recommendations: ['Monitor market conditions', 'Maintain current positions']
    }
  }

  private parseRiskAssessment(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Failed to parse risk assessment:', error)
    }

    return {
      riskScore: 5,
      riskLevel: 'MEDIUM',
      concerns: ['General market volatility'],
      recommendations: ['Monitor positions closely', 'Consider risk management']
    }
  }

  // Fallback methods for when API is not available
  private createFallbackDecision(request: AIDecisionRequest): AIDecision {
    const symbol = request.marketData[0]?.symbol || 'BTC/USDT'
    const marketData = request.marketData.find(m => m.symbol === symbol)
    
    let decision: AIDecision['decision'] = 'HOLD'
    let reasoning = 'Maintaining current position due to API unavailability'
    
    // Simple momentum-based logic
    if (marketData && request.agentType === 'momentum') {
      if (marketData.changePercent24h > 2) {
        decision = 'BUY'
        reasoning = 'Positive momentum detected (24h change > 2%)'
      } else if (marketData.changePercent24h < -2) {
        decision = 'SELL'
        reasoning = 'Negative momentum detected (24h change < -2%)'
      }
    }

    return {
      decision,
      symbol,
      confidence: 0.6,
      reasoning,
      timeframe: '1h',
      riskScore: 5,
      timestamp: Date.now()
    }
  }

  private createFallbackAnalysis(marketData: MarketData[]): any {
    const avgChange = marketData.reduce((sum, m) => sum + m.changePercent24h, 0) / marketData.length
    
    return {
      sentiment: avgChange > 1 ? 'bullish' : avgChange < -1 ? 'bearish' : 'neutral',
      confidence: 0.5,
      analysis: `Average 24h change: ${avgChange.toFixed(2)}%. ${
        avgChange > 1 ? 'Market showing positive momentum' : 
        avgChange < -1 ? 'Market showing negative momentum' : 
        'Market in consolidation phase'
      }`,
      recommendations: ['Monitor key levels', 'Manage risk appropriately']
    }
  }

  private createFallbackRiskAssessment(portfolio: AgentPortfolio, positions: PersistentPosition[]): any {
    const portfolioRisk = Math.abs(portfolio.unrealizedPnL) / portfolio.totalValue
    const riskScore = Math.min(10, portfolioRisk * 10)
    
    return {
      riskScore,
      riskLevel: riskScore > 7 ? 'HIGH' : riskScore > 4 ? 'MEDIUM' : 'LOW',
      concerns: portfolioRisk > 0.1 ? ['High unrealized P&L relative to portfolio'] : [],
      recommendations: ['Monitor position sizes', 'Consider diversification']
    }
  }

  // Persistence methods
  private persistMemories(): void {
    try {
      const memoriesObj = Object.fromEntries(this.agentMemories)
      localStorage.setItem('agent_memories', JSON.stringify(memoriesObj))
    } catch (error) {
      console.error('Failed to persist memories:', error)
    }
  }

  private loadMemories(): void {
    try {
      const stored = localStorage.getItem('agent_memories')
      if (stored) {
        const memoriesObj = JSON.parse(stored)
        this.agentMemories = new Map(Object.entries(memoriesObj))
      }
    } catch (error) {
      console.error('Failed to load memories:', error)
    }
  }

  // Initialize service
  init(): void {
    this.loadMemories()
  }
}

// Singleton instance
// TEMPORARILY DISABLED: Auto-instantiation causing circular dependency
// export const geminiService = new GeminiService()
// geminiService.init()

export default GeminiService