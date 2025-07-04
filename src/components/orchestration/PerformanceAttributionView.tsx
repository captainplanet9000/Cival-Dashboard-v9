"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Medal,
  User,
  Building,
  Eye,
  Download
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Ranking {
  entity_id: string
  entity_type: string
  rank: number
  performance: number
  confidence: number
}

interface Attribution {
  entity_id: string
  level: string
  total_return: number
  attributed_return: number
  contributions: Record<string, number>
}

interface TopAgent {
  agent_id: string
  strategy: string
  performance: number
  pnl: number
  trades: number
}

interface PerformanceData {
  rankings: Ranking[]
  attributions: Attribution[]
  top_agents: TopAgent[]
}

interface PerformanceAttributionViewProps {
  data: PerformanceData | null
  isLoading: boolean
}

function RankingCard({ ranking }: { ranking: Ranking }) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600'
    if (rank === 2) return 'text-gray-500'
    if (rank === 3) return 'text-amber-600'
    return 'text-muted-foreground'
  }

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Medal className={`h-5 w-5 ${getRankColor(rank)}`} />
    }
    return <span className={`font-bold text-lg ${getRankColor(rank)}`}>#{rank}</span>
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'agent': return <User className="h-4 w-4" />
      case 'farm': return <Building className="h-4 w-4" />
      case 'goal': return <Target className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getRankIcon(ranking.rank)}
            <div>
              <div className="flex items-center space-x-2">
                {getEntityIcon(ranking.entity_type)}
                <span className="font-medium">{ranking.entity_id}</span>
              </div>
              <Badge variant="outline" className="text-xs mt-1">
                {ranking.entity_type}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-xl font-bold ${ranking.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ranking.performance > 0 ? '+' : ''}{ranking.performance.toFixed(2)}%
            </div>
            <div className={`text-xs ${getConfidenceColor(ranking.confidence)}`}>
              {(ranking.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confidence Score</span>
            <span className={getConfidenceColor(ranking.confidence)}>
              {(ranking.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={ranking.confidence * 100} className="h-2" />
        </div>

        <div className="flex space-x-2 pt-3">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AttributionCard({ attribution }: { attribution: Attribution }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const contributionEntries = Object.entries(attribution.contributions)
  const totalContributions = Object.values(attribution.contributions).reduce((sum, val) => sum + val, 0)

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'agent': return <User className="h-4 w-4" />
      case 'farm': return <Building className="h-4 w-4" />
      case 'goal': return <Target className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'agent': return 'bg-blue-100 text-blue-800'
      case 'farm': return 'bg-green-100 text-green-800'
      case 'goal': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              {getLevelIcon(attribution.level)}
              <span>{attribution.entity_id}</span>
            </CardTitle>
            <CardDescription>
              <Badge className={getLevelColor(attribution.level)}>
                {attribution.level}
              </Badge>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${attribution.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${attribution.total_return.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Return</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Attribution Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-bold">${attribution.attributed_return.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Attributed</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-bold">
              {((attribution.attributed_return / Math.max(attribution.total_return, 1)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Attribution Rate</div>
          </div>
        </div>

        {/* Contributions Toggle */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {isExpanded ? 'Hide' : 'Show'} Contributions ({contributionEntries.length})
        </Button>

        {/* Detailed Contributions (expandable) */}
        {isExpanded && contributionEntries.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            {contributionEntries
              .sort(([, a], [, b]) => b - a) // Sort by contribution value
              .map(([entityId, contribution]) => {
                const percentage = totalContributions > 0 ? (contribution / totalContributions) * 100 : 0
                return (
                  <div key={entityId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{entityId}</span>
                      <div className="text-right">
                        <span className={`font-bold ${contribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${contribution.toLocaleString()}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={Math.abs(percentage)} 
                      className={`h-2 ${contribution < 0 ? 'progress-red' : ''}`} 
                    />
                  </div>
                )
              })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TopAgentCard({ agent }: { agent: TopAgent }) {
  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'momentum': return 'bg-blue-100 text-blue-800'
      case 'arbitrage': return 'bg-purple-100 text-purple-800'
      case 'mean_reversion': return 'bg-orange-100 text-orange-800'
      case 'market_making': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium">{agent.agent_id}</div>
            <Badge className={getStrategyColor(agent.strategy)}>
              {agent.strategy}
            </Badge>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${agent.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {agent.performance > 0 ? '+' : ''}{agent.performance.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">{agent.trades} trades</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">P&L</span>
            <span className={`font-medium ${agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${agent.pnl.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Trades</span>
            <span className="font-medium">{agent.trades}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg P&L</span>
            <span className="font-medium">
              ${agent.trades > 0 ? (agent.pnl / agent.trades).toFixed(0) : '0'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PerformanceAttributionView({ data, isLoading }: PerformanceAttributionViewProps) {
  const [selectedTab, setSelectedTab] = useState('rankings')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Tabs defaultValue="rankings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="attributions">Attributions</TabsTrigger>
            <TabsTrigger value="top-agents">Top Agents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rankings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No Performance Data</h3>
          <p className="text-muted-foreground">
            Performance attribution data will appear here once trading begins.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalRankings = data.rankings?.length || 0
  const totalAttributions = data.attributions?.length || 0
  const totalTopAgents = data.top_agents?.length || 0
  const avgPerformance = data.top_agents?.length 
    ? data.top_agents.reduce((sum, agent) => sum + agent.performance, 0) / data.top_agents.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Rankings</span>
            </div>
            <div className="text-2xl font-bold mt-2">{totalRankings}</div>
            <p className="text-xs text-muted-foreground">Entities ranked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Attributions</span>
            </div>
            <div className="text-2xl font-bold mt-2">{totalAttributions}</div>
            <p className="text-xs text-muted-foreground">Performance tracked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Top Agents</span>
            </div>
            <div className="text-2xl font-bold mt-2">{totalTopAgents}</div>
            <p className="text-xs text-muted-foreground">Active performers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Avg Performance</span>
            </div>
            <div className={`text-2xl font-bold mt-2 ${avgPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {avgPerformance > 0 ? '+' : ''}{avgPerformance.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Top agents average</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="attributions">Attributions</TabsTrigger>
            <TabsTrigger value="top-agents">Top Agents</TabsTrigger>
          </TabsList>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <TabsContent value="rankings" className="space-y-4">
          {data.rankings?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.rankings.slice(0, 12).map((ranking) => (
                <RankingCard key={`${ranking.entity_id}-${ranking.entity_type}`} ranking={ranking} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No rankings available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attributions" className="space-y-4">
          {data.attributions?.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.attributions.map((attribution) => (
                <AttributionCard key={attribution.entity_id} attribution={attribution} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No attribution data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="top-agents" className="space-y-4">
          {data.top_agents?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.top_agents.map((agent) => (
                <TopAgentCard key={agent.agent_id} agent={agent} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No top agents data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}