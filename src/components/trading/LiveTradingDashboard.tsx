'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play,
  Pause,
  Square,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  DollarSign,
  Target,
  Brain,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Settings
} from 'lucide-react'

interface LiveTrade {
  id: string
  opportunity_id: string
  agent_id: string
  agent_name: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  entry_price: number
  current_price: number
  pnl: number
  pnl_percent: number
  confidence: number
  status: 'pending' | 'executed' | 'closed'
  timestamp: string
  reasoning: string
  llm_provider: string
  tool_analysis: string[]
}

interface MarketOpportunity {
  id: string
  symbol: string
  strategy_type: string
  entry_price: number
  target_price: number
  stop_loss: number
  confidence_score: number
  risk_reward_ratio: number
  market_analysis: string
  timestamp: string
  status: 'identified' | 'analyzed' | 'executed' | 'rejected'
}

interface TradingMetrics {
  total_opportunities: number
  opportunities_traded: number
  active_trades: number
  total_pnl: number
  win_rate: number
  avg_hold_time: string
  risk_exposure: number
}

interface LiveTradingDashboardProps {
  className?: string
}

export function LiveTradingDashboard({ className }: LiveTradingDashboardProps) {
  const [isAutonomousEnabled, setIsAutonomousEnabled] = useState(true)
  const [tradingMode, setTradingMode] = useState<'paper' | 'live'>('paper')
  
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([
    {
      id: 'trade_001',
      opportunity_id: 'opp_001',
      agent_id: 'trend_follower_001',
      agent_name: 'Trend Hunter Alpha',
      symbol: 'BTCUSD',
      side: 'buy',
      quantity: 0.5,
      entry_price: 45234,
      current_price: 45678,
      pnl: 222.0,
      pnl_percent: 0.98,
      confidence: 0.82,
      status: 'executed',
      timestamp: '2025-01-19T14:23:00Z',
      reasoning: 'Strong bullish momentum with RSI breakout and volume surge',
      llm_provider: 'Gemini Flash',
      tool_analysis: ['market_sentiment', 'technical_analysis', 'volume_profile']
    },
    {
      id: 'trade_002',
      opportunity_id: 'opp_002',
      agent_id: 'arbitrage_bot_003',
      agent_name: 'Arbitrage Scanner',
      symbol: 'ETHUSD',
      side: 'buy',
      quantity: 5.0,
      entry_price: 2289,
      current_price: 2295,
      pnl: 30.0,
      pnl_percent: 0.26,
      confidence: 0.95,
      status: 'executed',
      timestamp: '2025-01-19T14:20:15Z',
      reasoning: 'Cross-exchange arbitrage opportunity with 0.15% spread',
      llm_provider: 'Gemini Flash',
      tool_analysis: ['arbitrage_scanner', 'order_book_analysis', 'execution_cost']
    }
  ])

  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([
    {
      id: 'opp_003',
      symbol: 'SOLUSD',
      strategy_type: 'breakout',
      entry_price: 98.50,
      target_price: 105.00,
      stop_loss: 95.00,
      confidence_score: 0.78,
      risk_reward_ratio: 1.86,
      market_analysis: 'SOL approaching key resistance with increasing volume and bullish MACD crossover',
      timestamp: '2025-01-19T14:25:30Z',
      status: 'analyzed'
    },
    {
      id: 'opp_004',
      symbol: 'ADAUSD',
      strategy_type: 'mean_reversion',
      entry_price: 0.485,
      target_price: 0.520,
      stop_loss: 0.465,
      confidence_score: 0.71,
      risk_reward_ratio: 1.75,
      market_analysis: 'ADA oversold on RSI with support holding at 0.48 level',
      timestamp: '2025-01-19T14:22:45Z',
      status: 'identified'
    }
  ])

  const [metrics, setMetrics] = useState<TradingMetrics>({
    total_opportunities: 127,
    opportunities_traded: 89,
    active_trades: 2,
    total_pnl: 15420.55,
    win_rate: 0.68,
    avg_hold_time: '2.5 hours',
    risk_exposure: 0.65
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update current prices and PnL
      setLiveTrades(trades => trades.map(trade => {
        const priceChange = (Math.random() - 0.5) * 0.02 // ±1% change
        const newPrice = trade.current_price * (1 + priceChange)
        const newPnl = (newPrice - trade.entry_price) * trade.quantity * (trade.side === 'buy' ? 1 : -1)
        const newPnlPercent = (newPnl / (trade.entry_price * trade.quantity)) * 100
        
        return {
          ...trade,
          current_price: newPrice,
          pnl: newPnl,
          pnl_percent: newPnlPercent
        }
      }))
      
      // Update total PnL
      setMetrics(prev => ({
        ...prev,
        total_pnl: prev.total_pnl + (Math.random() - 0.5) * 100
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-500' : 'text-red-500'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500'
    if (confidence >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleEmergencyStop = () => {
    setIsAutonomousEnabled(false)
    // Close all positions
    setLiveTrades(trades => trades.map(trade => ({ ...trade, status: 'closed' as const })))
  }

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="live-trades">Live Trades</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Trading Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Autonomous Trading Status
                  </CardTitle>
                  <CardDescription>
                    Real-time autonomous trading with LLM-powered decision making
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={tradingMode === 'live' ? 'destructive' : 'default'}>
                    {tradingMode.toUpperCase()} MODE
                  </Badge>
                  <Switch 
                    checked={isAutonomousEnabled}
                    onCheckedChange={setIsAutonomousEnabled}
                  />
                  <span className="text-sm font-medium">
                    {isAutonomousEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                    <p className={`text-2xl font-bold ${getPnLColor(metrics.total_pnl)}`}>
                      ${metrics.total_pnl.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.opportunities_traded} trades executed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold">{(metrics.win_rate * 100).toFixed(1)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg hold: {metrics.avg_hold_time}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Trades</p>
                    <p className="text-2xl font-bold">{metrics.active_trades}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.total_opportunities} opportunities scanned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Risk Exposure</p>
                    <p className="text-2xl font-bold">{(metrics.risk_exposure * 100).toFixed(0)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
                <Progress value={metrics.risk_exposure * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Emergency Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Emergency Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  variant="destructive" 
                  onClick={handleEmergencyStop}
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Emergency Stop
                </Button>
                <Button variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Trading
                </Button>
                <Button variant="outline">
                  Close All Positions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Trades Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Active Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liveTrades.filter(trade => trade.status === 'executed').map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {trade.side === 'buy' ? 
                          <TrendingUp className="h-4 w-4 text-green-500" /> : 
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        }
                        <span className="font-medium">{trade.symbol}</span>
                      </div>
                      <Badge variant="outline">{trade.agent_name}</Badge>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getPnLColor(trade.pnl)}`}>
                        ${trade.pnl.toFixed(2)} ({trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {trade.quantity} @ ${trade.current_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live-trades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Trading Positions</CardTitle>
              <CardDescription>Real-time autonomous trading positions with LLM analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {liveTrades.map((trade) => (
                    <Card key={trade.id} className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {trade.side === 'buy' ? 
                              <TrendingUp className="h-5 w-5 text-green-500" /> : 
                              <TrendingDown className="h-5 w-5 text-red-500" />
                            }
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-lg">{trade.symbol}</span>
                                <Badge variant="outline">{trade.agent_name}</Badge>
                                <Badge variant="outline" className="text-xs">
                                  {trade.llm_provider}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatTimestamp(trade.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(trade.status)}
                            <Badge variant={trade.status === 'executed' ? 'default' : 'secondary'}>
                              {trade.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Trade Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Entry Price</p>
                            <p className="font-medium">${trade.entry_price.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Price</p>
                            <p className="font-medium">${trade.current_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Quantity</p>
                            <p className="font-medium">{trade.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Confidence</p>
                            <p className={`font-medium ${getConfidenceColor(trade.confidence)}`}>
                              {(trade.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {/* P&L */}
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Unrealized P&L</span>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getPnLColor(trade.pnl)}`}>
                                ${trade.pnl.toFixed(2)}
                              </p>
                              <p className={`text-sm ${getPnLColor(trade.pnl)}`}>
                                {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* LLM Reasoning */}
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">LLM Reasoning</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{trade.reasoning}</p>
                        </div>

                        {/* Tool Analysis */}
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">MCP Tools Used</span>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {trade.tool_analysis.map((tool, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                          {trade.status === 'executed' && (
                            <Button variant="outline" size="sm">
                              <Square className="h-4 w-4 mr-2" />
                              Close Position
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trading Opportunities</CardTitle>
              <CardDescription>AI-identified trading opportunities awaiting execution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-blue-500" />
                          <div>
                            <span className="font-medium text-lg">{opportunity.symbol}</span>
                            <Badge variant="outline" className="ml-2">
                              {opportunity.strategy_type}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={opportunity.status === 'analyzed' ? 'default' : 'secondary'}>
                          {opportunity.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Entry</p>
                          <p className="font-medium">${opportunity.entry_price}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Target</p>
                          <p className="font-medium text-green-500">${opportunity.target_price}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Stop Loss</p>
                          <p className="font-medium text-red-500">${opportunity.stop_loss}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">R:R Ratio</p>
                          <p className="font-medium">{opportunity.risk_reward_ratio.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Confidence Score</span>
                          <span className={`font-medium ${getConfidenceColor(opportunity.confidence_score)}`}>
                            {(opportunity.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={opportunity.confidence_score * 100} />
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Market Analysis</p>
                        <p className="text-sm text-muted-foreground">{opportunity.market_analysis}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" disabled={opportunity.status === 'executed'}>
                          Execute Trade
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Analyze
                        </Button>
                        <Button variant="outline" size="sm">
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trading Controls</CardTitle>
              <CardDescription>Configure autonomous trading parameters and risk settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trading Mode */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Trading Mode</h4>
                  <p className="text-sm text-muted-foreground">Switch between paper and live trading</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={tradingMode === 'paper' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTradingMode('paper')}
                  >
                    Paper
                  </Button>
                  <Button 
                    variant={tradingMode === 'live' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => setTradingMode('live')}
                  >
                    Live
                  </Button>
                </div>
              </div>

              {/* Autonomous Trading */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Autonomous Trading</h4>
                  <p className="text-sm text-muted-foreground">Enable/disable autonomous decision making</p>
                </div>
                <Switch 
                  checked={isAutonomousEnabled}
                  onCheckedChange={setIsAutonomousEnabled}
                />
              </div>

              {/* Risk Parameters */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-4">Risk Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Max Position Size</label>
                    <p className="text-sm text-muted-foreground">5% of portfolio</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Risk per Trade</label>
                    <p className="text-sm text-muted-foreground">2% of portfolio</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min Confidence</label>
                    <p className="text-sm text-muted-foreground">70%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Concurrent Trades</label>
                    <p className="text-sm text-muted-foreground">10 positions</p>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Advanced Settings</h4>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LiveTradingDashboard