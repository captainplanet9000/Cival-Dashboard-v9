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
  Plus, Menu, X, Star, Clock, Settings, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Import existing components and hooks
// Removing potentially problematic imports temporarily
// import { backendApi } from '@/lib/api/backend-client'
// import { ExpertAgentsPanel } from '@/components/agent-trading/ExpertAgentsPanel'

// Import additional page components for consolidated tabs
// Using dynamic imports to prevent auto-loading issues
import dynamic from 'next/dynamic'

const FarmsPage = dynamic(() => import('@/app/dashboard/farms/page'), { ssr: false })
const GoalsPage = dynamic(() => import('@/app/dashboard/goals/page'), { ssr: false })
const PythonAnalysisPage = dynamic(() => import('@/app/dashboard/python-analysis/page'), { ssr: false })
const ElizaPage = dynamic(() => import('@/app/dashboard/eliza/page'), { ssr: false })
const AnalyticsPage = dynamic(() => import('@/app/dashboard/analytics/page'), { ssr: false })
const ComprehensiveAnalyticsPage = dynamic(() => import('@/app/dashboard/comprehensive-analytics/page'), { ssr: false })
const KnowledgeGraphPage = dynamic(() => import('@/app/dashboard/knowledge-graph/page'), { ssr: false })
const PersistencePage = dynamic(() => import('@/app/dashboard/persistence/page'), { ssr: false })
const DeFiLendingPage = dynamic(() => import('@/app/dashboard/defi-lending/page'), { ssr: false })

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chartData] = useState<ChartDataPoint[]>(generateChartData())
  
  // Remove unused backendClient reference
  // const backendClient = backendApi

  // Dashboard metrics state with v4 minimal mock data
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalValue: 125847.32,
    dailyPnL: 2847.32,
    totalPnL: 25847.32,
    activePositions: 8,
    activeAgents: 5, // Our 5 expert agents
    activeFarms: 3,
    winRate: 78.4,
    avgReturn: 15.2,
    riskScore: 23.5
  })

  // Quick loading - no external dependencies
  useEffect(() => {
    // Immediately set loading to false - no backend dependencies
    setIsLoading(false)
  }, [])

  // Consolidated tab configuration with organized sub-systems
  const tabs: DashboardTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="h-4 w-4" />,
      component: <OverviewTab metrics={metrics} chartData={chartData} />
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: <Bot className="h-4 w-4" />,
      component: <AgentsTab />
    },
    {
      id: 'farms',
      label: 'Farms',
      icon: <Target className="h-4 w-4" />,
      component: <FarmsTab />
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: <Star className="h-4 w-4" />,
      component: <GoalsTab />
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-violet-50 to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex h-screen">
        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-md shadow-xl lg:hidden"
            >
              <MobileSidebar onClose={() => setIsMobileMenuOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white/80 lg:backdrop-blur-md lg:border-r lg:border-emerald-200/50">
          <DesktopSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-emerald-200/50 p-4">
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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-violet-600 to-amber-600 bg-clip-text text-transparent">
                    Cival Dashboard v4
                  </h1>
                  <p className="text-sm text-gray-600">Advanced AI Trading Platform</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  Live
                </Badge>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Bell className="h-4 w-4 mr-2" />
                  Alerts
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {tab.component}
                  </motion.div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ metrics, chartData }: { metrics: DashboardMetrics; chartData: ChartDataPoint[] }) {
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Portfolio"
          value={`$${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change={`+${metrics.dailyPnL.toFixed(2)}`}
          changePercent="+2.34%"
          isPositive={metrics.dailyPnL > 0}
          icon={<DollarSign className="h-5 w-5" />}
          gradient="from-emerald-500 to-emerald-600"
        />
        
        <MetricCard
          title="Active Agents"
          value={metrics.activeAgents.toString()}
          change="Expert Agents"
          isPositive={true}
          icon={<Bot className="h-5 w-5" />}
          gradient="from-violet-500 to-violet-600"
        />
        
        <MetricCard
          title="Win Rate"
          value={`${metrics.winRate}%`}
          change="Last 30 days"
          isPositive={metrics.winRate > 70}
          icon={<Target className="h-5 w-5" />}
          gradient="from-amber-500 to-amber-600"
        />
        
        <MetricCard
          title="Risk Score"
          value={`${metrics.riskScore}%`}
          change="Low Risk"
          isPositive={metrics.riskScore < 30}
          icon={<Shield className="h-5 w-5" />}
          gradient="from-rose-500 to-rose-600"
        />
      </div>

      {/* Performance Chart */}
      <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Portfolio Performance
          </CardTitle>
          <CardDescription>30-day portfolio value and P&L trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #d1fae5',
                    borderRadius: '8px',
                    backdropFilter: 'blur(4px)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used trading operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              New Strategy
            </Button>
            <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50">
              <Bot className="h-4 w-4 mr-2" />
              Deploy Agent
            </Button>
            <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
              <Target className="h-4 w-4 mr-2" />
              Create Farm
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
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
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

// Consolidated Agents Tab with 5 sub-tabs
function AgentsTab() {
  const [agentSubTab, setAgentSubTab] = useState('expert-agents')
  
  const agentSubTabs = [
    { id: 'expert-agents', label: 'Expert Agents', component: <div className="p-6 text-center">Expert Agents Panel - Loading...</div> },
    { id: 'agent-trading', label: 'Agent Trading', component: <div className="p-6 text-center">Agent Trading Interface</div> },
    { id: 'agent-data', label: 'Agent Data', component: <div className="p-6 text-center">Agent Data Access</div> },
    { id: 'ai-enhanced', label: 'AI Enhanced', component: <div className="p-6 text-center">AI Enhanced Features</div> },
    { id: 'strategies', label: 'Strategies', component: <div className="p-6 text-center">Trading Strategies</div> }
  ]
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-600" />
          Agent Management System
        </CardTitle>
        <CardDescription>Comprehensive agent coordination and management</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={agentSubTab} onValueChange={setAgentSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-violet-50">
            {agentSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-800"
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

// Consolidated Farms Tab with 4 sub-tabs
function FarmsTab() {
  const [farmSubTab, setFarmSubTab] = useState('farms-overview')
  
  const farmSubTabs = [
    { id: 'farms-overview', label: 'Overview', component: <FarmsPage /> },
    { id: 'farm-deployment', label: 'Deployment', component: <div className="p-6 text-center">Farm Deployment Tools</div> },
    { id: 'farm-monitoring', label: 'Monitoring', component: <div className="p-6 text-center">Farm Performance Monitoring</div> },
    { id: 'farm-optimization', label: 'Optimization', component: <div className="p-6 text-center">Farm Strategy Optimization</div> }
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
          <TabsList className="grid w-full grid-cols-4 bg-emerald-50">
            {farmSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800"
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

// Consolidated Goals Tab with 4 sub-tabs  
function GoalsTab() {
  const [goalSubTab, setGoalSubTab] = useState('goals-overview')
  
  const goalSubTabs = [
    { id: 'goals-overview', label: 'Overview', component: <GoalsPage /> },
    { id: 'goal-tracking', label: 'Tracking', component: <div className="p-6 text-center">Goal Progress Tracking</div> },
    { id: 'goal-analytics', label: 'Analytics', component: <div className="p-6 text-center">Goal Performance Analytics</div> },
    { id: 'goal-calendar', label: 'Calendar', component: <div className="p-6 text-center">Goal Timeline Calendar</div> }
  ]
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-600" />
          Goals & Objectives
        </CardTitle>
        <CardDescription>Set, track and achieve trading objectives</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={goalSubTab} onValueChange={setGoalSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-amber-50">
            {goalSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800"
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

// Consolidated Advanced Tab with 9 feature sub-tabs
function AdvancedTab() {
  const [advancedSubTab, setAdvancedSubTab] = useState('analytics')
  
  const advancedSubTabs = [
    { id: 'analytics', label: 'Analytics', component: <AnalyticsPage /> },
    { id: 'comprehensive-analytics', label: 'Comprehensive Analytics', component: <ComprehensiveAnalyticsPage /> },
    { id: 'knowledge-graph', label: 'Knowledge Graph', component: <KnowledgeGraphPage /> },
    { id: 'python-analysis', label: 'Python Analysis', component: <PythonAnalysisPage /> },
    { id: 'eliza-ai', label: 'Eliza AI', component: <ElizaPage /> },
    { id: 'defi-lending', label: 'DeFi Lending', component: <DeFiLendingPage /> },
    { id: 'persistence', label: 'Persistence', component: <PersistencePage /> },
    { id: 'portfolio', label: 'Portfolio', component: <PortfolioTab /> },
    { id: 'risk', label: 'Risk Management', component: <div className="p-6 text-center">Risk Management Tools</div> }
  ]
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          Advanced Features
        </CardTitle>
        <CardDescription>Professional trading tools and advanced analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={advancedSubTab} onValueChange={setAdvancedSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50">
            {advancedSubTabs.slice(0, 3).map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsList className="grid w-full grid-cols-3 bg-gray-50">
            {advancedSubTabs.slice(3, 6).map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsList className="grid w-full grid-cols-3 bg-gray-50">
            {advancedSubTabs.slice(6, 9).map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
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
        <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 via-violet-600 to-amber-600 bg-clip-text text-transparent">
          Loading Dashboard
        </h2>
        <p className="text-gray-600">Initializing trading systems...</p>
      </div>
    </div>
  )
}

// Mobile Sidebar Component
function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-emerald-200/50">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
          Cival Dashboard
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <SidebarLink icon={<BarChart3 className="h-4 w-4" />} label="Overview" />
          <SidebarLink icon={<PieChart className="h-4 w-4" />} label="Portfolio" />
          <SidebarLink icon={<Bot className="h-4 w-4" />} label="Expert Agents" />
          <SidebarLink icon={<Target className="h-4 w-4" />} label="Trading Farms" />
          <SidebarLink icon={<Activity className="h-4 w-4" />} label="Analytics" />
        </div>
      </nav>
    </div>
  )
}

// Desktop Sidebar Component
function DesktopSidebar() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-emerald-200/50">
        <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-violet-600 to-amber-600 bg-clip-text text-transparent">
          Cival Dashboard
        </h2>
        <p className="text-sm text-gray-600 mt-1">AI Trading Platform</p>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <SidebarLink icon={<BarChart3 className="h-4 w-4" />} label="Overview" />
          <SidebarLink icon={<PieChart className="h-4 w-4" />} label="Portfolio" />
          <SidebarLink icon={<Bot className="h-4 w-4" />} label="Expert Agents" />
          <SidebarLink icon={<Target className="h-4 w-4" />} label="Trading Farms" />
          <SidebarLink icon={<Activity className="h-4 w-4" />} label="Analytics" />
        </div>
      </nav>
      
      <div className="p-4 border-t border-emerald-200/50">
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">System Online</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1">All systems operational</p>
        </div>
      </div>
    </div>
  )
}

// Sidebar Link Component
function SidebarLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800">
      {icon}
      {label}
    </Button>
  )
}

export default ModernDashboardV4