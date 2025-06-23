'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Activity,
  Target,
  Zap,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Play,
  Pause,
  Square,
  Bot,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Database,
  Shield,
  Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Premium components with fallbacks
const PremiumTradingCharts = React.lazy(() => 
  import('@/components/premium-ui/charts/premium-trading-charts').catch(() => ({
    default: () => <Card><CardContent><p>Premium Trading Charts (Enterprise Feature)</p></CardContent></Card>
  }))
)

const AIAgentOrchestration = React.lazy(() => 
  import('@/components/premium-ui/agents/ai-agent-orchestration').catch(() => ({
    default: () => <Card><CardContent><p>AI Agent Orchestration (Premium Feature)</p></CardContent></Card>
  }))
)

const NotificationSystem = React.lazy(() => 
  import('@/components/premium-ui/notifications/notification-system').catch(() => ({
    default: () => <div />
  }))
)

const DashboardGrid = React.lazy(() => 
  import('@/components/premium-ui/layouts/dashboard-grid').catch(() => ({
    default: ({ children }: { children: React.ReactNode }) => <div className="space-y-6">{children}</div>
  }))
)

// Import stores
import {
  usePaperTrading,
  useActivePortfolio,
  usePortfolioPositions,
  useMarketDataForSymbol,
  useOrderBookForSymbol
} from '@/stores/usePaperTrading'
import { useAgentFarm } from '@/stores/useAgentFarm'

// Import types
import {
  PaperPortfolio,
  MarketData,
  OrderBookData,
  DeFiProtocol
} from '@/types/paper-trading.types'

