'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, Target, 
  Play, Pause, RefreshCw, PieChart, BarChart3, Zap,
  AlertTriangle, CheckCircle, Clock, Users, Bot,
  ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Import services
import { PaperTradingEngine, type PaperTradeOrder, type AgentAccount, type PortfolioPosition } from '@/lib/paper-trading/PaperTradingEngine'
import { getLLMService } from '@/lib/llm/llm-service'
import { useAGUI } from '@/lib/hooks/useAGUI'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'paused' | 'error'
  llmProvider: string
  llmModel: string
  paperBalance: number
  totalPnl: number
  winRate: number
  tradesCount: number
  riskTolerance: number
  maxPositionSize: number
}

interface PaperTrade {
  id: string
  agentId: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  executedPrice: number
  timestamp: string
  pnl: number
  strategy: string
  reasoning: string
}

export function AgentPaperTradingDashboard() {
  // State
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [account, setAccount] = useState<AgentAccount | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([])
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExecutingTrade, setIsExecutingTrade] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [orderQuantity, setOrderQuantity] = useState('10')
  const [activeTab, setActiveTab] = useState('overview')

  // AG-UI for real-time updates
  const { 
    sendAgentDecision, 
    sendPortfolioUpdate,
    executeAgentCommand,
    isConnected 
  } = useAGUI({
    channels: ['agents', 'trading', 'portfolio'],
    onAgentDecision: (data) => {
      if (data.actionTaken && data.agentId === selectedAgent?.id) {
        fetchAgentData(selectedAgent.id)
      }
    }
  })

  // Available symbols for trading
  const symbols = ['BTC', 'ETH', 'SOL', 'AAPL', 'GOOGL', 'TSLA', 'SPY', 'QQQ']

  // Mock agents data
  useEffect(() => {
    const mockAgents: Agent[] = [
      {
        id: 'agent_001',
        name: 'Alpha Trader',
        type: 'momentum',
        status: 'active',
        llmProvider: 'openai-gpt4',
        llmModel: 'gpt-4-turbo-preview',
        paperBalance: 100.00,
        totalPnl: 15.45,
        winRate: 0.68,
        tradesCount: 23,
        riskTolerance: 0.7,
        maxPositionSize: 20.0
      },
      {
        id: 'agent_002',
        name: 'Risk Guardian',
        type: 'risk_manager',
        status: 'active',
        llmProvider: 'claude-3.5-sonnet',
        llmModel: 'claude-3-5-sonnet-20241022',
        paperBalance: 100.00,
        totalPnl: 8.23,
        winRate: 0.85,
        tradesCount: 12,
        riskTolerance: 0.3,
        maxPositionSize: 10.0
      },
      {
        id: 'agent_003',
        name: 'Swing Master',
        type: 'swing_trader',
        status: 'paused',
        llmProvider: 'openrouter-claude',
        llmModel: 'anthropic/claude-3.5-sonnet',
        paperBalance: 100.00,
        totalPnl: -2.15,
        winRate: 0.45,
        tradesCount: 8,
        riskTolerance: 0.5,
        maxPositionSize: 15.0
      }
    ]

    setAgents(mockAgents)
    setSelectedAgent(mockAgents[0])
    setIsLoading(false)
  }, [])

  // Fetch agent trading data
  const fetchAgentData = useCallback(async (agentId: string) => {
    if (!agentId) return

    try {
      const engine = new PaperTradingEngine(agentId)
      
      // Get or create paper trading account
      const agentAccount = await engine.initializeAccount('Primary Account', 100.00)
      setAccount(agentAccount)

      // Get portfolio positions
      const agentPortfolio = await engine.getPortfolio(agentAccount.id)
      setPortfolio(agentPortfolio)

      // Get trade history
      const tradeHistory = await engine.getTradeHistory(agentAccount.id, 50)
      setTrades(tradeHistory.map(trade => ({
        id: trade.id,
        agentId: trade.agent_id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        executedPrice: trade.executed_price,
        timestamp: trade.created_at,
        pnl: trade.pnl,
        strategy: trade.strategy,
        reasoning: trade.reasoning
      })))

    } catch (error) {
      console.error('Failed to fetch agent data:', error)
      toast.error('Failed to load agent trading data')
    }
  }, [])

  // Load data when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      fetchAgentData(selectedAgent.id)
    }
  }, [selectedAgent, fetchAgentData])

  // Execute manual trade
  const executeTrade = useCallback(async () => {
    if (!selectedAgent || !account) return

    setIsExecutingTrade(true)
    try {
      const engine = new PaperTradingEngine(selectedAgent.id)
      
      const order: PaperTradeOrder = {
        agentId: selectedAgent.id,
        accountId: account.id,
        symbol: selectedSymbol,
        side: orderSide,
        orderType: 'market',
        quantity: parseFloat(orderQuantity),
        price: 0, // Market order
        strategy: 'manual',
        reasoning: `Manual ${orderSide} order for ${orderQuantity} ${selectedSymbol}`
      }

      const tradeId = await engine.placeOrder(order)
      
      toast.success(`Trade executed successfully! ID: ${tradeId}`)
      
      // Send AG-UI update
      sendAgentDecision(selectedAgent.id, {
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        decisionType: 'trade',
        symbol: selectedSymbol,
        reasoning: order.reasoning,
        confidenceScore: 0.9,
        marketData: { orderType: 'market', side: orderSide },
        actionTaken: true,
        result: { tradeId, executedQuantity: order.quantity }
      })

      // Refresh data
      await fetchAgentData(selectedAgent.id)
      
    } catch (error: any) {
      console.error('Trade execution failed:', error)
      toast.error(error.message || 'Trade execution failed')
    } finally {
      setIsExecutingTrade(false)
    }
  }, [selectedAgent, account, selectedSymbol, orderSide, orderQuantity, sendAgentDecision, fetchAgentData])

  // Trigger AI agent decision
  const triggerAgentDecision = useCallback(async () => {
    if (!selectedAgent || !account) return

    try {
      const llmService = getLLMService()
      
      // Mock market data for demonstration
      const marketData = {
        [selectedSymbol]: {
          price: Math.random() * 50000 + 20000,
          volume: Math.random() * 1000000,
          change: (Math.random() - 0.5) * 10,
          volatility: Math.random() * 0.05
        }
      }

      const portfolioStatus = {
        totalValue: account.currentBalance,
        positions: portfolio.length,
        availableBalance: account.currentBalance,
        totalPnl: account.totalPnl
      }

      const request = {
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        agentType: selectedAgent.type,
        personality: {
          riskTolerance: selectedAgent.riskTolerance,
          maxPositionSize: selectedAgent.maxPositionSize,
          tradingStyle: selectedAgent.type
        },
        marketData,
        portfolioStatus,
        riskLimits: {
          maxDrawdown: 0.1,
          maxPositionSize: selectedAgent.maxPositionSize / 100,
          riskPerTrade: 0.02
        },
        context: `Analyze current market conditions for ${selectedSymbol} and decide on trading action.`,
        availableFunctions: ['place_order', 'cancel_order', 'get_market_data', 'check_portfolio']
      }

      const decision = await llmService.generateAgentDecision(selectedAgent.llmProvider, request)
      
      // Log the decision
      sendAgentDecision(selectedAgent.id, {
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        decisionType: decision.decisionType,
        symbol: decision.symbol,
        reasoning: decision.reasoning,
        confidenceScore: decision.confidence,
        marketData: { marketAnalysis: decision.marketAnalysis },
        actionTaken: false
      })

      // Execute trade if decision is to trade
      if (decision.decisionType === 'trade' && decision.action && decision.symbol && decision.quantity) {
        const engine = new PaperTradingEngine(selectedAgent.id)
        
        const order: PaperTradeOrder = {
          agentId: selectedAgent.id,
          accountId: account.id,
          symbol: decision.symbol,
          side: decision.action,
          orderType: 'market',
          quantity: decision.quantity,
          price: decision.price || 0,
          strategy: 'ai_decision',
          reasoning: decision.reasoning
        }

        const tradeId = await engine.placeOrder(order)
        
        // Update decision with execution result
        sendAgentDecision(selectedAgent.id, {
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          decisionType: 'trade',
          symbol: decision.symbol,
          reasoning: decision.reasoning,
          confidenceScore: decision.confidence,
          marketData: { aiDecision: decision },
          actionTaken: true,
          result: { tradeId, aiReasoning: decision.reasoning }
        })

        toast.success(`AI Agent executed ${decision.action} ${decision.symbol}!`)
      } else {
        toast.info(`AI Agent decided to ${decision.decisionType}: ${decision.reasoning}`)
      }

      // Refresh data
      await fetchAgentData(selectedAgent.id)

    } catch (error: any) {
      console.error('AI decision failed:', error)
      toast.error(error.message || 'AI decision execution failed')
    }
  }, [selectedAgent, account, portfolio, selectedSymbol, sendAgentDecision, fetchAgentData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Paper Trading Dashboard
          </CardTitle>
          <CardDescription>
            AI agents practicing with $100 virtual capital each
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="agent-select">Select Agent:</Label>
            <Select value={selectedAgent?.id || ''} onValueChange={(value) => {
              const agent = agents.find(a => a.id === value)
              setSelectedAgent(agent || null)
            }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                      {agent.name} ({agent.type})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                AG-UI {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button onClick={() => selectedAgent && fetchAgentData(selectedAgent.id)} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAgent && account && (
        <>
          {/* Agent Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Account Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(account.currentBalance)}</div>
                <p className="text-xs text-muted-foreground">
                  Started with {formatCurrency(account.initialBalance)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${account.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(account.totalPnl)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPercent((account.totalPnl / account.initialBalance) * 100)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(account.winningTrades / Math.max(account.totalTrades, 1))}</div>
                <p className="text-xs text-muted-foreground">
                  {account.winningTrades}W / {account.losingTrades}L
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{account.totalTrades}</div>
                <p className="text-xs text-muted-foreground">
                  Sharpe: {account.sharpeRatio.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trading Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trading">Manual Trading</TabsTrigger>
              <TabsTrigger value="ai">AI Trading</TabsTrigger>
              <TabsTrigger value="history">Trade History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Portfolio Positions */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolio.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No positions</p>
                  ) : (
                    <div className="space-y-2">
                      {portfolio.map((position, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <div className="font-medium">{position.symbol}</div>
                            <div className="text-sm text-muted-foreground">
                              {position.quantity} @ {formatCurrency(position.avgPrice)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(position.marketValue)}</div>
                            <div className={`text-sm ${position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(position.unrealizedPnl)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trading" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Trade Execution</CardTitle>
                  <CardDescription>
                    Place manual trades for testing and demonstration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="symbol">Symbol</Label>
                      <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {symbols.map(symbol => (
                            <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="side">Side</Label>
                      <Select value={orderSide} onValueChange={(value: 'buy' | 'sell') => setOrderSide(value)}>
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
                      <Label htmlFor="quantity">Quantity ($)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(e.target.value)}
                        placeholder="10.00"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button 
                        onClick={executeTrade}
                        disabled={isExecutingTrade}
                        variant={orderSide === 'buy' ? 'buy' : 'sell'}
                        className="w-full"
                      >
                        {isExecutingTrade ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : orderSide === 'buy' ? (
                          <TrendingUp className="h-4 w-4 mr-2" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-2" />
                        )}
                        {orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedSymbol}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI Agent Decision</CardTitle>
                  <CardDescription>
                    Let the AI agent analyze market conditions and make trading decisions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Bot className="h-4 w-4" />
                    <AlertDescription>
                      Agent {selectedAgent.name} is using {selectedAgent.llmProvider} for decision making
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center gap-4">
                    <Button onClick={triggerAgentDecision} variant="agent" size="lg">
                      <Zap className="h-4 w-4 mr-2" />
                      Trigger AI Decision
                    </Button>
                    
                    <div>
                      <Label htmlFor="ai-symbol">Focus Symbol</Label>
                      <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {symbols.map(symbol => (
                            <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trade History</CardTitle>
                  <CardDescription>
                    Recent trades executed by {selectedAgent.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trades.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No trades yet</p>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {trades.map((trade) => (
                          <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                                {trade.side === 'buy' ? (
                                  <ArrowUpRight className="h-3 w-3 mr-1" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3 mr-1" />
                                )}
                                {trade.side.toUpperCase()}
                              </Badge>
                              <div>
                                <div className="font-medium">{trade.symbol}</div>
                                <div className="text-sm text-muted-foreground">
                                  {trade.quantity} @ {formatCurrency(trade.executedPrice)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(trade.pnl)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(new Date(trade.timestamp))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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

export default AgentPaperTradingDashboard