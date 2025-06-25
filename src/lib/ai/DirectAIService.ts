/**
 * Direct AI Service
 * Simple, lightweight AI service using direct OpenAI/Anthropic SDKs
 * Replaces client-side LangChain components for better stability
 */

import OpenAI from 'openai'

export interface AIConfig {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

export interface AIResponse {
  content: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
  provider: string
}

export interface TradingAnalysisRequest {
  symbol: string
  timeframe: string
  marketData: any
  indicators?: any
  context?: string
}

export interface TradingRecommendation {
  action: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  riskLevel: 'low' | 'medium' | 'high'
  targetPrice?: number
  stopLoss?: number
  timeHorizon: string
}

export class DirectAIService {
  private openai: OpenAI | null = null
  private config: AIConfig

  constructor(config?: Partial<AIConfig>) {
    this.config = {
      provider: 'openai',
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      model: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.1,
      ...config
    }

    if (this.config.apiKey) {
      this.initializeOpenAI()
    }
  }

  private initializeOpenAI(): void {
    try {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
        dangerouslyAllowBrowser: true // Only for demo - use API routes in production
      })
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error)
    }
  }

  /**
   * Get trading analysis using server API
   */
  async getTradingAnalysis(request: TradingAnalysisRequest): Promise<TradingRecommendation> {
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const analysis = await response.json()
      return {
        action: analysis.action || 'hold',
        confidence: analysis.confidence || 0.5,
        reasoning: analysis.reasoning || 'No analysis available',
        riskLevel: analysis.riskLevel || 'medium',
        targetPrice: analysis.targetPrice,
        stopLoss: analysis.stopLoss,
        timeHorizon: analysis.timeHorizon || '1d'
      }

    } catch (error) {
      console.error('Trading analysis failed:', error)
      return {
        action: 'hold',
        confidence: 0,
        reasoning: 'Analysis temporarily unavailable',
        riskLevel: 'medium',
        timeHorizon: '1d'
      }
    }
  }

  /**
   * Get market sentiment analysis using server API
   */
  async getMarketSentiment(symbol: string, newsData?: any[], marketData?: any): Promise<{
    sentiment: 'bullish' | 'bearish' | 'neutral'
    confidence: number
    factors: string[]
    score: number
    summary: string
  }> {
    try {
      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, newsData, marketData })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const analysis = await response.json()
      return {
        sentiment: analysis.sentiment || 'neutral',
        confidence: analysis.confidence || 0.5,
        factors: analysis.factors || [],
        score: analysis.score || 0,
        summary: analysis.summary || 'No analysis available'
      }

    } catch (error) {
      console.error('Sentiment analysis failed:', error)
      return {
        sentiment: 'neutral',
        confidence: 0,
        factors: ['Analysis unavailable'],
        score: 0,
        summary: 'Sentiment analysis temporarily unavailable'
      }
    }
  }

  /**
   * Get risk assessment using server API
   */
  async getRiskAssessment(portfolioData: any, marketConditions?: any, timeframe?: string): Promise<{
    riskScore: number
    riskLevel: 'low' | 'medium' | 'high'
    riskFactors: string[]
    recommendations: string[]
    warnings: string[]
    diversificationScore: number
    volatilityAssessment: string
    maxDrawdownEstimate: number
  }> {
    try {
      const response = await fetch('/api/ai/risk-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolioData, marketConditions, timeframe })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const analysis = await response.json()
      return {
        riskScore: analysis.riskScore || 50,
        riskLevel: analysis.riskLevel || 'medium',
        riskFactors: analysis.riskFactors || [],
        recommendations: analysis.recommendations || [],
        warnings: analysis.warnings || [],
        diversificationScore: analysis.diversificationScore || 50,
        volatilityAssessment: analysis.volatilityAssessment || 'moderate',
        maxDrawdownEstimate: analysis.maxDrawdownEstimate || 10
      }

    } catch (error) {
      console.error('Risk assessment failed:', error)
      return {
        riskScore: 50,
        riskLevel: 'medium',
        riskFactors: ['Analysis unavailable'],
        recommendations: ['Risk analysis temporarily unavailable'],
        warnings: [],
        diversificationScore: 50,
        volatilityAssessment: 'unknown',
        maxDrawdownEstimate: 0
      }
    }
  }

  /**
   * Build trading analysis prompt
   */
  private buildTradingPrompt(request: TradingAnalysisRequest): string {
    return `Analyze ${request.symbol} for ${request.timeframe} trading.

Market Data: ${JSON.stringify(request.marketData, null, 2)}
${request.indicators ? `Technical Indicators: ${JSON.stringify(request.indicators, null, 2)}` : ''}
${request.context ? `Additional Context: ${request.context}` : ''}

Provide trading recommendation in JSON format with:
- action: "buy" | "sell" | "hold"
- confidence: 0-1 scale
- reasoning: detailed explanation
- riskLevel: "low" | "medium" | "high"
- targetPrice: optional number
- stopLoss: optional number  
- timeHorizon: e.g. "1h", "1d", "1w"

Focus on actionable insights for paper trading.`
  }

  /**
   * Health check using server API
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    provider: string
    model: string
    lastChecked: number
    responseTime?: number
    capabilities?: any
  }> {
    try {
      const response = await fetch('/api/ai/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      const healthData = await response.json()
      return {
        status: healthData.status || 'unhealthy',
        provider: healthData.provider || this.config.provider,
        model: healthData.model || this.config.model,
        lastChecked: healthData.lastChecked || Date.now(),
        responseTime: healthData.responseTime,
        capabilities: healthData.capabilities
      }

    } catch (error) {
      console.error('Health check failed:', error)
      return {
        status: 'unhealthy',
        provider: this.config.provider,
        model: this.config.model,
        lastChecked: Date.now()
      }
    }
  }

  /**
   * Get usage statistics (mock for now)
   */
  getUsageStats(): {
    totalCalls: number
    totalTokens: number
    dailyCost: number
  } {
    return {
      totalCalls: 0,
      totalTokens: 0,
      dailyCost: 0
    }
  }
}

// Export singleton instance
export const directAIService = new DirectAIService()