export function PaperTradingDashboard() {
  const {
    portfolios,
    activePortfolio,
    selectedSymbol,
    selectedTimeframe,
    connected,
    isLoading,
    error,
    initializeEngine,
    createPortfolio,
    setSelectedSymbol,
    setSelectedTimeframe,
    placeOrder,
    connect,
    disconnect
  } = usePaperTrading()

  const { farmPerformance, activeAgents } = useAgentFarm()
  const portfolio = useActivePortfolio()
  const positions = usePortfolioPositions(activePortfolio || '')
  const marketData = useMarketDataForSymbol(selectedSymbol)
  const orderBook = useOrderBookForSymbol(selectedSymbol)

  const [layout, setLayout] = useState('default')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)

  useEffect(() => {
    if (!portfolio) {
      initializeEngine({})
      createPortfolio('default_agent', 100000) // $100k virtual capital
    }
  }, [portfolio, initializeEngine, createPortfolio])

  useEffect(() => {
    if (!connected) {
      connect()
    }
  }, [connected, connect])

  // Mock data for demonstration
  const mockOrderBookData = {
    symbol: selectedSymbol,
    bids: Array.from({ length: 10 }, (_, i) => ({
      price: 2000 - i * 5,
      quantity: Math.random() * 10 + 1,
      orders: Math.floor(Math.random() * 5) + 1
    })),
    asks: Array.from({ length: 10 }, (_, i) => ({
      price: 2005 + i * 5,
      quantity: Math.random() * 10 + 1,
      orders: Math.floor(Math.random() * 5) + 1
    })),
    timestamp: new Date()
  }

  const mockRecentTrades = Array.from({ length: 20 }, (_, i) => ({
    id: `trade_${i}`,
    price: 2000 + (Math.random() - 0.5) * 100,
    quantity: Math.random() * 5 + 0.1,
    timestamp: new Date(Date.now() - i * 60000),
    side: Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell'
  }))

  const mockAgents = activeAgents.slice(0, 6).map(agent => ({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.status,
    performance: agent.paperTrading.performanceMetrics.annualizedReturn,
    pnl: Math.random() * 1000 - 500,
    winRate: agent.paperTrading.performanceMetrics.winRate,
    positions: Math.floor(Math.random() * 10) + 1,
    isActive: agent.status === 'paper_trading',
    strategy: 'Momentum Trading',
    riskLevel: Math.floor(Math.random() * 100),
    onToggle: () => {},
    onConfigure: () => {},
    onViewDetails: () => {}
  }))

  // Dashboard layout configuration
  const dashboardLayouts = {
    default: [
      { i: 'chart', x: 0, y: 0, w: 8, h: 8, component: 'chart' },
      { i: 'orderbook', x: 8, y: 0, w: 4, h: 8, component: 'orderbook' },
      { i: 'orderentry', x: 12, y: 0, w: 4, h: 8, component: 'orderentry' },
      { i: 'portfolio', x: 0, y: 8, w: 8, h: 6, component: 'portfolio' },
      { i: 'agents', x: 8, y: 8, w: 8, h: 6, component: 'agents' },
      { i: 'risk', x: 0, y: 14, w: 16, h: 6, component: 'risk' }
    ],
    trading: [
      { i: 'chart', x: 0, y: 0, w: 10, h: 10, component: 'chart' },
      { i: 'orderbook', x: 10, y: 0, w: 3, h: 10, component: 'orderbook' },
      { i: 'orderentry', x: 13, y: 0, w: 3, h: 10, component: 'orderentry' },
      { i: 'portfolio', x: 0, y: 10, w: 16, h: 6, component: 'portfolio' }
    ],
    analytics: [
      { i: 'portfolio', x: 0, y: 0, w: 8, h: 10, component: 'portfolio' },
      { i: 'risk', x: 8, y: 0, w: 8, h: 10, component: 'risk' },
      { i: 'agents', x: 0, y: 10, w: 16, h: 8, component: 'agents' }
    ],
    agents: [
      { i: 'agents', x: 0, y: 0, w: 16, h: 12, component: 'agents' },
      { i: 'portfolio', x: 0, y: 12, w: 8, h: 6, component: 'portfolio' },
      { i: 'chart', x: 8, y: 12, w: 8, h: 6, component: 'chart' }
    ]
  }

  const renderWidget = (componentType: string) => {
    switch (componentType) {
      case 'chart':
        return (
          <div className="h-full">
            <PremiumTradingCharts
              symbol={selectedSymbol}
              timeframe={selectedTimeframe}
              data={[]} // Would be populated with real data
              height={400}
              indicators={['sma', 'rsi', 'macd']}
              onSymbolChange={setSelectedSymbol}
              onTimeframeChange={setSelectedTimeframe}
              className="h-full"
            />
          </div>
        )

      case 'orderbook':
        return (
          <div className="h-full">
            <AdvancedOrderBook
              data={mockOrderBookData}
              recentTrades={mockRecentTrades}
              currentPrice={marketData?.price || 2000}
              onLevelClick={(level) => console.log('Level clicked:', level)}
              onPriceClick={(price) => console.log('Price clicked:', price)}
              className="h-full"
              precision={2}
              maxLevels={20}
              showDepthChart={true}
              showTrades={true}
              showSpread={true}
            />
          </div>
        )

      case 'orderentry':
        return (
          <div className="h-full">
            <AdvancedOrderEntry
              symbol={selectedSymbol}
              currentPrice={marketData?.price || 2000}
              balance={{
                base: portfolio?.virtualBalance || 0,
                quote: positions.reduce((sum, pos) => sum + pos.marketValue, 0)
              }}
              onSubmit={async (order) => {
                console.log('Order submitted:', order)
                if (portfolio) {
                  await placeOrder({
                    ...order,
                    agentId: 'default_agent',
                    portfolioId: portfolio.id,
                    timeInForce: 'gtc'
                  })
                }
              }}
              className="h-full"
              orderTypes={['market', 'limit', 'stop', 'stop_limit']}
              timeInForce={['gtc', 'ioc', 'fok', 'day']}
              showAdvanced={true}
              enableBracketOrders={true}
              enableAlgoOrders={true}
            />
          </div>
        )

      case 'portfolio':
        return (
          <div className="h-full">
            <AdvancedPortfolioAnalytics
              positions={positions.map(pos => ({
                symbol: pos.symbol,
                quantity: pos.quantity,
                avgPrice: pos.averagePrice,
                currentPrice: pos.currentPrice,
                marketValue: pos.marketValue,
                pnl: pos.unrealizedPnL,
                pnlPercent: (pos.unrealizedPnL / (pos.averagePrice * pos.quantity)) * 100,
                allocation: pos.marketValue / (portfolio?.totalValue || 1) * 100,
                risk: Math.random() * 100 // Mock risk score
              }))}
              metrics={{
                totalValue: portfolio?.totalValue || 0,
                dayChange: Math.random() * 1000 - 500,
                dayChangePercent: (Math.random() - 0.5) * 10,
                totalPnL: positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
                totalPnLPercent: Math.random() * 20 - 10,
                sharpeRatio: 1.2 + Math.random() * 0.8,
                maxDrawdown: Math.random() * 15,
                winRate: 55 + Math.random() * 20,
                profitFactor: 1.1 + Math.random() * 0.5
              }}
              riskMetrics={{
                var95: Math.random() * 5000,
                var99: Math.random() * 8000,
                expectedShortfall: Math.random() * 10000,
                sharpeRatio: 1.2 + Math.random() * 0.8,
                sortinoRatio: 1.5 + Math.random() * 0.5,
                maxDrawdown: Math.random() * 15,
                beta: 0.8 + Math.random() * 0.4,
                alpha: Math.random() * 5 - 2.5,
                correlation: Math.random(),
                volatility: Math.random() * 25 + 10
              }}
              historicalData={Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                value: 100000 + (Math.random() - 0.5) * 10000 + i * 100,
                benchmark: 100000 + (Math.random() - 0.5) * 5000 + i * 50
              }))}
              onPositionClick={(position) => console.log('Position clicked:', position)}
              onRiskLimitChange={(limit) => console.log('Risk limit changed:', limit)}
              className="h-full"
            />
          </div>
        )

      case 'agents':
        return (
          <div className="h-full">
            <AIAgentOrchestration
              agents={mockAgents}
              onAgentUpdate={(agent) => console.log('Agent updated:', agent)}
              onAgentAction={(agentId, action) => console.log('Agent action:', agentId, action)}
              onCreateAgent={() => console.log('Create agent')}
              onDeleteAgent={(agentId) => console.log('Delete agent:', agentId)}
              className="h-full"
              maxAgents={20}
              autoScaling={true}
              loadBalancing={true}
            />
          </div>
        )

      case 'risk':
        return (
          <div className="h-full">
            <RiskManagementSuite
              riskLimits={[
                {
                  id: 'position_size',
                  name: 'Position Size Limit',
                  type: 'position',
                  category: 'trading',
                  description: 'Maximum position size per trade',
                  value: 10000,
                  threshold: 15000,
                  unit: 'USD',
                  severity: 'medium',
                  enabled: true,
                  breached: false,
                  lastUpdated: new Date()
                },
                {
                  id: 'portfolio_var',
                  name: 'Portfolio VaR',
                  type: 'market_risk',
                  category: 'portfolio',
                  description: 'Value at Risk (95% confidence)',
                  value: 2500,
                  threshold: 5000,
                  unit: 'USD',
                  severity: 'high',
                  enabled: true,
                  breached: false,
                  lastUpdated: new Date()
                }
              ]}
              complianceRules={[
                {
                  id: 'concentration_limit',
                  name: 'Concentration Limit',
                  description: 'Maximum exposure to single asset',
                  type: 'concentration',
                  category: 'risk_management',
                  threshold: 25,
                  unit: 'percentage',
                  severity: 'high',
                  enabled: true,
                  jurisdiction: 'US',
                  lastReviewed: new Date(),
                  nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                }
              ]}
              alerts={[
                {
                  id: 'alert1',
                  type: 'risk_limit_breach',
                  severity: 'medium',
                  title: 'Position Size Warning',
                  description: 'ETH position approaching size limit',
                  timestamp: new Date(),
                  acknowledged: false,
                  resolved: false,
                  source: 'risk_engine',
                  affectedEntity: 'portfolio_1',
                  recommendedAction: 'Consider reducing position size'
                }
              ]}
              users={[
                {
                  id: 'user1',
                  name: 'Paper Trading Bot',
                  email: 'bot@trading.com',
                  role: 'trader',
                  permissions: ['view_portfolio', 'place_orders'],
                  riskLimits: [
                    {
                      limitId: 'position_size',
                      value: 10000,
                      customThreshold: 12000
                    }
                  ],
                  lastLogin: new Date(),
                  isActive: true,
                  jurisdiction: 'US'
                }
              ]}
              portfolioMetrics={{
                totalValue: portfolio?.totalValue || 0,
                var95: Math.random() * 5000,
                var99: Math.random() * 8000,
                sharpeRatio: 1.2,
                maxDrawdown: 8.5,
                concentration: Math.random() * 30,
                leverage: 1.0
              }}
              onUpdateRiskLimit={(id, updates) => console.log('Risk limit updated:', id, updates)}
              onUpdateComplianceRule={(id, updates) => console.log('Compliance rule updated:', id, updates)}
              onAcknowledgeAlert={(id) => console.log('Alert acknowledged:', id)}
              onResolveAlert={(id) => console.log('Alert resolved:', id)}
              onUpdateUserProfile={(id, updates) => console.log('User updated:', id, updates)}
              className="h-full"
            />
          </div>
        )

      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-500">
            Widget not found: {componentType}
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Database className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Paper Trading Dashboard
                  </h1>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    connected ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">
                    ${portfolio?.totalValue.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    +{((portfolio?.totalValue || 100000) / 100000 * 100 - 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {activeAgents.length} Agents
                  </span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center space-x-3">
              <Select value={layout} onValueChange={setLayout}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="trading">Trading Focus</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="agents">Agent Focus</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Dashboard Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Widgets
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Shield className="h-4 w-4 mr-2" />
                    Risk Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bot className="h-4 w-4 mr-2" />
                    Agent Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Layout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 py-2">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className={cn(
        "transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-900" : "p-6"
      )}>
        <Suspense fallback={<div className="space-y-6 p-6">Loading dashboard...</div>}>
          <DashboardGrid
          layouts={dashboardLayouts[layout as keyof typeof dashboardLayouts]}
          onLayoutChange={(newLayout) => console.log('Layout changed:', newLayout)}
          renderWidget={renderWidget}
          className={cn(
            "min-h-[800px]",
            isFullscreen && "h-screen"
          )}
          editable={true}
          resizable={true}
          draggable={true}
          gridBreakpoints={{
            lg: 1200,
            md: 996,
            sm: 768,
            xs: 480,
            xxs: 0
          }}
          gridCols={{
            lg: 16,
            md: 12,
            sm: 8,
            xs: 4,
            xxs: 2
          }}
        />
        </Suspense>
      </div>

      {/* Notifications */}
      <Suspense fallback={<div />}>
        <NotificationSystem
        notifications={[
          {
            id: 'welcome',
            type: 'info',
            title: 'Paper Trading Active',
            message: 'Your paper trading session is now active with $100,000 virtual capital.',
            timestamp: new Date(),
            read: false,
            category: 'system',
            priority: 'medium',
            actions: []
          }
        ]}
        onMarkAsRead={(id) => console.log('Notification read:', id)}
        onMarkAllAsRead={() => console.log('All notifications read')}
        onDeleteNotification={(id) => console.log('Notification deleted:', id)}
        position="top-right"
        maxVisible={5}
        autoHide={true}
        hideDelay={5000}
        className="z-50"
        enableSound={true}
        enableGrouping={true}
        enableFiltering={true}
      />
      </Suspense>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Loading paper trading engine...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaperTradingDashboard