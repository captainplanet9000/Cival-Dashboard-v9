/**
 * LangChain Agent Recommendations Component
 * Displays AI-powered trading recommendations from LangChain agents
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { agentFactory } from '@/lib/langchain/EnhancedAgents'
import { langChainMCPIntegration } from '@/lib/langchain/MCPIntegration'

interface AgentRecommendation {
  agentId: string
  agentName: string
  agentType: string
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  riskLevel: 'low' | 'medium' | 'high'
  targetPrice?: number
  stopLoss?: number
  timeframe: string
  timestamp: number
}

interface AgentRecommendationsProps {
  symbol?: string
  className?: string
  compact?: boolean
  maxRecommendations?: number
  autoRefresh?: boolean
}

export function AgentRecommendations({ 
  symbol = 'BTC/USDT',
  className,
  compact = false,
  maxRecommendations = 5,
  autoRefresh = true
}: AgentRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  /**
   * Generate agent recommendations
   */
  const generateRecommendations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const newRecommendations: AgentRecommendation[] = []

      // Mock agent types and IDs
      const agentConfigs = [
        { id: 'momentum_agent', name: 'Momentum Trader', type: 'momentum' },
        { id: 'mean_reversion_agent', name: 'Mean Reversion', type: 'mean_reversion' },
        { id: 'risk_manager', name: 'Risk Manager', type: 'risk_manager' },
        { id: 'sentiment_agent', name: 'Sentiment Analyst', type: 'sentiment' },
        { id: 'arbitrage_agent', name: 'Arbitrage Scout', type: 'arbitrage' }
      ]

      for (const config of agentConfigs.slice(0, maxRecommendations)) {
        try {
          // Create agent instance
          const agent = agentFactory.createAgent(config.type, config.id)

          // Create market context
          const marketContext = {
            symbol,
            price: 50000 + Math.random() * 10000,
            volume: Math.random() * 1000000,
            technicalIndicators: {},
            marketConditions: {},
            portfolio: { cashBalance: 100000, totalValue: 100000, positions: [] },
            riskLimits: { maxPositionSize: 10000 },
            recentTrades: [],
            newsEvents: []
          }

          // Get agent analysis
          const analysis = await agent.analyze(marketContext)
          
          // Convert analysis to recommendation
          const recommendation: AgentRecommendation = {
            agentId: config.id,
            agentName: config.name,
            agentType: config.type,
            symbol,
            action: analysis.signals.includes('buy') ? 'buy' : 
                   analysis.signals.includes('sell') ? 'sell' : 'hold',
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            riskLevel: analysis.riskAssessment < 30 ? 'low' : 
                      analysis.riskAssessment < 70 ? 'medium' : 'high',
            timeframe: analysis.timeframe,
            timestamp: Date.now()
          }

          newRecommendations.push(recommendation)

        } catch (error) {
          console.warn(`Failed to get recommendation from ${config.name}:`, error)
        }
      }

      setRecommendations(newRecommendations)
      setLastUpdate(Date.now())

    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      setError(error.toString())
    } finally {
      setIsLoading(false)
    }
  }, [symbol, maxRecommendations])

  /**
   * Set up auto-refresh
   */
  useEffect(() => {
    generateRecommendations()

    if (autoRefresh) {
      const interval = setInterval(generateRecommendations, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [generateRecommendations, autoRefresh])

  /**
   * Get action color
   */
  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-green-600'
      case 'sell': return 'text-red-600'
      case 'hold': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  /**
   * Get action icon
   */
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'sell': return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'hold': return <Target className="h-4 w-4 text-gray-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  /**
   * Get risk level color
   */
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  /**
   * Compact view for embedding in other components
   */
  if (compact) {
    const consensus = recommendations.length > 0 ? 
      recommendations.reduce((acc, rec) => {
        acc[rec.action] = (acc[rec.action] || 0) + 1
        return acc
      }, {} as Record<string, number>) : {}

    const topAction = Object.entries(consensus).sort(([,a], [,b]) => b - a)[0]
    const avgConfidence = recommendations.length > 0 ? 
      recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length : 0

    return (
      <Card className={cn('cursor-pointer hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">AI Consensus</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateRecommendations}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
          </div>

          {topAction && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getActionIcon(topAction[0])}
                <span className={cn('text-sm font-medium', getActionColor(topAction[0]))}>
                  {topAction[0].toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{avgConfidence.toFixed(0)}%</div>
                <div className="text-xs text-gray-500">{recommendations.length} agents</div>
              </div>
            </div>
          )}

          {!topAction && (
            <div className="text-center text-sm text-gray-500">
              {isLoading ? 'Analyzing...' : 'No recommendations'}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Agent Recommendations
            </CardTitle>
            <CardDescription>
              Real-time trading insights from specialized AI agents for {symbol}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateRecommendations}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && recommendations.length === 0 && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-purple-500 rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating AI recommendations...</p>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-4">
            {/* Consensus Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              {['buy', 'sell', 'hold'].map(action => {
                const count = recommendations.filter(r => r.action === action).length
                const percentage = (count / recommendations.length) * 100
                
                return (
                  <div key={action} className="text-center">
                    <div className={cn('text-xl font-bold', getActionColor(action))}>
                      {count}
                    </div>
                    <div className="text-xs text-gray-500">{action.toUpperCase()}</div>
                    <Progress value={percentage} className="h-1 mt-1" />
                  </div>
                )
              })}
            </div>

            {/* Individual Recommendations */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <Card key={`${rec.agentId}-${index}`} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getActionIcon(rec.action)}
                        <div>
                          <h4 className="font-medium text-sm">{rec.agentName}</h4>
                          <p className="text-xs text-gray-500">{rec.agentType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={rec.action === 'buy' ? 'default' : rec.action === 'sell' ? 'destructive' : 'secondary'}
                        >
                          {rec.action.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Confidence:</span>
                        <span className="font-medium">{rec.confidence}%</span>
                      </div>
                      <Progress value={rec.confidence} className="h-2" />

                      <div className="flex items-center justify-between text-sm">
                        <span>Risk Level:</span>
                        <span className={cn('font-medium', getRiskColor(rec.riskLevel))}>
                          {rec.riskLevel.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>Timeframe:</span>
                        <span className="font-medium">{rec.timeframe}</span>
                      </div>

                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <p className="text-gray-700">{rec.reasoning}</p>
                      </div>

                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Last Update */}
            <div className="text-center text-xs text-gray-500">
              Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        )}

        {!isLoading && recommendations.length === 0 && !error && (
          <div className="text-center py-8 text-gray-500">
            No recommendations available. Click refresh to generate new insights.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AgentRecommendations