'use client'

import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { BaseMessage } from '@langchain/core/messages'

// Enhanced Trading Agents Framework
// Based on TauricResearch/TradingAgents multi-agent architecture

export interface MarketData {
  symbol: string
  price: number
  volume: number
  change24h: number
  timestamp: Date
  technicals?: {
    rsi: number
    ma50: number
    ma200: number
    bollinger: { upper: number; middle: number; lower: number }
  }
}

export interface NewsData {
  title: string
  content: string
  sentiment: 'positive' | 'negative' | 'neutral'
  source: string
  timestamp: Date
  relevanceScore: number
}

export interface AgentDecision {
  agentType: string
  agentId: string
  recommendation: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reasoning: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  timestamp: Date
  supportingData?: any
}

export interface TradingStrategy {
  strategyName: string
  entrySignal: string
  exitSignal: string
  riskManagement: string
  expectedReturn: number
  maxDrawdown: number
}

// Base Agent Class
abstract class BaseAgent {
  protected id: string
  protected name: string
  protected model: ChatOpenAI
  protected conversationHistory: BaseMessage[]

  constructor(id: string, name: string, modelConfig?: any) {
    this.id = id
    this.name = name
    this.model = new ChatOpenAI({
      modelName: modelConfig?.model || 'gpt-4',
      temperature: modelConfig?.temperature || 0.3,
      maxTokens: modelConfig?.maxTokens || 2000,
    })
    this.conversationHistory = []
  }

  abstract analyze(data: any): Promise<AgentDecision>

  protected async callModel(messages: BaseMessage[]): Promise<string> {
    try {
      const response = await this.model.invoke(messages)
      return response.content as string
    } catch (error) {
      console.error(`Error in ${this.name}:`, error)
      return 'Analysis unavailable due to technical issues.'
    }
  }

  protected addToHistory(message: BaseMessage) {
    this.conversationHistory.push(message)
    // Keep only last 10 messages to manage context
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10)
    }
  }
}

// Fundamental Analyst Agent
export class FundamentalAnalyst extends BaseAgent {
  constructor() {
    super('fundamental-001', 'Fundamental Analyst', { temperature: 0.2 })
  }

  async analyze(data: { marketData: MarketData; newsData: NewsData[] }): Promise<AgentDecision> {
    const systemPrompt = new SystemMessage(`
      You are a Fundamental Analysis expert specializing in cryptocurrency and traditional markets.
      
      Your role:
      - Analyze market fundamentals, news sentiment, and macroeconomic factors
      - Evaluate long-term value propositions and market adoption trends
      - Assess regulatory impacts and institutional sentiment
      - Provide buy/sell/hold recommendations with confidence levels
      
      Analysis Framework:
      1. Evaluate news sentiment and market-moving events
      2. Assess adoption metrics and technological developments
      3. Consider regulatory environment and institutional flows
      4. Determine fair value and growth potential
      
      Respond with a structured analysis including:
      - Clear BUY/SELL/HOLD recommendation
      - Confidence level (0-100%)
      - 2-3 key supporting arguments
      - Risk assessment (LOW/MEDIUM/HIGH)
    `)

    const userPrompt = new HumanMessage(`
      Analyze ${data.marketData.symbol} fundamental outlook:
      
      Current Price: $${data.marketData.price}
      24h Change: ${data.marketData.change24h}%
      Volume: ${data.marketData.volume}
      
      Recent News (${data.newsData.length} articles):
      ${data.newsData.slice(0, 3).map(news => 
        `- ${news.title} (${news.sentiment} sentiment, score: ${news.relevanceScore})`
      ).join('\\n')}
      
      Provide your fundamental analysis and recommendation.
    `)

    this.addToHistory(systemPrompt)
    this.addToHistory(userPrompt)

    const response = await this.callModel([systemPrompt, userPrompt])
    
    // Parse response to extract decision
    const recommendation = this.extractRecommendation(response)
    const confidence = this.extractConfidence(response)
    const riskLevel = this.extractRiskLevel(response)

    const decision: AgentDecision = {
      agentType: 'FUNDAMENTAL',
      agentId: this.id,
      recommendation,
      confidence,
      reasoning: response,
      riskLevel,
      timestamp: new Date(),
      supportingData: { newsCount: data.newsData.length, marketData: data.marketData }
    }

    this.addToHistory(new AIMessage(response))
    return decision
  }

