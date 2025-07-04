"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, TrendingDown, Users, Target } from 'lucide-react'

interface PerformanceData {
  rankings: Array<{
    entity_id: string
    entity_type: string
    rank: number
    performance: number
    confidence: number
  }>
  attributions: Array<{
    entity_id: string
    level: string
    total_return: number
    attributed_return: number
    contributions: Record<string, number>
  }>
  top_agents: Array<{
    agent_id: string
    strategy: string
    performance: number
    pnl: number
    trades: number
  }>
}

interface PerformanceAttributionChartProps {
  data: PerformanceData | null
  timeRange: string
}

export function PerformanceAttributionChart({ data, timeRange }: PerformanceAttributionChartProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Performance Attribution</h3>
            <p className="text-muted-foreground">No performance data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate summary metrics
  const totalAttribution = data.attributions.reduce((sum, attr) => sum + attr.attributed_return, 0)
  const avgConfidence = data.rankings.reduce((sum, rank) => sum + rank.confidence, 0) / Math.max(data.rankings.length, 1)
  const topPerformer = data.rankings.find(r => r.rank === 1)

  return (
    <div className="space-y-6">
      {/* Performance Attribution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Performance Attribution Analysis
          </CardTitle>
          <CardDescription>
            Multi-level performance tracking and attribution for {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Attribution */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${totalAttribution.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Total Attributed Return</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+12.4% vs previous period</span>
              </div>
            </div>

            {/* Attribution Confidence */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {(avgConfidence * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Attribution Confidence</p>
              <Progress value={avgConfidence * 100} className="mt-2 h-2" />
            </div>

            {/* Top Performer */}
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {topPerformer ? `#${topPerformer.rank}` : 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">Top Performer</p>
              {topPerformer && (
                <Badge variant="default" className="mt-1">
                  {topPerformer.performance.toFixed(1)}% return
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attribution Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Attribution Breakdown
            </CardTitle>
            <CardDescription>
              Performance attribution by entity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.attributions.map((attribution, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{attribution.entity_id}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {attribution.level} Level
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        attribution.attributed_return >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${attribution.attributed_return.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        of ${attribution.total_return.toFixed(2)} total
                      </div>
                    </div>
                  </div>

                  {/* Contribution Breakdown */}
                  {Object.keys(attribution.contributions).length > 0 && (
                    <div className="ml-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Contributions:</p>
                      {Object.entries(attribution.contributions).map(([contributor, amount], j) => (
                        <div key={j} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{contributor}</span>
                          <span className={amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${Number(amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attribution Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Attribution Accuracy</span>
                      <span>{((attribution.attributed_return / attribution.total_return) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.abs((attribution.attributed_return / attribution.total_return) * 100)}
                      className="h-1"
                    />
                  </div>
                </div>
              ))}

              {data.attributions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No attribution data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Performance Rankings
            </CardTitle>
            <CardDescription>
              Entity performance ranking with confidence scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.rankings.slice(0, 10).map((ranking, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      ranking.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                      ranking.rank === 2 ? 'bg-gray-100 text-gray-800' :
                      ranking.rank === 3 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      #{ranking.rank}
                    </div>
                    <div>
                      <h4 className="font-medium">{ranking.entity_id}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {ranking.entity_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      ranking.performance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {ranking.performance >= 0 ? '+' : ''}{ranking.performance.toFixed(2)}%
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="h-1 bg-blue-600 rounded-full" 
                          style={{ width: `${ranking.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(ranking.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {data.rankings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No ranking data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Agents Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Top Agent Performance
          </CardTitle>
          <CardDescription>
            Highest performing agents with detailed metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.top_agents.map((agent, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{agent.agent_id}</h4>
                  <Badge variant="outline" className="capitalize">
                    {agent.strategy}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Performance:</span>
                    <span className={`font-medium ${
                      agent.performance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {agent.performance >= 0 ? '+' : ''}{agent.performance.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P&L:</span>
                    <span className={`font-medium ${
                      agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${agent.pnl.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trades:</span>
                    <span className="font-medium">{agent.trades}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg per Trade:</span>
                    <span className="font-medium">
                      ${(agent.pnl / Math.max(agent.trades, 1)).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <Progress 
                  value={Math.min(Math.abs(agent.performance), 100)} 
                  className="h-2"
                />
              </div>
            ))}

            {data.top_agents.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No agent performance data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceAttributionChart