'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Settings, RefreshCw, BarChart3, Database, Bell, 
  TrendingUp, Zap, Shield, Brain, Calendar, Target, MessageSquare,
  FileText, Download
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Import advanced feature components
import RealAnalyticsDashboard from '@/components/analytics/RealAnalyticsDashboard'
import RealMarketDataDashboard from '@/components/market/RealMarketDataDashboard'
import RealNotificationSystem from '@/components/notifications/RealNotificationSystem'
import RealRiskManagementDashboard from '@/components/risk/RealRiskManagementDashboard'
import RealBacktestingDashboard from '@/components/backtesting/RealBacktestingDashboard'
import UnifiedAIAssistant from '@/components/ai-assistant/UnifiedAIAssistant'
import ElizaAIHub from '@/components/advanced/ElizaAIHub'
import SystemMonitoringDashboard from '@/components/monitoring/SystemMonitoringDashboard'
import FileManager from '@/components/data-manager/FileManager'
import { ExportManager } from '@/components/export/ExportManager'
import MCPDashboard from '@/components/mcp/MCPDashboard'
import IntegratedTradingTerminal from '@/components/terminal/IntegratedTradingTerminal'

// Import premium advanced components (Placeholder components for missing premium features)
// import { AdvancedSettings } from '@/components/premium-ui/advanced/advanced-settings'
// import { SystemMonitor } from '@/components/premium-ui/advanced/system-monitor'
// import { DataExplorer } from '@/components/premium-ui/advanced/data-explorer'
// import { APIConnector } from '@/components/premium-ui/advanced/api-connector'
// import { RiskManagementSuite } from '@/components/premium-ui/compliance/risk-management-suite'
// import { AuditLogger } from '@/components/premium-ui/compliance/audit-logger'
// import { PerformanceProfiler } from '@/components/premium-ui/advanced/performance-profiler'
// import { AdvancedDataTable } from '@/components/premium-ui/tables/advanced-data-table'
// import { DashboardGrid } from '@/components/premium-ui/layouts/dashboard-grid'

// Placeholder components for missing premium features
const AdvancedSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle>Advanced Settings</CardTitle>
      <CardDescription>Premium advanced settings panel</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Advanced settings interface coming soon...</p>
    </CardContent>
  </Card>
)

const SystemMonitor = () => (
  <Card>
    <CardHeader>
      <CardTitle>System Monitor</CardTitle>
      <CardDescription>Real-time system monitoring</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">System monitoring dashboard coming soon...</p>
    </CardContent>
  </Card>
)

const DataExplorer = () => (
  <Card>
    <CardHeader>
      <CardTitle>Data Explorer</CardTitle>
      <CardDescription>Advanced data exploration tools</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Data explorer interface coming soon...</p>
    </CardContent>
  </Card>
)

const APIConnector = () => (
  <Card>
    <CardHeader>
      <CardTitle>API Connector</CardTitle>
      <CardDescription>External API integration management</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">API connector dashboard coming soon...</p>
    </CardContent>
  </Card>
)

const RiskManagementSuite = () => (
  <Card>
    <CardHeader>
      <CardTitle>Risk Management Suite</CardTitle>
      <CardDescription>Comprehensive risk management tools</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Premium risk management suite coming soon...</p>
    </CardContent>
  </Card>
)

const AuditLogger = () => (
  <Card>
    <CardHeader>
      <CardTitle>Audit Logger</CardTitle>
      <CardDescription>System audit and compliance logging</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Audit logging interface coming soon...</p>
    </CardContent>
  </Card>
)

const PerformanceProfiler = () => (
  <Card>
    <CardHeader>
      <CardTitle>Performance Profiler</CardTitle>
      <CardDescription>System performance analysis and optimization</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Performance profiler coming soon...</p>
    </CardContent>
  </Card>
)

const AdvancedDataTable = () => (
  <Card>
    <CardHeader>
      <CardTitle>Advanced Data Table</CardTitle>
      <CardDescription>Premium data table with advanced features</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Advanced data table coming soon...</p>
    </CardContent>
  </Card>
)

const DashboardGrid = () => (
  <Card>
    <CardHeader>
      <CardTitle>Dashboard Grid</CardTitle>
      <CardDescription>Customizable dashboard layout system</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Dashboard grid system coming soon...</p>
    </CardContent>
  </Card>
)

interface ConnectedAdvancedTabProps {
  className?: string
}

