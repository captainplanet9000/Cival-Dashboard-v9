"use client"

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, TrendingUp, TrendingDown, BarChart3, Users, Clock, DollarSign } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Trade {
  trade_id: string
  symbol: string
  side: string
  quantity: number
  entry_price: number
  exit_price?: number
  net_pnl: number
  entry_time: string
  exit_time?: string
  agent_id: string
}

interface AgentDecision {
  decision_id: string
  agent_id: string
  decision_type: string
  symbol: string
  reasoning: string
  confidence_score: number
  executed: boolean
  decision_time: string
}

interface AgentPerformance {
  [agentId: string]: {
    pnl: number
    trades: number
    winning_trades: number
    win_rate: number
  }
}

interface DailyPerformanceData {
  date: string
  summary: {
    total_pnl: number
    total_trades: number
    winning_trades: number
    active_agents: number
    net_profit: number
  } | null
  trades: Trade[]
  decisions: AgentDecision[]
  agent_performance: AgentPerformance
  trade_count: number
  decision_count: number
}

interface DailyPerformanceModalProps {
  date: Date
  isOpen: boolean
  onClose: () => void
}

export function DailyPerformanceModal({ date, isOpen, onClose }: DailyPerformanceModalProps) {
  const [data, setData] = useState<DailyPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && date) {
      fetchDailyData(format(date, 'yyyy-MM-dd'))
    }
  }, [isOpen, date])

  const fetchDailyData = async (dateStr: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/farm/daily/${dateStr}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Failed to fetch daily data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch daily data')
      
      // Set mock data for development
      setData(generateMockDailyData(dateStr))
    } finally {
      setLoading(false)
    }
  }

  const generateMockDailyData = (dateStr: string): DailyPerformanceData => {
    const numTrades = Math.floor(Math.random() * 15) + 1
    const numDecisions = Math.floor(Math.random() * 8) + 1
    const agents = ['marcus_momentum', 'alex_arbitrage', 'sophia_reversion']
    
    const trades: Trade[] = Array.from({ length: numTrades }, (_, i) => {
      const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'MATIC']
      const pnl = (Math.random() - 0.4) * 500
      const agent = agents[Math.floor(Math.random() * agents.length)]
      
      return {
        trade_id: `trade_${dateStr}_${i}`,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        quantity: Math.random() * 2 + 0.1,
        entry_price: 50000 + Math.random() * 20000,
        exit_price: 50000 + Math.random() * 20000,
        net_pnl: pnl,
        entry_time: `${dateStr}T${String(9 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
        exit_time: `${dateStr}T${String(10 + Math.floor(Math.random() * 7)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
        agent_id: agent
      }
    })

    const decisions: AgentDecision[] = Array.from({ length: numDecisions }, (_, i) => ({
      decision_id: `decision_${dateStr}_${i}`,
      agent_id: agents[Math.floor(Math.random() * agents.length)],
      decision_type: ['entry', 'exit', 'hold'][Math.floor(Math.random() * 3)],
      symbol: ['BTC', 'ETH', 'SOL'][Math.floor(Math.random() * 3)],
      reasoning: 'Mock decision reasoning based on market analysis',
      confidence_score: 0.5 + Math.random() * 0.4,
      executed: Math.random() > 0.3,
      decision_time: `${dateStr}T${String(9 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`
    }))

    const totalPnL = trades.reduce((sum, trade) => sum + trade.net_pnl, 0)
    const winningTrades = trades.filter(t => t.net_pnl > 0).length

    // Calculate agent performance
    const agentPerformance: AgentPerformance = {}
    agents.forEach(agent => {
      const agentTrades = trades.filter(t => t.agent_id === agent)
      const agentPnL = agentTrades.reduce((sum, t) => sum + t.net_pnl, 0)
      const agentWins = agentTrades.filter(t => t.net_pnl > 0).length
      
      agentPerformance[agent] = {
        pnl: agentPnL,
        trades: agentTrades.length,
        winning_trades: agentWins,
        win_rate: agentTrades.length > 0 ? agentWins / agentTrades.length : 0
      }
    })

    return {
      date: dateStr,
      summary: {
        total_pnl: totalPnL,
        total_trades: numTrades,
        winning_trades: winningTrades,
        active_agents: agents.length,
        net_profit: totalPnL * 0.98
      },
      trades,
      decisions,
      agent_performance: agentPerformance,
      trade_count: numTrades,
      decision_count: numDecisions
    }
  }

  const formatTime = (timeStr: string) => {
    try {
      return format(new Date(timeStr), 'HH:mm')
    } catch {
      return timeStr
    }
  }

  const getAgentDisplayName = (agentId: string) => {
    const names: { [key: string]: string } = {
      'marcus_momentum': 'Marcus Momentum',
      'alex_arbitrage': 'Alex Arbitrage',
      'sophia_reversion': 'Sophia Reversion'
    }
    return names[agentId] || agentId
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Performance Details - {format(date, 'MMMM d, yyyy')}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Error: {error}</p>
            <p className="text-sm text-gray-600">Showing mock data for development</p>
          </div>
        ) : null}

        {data && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className={`h-4 w-4 ${data.summary?.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="text-sm font-medium text-muted-foreground">Total P&L</div>
                  </div>
                  <div className={`text-2xl font-bold ${data.summary?.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.summary?.total_pnl >= 0 ? '+' : ''}${data.summary?.total_pnl?.toFixed(2) || '0.00'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <div className="text-sm font-medium text-muted-foreground">Trades</div>
                  </div>
                  <div className="text-2xl font-bold">{data.summary?.total_trades || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div className="text-sm font-medium text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {data.summary?.total_trades > 0 
                      ? ((data.summary.winning_trades / data.summary.total_trades) * 100).toFixed(1)
                      : '0'
                    }%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <div className="text-sm font-medium text-muted-foreground">Active Agents</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{data.summary?.active_agents || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Data Tabs */}
            <Tabs defaultValue="trades" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trades">Trades ({data.trades?.length || 0})</TabsTrigger>
                <TabsTrigger value="agents">Agent Performance</TabsTrigger>
                <TabsTrigger value="decisions">Decisions ({data.decisions?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="trades" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Trade Details</CardTitle>
                    <CardDescription>All trades executed on this day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.trades && data.trades.length > 0 ? (
                      <div className="space-y-3">
                        {data.trades.map((trade) => (
                          <div key={trade.trade_id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Badge variant="outline">{trade.symbol}</Badge>
                              <div>
                                <div className="font-medium">{getAgentDisplayName(trade.agent_id)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatTime(trade.entry_time)} - {trade.exit_time ? formatTime(trade.exit_time) : 'Open'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-semibold ${trade.net_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.net_pnl >= 0 ? '+' : ''}${trade.net_pnl.toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {trade.side.toUpperCase()} {trade.quantity.toFixed(3)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No trades on this day</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agents" className="space-y-4">
                <div className="grid gap-4">
                  {Object.entries(data.agent_performance).map(([agentId, performance]) => (
                    <Card key={agentId}>
                      <CardHeader>
                        <CardTitle className="text-lg">{getAgentDisplayName(agentId)}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">P&L</div>
                            <div className={`text-lg font-semibold ${performance.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {performance.pnl >= 0 ? '+' : ''}${performance.pnl.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Trades</div>
                            <div className="text-lg font-semibold">{performance.trades}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Wins</div>
                            <div className="text-lg font-semibold text-green-600">{performance.winning_trades}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Win Rate</div>
                            <div className="text-lg font-semibold">{(performance.win_rate * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="decisions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Decisions</CardTitle>
                    <CardDescription>All decisions made by agents on this day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.decisions && data.decisions.length > 0 ? (
                      <div className="space-y-3">
                        {data.decisions.map((decision) => (
                          <div key={decision.decision_id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{decision.symbol}</Badge>
                                <Badge variant={decision.executed ? "default" : "secondary"}>
                                  {decision.decision_type}
                                </Badge>
                                <span className="font-medium">{getAgentDisplayName(decision.agent_id)}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatTime(decision.decision_time)}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{decision.reasoning}</p>
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                Confidence: <span className="font-medium">{(decision.confidence_score * 100).toFixed(1)}%</span>
                              </div>
                              <Badge variant={decision.executed ? "default" : "outline"}>
                                {decision.executed ? "Executed" : "Not Executed"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No decisions recorded for this day</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}