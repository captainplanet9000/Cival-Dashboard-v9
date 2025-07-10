/**
 * LLM Service for AI Agent Integration
 * Supports OpenAI, Anthropic Claude, and OpenRouter
 */

// Dynamic imports to handle missing dependencies gracefully
let OpenAI: any
let Anthropic: any

// Use dynamic imports instead of require
async function loadOpenAI() {
  try {
    const openaiModule = await import('openai')
    return openaiModule.default
  } catch (e) {
    console.warn('OpenAI SDK not available:', e instanceof Error ? e.message : 'Unknown error')
    return null
  }
}

async function loadAnthropic() {
  try {
    const anthropicModule = await import('@anthropic-ai/sdk')
    return anthropicModule.default
  } catch (e) {
    console.warn('Anthropic SDK not available:', e instanceof Error ? e.message : 'Unknown error')
    return null
  }
}

// LLM Provider Types
export type LLMProvider = 'openai' | 'anthropic' | 'openrouter'

// LLM Configuration
export interface LLMConfig {
  provider: LLMProvider
  model: string
  apiKey: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

// Agent Decision Request
export interface AgentDecisionRequest {
  agentId: string
  agentName: string
  agentType: string
  personality: Record<string, any>
  marketData: Record<string, any>
  portfolioStatus: Record<string, any>
  riskLimits: Record<string, any>
  context: string
  availableFunctions: string[]
}

// Agent Decision Response
export interface AgentDecisionResponse {
  decisionType: 'trade' | 'hold' | 'rebalance' | 'analysis' | 'risk_check'
  symbol?: string
  action?: 'buy' | 'sell' | 'hold'
  quantity?: number
  price?: number
  reasoning: string
  confidence: number
  riskAssessment: string
  marketAnalysis: string
  nextSteps: string[]
  metadata: Record<string, any>
}

// Abstract LLM Provider Interface
abstract class LLMProvider {
  protected config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  abstract generateDecision(request: AgentDecisionRequest): Promise<AgentDecisionResponse>
  abstract testConnection(): Promise<boolean>
}

// OpenAI Provider
class OpenAIProvider extends LLMProvider {
  private client: any

  constructor(config: LLMConfig) {
    super(config)
    if (!OpenAI) {
      throw new Error('OpenAI SDK not available. Please install: npm install openai')
    }
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      dangerouslyAllowBrowser: true // Required for browser environment
    })
  }

  async generateDecision(request: AgentDecisionRequest): Promise<AgentDecisionResponse> {
    const prompt = this.buildTradingPrompt(request)

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 2000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return this.parseDecisionResponse(content)
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI request failed: ${error}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10
      })
      return !!response.choices[0]?.message?.content
    } catch (error) {
      console.error('OpenAI connection test failed:', error)
      return false
    }
  }

  private getSystemPrompt(request: AgentDecisionRequest): string {
    return `You are ${request.agentName}, an AI trading agent with the following characteristics:

Agent Type: ${request.agentType}
Personality: ${JSON.stringify(request.personality, null, 2)}

Your role is to analyze market data and make trading decisions based on your specific strategy and risk tolerance. You have access to real-time market data, portfolio information, and risk management tools.

IMPORTANT: Always respond with valid JSON in exactly this format:
{
  "decisionType": "trade|hold|rebalance|analysis|risk_check",
  "symbol": "string (if applicable)",
  "action": "buy|sell|hold (if applicable)",
  "quantity": number (if applicable),
  "price": number (if applicable),
  "reasoning": "detailed explanation of your decision",
  "confidence": number (0.0 to 1.0),
  "riskAssessment": "assessment of risks involved",
  "marketAnalysis": "your analysis of current market conditions",
  "nextSteps": ["array", "of", "next", "actions"],
  "metadata": {}
}

Focus on providing clear reasoning, accurate confidence scores, and actionable insights.`
  }

  private buildTradingPrompt(request: AgentDecisionRequest): string {
    return `Current Market Situation:

MARKET DATA:
${JSON.stringify(request.marketData, null, 2)}

PORTFOLIO STATUS:
${JSON.stringify(request.portfolioStatus, null, 2)}

RISK LIMITS:
${JSON.stringify(request.riskLimits, null, 2)}

CONTEXT:
${request.context}

AVAILABLE FUNCTIONS:
${request.availableFunctions.join(', ')}

Based on this information and your trading strategy, what is your decision? Analyze the market conditions, assess the risks, and provide a clear trading recommendation with detailed reasoning.

Remember to:
1. Consider your risk tolerance and position limits
2. Analyze market trends and momentum
3. Evaluate portfolio diversification
4. Provide confidence score based on signal strength
5. Explain your reasoning clearly
6. Consider market volatility and liquidity

Respond with your decision in the specified JSON format.`
  }

  private parseDecisionResponse(content: string): AgentDecisionResponse {
    try {
      const parsed = JSON.parse(content)
      
      // Validate required fields
      if (!parsed.decisionType || !parsed.reasoning || parsed.confidence === undefined) {
        throw new Error('Missing required fields in LLM response')
      }

      // Ensure confidence is between 0 and 1
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence))

      return {
        decisionType: parsed.decisionType,
        symbol: parsed.symbol,
        action: parsed.action,
        quantity: parsed.quantity,
        price: parsed.price,
        reasoning: parsed.reasoning,
        confidence: parsed.confidence,
        riskAssessment: parsed.riskAssessment || 'No risk assessment provided',
        marketAnalysis: parsed.marketAnalysis || 'No market analysis provided',
        nextSteps: parsed.nextSteps || [],
        metadata: parsed.metadata || {}
      }
    } catch (error) {
      console.error('Failed to parse LLM response:', content)
      throw new Error('Invalid JSON response from LLM')
    }
  }
}

