'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Brain,
  Zap
} from 'lucide-react'

interface AgentDecision {
  id: string
  agent_id: string
  agent_name: string
  timestamp: string
  decision_type: 'buy' | 'sell' | 'hold' | 'scan' | 'alert'
  symbol: string
  action: string
  quantity?: number
  price?: number
  confidence: number
  reasoning: string
  llm_provider: string
  execution_status: 'pending' | 'executed' | 'rejected' | 'cancelled'
  performance_impact?: number
  risk_score: number
  tool_analysis?: {
    tools_used: string[]
    analysis_summary: string
  }
}

interface AgentDecisionLogProps {
  className?: string
}

export function AgentDecisionLog({ className }: AgentDecisionLogProps) {
  const [decisions, setDecisions] = useState<AgentDecision[]>([
    {
      id: 'decision_001',
      agent_id: 'trend_follower_001',
      agent_name: 'Trend Hunter Alpha',
      timestamp: '2025-01-19T14:23:00Z',
      decision_type: 'buy',
      symbol: 'BTCUSD',
      action: 'BUY 0.5 BTC at $45,234',
      quantity: 0.5,
      price: 45234,
      confidence: 0.82,
      reasoning: 'Strong bullish momentum detected with RSI at 68.5, MACD bullish crossover, and volume surge of 25%. Technical analysis shows breakout above resistance level at $45,000 with target at $47,500.',
      llm_provider: 'Gemini Flash',
      execution_status: 'executed',
      performance_impact: 2.34,
      risk_score: 0.25,
      tool_analysis: {
        tools_used: ['market_sentiment', 'technical_analysis', 'order_book_analysis'],
        analysis_summary: 'All indicators align for bullish momentum with low execution risk'
      }
    },
    {
      id: 'decision_002',
      agent_id: 'arbitrage_bot_003',
      agent_name: 'Arbitrage Scanner',
      timestamp: '2025-01-19T14:22:45Z',
      decision_type: 'scan',
      symbol: 'ETHUSD',
      action: 'SCAN arbitrage opportunities',
      confidence: 0.95,
      reasoning: 'Detected 0.15% price difference between Binance ($2,289.75) and Coinbase ($2,292.50). Spread exceeds minimum threshold with sufficient liquidity for 5 ETH execution.',
      llm_provider: 'Gemini Flash',
      execution_status: 'executed',
      performance_impact: 1.12,
      risk_score: 0.08,
      tool_analysis: {
        tools_used: ['arbitrage_scanner', 'order_book_depth', 'execution_cost_analysis'],
        analysis_summary: 'High-probability arbitrage with minimal execution risk'
      }
    },
    {
      id: 'decision_003',
      agent_id: 'mean_reversion_002',
      agent_name: 'Mean Reversion Pro',
      timestamp: '2025-01-19T14:20:15Z',
      decision_type: 'hold',
      symbol: 'ETHUSD',
      action: 'HOLD current position',
      confidence: 0.67,
      reasoning: 'ETH price at $2,289 is within normal Bollinger Band range. RSI at 52 shows neutral momentum. Waiting for clearer mean reversion signal or breakout confirmation.',
      llm_provider: 'OpenRouter Claude',
      execution_status: 'executed',
      performance_impact: 0.0,
      risk_score: 0.15,
      tool_analysis: {
        tools_used: ['technical_analysis', 'volatility_assessment', 'correlation_analysis'],
        analysis_summary: 'Neutral market conditions, optimal to maintain current exposure'
      }
    },
    {
      id: 'decision_004',
      agent_id: 'risk_manager_004',
      agent_name: 'Risk Guardian',
      timestamp: '2025-01-19T14:18:30Z',
      decision_type: 'alert',
      symbol: 'Portfolio',
      action: 'ALERT: Portfolio exposure above 65%',
      confidence: 0.91,
      reasoning: 'Current portfolio exposure at 67% exceeds recommended maximum of 65%. VaR at 2.8% approaching 3% limit. Recommend position size reduction or hedging.',
      llm_provider: 'OpenRouter GPT-4',
      execution_status: 'executed',
      performance_impact: 0.0,
      risk_score: 0.72,
      tool_analysis: {
        tools_used: ['portfolio_var_calculation', 'stress_testing', 'correlation_risk_analysis'],
        analysis_summary: 'Elevated risk levels require immediate attention and potential mitigation'
      }
    },
    {
      id: 'decision_005',
      agent_id: 'trend_follower_001',
      agent_name: 'Trend Hunter Alpha',
      timestamp: '2025-01-19T14:15:00Z',
      decision_type: 'sell',
      symbol: 'SOLUSD',
      action: 'SELL 10 SOL at $98.45',
      quantity: 10,
      price: 98.45,
      confidence: 0.76,
      reasoning: 'SOL showing bearish divergence with decreasing volume. RSI overbought at 74, potential reversal signal. Taking profits at resistance level before pullback.',
      llm_provider: 'Gemini Flash',
      execution_status: 'executed',
      performance_impact: 4.67,
      risk_score: 0.22,
      tool_analysis: {
        tools_used: ['divergence_analysis', 'volume_profile', 'support_resistance'],
        analysis_summary: 'Clear reversal signals justify profit-taking at current levels'
      }
    }
  ])

  const [filteredDecisions, setFilteredDecisions] = useState<AgentDecision[]>(decisions)
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Apply filters
  useEffect(() => {
    let filtered = decisions

    if (filterAgent !== 'all') {
      filtered = filtered.filter(d => d.agent_id === filterAgent)
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(d => d.decision_type === filterType)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.execution_status === filterStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.reasoning.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredDecisions(filtered)
  }, [decisions, filterAgent, filterType, filterStatus, searchTerm])

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case 'buy': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'sell': return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'hold': return <Activity className="h-4 w-4 text-blue-500" />
      case 'scan': return <Search className="h-4 w-4 text-purple-500" />
      case 'alert': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500'
    if (confidence >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getRiskColor = (risk: number) => {
    if (risk <= 0.2) return 'text-green-500'
    if (risk <= 0.5) return 'text-yellow-500'
    return 'text-red-500'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const uniqueAgents = Array.from(new Set(decisions.map(d => d.agent_id)))

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Agent Decision Log
              </CardTitle>
              <CardDescription>
                Real-time log of autonomous agent decisions with LLM analysis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Advanced
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search decisions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {uniqueAgents.map(agentId => {
                  const agent = decisions.find(d => d.agent_id === agentId)
                  return (
                    <SelectItem key={agentId} value={agentId}>
                      {agent?.agent_name || agentId}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
                <SelectItem value="scan">Scan</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decision List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredDecisions.map((decision) => (
                <Card key={decision.id} className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getDecisionIcon(decision.decision_type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{decision.agent_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {decision.llm_provider}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatTimestamp(decision.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(decision.execution_status)}
                        <Badge variant={decision.execution_status === 'executed' ? 'default' : 'secondary'}>
                          {decision.execution_status}
                        </Badge>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{decision.action}</p>
                        <Badge variant="outline">{decision.symbol}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {decision.reasoning}
                      </p>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className={`text-sm font-medium ${getConfidenceColor(decision.confidence)}`}>
                          {(decision.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Risk Score</p>
                        <p className={`text-sm font-medium ${getRiskColor(decision.risk_score)}`}>
                          {(decision.risk_score * 100).toFixed(0)}%
                        </p>
                      </div>
                      {decision.performance_impact !== undefined && (
                        <div>
                          <p className="text-xs text-muted-foreground">Impact</p>
                          <p className={`text-sm font-medium ${decision.performance_impact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {decision.performance_impact >= 0 ? '+' : ''}{decision.performance_impact.toFixed(2)}%
                          </p>
                        </div>
                      )}
                      {decision.quantity && (
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="text-sm font-medium">{decision.quantity}</p>
                        </div>
                      )}
                    </div>

                    {/* Tool Analysis */}
                    {decision.tool_analysis && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">MCP Tool Analysis</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="text-muted-foreground">Tools Used: </span>
                            {decision.tool_analysis.tools_used.map((tool, index) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-muted-foreground">
                            <span className="text-foreground">Summary: </span>
                            {decision.tool_analysis.analysis_summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                      {decision.execution_status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {filteredDecisions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No decisions found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AgentDecisionLog