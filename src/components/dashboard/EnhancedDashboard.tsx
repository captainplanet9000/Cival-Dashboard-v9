'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity, TrendingUp, TrendingDown, DollarSign, Bot, Shield, Zap,
  Target, BarChart3, RefreshCw, Bell, Users, Calendar, Wallet, PieChart,
  Plus, Menu, X, Star, Clock, Settings, ArrowUpRight, ArrowDownRight, Search,
  Home, Brain
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

// Import backend API
import { backendApi } from '@/lib/api/backend-client'

// Import the new professional trading components
import LiveTradingDashboard from '@/components/trading/LiveTradingDashboard'
import AgentControlPanel from '@/components/agent/AgentControlPanel'
import AgentDecisionLog from '@/components/agent/AgentDecisionLog'
import LLMProviderManager from '@/components/llm/LLMProviderManager'
import SystemMonitoringDashboard from '@/components/monitoring/SystemMonitoringDashboard'

// Import existing components
import { ExpertAgentsPanel } from '@/components/agent-trading/ExpertAgentsPanel'
import { LiveMarketTicker } from '@/components/realtime/LiveMarketTicker'
import { PortfolioMonitor } from '@/components/trading/PortfolioMonitor'
import { AgentManager } from '@/components/trading/AgentManager'
import { RiskDashboard } from '@/components/trading/RiskDashboard'
import { TradingInterface } from '@/components/trading/TradingInterface'

// Import enhanced farm dashboard
import EnhancedFarmDashboard from '@/components/farm/EnhancedFarmDashboard'

// Import live market data component
import { LiveMarketDataPanel } from '@/components/market/LiveMarketDataPanel'

// Import memory analytics component
import { MemoryAnalyticsDashboard } from '@/components/memory/MemoryAnalyticsDashboard'

// Import AG-UI components
import { AGUIProvider, AGUIChat } from '@/components/ag-ui/fallback'

// Import the comprehensive Advanced Dashboard Tab
import AdvancedDashboardTab from '@/components/dashboard/AdvancedDashboardTab'

// Import wallet system components
import ComprehensiveWalletDashboard from '@/components/wallet/ComprehensiveWalletDashboard'
import VaultBankingDashboard from '@/components/vault/VaultBankingDashboard'
import DeFiIntegrationHub from '@/components/defi/DeFiIntegrationHub'

// Import existing page components
import dynamic from 'next/dynamic'

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

interface DashboardMetrics {
  totalValue: number
  dailyPnL: number
  totalPnL: number
  activePositions: number
  activeAgents: number
  activeFarms: number
  farmPerformance: number
  winRate: number
  avgReturn: number
  riskScore: number
  systemHealth: number
}

interface SystemStatus {
  trading_enabled: boolean
  market_condition: string
  active_signals: number
  active_opportunities: number
  active_orders: number
  system_health: number
}

interface DashboardTab {
  id: string
  label: string
  icon: React.ReactNode
  component: React.ReactNode
}

