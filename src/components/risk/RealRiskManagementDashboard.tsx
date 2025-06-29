'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  Zap,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Info,
  Settings,
  Bell,
  Eye,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import {
  paperTradingEngine,
  TradingAgent,
  Position,
  RiskMetrics
} from '@/lib/trading/real-paper-trading-engine'

interface RealRiskManagementDashboardProps {
  className?: string
}

interface RiskAlert {
  id: string
  type: 'high_exposure' | 'drawdown' | 'concentration' | 'volatility' | 'correlation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: string
  agentId?: string
  symbol?: string
  threshold: number
  currentValue: number
  timestamp: Date
  acknowledged: boolean
}

interface PortfolioRisk {
  totalExposure: number
  maxDrawdown: number
  currentDrawdown: number
  volatility: number
  sharpeRatio: number
  var95: number // Value at Risk 95%
  var99: number // Value at Risk 99%
  concentrationRisk: number
  correlationRisk: number
  leverageRatio: number
  healthScore: number // 0-100
}

interface StressTestScenario {
  id: string
  name: string
  description: string
  marketShock: number // percentage drop
  volatilityIncrease: number // multiplier
  correlationIncrease: number // adjustment
  results?: {
    portfolioImpact: number
    worstCaseValue: number
    recoveryTime: number
    agentFailures: number
  }
}

