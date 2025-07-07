'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  Activity,
  StopCircle,
  PlayCircle,
  Settings,
  BarChart3,
  Target
} from 'lucide-react'
import { paperTradingEngine } from '@/lib/trading/real-paper-trading-engine'

interface RiskMetrics {
  portfolioRisk: number
  valueAtRisk: {
    var95: number
    var99: number
    timeHorizon: string
  }
  maxDrawdown: {
    current: number
    historical: number
    peak: number
    trough: number
  }
  concentrationRisk: number
  leverageRatio: number
  sharpeRatio: number
  totalExposure: number
}

interface RiskAlert {
  id: string
  type: 'warning' | 'error' | 'critical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: string
  agentId: string | null
  symbol: string | null
  value: number
  threshold: number
  timestamp: number
  acknowledged: boolean
  resolved: boolean
}

interface RiskSettings {
  maxPortfolioVar: number
  maxPositionSize: number
  maxConcentration: number
  maxDrawdown: number
  minLiquidity: number
  maxCorrelation: number
  alertsEnabled: boolean
  autoStopLoss: boolean
  emergencyStopEnabled: boolean
  stopLossPercentage: number
  takeProfitPercentage: number
  maxDailyLoss: number
  maxLeverage: number
  marginCallThreshold: number
}

const RiskTab: React.FC = () => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([])
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null)
  const [emergencyStopActive, setEmergencyStopActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch risk data
  const fetchRiskData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [metricsRes, alertsRes, settingsRes] = await Promise.all([
        fetch('/api/risk/metrics'),
        fetch('/api/risk/alerts'),
        fetch('/api/risk/settings')
      ])

      if (metricsRes.ok) {
        const metrics = await metricsRes.json()
        setRiskMetrics(metrics)
      }

      if (alertsRes.ok) {
        const alerts = await alertsRes.json()
        setRiskAlerts(alerts.alerts || [])
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setRiskSettings(settings)
      }

    } catch (err) {
      console.error('Error fetching risk data:', err)
      setError('Failed to load risk data')
    } finally {
      setLoading(false)
    }
  }

  // Handle emergency stop
  const handleEmergencyStop = async () => {
    try {
      const response = await fetch('/api/risk/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual emergency stop activated by user' })
      })

      if (response.ok) {
        setEmergencyStopActive(true)
        await fetchRiskData() // Refresh data
      }
    } catch (err) {
      console.error('Error activating emergency stop:', err)
    }
  }

  // Handle emergency stop deactivation
  const handleResumeTrading = async () => {
    try {
      const response = await fetch('/api/risk/emergency-stop', {
        method: 'DELETE'
      })

      if (response.ok) {
        setEmergencyStopActive(false)
        await fetchRiskData() // Refresh data
      }
    } catch (err) {
      console.error('Error deactivating emergency stop:', err)
    }
  }

  // Run stress test
  const runStressTest = async (scenario: string) => {
    try {
      const response = await fetch('/api/risk/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scenario,
          name: scenario === 'market_crash' ? 'Market Crash' : 
                scenario === 'liquidity_crisis' ? 'Liquidity Crisis' : 'Flash Crash',
          description: `Stress test scenario: ${scenario}`,
          shocks: scenario === 'market_crash' ? 
            { 'BTC/USD': -0.30, 'ETH/USD': -0.35, 'SOL/USD': -0.40 } :
            scenario === 'liquidity_crisis' ?
            { 'BTC/USD': -0.15, 'ETH/USD': -0.20, 'SOL/USD': -0.25 } :
            { 'BTC/USD': -0.50, 'ETH/USD': -0.45, 'SOL/USD': -0.55 }
        })
      })

      if (response.ok) {
        await fetchRiskData() // Refresh data after stress test
      }
    } catch (err) {
      console.error('Error running stress test:', err)
    }
  }

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/risk/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      })
      await fetchRiskData() // Refresh alerts
    } catch (err) {
      console.error('Error acknowledging alert:', err)
    }
  }

  useEffect(() => {
    fetchRiskData()
    
    // Set up auto-refresh
    const interval = setInterval(fetchRiskData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Listen to paper trading engine events
  useEffect(() => {
    const handleStopLoss = (data: any) => {
      console.log('Stop loss triggered:', data)
      fetchRiskData() // Refresh risk data
    }

    const handleTakeProfit = (data: any) => {
      console.log('Take profit triggered:', data)
      fetchRiskData() // Refresh risk data
    }

    const handleEmergencyStop = (data: any) => {
      console.log('Emergency stop activated:', data)
      setEmergencyStopActive(true)
      fetchRiskData() // Refresh risk data
    }

    paperTradingEngine.on('stopLossTriggered', handleStopLoss)
    paperTradingEngine.on('takeProfitTriggered', handleTakeProfit)
    paperTradingEngine.on('emergencyStop', handleEmergencyStop)

    return () => {
      paperTradingEngine.off('stopLossTriggered', handleStopLoss)
      paperTradingEngine.off('takeProfitTriggered', handleTakeProfit)
      paperTradingEngine.off('emergencyStop', handleEmergencyStop)
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p>Loading risk data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const criticalAlerts = riskAlerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged)
  const highAlerts = riskAlerts.filter(alert => alert.severity === 'high' && !alert.acknowledged)

  return (
    <div className="space-y-6">
      {/* Emergency Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management System
          </CardTitle>
          <CardDescription>Real-time risk monitoring and emergency controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={emergencyStopActive ? "destructive" : "default"}>
                {emergencyStopActive ? "Emergency Stop Active" : "Trading Active"}
              </Badge>
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
                </Badge>
              )}
              {highAlerts.length > 0 && (
                <Badge variant="secondary">
                  {highAlerts.length} High Alert{highAlerts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {!emergencyStopActive ? (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleEmergencyStop}
                  className="flex items-center gap-2"
                >
                  <StopCircle className="h-4 w-4" />
                  Emergency Stop
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleResumeTrading}
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  Resume Trading
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Overview */}
      {riskMetrics && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="alerts">Alerts ({riskAlerts.length})</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="stress-test">Stress Test</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Portfolio Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(riskMetrics.portfolioRisk || 0).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Overall risk level</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Value at Risk (95%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${Math.abs(riskMetrics.valueAtRisk?.var95 || 0).toFixed(0)}</div>
                  <p className="text-xs text-muted-foreground">1-day VaR estimate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Max Drawdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(riskMetrics.maxDrawdown?.current || 0).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Current drawdown level</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Concentration Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(riskMetrics.concentrationRisk || 0).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Portfolio concentration</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="space-y-4">
              {riskAlerts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Shield className="h-8 w-8 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-semibold">No Active Alerts</p>
                    <p className="text-muted-foreground">All risk metrics are within acceptable limits</p>
                  </CardContent>
                </Card>
              ) : (
                riskAlerts.map((alert) => (
                  <Alert key={alert.id} className={
                    alert.severity === 'critical' ? 'border-red-500' :
                    alert.severity === 'high' ? 'border-orange-500' :
                    alert.severity === 'medium' ? 'border-yellow-500' : ''
                  }>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">{alert.details}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="positions">
            <Card>
              <CardHeader>
                <CardTitle>Position Risk Analysis</CardTitle>
                <CardDescription>Individual position risk metrics and limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p>Position risk analysis will be displayed here</p>
                  <p className="text-sm text-muted-foreground">Integrate with position data from trading engine</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stress-test">
            <Card>
              <CardHeader>
                <CardTitle>Stress Testing</CardTitle>
                <CardDescription>Test portfolio resilience under extreme market conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => runStressTest('market_crash')}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <TrendingDown className="h-6 w-6 mb-2" />
                    <span>Market Crash</span>
                    <span className="text-xs text-muted-foreground">-30% scenario</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => runStressTest('liquidity_crisis')}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <DollarSign className="h-6 w-6 mb-2" />
                    <span>Liquidity Crisis</span>
                    <span className="text-xs text-muted-foreground">-15% + liquidity</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => runStressTest('flash_crash')}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    <span>Flash Crash</span>
                    <span className="text-xs text-muted-foreground">-50% rapid</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Risk Settings
                </CardTitle>
                <CardDescription>Configure risk management parameters</CardDescription>
              </CardHeader>
              <CardContent>
                {riskSettings ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Position Limits</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Max Position Size:</span>
                          <span className="text-sm font-mono">{riskSettings.maxPositionSize}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Max Concentration:</span>
                          <span className="text-sm font-mono">{riskSettings.maxConcentration}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Max Leverage:</span>
                          <span className="text-sm font-mono">{riskSettings.maxLeverage}x</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold">Stop Loss & Take Profit</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Stop Loss:</span>
                          <span className="text-sm font-mono">{riskSettings.stopLossPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Take Profit:</span>
                          <span className="text-sm font-mono">{riskSettings.takeProfitPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Auto Stop Loss:</span>
                          <Badge variant={riskSettings.autoStopLoss ? "default" : "secondary"}>
                            {riskSettings.autoStopLoss ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <p>Loading risk settings...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default RiskTab