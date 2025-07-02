/**
 * Modern Trading Dashboard V4
 * Based on Cival-Dashboard-v4 final working design
 * Emerald/Violet/Amber color scheme with minimal mock data
 */

'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity, TrendingUp, TrendingDown, DollarSign, Bot, Shield, Zap,
  Target, BarChart3, RefreshCw, Bell, Users, Calendar, Wallet, PieChart,
  Plus, Menu, X, Star, Clock, Settings, ArrowUpRight, ArrowDownRight, Search, Brain, Coins
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Import existing components and hooks
import { backendApi } from '@/lib/api/backend-client'
import { ExpertAgentsPanel } from '@/components/agent-trading/ExpertAgentsPanel'

// Import real trading components for functionality
import { LiveMarketTicker } from '@/components/realtime/LiveMarketTicker'
import { PortfolioMonitor } from '@/components/trading/PortfolioMonitor'
import { AgentManager } from '@/components/trading/AgentManager'
import { RiskDashboard } from '@/components/trading/RiskDashboard'
import { TradingInterface } from '@/components/trading/TradingInterface'

// Import additional agent components
import { AgentTradingList } from '@/components/agent-trading/AgentTradingList'
import { AgentDataBrowser } from '@/components/agent/AgentDataBrowser'
import AgentKnowledgeInterface from '@/components/knowledge/AgentKnowledgeInterface'
import { StrategyCreationModal } from '@/components/trading/strategies/StrategyCreationModal'

// Import additional page components for consolidated tabs
// Using dynamic imports to prevent auto-loading issues
import dynamic from 'next/dynamic'

// Import simpler components without WebSocket dependencies
import SimpleAnalytics from '../SimpleAnalytics'

// Import missing UI components for forms
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Import our live agent data hooks
import { useAgentData } from '@/hooks/useAgentData'
import { agentWalletManager } from '@/lib/agents/agent-wallet-manager'
import { Switch } from '@/components/ui/switch'

// Import Redis & Supabase real-time hooks
import { useRedisRealtime } from '@/hooks/use-redis-realtime'
import { useSupabaseRealtime } from '@/hooks/use-supabase-realtime'

// Import new ShadCN migration components
import TradingCharts from './TradingCharts'
import AdvancedAnalytics from './AdvancedAnalytics'
import { AnimatedMetrics } from '@/components/motion/animated-metrics'
import { TradingForm } from '@/components/forms/trading-form'
import { CommandPalette } from '@/components/expansions/command-palette'
import { TradingDataTable } from '@/components/expansions/trading-data-table'

// Import AG-UI infrastructure
import { AGUIProvider } from '@/components/ag-ui/fallback'

// Import Real Trading Components
import RealAgentCreation from '@/components/agents/RealAgentCreation'
import RealAgentManagement from '@/components/agents/RealAgentManagement'
import RealTradingInterface from '@/components/trading/RealTradingInterface'
import RealAnalyticsDashboard from '@/components/analytics/RealAnalyticsDashboard'
import RealRiskManagementDashboard from '@/components/risk/RealRiskManagementDashboard'
import RealPortfolioAnalyticsDashboard from '@/components/portfolio/RealPortfolioAnalyticsDashboard'
import RealMarketDataDashboard from '@/components/market/RealMarketDataDashboard'
import RealNotificationSystem from '@/components/notifications/RealNotificationSystem'
import RealBacktestingDashboard from '@/components/backtesting/RealBacktestingDashboard'
import RealTimeDashboard from '@/components/dashboard/RealTimeDashboard'
import LiveDashboardOrchestrator from '@/components/realtime/LiveDashboardOrchestrator'

// Import Unified AI Assistant
import UnifiedAIAssistant from '@/components/ai-assistant/UnifiedAIAssistant'

// Import Connected Dashboard Components
import ConnectedOverviewTab from '@/components/dashboard/ConnectedOverviewTab'
import ConnectedTradingTab from '@/components/dashboard/ConnectedTradingTab'
import ConnectedAgentsTab from '@/components/dashboard/ConnectedAgentsTab'
import ConnectedHistoryTab from '@/components/dashboard/ConnectedHistoryTab'
import ConnectedAnalyticsTab from '@/components/dashboard/ConnectedAnalyticsTab'
import ConnectedFarmsTab from '@/components/dashboard/ConnectedFarmsTab'
import ConnectedGoalsTab from '@/components/dashboard/ConnectedGoalsTab'
import ConnectedVaultTab from '@/components/dashboard/ConnectedVaultTab'
import ConnectedCalendarTab from '@/components/dashboard/ConnectedCalendarTab'
import ConnectedAdvancedTab from '@/components/dashboard/ConnectedAdvancedTab'

// Import Premium Components
// import AutonomousTradingDashboard from '@/components/autonomous/AutonomousTradingDashboard' // Removed autonomous tab
import DeFiIntegrationHub from '@/components/defi/DeFiIntegrationHub'

const FarmsPage = dynamic(() => import('@/app/dashboard/farms/page'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Farms...</div>
})
const GoalsPage = dynamic(() => import('@/app/dashboard/goals/page'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Goals...</div>
})
const VaultPage = dynamic(() => import('@/app/dashboard/vault/page'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Vault...</div>
})
const DeFiLendingPage = dynamic(() => import('@/app/dashboard/defi-lending/page'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading DeFi Lending...</div>
})
const CalendarPage = dynamic(() => import('@/app/calendar/page'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Calendar...</div>
})
const ComprehensiveAnalyticsPage = dynamic(() => import('@/app/dashboard/comprehensive-analytics/page'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Analytics...</div>
})
const KnowledgeGraphPage = dynamic(() => import('@/app/dashboard/knowledge-graph/page'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Knowledge Graph...</div>
})
const PersistencePage = dynamic(() => import('@/app/dashboard/persistence/page'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Persistence...</div>
})
const PythonAnalysisPage = dynamic(() => import('@/app/dashboard/python-analysis/page'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Python Analysis...</div>
})

// Import advanced feature components
const FlashLoanView = dynamic(() => import('@/components/dashboard/FlashLoanView'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading FlashLoan...</div>
})
const HyperLendView = dynamic(() => import('@/components/dashboard/HyperLendView'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading HyperLend...</div>
})
const MultiChainWalletView = dynamic(() => import('@/components/dashboard/MultiChainWalletView'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Multi-Chain Wallets...</div>
})
const WatchlistView = dynamic(() => import('@/components/dashboard/WatchlistView'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Watchlist...</div>
})
const AnalyticsView = dynamic(() => import('@/components/dashboard/AnalyticsView'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Analytics...</div>
})
const AgentPaperTradingDashboard = dynamic(() => import('@/components/agent-trading/AgentPaperTradingDashboard'), { 
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading Paper Trading...</div>
})

