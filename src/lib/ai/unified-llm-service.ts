'use client'

import { GeminiService } from './gemini-service'

export interface AIDecisionRequest {
  agent: {
    id: string
    type: string
    config: any
    strategy: any
  }
  marketData: {
    symbol: string
    price: number
    volume: number
    change: number
    indicators?: any
  }[]
  portfolio: {
    totalValue: number
    cash: number
    positions: any[]
    pnl: number
  }
  memory: {
    recentDecisions: any[]
    performance: any
    lessons: string[]
  }
  goals?: {
    activeGoals: any[]
    totalGoals: number
    completedGoals: number
    priorities: any
  }
  context?: string
}

export interface AIDecision {
  action: 'buy' | 'sell' | 'hold' | 'reduce' | 'increase'
  symbol?: string
  quantity?: number
  price?: number
  reasoning: string
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
  expectedOutcome: string
  stopLoss?: number
  takeProfit?: number
  timeframe: string
  goalAlignment?: string // Which goals this decision supports
  metadata?: any
}

export interface LLMProvider {
  name: string
  isConfigured(): boolean
  makeDecision(request: AIDecisionRequest): Promise<AIDecision>
  isAvailable(): Promise<boolean>
}

class OpenAIProvider implements LLMProvider {
  name = 'openai'
  
  isConfigured(): boolean {
    return !!(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY)
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured()) return false
    
    try {
      // Simple API test
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  async makeDecision(request: AIDecisionRequest): Promise<AIDecision> {
    const prompt = this.buildPrompt(request)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert trading AI agent. Analyze the market data and make trading decisions. Always respond with valid JSON matching the AIDecision interface.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    try {
      return JSON.parse(content)
    } catch {
      return this.parseNaturalLanguageResponse(content, request)
    }
  }
  
  private buildPrompt(request: AIDecisionRequest): string {
    const goalsSection = request.goals && request.goals.activeGoals.length > 0 ? `

ACTIVE GOALS - IMPORTANT: Consider these goals when making decisions:
${request.goals.activeGoals.map(goal => 
  `• ${goal.type.toUpperCase()}: ${goal.description} (Target: ${goal.target}, Progress: ${goal.progress.toFixed(1)}%, Priority: ${goal.priority})`
).join('\n')}

Goal Strategy Guidelines:
- Prioritize HIGH priority goals in decision making
- For profit_target goals: Focus on trades likely to improve P&L
- For win_rate goals: Make conservative, high-confidence trades
- For trade_count goals: Look for valid trading opportunities
- For risk_management goals: Ensure trades stay within risk limits
- Balance goal achievement with overall portfolio health` : ''

    return `
Agent Type: ${request.agent.type}
Portfolio: $${request.portfolio.totalValue.toFixed(2)} total, $${request.portfolio.cash.toFixed(2)} cash
Current P&L: ${request.portfolio.pnl >= 0 ? '+' : ''}$${request.portfolio.pnl.toFixed(2)}

Market Data:
${request.marketData.map(d => `${d.symbol}: $${d.price} (${d.change >= 0 ? '+' : ''}${d.change.toFixed(2)}%)`).join('\n')}

Recent Performance: ${request.memory.performance ? JSON.stringify(request.memory.performance) : 'No data'}${goalsSection}

Make a goal-aware trading decision and respond with JSON:
{
  "action": "buy|sell|hold|reduce|increase",
  "symbol": "symbol if trading",
  "quantity": number,
  "reasoning": "detailed explanation including how this helps achieve goals",
  "confidence": 0.1-1.0,
  "riskLevel": "low|medium|high",
  "expectedOutcome": "what you expect to happen",
  "timeframe": "how long to hold",
  "goalAlignment": "which goals this decision supports"
}
`
  }
  
  private parseNaturalLanguageResponse(content: string, request: AIDecisionRequest): AIDecision {
    // Fallback parser for non-JSON responses
    const action = this.extractAction(content)
    const symbol = this.extractSymbol(content, request.marketData)
    
    return {
      action,
      symbol,
      quantity: this.calculateQuantity(action, request.portfolio, request.agent.config),
      reasoning: content.substring(0, 200),
      confidence: 0.6,
      riskLevel: 'medium',
      expectedOutcome: 'Parsed from natural language response',
      timeframe: '1-4 hours'
    }
  }
  
  private extractAction(content: string): AIDecision['action'] {
    const lower = content.toLowerCase()
    if (lower.includes('buy') || lower.includes('purchase')) return 'buy'
    if (lower.includes('sell')) return 'sell'
    if (lower.includes('hold')) return 'hold'
    if (lower.includes('reduce')) return 'reduce'
    if (lower.includes('increase')) return 'increase'
    return 'hold'
  }
  
  private extractSymbol(content: string, marketData: any[]): string | undefined {
    for (const data of marketData) {
      if (content.includes(data.symbol)) {
        return data.symbol
      }
    }
    return marketData[0]?.symbol
  }
  
  private calculateQuantity(action: string, portfolio: any, config: any): number {
    if (action === 'hold') return 0
    const maxRisk = config?.maxRiskPerTrade || 0.05
    const availableCash = portfolio.cash
    return Math.floor(availableCash * maxRisk)
  }
}

class AnthropicProvider implements LLMProvider {
  name = 'anthropic'
  
