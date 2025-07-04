"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, Trophy, TrendingUp, TrendingDown, Star, 
  Zap, Brain, Target, Activity, Award 
} from 'lucide-react'

interface PerformanceData {
  rankings: Array<{
    entity_id: string
    entity_type: string
    rank: number
    performance: number
    confidence: number
  }>
  top_agents: Array<{
    agent_id: string
    strategy: string
    performance: number
    pnl: number
    trades: number
  }>
}

interface AgentFarmData {
  farms: Array<{
    farm_id: string
    name: string
    strategy_type: string
    agent_count: number
    agents: Array<{
      agent_id: string
      name: string
      status: string
      performance: number
      capital_assigned: number
      last_activity: string
    }>
  }>
}

interface AgentPerformanceRankingProps {
  data: PerformanceData | null
  agentFarmData: AgentFarmData | null
  timeRange: string
}

export function AgentPerformanceRanking({ data, agentFarmData, timeRange }: AgentPerformanceRankingProps) {
  const [sortBy, setSortBy] = useState('performance')
  const [filterStrategy, setFilterStrategy] = useState('all')
  const [showOnlyActive, setShowOnlyActive] = useState(true)

  if (!data && !agentFarmData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Agent Performance Ranking</h3>
            <p className="text-muted-foreground">No agent performance data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Combine data from both sources
  const allAgents = React.useMemo(() => {
    const agents = []

    // Add agents from performance data
    if (data?.top_agents) {
      data.top_agents.forEach(agent => {
        agents.push({
          id: agent.agent_id,
          name: agent.agent_id,
          strategy: agent.strategy,
          performance: agent.performance,
          pnl: agent.pnl,
          trades: agent.trades,
          status: 'active',
          farm: 'Unknown',
          capital: 0,
          rank: 0,
          confidence: 1.0,
          winRate: Math.random() * 0.4 + 0.6, // Mock win rate
          avgTrade: agent.pnl / Math.max(agent.trades, 1),
          lastActivity: new Date().toISOString()
        })
      })
    }

    // Add agents from farm data
    if (agentFarmData?.farms) {
      agentFarmData.farms.forEach(farm => {
        farm.agents.forEach(agent => {
          const existingAgent = agents.find(a => a.id === agent.agent_id)
          if (existingAgent) {
            // Update with farm information
            existingAgent.name = agent.name
            existingAgent.farm = farm.name
            existingAgent.capital = agent.capital_assigned
            existingAgent.lastActivity = agent.last_activity
            existingAgent.status = agent.status
          } else {
            // Add new agent
            agents.push({
              id: agent.agent_id,
              name: agent.name,
              strategy: farm.strategy_type,
              performance: agent.performance,
              pnl: Math.random() * 2000 - 500, // Mock P&L
              trades: Math.floor(Math.random() * 50) + 10, // Mock trades
              status: agent.status,
              farm: farm.name,
              capital: agent.capital_assigned,
              rank: 0,
              confidence: Math.random() * 0.3 + 0.7,
              winRate: Math.random() * 0.4 + 0.6,
              avgTrade: (Math.random() * 2000 - 500) / Math.max(Math.floor(Math.random() * 50) + 10, 1),
              lastActivity: agent.last_activity
            })
          }
        })
      })
    }

    // Apply filters
    let filteredAgents = agents.filter(agent => {
      if (showOnlyActive && agent.status !== 'active') return false
      if (filterStrategy !== 'all' && agent.strategy !== filterStrategy) return false
      return true
    })

    // Sort agents
    filteredAgents.sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.performance - a.performance
        case 'pnl':
          return b.pnl - a.pnl
        case 'trades':
          return b.trades - a.trades
        case 'capital':
          return b.capital - a.capital
        case 'winRate':
          return b.winRate - a.winRate
        default:
          return b.performance - a.performance
      }
    })

    // Assign ranks
    filteredAgents.forEach((agent, index) => {
      agent.rank = index + 1
    })

    return filteredAgents
  }, [data, agentFarmData, sortBy, filterStrategy, showOnlyActive])

  // Get unique strategies for filter
  const strategies = React.useMemo(() => {
    const uniqueStrategies = new Set(allAgents.map(agent => agent.strategy))
    return Array.from(uniqueStrategies)
  }, [allAgents])

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    const activeAgents = allAgents.filter(a => a.status === 'active')
    const totalPnL = activeAgents.reduce((sum, a) => sum + a.pnl, 0)
    const avgPerformance = activeAgents.reduce((sum, a) => sum + a.performance, 0) / Math.max(activeAgents.length, 1)
    const topPerformer = activeAgents[0]
    const worstPerformer = activeAgents[activeAgents.length - 1]

    return {
      totalAgents: allAgents.length,
      activeAgents: activeAgents.length,
      totalPnL,
      avgPerformance,
      topPerformer,
      worstPerformer
    }
  }, [allAgents])

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Agent Performance Summary
          </CardTitle>
          <CardDescription>
            Performance overview and key metrics for {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {summaryStats.activeAgents}
              </div>
              <p className="text-sm text-muted-foreground">Active Agents</p>
              <p className="text-xs text-muted-foreground">
                of {summaryStats.totalAgents} total
              </p>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                summaryStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${summaryStats.totalPnL.toFixed(0)}
              </div>
              <p className="text-sm text-muted-foreground">Combined P&L</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {summaryStats.totalPnL >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={`text-xs ${
                  summaryStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summaryStats.totalPnL >= 0 ? '+' : ''}{(summaryStats.totalPnL / 10000 * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {summaryStats.avgPerformance.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Avg Performance</p>
              <Progress value={Math.abs(summaryStats.avgPerformance)} className="mt-2 h-2" />
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {summaryStats.topPerformer?.performance.toFixed(1) || '0.0'}%
              </div>
              <p className="text-sm text-muted-foreground">Top Performer</p>
              {summaryStats.topPerformer && (
                <p className="text-xs text-muted-foreground">
                  {summaryStats.topPerformer.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Agent Performance Rankings
          </CardTitle>
          <CardDescription>
            Detailed agent performance with filtering and sorting options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="pnl">P&L</SelectItem>
                  <SelectItem value="trades">Trades</SelectItem>
                  <SelectItem value="capital">Capital</SelectItem>
                  <SelectItem value="winRate">Win Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Strategy:</label>
              <Select value={filterStrategy} onValueChange={setFilterStrategy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {strategies.map(strategy => (
                    <SelectItem key={strategy} value={strategy}>
                      {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Active Only:</label>
              <Button
                variant={showOnlyActive ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyActive(!showOnlyActive)}
              >
                {showOnlyActive ? "Yes" : "No"}
              </Button>
            </div>
          </div>

          {/* Agent Rankings */}
          <div className="space-y-3">
            {allAgents.slice(0, 20).map((agent, i) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    agent.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                    agent.rank === 2 ? 'bg-gray-100 text-gray-800' :
                    agent.rank === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {agent.rank <= 3 ? (
                      agent.rank === 1 ? <Trophy className="h-4 w-4" /> :
                      agent.rank === 2 ? <Award className="h-4 w-4" /> :
                      <Star className="h-4 w-4" />
                    ) : (
                      `#${agent.rank}`
                    )}
                  </div>

                  {/* Agent Info */}
                  <div>
                    <h4 className="font-medium">{agent.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="capitalize text-xs">
                        {agent.strategy}
                      </Badge>
                      <span>•</span>
                      <span>{agent.farm}</span>
                      <span>•</span>
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="capitalize">{agent.status}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className={`font-bold ${
                      agent.performance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {agent.performance >= 0 ? '+' : ''}{agent.performance.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Performance</div>
                  </div>

                  <div className="text-right">
                    <div className={`font-bold ${
                      agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${agent.pnl.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">P&L</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold">{agent.trades}</div>
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold">{(agent.winRate * 100).toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold">${agent.capital.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Capital</div>
                  </div>

                  {/* Confidence Score */}
                  <div className="w-16">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-blue-600 rounded-full" 
                        style={{ width: `${agent.confidence * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-center text-muted-foreground mt-1">
                      {(agent.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {allAgents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Agents Found</h3>
                <p>No agents match the current filters</p>
              </div>
            )}
          </div>

          {allAgents.length > 20 && (
            <div className="text-center mt-6">
              <Button variant="outline">
                View All {allAgents.length} Agents
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performers Spotlight */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Top Performers Spotlight
          </CardTitle>
          <CardDescription>
            Detailed view of the highest performing agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allAgents.slice(0, 6).map((agent, i) => (
              <div key={agent.id} className="p-6 border-2 rounded-lg space-y-4 relative">
                {/* Rank Badge */}
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  agent.rank === 1 ? 'bg-yellow-500 text-white' :
                  agent.rank === 2 ? 'bg-gray-400 text-white' :
                  agent.rank === 3 ? 'bg-orange-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  #{agent.rank}
                </div>

                <div className="text-center">
                  <h4 className="font-bold text-lg">{agent.name}</h4>
                  <p className="text-sm text-muted-foreground">{agent.farm}</p>
                  <Badge variant="outline" className="mt-2 capitalize">
                    {agent.strategy}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Performance:</span>
                    <span className={`font-bold ${
                      agent.performance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {agent.performance >= 0 ? '+' : ''}{agent.performance.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">P&L:</span>
                    <span className={`font-bold ${
                      agent.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${agent.pnl.toFixed(0)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span className="font-bold">{(agent.winRate * 100).toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trades:</span>
                    <span className="font-bold">{agent.trades}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg/Trade:</span>
                    <span className={`font-bold ${
                      agent.avgTrade >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${agent.avgTrade.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span>{(agent.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={agent.confidence * 100} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AgentPerformanceRanking