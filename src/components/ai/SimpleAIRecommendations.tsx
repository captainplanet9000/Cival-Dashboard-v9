/**
 * Simple AI Recommendations
 * Lightweight AI-powered trading recommendations using direct OpenAI SDK
 * Replaces complex LangChain agent recommendations
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Brain, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { directAIService, type TradingRecommendation } from '@/lib/ai/DirectAIService'

interface SimpleAIRecommendationsProps {
  className?: string
  symbols?: string[]
  maxRecommendations?: number
}

interface RecommendationWithSymbol extends TradingRecommendation {
  symbol: string
  timestamp: number
}

export function SimpleAIRecommendations({ 
  className, 
  symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
  maxRecommendations = 5
}: SimpleAIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationWithSymbol[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  /**
   * Generate recommendations for all symbols
   */
  const generateRecommendations = async () => {
    try {
      setIsLoading(true)
      const newRecommendations: RecommendationWithSymbol[] = []

      for (const symbol of symbols.slice(0, maxRecommendations)) {
        try {
          // Mock market data - in production, get real data
          const mockMarketData = {
            price: Math.random() * 50000 + 20000,
            volume: Math.random() * 1000000,
            change24h: (Math.random() - 0.5) * 10,
            high24h: Math.random() * 55000 + 20000,
            low24h: Math.random() * 45000 + 15000
          }

          const recommendation = await directAIService.getTradingAnalysis({
            symbol,
            timeframe: '1h',
            marketData: mockMarketData,
            context: 'Paper trading analysis'
          })

          newRecommendations.push({
            ...recommendation,
            symbol,
            timestamp: Date.now()
          })

        } catch (error) {
          console.error(`Failed to get recommendation for ${symbol}:`, error)
          // Add fallback recommendation
          newRecommendations.push({
            symbol,
            action: 'hold',
            confidence: 0,
            reasoning: 'Analysis temporarily unavailable',
            riskLevel: 'medium',
            timeHorizon: '1h',
            timestamp: Date.now()
          })
        }
      }

      setRecommendations(newRecommendations)
      setLastUpdate(Date.now())

    } catch (error) {
      console.error('Failed to generate recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Auto-generate recommendations on mount and refresh
   */
  useEffect(() => {
    generateRecommendations()
    
    // Refresh every 5 minutes
    const interval = setInterval(generateRecommendations, 300000)
    return () => clearInterval(interval)
  }, [symbols.join(',')])

  /**
   * Get action color and icon
   */
  const getActionDisplay = (action: string) => {
    switch (action) {
      case 'buy':
        return {
          color: 'text-green-600 bg-green-100',
          icon: <TrendingUp className="h-3 w-3" />,
          label: 'BUY'
        }
      case 'sell':
        return {
          color: 'text-red-600 bg-red-100',
          icon: <TrendingDown className="h-3 w-3" />,
          label: 'SELL'
        }
      default:
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: <Minus className="h-3 w-3" />,
          label: 'HOLD'
        }
    }
  }

  /**
   * Get risk level color
   */
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-500'
      case 'high': return 'text-red-500'
      default: return 'text-yellow-500'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Trading Recommendations
          </CardTitle>
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
        {lastUpdate && (
          <div className="text-xs text-gray-500">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const actionDisplay = getActionDisplay(rec.action)
              
              return (
                <div key={`${rec.symbol}-${index}`} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{rec.symbol}</span>
                      <Badge className={actionDisplay.color}>
                        {actionDisplay.icon}
                        <span className="ml-1">{actionDisplay.label}</span>
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </div>
                      <Progress value={rec.confidence * 100} className="w-16 h-2" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="text-sm text-gray-700">
                      <strong>Analysis:</strong> {rec.reasoning}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className={getRiskColor(rec.riskLevel)}>
                          Risk: {rec.riskLevel.toUpperCase()}
                        </span>
                        <span className="text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {rec.timeHorizon}
                        </span>
                      </div>
                      
                      {rec.targetPrice && (
                        <div className="text-gray-600">
                          Target: ${rec.targetPrice.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {rec.stopLoss && (
                      <div className="text-xs text-red-600">
                        Stop Loss: ${rec.stopLoss.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-500">No recommendations available</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateRecommendations}
              className="mt-3"
            >
              Generate Recommendations
            </Button>
          </div>
        )}

        {/* Summary Stats */}
        {recommendations.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="text-green-600 font-bold">
                  {recommendations.filter(r => r.action === 'buy').length}
                </div>
                <div className="text-gray-500">Buy Signals</div>
              </div>
              <div>
                <div className="text-gray-600 font-bold">
                  {recommendations.filter(r => r.action === 'hold').length}
                </div>
                <div className="text-gray-500">Hold</div>
              </div>
              <div>
                <div className="text-red-600 font-bold">
                  {recommendations.filter(r => r.action === 'sell').length}
                </div>
                <div className="text-gray-500">Sell Signals</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SimpleAIRecommendations