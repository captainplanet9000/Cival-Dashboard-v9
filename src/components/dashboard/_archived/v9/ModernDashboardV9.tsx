'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Activity, 
  Bot, 
  Zap, 
  Target, 
  TrendingUp, 
  PieChart, 
  Shield, 
  FileText,
  Settings,
  Database,
  Wifi,
  WifiOff,
  CheckCircle
} from 'lucide-react'

// Import dashboard components
import OverviewTab from '@/components/dashboard/tabs/OverviewTab'
import TradingTab from '@/components/dashboard/tabs/TradingTab'
import PortfolioTab from '@/components/dashboard/tabs/PortfolioTab'
import AnalyticsTab from '@/components/dashboard/tabs/AnalyticsTab'
import RiskTab from '@/components/dashboard/tabs/RiskTab'
import SettingsTab from '@/components/dashboard/tabs/SettingsTab'

// Import enhanced autonomous agent components
import { ConnectedAgentsTab } from '@/components/dashboard/ConnectedAgentsTab'
import { ConnectedFarmsTab } from '@/components/dashboard/ConnectedFarmsTab'
import { ConnectedGoalsTab } from '@/components/dashboard/ConnectedGoalsTab'
import { AutonomousOverviewTab } from '@/components/dashboard/AutonomousOverviewTab'
import FileManagerDashboard from '@/components/files/FileManagerDashboard'

// Import comprehensive wallet system
import { ComprehensiveWalletDashboard } from '@/components/wallet/ComprehensiveWalletDashboard'

// Import real-time services
import { useRedisRealtime } from '@/hooks/use-redis-realtime'
import { useSupabaseRealtime } from '@/hooks/use-supabase-realtime'
import { createBrowserClient } from '@/utils/supabase/client'

interface DashboardTab {
  id: string
  label: string
  icon: React.ReactNode
  component: React.ReactNode
  badge?: string
  description?: string
}

// Connection status component
const ConnectionStatus: React.FC<{ 
  service: string
  connected: boolean
  data?: any
}> = ({ service, connected, data }) => (
  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
    {connected ? (
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <WifiOff className="h-3 w-3 text-orange-500" />
    )}
    <span className="text-xs font-medium">
      {service} {connected ? 'Connected' : 'Offline'}
    </span>
    {data && (
      <Badge variant="outline" className="text-xs">
        {typeof data === 'object' ? Object.keys(data).length : data} items
      </Badge>
    )}
  </div>
)