  private extractRecommendation(text: string): 'BUY' | 'SELL' | 'HOLD' {
    const upperText = text.toUpperCase()
    if (upperText.includes('BUY') && !upperText.includes("DON'T BUY")) return 'BUY'
    if (upperText.includes('SELL')) return 'SELL'
    return 'HOLD'
  }

  private extractConfidence(text: string): number {
    const confidenceMatch = text.match(/confidence[:\s]*(\d+)%?/i)
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 70
  }

  private extractRiskLevel(text: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const upperText = text.toUpperCase()
    if (upperText.includes('HIGH RISK')) return 'HIGH'
    if (upperText.includes('LOW RISK')) return 'LOW'
    return 'MEDIUM'
  }
}

// Technical Analyst Agent
export class TechnicalAnalyst extends BaseAgent {
  constructor() {
    super('technical-001', 'Technical Analyst', { temperature: 0.1 })
  }

  async analyze(data: { marketData: MarketData }): Promise<AgentDecision> {
    const { marketData } = data
    const { technicals } = marketData

    const systemPrompt = new SystemMessage(`
      You are a Technical Analysis expert specializing in chart patterns, indicators, and price action.
      
      Your role:
      - Analyze technical indicators and chart patterns
      - Identify support/resistance levels and trend directions
      - Evaluate momentum and volatility signals
      - Provide precise entry/exit recommendations
      
      Analysis Framework:
      1. Trend Analysis (Moving Averages, Price Action)
      2. Momentum Indicators (RSI, MACD)
      3. Volatility Analysis (Bollinger Bands)
      4. Support/Resistance Levels
      
      Respond with structured technical analysis including:
      - Clear BUY/SELL/HOLD recommendation
      - Confidence level based on signal strength
      - Key technical levels and patterns
      - Risk assessment and stop-loss suggestions
    `)

    const userPrompt = new HumanMessage(`
      Technical Analysis for ${marketData.symbol}:
      
      Current Price: $${marketData.price}
      24h Change: ${marketData.change24h}%
      Volume: ${marketData.volume}
      
      Technical Indicators:
      - RSI: ${technicals?.rsi || 'N/A'}
      - MA50: $${technicals?.ma50 || 'N/A'}
      - MA200: $${technicals?.ma200 || 'N/A'}
      - Bollinger Bands: Upper $${technicals?.bollinger?.upper || 'N/A'}, Lower $${technicals?.bollinger?.lower || 'N/A'}
      
      Provide your technical analysis and trading recommendation.
    `)

    this.addToHistory(systemPrompt)
    this.addToHistory(userPrompt)

    const response = await this.callModel([systemPrompt, userPrompt])
    
    const recommendation = this.extractRecommendation(response)
    const confidence = this.extractConfidence(response)
    const riskLevel = this.extractRiskLevel(response)

    const decision: AgentDecision = {
      agentType: 'TECHNICAL',
      agentId: this.id,
      recommendation,
      confidence,
      reasoning: response,
      riskLevel,
      timestamp: new Date(),
      supportingData: { technicals, priceAction: marketData }
    }

    this.addToHistory(new AIMessage(response))
    return decision
  }

  private extractRecommendation(text: string): 'BUY' | 'SELL' | 'HOLD' {
    const upperText = text.toUpperCase()
    if (upperText.includes('BUY') && !upperText.includes("DON'T BUY")) return 'BUY'
    if (upperText.includes('SELL')) return 'SELL'
    return 'HOLD'
  }

  private extractConfidence(text: string): number {
    const confidenceMatch = text.match(/confidence[:\s]*(\d+)%?/i)
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 65
  }