  isConfigured(): boolean {
    return !!(process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY)
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured()) return false
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  async makeDecision(request: AIDecisionRequest): Promise<AIDecision> {
    const prompt = this.buildPrompt(request)
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    const content = data.content[0]?.text
    
    try {
      return JSON.parse(content)
    } catch {
      return this.parseNaturalLanguageResponse(content, request)
    }
  }
  
  private buildPrompt(request: AIDecisionRequest): string {
    return `You are an expert trading AI. Analyze this data and make a trading decision.

Agent: ${request.agent.type} trader
Portfolio: $${request.portfolio.totalValue} total, $${request.portfolio.cash} cash
P&L: $${request.portfolio.pnl}

Market Data:
${request.marketData.map(d => `${d.symbol}: $${d.price} (${d.change}%)`).join('\n')}

Respond with JSON only:
{
  "action": "buy|sell|hold",
  "symbol": "symbol",
  "quantity": number,
  "reasoning": "why",
  "confidence": 0.8,
  "riskLevel": "low",
  "expectedOutcome": "what happens next",
  "timeframe": "1 hour"
}`
  }
  
  private parseNaturalLanguageResponse(content: string, request: AIDecisionRequest): AIDecision {
    // Similar to OpenAI parser
    return {
      action: 'hold',
      reasoning: content.substring(0, 200),
      confidence: 0.5,
      riskLevel: 'medium',
      expectedOutcome: 'Parsed from Anthropic response',
      timeframe: '1 hour'
    }
  }
}

class GeminiProviderWrapper implements LLMProvider {
  name = 'gemini'
  private geminiService = new GeminiService()
  
  isConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY)
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      // Test with simple request
      return this.isConfigured()
    } catch {
      return false
    }
  }
  
  async makeDecision(request: AIDecisionRequest): Promise<AIDecision> {
    return await this.geminiService.makeDecision(request)
  }
}

class LocalProvider implements LLMProvider {
  name = 'local'
  
