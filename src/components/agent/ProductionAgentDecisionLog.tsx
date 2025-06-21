'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Clock, DollarSign, Target, BarChart3, Zap, Play, Pause,
  RefreshCw, Filter, Search, Eye, MessageSquare, Activity,
  Bot, Lightbulb, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { supabase, dbHelpers } from '@/lib/supabase/client'
import { backendApi } from '@/lib/api/backend-client'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface AgentDecision {
  id: string
  agentId: string
  agentName?: string
  decisionType: 'trade' | 'hold' | 'rebalance' | 'analysis' | 'risk_check'
  symbol?: string
  reasoning: string
  confidenceScore: number
  marketData: Record<string, any>
  actionTaken: boolean
  result?: Record<string, any>
  executionTimeMs?: number
  createdAt: string
}

interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'paused' | 'error'
  totalPnl: number
  winRate: number
  tradesCount: number
}

interface FilterOptions {
  agentId?: string
  decisionType?: string
  symbol?: string
  actionTaken?: boolean
  timeRange?: string
}

export function ProductionAgentDecisionLog() {
  const [decisions, setDecisions] = useState<AgentDecision[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedDecision, setSelectedDecision] = useState<AgentDecision | null>(null)

  // Fetch agents list
  const fetchAgents = useCallback(async () => {
    try {
      const response = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })

      if (response.data) {
        setAgents(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }, [])

  // Fetch decisions with filters
  const fetchDecisions = useCallback(async () => {
    try {
      let query = supabase
        .from('agent_decisions')
        .select(`
          *,
          agents(name)
        `)

      // Apply filters
      if (filters.agentId) {
        query = query.eq('agent_id', filters.agentId)
      }
      if (filters.decisionType) {
        query = query.eq('decision_type', filters.decisionType)
      }
      if (filters.symbol) {
        query = query.eq('symbol', filters.symbol)
      }
      if (filters.actionTaken !== undefined) {
        query = query.eq('action_taken', filters.actionTaken)
      }
      if (filters.timeRange) {
        const now = new Date()
        let startDate = new Date()
        
        switch (filters.timeRange) {
          case '1h':
            startDate.setHours(now.getHours() - 1)
            break
          case '24h':
            startDate.setDate(now.getDate() - 1)
            break
          case '7d':
            startDate.setDate(now.getDate() - 7)
            break
          case '30d':
            startDate.setDate(now.getDate() - 30)
            break
        }
        
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const formattedDecisions: AgentDecision[] = (data || []).map(decision => ({
        id: decision.id,
        agentId: decision.agent_id,
        agentName: decision.agents?.name || 'Unknown Agent',
        decisionType: decision.decision_type,
        symbol: decision.symbol,
        reasoning: decision.reasoning,
        confidenceScore: decision.confidence_score,
        marketData: decision.market_data || {},
        actionTaken: decision.action_taken,
        result: decision.result,
        executionTimeMs: decision.execution_time_ms,
        createdAt: decision.created_at
      }))

      setDecisions(formattedDecisions)
    } catch (error) {
      console.error('Failed to fetch decisions:', error)
      toast.error('Failed to fetch agent decisions')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Real-time subscription to new decisions
  useEffect(() => {
    const subscription = supabase
      .channel('agent_decisions')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'agent_decisions' 
        }, 
        (payload) => {
          console.log('New decision received:', payload)
          fetchDecisions()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchDecisions])

  // Auto-refresh functionality
  useEffect(() => {
    fetchAgents()
    fetchDecisions()

    if (autoRefresh) {
      const interval = setInterval(fetchDecisions, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [fetchAgents, fetchDecisions, autoRefresh])

  // Filter decisions by search term
  const filteredDecisions = decisions.filter(decision => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      decision.reasoning.toLowerCase().includes(searchLower) ||
      decision.symbol?.toLowerCase().includes(searchLower) ||
      decision.agentName?.toLowerCase().includes(searchLower) ||
      decision.decisionType.toLowerCase().includes(searchLower)
    )
  })

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case 'trade': return <TrendingUp className="h-4 w-4" />
      case 'hold': return <Clock className="h-4 w-4" />
      case 'rebalance': return <PieChart className="h-4 w-4" />
      case 'analysis': return <BarChart3 className="h-4 w-4" />
      case 'risk_check': return <AlertTriangle className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getDecisionColor = (type: string) => {
    switch (type) {
      case 'trade': return 'bg-blue-500'
      case 'hold': return 'bg-gray-500'
      case 'rebalance': return 'bg-purple-500'
      case 'analysis': return 'bg-green-500'
      case 'risk_check': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const triggerAgentDecision = async (agentId: string) => {
    try {
      const response = await backendApi.post(`/api/v1/agents/${agentId}/execute-decision`, {
        type: 'analysis',
        symbol: 'BTC',
        reasoning: 'Manual trigger from dashboard'
      })

      if (response.data) {
        toast.success('Agent decision triggered successfully')
        fetchDecisions()
      }
    } catch (error) {
      console.error('Failed to trigger agent decision:', error)
      toast.error('Failed to trigger agent decision')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            Production Agent Decision Log
          </h2>
          <p className="text-muted-foreground">
            Real-time monitoring of AI agent decision-making and reasoning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDecisions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="agent-filter">Agent</Label>
              <Select value={filters.agentId || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, agentId: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Agents</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type-filter">Decision Type</Label>
              <Select value={filters.decisionType || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, decisionType: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="trade">Trade</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                  <SelectItem value="rebalance">Rebalance</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="risk_check">Risk Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action-filter">Action Taken</Label>
              <Select value={filters.actionTaken?.toString() || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, actionTaken: value ? value === 'true' : undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="true">Action Taken</SelectItem>
                  <SelectItem value="false">No Action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="time-filter">Time Range</Label>
              <Select value={filters.timeRange || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value || undefined }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Time</SelectItem>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search decisions by reasoning, symbol, or agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {agents.slice(0, 4).map(agent => (
          <Card key={agent.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{agent.name}</h3>
                <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
                  {agent.status}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>PnL: {formatCurrency(agent.totalPnl)}</div>
                <div>Win Rate: {formatPercent(agent.winRate)}</div>
                <div>Trades: {agent.tradesCount}</div>
              </div>
              <Button 
                size="sm" 
                variant="agent"
                className="w-full mt-2"
                onClick={() => triggerAgentDecision(agent.id)}
              >
                <Zap className="h-3 w-3 mr-1" />
                Trigger Decision
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Decisions List */}
      <Card>
        <CardHeader>
          <CardTitle>Decision Log ({filteredDecisions.length})</CardTitle>
          <CardDescription>
            Real-time stream of agent decisions and reasoning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading agent decisions...</p>
            </div>
          ) : filteredDecisions.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No decisions found with current filters</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredDecisions.map((decision) => (
                  <div 
                    key={decision.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedDecision(decision)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${getDecisionColor(decision.decisionType)} text-white`}>
                          {getDecisionIcon(decision.decisionType)}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">
                            {decision.agentName} • {decision.decisionType.replace('_', ' ')}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(decision.createdAt)}
                            {decision.symbol && ` • ${decision.symbol}`}
                            {decision.executionTimeMs && ` • ${decision.executionTimeMs}ms`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={decision.actionTaken ? 'success' : 'outline'}>
                          {decision.actionTaken ? 'Action Taken' : 'No Action'}
                        </Badge>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Confidence</div>
                          <Progress 
                            value={decision.confidenceScore * 100} 
                            className="w-16 h-2"
                          />
                          <div className="text-xs font-medium">
                            {(decision.confidenceScore * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {decision.reasoning}
                    </p>

                    {decision.result && Object.keys(decision.result).length > 0 && (
                      <div className="text-xs text-muted-foreground bg-gray-100 p-2 rounded">
                        <strong>Result:</strong> {JSON.stringify(decision.result, null, 2).slice(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Decision Detail Modal */}
      {selectedDecision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getDecisionIcon(selectedDecision.decisionType)}
                Decision Details
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDecision(null)}
                className="absolute top-4 right-4"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Agent</Label>
                  <p className="font-medium">{selectedDecision.agentName}</p>
                </div>
                
                <div>
                  <Label>Decision Type</Label>
                  <p className="font-medium">{selectedDecision.decisionType.replace('_', ' ')}</p>
                </div>

                {selectedDecision.symbol && (
                  <div>
                    <Label>Symbol</Label>
                    <p className="font-medium">{selectedDecision.symbol}</p>
                  </div>
                )}

                <div>
                  <Label>Reasoning</Label>
                  <p className="text-sm">{selectedDecision.reasoning}</p>
                </div>

                <div>
                  <Label>Confidence Score</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedDecision.confidenceScore * 100} className="flex-1" />
                    <span className="text-sm font-medium">
                      {(selectedDecision.confidenceScore * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {selectedDecision.marketData && Object.keys(selectedDecision.marketData).length > 0 && (
                  <div>
                    <Label>Market Data</Label>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedDecision.marketData, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedDecision.result && Object.keys(selectedDecision.result).length > 0 && (
                  <div>
                    <Label>Result</Label>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedDecision.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ProductionAgentDecisionLog