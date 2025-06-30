'use client'

import { type AIDecision, type AIDecisionRequest } from './unified-llm-service'

export class GeminiService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async makeDecision(request: AIDecisionRequest): Promise<AIDecision> {
    try {
      const prompt = this.buildPrompt(request)
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      return this.parseDecision(text, request)
    } catch (error) {
      console.warn('Gemini service error:', error)
      return this.fallbackDecision(request)
    }
  }

  private buildPrompt(request: AIDecisionRequest): string {
    const { agent, marketData, portfolio } = request
    
    return `
You are an AI trading agent named "${agent.id}" with strategy type "${agent.strategy}".

Current Market Data:
${marketData.map(m => `${m.symbol}: $${m.price} (${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%)`).join('\n')}

Portfolio Status:
- Total Value: $${portfolio.totalValue.toFixed(2)}
- Cash: $${portfolio.cash.toFixed(2)}
- P&L: $${portfolio.pnl.toFixed(2)}
- Positions: ${portfolio.positions.length}

Based on this information, make a trading decision. Respond with ONLY a JSON object in this format:
{
  "action": "buy|sell|hold",
  "symbol": "BTC/USD",
  "quantity": 0.1,
  "price": 45000,
  "confidence": 0.8,
  "reasoning": "Clear explanation of the decision"
}

Keep reasoning under 100 characters. Be decisive and specific.
`
  }

  private parseDecision(text: string, request: AIDecisionRequest): AIDecision {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[^}]*\}/s)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        return {
          action: parsed.action || 'hold',
          symbol: parsed.symbol || request.marketData[0]?.symbol || 'BTC/USD',
          quantity: parsed.quantity || 0.01,
          price: parsed.price || request.marketData[0]?.price || 45000,
          confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
          reasoning: parsed.reasoning || 'AI analysis completed',
          timestamp: Date.now()
        }
      }
    } catch (error) {
      console.warn('Failed to parse Gemini response:', error)
    }
    
    return this.fallbackDecision(request)
  }

  private fallbackDecision(request: AIDecisionRequest): AIDecision {
    const firstMarket = request.marketData[0]
    const isPositive = firstMarket?.change > 0
    
    return {
      action: isPositive ? 'buy' : 'hold',
      symbol: firstMarket?.symbol || 'BTC/USD',
      quantity: 0.01,
      price: firstMarket?.price || 45000,
      confidence: 0.3,
      reasoning: 'Fallback decision based on market trend',
      timestamp: Date.now()
    }
  }
}

export default GeminiService