// Enhanced Overview Tab with real-time data
const ConnectedOverviewTab: React.FC = () => {
  const { data: redisData, connected: redisConnected } = useRedisRealtime(['portfolio', 'agents', 'trades'])
  const { data: supabaseData, connected: supabaseConnected } = useSupabaseRealtime('trading')

  return (
    <div className="space-y-6">
      {/* Real-time Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Autonomous Trading System Status
          </CardTitle>
          <CardDescription>
            Complete autonomous agent creation system with memory, learning & farm coordination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-800">Agent Memory System</span>
              </div>
              <p className="text-sm text-emerald-700">Learning, adaptation & pattern recognition</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Multi-Strategy Farms</span>
              </div>
              <p className="text-sm text-blue-700">45-agent coordinated trading with cross-strategy signals</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">Autonomous Trading</span>
              </div>
              <p className="text-sm text-purple-700">High-frequency execution with real-time decisions</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <ConnectionStatus 
              service="Supabase" 
              connected={supabaseConnected} 
              data={supabaseData}
            />
            <ConnectionStatus 
              service="Redis" 
              connected={redisConnected} 
              data={redisData}
            />
            <ConnectionStatus 
              service="Supabase" 
              connected={supabaseConnected} 
              data={supabaseData}
            />
            <ConnectionStatus 
              service="WebSocket" 
              connected={true} 
              data="Live"
            />
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Overview with real-time data */}
      <OverviewTab />
      
      {/* Live Data Preview */}
      {(redisData || supabaseData) && (
        <Card>
          <CardHeader>
            <CardTitle>Live Data Stream</CardTitle>
            <CardDescription>
              Real-time updates from connected services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {redisData && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Redis Cache</h4>
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(redisData, null, 2)}
                  </pre>
                </div>
              )}
              {supabaseData && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Supabase Database</h4>
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(supabaseData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Use the enhanced autonomous components directly

export default function ModernDashboardV9() {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Initialize Supabase client
  const supabase = createBrowserClient()
  
  // Real-time connections
  const { data: portfolioData, connected: portfolioConnected } = useRedisRealtime(['portfolio'])
  const { data: supabaseData, connected: supabaseConnected } = useSupabaseRealtime('dashboard')

  const tabs: DashboardTab[] = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <Activity className="h-4 w-4" />, 
      component: <AutonomousOverviewTab />,
      description: 'Complete autonomous trading system status & capabilities'
    },
    { 
      id: 'agents', 
      label: 'Agents', 
      icon: <Bot className="h-4 w-4" />, 
      component: <ConnectedAgentsTab />, 
      badge: portfolioConnected ? '45' : '0',
      description: 'Autonomous AI agents with memory, learning & real-time execution'
    },
    { 
      id: 'farms', 
      label: 'Farms', 
      icon: <Zap className="h-4 w-4" />, 
      component: <ConnectedFarmsTab />,
      description: 'Multi-strategy farms with cross-agent coordination & shared learning'
    },
    { 
      id: 'goals', 
      label: 'Goals', 
      icon: <Target className="h-4 w-4" />, 
      component: <ConnectedGoalsTab />,
      description: 'Intelligent goal tracking with AI optimization & progress insights'
    },
    { 
      id: 'wallet', 
      label: 'Wallet', 
      icon: <Database className="h-4 w-4" />, 
      component: <ComprehensiveWalletDashboard />,
      description: 'Multi-chain wallets, vault banking & master wallet coordination'
    },
    { 
      id: 'trading', 
      label: 'Trading', 
      icon: <TrendingUp className="h-4 w-4" />, 
      component: <TradingTab />,
      description: 'Live trading with real-time data'
    },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      icon: <PieChart className="h-4 w-4" />, 
      component: <PortfolioTab />,
      description: 'Portfolio tracking with live updates'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: <TrendingUp className="h-4 w-4" />, 
      component: <AnalyticsTab />,
      description: 'Advanced analytics dashboard'
    },
    { 
      id: 'risk', 
      label: 'Risk', 
      icon: <Shield className="h-4 w-4" />, 
      component: <RiskTab />,
      description: 'Risk management with alerts'
    },
    { 
      id: 'files', 
      label: 'Files', 
      icon: <FileText className="h-4 w-4" />, 
      component: <FileManagerDashboard />,
      description: 'File management with Supabase storage'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="h-4 w-4" />, 
      component: <SettingsTab />,
      description: 'System configuration'
    }
  ]

  const currentTab = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="min-h-screen bg-background">
      {/* Header with connection status */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">AI Trading Dashboard v9</h1>
            <Badge variant="outline" className="text-xs">
              Redis & Supabase Enhanced
            </Badge>
          </div>
          
          {/* Real-time status indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {portfolioConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
              <span className="text-sm text-muted-foreground">Redis</span>
            </div>
            <div className="flex items-center gap-1">
              {supabaseConnected ? (
                <Database className="h-4 w-4 text-green-500" />
              ) : (
                <Database className="h-4 w-4 text-orange-500" />
              )}
              <span className="text-sm text-muted-foreground">Supabase</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside 
          className="bg-card border-r flex flex-col"
          initial={false}
          animate={{ width: sidebarCollapsed ? 60 : 240 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full justify-start"
            >
              <Activity className="h-4 w-4" />
              {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
            </Button>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`w-full justify-start ${sidebarCollapsed ? 'px-2' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {tab.icon}
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate">{tab.label}</span>
                      {tab.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {tab.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </Button>
            ))}
          </nav>
        </motion.aside>

        {/* Main content */}
        <main className="flex-1">
          <div className="p-6">
            {/* Tab header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {currentTab?.icon}
                <h2 className="text-2xl font-bold">{currentTab?.label}</h2>
                {currentTab?.badge && (
                  <Badge variant="secondary">{currentTab.badge}</Badge>
                )}
              </div>
              {currentTab?.description && (
                <p className="text-muted-foreground">{currentTab.description}</p>
              )}
            </div>

            {/* Tab content with animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentTab?.component}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}