/**
 * LangChain Dashboard Tab
 * Comprehensive dashboard showing all LangChain integration features
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Activity, 
  Tool, 
  MessageSquare, 
  BarChart3,
  Settings,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import LangChain components
import LangChainAGUIInterface from '@/components/langchain/LangChainAGUIInterface'
import MCPIntegrationPanel from '@/components/langchain/MCPIntegrationPanel'
import LangChainStatusWidget from '@/components/langchain/LangChainStatusWidget'
import AgentRecommendations from '@/components/langchain/AgentRecommendations'
import LangSmithObservabilityDashboard from '@/components/langchain/LangSmithObservabilityDashboard'
import AdvancedLearningDashboard from '@/components/langchain/AdvancedLearningDashboard'

// Import services
import { langGraphOrchestrator } from '@/lib/langchain/LangGraphOrchestrator'
import { langChainService } from '@/lib/langchain/LangChainService'
import { langChainMCPIntegration } from '@/lib/langchain/MCPIntegration'

interface LangChainDashboardTabProps {
  className?: string
}

export function LangChainDashboardTab({ className }: LangChainDashboardTabProps) {
  const [orchestratorStatus, setOrchestratorStatus] = useState<any>({})
  const [serviceHealth, setServiceHealth] = useState<any>({})
  const [mcpStats, setMcpStats] = useState<any>({})
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT')

  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT', 'MATIC/USDT']

  useEffect(() => {
    const updateData = async () => {
      try {
        // Get orchestrator status
        const status = langGraphOrchestrator.getStatus()
        setOrchestratorStatus(status)

        // Get service health
        const health = await langChainService.healthCheck()
        setServiceHealth(health)

        // Get MCP stats
        const stats = langChainMCPIntegration.getIntegrationStats()
        setMcpStats(stats)

      } catch (error) {
        console.error('Failed to update LangChain dashboard data:', error)
      }
    }

    updateData()
    const interval = setInterval(updateData, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-500" />
            LangChain AI Trading
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced AI-powered trading with LLM agents, AG-UI protocol, and MCP tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {orchestratorStatus.totalAgents || 0} Agents
          </Badge>
          <Badge variant="outline" className="text-sm">
            {mcpStats.totalTools || 0} Tools
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{orchestratorStatus.activeAgents || 0}</div>
                <div className="text-sm text-gray-500">Active AI Agents</div>
              </div>
            </div>
            <div className="mt-2">
              <Progress 
                value={orchestratorStatus.totalAgents > 0 ? 
                  (orchestratorStatus.activeAgents / orchestratorStatus.totalAgents) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${orchestratorStatus.totalPnL?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-500">AI Agents P&L</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Portfolio: ${orchestratorStatus.totalValue?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tool className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{mcpStats.totalCalls || 0}</div>
                <div className="text-sm text-gray-500">MCP Tool Calls</div>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-500">
                Success: {((mcpStats.successRate || 0) * 100).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">${serviceHealth.totalDailyCost?.toFixed(2) || '0.00'}</div>
                <div className="text-sm text-gray-500">LLM Usage Cost</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {serviceHealth.availableModels || 0} models available
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="tools">MCP Tools</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="observability">Observability</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <LangChainStatusWidget />

            {/* Quick Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Quick AI Insights
                </CardTitle>
                <CardDescription>
                  Select a trading pair to get AI recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {symbols.map(symbol => (
                      <Button
                        key={symbol}
                        variant={selectedSymbol === symbol ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSymbol(symbol)}
                      >
                        {symbol}
                      </Button>
                    ))}
                  </div>
                  <AgentRecommendations 
                    symbol={selectedSymbol} 
                    compact={true}
                    maxRecommendations={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Orchestrator Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Agent Orchestrator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant={orchestratorStatus.isRunning ? 'default' : 'secondary'}>
                      {orchestratorStatus.isRunning ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{orchestratorStatus.totalAgents || 0}</div>
                      <div className="text-gray-500">Total Agents</div>
                    </div>
                    <div>
                      <div className="font-medium">{orchestratorStatus.activeAgents || 0}</div>
                      <div className="text-gray-500">Active Agents</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Portfolio Value</span>
                      <span className="font-medium">${orchestratorStatus.totalValue?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Total P&L</span>
                      <span className={cn(
                        'font-medium',
                        (orchestratorStatus.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        ${orchestratorStatus.totalPnL?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Service Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">LangChain Service</span>
                    <Badge variant={serviceHealth.status === 'healthy' ? 'default' : 'destructive'}>
                      {serviceHealth.status || 'Unknown'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{serviceHealth.availableModels || 0}</div>
                      <div className="text-gray-500">Available Models</div>
                    </div>
                    <div>
                      <div className="font-medium">
                        {serviceHealth.withinCostLimits ? 'Yes' : 'No'}
                      </div>
                      <div className="text-gray-500">Within Limits</div>
                    </div>
                  </div>

                  {serviceHealth.errors && serviceHealth.errors.length > 0 && (
                    <div className="text-sm text-red-600">
                      {serviceHealth.errors.slice(0, 2).map((error: string, index: number) => (
                        <div key={index} className="truncate">{error}</div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Chat Tab */}
        <TabsContent value="chat">
          <LangChainAGUIInterface />
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">AI Trading Recommendations</h3>
            <div className="flex gap-2">
              {symbols.map(symbol => (
                <Button
                  key={symbol}
                  variant={selectedSymbol === symbol ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSymbol(symbol)}
                >
                  {symbol}
                </Button>
              ))}
            </div>
          </div>
          <AgentRecommendations symbol={selectedSymbol} />
        </TabsContent>

        {/* MCP Tools Tab */}
        <TabsContent value="tools">
          <MCPIntegrationPanel />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-gray-500 py-8">
                    Performance charts and analytics coming soon
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Agent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-gray-500 py-8">
                    Agent activity timeline coming soon
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Observability Tab */}
        <TabsContent value="observability">
          <LangSmithObservabilityDashboard />
        </TabsContent>

        {/* Advanced Learning Tab */}
        <TabsContent value="learning">
          <AdvancedLearningDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LangChainDashboardTab