// Anthropic Claude Provider
class AnthropicProvider extends LLMProvider {
  private client: any

  constructor(config: LLMConfig) {
    super(config)
    if (!Anthropic) {
      throw new Error('Anthropic SDK not available. Please install: npm install @anthropic-ai/sdk')
    }
    this.client = new Anthropic({
      apiKey: config.apiKey
    })
  }

  async generateDecision(request: AgentDecisionRequest): Promise<AgentDecisionResponse> {
    const prompt = this.buildTradingPrompt(request)

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens || 2000,
        temperature: this.config.temperature || 0.7,
        system: this.getSystemPrompt(request),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic')
      }

      return this.parseDecisionResponse(content.text)
    } catch (error) {
      console.error('Anthropic API error:', error)
      throw new Error(`Anthropic request failed: ${error}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }]
      })
      return response.content.length > 0
    } catch (error) {
      console.error('Anthropic connection test failed:', error)
      return false
    }
  }

  private getSystemPrompt(request: AgentDecisionRequest): string {
    return `You are ${request.agentName}, an AI trading agent specialized in ${request.agentType} strategies.

Your personality and trading style:
${JSON.stringify(request.personality, null, 2)}

You must analyze market data and make informed trading decisions. Always respond with valid JSON in this exact format:

{
  "decisionType": "trade|hold|rebalance|analysis|risk_check",
  "symbol": "symbol if applicable",
  "action": "buy|sell|hold if applicable", 
  "quantity": "number if applicable",
  "price": "number if applicable",
  "reasoning": "detailed explanation",
  "confidence": "number between 0.0 and 1.0",
  "riskAssessment": "risk analysis",
  "marketAnalysis": "market condition analysis", 
  "nextSteps": ["array of next actions"],
  "metadata": {}
}

Focus on providing thorough analysis and clear reasoning for your decisions.`
  }

  private buildTradingPrompt(request: AgentDecisionRequest): string {
    return `Analyze the current trading situation:

MARKET DATA:
${JSON.stringify(request.marketData, null, 2)}

PORTFOLIO:
${JSON.stringify(request.portfolioStatus, null, 2)}

RISK PARAMETERS:
${JSON.stringify(request.riskLimits, null, 2)}

CONTEXT: ${request.context}

Make your trading decision and provide detailed analysis in the required JSON format.`
  }

  private parseDecisionResponse(content: string): AgentDecisionResponse {
    try {
      // Extract JSON from response (Claude sometimes adds explanation)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and normalize
      if (!parsed.decisionType || !parsed.reasoning) {
        throw new Error('Missing required fields')
      }

      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5))

      return {
        decisionType: parsed.decisionType,
        symbol: parsed.symbol,
        action: parsed.action,
        quantity: parsed.quantity,
        price: parsed.price,
        reasoning: parsed.reasoning,
        confidence: parsed.confidence,
        riskAssessment: parsed.riskAssessment || 'No risk assessment',
        marketAnalysis: parsed.marketAnalysis || 'No market analysis',
        nextSteps: parsed.nextSteps || [],
        metadata: parsed.metadata || {}
      }
    } catch (error) {
      console.error('Failed to parse Anthropic response:', content)
      throw new Error('Invalid response format')
    }
  }
}

// OpenRouter Provider
class OpenRouterProvider extends LLMProvider {
  private client: OpenAI

  constructor(config: LLMConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: true // Required for browser environment
    })
  }

  async generateDecision(request: AgentDecisionRequest): Promise<AgentDecisionResponse> {
    const prompt = this.buildTradingPrompt(request)

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 2000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenRouter')
      }

      return this.parseDecisionResponse(content)
    } catch (error) {
      console.error('OpenRouter API error:', error)
      throw new Error(`OpenRouter request failed: ${error}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 10
      })
      return !!response.choices[0]?.message?.content
    } catch (error) {
      console.error('OpenRouter connection test failed:', error)
      return false
    }
  }

  private getSystemPrompt(request: AgentDecisionRequest): string {
    return `You are ${request.agentName}, an AI trading agent using ${request.agentType} strategies.

Agent Configuration:
${JSON.stringify(request.personality, null, 2)}

Respond with trading decisions in valid JSON format:
{
  "decisionType": "trade|hold|rebalance|analysis|risk_check",
  "symbol": "string",
  "action": "buy|sell|hold", 
  "quantity": number,
  "price": number,
  "reasoning": "explanation",
  "confidence": number,
  "riskAssessment": "risk analysis",
  "marketAnalysis": "market analysis",
  "nextSteps": ["actions"],
  "metadata": {}
}`
  }

  private buildTradingPrompt(request: AgentDecisionRequest): string {
    return `Current trading environment:

MARKET: ${JSON.stringify(request.marketData, null, 2)}
PORTFOLIO: ${JSON.stringify(request.portfolioStatus, null, 2)}
RISK LIMITS: ${JSON.stringify(request.riskLimits, null, 2)}
CONTEXT: ${request.context}

Analyze and decide. Respond in JSON format.`
  }

  private parseDecisionResponse(content: string): AgentDecisionResponse {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] || content)
      
      return {
        decisionType: parsed.decisionType || 'analysis',
        symbol: parsed.symbol,
        action: parsed.action,
        quantity: parsed.quantity,
        price: parsed.price,
        reasoning: parsed.reasoning || 'No reasoning provided',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        riskAssessment: parsed.riskAssessment || 'No risk assessment',
        marketAnalysis: parsed.marketAnalysis || 'No market analysis',
        nextSteps: parsed.nextSteps || [],
        metadata: parsed.metadata || {}
      }
    } catch (error) {
      console.error('Failed to parse OpenRouter response:', content)
      throw new Error('Invalid response format')
    }
  }
}