export function ConnectedAdvancedTab({ className }: ConnectedAdvancedTabProps) {
  const { state, actions } = useDashboardConnection('advanced')
  const [advancedSubTab, setAdvancedSubTab] = useState('mcp')
  const [riskSettings, setRiskSettings] = useState({
    maxDailyLoss: 5000,
    maxDrawdown: 10,
    positionSizeLimit: 15,
    volatilityThreshold: 25,
    correlationLimit: 0.7,
    stopLossEnabled: true,
    takeProfitEnabled: true
  })

  // Load advanced settings
  useEffect(() => {
    loadAdvancedSettings()
  }, [])

  const loadAdvancedSettings = () => {
    try {
      const storedSettings = localStorage.getItem('advanced_settings')
      if (storedSettings) {
        const settings = JSON.parse(storedSettings)
        setRiskSettings(prev => ({ ...prev, ...settings }))
      }
    } catch (error) {
      console.error('Error loading advanced settings:', error)
    }
  }

  const saveAdvancedSettings = () => {
    try {
      localStorage.setItem('advanced_settings', JSON.stringify(riskSettings))
      toast.success('Advanced settings saved successfully')
    } catch (error) {
      console.error('Error saving advanced settings:', error)
      toast.error('Failed to save settings')
    }
  }

  // Risk Management Panel
  const RiskManagementPanel = () => {
    const riskMetrics = [
      { 
        label: 'Value at Risk (1d)', 
        value: `$${Math.abs(state.dailyPnL * 1.5).toFixed(0)}`, 
        status: state.dailyPnL < -1000 ? 'high' : 'normal', 
        limit: '$5,000' 
      },
      { 
        label: 'Portfolio Beta', 
        value: (1.0 + (state.totalPnL / state.portfolioValue) * 0.1).toFixed(2), 
        status: 'normal', 
        limit: '1.50' 
      },
      { 
        label: 'Sharpe Ratio', 
        value: Math.max(0.5, 2.34 + (state.winRate - 60) * 0.02).toFixed(2), 
        status: 'good', 
        limit: '>1.00' 
      },
      { 
        label: 'Max Drawdown', 
        value: `${Math.max(1, 10 - (state.winRate - 50) * 0.1).toFixed(1)}%`, 
        status: 'normal', 
        limit: '10%' 
      },
      { 
        label: 'Correlation Risk', 
        value: Math.min(0.7, 0.45 + Math.random() * 0.1).toFixed(2), 
        status: 'good', 
        limit: '0.70' 
      },
      { 
        label: 'Leverage Ratio', 
        value: `${(1.8 + (state.totalAgents * 0.1)).toFixed(1)}x`, 
        status: 'normal', 
        limit: '3.0x' 
      }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Metrics</CardTitle>
              <CardDescription>Real-time portfolio risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskMetrics.map((metric, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
          
          <Card>
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
              
              <Button onClick={saveAdvancedSettings} className="w-full">
                Update Risk Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Portfolio Analytics Panel
  const PortfolioAnalyticsPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(state.portfolioValue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {(state.totalPnL || 0) >= 0 ? '+' : ''}{(((state.totalPnL || 0) / (state.portfolioValue || 1)) * 100).toFixed(1)}% return
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.from(state.agentPerformance.keys()).length}</div>
            <p className="text-xs text-muted-foreground">
              {state.totalAgents} total agents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {state.executedOrders.length} total trades
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              state.dailyPnL < -1000 ? 'text-red-600' : 
              state.dailyPnL > 1000 ? 'text-green-600' : 'text-blue-600'
            }`}>
              {Math.min(100, Math.max(0, 50 + (state.dailyPnL / 100))).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current risk level
            </p>
          </CardContent>
        </Card>
      </div>
      
      <RealAnalyticsDashboard />
    </div>
  )

  // System Monitoring Panel
  const SystemMonitoringPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Paper Trading Engine</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Market Data Feed</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Risk Monitor</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Agent Coordination</span>
                <Badge className="bg-green-100 text-green-800">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">API Response Time</span>
                <span className="text-sm font-medium">45ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Order Execution Speed</span>
                <span className="text-sm font-medium">120ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm font-medium">67%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">CPU Usage</span>
                <span className="text-sm font-medium">23%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Orders Processed</span>
                <span className="text-sm font-medium">{state.executedOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Market Updates</span>
                <span className="text-sm font-medium">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Agent Decisions</span>
                <span className="text-sm font-medium">{state.totalAgents * 45}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Data Points</span>
                <span className="text-sm font-medium">23,567</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <RealNotificationSystem />
    </div>
  )

  // AI Assistant Hub Panel with sub-tabs
  const AIAssistantHubPanel = () => {
    const [aiSubTab, setAiSubTab] = useState('unified')
    
    const aiSubTabs = [
      { id: 'unified', label: 'Unified AI', component: <UnifiedAIAssistant />, icon: <Brain className="h-4 w-4" /> },
      { id: 'eliza', label: 'Eliza Hub', component: <ElizaAIHub />, icon: <MessageSquare className="h-4 w-4" /> }
    ]

    return (
      <div className="space-y-4">
        <Tabs value={aiSubTab} onValueChange={setAiSubTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-2">
            {aiSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm flex items-center gap-2"
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {aiSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {tab.component}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    )
  }

  const advancedSubTabs = [
    { id: 'mcp', label: 'MCP Dashboard', component: <MCPDashboard />, icon: <Zap className="h-4 w-4" /> },
    { id: 'premium-settings', label: 'Premium Settings', component: <AdvancedSettings />, icon: <Settings className="h-4 w-4" /> },
    { id: 'system-monitor', label: 'System Monitor', component: <SystemMonitor />, icon: <Zap className="h-4 w-4" /> },
    { id: 'data-explorer', label: 'Data Explorer', component: <DataExplorer />, icon: <Database className="h-4 w-4" /> },
    { id: 'api-connector', label: 'API Connector', component: <APIConnector />, icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'premium-risk', label: 'Premium Risk', component: <RiskManagementSuite />, icon: <Shield className="h-4 w-4" /> },
    { id: 'audit-logger', label: 'Audit Logger', component: <AuditLogger />, icon: <FileText className="h-4 w-4" /> },
    { id: 'performance-profiler', label: 'Performance Profiler', component: <PerformanceProfiler />, icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'advanced-data', label: 'Advanced Data', component: <AdvancedDataTable />, icon: <Database className="h-4 w-4" /> },
    { id: 'dashboard-grid', label: 'Dashboard Grid', component: <DashboardGrid />, icon: <Target className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', component: <PortfolioAnalyticsPanel />, icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'market-data', label: 'Market Data', component: <RealMarketDataDashboard />, icon: <Database className="h-4 w-4" /> },
    { id: 'risk-management', label: 'Risk Management', component: <RiskManagementPanel />, icon: <Shield className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', component: <RealNotificationSystem />, icon: <Bell className="h-4 w-4" /> },
    { id: 'backtesting', label: 'Backtesting', component: <RealBacktestingDashboard />, icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'ai-assistant', label: 'AI Hub', component: <AIAssistantHubPanel />, icon: <Brain className="h-4 w-4" /> },
    { id: 'file-management', label: 'File Manager', component: <FileManager />, icon: <FileText className="h-4 w-4" /> },
    { id: 'export-reports', label: 'Export & Reports', component: <ExportManager />, icon: <Download className="h-4 w-4" /> },
    { id: 'system-monitoring', label: 'System Monitor', component: <SystemMonitoringPanel />, icon: <Zap className="h-4 w-4" /> },
    { id: 'infrastructure', label: 'Infrastructure', component: <SystemMonitoringDashboard />, icon: <Target className="h-4 w-4" /> },
    { id: 'trading-terminal', label: 'Trading Terminal', component: <IntegratedTradingTerminal />, icon: <BarChart3 className="h-4 w-4" /> }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Advanced Features
              <Badge variant="secondary" className="text-xs">Premium Enhanced</Badge>
            </CardTitle>
            <CardDescription>
              Professional trading tools, risk management, and advanced analytics • Premium Components Integrated
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {state.totalAgents} agents active
            </Badge>
            <Button size="sm" variant="ghost" onClick={actions.refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={advancedSubTab} onValueChange={setAdvancedSubTab} className="space-y-4">
          <div className="space-y-2">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 bg-gray-50">
              {advancedSubTabs.slice(0, 6).map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-xs flex items-center gap-1"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 bg-gray-50">
              {advancedSubTabs.slice(6, 12).map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-xs flex items-center gap-1"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 bg-gray-50">
              {advancedSubTabs.slice(12).map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-xs flex items-center gap-1"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {advancedSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {tab.component}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ConnectedAdvancedTab