interface DashboardMetrics {
  totalValue: number
  dailyPnL: number
  totalPnL: number
  activePositions: number
  activeAgents: number
  activeFarms: number
  winRate: number
  avgReturn: number
  riskScore: number
}

interface ChartDataPoint {
  time: string
  value: number
  pnl: number
}

interface DashboardTab {
  id: string
  label: string
  icon: React.ReactNode
  component: React.ReactNode
}

// Mock chart data for portfolio performance
const generateChartData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = []
  const now = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const baseValue = 125000
    const variation = Math.sin(i * 0.1) * 5000 + Math.random() * 2000
    
    data.push({
      time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: baseValue + variation,
      pnl: variation * 0.1
    })
  }
  
  return data
}

export function ModernDashboardV4() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [chartData] = useState<ChartDataPoint[]>(generateChartData())
  
  // Use live agent data
  const { agents, loading: agentsLoading } = useAgentData()
  
  // Redis & Supabase real-time connections
  const { data: redisData, connected: redisConnected } = useRedisRealtime(['portfolio', 'agents', 'trades'])
  const { data: supabaseData, connected: supabaseConnected } = useSupabaseRealtime('trading')
  
  // Calculate live metrics from agent data
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalValue: 125847.32,
    dailyPnL: 2847.32,
    totalPnL: 25847.32,
    activePositions: 8,
    activeAgents: 5,
    activeFarms: 3,
    winRate: 78.4,
    avgReturn: 15.2,
    riskScore: 23.5
  })

  // Update metrics with live agent data
  useEffect(() => {
    if (!agentsLoading && agents.length > 0) {
      const totalPortfolioValue = agents.reduce((sum, agent) => sum + (agent.wallet?.totalValue || 0), 0)
      const totalPnL = agents.reduce((sum, agent) => 
        sum + (agent.wallet ? agent.wallet.realizedPnL + agent.wallet.unrealizedPnL : 0), 0)
      const activeAgentCount = agents.filter(agent => agent.isActive).length
      const totalPositions = agents.reduce((sum, agent) => sum + (agent.wallet?.positions.length || 0), 0)
      const totalDecisions = agents.reduce((sum, agent) => sum + agent.performance.totalDecisions, 0)
      const successfulDecisions = agents.reduce((sum, agent) => sum + agent.performance.successfulDecisions, 0)
      const winRate = totalDecisions > 0 ? (successfulDecisions / totalDecisions) * 100 : 0

      setMetrics(prev => ({
        ...prev,
        totalValue: totalPortfolioValue,
        totalPnL: totalPnL,
        dailyPnL: totalPnL * 0.1, // Estimate daily PnL
        activeAgents: activeAgentCount,
        activePositions: totalPositions,
        winRate: winRate,
        activeFarms: Math.ceil(activeAgentCount / 2) // Estimate farms
      }))
    }
  }, [agents, agentsLoading])

  // Quick loading - no external dependencies
  useEffect(() => {
    // Immediately set loading to false - no backend dependencies
    setIsLoading(false)
  }, [])

  // Flat navigation - all tabs in one row as requested
  const tabs: DashboardTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="h-4 w-4" />,
      component: <OverviewTab 
        metrics={metrics} 
        chartData={chartData} 
        redisData={redisData}
        supabaseData={supabaseData}
        redisConnected={redisConnected}
        supabaseConnected={supabaseConnected}
      />
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: <Bot className="h-4 w-4" />,
      component: <ConnectedAgentsTab />
    },
    {
      id: 'farms',
      label: 'Farms',
      icon: <Target className="h-4 w-4" />,
      component: <ConnectedFarmsTab />
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: <Star className="h-4 w-4" />,
      component: <ConnectedGoalsTab />
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: <Brain className="h-4 w-4" />,
      component: <UnifiedAIAssistant />
    },
    {
      id: 'trading',
      label: 'Trading',
      icon: <TrendingUp className="h-4 w-4" />,
      component: <ConnectedTradingTab />
    },
    // Removed autonomous tab
    // {
    //   id: 'autonomous',
    //   label: 'Autonomous',
    //   icon: <Zap className="h-4 w-4" />,
    //   component: <AutonomousTradingDashboard />
    // },
    {
      id: 'defi',
      label: 'DeFi',
      icon: <Coins className="h-4 w-4" />,
      component: <DeFiIntegrationHub />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <PieChart className="h-4 w-4" />,
      component: <ConnectedAnalyticsTab />
    },
    {
      id: 'history',
      label: 'History',
      icon: <Activity className="h-4 w-4" />,
      component: <ConnectedHistoryTab />
    },
    {
      id: 'vault',
      label: 'Vault',
      icon: <Wallet className="h-4 w-4" />,
      component: <ConnectedVaultTab />
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="h-4 w-4" />,
      component: <ConnectedCalendarTab />
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: <Settings className="h-4 w-4" />,
      component: <ConnectedAdvancedTab />
    }
  ]

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <AGUIProvider>
      <div className="dashboard-dark">
        {/* Main Content - Full Width */}
        <main className="w-full min-h-screen bg-background">
          {/* Header */}
          <header className="dashboard-header border-b">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">
                    Cival Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-secondary hidden sm:block">Advanced AI Trading Platform</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="badge-success-dark hidden sm:flex">
                  Live
                </div>
                {/* Redis & Supabase Connection Status */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    redisConnected ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${redisConnected ? 'bg-red-500' : 'bg-gray-400'}`} />
                    Redis
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    supabaseConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                    Supabase
                  </div>
                </div>
                <button 
                  className="btn-secondary-dark hidden lg:flex"
                  onClick={() => setCommandPaletteOpen(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </button>
                <button className="btn-secondary-dark hidden md:flex">
                  <Bell className="h-4 w-4 mr-2" />
                  Alerts
                </button>
                <ThemeToggle />
                <button className="btn-ghost-dark">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="dashboard-content">
            {/* Mobile-Optimized Navigation Tabs */}
            <div className="bg-card border-b sticky top-0 z-10">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-primary text-primary bg-primary/5' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden xs:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              {tabs.find(tab => tab.id === activeTab)?.component}
            </div>
          </div>
        </main>
      </div>

        {/* Command Palette */}
        <CommandPalette 
          open={commandPaletteOpen} 
          onOpenChange={setCommandPaletteOpen} 
        />
      </AGUIProvider>
    )
}

// Enhanced Overview Tab with Real Trading Functionality
function OverviewTab({ metrics, chartData, redisData, supabaseData, redisConnected, supabaseConnected }: { 
  metrics: DashboardMetrics; 
  chartData: ChartDataPoint[];
  redisData?: any;
  supabaseData?: any;
  redisConnected: boolean;
  supabaseConnected: boolean;
}) {
  const [overviewTab, setOverviewTab] = useState('dashboard')
  
  const overviewSubTabs = [
    { id: 'dashboard', label: 'Live Dashboard', component: <LiveDashboardOrchestrator /> },
    { id: 'realtime', label: 'Real-Time', component: <RealTimeDashboard /> },
    { id: 'portfolio', label: 'Portfolio', component: <RealPortfolioAnalyticsDashboard /> },
    { id: 'trading', label: 'Trading', component: <RealTradingInterface /> },
    { id: 'agents', label: 'Agent Manager', component: <RealAgentManagement /> },
    { id: 'risk', label: 'Risk Monitor', component: <RealRiskManagementDashboard /> }
  ]
  
  return (
    <div className="space-y-6">
      {/* Redis & Supabase Real-time Connections */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Data Connections
          </CardTitle>
          <CardDescription>Live connections to Redis cache and Supabase database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Redis Connection */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${redisConnected ? 'bg-red-500' : 'bg-gray-400'}`} />
                <div>
                  <h4 className="font-medium text-red-900">Redis Cache</h4>
                  <p className="text-sm text-red-700">
                    {redisConnected ? 'Connected - Streaming live data' : 'Offline - Using mock data'}
                  </p>
                </div>
              </div>
              <Badge variant={redisConnected ? 'default' : 'secondary'}>
                {redisData ? Object.keys(redisData).length : 0} keys
              </Badge>
            </div>
            
            {/* Supabase Connection */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${supabaseConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div>
                  <h4 className="font-medium text-green-900">Supabase Database</h4>
                  <p className="text-sm text-green-700">
                    {supabaseConnected ? 'Connected - Real-time sync active' : 'Offline - Using mock data'}
                  </p>
                </div>
              </div>
              <Badge variant={supabaseConnected ? 'default' : 'secondary'}>
                {supabaseData ? Object.keys(supabaseData).length : 0} tables
              </Badge>
            </div>
          </div>
          
          {/* Live Data Preview */}
          {(redisData || supabaseData) && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Live Data Stream</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {redisData && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h5 className="text-sm font-medium text-red-700 mb-2">Redis Data</h5>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                      {JSON.stringify(redisData, null, 2)}
                    </pre>
                  </div>
                )}
                {supabaseData && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h5 className="text-sm font-medium text-green-700 mb-2">Supabase Data</h5>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                      {JSON.stringify(supabaseData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Market Ticker */}
      <Card className="modern-card">
        <CardContent className="p-4">
          <LiveMarketTicker />
        </CardContent>
      </Card>

      {/* Overview Sub-Navigation */}
      <Tabs value={overviewTab} onValueChange={setOverviewTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-emerald-50 gap-2">
          {overviewSubTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 text-xs sm:text-sm p-2 truncate"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {overviewSubTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// Modern Metric Card Component
function ModernMetricCard({ 
  title, 
  value, 
  change, 
  changePercent, 
  isPositive, 
  icon 
}: { 
  title: string; 
  value: string; 
  change: string; 
  changePercent?: string; 
  isPositive: boolean; 
  icon: React.ReactNode; 
}) {
  return (
    <div className="metric-card-dark">
      <div className="flex items-start justify-between mb-3">
        <div className="metric-title-dark">{title}</div>
        <div className="text-primary">
          {icon}
        </div>
      </div>
      <div className="metric-value-dark">{value}</div>
      <div className={`metric-change-dark ${isPositive ? 'positive' : 'negative'}`}>
        {change} {changePercent && <span className="ml-1">{changePercent}</span>}
      </div>
    </div>
  )
}

// Dashboard Overview Component (existing functionality)
function DashboardOverview({ metrics, chartData }: { metrics: DashboardMetrics; chartData: ChartDataPoint[] }) {
  return (
    <div className="space-y-6">
      {/* Real-time Market Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealMarketDataDashboard />
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              Live Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealNotificationSystem />
          </CardContent>
        </Card>
      </div>

      {/* Animated Metrics */}
      <AnimatedMetrics className="mb-6" />
      
      {/* Key Metrics Cards */}
      <div className="grid-responsive">
        <ModernMetricCard
          title="Total Portfolio"
          value={`$${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={`+${metrics.dailyPnL.toFixed(2)}`}
          changePercent="+2.34%"
          isPositive={metrics.dailyPnL > 0}
          icon={<DollarSign className="h-5 w-5" />}
        />
        
        <ModernMetricCard
          title="Active Agents"
          value={metrics.activeAgents.toString()}
          change="Expert Agents"
          isPositive={true}
          icon={<Bot className="h-5 w-5" />}
        />
        
        <ModernMetricCard
          title="Win Rate"
          value={`${metrics.winRate}%`}
          change="Last 30 days"
          isPositive={metrics.winRate > 70}
          icon={<Target className="h-5 w-5" />}
        />
        
        <ModernMetricCard
          title="Risk Score"
          value={`${metrics.riskScore}%`}
          change="Low Risk"
          isPositive={metrics.riskScore < 30}
          icon={<Shield className="h-5 w-5" />}
        />
      </div>

      {/* Performance Chart */}
      <div className="chart-container-dark">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-success">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-primary">
            Portfolio Performance
          </h3>
        </div>
        <p className="text-sm mb-4 text-secondary">30-day portfolio value and P&L trend</p>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F1F1F',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                  color: '#F9FAFB'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used trading operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white w-full">
              <Plus className="h-4 w-4 mr-2" />
              <span className="truncate">New Strategy</span>
            </Button>
            <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50 w-full">
              <Bot className="h-4 w-4 mr-2" />
              <span className="truncate">Deploy Agent</span>
            </Button>
            <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 w-full">
              <Target className="h-4 w-4 mr-2" />
              <span className="truncate">Create Farm</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component with v4 gradients
function MetricCard({ 
  title, 
  value, 
  change, 
  changePercent, 
  isPositive, 
  icon, 
  gradient 
}: {
  title: string
  value: string
  change: string
  changePercent?: string
  isPositive: boolean
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <Card className="modern-card hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium modern-text-secondary">{title}</p>
            <p className="text-2xl font-bold modern-text-primary">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-rose-600" />
              )}
              <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {change}
              </span>
              {changePercent && (
                <span className={`text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {changePercent}
                </span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-r ${gradient} text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Portfolio Tab Component
function PortfolioTab() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>Detailed portfolio analysis and positions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Portfolio Management</h3>
          <p className="text-gray-600 mt-2">Comprehensive portfolio tracking will be displayed here</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Agent Overview Panel - Stable replacement for ExpertAgentsPanel
function AgentOverviewPanel() {
  const [selectedAgent, setSelectedAgent] = useState(null)
  const agents = [
    { 
      id: 1, 
      name: 'Darvas Box Master', 
      status: 'active', 
      profit: 1247.30, 
      trades: 24, 
      winRate: 78.5,
      conversations: 127,
      toolCalls: 342,
      memory: '2.4MB',
      strategy: 'Darvas Box Breakout',
      lastTrade: '2 hours ago',
      riskLevel: 'Medium'
    },
    { 
      id: 2, 
      name: 'Elliott Wave Analyst', 
      status: 'active', 
      profit: 890.50, 
      trades: 18, 
      winRate: 72.2,
      conversations: 98,
      toolCalls: 267,
      memory: '1.8MB',
      strategy: 'Elliott Wave Pattern',
      lastTrade: '1 hour ago',
      riskLevel: 'Low'
    },
    { 
      id: 3, 
      name: 'Momentum Trader', 
      status: 'paused', 
      profit: 2150.75, 
      trades: 31, 
      winRate: 83.9,
      conversations: 156,
      toolCalls: 445,
      memory: '3.1MB',
      strategy: 'Momentum Following',
      lastTrade: '6 hours ago',
      riskLevel: 'High'
    },
    { 
      id: 4, 
      name: 'Arbitrage Hunter', 
      status: 'active', 
      profit: 567.20, 
      trades: 12, 
      winRate: 91.7,
      conversations: 67,
      toolCalls: 189,
      memory: '1.2MB',
      strategy: 'Cross-Exchange Arbitrage',
      lastTrade: '30 minutes ago',
      riskLevel: 'Low'
    },
    { 
      id: 5, 
      name: 'Risk Manager', 
      status: 'active', 
      profit: 334.80, 
      trades: 8, 
      winRate: 62.5,
      conversations: 45,
      toolCalls: 123,
      memory: '0.9MB',
      strategy: 'Portfolio Protection',
      lastTrade: '4 hours ago',
      riskLevel: 'Very Low'
    }
  ]
  
  return (
    <div className="space-y-6 card-light-content">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Expert Trading Agents</h3>
        <p className="text-sm text-gray-600">AI-powered trading agents with specialized strategies</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="modern-card card-light-content">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">{agent.name}</CardTitle>
                  <CardDescription className="text-gray-600">Strategy Agent #{agent.id}</CardDescription>
                </div>
                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="badge-readable">
                  {agent.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Profit:</span>
                    <span className="ml-1 font-medium text-emerald-600">+${agent.profit}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Trades:</span>
                    <span className="ml-1 font-medium text-gray-900">{agent.trades}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-medium text-gray-900">{agent.winRate}%</span>
                  </div>
                  <Progress value={agent.winRate} className="h-2" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedAgent(agent)}>
                    Details
                  </Button>
                  <Button size="sm" variant={agent.status === 'active' ? 'secondary' : 'default'} className="flex-1">
                    {agent.status === 'active' ? 'Pause' : 'Start'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAgent(null)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
                <p className="text-gray-600">Agent #{selectedAgent.id} - {selectedAgent.strategy}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedAgent(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Performance Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Profit:</span>
                      <span className="font-medium text-emerald-600">+${selectedAgent.profit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Trades:</span>
                      <span className="font-medium text-gray-900">{selectedAgent.trades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Win Rate:</span>
                      <span className="font-medium text-gray-900">{selectedAgent.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className="font-medium text-gray-900">{selectedAgent.riskLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Trade:</span>
                      <span className="font-medium text-gray-900">{selectedAgent.lastTrade}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Activity Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversations:</span>
                      <span className="font-medium text-gray-900">{selectedAgent.conversations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tool Calls:</span>
                      <span className="font-medium text-gray-900">{selectedAgent.toolCalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Memory Usage:</span>
                      <span className="font-medium text-gray-900">{selectedAgent.memory}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Strategy Information</h3>
                  <p className="text-sm text-gray-600 mb-3">{selectedAgent.strategy}</p>
                  <Badge className="badge-readable">{selectedAgent.status}</Badge>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Recent Activity</h3>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Last analysis: Market trend confirmed bullish</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Position opened: BTC/USD Long at $45,230</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Risk check: Portfolio exposure within limits</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">View Full History</Button>
                  <Button size="sm" variant="outline" className="flex-1">Export Data</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Agent Creation Panel - New functionality for creating agents
function AgentCreationPanel() {
  const [agentConfig, setAgentConfig] = useState({
    name: '',
    strategy: '',
    riskLevel: 'medium',
    allocation: 5000,
    stopLoss: 5,
    takeProfit: 10
  })
  
  const strategies = [
    { id: 'darvas', name: 'Darvas Box', description: 'Breakout trading with box patterns' },
    { id: 'elliott', name: 'Elliott Wave', description: 'Wave pattern analysis' },
    { id: 'momentum', name: 'Momentum', description: 'Trend following strategy' },
    { id: 'arbitrage', name: 'Arbitrage', description: 'Price difference exploitation' },
    { id: 'mean_reversion', name: 'Mean Reversion', description: 'Counter-trend strategy' }
  ]
  
  const handleCreateAgent = () => {
    console.log('Creating agent with config:', agentConfig)
    // Agent creation logic would go here
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Create New Trading Agent</h3>
        <p className="text-sm text-muted-foreground">Configure and deploy a new AI trading agent</p>
      </div>
      
      <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>Set up your new trading agent parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Agent Name</label>
            <input
              type="text"
              value={agentConfig.name}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter agent name..."
              className="w-full p-2 border rounded-md mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Trading Strategy</label>
            <select
              value={agentConfig.strategy}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, strategy: e.target.value }))}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="">Select strategy...</option>
              {strategies.map(strategy => (
                <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Risk Level</label>
              <select
                value={agentConfig.riskLevel}
                onChange={(e) => setAgentConfig(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full p-2 border rounded-md mt-1"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Allocation ($)</label>
              <input
                type="number"
                value={agentConfig.allocation}
                onChange={(e) => setAgentConfig(prev => ({ ...prev, allocation: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Stop Loss (%)</label>
              <input
                type="number"
                value={agentConfig.stopLoss}
                onChange={(e) => setAgentConfig(prev => ({ ...prev, stopLoss: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Take Profit (%)</label>
              <input
                type="number"
                value={agentConfig.takeProfit}
                onChange={(e) => setAgentConfig(prev => ({ ...prev, takeProfit: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md mt-1"
              />
            </div>
          </div>
          
          <Button onClick={handleCreateAgent} className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Agent Management Panel - For managing existing agents
function AgentManagementPanel() {
  const [selectedAgent, setSelectedAgent] = useState('agent-1')
  
  const agents = [
    { id: 'agent-1', name: 'Darvas Box Master', status: 'active', uptime: '5d 12h' },
    { id: 'agent-2', name: 'Elliott Wave Analyst', status: 'active', uptime: '3d 8h' },
    { id: 'agent-3', name: 'Momentum Trader', status: 'paused', uptime: '0h' }
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Agent Management</h3>
        <p className="text-sm text-muted-foreground">Monitor and control your trading agents</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAgent === agent.id ? 'border-emerald-500 bg-emerald-50' : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAgent(agent.id)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{agent.name}</h4>
                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Uptime: {agent.uptime}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Agent Controls</CardTitle>
            <CardDescription>Manage {agents.find(a => a.id === selectedAgent)?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <RefreshCw className="h-6 w-6 mb-2" />
                <span className="text-sm">Restart</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <Settings className="h-6 w-6 mb-2" />
                <span className="text-sm">Configure</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <BarChart3 className="h-6 w-6 mb-2" />
                <span className="text-sm">Analytics</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <Activity className="h-6 w-6 mb-2" />
                <span className="text-sm">Logs</span>
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPU Usage:</span>
                    <span className="font-medium">23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory:</span>
                    <span className="font-medium">156 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span className="font-medium">12 KB/s</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Agent Performance Panel - Performance metrics and analytics
function AgentPerformancePanel() {
  const performanceData = [
    { agent: 'Darvas Box Master', trades: 24, profit: 1247.30, winRate: 78.5, sharpe: 2.1 },
    { agent: 'Elliott Wave Analyst', trades: 18, profit: 890.50, winRate: 72.2, sharpe: 1.8 },
    { agent: 'Momentum Trader', trades: 31, profit: 2150.75, winRate: 83.9, sharpe: 2.5 },
    { agent: 'Arbitrage Hunter', trades: 12, profit: 567.20, winRate: 91.7, sharpe: 3.2 },
    { agent: 'Risk Manager', trades: 8, profit: 334.80, winRate: 62.5, sharpe: 1.4 }
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Agent Performance Analytics</h3>
        <p className="text-sm text-muted-foreground">Comprehensive performance metrics for all agents</p>
      </div>
      
      <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key metrics across all trading agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Agent</th>
                  <th className="text-right p-2">Trades</th>
                  <th className="text-right p-2">Profit</th>
                  <th className="text-right p-2">Win Rate</th>
                  <th className="text-right p-2">Sharpe Ratio</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((agent, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{agent.agent}</td>
                    <td className="p-2 text-right">{agent.trades}</td>
                    <td className="p-2 text-right text-emerald-600">+${agent.profit}</td>
                    <td className="p-2 text-right">{agent.winRate}%</td>
                    <td className="p-2 text-right">{agent.sharpe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-emerald-600">$5,190</div>
            <div className="text-sm text-muted-foreground">Total Profit</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">77.8%</div>
            <div className="text-sm text-muted-foreground">Avg Win Rate</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">93</div>
            <div className="text-sm text-muted-foreground">Total Trades</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Trading Strategies Panel Component
function TradingStrategiesPanel() {
  const [strategies, setStrategies] = useState<any[]>([])
  
  const handleCreateStrategy = (strategy: any) => {
    setStrategies(prev => [strategy, ...prev])
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trading Strategies</h3>
          <p className="text-sm text-muted-foreground">Create and manage automated trading strategies</p>
        </div>
        <StrategyCreationModal onCreateStrategy={handleCreateStrategy} />
      </div>
      
      {strategies.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No strategies created yet</h3>
            <p className="text-gray-600 mb-4">Create your first automated trading strategy to get started</p>
            <StrategyCreationModal onCreateStrategy={handleCreateStrategy} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <CardDescription>{strategy.type}</CardDescription>
                  </div>
                  <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                    {strategy.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{strategy.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Risk Level:</span>
                      <span className="ml-1 font-medium">{strategy.riskLevel}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Allocation:</span>
                      <span className="ml-1 font-medium">{strategy.allocation}%</span>
                    </div>
                  </div>
                  {strategy.indicators && strategy.indicators.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {strategy.indicators.slice(0, 3).map((indicator: string) => (
                        <Badge key={indicator} variant="outline" className="text-xs">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Consolidated Agents Tab with 5 sub-tabs - Fixed browser freeze issues
function AgentsTab() {
  const [agentSubTab, setAgentSubTab] = useState('agent-management')
  
  const agentSubTabs = [
    { id: 'agent-management', label: 'Management', component: <RealAgentManagement /> },
    { id: 'agent-creation', label: 'Create Agent', component: <RealAgentCreation /> },
    { id: 'expert-agents', label: 'Expert Agents', component: <AgentOverviewPanel /> },
    { id: 'agent-performance', label: 'Performance', component: <AgentPerformancePanel /> },
    { id: 'strategies', label: 'Strategies', component: <TradingStrategiesPanel /> }
  ]
  
  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 modern-text-primary">
          <Bot className="h-5 w-5 text-violet-600" />
          Agent Management System
        </CardTitle>
        <CardDescription className="modern-text-secondary">Comprehensive agent coordination and management</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={agentSubTab} onValueChange={setAgentSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 modern-card gap-2">
            {agentSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white font-medium text-xs sm:text-sm p-2 truncate transition-all"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {agentSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Farm Deployment Panel Component
function FarmDeploymentPanel() {
  const [deploymentConfig, setDeploymentConfig] = useState({
    farmName: '',
    strategy: '',
    agentCount: 5,
    allocation: 10000,
    riskLevel: 'medium',
    environments: ['production'],
    autoScaling: true
  })
  
  const strategies = [
    { id: 'darvas', name: 'Darvas Box', description: 'Breakout strategy with volume confirmation' },
    { id: 'elliott', name: 'Elliott Wave', description: 'Pattern recognition for wave analysis' },
    { id: 'momentum', name: 'Momentum', description: 'Trend-following strategy' },
    { id: 'arbitrage', name: 'Arbitrage', description: 'Price difference exploitation' },
    { id: 'mean_reversion', name: 'Mean Reversion', description: 'Counter-trend strategy' }
  ]
  
  const handleDeploy = () => {
    // Deployment logic would go here
    console.log('Deploying farm with config:', deploymentConfig)
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Farm Deployment</h3>
        <p className="text-sm text-muted-foreground">Deploy new agent farms with custom configurations</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Deployment Configuration</CardTitle>
            <CardDescription>Configure your new farm deployment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="farmName">Farm Name</Label>
              <Input
                id="farmName"
                value={deploymentConfig.farmName}
                onChange={(e) => setDeploymentConfig(prev => ({ ...prev, farmName: e.target.value }))}
                placeholder="Enter farm name..."
              />
            </div>
            
            <div>
              <Label htmlFor="strategy">Trading Strategy</Label>
              <select
                id="strategy"
                value={deploymentConfig.strategy}
                onChange={(e) => setDeploymentConfig(prev => ({ ...prev, strategy: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select strategy...</option>
                {strategies.map(strategy => (
                  <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agentCount">Agent Count</Label>
                <Input
                  id="agentCount"
                  type="number"
                  min="1"
                  max="20"
                  value={deploymentConfig.agentCount}
                  onChange={(e) => setDeploymentConfig(prev => ({ ...prev, agentCount: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="allocation">Total Allocation ($)</Label>
                <Input
                  id="allocation"
                  type="number"
                  min="1000"
                  value={deploymentConfig.allocation}
                  onChange={(e) => setDeploymentConfig(prev => ({ ...prev, allocation: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="riskLevel">Risk Level</Label>
              <select
                id="riskLevel"
                value={deploymentConfig.riskLevel}
                onChange={(e) => setDeploymentConfig(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
            
            <Button onClick={handleDeploy} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Deploy Farm
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Deployment History</CardTitle>
            <CardDescription>Recent farm deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Momentum Farm {i}</h4>
                      <p className="text-sm text-muted-foreground">Deployed 2 hours ago</p>
                    </div>
                    <Badge variant="default">Running</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                    <span>Agents: 8</span>
                    <span>Strategy: Momentum</span>
                    <span>Value: $25,000</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Farm Monitoring Panel Component
function FarmMonitoringPanel() {
  const [selectedFarm, setSelectedFarm] = useState('farm-1')
  
  const farms = [
    { id: 'farm-1', name: 'Darvas Box Farm', agents: 8, status: 'active', pnl: 1250.30 },
    { id: 'farm-2', name: 'Elliott Wave Farm', agents: 5, status: 'active', pnl: 890.50 },
    { id: 'farm-3', name: 'Momentum Farm', agents: 12, status: 'paused', pnl: -145.20 }
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Farm Monitoring</h3>
        <p className="text-sm text-muted-foreground">Real-time performance monitoring for all farms</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Active Farms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {farms.map(farm => (
                <div
                  key={farm.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFarm === farm.id ? 'border-emerald-500 bg-emerald-50' : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFarm(farm.id)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{farm.name}</h4>
                    <Badge variant={farm.status === 'active' ? 'default' : 'secondary'}>
                      {farm.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {farm.agents} agents • P&L: ${farm.pnl.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Real-time monitoring for {farms.find(f => f.id === selectedFarm)?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">8</div>
                <div className="text-sm text-muted-foreground">Active Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$42,500</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+$1,250</div>
                <div className="text-sm text-muted-foreground">Daily P&L</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">74.2%</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>CPU Usage</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Memory Usage</span>
                  <span>48%</span>
                </div>
                <Progress value={48} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Network I/O</span>
                  <span>23%</span>
                </div>
                <Progress value={23} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Farm Optimization Panel Component  
function FarmOptimizationPanel() {
  const [optimizationSettings, setOptimizationSettings] = useState({
    autoRebalance: true,
    performanceThreshold: 70,
    riskTolerance: 'medium',
    optimizationFrequency: 'daily'
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Farm Optimization</h3>
        <p className="text-sm text-muted-foreground">Optimize farm performance with AI-driven adjustments</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Optimization Settings</CardTitle>
            <CardDescription>Configure automatic optimization parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Rebalancing</Label>
                <p className="text-sm text-muted-foreground">Automatically rebalance agent allocations</p>
              </div>
              <Switch
                checked={optimizationSettings.autoRebalance}
                onCheckedChange={(checked) => setOptimizationSettings(prev => ({ ...prev, autoRebalance: checked }))}
              />
            </div>
            
            <div>
              <Label>Performance Threshold (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={optimizationSettings.performanceThreshold}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, performanceThreshold: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label>Risk Tolerance</Label>
              <select
                value={optimizationSettings.riskTolerance}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, riskTolerance: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <Label>Optimization Frequency</Label>
              <select
                value={optimizationSettings.optimizationFrequency}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, optimizationFrequency: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
            <CardDescription>AI-generated performance improvements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Increase Elliott Wave allocation', impact: '+$420/day', confidence: 89 },
                { title: 'Reduce Darvas Box risk exposure', impact: '-12% risk', confidence: 76 },
                { title: 'Add momentum indicator filter', impact: '+3.2% win rate', confidence: 94 }
              ].map((rec, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{rec.title}</h4>
                      <p className="text-sm text-emerald-600">{rec.impact}</p>
                    </div>
                    <Badge variant="outline">{rec.confidence}% confidence</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2 w-full">
                    Apply Recommendation
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Consolidated Farms Tab with 4 sub-tabs
function FarmsTab() {
  const [farmSubTab, setFarmSubTab] = useState('farms-overview')
  
  const farmSubTabs = [
    { id: 'farms-overview', label: 'Overview', component: <div className="p-6"><FarmsPage /></div> },
    { id: 'farm-deployment', label: 'Deployment', component: <FarmDeploymentPanel /> },
    { id: 'farm-monitoring', label: 'Monitoring', component: <FarmMonitoringPanel /> },
    { id: 'farm-optimization', label: 'Optimization', component: <FarmOptimizationPanel /> }
  ]
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          Trading Farms Management
        </CardTitle>
        <CardDescription>Deploy and manage automated trading farm clusters</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={farmSubTab} onValueChange={setFarmSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-emerald-50 gap-2">
            {farmSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 text-xs sm:text-sm p-2 truncate"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {farmSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Goal Progress Tracking Panel Component
function GoalProgressTrackingPanel() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week')
  
  const progressData = [
    { date: '2024-01-15', profit: 3247, target: 5000, winRate: 68.2, trades: 24 },
    { date: '2024-01-16', profit: 4156, target: 5000, winRate: 71.5, trades: 28 },
    { date: '2024-01-17', profit: 2890, target: 5000, winRate: 65.8, trades: 19 },
    { date: '2024-01-18', profit: 5420, target: 5000, winRate: 74.1, trades: 31 },
    { date: '2024-01-19', profit: 4780, target: 5000, winRate: 69.3, trades: 26 }
  ]
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Goal Progress Tracking</h3>
          <p className="text-sm text-muted-foreground">Monitor real-time progress towards your trading objectives</p>
        </div>
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Daily Progress Chart</CardTitle>
            <CardDescription>Track daily performance against targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.map((day, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{new Date(day.date).toLocaleDateString()}</span>
                    <span className="font-medium">
                      ${day.profit.toLocaleString()} / ${day.target.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={(day.profit / day.target) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Win Rate: {day.winRate}%</span>
                    <span>Trades: {day.trades}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Goal Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators for active goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">$3,247</div>
                <div className="text-sm text-muted-foreground">Today's Progress</div>
                <div className="text-xs text-emerald-600">+64.9% to target</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">68.2%</div>
                <div className="text-sm text-muted-foreground">Current Win Rate</div>
                <div className="text-xs text-blue-600">+90.9% to target</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">3.2%</div>
                <div className="text-sm text-muted-foreground">Max Drawdown</div>
                <div className="text-xs text-green-600">✓ Under 5% target</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">12</div>
                <div className="text-sm text-muted-foreground">Days Remaining</div>
                <div className="text-xs text-orange-600">To monthly deadline</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Goal Analytics Panel Component
function GoalAnalyticsPanel() {
  const achievements = [
    { title: 'Consistency Master', description: 'Achieved daily profit target 5 days in a row', date: '2024-01-19', type: 'streak' },
    { title: 'Risk Manager', description: 'Maintained drawdown below 5% for 30 days', date: '2024-01-18', type: 'risk' },
    { title: 'Win Rate Champion', description: 'Exceeded 70% win rate for the week', date: '2024-01-17', type: 'performance' },
    { title: 'Profit Milestone', description: 'Reached $20,000 monthly profit milestone', date: '2024-01-15', type: 'milestone' }
  ]
  
  const insights = [
    { metric: 'Best Performing Strategy', value: 'Elliott Wave', change: '+34.2%' },
    { metric: 'Optimal Trading Hours', value: '9:30-11:30 AM EST', change: '+28.5%' },
    { metric: 'Peak Performance Day', value: 'Tuesday', change: '+19.3%' },
    { metric: 'Success Pattern', value: 'High Volume + Low VIX', change: '+41.7%' }
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Goal Analytics</h3>
        <p className="text-sm text-muted-foreground">Analyze performance patterns and achievements</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>Your latest trading milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements.map((achievement, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.date}</p>
                  </div>
                  <Badge variant="outline">{achievement.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>AI-discovered patterns in your trading</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{insight.metric}</h4>
                    <p className="text-sm text-muted-foreground">{insight.value}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-emerald-600">{insight.change}</div>
                    <div className="text-xs text-muted-foreground">improvement</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Goal Calendar Panel Component
function GoalCalendarPanel() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const calendarEvents = [
    { date: '2024-01-20', title: 'Daily Profit Target', status: 'pending', target: '$5,000' },
    { date: '2024-01-22', title: 'Weekly Win Rate Review', status: 'scheduled', target: '75%' },
    { date: '2024-01-25', title: 'Monthly Risk Assessment', status: 'upcoming', target: '<5% drawdown' },
    { date: '2024-01-30', title: 'Goal Performance Review', status: 'upcoming', target: 'All goals' }
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Goal Timeline Calendar</h3>
        <p className="text-sm text-muted-foreground">Track deadlines and milestones for your trading goals</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Important dates and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {calendarEvents.map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {new Date(event.date).getDate()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">Target: {event.target}</p>
                  </div>
                  <Badge variant={event.status === 'pending' ? 'default' : 'outline'}>
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Goal Schedule</CardTitle>
            <CardDescription>Weekly and monthly goal timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="font-medium text-muted-foreground">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const date = i + 1
                  const hasEvent = calendarEvents.some(event => 
                    new Date(event.date).getDate() === date
                  )
                  return (
                    <div
                      key={i}
                      className={`p-2 text-center text-sm rounded cursor-pointer ${
                        hasEvent 
                          ? 'bg-emerald-100 text-emerald-700 font-medium' 
                          : date <= 31 
                            ? 'hover:bg-gray-100' 
                            : 'text-muted-foreground'
                      }`}
                    >
                      {date <= 31 ? date : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Consolidated Goals Tab with 5 sub-tabs (including Watchlist)
function GoalsTab() {
  const [goalSubTab, setGoalSubTab] = useState('goals-overview')
  
  const goalSubTabs = [
    { id: 'goals-overview', label: 'Overview', component: <div className="p-6"><GoalsPage /></div> },
    { id: 'goal-tracking', label: 'Tracking', component: <GoalProgressTrackingPanel /> },
    { id: 'goal-analytics', label: 'Analytics', component: <GoalAnalyticsPanel /> },
    { id: 'goal-calendar', label: 'Calendar', component: <GoalCalendarPanel /> },
    { id: 'watchlist', label: 'Watchlist', component: <div className="p-6"><WatchlistView /></div> }
  ]
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-600" />
          Goals & Objectives
        </CardTitle>
        <CardDescription>Set, track and achieve trading objectives with market watchlist</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={goalSubTab} onValueChange={setGoalSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-amber-50 gap-2">
            {goalSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 text-xs sm:text-sm p-2 truncate"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {goalSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Paper Trading Panel - Fixed integration
function PaperTradingPanel() {
  const [paperPortfolio, setPaperPortfolio] = useState({
    balance: 100000,
    profit: 5847.32,
    positions: 3,
    totalTrades: 47
  })

  const [paperTrades] = useState([
    { id: 1, symbol: 'BTC/USD', side: 'long', amount: 0.1, price: 45230, pnl: 1234.50, status: 'open' },
    { id: 2, symbol: 'ETH/USD', side: 'short', amount: 2.5, price: 2876, pnl: -345.20, status: 'closed' },
    { id: 3, symbol: 'SOL/USD', side: 'long', amount: 10, price: 98.50, pnl: 678.90, status: 'open' }
  ])

  return (
    <div className="space-y-6 card-light-content">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Paper Trading Engine</h3>
        <p className="text-sm text-gray-600">Practice trading with virtual funds and real market data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="modern-card card-light-content">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Virtual Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${paperPortfolio.balance.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card card-light-content">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+${paperPortfolio.profit.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card card-light-content">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{paperPortfolio.positions}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card card-light-content">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{paperPortfolio.totalTrades}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="modern-card card-light-content">
          <CardHeader>
            <CardTitle className="text-gray-900">Place Paper Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900">Symbol</Label>
                <select className="w-full">
                  <option>BTC/USD</option>
                  <option>ETH/USD</option>
                  <option>SOL/USD</option>
                </select>
              </div>
              <div>
                <Label className="text-gray-900">Side</Label>
                <select className="w-full">
                  <option>Long</option>
                  <option>Short</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900">Amount</Label>
                <Input type="number" placeholder="0.1" />
              </div>
              <div>
                <Label className="text-gray-900">Price</Label>
                <Input type="number" placeholder="Market" />
              </div>
            </div>
            <Button className="w-full">Place Paper Order</Button>
          </CardContent>
        </Card>

        <Card className="modern-card card-light-content">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Paper Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paperTrades.map((trade) => (
                <div key={trade.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">{trade.symbol}</div>
                    <div className="text-sm text-gray-600">{trade.side} {trade.amount} @ ${trade.price}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${trade.pnl > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {trade.pnl > 0 ? '+' : ''}${trade.pnl}
                    </div>
                    <Badge className={`text-xs ${trade.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {trade.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="modern-card card-light-content">
        <CardHeader>
          <CardTitle className="text-gray-900">Agent Paper Trading</CardTitle>
          <CardDescription className="text-gray-600">Let AI agents trade with virtual funds</CardDescription>
        </CardHeader>
        <CardContent>
          <AgentPaperTradingDashboard />
        </CardContent>
      </Card>
    </div>
  )
}

// Consolidated Trading Tab - Live, Paper, Advanced Trading
function TradingTab() {
  const [tradingSubTab, setTradingSubTab] = useState('real-trading')
  
  const tradingSubTabs = [
    { id: 'real-trading', label: 'Real Trading', component: <RealTradingInterface /> },
    { id: 'charts', label: 'Charts', component: <TradingCharts /> },
    { id: 'order-form', label: 'Order Form', component: <TradingForm /> },
    { id: 'live-trading', label: 'Live Trading', component: <TradingInterface /> },
    { id: 'paper-trading', label: 'Paper Trading', component: <PaperTradingPanel /> },
    { id: 'portfolio', label: 'Portfolio', component: <RealPortfolioAnalyticsDashboard /> },
    { id: 'strategies', label: 'Strategies', component: <TradingStrategiesPanel /> },
    { id: 'backtesting', label: 'Backtesting', component: <RealBacktestingDashboard /> },
    { id: 'risk', label: 'Risk Monitor', component: <RealRiskManagementDashboard /> }
  ]
  
  return (
    <Card className="modern-card card-light-content">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          Unified Trading Interface
        </CardTitle>
        <CardDescription className="text-gray-600">Live trading, paper trading, and strategy management</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tradingSubTab} onValueChange={setTradingSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 bg-gray-100 gap-2">
            {tradingSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-900 text-xs sm:text-sm p-2 truncate"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tradingSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="tab-content-light">
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Enhanced Vault Tab with Multi-Chain Wallets and DeFi
function VaultTab() {
  const [vaultSubTab, setVaultSubTab] = useState('vault-overview')
  
  const vaultSubTabs = [
    { id: 'vault-overview', label: 'Vault Banking', component: <div className="p-6"><VaultPage /></div> },
    { id: 'multi-chain', label: 'Multi-Chain Wallets', component: <div className="p-6"><MultiChainWalletView /></div> },
    { id: 'defi-lending', label: 'DeFi Operations', component: <div className="p-6"><DeFiLendingPage /></div> },
    { id: 'portfolio', label: 'Portfolio Overview', component: <RealPortfolioAnalyticsDashboard /> }
  ]
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          Vault & Portfolio Management
        </CardTitle>
        <CardDescription>Multi-chain wallets, DeFi operations, and portfolio infrastructure</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={vaultSubTab} onValueChange={setVaultSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-blue-50 gap-2">
            {vaultSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 text-xs sm:text-sm p-2 truncate"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {vaultSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}


// Risk Management Panel Component
function RiskManagementPanel() {
  const [riskSettings, setRiskSettings] = useState({
    maxDailyLoss: 5000,
    maxDrawdown: 10,
    positionSizeLimit: 15,
    volatilityThreshold: 25,
    correlationLimit: 0.7,
    stopLossEnabled: true,
    takeProfitEnabled: true
  })
  
  const riskMetrics = [
    { label: 'Value at Risk (1d)', value: '$2,340', status: 'normal', limit: '$5,000' },
    { label: 'Portfolio Beta', value: '1.12', status: 'moderate', limit: '1.50' },
    { label: 'Sharpe Ratio', value: '2.34', status: 'good', limit: '>1.00' },
    { label: 'Max Drawdown', value: '8.2%', status: 'normal', limit: '10%' },
    { label: 'Correlation Risk', value: '0.45', status: 'good', limit: '0.70' },
    { label: 'Leverage Ratio', value: '1.8x', status: 'normal', limit: '3.0x' }
  ]
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'normal': return 'text-blue-600 bg-blue-100'
      case 'moderate': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Risk Management</h3>
        <p className="text-sm text-muted-foreground">Monitor and control portfolio risk exposure</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
            <CardDescription>Current portfolio risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskMetrics.map((metric, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{metric.label}</h4>
                    <p className="text-sm text-muted-foreground">Limit: {metric.limit}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{metric.value}</div>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
          <CardHeader>
            <CardTitle>Risk Controls</CardTitle>
            <CardDescription>Configure risk management parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Max Daily Loss ($)</Label>
              <Input
                type="number"
                value={riskSettings.maxDailyLoss}
                onChange={(e) => setRiskSettings(prev => ({ ...prev, maxDailyLoss: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label>Max Drawdown (%)</Label>
              <Input
                type="number"
                value={riskSettings.maxDrawdown}
                onChange={(e) => setRiskSettings(prev => ({ ...prev, maxDrawdown: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label>Position Size Limit (%)</Label>
              <Input
                type="number"
                value={riskSettings.positionSizeLimit}
                onChange={(e) => setRiskSettings(prev => ({ ...prev, positionSizeLimit: parseInt(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Stop Loss Protection</Label>
                <Switch
                  checked={riskSettings.stopLossEnabled}
                  onCheckedChange={(checked) => setRiskSettings(prev => ({ ...prev, stopLossEnabled: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Take Profit Orders</Label>
                <Switch
                  checked={riskSettings.takeProfitEnabled}
                  onCheckedChange={(checked) => setRiskSettings(prev => ({ ...prev, takeProfitEnabled: checked }))}
                />
              </div>
            </div>
            
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              Update Risk Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Advanced Tab with ALL extra features organized as requested
function AdvancedTab() {
  const [advancedSubTab, setAdvancedSubTab] = useState('analytics')
  
  const advancedSubTabs = [
    { id: 'analytics', label: 'Analytics', component: <RealAnalyticsDashboard /> },
    { id: 'market-data', label: 'Market Data', component: <RealMarketDataDashboard /> },
    { id: 'notifications', label: 'Notifications', component: <RealNotificationSystem /> },
    { id: 'comprehensive-analytics', label: 'Comprehensive Analytics', component: <div className="p-6"><ComprehensiveAnalyticsPage /></div> },
    { id: 'flashloan', label: 'FlashLoan', component: <div className="p-6"><FlashLoanView /></div> },
    { id: 'hyperlend', label: 'HyperLend', component: <div className="p-6"><HyperLendView /></div> },
    { id: 'knowledge-graph', label: 'Knowledge Graph', component: <div className="p-6"><KnowledgeGraphPage /></div> },
    { id: 'python-analysis', label: 'Python Analysis', component: <div className="p-6"><PythonAnalysisPage /></div> },
    { id: 'persistence', label: 'Persistence', component: <div className="p-6"><PersistencePage /></div> },
    { id: 'calendar', label: 'Calendar', component: <div className="p-6"><CalendarPage /></div> },
    { id: 'ai-assistant-advanced', label: 'AI Assistant', component: <div className="p-6"><UnifiedAIAssistant /></div> },
    { id: 'risk', label: 'Risk Management', component: <RealRiskManagementDashboard /> }
  ]
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          Advanced Features
        </CardTitle>
        <CardDescription>All professional trading tools, AI features, and advanced analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={advancedSubTab} onValueChange={setAdvancedSubTab} className="space-y-4">
          <div className="space-y-2">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:grid-cols-4 bg-gray-50 gap-2">
              {advancedSubTabs.slice(0, 4).map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:grid-cols-4 bg-gray-50 gap-2">
              {advancedSubTabs.slice(4, 8).map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:grid-cols-4 bg-gray-50 gap-2">
              {advancedSubTabs.slice(8, 12).map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {advancedSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}


// Loading Screen Component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-violet-50 to-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">
          Loading Dashboard
        </h2>
        <p className="text-gray-600">Initializing trading systems...</p>
      </div>
    </div>
  )
}


export default ModernDashboardV4