// Mock LLM Provider for fallback when SDKs are not available
class MockLLMProvider extends LLMProvider {
  async generateDecision(request: AgentDecisionRequest): Promise<AgentDecisionResponse> {
    // Return a mock decision for demo purposes
    const symbols = ['BTC', 'ETH', 'SOL', 'AAPL', 'GOOGL']
    const actions = ['buy', 'sell', 'hold'] as const
    const decisionTypes = ['trade', 'hold', 'analysis'] as const
    
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)]
    const randomAction = actions[Math.floor(Math.random() * actions.length)]
    const randomDecisionType = decisionTypes[Math.floor(Math.random() * decisionTypes.length)]
    
    await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API delay
    
    return {
      decisionType: randomDecisionType,
      symbol: randomSymbol,
      action: randomAction,
      quantity: Math.floor(Math.random() * 100) + 1,
      price: Math.random() * 1000 + 100,
      reasoning: `Mock decision for ${request.agentName}. This is a simulated response because LLM SDKs are not available in the current environment.`,
      confidence: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
      riskAssessment: 'Mock risk assessment - low to moderate risk',
      marketAnalysis: 'Mock market analysis - favorable conditions detected',
      nextSteps: ['Monitor market conditions', 'Review portfolio allocation', 'Update risk parameters'],
      metadata: {
        mock: true,
        provider: this.config.provider,
        timestamp: new Date().toISOString()
      }
    }
  }

  async testConnection(): Promise<boolean> {
    // Mock provider is always "available"
    return true
  }
}

// LLM Service Manager
export class LLMService {
  private providers = new Map<string, LLMProvider>()

  // Register LLM provider
  registerProvider(name: string, config: LLMConfig): void {
    try {
      let provider: LLMProvider

      switch (config.provider) {
        case 'openai':
          provider = new OpenAIProvider(config)
          break
        case 'anthropic':
          provider = new AnthropicProvider(config)
          break
        case 'openrouter':
          provider = new OpenRouterProvider(config)
          break
        default:
          throw new Error(`Unsupported LLM provider: ${config.provider}`)
      }

      this.providers.set(name, provider)
    } catch (error: any) {
      console.warn(`Failed to register LLM provider ${name}:`, error.message)
      // Register a mock provider instead
      this.providers.set(name, new MockLLMProvider(config))
    }
  }

  // Get provider
  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name)
  }

  // Generate decision using specific provider
  async generateAgentDecision(
    providerName: string, 
    request: AgentDecisionRequest
  ): Promise<AgentDecisionResponse> {
    const provider = this.providers.get(providerName)
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`)
    }

    return provider.generateDecision(request)
  }

  // Test provider connection
  async testProvider(name: string): Promise<boolean> {
    const provider = this.providers.get(name)
    if (!provider) {
      return false
    }

    return provider.testConnection()
  }

  // Get all provider names
  getProviderNames(): string[] {
    return Array.from(this.providers.keys())
  }
}

// Singleton instance
let llmService: LLMService | null = null

export function getLLMService(): LLMService {
  if (!llmService) {
    llmService = new LLMService()
    
    // Initialize default providers if API keys are available
    if (process.env.OPENAI_API_KEY) {
      llmService.registerProvider('openai-gpt4', {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.7,
        maxTokens: 2000
      })
    }

    if (process.env.ANTHROPIC_API_KEY) {
      llmService.registerProvider('claude-3.5-sonnet', {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0.7,
        maxTokens: 2000
      })
    }

    if (process.env.OPENROUTER_API_KEY) {
      llmService.registerProvider('openrouter-claude', {
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        temperature: 0.7,
        maxTokens: 2000
      })
    }
  }

  return llmService
}

export default LLMService