  private extractRiskLevel(text: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const upperText = text.toUpperCase()
    if (upperText.includes('HIGH RISK')) return 'HIGH'
    if (upperText.includes('LOW RISK')) return 'LOW'
    return 'MEDIUM'
  }
}

// Sentiment Analyst Agent
export class SentimentAnalyst extends BaseAgent {
  constructor() {
    super('sentiment-001', 'Sentiment Analyst', { temperature: 0.4 })
  }

  async analyze(data: { newsData: NewsData[]; socialData?: any }): Promise<AgentDecision> {
    const systemPrompt = new SystemMessage(`
      You are a Market Sentiment Analysis expert specializing in news sentiment and social media trends.
      
      Your role:
      - Analyze news sentiment and social media buzz
      - Identify market fear, greed, and sentiment shifts
      - Evaluate media coverage impact on price movements
      - Detect sentiment-driven buying/selling opportunities
      
      Analysis Framework:
      1. News Sentiment Analysis (positive/negative/neutral)
      2. Media Coverage Volume and Quality
      3. Social Media Trends and Influencer Impact
      4. Sentiment Momentum and Reversals
      
      Respond with sentiment analysis including:
      - BUY/SELL/HOLD recommendation based on sentiment
      - Confidence level in sentiment signals
      - Key sentiment drivers and themes
      - Risk assessment for sentiment-based trades
    `)

    const sentimentScore = data.newsData.reduce((acc, news) => {
      const score = news.sentiment === 'positive' ? 1 : news.sentiment === 'negative' ? -1 : 0
      return acc + (score * news.relevanceScore)
    }, 0) / data.newsData.length

    const userPrompt = new HumanMessage(`
      Sentiment Analysis Request:
      
      News Articles: ${data.newsData.length} total
      Sentiment Breakdown:
      - Positive: ${data.newsData.filter(n => n.sentiment === 'positive').length}
      - Negative: ${data.newsData.filter(n => n.sentiment === 'negative').length}
      - Neutral: ${data.newsData.filter(n => n.sentiment === 'neutral').length}
      
      Overall Sentiment Score: ${sentimentScore.toFixed(2)} (-1 to 1 scale)
      
      Top Headlines:
      ${data.newsData.slice(0, 5).map(news => 
        `- ${news.title} (${news.sentiment}, relevance: ${news.relevanceScore})`
      ).join('\\n')}
      
      Provide your sentiment analysis and trading recommendation.
    `)

    this.addToHistory(systemPrompt)
    this.addToHistory(userPrompt)

    const response = await this.callModel([systemPrompt, userPrompt])
    
    const recommendation = this.determineSentimentRecommendation(sentimentScore, response)
    const confidence = this.extractConfidence(response)
    const riskLevel = this.extractRiskLevel(response)

    const decision: AgentDecision = {
      agentType: 'SENTIMENT',
      agentId: this.id,
      recommendation,
      confidence,
      reasoning: response,
      riskLevel,
      timestamp: new Date(),
      supportingData: { sentimentScore, newsCount: data.newsData.length }
    }

    this.addToHistory(new AIMessage(response))
    return decision
  }

  private determineSentimentRecommendation(sentimentScore: number, analysis: string): 'BUY' | 'SELL' | 'HOLD' {
    // Override with analysis if explicit recommendation found
    const upperText = analysis.toUpperCase()
    if (upperText.includes('BUY') && !upperText.includes("DON'T BUY")) return 'BUY'
    if (upperText.includes('SELL')) return 'SELL'
    
    // Fall back to sentiment score
    if (sentimentScore > 0.3) return 'BUY'
    if (sentimentScore < -0.3) return 'SELL'
    return 'HOLD'
  }

  private extractConfidence(text: string): number {
    const confidenceMatch = text.match(/confidence[:\s]*(\d+)%?/i)
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 60
  }

  private extractRiskLevel(text: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const upperText = text.toUpperCase()
    if (upperText.includes('HIGH RISK')) return 'HIGH'
    if (upperText.includes('LOW RISK')) return 'LOW'
    return 'MEDIUM'
  }
}

// Risk Manager Agent
export class RiskManager extends BaseAgent {
  constructor() {
    super('risk-001', 'Risk Manager', { temperature: 0.1 })
  }

  async analyze(data: { 
    decisions: AgentDecision[]
    portfolioValue: number
    currentPositions: any[]
    marketVolatility: number
  }): Promise<AgentDecision> {
    const systemPrompt = new SystemMessage(`
      You are a Risk Management specialist responsible for portfolio protection and position sizing.
      
      Your role:
      - Evaluate overall portfolio risk and exposure
      - Determine appropriate position sizes and stop-losses
      - Assess correlation risks and diversification
      - Override risky trades and enforce risk limits
      
      Risk Framework:
      1. Position Sizing (max 5% per trade)
      2. Portfolio Correlation Analysis
      3. Volatility-Adjusted Risk Assessment
      4. Maximum Drawdown Protection
      
      Respond with risk assessment including:
      - APPROVE/REJECT/MODIFY recommendation
      - Position size recommendations
      - Stop-loss and take-profit levels
      - Overall portfolio risk rating
    `)

    const conflictingDecisions = this.analyzeDecisionConflicts(data.decisions)
    const riskScore = this.calculatePortfolioRisk(data)

    const userPrompt = new HumanMessage(`
      Risk Management Analysis:
      
      Portfolio Value: $${data.portfolioValue}
      Current Positions: ${data.currentPositions.length}
      Market Volatility: ${(data.marketVolatility * 100).toFixed(1)}%
      
      Agent Decisions to Review:
      ${data.decisions.map(d => 
        `- ${d.agentType}: ${d.recommendation} (${d.confidence}% confidence, ${d.riskLevel} risk)`
      ).join('\\n')}
      
      Decision Conflicts: ${conflictingDecisions}
      Calculated Portfolio Risk Score: ${riskScore.toFixed(2)}/10
      
      Provide risk management recommendation and position sizing guidance.
    `)

    this.addToHistory(systemPrompt)
    this.addToHistory(userPrompt)

    const response = await this.callModel([systemPrompt, userPrompt])
    
    const recommendation = this.determineRiskRecommendation(riskScore, data.decisions, response)
    const confidence = Math.max(80, 100 - (riskScore * 10)) // Higher confidence when risk is lower
    const riskLevel = riskScore > 7 ? 'HIGH' : riskScore > 4 ? 'MEDIUM' : 'LOW'

    const decision: AgentDecision = {
      agentType: 'RISK_MANAGER',
      agentId: this.id,
      recommendation,
      confidence,
      reasoning: response,
      riskLevel,
      timestamp: new Date(),
      supportingData: { 
        riskScore, 
        portfolioValue: data.portfolioValue,
        conflictingDecisions,
        agentConsensus: this.calculateConsensus(data.decisions)
      }
    }

    this.addToHistory(new AIMessage(response))
    return decision
  }

  private analyzeDecisionConflicts(decisions: AgentDecision[]): string {
    const recommendations = decisions.map(d => d.recommendation)
    const uniqueRecs = [...new Set(recommendations)]
    
    if (uniqueRecs.length === 1) return 'No conflicts - all agents agree'
    if (uniqueRecs.length === 2) return 'Minor conflict - mixed signals'
    return 'Major conflict - agents strongly disagree'
  }

  private calculatePortfolioRisk(data: any): number {
    let riskScore = 0
    
    // Market volatility risk
    riskScore += data.marketVolatility * 30
    
    // Position concentration risk
    if (data.currentPositions.length > 10) riskScore += 2
    if (data.currentPositions.length < 3) riskScore += 1
    
    // Agent consensus risk
    const decisions = data.decisions
    const buyCount = decisions.filter(d => d.recommendation === 'BUY').length
    const sellCount = decisions.filter(d => d.recommendation === 'SELL').length
    const consensus = Math.abs(buyCount - sellCount) / decisions.length
    riskScore += (1 - consensus) * 3
    
    return Math.min(10, riskScore)
  }

