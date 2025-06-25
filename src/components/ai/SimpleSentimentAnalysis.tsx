/**
 * Simple Sentiment Analysis
 * Lightweight sentiment analysis using direct AI service
 * Replaces complex LangChain sentiment components
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
  Heart, 
  Brain,
  RefreshCw,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { directAIService } from '@/lib/ai/DirectAIService'

interface SimpleSentimentAnalysisProps {
  className?: string
  symbols?: string[]
  newsData?: any[]
  autoRefresh?: boolean
  refreshInterval?: number
}

interface SentimentData {
  symbol: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  score: number
  factors: string[]
  summary: string
  timestamp: number
}

export function SimpleSentimentAnalysis({ 
  className,
  symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
  newsData = [],
  autoRefresh = true,
  refreshInterval = 300000 // 5 minutes
}: SimpleSentimentAnalysisProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  /**
   * Analyze sentiment for all symbols
   */
  const analyzeSentiment = async () => {
    try {
      setIsLoading(true)
      const results: SentimentData[] = []

      for (const symbol of symbols) {
        try {
          // Mock market data - in production, get real data
          const mockMarketData = {
            price: Math.random() * 50000 + 20000,
            volume: Math.random() * 1000000,
            change24h: (Math.random() - 0.5) * 10,
            trend: Math.random() > 0.5 ? 'up' : 'down'
          }

          const sentiment = await directAIService.getMarketSentiment(
            symbol, 
            newsData.slice(0, 3), // Limit news data
            mockMarketData
          )

          results.push({
            symbol,
            ...sentiment,
            timestamp: Date.now()
          })

        } catch (error) {
          console.error(`Failed to analyze sentiment for ${symbol}:`, error)
          // Add fallback data
          results.push({
            symbol,
            sentiment: 'neutral',
            confidence: 0,
            score: 0,
            factors: ['Analysis temporarily unavailable'],
            summary: 'Sentiment analysis temporarily unavailable',
            timestamp: Date.now()
          })
        }
      }

      setSentimentData(results)
      setLastUpdate(Date.now())

    } catch (error) {
      console.error('Failed to analyze sentiment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Auto-analyze on mount and refresh
   */
  useEffect(() => {
    analyzeSentiment()

    if (autoRefresh) {
      const interval = setInterval(analyzeSentiment, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [symbols.join(','), autoRefresh, refreshInterval])

  /**
   * Get sentiment display properties
   */
  const getSentimentDisplay = (sentiment: string, score: number) => {
    switch (sentiment) {
      case 'bullish':
        return {
          color: 'text-green-600 bg-green-100',
          icon: <TrendingUp className="h-3 w-3" />,
          label: 'BULLISH',
          bgColor: 'bg-green-50'
        }
      case 'bearish':
        return {
          color: 'text-red-600 bg-red-100',
          icon: <TrendingDown className="h-3 w-3" />,
          label: 'BEARISH',
          bgColor: 'bg-red-50'
        }
      default:
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: <Minus className="h-3 w-3" />,
          label: 'NEUTRAL',
          bgColor: 'bg-gray-50'
        }
    }
  }

  /**
   * Get confidence color
   */
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-500'
    if (confidence >= 0.4) return 'text-yellow-500'
    return 'text-red-500'
  }

  /**
   * Calculate overall market sentiment
   */
  const getOverallSentiment = () => {
    if (sentimentData.length === 0) return { sentiment: 'neutral', score: 0, confidence: 0 }
    
    const avgScore = sentimentData.reduce((sum, item) => sum + item.score, 0) / sentimentData.length
    const avgConfidence = sentimentData.reduce((sum, item) => sum + item.confidence, 0) / sentimentData.length
    
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    if (avgScore > 10) sentiment = 'bullish'
    else if (avgScore < -10) sentiment = 'bearish'
    
    return { sentiment, score: avgScore, confidence: avgConfidence }
  }

  const overallSentiment = getOverallSentiment()
  const overallDisplay = getSentimentDisplay(overallSentiment.sentiment, overallSentiment.score)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Market Sentiment Analysis
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeSentiment}
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
      <CardContent className="space-y-4">
        {/* Overall Sentiment */}
        <div className={cn("p-4 rounded-lg border", overallDisplay.bgColor)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Overall Market Sentiment</span>
            </div>
            <Badge className={overallDisplay.color}>
              {overallDisplay.icon}
              <span className="ml-1">{overallDisplay.label}</span>
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Sentiment Score</div>
              <div className="font-bold text-lg">{overallSentiment.score.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-gray-600">Confidence</div>
              <div className={cn("font-bold text-lg", getConfidenceColor(overallSentiment.confidence))}>
                {(overallSentiment.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Individual Sentiment Analysis */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sentimentData.length > 0 ? (
          <div className="space-y-3">
            {sentimentData.map((data, index) => {
              const display = getSentimentDisplay(data.sentiment, data.score)
              
              return (
                <div key={`${data.symbol}-${index}`} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{data.symbol}</span>
                      <Badge className={display.color}>
                        {display.icon}
                        <span className="ml-1">{display.label}</span>
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-medium", getConfidenceColor(data.confidence))}>
                        {(data.confidence * 100).toFixed(0)}% confident
                      </div>
                      <Progress value={data.confidence * 100} className="w-16 h-2" />
                    </div>
                  </div>

                  {/* Sentiment Score */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sentiment Score</span>
                      <span className={cn("font-bold", 
                        data.score > 0 ? 'text-green-600' : 
                        data.score < 0 ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {data.score > 0 ? '+' : ''}{data.score.toFixed(1)}
                      </span>
                    </div>
                    <Progress 
                      value={((data.score + 100) / 2)} 
                      className="w-full h-2 mt-1"
                    />
                  </div>

                  {/* Summary */}
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Summary:</strong> {data.summary}
                  </div>

                  {/* Key Factors */}
                  {data.factors.length > 0 && (
                    <div className="text-xs">
                      <div className="text-gray-600 mb-1">Key Factors:</div>
                      <div className="flex flex-wrap gap-1">
                        {data.factors.slice(0, 3).map((factor, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-500">No sentiment data available</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={analyzeSentiment}
              className="mt-3"
            >
              Analyze Sentiment
            </Button>
          </div>
        )}

        {/* Sentiment Distribution */}
        {sentimentData.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-3">Sentiment Distribution</div>
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="text-green-600 font-bold text-lg">
                  {sentimentData.filter(d => d.sentiment === 'bullish').length}
                </div>
                <div className="text-gray-500">Bullish</div>
              </div>
              <div>
                <div className="text-gray-600 font-bold text-lg">
                  {sentimentData.filter(d => d.sentiment === 'neutral').length}
                </div>
                <div className="text-gray-500">Neutral</div>
              </div>
              <div>
                <div className="text-red-600 font-bold text-lg">
                  {sentimentData.filter(d => d.sentiment === 'bearish').length}
                </div>
                <div className="text-gray-500">Bearish</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SimpleSentimentAnalysis