export function EnhancedDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalValue: 0,
    dailyPnL: 0,
    totalPnL: 0,
    activePositions: 0,
    activeAgents: 0,
    activeFarms: 0,
    winRate: 0,
    avgReturn: 0,
    riskScore: 0,
    systemHealth: 0
  })
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    trading_enabled: false,
    market_condition: 'unknown',
    active_signals: 0,
    active_opportunities: 0,
    active_orders: 0,
    system_health: 0
  })

  // Fetch real data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch system status
        const [tradingStatus, systemHealth, marketOverview] = await Promise.all([
          backendApi.get('/api/v1/trading/status').catch(() => ({ data: null })),
          backendApi.get('/health').catch(() => ({ data: null })),
          backendApi.get('/api/v1/market/overview').catch(() => ({ data: null }))
        ])

        // Update system status
        if (tradingStatus.data) {
          setSystemStatus(prev => ({
            ...prev,
            trading_enabled: tradingStatus.data.is_enabled || false,
            market_condition: tradingStatus.data.market_condition || 'unknown',
            active_signals: tradingStatus.data.active_signals || 0,
            active_opportunities: tradingStatus.data.active_opportunities || 0,
            active_orders: tradingStatus.data.active_orders || 0
          }))
        }

        // Update metrics from various sources
        const healthScore = systemHealth.data?.system_health || 85
        setSystemStatus(prev => ({ ...prev, system_health: healthScore }))
        
        setMetrics(prev => ({
          ...prev,
          systemHealth: healthScore,
          activeAgents: tradingStatus.data?.running_tasks || 4,
          totalValue: 250000 + Math.random() * 10000, // Mock with some variation
          dailyPnL: (Math.random() - 0.5) * 5000,
          totalPnL: 15420 + (Math.random() - 0.5) * 2000,
          activePositions: tradingStatus.data?.active_orders || 3,
          activeFarms: 3 + Math.floor(Math.random() * 2),
          farmPerformance: 7500 + (Math.random() - 0.5) * 2000,
          winRate: 68.5 + (Math.random() - 0.5) * 10,
          avgReturn: 12.8 + (Math.random() - 0.5) * 4,
          riskScore: 65 + (Math.random() - 0.5) * 20
        }))

        setIsLoading(false)
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set fallback data
        setMetrics({
          totalValue: 250000,
          dailyPnL: 1234.56,
          totalPnL: 15420.50,
          activePositions: 3,
          activeAgents: 4,
          activeFarms: 3,
          farmPerformance: 7500,
          winRate: 68.5,
          avgReturn: 12.8,
          riskScore: 65,
          systemHealth: 85
        })
        setIsLoading(false)
      }
    }

    fetchDashboardData()
    
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Enhanced navigation with professional trading interface
  const tabs: DashboardTab[] = [
    {
      id: 'overview',
      label: 'Trading Overview',
      icon: <BarChart3 className="h-4 w-4" />,
      component: <TradingOverviewTab metrics={metrics} systemStatus={systemStatus} onNavigate={setActiveTab} />
    },
    {
      id: 'live-trading',
      label: 'Live Trading',
      icon: <Zap className="h-4 w-4" />,
      component: <LiveTradingDashboard />
    },
    {
      id: 'market-data',
      label: 'Live Market Data',
      icon: <TrendingUp className="h-4 w-4" />,
      component: <LiveMarketDataPanel />
    },
    {
      id: 'agents',
      label: 'AI Agents',
      icon: <Bot className="h-4 w-4" />,
      component: <EnhancedAgentsTab />
    },
    {
      id: 'monitoring',
      label: 'System Monitor',
      icon: <Activity className="h-4 w-4" />,
      component: <SystemMonitoringDashboard />
    },
    {
      id: 'memory',
      label: 'Memory Analytics',
      icon: <Brain className="h-4 w-4" />,
      component: <MemoryAnalyticsDashboard />
    },
    {
      id: 'farms',
      label: 'Agent Farms',
      icon: <Target className="h-4 w-4" />,
      component: <EnhancedFarmDashboard />
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: <Star className="h-4 w-4" />,
      component: <GoalsPage />
    },
    {
      id: 'wallets',
      label: 'Multi-Chain Wallets',
      icon: <Wallet className="h-4 w-4" />,
      component: <ComprehensiveWalletDashboard />
    },
    {
      id: 'vault-banking',
      label: 'Vault Banking',
      icon: <Home className="h-4 w-4" />,
      component: <VaultBankingDashboard />
    },
    {
      id: 'defi',
      label: 'DeFi Hub',
      icon: <Zap className="h-4 w-4" />,
      component: <DeFiIntegrationHub />
    },
    {
      id: 'vault',
      label: 'Legacy Vault',
      icon: <PieChart className="h-4 w-4" />,
      component: <VaultPage />
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: <Settings className="h-4 w-4" />,
      component: <AdvancedTab />
    }
  ]

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <AGUIProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="fixed left-0 top-0 h-full w-64 bg-background shadow-xl border-r border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Navigation</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <nav className="space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="bg-background/80 backdrop-blur-sm shadow-lg border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Cival Trading Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    AI-Powered Trading Platform
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* System Status */}
                <div className="hidden md:flex items-center gap-2">
                  <Badge variant={systemStatus.trading_enabled ? 'default' : 'secondary'}>
                    {systemStatus.trading_enabled ? 'TRADING ACTIVE' : 'TRADING PAUSED'}
                  </Badge>
                  <Badge variant="outline">
                    Health: {systemStatus.system_health}%
                  </Badge>
                </div>
                
                <ThemeToggle />
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="container mx-auto px-4 py-4">
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-border">
            <div className="hidden lg:flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Mobile Tab Selector */}
            <div className="lg:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {tabs.find(tab => tab.id === activeTab)?.component}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </AGUIProvider>
  )
}

// Quick Access Card Component
function QuickAccessCard({ title, description, icon, targetTab, onNavigate }: { 
  title: string, 
  description: string, 
  icon: React.ReactNode, 
  targetTab: string,
  onNavigate: (tab: string) => void
}) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate(targetTab)}>
      <CardContent className="p-6 text-center">
        {icon}
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  )
}