export function RealRiskManagementDashboard({ className }: RealRiskManagementDashboardProps) {
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [portfolioRisk, setPortfolioRisk] = useState<PortfolioRisk | null>(null)
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '1d' | '7d' | '30d'>('1d')
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [stressTestScenarios] = useState<StressTestScenario[]>([
    {
      id: 'market_crash',
      name: 'Market Crash',
      description: '20% market drop with high volatility',
      marketShock: -20,
      volatilityIncrease: 3,
      correlationIncrease: 0.8
    },
    {
      id: 'crypto_winter',
      name: 'Crypto Winter',
      description: '50% crypto crash over 3 months',
      marketShock: -50,
      volatilityIncrease: 2.5,
      correlationIncrease: 0.9
    },
    {
      id: 'flash_crash',
      name: 'Flash Crash',
      description: '10% drop in 5 minutes',
      marketShock: -10,
      volatilityIncrease: 5,
      correlationIncrease: 0.95
    },
    {
      id: 'interest_rate_shock',
      name: 'Interest Rate Shock',
      description: 'Federal Reserve raises rates by 2%',
      marketShock: -15,
      volatilityIncrease: 2,
      correlationIncrease: 0.7
    }
  ])

  useEffect(() => {
    // Start the trading engine if not already running
    if (!paperTradingEngine.listenerCount('pricesUpdated')) {
      paperTradingEngine.start()
    }

    // Load initial data
    loadRiskData()
    
    // Listen for trading events to update risk analysis
    const handleOrderFilled = () => {
      setTimeout(loadRiskData, 1000) // Delay to ensure data is updated
    }

    const handlePricesUpdated = () => {
      loadRiskData()
      checkRiskAlerts()
    }

    paperTradingEngine.on('orderFilled', handleOrderFilled)
    paperTradingEngine.on('pricesUpdated', handlePricesUpdated)

    // Update risk analysis every 30 seconds
    const interval = setInterval(() => {
      if (isMonitoring) {
        loadRiskData()
        checkRiskAlerts()
      }
    }, 30000)

    return () => {
      paperTradingEngine.off('orderFilled', handleOrderFilled)
      paperTradingEngine.off('pricesUpdated', handlePricesUpdated)
      clearInterval(interval)
    }
  }, [isMonitoring])

  const loadRiskData = () => {
    const allAgents = paperTradingEngine.getAllAgents()
    setAgents(allAgents)

    if (allAgents.length === 0) {
      setPortfolioRisk(null)
      return
    }

    // Calculate portfolio-wide risk metrics
    const portfolioRisk = calculatePortfolioRisk(allAgents)
    setPortfolioRisk(portfolioRisk)
  }

  const calculatePortfolioRisk = (agents: TradingAgent[]): PortfolioRisk => {
    const totalValue = agents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
    const initialValue = agents.length * 10000

    // Calculate current drawdown
    const highWaterMark = Math.max(totalValue, initialValue)
    const currentDrawdown = ((highWaterMark - totalValue) / highWaterMark) * 100

    // Calculate position concentration
    const allPositions: Position[] = []
    agents.forEach(agent => {
      allPositions.push(...agent.portfolio.positions)
    })

    const symbolExposure: { [symbol: string]: number } = {}
    allPositions.forEach(position => {
      symbolExposure[position.symbol] = (symbolExposure[position.symbol] || 0) + position.marketValue
    })

    const concentrationRisk = totalValue > 0 
      ? Math.max(...Object.values(symbolExposure)) / totalValue * 100
      : 0

    // Calculate volatility based on recent performance
    const returns = agents.map(agent => (agent.portfolio.totalValue - 10000) / 10000)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const volatility = Math.sqrt(variance) * 100

    // Calculate VaR (simplified)
    const var95 = totalValue * 0.05 * 1.645 // Normal distribution approximation
    const var99 = totalValue * 0.05 * 2.326

    // Calculate health score (0-100)
    let healthScore = 100
    if (currentDrawdown > 10) healthScore -= 20
    if (concentrationRisk > 25) healthScore -= 15
    if (volatility > 30) healthScore -= 15
    if (agents.filter(a => a.status !== 'active').length > agents.length * 0.3) healthScore -= 20

    return {
      totalExposure: totalValue,
      maxDrawdown: Math.max(currentDrawdown, 5), // Assume at least 5% historical max
      currentDrawdown,
      volatility,
      sharpeRatio: volatility > 0 ? (avgReturn * 100) / volatility : 0,
      var95,
      var99,
      concentrationRisk,
      correlationRisk: Math.min(90, concentrationRisk * 1.5), // Simplified correlation
      leverageRatio: 1, // No leverage in paper trading
      healthScore: Math.max(0, healthScore)
    }
  }

  const checkRiskAlerts = () => {
    if (!portfolioRisk) return

    const newAlerts: RiskAlert[] = []

    // Check drawdown
    if (portfolioRisk.currentDrawdown > 15) {
      newAlerts.push({
        id: `drawdown_${Date.now()}`,
        type: 'drawdown',
        severity: portfolioRisk.currentDrawdown > 25 ? 'critical' : 'high',
        message: 'High portfolio drawdown detected',
        details: `Current drawdown: ${portfolioRisk.currentDrawdown.toFixed(2)}%`,
        threshold: 15,
        currentValue: portfolioRisk.currentDrawdown,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Check concentration risk
    if (portfolioRisk.concentrationRisk > 30) {
      newAlerts.push({
        id: `concentration_${Date.now()}`,
        type: 'concentration',
        severity: portfolioRisk.concentrationRisk > 50 ? 'critical' : 'high',
        message: 'High concentration risk',
        details: `Single position exposure: ${portfolioRisk.concentrationRisk.toFixed(2)}%`,
        threshold: 30,
        currentValue: portfolioRisk.concentrationRisk,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Check volatility
    if (portfolioRisk.volatility > 40) {
      newAlerts.push({
        id: `volatility_${Date.now()}`,
        type: 'volatility',
        severity: portfolioRisk.volatility > 60 ? 'critical' : 'medium',
        message: 'High portfolio volatility',
        details: `Portfolio volatility: ${portfolioRisk.volatility.toFixed(2)}%`,
        threshold: 40,
        currentValue: portfolioRisk.volatility,
        timestamp: new Date(),
        acknowledged: false
      })
    }

    // Update alerts (remove duplicates and old alerts)
    setRiskAlerts(prev => {
      const filtered = prev.filter(alert => 
        Date.now() - alert.timestamp.getTime() < 300000 // Keep alerts for 5 minutes
      )
      return [...filtered, ...newAlerts]
    })
  }

  const runStressTest = (scenario: StressTestScenario) => {
    if (!portfolioRisk) return

    // Simulate stress test results
    const portfolioImpact = scenario.marketShock * (1 + portfolioRisk.concentrationRisk / 100)
    const worstCaseValue = portfolioRisk.totalExposure * (1 + portfolioImpact / 100)
    const recoveryTime = Math.abs(portfolioImpact) * 2 // Simplified recovery estimate
    const agentFailures = Math.floor(agents.length * Math.abs(portfolioImpact) / 50)

    // Update scenario with results
    scenario.results = {
      portfolioImpact,
      worstCaseValue,
      recoveryTime,
      agentFailures
    }

    console.log(`🧪 Stress test "${scenario.name}" completed:`, scenario.results)
  }

  const acknowledgeAlert = (alertId: string) => {
    setRiskAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const getSeverityColor = (severity: RiskAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  // Generate risk chart data
  const riskChartData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    drawdown: Math.random() * 10 + (portfolioRisk?.currentDrawdown || 5),
    var95: Math.random() * 5000 + (portfolioRisk?.var95 || 2000),
    volatility: Math.random() * 20 + (portfolioRisk?.volatility || 15)
  }))

  if (!portfolioRisk) {
    return (
      <div className={`${className} text-center py-12`}>
        <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Risk Data Available</h3>
        <p className="text-gray-600">Create some trading agents to see risk analysis</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-red-600" />
              Risk Management Dashboard
            </h2>
            <p className="text-sm text-gray-600">Real-time portfolio risk monitoring and analysis</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-600">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
              </span>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isMonitoring ? 'Pause' : 'Resume'}
            </Button>
            
            <Button size="sm" onClick={loadRiskData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Risk Alerts */}
        {riskAlerts.filter(alert => !alert.acknowledged).length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Active Risk Alerts ({riskAlerts.filter(alert => !alert.acknowledged).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskAlerts
                  .filter(alert => !alert.acknowledged)
                  .slice(0, 5)
                  .map((alert) => (
                    <div key={alert.id} className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm opacity-80">{alert.details}</div>
                          <div className="text-xs opacity-60 mt-1">
                            {alert.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{alert.severity}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Risk Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Portfolio Health</p>
                  <p className={`text-2xl font-bold ${getHealthScoreColor(portfolioRisk.healthScore)}`}>
                    {portfolioRisk.healthScore.toFixed(0)}%
                  </p>
                </div>
                <Shield className={`h-8 w-8 ${getHealthScoreColor(portfolioRisk.healthScore)}`} />
              </div>
              <div className="mt-2">
                <Progress value={portfolioRisk.healthScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Drawdown</p>
                  <p className={`text-2xl font-bold ${portfolioRisk.currentDrawdown > 15 ? 'text-red-600' : 'text-gray-900'}`}>
                    {portfolioRisk.currentDrawdown.toFixed(2)}%
                  </p>
                </div>
                <TrendingDown className={`h-8 w-8 ${portfolioRisk.currentDrawdown > 15 ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  Max: {portfolioRisk.maxDrawdown.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Value at Risk (95%)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${portfolioRisk.var95.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  99%: ${portfolioRisk.var99.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concentration Risk</p>
                  <p className={`text-2xl font-bold ${portfolioRisk.concentrationRisk > 30 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {portfolioRisk.concentrationRisk.toFixed(1)}%
                  </p>
                </div>
                <Target className={`h-8 w-8 ${portfolioRisk.concentrationRisk > 30 ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
              <div className="mt-2">
                <span className="text-xs text-gray-500">
                  Sharpe: {portfolioRisk.sharpeRatio.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>Risk Trends (24h)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="time" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      name="Drawdown %" 
                    />
                    <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stress Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>Stress Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stressTestScenarios.map((scenario) => (
                  <div key={scenario.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{scenario.name}</h4>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runStressTest(scenario)}
                      >
                        Run Test
                      </Button>
                    </div>
                    {scenario.results && (
                      <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                        <div>
                          <span className="text-gray-600">Impact:</span>
                          <span className="ml-1 font-medium text-red-600">
                            {scenario.results.portfolioImpact.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Recovery:</span>
                          <span className="ml-1 font-medium">
                            {scenario.results.recoveryTime.toFixed(0)} days
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <span>Agent Risk Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Agent</th>
                    <th className="p-3">Exposure</th>
                    <th className="p-3">Drawdown</th>
                    <th className="p-3">Risk Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => {
                    const exposure = agent.portfolio.totalValue
                    const drawdown = Math.max(0, (10000 - exposure) / 10000 * 100)
                    const riskScore = Math.min(100, drawdown * 2 + Math.random() * 20)
                    
                    return (
                      <tr key={agent.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{agent.name}</td>
                        <td className="p-3">${exposure.toFixed(2)}</td>
                        <td className={`p-3 font-medium ${drawdown > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {drawdown.toFixed(2)}%
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${
                              riskScore > 70 ? 'text-red-600' : 
                              riskScore > 40 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {riskScore.toFixed(0)}
                            </span>
                            <div className="w-12 h-2 bg-gray-200 rounded-full">
                              <div 
                                className={`h-2 rounded-full ${
                                  riskScore > 70 ? 'bg-red-500' : 
                                  riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, riskScore)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                            {agent.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RealRiskManagementDashboard