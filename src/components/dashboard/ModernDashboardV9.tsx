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
import AgentsTab from '@/components/dashboard/tabs/AgentsTab'
import TradingTab from '@/components/dashboard/tabs/TradingTab'
import PortfolioTab from '@/components/dashboard/tabs/PortfolioTab'
import AnalyticsTab from '@/components/dashboard/tabs/AnalyticsTab'
import RiskTab from '@/components/dashboard/tabs/RiskTab'
import SettingsTab from '@/components/dashboard/tabs/SettingsTab'

// Import advanced components with Redis/Supabase
import AdvancedFarmsManager from '@/components/farms/AdvancedFarmsManager'
import AdvancedGoalsManager from '@/components/goals/AdvancedGoalsManager'
import FileManagerDashboard from '@/components/files/FileManagerDashboard'

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
            <Database className="h-5 w-5" />
            Real-time Data Connections
          </CardTitle>
          <CardDescription>
            Live connections to Redis cache and Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
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

// Enhanced Agents Tab with real-time agent data
const ConnectedAgentsTab: React.FC = () => {
  const { data: agentData, connected } = useRedisRealtime(['agents', 'agent_performance'])
  
  return (
    <div className="space-y-4">
      {connected && agentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              Live Agent Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {Object.keys(agentData).length} live connections
            </Badge>
          </CardContent>
        </Card>
      )}
      <AgentsTab />
    </div>
  )
}

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
      component: <ConnectedOverviewTab />,
      description: 'Real-time dashboard with Redis & Supabase'
    },
    { 
      id: 'agents', 
      label: 'Agents', 
      icon: <Bot className="h-4 w-4" />, 
      component: <ConnectedAgentsTab />, 
      badge: portfolioConnected ? '4' : '0',
      description: 'AI agents with live performance data'
    },
    { 
      id: 'farms', 
      label: 'Farms', 
      icon: <Zap className="h-4 w-4" />, 
      component: <AdvancedFarmsManager />,
      description: 'Agent farms with Redis coordination'
    },
    { 
      id: 'goals', 
      label: 'Goals', 
      icon: <Target className="h-4 w-4" />, 
      component: <AdvancedGoalsManager />,
      description: 'Smart goals with Supabase persistence'
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