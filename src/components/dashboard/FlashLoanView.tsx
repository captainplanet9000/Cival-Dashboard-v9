/**
 * Flash Loan View Component
 * Automated arbitrage and flash loan management interface
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Activity,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  PlayCircle,
  PauseCircle,
  Eye,
  ExternalLink
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

import { useAppStore, FlashLoanOpportunity, FlashLoanTransaction } from '@/lib/stores/app-store'
import { 
  ArbitrageOpportunity, 
  FlashLoanExecution,
  FlashLoanProtocol,
  ExecutionStrategy
} from '@/lib/services/flashloan-manager-service'

export function FlashLoanView() {
  const [activeTab, setActiveTab] = useState('opportunities')
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Data states
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [executions, setExecutions] = useState<FlashLoanExecution[]>([])
  const [protocols, setProtocols] = useState<FlashLoanProtocol[]>([])
  const [strategies, setStrategies] = useState<ExecutionStrategy[]>([])
  const [performanceStats, setPerformanceStats] = useState({
    totalExecutions: 0,
    successfulExecutions: 0,
    totalProfitUSD: 0,
    totalVolumeUSD: 0,
    averageExecutionTime: 0,
    successRate: 0
  })

  // Store integration
  const {
    flashLoanOpportunities,
    flashLoanTransactions,
    setFlashLoanOpportunities,
    addFlashLoanTransaction
  } = useAppStore()

  // Initialize service
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { flashLoanManagerService } = await import('@/lib/services/flashloan-manager-service')
      const [opps, execs, protos, strats, stats] = await Promise.all([
        flashLoanManagerService.getCurrentOpportunities(),
        flashLoanManagerService.getExecutionHistory(20),
        flashLoanManagerService.getProtocols(),
        flashLoanManagerService.getStrategies(),
        flashLoanManagerService.getPerformanceStats()
      ])

      setOpportunities(opps)
      setExecutions(execs)
      setProtocols(protos)
      setStrategies(strats)
      setPerformanceStats(stats)
    } catch (error) {
      console.error('Error loading flash loan data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMonitoring = async () => {
    const { flashLoanManagerService } = await import('@/lib/services/flashloan-manager-service')
    if (isRunning) {
      flashLoanManagerService.stop()
      setIsRunning(false)
    } else {
      await flashLoanManagerService.start()
      setIsRunning(true)
    }
  }

  // Generate performance chart data
  const getPerformanceChartData = () => {
    const recentExecutions = executions.slice(0, 10).reverse()
    return recentExecutions.map((exec, index) => ({
      execution: `#${index + 1}`,
      profit: exec.actual?.profit || 0,
      gas: exec.actual?.gasUsed || 0,
      time: exec.actual?.executionTime || 0
    }))
  }

  // Generate protocol distribution data
  const getProtocolDistribution = () => {
    const protocolStats = protocols.map(protocol => ({
      name: protocol.name,
      executions: executions.filter(e => e.protocol === protocol.id).length,
      volume: executions
        .filter(e => e.protocol === protocol.id)
        .reduce((sum, e) => sum + e.assets.reduce((vol, a) => vol + a.amount, 0), 0)
    }))

    return protocolStats.filter(p => p.executions > 0)
  }

  // Opportunity card component
  const OpportunityCard = ({ opportunity }: { opportunity: ArbitrageOpportunity }) => (
    <Card className="border-l-4 border-emerald-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
              {opportunity.symbol.substring(0, 2)}
            </div>
            <div>
              <div className="font-semibold">{opportunity.symbol}</div>
              <div className="text-xs text-gray-500">
                {opportunity.exchangeFrom} → {opportunity.exchangeTo}
              </div>
            </div>
          </div>
          <Badge variant={
            opportunity.riskLevel === 'low' ? 'default' :
            opportunity.riskLevel === 'medium' ? 'secondary' : 'destructive'
          }>
            {opportunity.riskLevel.toUpperCase()}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500">Spread</div>
            <div className="font-semibold text-emerald-600">
              {opportunity.spreadPercentage.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Est. Profit</div>
            <div className="font-semibold text-emerald-600">
              ${opportunity.netProfitUSD.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Capital Required</div>
            <div className="font-semibold">
              ${opportunity.requiredCapitalUSD.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Time to Execute</div>
            <div className="font-semibold">
              {opportunity.timeToExecute.toFixed(0)}s
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Expires: {opportunity.expiresAt.toLocaleTimeString()}
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600"
            onClick={async () => {
              // Execute opportunity
              const { flashLoanManagerService } = await import('@/lib/services/flashloan-manager-service')
              flashLoanManagerService.executeFlashLoanArbitrage(opportunity, 'simple-arbitrage')
            }}
          >
            <PlayCircle className="w-3 h-3 mr-1" />
            Execute
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Execution card component
  const ExecutionCard = ({ execution }: { execution: FlashLoanExecution }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              execution.status === 'success' ? 'bg-emerald-500' :
              execution.status === 'failed' ? 'bg-red-500' :
              execution.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
            }`}>
              {execution.assets[0]?.symbol.substring(0, 2) || 'FL'}
            </div>
            <div>
              <div className="font-semibold">Flash Loan #{execution.id.substring(0, 8)}</div>
              <div className="text-xs text-gray-500">
                {execution.protocol} • {execution.createdAt.toLocaleString()}
              </div>
            </div>
          </div>
          <Badge variant={
            execution.status === 'success' ? 'default' :
            execution.status === 'failed' ? 'destructive' :
            execution.status === 'pending' ? 'secondary' : 'outline'
          }>
            {execution.status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500">Estimated Profit</div>
            <div className="font-semibold">
              ${execution.simulation.estimatedProfit.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Actual Profit</div>
            <div className={`font-semibold ${
              execution.actual?.profit ? 
                execution.actual.profit > 0 ? 'text-emerald-600' : 'text-red-600' : ''
            }`}>
              {execution.actual?.profit ? 
                `$${execution.actual.profit.toFixed(2)}` : 'N/A'
              }
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Gas Used</div>
            <div className="font-semibold">
              {execution.actual?.gasUsed?.toLocaleString() || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Execution Time</div>
            <div className="font-semibold">
              {execution.actual?.executionTime ? 
                `${execution.actual.executionTime.toFixed(1)}s` : 'N/A'
              }
            </div>
          </div>
        </div>

        {execution.txHash && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 font-mono">
              {execution.txHash.substring(0, 10)}...{execution.txHash.substring(-8)}
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
            Flash Loan Trading
          </h1>
          <p className="text-gray-500">Automated arbitrage with flash loans across protocols</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={toggleMonitoring}
            className={isRunning ? 'bg-red-50 border-red-200 text-red-600' : ''}
          >
            {isRunning ? (
              <>
                <PauseCircle className="w-4 h-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {performanceStats.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {performanceStats.successfulExecutions}/{performanceStats.totalExecutions} trades
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${performanceStats.totalProfitUSD.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">Lifetime earnings</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {performanceStats.averageExecutionTime.toFixed(1)}s
            </div>
            <div className="text-xs text-gray-500 mt-1">Speed to completion</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{opportunities.length}</div>
            <div className="text-xs text-gray-500 mt-1">
              {isRunning ? 'Monitoring live' : 'Paused'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          {opportunities.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {opportunities.slice(0, 6).map(opportunity => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Target className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Opportunities</h3>
                <p className="text-gray-500 mb-4">
                  {isRunning ? 'Scanning markets for arbitrage opportunities...' : 'Start monitoring to find opportunities'}
                </p>
                {!isRunning && (
                  <Button onClick={toggleMonitoring}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Monitoring
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {executions.length > 0 ? (
            <div className="space-y-3">
              {executions.slice(0, 10).map(execution => (
                <ExecutionCard key={execution.id} execution={execution} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Activity className="w-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Executions</h3>
                <p className="text-gray-500">Flash loan executions will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protocols.map(protocol => (
              <Card key={protocol.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{protocol.name}</CardTitle>
                    <Badge variant={protocol.isActive ? 'default' : 'secondary'}>
                      {protocol.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fee</span>
                    <span className="font-semibold">{protocol.feePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Loan</span>
                    <span className="font-semibold">${protocol.maxLoanUSD.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gas Estimate</span>
                    <span className="font-semibold">{protocol.gasEstimate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supported Assets</span>
                    <span className="font-semibold">{protocol.supportedAssets.length}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Performance Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Execution Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getPerformanceChartData()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="execution" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="profit" fill="#10b981" name="Profit ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Protocol Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Protocol Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getProtocolDistribution().map(protocol => (
                  <div key={protocol.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{protocol.name}</div>
                      <div className="text-sm text-gray-500">{protocol.executions} executions</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${protocol.volume.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Volume</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}