  isConfigured(): boolean {
    return true // Always available as fallback
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      // Check if Ollama is running
      const response = await fetch('http://localhost:11434/api/tags')
      return response.ok
    } catch {
      return false
    }
  }
  
  async makeDecision(request: AIDecisionRequest): Promise<AIDecision> {
    // Rule-based decision making as ultimate fallback
    return this.makeRuleBasedDecision(request)
  }
  
  private makeRuleBasedDecision(request: AIDecisionRequest): AIDecision {
    const { marketData, portfolio, agent } = request
    
    // Simple momentum strategy
    const strongUptrend = marketData.filter(d => d.change > 2).length
    const strongDowntrend = marketData.filter(d => d.change < -2).length
    
    if (strongUptrend > strongDowntrend && portfolio.cash > 1000) {
      const bestSymbol = marketData.reduce((best, current) => 
        current.change > best.change ? current : best
      )
      
      return {
        action: 'buy',
        symbol: bestSymbol.symbol,
        quantity: Math.floor(portfolio.cash * 0.1 / bestSymbol.price),
        reasoning: `Rule-based decision: Strong uptrend detected in ${bestSymbol.symbol} (+${bestSymbol.change.toFixed(2)}%)`,
        confidence: 0.7,
        riskLevel: 'medium',
        expectedOutcome: 'Continuation of upward momentum',
        timeframe: '2-6 hours'
      }
    }
    
    if (strongDowntrend > strongUptrend && portfolio.positions.length > 0) {
      const worstPosition = portfolio.positions.reduce((worst, current) => 
        current.unrealizedPnL < worst.unrealizedPnL ? current : worst
      )
      
      return {
        action: 'sell',
        symbol: worstPosition.symbol,
        quantity: worstPosition.quantity,
        reasoning: 'Rule-based decision: Strong downtrend detected, reducing risk',
        confidence: 0.6,
        riskLevel: 'low',
        expectedOutcome: 'Risk reduction and capital preservation',
        timeframe: 'immediate'
      }
    }
    
    return {
      action: 'hold',
      reasoning: 'Rule-based decision: Market conditions unclear, maintaining current positions',
      confidence: 0.5,
      riskLevel: 'low',
      expectedOutcome: 'Wait for clearer market signals',
      timeframe: '1-2 hours'
    }
  }
}

export class UnifiedLLMService {
  private providers = new Map<string, LLMProvider>()
  private defaultProvider = 'gemini'
  private providerOrder = ['openai', 'anthropic', 'gemini', 'local']
  
  constructor() {
    this.providers.set('openai', new OpenAIProvider())
    this.providers.set('anthropic', new AnthropicProvider())
    this.providers.set('gemini', new GeminiProviderWrapper())
    this.providers.set('local', new LocalProvider())
  }
  
  async makeDecision(request: AIDecisionRequest): Promise<AIDecision> {
    const availableProviders = await this.getAvailableProviders()
    
    for (const providerName of this.providerOrder) {
      if (availableProviders.has(providerName)) {
        const provider = this.providers.get(providerName)!
        
        try {
          console.log(`🤖 Making decision with ${provider.name} provider`)
          const decision = await provider.makeDecision(request)
          
          // Validate decision
          if (this.validateDecision(decision)) {
            console.log(`✅ Decision made by ${provider.name}:`, decision)
            return decision
          } else {
            console.warn(`❌ Invalid decision from ${provider.name}, trying next provider`)
          }
        } catch (error) {
          console.warn(`❌ Provider ${provider.name} failed:`, error)
        }
      }
    }
    
    // Ultimate fallback - local rule-based decision
    console.log('🔄 All providers failed, using local rule-based decision')
    return this.providers.get('local')!.makeDecision(request)
  }
  
  private async getAvailableProviders(): Promise<Set<string>> {
    const available = new Set<string>()
    
    for (const [name, provider] of this.providers) {
      if (provider.isConfigured() && await provider.isAvailable()) {
        available.add(name)
      }
    }
    
    return available
  }
  
  private validateDecision(decision: AIDecision): boolean {
    return !!(
      decision.action &&
      decision.reasoning &&
      typeof decision.confidence === 'number' &&
      decision.confidence >= 0 &&
      decision.confidence <= 1 &&
      decision.riskLevel &&
      decision.expectedOutcome &&
      decision.timeframe
    )
  }
  
  async getProviderStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {}
    
    for (const [name, provider] of this.providers) {
      status[name] = provider.isConfigured() && await provider.isAvailable()
    }
    
    return status
  }
}

// Lazy initialization
let unifiedLLMServiceInstance: UnifiedLLMService | null = null

export function getUnifiedLLMService(): UnifiedLLMService {
  if (!unifiedLLMServiceInstance) {
    unifiedLLMServiceInstance = new UnifiedLLMService()
  }
  return unifiedLLMServiceInstance
}

// For backward compatibility
export const unifiedLLMService = {
  get instance() {
    return getUnifiedLLMService()
  }
}