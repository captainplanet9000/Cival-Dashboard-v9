/**
 * Comprehensive Analytics Dashboard
 * Phase 4: Advanced analytics combining all Trading Farm Brain insights
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { analyticsService } from '@/services/analytics-service'
import { backendApi } from '@/lib/api/backend-client'
import { 
  TrendingUp, 
  TrendingDown,
  Brain, 
  Target, 
  Bot, 
  BarChart3,
  PieChart,
  Zap,
  Shield,
  Clock,
  Search,
  Loader2,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'

interface AnalyticsSummary {
  performance: {
    totalPnL: number
    totalReturn: number
    winRate: number
    sharpeRatio: number
    maxDrawdown: number
  }
  strategies: {
    totalStrategies: number
    activeStrategies: number
    bestPerformer: string
    worstPerformer: string
  }
  agents: {
    totalAgents: number
    activeAgents: number
    bestAgent: string
    avgConfidence: number
  }
  trades: {
    totalTrades: number
    todayTrades: number
    avgTradeValue: number
    successRate: number
  }
  risk: {
    currentVaR: number
    portfolioVolatility: number
    concentrationRisk: number
    systemicRisk: number
  }
}

export default function ComprehensiveAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  // Analytics data states
  const [strategyPatterns, setStrategyPatterns] = useState<any[]>([])
  const [agentSpecializations, setAgentSpecializations] = useState<any>({})
  const [decisionCorrelations, setDecisionCorrelations] = useState<any[]>([])
  const [knowledgeStats, setKnowledgeStats] = useState<any>(null)
  const [farmAnalytics, setFarmAnalytics] = useState<any>(null)

  useEffect(() => {
    loadComprehensiveAnalytics()
  }, [selectedTimeRange])

  const loadComprehensiveAnalytics = async () => {
    setIsLoading(true)
    
    try {
      // Load all analytics data in parallel
      const [
        farmData,
        patternsData,
        specializationsData,
        correlationsData,
        knowledgeData,
        portfolioData,
        performanceData
      ] = await Promise.all([
        backendApi.getFarmComprehensiveAnalytics(),
        backendApi.getStrategyPatterns(),
        backendApi.getAgentSpecializations(),
        backendApi.getDecisionCorrelations(),
        backendApi.getKnowledgeGraphStats(),
        backendApi.getPortfolioSummary(),
        backendApi.getPerformanceMetrics()
      ])

      // Update individual data states
      setFarmAnalytics(farmData.data)
      setStrategyPatterns(patternsData.data?.patterns || [])
      setAgentSpecializations(specializationsData.data?.specializations || {})
      setDecisionCorrelations(correlationsData.data?.correlations || [])
      setKnowledgeStats(knowledgeData.data?.statistics)

      // Create comprehensive summary
      const summary: AnalyticsSummary = {
        performance: {
          totalPnL: performanceData.data?.total_pnl || 0,
          totalReturn: performanceData.data?.total_return_percent || 0,
          winRate: performanceData.data?.win_rate || 0,
          sharpeRatio: performanceData.data?.sharpe_ratio || 0,
          maxDrawdown: performanceData.data?.max_drawdown || 0
        },
        strategies: {
          totalStrategies: patternsData.data?.patterns?.length || 0,
          activeStrategies: patternsData.data?.patterns?.filter((p: any) => p.total_trades > 10).length || 0,
          bestPerformer: patternsData.data?.patterns?.[0]?.strategy_name || 'N/A',
          worstPerformer: patternsData.data?.patterns?.slice(-1)[0]?.strategy_name || 'N/A'
        },
        agents: {
          totalAgents: Object.keys(specializationsData.data?.specializations || {}).length,
          activeAgents: Object.values(specializationsData.data?.specializations || {}).filter((s: any) => s.trade_count > 0).length,
          bestAgent: Object.entries(specializationsData.data?.specializations || {}).sort(([,a]: any, [,b]: any) => b.total_pnl - a.total_pnl)[0]?.[0] || 'N/A',
          avgConfidence: correlationsData.data?.correlations?.reduce((acc: number, c: any) => acc + c.confidence_level, 0) / (correlationsData.data?.correlations?.length || 1) || 0
        },
        trades: {
          totalTrades: performanceData.data?.total_trades || 0,
          todayTrades: Math.floor(Math.random() * 20), // Mock for today's trades
          avgTradeValue: portfolioData.data?.total_equity ? (portfolioData.data.total_equity / (performanceData.data?.total_trades || 1)) : 0,
          successRate: performanceData.data?.win_rate || 0
        },
        risk: {
          currentVaR: 0.05, // Mock VaR
          portfolioVolatility: 0.18, // Mock volatility
          concentrationRisk: 0.3, // Mock concentration
          systemicRisk: 0.25 // Mock systemic risk
        }
      }

      setSummary(summary)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load comprehensive analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number, prefix: string = '', suffix: string = '') => {
    if (Math.abs(num) >= 1e6) {
      return `${prefix}${(num / 1e6).toFixed(1)}M${suffix}`
    } else if (Math.abs(num) >= 1e3) {
      return `${prefix}${(num / 1e3).toFixed(1)}K${suffix}`
    }
    return `${prefix}${num.toFixed(2)}${suffix}`
  }

  const formatPercent = (num: number) => `${(num * 100).toFixed(1)}%`

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getPerformanceIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />
  }

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Loading Comprehensive Analytics</h2>
          <p className="text-muted-foreground">Analyzing trading patterns and performance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Analytics</h1>
          <p className="text-muted-foreground">
            Complete performance analysis and insights from the Trading Farm Brain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <Button onClick={loadComprehensiveAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {summary && (
        <>
          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                {getPerformanceIcon(summary.performance.totalPnL)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(summary.performance.totalPnL)}`}>
                  {formatNumber(summary.performance.totalPnL, '$')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(summary.performance.totalReturn)} total return
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercent(summary.performance.winRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.trades.totalTrades} total trades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.performance.sharpeRatio.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Risk-adjusted returns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatPercent(summary.performance.maxDrawdown)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum loss from peak
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Strategies</span>
                    <Badge variant="outline">{summary.strategies.totalStrategies}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active</span>
                    <Badge variant="default">{summary.strategies.activeStrategies}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Best Performer</span>
                    <span className="text-sm font-medium">{summary.strategies.bestPerformer}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Agents</span>
                    <Badge variant="outline">{summary.agents.totalAgents}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active</span>
                    <Badge variant="default">{summary.agents.activeAgents}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Best Agent</span>
                    <span className="text-sm font-medium">{summary.agents.bestAgent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Confidence</span>
                    <span className="text-sm font-medium">{formatPercent(summary.agents.avgConfidence)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">VaR (95%)</span>
                    <span className="text-sm font-medium">{formatPercent(summary.risk.currentVaR)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Volatility</span>
                    <span className="text-sm font-medium">{formatPercent(summary.risk.portfolioVolatility)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Concentration</span>
                    <span className="text-sm font-medium">{formatPercent(summary.risk.concentrationRisk)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Systemic Risk</span>
                    <span className="text-sm font-medium">{formatPercent(summary.risk.systemicRisk)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                    <CardDescription>Key performance indicators over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Win Rate Trend</span>
                          <span className="text-sm font-medium">{formatPercent(summary.performance.winRate)}</span>
                        </div>
                        <Progress value={summary.performance.winRate * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Sharpe Ratio</span>
                          <span className="text-sm font-medium">{summary.performance.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <Progress value={Math.min(summary.performance.sharpeRatio * 50, 100)} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Agent Confidence</span>
                          <span className="text-sm font-medium">{formatPercent(summary.agents.avgConfidence)}</span>
                        </div>
                        <Progress value={summary.agents.avgConfidence * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trading Activity</CardTitle>
                    <CardDescription>Current trading statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Today's Trades</span>
                        <Badge variant="secondary">{summary.trades.todayTrades}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg Trade Value</span>
                        <span className="font-medium">{formatNumber(summary.trades.avgTradeValue, '$')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Success Rate</span>
                        <span className="font-medium">{formatPercent(summary.trades.successRate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Strategies</span>
                        <Badge variant="default">{summary.strategies.activeStrategies}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="strategies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Strategy Performance Ranking</CardTitle>
                  <CardDescription>Top performing strategies by win rate and P&L</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {strategyPatterns.slice(0, 10).map((strategy, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <div className="font-medium">{strategy.strategy_name}</div>
                            <div className="text-sm text-muted-foreground">{strategy.strategy_type}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatPercent(strategy.win_rate)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(strategy.total_pnl, '$')} P&L
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Specializations</CardTitle>
                  <CardDescription>What each agent excels at</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(agentSpecializations).map(([agentId, spec]: [string, any]) => (
                      <div key={agentId} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{agentId.replace('_', ' ')}</div>
                          <Badge variant="outline">{spec.trade_count} trades</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Best Symbol:</span>
                            <span className="ml-2 font-medium">{spec.preferred_symbol}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">P&L:</span>
                            <span className={`ml-2 font-medium ${getPerformanceColor(spec.total_pnl)}`}>
                              {formatNumber(spec.total_pnl, '$')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Decision Quality Analysis</CardTitle>
                  <CardDescription>Confidence vs outcome correlation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {decisionCorrelations.map((corr, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            Confidence: {formatPercent(corr.confidence_level)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {corr.total_trades} decisions
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatPercent(corr.win_rate)}</div>
                          <div className="text-sm text-muted-foreground">success rate</div>
                        </div>
                        <div className="w-24">
                          <Progress value={corr.win_rate * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Graph Statistics</CardTitle>
                  <CardDescription>Trading knowledge network analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  {knowledgeStats ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Entities</span>
                          <span className="font-medium">{knowledgeStats.total_nodes?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Relationships</span>
                          <span className="font-medium">{knowledgeStats.total_edges?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Connected Components</span>
                          <span className="font-medium">{knowledgeStats.connected_components}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Entity Types</h4>
                        {Object.entries(knowledgeStats.node_types || {}).map(([type, count]: [string, any]) => (
                          <div key={type} className="flex justify-between">
                            <span className="text-sm capitalize">{type}s</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Knowledge graph not initialized</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}