  private calculateConsensus(decisions: AgentDecision[]): number {
    if (decisions.length === 0) return 0
    
    const recommendations = decisions.map(d => d.recommendation)
    const counts = {
      BUY: recommendations.filter(r => r === 'BUY').length,
      SELL: recommendations.filter(r => r === 'SELL').length,
      HOLD: recommendations.filter(r => r === 'HOLD').length
    }
    
    const maxCount = Math.max(...Object.values(counts))
    return maxCount / decisions.length
  }

  private determineRiskRecommendation(riskScore: number, decisions: AgentDecision[], analysis: string): 'BUY' | 'SELL' | 'HOLD' {
    // High risk override
    if (riskScore > 8) return 'HOLD'
    
    // Check analysis for explicit override
    const upperText = analysis.toUpperCase()
    if (upperText.includes('REJECT') || upperText.includes('STOP')) return 'HOLD'
    
    // Follow majority consensus if risk is acceptable
    const consensus = this.calculateConsensus(decisions)
    if (consensus > 0.6) {
      const majorityRec = decisions
        .reduce((acc, d) => {
          acc[d.recommendation] = (acc[d.recommendation] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      
      const majority = Object.entries(majorityRec).sort((a, b) => b[1] - a[1])[0][0]
      return majority as 'BUY' | 'SELL' | 'HOLD'
    }
    
    return 'HOLD'
  }

  private extractConfidence(text: string): number {
    const confidenceMatch = text.match(/confidence[:\s]*(\d+)%?/i)
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 85
  }

  private extractRiskLevel(text: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const upperText = text.toUpperCase()
    if (upperText.includes('HIGH RISK')) return 'HIGH'
    if (upperText.includes('LOW RISK')) return 'LOW'
    return 'MEDIUM'
  }
}

// Multi-Agent Coordinator
export class TradingAgentCoordinator {
  private fundamentalAnalyst: FundamentalAnalyst
  private technicalAnalyst: TechnicalAnalyst
  private sentimentAnalyst: SentimentAnalyst
  private riskManager: RiskManager

  constructor() {
    this.fundamentalAnalyst = new FundamentalAnalyst()
    this.technicalAnalyst = new TechnicalAnalyst()
    this.sentimentAnalyst = new SentimentAnalyst()
    this.riskManager = new RiskManager()
  }

  async analyzeAndDecide(analysisData: {
    marketData: MarketData
    newsData: NewsData[]
    portfolioValue: number
    currentPositions: any[]
    marketVolatility: number
  }): Promise<{
    finalDecision: AgentDecision
    agentDecisions: AgentDecision[]
    consensus: number
    riskAssessment: any
  }> {
    try {
      // Run all agents in parallel for efficiency
      const [fundamentalDecision, technicalDecision, sentimentDecision] = await Promise.all([
        this.fundamentalAnalyst.analyze({
          marketData: analysisData.marketData,
          newsData: analysisData.newsData
        }),
        this.technicalAnalyst.analyze({
          marketData: analysisData.marketData
        }),
        this.sentimentAnalyst.analyze({
          newsData: analysisData.newsData
        })
      ])

      const agentDecisions = [fundamentalDecision, technicalDecision, sentimentDecision]

      // Risk manager evaluates all decisions
      const riskDecision = await this.riskManager.analyze({
        decisions: agentDecisions,
        portfolioValue: analysisData.portfolioValue,
        currentPositions: analysisData.currentPositions,
        marketVolatility: analysisData.marketVolatility
      })

      // Calculate consensus and final decision
      const consensus = this.calculateOverallConsensus(agentDecisions)
      const finalDecision = this.determineFinalDecision(agentDecisions, riskDecision, consensus)

      return {
        finalDecision,
        agentDecisions: [...agentDecisions, riskDecision],
        consensus,
        riskAssessment: riskDecision.supportingData
      }
    } catch (error) {
      console.error('Error in agent coordination:', error)
      
      // Fallback decision
      const fallbackDecision: AgentDecision = {
        agentType: 'COORDINATOR',
        agentId: 'coordinator-001',
        recommendation: 'HOLD',
        confidence: 0,
        reasoning: 'Analysis failed due to technical issues. Defaulting to HOLD for safety.',
        riskLevel: 'HIGH',
        timestamp: new Date()
      }

      return {
        finalDecision: fallbackDecision,
        agentDecisions: [],
        consensus: 0,
        riskAssessment: { error: 'Analysis failed' }
      }
    }
  }

  private calculateOverallConsensus(decisions: AgentDecision[]): number {
    if (decisions.length === 0) return 0
    
    const recommendations = decisions.map(d => d.recommendation)
    const counts = {
      BUY: recommendations.filter(r => r === 'BUY').length,
      SELL: recommendations.filter(r => r === 'SELL').length,
      HOLD: recommendations.filter(r => r === 'HOLD').length
    }
    
    const maxCount = Math.max(...Object.values(counts))
    return maxCount / decisions.length
  }

  private determineFinalDecision(
    agentDecisions: AgentDecision[],
    riskDecision: AgentDecision,
    consensus: number
  ): AgentDecision {
    // Risk manager override
    if (riskDecision.recommendation === 'HOLD' && riskDecision.riskLevel === 'HIGH') {
      return {
        ...riskDecision,
        agentType: 'FINAL_COORDINATOR',
        reasoning: `Risk manager override: ${riskDecision.reasoning}`
      }
    }

    // Strong consensus (>80%) with good confidence
    if (consensus > 0.8) {
      const majorityRec = agentDecisions
        .reduce((acc, d) => {
          acc[d.recommendation] = (acc[d.recommendation] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      
      const majority = Object.entries(majorityRec).sort((a, b) => b[1] - a[1])[0][0] as 'BUY' | 'SELL' | 'HOLD'
      const avgConfidence = agentDecisions
        .filter(d => d.recommendation === majority)
        .reduce((sum, d) => sum + d.confidence, 0) / agentDecisions.filter(d => d.recommendation === majority).length

      return {
        agentType: 'FINAL_COORDINATOR',
        agentId: 'coordinator-001',
        recommendation: majority,
        confidence: Math.round(avgConfidence * consensus),
        reasoning: `Strong consensus (${(consensus * 100).toFixed(0)}%) from ${agentDecisions.length} agents. Risk manager approved.`,
        riskLevel: riskDecision.riskLevel,
        timestamp: new Date(),
        supportingData: {
          consensus,
          agentVotes: agentDecisions.map(d => ({ type: d.agentType, rec: d.recommendation, conf: d.confidence }))
        }
      }
    }

    // Default to HOLD for low consensus or conflicting signals
    return {
      agentType: 'FINAL_COORDINATOR',
      agentId: 'coordinator-001',
      recommendation: 'HOLD',
      confidence: 50,
      reasoning: `Low consensus (${(consensus * 100).toFixed(0)}%) among agents. Defaulting to HOLD for safety.`,
      riskLevel: 'MEDIUM',
      timestamp: new Date(),
      supportingData: {
        consensus,
        agentVotes: agentDecisions.map(d => ({ type: d.agentType, rec: d.recommendation, conf: d.confidence }))
      }
    }
  }

  // Get individual agent status
  getAgentStatus() {
    return {
      fundamentalAnalyst: { id: this.fundamentalAnalyst['id'], name: this.fundamentalAnalyst['name'] },
      technicalAnalyst: { id: this.technicalAnalyst['id'], name: this.technicalAnalyst['name'] },
      sentimentAnalyst: { id: this.sentimentAnalyst['id'], name: this.sentimentAnalyst['name'] },
      riskManager: { id: this.riskManager['id'], name: this.riskManager['name'] }
    }
  }
}

// Export singleton instance
export const tradingAgentCoordinator = new TradingAgentCoordinator()