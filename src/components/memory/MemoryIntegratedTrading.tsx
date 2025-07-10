'use client'

/**
 * Memory-Integrated Trading Component
 * Demonstrates real-time memory formation during trading decisions
 * Phase 2: Real-Time Memory Integration
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock,
  Lightbulb,
  Zap,
  Activity
} from 'lucide-react'
import { unifiedMemoryService } from '@/lib/memory/unified-memory-service'
import { useMemoryUpdates, useMemoryInsights } from '@/lib/realtime/websocket'

interface TradingDecision {
  id: string
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  price: number
  quantity: number
  timestamp: Date
  memoryInfluenced: boolean
  memoriesUsed: string[]
}

export function MemoryIntegratedTrading() {
  const [selectedAgent] = useState('agent-001') // Demo agent
  const [isTrading, setIsTrading] = useState(false)
  const [recentDecisions, setRecentDecisions] = useState<TradingDecision[]>([])
  const [recentMemories, setRecentMemories] = useState<any[]>([])
  
  // Real-time memory updates
  const memoryUpdates = useMemoryUpdates(selectedAgent)
  const memoryInsights = useMemoryInsights(selectedAgent)

  // Load recent memories on component mount
  useEffect(() => {
    loadRecentMemories()
  }, [])

  // Update memories when new ones are created
  useEffect(() => {
    if (memoryUpdates.length > 0) {
      loadRecentMemories()
    }
  }, [memoryUpdates])

  const loadRecentMemories = async () => {
    try {
      const memories = await unifiedMemoryService.retrieveMemories(selectedAgent, {
        limit: 5,
        sortBy: 'recent'
      })
      setRecentMemories(memories)
    } catch (error) {
      console.error('Error loading memories:', error)
    }
  }

  const executeMemoryIntegratedTrade = async () => {
    if (isTrading) return
    
    setIsTrading(true)
    
    try {
      // 1. Analyze recent memories for trading context
      const relevantMemories = await unifiedMemoryService.retrieveMemories(selectedAgent, {
        memoryTypes: ['trade_decision', 'market_insight', 'strategy_learning'],
        limit: 10
      })

      // 2. Generate market data for simulation
      const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD']
      const selectedSymbol = symbols[Math.floor(Math.random() * symbols.length)]
      const basePrice = selectedSymbol.includes('BTC') ? 45000 : 
                       selectedSymbol.includes('ETH') ? 3200 : 180
      
      const currentPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.1
      const priceChange = (Math.random() - 0.5) * 10

      // 3. Store market observation as memory
      const marketMemoryId = await unifiedMemoryService.storeMemory(
        selectedAgent,
        `Market analysis: ${selectedSymbol} at $${currentPrice.toFixed(2)}, ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}% change`,
        'market_insight',
        {
          symbol: selectedSymbol,
          price: currentPrice,
          change: priceChange,
          analysisTime: new Date().toISOString()
        },
        {
          importance: Math.abs(priceChange) / 10, // Higher importance for larger moves
          symbols: [selectedSymbol],
          generateEmbedding: true
        }
      )

      // 4. Make trading decision based on memory + market data
      let decision = 'hold'
      let confidence = 0.5
      let reasoning = 'Neutral market conditions'
      const memoriesUsed: string[] = [marketMemoryId]
      
      // Simple decision logic enhanced by memory
      const hasRecentSuccessfulTrades = relevantMemories.some(m => 
        m.memoryType === 'trade_decision' && 
        m.context?.outcome === 'profit'
      )
      
      const hasRecentLosses = relevantMemories.some(m => 
        m.memoryType === 'trade_decision' && 
        m.context?.outcome === 'loss'
      )

      if (priceChange > 3) {
        decision = hasRecentLosses ? 'hold' : 'buy'
        confidence = hasRecentSuccessfulTrades ? 0.8 : 0.6
        reasoning = `Strong upward momentum ${hasRecentLosses ? 'but recent losses suggest caution' : 'with positive memory reinforcement'}`
      } else if (priceChange < -3) {
        decision = hasRecentSuccessfulTrades ? 'sell' : 'hold'
        confidence = hasRecentLosses ? 0.7 : 0.6
        reasoning = `Downward pressure detected ${hasRecentSuccessfulTrades ? 'with memory suggesting protective action' : 'maintaining cautious stance'}`
      }

      // 5. Store trading decision as memory
      const decisionMemoryId = await unifiedMemoryService.storeMemory(
        selectedAgent,
        `Trading decision: ${decision.toUpperCase()} ${selectedSymbol} with ${(confidence * 100).toFixed(1)}% confidence - ${reasoning}`,
        'trade_decision',
        {
          symbol: selectedSymbol,
          action: decision,
          confidence,
          reasoning,
          price: currentPrice,
          quantity: Math.floor(Math.random() * 10) + 1,
          memoryInfluenced: relevantMemories.length > 0,
          memoriesAnalyzed: relevantMemories.length
        },
        {
          importance: confidence,
          symbols: [selectedSymbol],
          strategy: 'memory_enhanced_trading',
          generateEmbedding: true
        }
      )

      memoriesUsed.push(decisionMemoryId)

      // 6. Create trading decision record
      const newDecision: TradingDecision = {
        id: decisionMemoryId,
        symbol: selectedSymbol,
        action: decision as 'buy' | 'sell' | 'hold',
        confidence,
        reasoning,
        price: currentPrice,
        quantity: Math.floor(Math.random() * 10) + 1,
        timestamp: new Date(),
        memoryInfluenced: relevantMemories.length > 0,
        memoriesUsed
      }

      setRecentDecisions(prev => [newDecision, ...prev.slice(0, 4)])

      // 7. Simulate trade outcome after a delay (for demo)
      setTimeout(async () => {
        const outcome = Math.random() > 0.4 ? 'profit' : 'loss'
        const pnl = outcome === 'profit' 
          ? Math.random() * 500 + 50
          : -(Math.random() * 300 + 25)

        await unifiedMemoryService.recordTradeOutcome(selectedAgent, decisionMemoryId, {
          outcome,
          pnl,
          executionPrice: currentPrice,
          closingPrice: currentPrice * (1 + (Math.random() - 0.5) * 0.05),
          duration: '5m'
        })

        await unifiedMemoryService.storeMemory(
          selectedAgent,
          `Trade outcome: ${outcome.toUpperCase()} - P&L: $${pnl.toFixed(2)} on ${selectedSymbol}`,
          'performance_feedback',
          {
            originalDecision: decision,
            symbol: selectedSymbol,
            outcome,
            pnl,
            learningPoint: pnl > 0 ? 'successful_strategy' : 'needs_improvement'
          },
          {
            importance: Math.abs(pnl) / 500,
            symbols: [selectedSymbol]
          }
        )
      }, 3000)

    } catch (error) {
      console.error('Error in memory-integrated trading:', error)
    } finally {
      setIsTrading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'bg-green-100 text-green-800'
      case 'sell': return 'bg-red-100 text-red-800'
      case 'hold': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return <TrendingUp className="w-4 h-4" />
      case 'sell': return <TrendingDown className="w-4 h-4" />
      case 'hold': return <Target className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Memory-Integrated Trading</h1>
          <p className="text-muted-foreground">AI agent trading with real-time memory formation</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Brain className="w-4 h-4 mr-1" />
          Memory Active
        </Badge>
      </div>

      {/* Trading Control */}
      <Card>
        <CardHeader>
          <CardTitle>Execute Memory-Enhanced Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Execute a trading decision that uses agent memory for context and stores the decision as a new memory.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span>Agent: <strong>agent-001</strong></span>
                <span>Recent Memories: <strong>{recentMemories.length}</strong></span>
                <span>Memory Updates: <strong>{memoryUpdates.length}</strong></span>
              </div>
            </div>
            <Button 
              onClick={executeMemoryIntegratedTrade} 
              disabled={isTrading}
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isTrading ? 'Processing...' : 'Execute Trade'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Memory Updates */}
      {memoryUpdates.length > 0 && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <strong>Live Memory Update:</strong> {memoryUpdates[0].action} - {memoryUpdates[0].memoryType.replace('_', ' ')} 
            (Importance: {(memoryUpdates[0].importanceScore * 100).toFixed(1)}%)
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Trading Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Trading Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDecisions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No trading decisions yet. Execute a trade to see memory integration in action.
                </p>
              ) : (
                recentDecisions.map(decision => (
                  <div key={decision.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getActionIcon(decision.action)}
                        <Badge className={getActionColor(decision.action)}>
                          {decision.action.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{decision.symbol}</span>
                        {decision.memoryInfluenced && (
                          <Badge variant="outline" className="text-purple-600">
                            <Brain className="w-3 h-3 mr-1" />
                            Memory Enhanced
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {decision.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <p className="text-sm mb-2">{decision.reasoning}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Price: ${decision.price.toFixed(2)}</span>
                      <span>Quantity: {decision.quantity}</span>
                      <span>Confidence: {(decision.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMemories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No memories loaded. Execute a trade to create memories.
                </p>
              ) : (
                recentMemories.map(memory => (
                  <div key={memory.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {memory.memoryType?.replace('_', ' ') || 'unknown'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(memory.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{memory.content}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Importance: {((memory.importanceScore || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory Insights */}
      {memoryInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Memory Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {memoryInsights.slice(0, 3).map(insight => (
                <div key={insight.agentId + insight.timestamp} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <Badge variant="outline" className="text-yellow-600">
                      {insight.insightType.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm font-medium">
                      {(insight.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <p className="text-sm">{insight.description}</p>
                  {insight.impact && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Performance Impact: {insight.impact.performanceChange > 0 ? '+' : ''}{(insight.impact.performanceChange * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}