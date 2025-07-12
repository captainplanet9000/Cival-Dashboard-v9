'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity,
  Bot,
  ArrowUpIcon,
  ArrowDownIcon,
  Clock,
  Target
} from 'lucide-react'
import { backendClient, type PortfolioSummary, type Position, type AgentStatus } from '@/lib/api/backend-client'
import { useEnhancedLiveMarketData, type EnhancedMarketPrice } from '@/lib/market/enhanced-live-market-service'
import { 
  getPersistentMemoryService,
  type AgentDecision,
  type AgentThought,
  type RealTimeMemoryUpdate
} from '@/lib/memory/persistent-memory-service'

export default function PaperTradingDashboard() {
  const [portfolio, setPortfolio] = useState<Position[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [marketSummary, setMarketSummary] = useState<any>(null)
  const [backendConnected, setBackendConnected] = useState(false)
  
  // Live market data
  const { 
    prices: priceData, 
    loading: marketLoading,
    dataQuality: marketDataQuality,
    isLiveData: marketIsLive 
  } = useEnhancedLiveMarketData(['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD'])

  // Memory system state
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([])
  const [agentThoughts, setAgentThoughts] = useState<AgentThought[]>([])
  const [memoryUpdates, setMemoryUpdates] = useState<RealTimeMemoryUpdate[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')

  // Trading form state
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USD')
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState('')
  
  const memoryService = getPersistentMemoryService()
  
  // Available symbols from live market data
  const availableSymbols = priceData.map(p => p.symbol)

  useEffect(() => {
    // Initial data load
    updateAllData()
    initializeMemorySystem()

    // Set up real-time updates every 30 seconds for live trading
    const interval = setInterval(() => {
      updateAllData()
      updateMemoryData()
    }, 30000)

    // Set up memory update listener
    const memoryUpdateHandler = (update: RealTimeMemoryUpdate) => {
      setMemoryUpdates(prev => [update, ...prev.slice(0, 19)]) // Keep last 20 updates
    }

    memoryService.addUpdateListener(memoryUpdateHandler)

    return () => {
      clearInterval(interval)
      memoryService.removeUpdateListener(memoryUpdateHandler)
    }
  }, [])

  const initializeMemorySystem = () => {
    const agentPersonalities = memoryService.getAllAgents()
    if (agentPersonalities.length > 0 && !selectedAgent) {
      setSelectedAgent(agentPersonalities[0].agentId)
    }
  }

  const updateAllData = async () => {
    try {
      // Load live data from backend API
      const [portfolioResponse, agentsResponse, positionsResponse] = await Promise.all([
        backendClient.getPortfolioSummary(),
        backendClient.getAgentsStatus(),
        backendClient.getPositions()
      ])
      
      if (portfolioResponse.success) {
        setPortfolioSummary(portfolioResponse.data)
      }
      
      if (agentsResponse.success) {
        setAgents(agentsResponse.data.agents || [])
      }
      
      if (positionsResponse.success) {
        setPortfolio(positionsResponse.data || [])
      }
      
      // Generate market summary from live price data
      if (priceData.length > 0) {
        const gainers = priceData.filter(p => p.changePercent24h > 0).length
        const losers = priceData.filter(p => p.changePercent24h < 0).length
        const avgChange = priceData.reduce((sum, p) => sum + p.changePercent24h, 0) / priceData.length
        const totalVolume = priceData.reduce((sum, p) => sum + p.volume24h, 0)
        
        setMarketSummary({
          gainers,
          losers,
          neutral: priceData.length - gainers - losers,
          avgChange,
          totalVolume,
          marketTrend: gainers > losers ? 'bullish' : losers > gainers ? 'bearish' : 'neutral'
        })
      }
      
      setBackendConnected(true)
    } catch (error) {
      console.error('Failed to load live data:', error)
      setBackendConnected(false)
    }
  }

  const updateMemoryData = () => {
    if (selectedAgent) {
      const decisions = memoryService.getAgentDecisions(selectedAgent, 5)
      const thoughts = memoryService.getAgentThoughts(selectedAgent, 10)
      setAgentDecisions(decisions)
      setAgentThoughts(thoughts)
    }
  }

  const executeTrade = () => {
    if (!quantity || parseFloat(quantity) <= 0) return

    // Execute paper trade through backend API
    const executePaperTrade = async () => {
      try {
        const order = {
          symbol: selectedSymbol,
          side: tradeType,
          quantity: parseFloat(quantity),
          order_type: 'market' as const
        }
        
        const response = await backendClient.createPaperOrder(order)
        if (response.success) {
          console.log('Paper trade executed:', response.data)
          updateAllData()
        } else {
          console.error('Paper trade failed:', response.message)
        }
      } catch (error) {
        console.error('Error executing paper trade:', error)
      }
    }
    
    executePaperTrade()
    
    // Generate AI agent decision for this trade
    if (selectedAgent) {
      const currentPrice = priceData.find(p => p.symbol === selectedSymbol)
      if (currentPrice) {
        const decision = memoryService.makeAgentDecision(selectedAgent, selectedSymbol, {
          symbol: selectedSymbol,
          price: currentPrice.price,
          changePercent24h: currentPrice.changePercent24h,
          volume24h: currentPrice.volume24h
        })

        // Execute the decision (simulate)
        memoryService.executeDecision(decision.id, currentPrice.price)
        
        // Simulate outcome based on trade result
        setTimeout(() => {
          const outcomePrice = currentPrice.price * (1 + (Math.random() - 0.5) * 0.02) // ±1% price change
          const pnl = (outcomePrice - currentPrice.price) * parseFloat(quantity) * (tradeType === 'buy' ? 1 : -1)
          memoryService.updateDecisionOutcome(decision.id, pnl)
        }, 5000) // Simulate 5-second trade execution
      }
    }
    
    setQuantity('')
    updateAllData()
    updateMemoryData()
  }

  const makeAgentDecision = () => {
    if (!selectedAgent) return

    const currentPrice = priceData.find(p => p.symbol === selectedSymbol)
    if (currentPrice) {
      const decision = memoryService.makeAgentDecision(selectedAgent, selectedSymbol, {
        symbol: selectedSymbol,
        price: currentPrice.price,
        changePercent24h: currentPrice.changePercent24h,
        volume24h: currentPrice.volume24h,
        high24h: currentPrice.high24h,
        low24h: currentPrice.low24h
      })
      
      updateMemoryData()
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Paper Trading Dashboard</h1>
          <p className="text-muted-foreground">Complete simulation environment with real-time mock data</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Activity className="w-4 h-4 mr-1" />
          Live Simulation
        </Badge>
      </div>

      {/* Portfolio Summary Cards */}
      {portfolioSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                {portfolioSummary.positionsCount} positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
              {portfolioSummary.totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioSummary.totalPnL)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercent(portfolioSummary.totalPnLPercent)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.cash)}</div>
              <p className="text-xs text-muted-foreground">
                Ready for trading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.filter(a => a.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">
                of {agents.length} total agents
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Memory Active</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{memoryUpdates.length}</div>
              <p className="text-xs text-muted-foreground">
                Recent memories
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="trading" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="memory">Agent Memory</TabsTrigger>
        </TabsList>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trading Interface */}
            <Card>
              <CardHeader>
                <CardTitle>Execute Trade</CardTitle>
                {selectedAgent && (
                  <p className="text-sm text-muted-foreground">
                    AI Agent: {memoryService.getAgentPersonality(selectedAgent)?.name} is learning from trades
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">AI Agent</label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI Agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {memoryService.getAllAgents().map(agent => (
                        <SelectItem key={agent.agentId} value={agent.agentId}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Symbol</label>
                  <Select value={selectedSymbol} onValueChange={(value) => setSelectedSymbol(value as MockSymbol)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_SYMBOLS.map(symbol => (
                        <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Side</label>
                  <Select value={tradeType} onValueChange={(value) => setTradeType(value as 'buy' | 'sell')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={executeTrade} 
                    className="w-full"
                    disabled={!quantity || parseFloat(quantity) <= 0 || !selectedAgent}
                  >
                    {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedSymbol}
                  </Button>
                  <Button 
                    onClick={makeAgentDecision} 
                    variant="outline"
                    disabled={!selectedAgent}
                  >
                    Ask AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Trades */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trades.slice(0, 8).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-3">
                        {trade.side === 'buy' ? (
                          <ArrowUpIcon className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">{trade.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {trade.quantity.toFixed(4)} @ {formatCurrency(trade.price)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{formatCurrency(trade.quantity * trade.price)}</div>
                        <div className="text-xs text-muted-foreground">
                          {trade.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.map((position) => (
                  <div key={position.symbol} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <div className="font-medium">{position.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {position.quantity.toFixed(4)} units @ {formatCurrency(position.averagePrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(position.marketValue)}</div>
                      <div className={`text-sm ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(position.unrealizedPnL)} ({formatPercent(position.unrealizedPnLPercent)})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Data Tab */}
        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Market Data</CardTitle>
              {marketSummary && (
                <p className="text-sm text-muted-foreground">
                  {marketSummary.gainers} gainers, {marketSummary.losers} losers
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priceData.map((data) => (
                  <div key={data.symbol} className="p-4 border rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{data.symbol}</div>
                      <Badge variant={data.changePercent24h >= 0 ? "default" : "destructive"}>
                        {formatPercent(data.changePercent24h)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">{formatCurrency(data.price)}</div>
                    <div className="text-sm text-muted-foreground">
                      24h: {formatCurrency(data.low24h)} - {formatCurrency(data.high24h)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Agent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.agentId} className="p-4 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {agent.totalTrades} trades • {formatPercent(agent.winRate * 100)} win rate
                          </div>
                        </div>
                        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                          {agent.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total P&L</div>
                          <div className={`font-medium ${agent.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(agent.totalPnL)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Sharpe Ratio</div>
                          <div className="font-medium">{agent.sharpeRatio.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Max Drawdown</div>
                          <div className="font-medium">{formatPercent(-agent.maxDrawdown * 100)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent AI Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentDecisions.slice(0, 5).map((decision) => (
                    <div key={decision.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={
                          decision.decision === 'buy' ? 'default' :
                          decision.decision === 'sell' ? 'destructive' : 'secondary'
                        }>
                          {decision.decision.toUpperCase()} {decision.symbol}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {decision.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Confidence: {(decision.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs">{decision.reasoning}</p>
                      {decision.executed && (
                        <Badge variant="outline" className="mt-2">
                          Executed {decision.outcome?.profitLoss !== undefined ? 
                            `• P&L: ${formatCurrency(decision.outcome.profitLoss)}` : ''}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Thoughts & Reasoning</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Real-time AI agent thought processes
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentThoughts.map((thought) => (
                    <div key={thought.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={
                          thought.thoughtType === 'analysis' ? 'bg-blue-50 text-blue-700' :
                          thought.thoughtType === 'prediction' ? 'bg-purple-50 text-purple-700' :
                          thought.thoughtType === 'reflection' ? 'bg-green-50 text-green-700' :
                          'bg-yellow-50 text-yellow-700'
                        }>
                          {thought.thoughtType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {thought.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{thought.thought}</p>
                      <div className="text-xs text-muted-foreground">
                        <strong>Context:</strong> {thought.context}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong>Confidence:</strong> {(thought.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                  {agentThoughts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Select an agent and make decisions to see thoughts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory System Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Live memory updates and connections
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {memoryUpdates.map((update, index) => (
                    <div key={index} className="p-2 text-xs border rounded">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {update.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-muted-foreground">
                          {update.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Agent: {memoryService.getAgentPersonality(update.agentId)?.name || update.agentId}
                      </div>
                    </div>
                  ))}
                  {memoryUpdates.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent memory activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}