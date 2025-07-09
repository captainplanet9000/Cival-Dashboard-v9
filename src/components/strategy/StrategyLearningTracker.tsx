'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  Lightbulb,
  Target,
  Activity,
  Clock,
  BarChart3
} from 'lucide-react'
import { strategyPerformanceAnalytics } from '@/lib/analytics/strategy-performance-analytics'
import { StrategyType } from '@/lib/supabase/strategy-service'
import { supabase } from '@/lib/supabase/client'

interface StrategyLearningEntry {
  id: string
  strategy_type: StrategyType
  agent_id: string
  market_condition: string
  adaptation_made: string
  performance_impact: number
  confidence_score: number
  created_at: string
}

interface StrategyLearningTrackerProps {
  agentId?: string
  strategyType?: StrategyType
  refreshInterval?: number
}

export function StrategyLearningTracker({ 
  agentId, 
  strategyType,
  refreshInterval = 30000 
}: StrategyLearningTrackerProps) {
  const [learningEntries, setLearningEntries] = useState<StrategyLearningEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [learningStats, setLearningStats] = useState({
    totalAdaptations: 0,
    positiveImpacts: 0,
    averageConfidence: 0,
    topMarketCondition: '',
    mostEffectiveAdaptation: ''
  })

  useEffect(() => {
    loadLearningData()
    
    const interval = setInterval(loadLearningData, refreshInterval)
    return () => clearInterval(interval)
  }, [agentId, strategyType, selectedTimeframe, refreshInterval])

  const loadLearningData = async () => {
    try {
      setIsLoading(true)
      
      // Build query for learning entries
      let query = supabase
        .from('strategy_learning')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (agentId) {
        query = query.eq('agent_id', agentId)
      }

      if (strategyType) {
        query = query.eq('strategy_type', strategyType)
      }

      // Add timeframe filter
      if (selectedTimeframe !== 'all') {
        const since = getTimeframeSince(selectedTimeframe)
        query = query.gte('created_at', since.toISOString())
      }

      const { data: entries, error } = await query

      if (error) throw error

      setLearningEntries(entries || [])
      
      // Calculate learning statistics
      if (entries && entries.length > 0) {
        const totalAdaptations = entries.length
        const positiveImpacts = entries.filter(e => e.performance_impact > 0).length
        const averageConfidence = entries.reduce((sum, e) => sum + e.confidence_score, 0) / entries.length
        
        // Find most common market condition
        const marketConditions = entries.reduce((acc, e) => {
          acc[e.market_condition] = (acc[e.market_condition] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        const topMarketCondition = Object.entries(marketConditions).sort(([,a], [,b]) => b - a)[0]?.[0] || ''
        
        // Find most effective adaptation
        const adaptations = entries.reduce((acc, e) => {
          const key = e.adaptation_made
          if (!acc[key]) acc[key] = { count: 0, totalImpact: 0 }
          acc[key].count++
          acc[key].totalImpact += e.performance_impact
          return acc
        }, {} as Record<string, { count: number; totalImpact: number }>)
        
        const mostEffectiveAdaptation = Object.entries(adaptations)
          .sort(([,a], [,b]) => (b.totalImpact / b.count) - (a.totalImpact / a.count))[0]?.[0] || ''
        
        setLearningStats({
          totalAdaptations,
          positiveImpacts,
          averageConfidence,
          topMarketCondition,
          mostEffectiveAdaptation
        })
      }
      
    } catch (error) {
      console.error('Error loading learning data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeframeSince = (timeframe: string): Date => {
    const now = new Date()
    switch (timeframe) {
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
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

  const getImpactColor = (impact: number) => {
    if (impact > 0.1) return 'text-green-600'
    if (impact > 0) return 'text-green-500'
    if (impact < -0.1) return 'text-red-600'
    if (impact < 0) return 'text-red-500'
    return 'text-gray-600'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-4">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-300 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Brain className="w-6 h-6 mr-2" />
            Strategy Learning Tracker
          </h2>
          <p className="text-gray-600">AI adaptation and learning insights</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="1d">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="all">All Time</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadLearningData}
            disabled={isLoading}
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Learning Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Adaptations</p>
                <p className="text-2xl font-bold">{learningStats.totalAdaptations}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Positive Impact</p>
                <p className="text-2xl font-bold text-green-600">
                  {learningStats.totalAdaptations > 0 
                    ? Math.round((learningStats.positiveImpacts / learningStats.totalAdaptations) * 100) 
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold">
                  {Math.round(learningStats.averageConfidence * 100)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Condition</p>
                <p className="text-lg font-bold truncate">
                  {learningStats.topMarketCondition || 'N/A'}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Learning Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {learningEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No learning activities found</p>
              <p className="text-sm">Strategies will adapt as they encounter new market conditions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {learningEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {getStrategyDisplayName(entry.strategy_type)}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getConfidenceColor(entry.confidence_score)}`}
                      >
                        {Math.round(entry.confidence_score * 100)}% confidence
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(entry.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.performance_impact > 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${getImpactColor(entry.performance_impact)}`}>
                        {entry.performance_impact > 0 ? '+' : ''}{(entry.performance_impact * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Market Condition</p>
                      <p className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {entry.market_condition}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Adaptation Made</p>
                      <p className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
                        {entry.adaptation_made}
                      </p>
                    </div>
                  </div>
                  
                  {agentId && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-gray-500">Agent: {entry.agent_id}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Insights */}
      {learningStats.mostEffectiveAdaptation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Most Effective Adaptation</h4>
                <p className="text-sm text-green-700">{learningStats.mostEffectiveAdaptation}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Primary Market Condition</h4>
                <p className="text-sm text-blue-700">{learningStats.topMarketCondition}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}