'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react'
import { 
  strategyPerformanceAnalytics,
  StrategyPerformanceMetrics,
  StrategyOptimizationSuggestion,
  StrategyComparisonResult
} from '@/lib/analytics/strategy-performance-analytics'
import { StrategyType } from '@/lib/supabase/strategy-service'

interface StrategyOptimizationDashboardProps {
  agentId?: string
  refreshInterval?: number
}

export function StrategyOptimizationDashboard({ 
  agentId, 
  refreshInterval = 30000 
}: StrategyOptimizationDashboardProps) {
  const [strategies] = useState<StrategyType[]>([
    'darvas_box',
    'williams_alligator', 
    'elliott_wave',
    'heikin_ashi',
    'renko'
  ])
  
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<StrategyType, StrategyPerformanceMetrics>>({} as any)
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<Record<StrategyType, StrategyOptimizationSuggestion[]>>({} as any)
  const [comparisonResult, setComparisonResult] = useState<StrategyComparisonResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadOptimizationData()
    
    if (autoRefresh) {
      const interval = setInterval(loadOptimizationData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [selectedPeriod, agentId, autoRefresh, refreshInterval])

  const loadOptimizationData = async () => {
    try {
      setIsLoading(true)
      
      // Load performance metrics for all strategies
      const metricsPromises = strategies.map(async (strategyType) => {
        const metrics = await strategyPerformanceAnalytics.calculateStrategyPerformance(
          strategyType,
          agentId,
          selectedPeriod
        )
        return { strategyType, metrics }
      })
      
      const metricsResults = await Promise.all(metricsPromises)
      const metricsMap = metricsResults.reduce((acc, { strategyType, metrics }) => {
        acc[strategyType] = metrics
        return acc
      }, {} as Record<StrategyType, StrategyPerformanceMetrics>)
      
      setPerformanceMetrics(metricsMap)
      
      // Load optimization suggestions
      const suggestionsPromises = strategies.map(async (strategyType) => {
        const suggestions = await strategyPerformanceAnalytics.generateOptimizationSuggestions(
          strategyType,
          agentId
        )
        return { strategyType, suggestions }
      })
      
      const suggestionsResults = await Promise.all(suggestionsPromises)
      const suggestionsMap = suggestionsResults.reduce((acc, { strategyType, suggestions }) => {
        acc[strategyType] = suggestions
        return acc
      }, {} as Record<StrategyType, StrategyOptimizationSuggestion[]>)
      
      setOptimizationSuggestions(suggestionsMap)
      
      // Load strategy comparison
      const comparison = await strategyPerformanceAnalytics.compareStrategies(
        strategies,
        selectedPeriod,
        agentId
      )
      setComparisonResult(comparison)
      
    } catch (error) {
      console.error('Error loading optimization data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPerformanceColor = (value: number, type: 'return' | 'ratio' | 'percent') => {
    if (type === 'return') {
      return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
    }
    if (type === 'ratio') {
      return value > 1 ? 'text-green-600' : value < 1 ? 'text-red-600' : 'text-gray-600'
    }
    if (type === 'percent') {
      return value > 0.6 ? 'text-green-600' : value < 0.4 ? 'text-red-600' : 'text-yellow-600'
    }
    return 'text-gray-600'
  }

  const getStrategyDisplayName = (strategyType: StrategyType) => {
    const names = {
      darvas_box: 'Darvas Box',
      williams_alligator: 'Williams Alligator',
      elliott_wave: 'Elliott Wave',
      heikin_ashi: 'Heikin Ashi',
      renko: 'Renko'
    }
    return names[strategyType] || strategyType
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded"></div>
                <div className="h-3 bg-gray-300 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Strategy Optimization</h2>
          <p className="text-gray-600">Performance analytics and optimization suggestions</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="1y">1 Year</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadOptimizationData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Strategy Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strategyType) => {
          const metrics = performanceMetrics[strategyType]
          const suggestions = optimizationSuggestions[strategyType] || []
          
          if (!metrics) return null
          
          return (
            <Card key={strategyType} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{getStrategyDisplayName(strategyType)}</CardTitle>
                    <p className="text-sm text-gray-600">{metrics.totalExecutions} executions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {suggestions.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {suggestions.length} tips
                      </Badge>
                    )}
                    <Badge 
                      variant={metrics.totalReturn > 0 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {comparisonResult?.strategies.find(s => s.strategyType === strategyType)?.ranking || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Return</p>
                    <p className={`text-lg font-semibold ${getPerformanceColor(metrics.totalReturn, 'return')}`}>
                      ${metrics.totalReturn.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Win Rate</p>
                    <p className={`text-lg font-semibold ${getPerformanceColor(metrics.winRate, 'percent')}`}>
                      {(metrics.winRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sharpe Ratio</p>
                    <p className={`text-lg font-semibold ${getPerformanceColor(metrics.sharpeRatio, 'ratio')}`}>
                      {metrics.sharpeRatio.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Max Drawdown</p>
                    <p className="text-lg font-semibold text-red-600">
                      -{(metrics.maxDrawdown * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                {suggestions.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Top Optimization
                    </h4>
                    <div className="space-y-2">
                      {suggestions.slice(0, 1).map((suggestion, idx) => (
                        <div key={idx} className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-medium">{suggestion.parameter}</p>
                            <Badge variant="outline" className="text-xs">
                              {(suggestion.confidence * 100).toFixed(0)}% confident
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{suggestion.reason}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">
                              {suggestion.currentValue} → {suggestion.suggestedValue}
                            </span>
                            <span className="text-green-600">
                              +{(suggestion.expectedImprovement * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Strategy Comparison */}
      {comparisonResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Strategy Comparison ({selectedPeriod})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonResult.strategies.map((strategy) => (
                <div key={strategy.strategyType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{strategy.ranking}
                      </Badge>
                      <span className="font-medium">{getStrategyDisplayName(strategy.strategyType)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={getPerformanceColor(strategy.performance.totalReturn, 'return')}>
                        ${strategy.performance.totalReturn.toFixed(2)}
                      </span>
                      <span className={getPerformanceColor(strategy.performance.winRate, 'percent')}>
                        {(strategy.performance.winRate * 100).toFixed(1)}% win rate
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.max(0, Math.min(100, (strategy.relativePerformance + 1) * 50))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600 min-w-0">
                      {strategy.relativePerformance > 0 ? '+' : ''}{(strategy.relativePerformance * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Market Benchmark */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Market Benchmark ({comparisonResult.marketBenchmark.symbol})</span>
                <span>
                  {(comparisonResult.marketBenchmark.return * 100).toFixed(1)}% return, 
                  {(comparisonResult.marketBenchmark.volatility * 100).toFixed(1)}% volatility
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}