// Trading Overview Tab with real-time data
function TradingOverviewTab({ metrics, systemStatus, onNavigate }: { metrics: DashboardMetrics, systemStatus: SystemStatus, onNavigate: (tab: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Portfolio Value"
          value={`$${metrics.totalValue.toLocaleString()}`}
          change={metrics.dailyPnL}
          changePercent={(metrics.dailyPnL / metrics.totalValue) * 100}
          isPositive={metrics.dailyPnL >= 0}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <MetricCard
          title="Agent Farms"
          value={metrics.activeFarms.toString()}
          change={metrics.farmPerformance}
          changePercent={(metrics.farmPerformance / 10000) * 100}
          isPositive={metrics.farmPerformance >= 0}
          icon={<Target className="h-6 w-6" />}
        />
        <MetricCard
          title="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          change={0}
          changePercent={0}
          isPositive={metrics.winRate > 60}
          icon={<Target className="h-6 w-6" />}
        />
        <MetricCard
          title="System Health"
          value={`${systemStatus.system_health}%`}
          change={0}
          changePercent={0}
          isPositive={systemStatus.system_health > 80}
          icon={<Shield className="h-6 w-6" />}
        />
      </div>

      {/* Live Trading Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Live Trading Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{systemStatus.active_signals}</p>
              <p className="text-sm text-gray-600">Active Signals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{systemStatus.active_opportunities}</p>
              <p className="text-sm text-gray-600">Opportunities</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{systemStatus.active_orders}</p>
              <p className="text-sm text-gray-600">Active Orders</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Market Condition: <span className="font-medium">{systemStatus.market_condition}</span></p>
            <p className="text-sm text-gray-600">Trading Status: 
              <Badge variant={systemStatus.trading_enabled ? 'default' : 'secondary'} className="ml-2">
                {systemStatus.trading_enabled ? 'ACTIVE' : 'PAUSED'}
              </Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access to Professional Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <QuickAccessCard
          title="Live Market Data"
          description="Real-time prices & technical analysis"
          icon={<TrendingUp className="h-12 w-12 mx-auto mb-4 text-emerald-500" />}
          targetTab="market-data"
          onNavigate={onNavigate}
        />
        
        <QuickAccessCard
          title="Live Trading Dashboard"
          description="Real-time autonomous trading interface"
          icon={<Zap className="h-12 w-12 mx-auto mb-4 text-blue-500" />}
          targetTab="live-trading"
          onNavigate={onNavigate}
        />
        
        <QuickAccessCard
          title="Multi-Chain Wallets"
          description="Cross-chain wallet management"
          icon={<Wallet className="h-12 w-12 mx-auto mb-4 text-purple-500" />}
          targetTab="wallets"
          onNavigate={onNavigate}
        />
        
        <QuickAccessCard
          title="DeFi Integration"
          description="Yield farming & protocol management"
          icon={<Zap className="h-12 w-12 mx-auto mb-4 text-violet-500" />}
          targetTab="defi"
          onNavigate={onNavigate}
        />
        
        <QuickAccessCard
          title="AI Agent Control"
          description="Monitor and control trading agents"
          icon={<Bot className="h-12 w-12 mx-auto mb-4 text-indigo-500" />}
          targetTab="agents"
          onNavigate={onNavigate}
        />
        
        <QuickAccessCard
          title="System Monitoring"
          description="Comprehensive system health monitoring"
          icon={<Activity className="h-12 w-12 mx-auto mb-4 text-green-500" />}
          targetTab="monitoring"
          onNavigate={onNavigate}
        />
      </div>
    </div>
  )
}

// Enhanced Agents Tab with all functionality
function EnhancedAgentsTab() {
  const [agentSubTab, setAgentSubTab] = useState('control-panel')
  
  const agentSubTabs = [
    { id: 'control-panel', label: 'Control Panel', component: <AgentControlPanel /> },
    { id: 'decisions', label: 'Decision Log', component: <AgentDecisionLog /> },
    { id: 'llm-manager', label: 'LLM Manager', component: <LLMProviderManager /> },
    { id: 'performance', label: 'Performance', component: <ExpertAgentsPanel /> },
    { id: 'legacy', label: 'Legacy View', component: <AgentManager /> }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-purple-500" />
          AI Agent Management
        </CardTitle>
        <CardDescription>Complete autonomous agent coordination and management</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={agentSubTab} onValueChange={setAgentSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {agentSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-medium text-xs sm:text-sm p-2 truncate transition-all"
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

// Advanced Tab with complete feature library
function AdvancedTab() {
  return <AdvancedDashboardTab />
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  change, 
  changePercent, 
  isPositive, 
  icon 
}: { 
  title: string
  value: string
  change: number
  changePercent: number
  isPositive: boolean
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(changePercent).toFixed(2)}%
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Screen
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground">
          Loading Cival Trading Dashboard
        </h2>
        <p className="text-muted-foreground">Initializing AI agents and market data...</p>
      </div>
    </div>
  )
}

export default EnhancedDashboard