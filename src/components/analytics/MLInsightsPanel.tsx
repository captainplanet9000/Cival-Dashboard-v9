"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, Shield, Brain, BarChart3 } from 'lucide-react'
import { mlAnalyticsService, MLInsight } from '@/lib/services/ml-analytics-service'

interface MLInsightsPanelProps {
  portfolioId?: string
  className?: string
}

export function MLInsightsPanel({ portfolioId, className = "" }: MLInsightsPanelProps) {
  const [insights, setInsights] = useState<MLInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = portfolioId 
        ? `/api/analytics/insights?portfolio_id=${portfolioId}`
        : '/api/analytics/insights'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setInsights(data.insights)
        setLastUpdated(new Date())
      } else {
        setError(data.error || 'Failed to fetch insights')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [portfolioId])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'portfolio_optimization': return <BarChart3 className="h-4 w-4" />
      case 'risk_analysis': return <Shield className="h-4 w-4" />
      case 'market_prediction': return <TrendingUp className="h-4 w-4" />
      case 'asset_allocation': return <Brain className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            ML Insights
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsights}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Insights
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading && !error && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && insights.length === 0 && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
            <p className="text-gray-500">
              ML analysis is processing. Check back in a few minutes.
            </p>
          </div>
        )}

        {!loading && !error && insights.length > 0 && (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getImpactColor(insight.impact)}>
                      {insight.impact}
                    </Badge>
                    <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                      {(insight.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3">{insight.description}</p>
                
                <div className="rounded-md bg-blue-50 p-3 border-l-4 border-blue-400">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700 font-medium">
                        Recommendation
                      </p>
                      <p className="mt-1 text-sm text-blue-600">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </div>

                {insight.data && Object.keys(insight.data).length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                      View Details
                    </summary>
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(insight.data, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}

                <div className="mt-3 text-xs text-gray-400">
                  Generated: {new Date(insight.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}