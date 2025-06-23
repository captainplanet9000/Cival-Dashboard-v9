'use client'

// Enhanced Portfolio Monitor - Premium version preserving ALL existing functionality
// Migrated from: src/components/trading/PortfolioMonitor.tsx
// Preserves: Real-time portfolio tracking, Multi-asset position management, Performance analytics

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Target,
  Shield,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Download
} from 'lucide-react'

// Import premium components
import { PortfolioSortable } from '../sortable/PortfolioSortable'
import { AdvancedDataTable, createPriceColumn, createChangeColumn } from '../tables/advanced-data-table'
import { ProgressWithValue } from '../expansions/progress-with-value'
import { AutoForm, RiskManagementSchema } from '../forms/auto-form'

// Import enhanced clients
import { enhancedBackendClient } from '@/lib/api/enhanced-backend-client'
import { premiumWebSocketClient, ConnectionState } from '@/lib/websocket/premium-websocket'
import { cn } from '@/lib/utils'

// ===== PRESERVED TYPES FROM ORIGINAL =====

interface Position {
  id: string
  symbol: string
  name: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  realizedPnl: number
  totalPnl: number
  portfolioWeight: number
  sector?: string
  assetClass: 'stocks' | 'crypto' | 'forex' | 'commodities'
  exchange: string
  lastUpdate: Date
}

interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalPnl: number
  totalPnlPercent: number
  dayChange: number
  dayChangePercent: number
  cashBalance: number
  marginUsed: number
  marginAvailable: number
  buyingPower: number
  positions: Position[]
  lastUpdate: Date
}

interface PortfolioMetrics {
  sharpeRatio: number
  maxDrawdown: number
  volatility: number
  beta: number
  alpha: number
  correlation: number
  valueAtRisk: number
  expectedReturn: number
}

interface AssetAllocation {
  assetClass: string
  value: number
  percentage: number
  count: number
}

// ===== ENHANCED PORTFOLIO MONITOR COMPONENT =====

export function EnhancedPortfolioMonitor() {
  // ===== PRESERVED STATE FROM ORIGINAL =====
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null)
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([])
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // ===== PREMIUM ENHANCEMENTS =====
  const [selectedView, setSelectedView] = useState<'overview' | 'positions' | 'allocation' | 'risk'>('overview')
  const [hiddenPositions, setHiddenPositions] = useState<Set<string>>(new Set())
  const [sortablePositions, setSortablePositions] = useState<any[]>([])
  const [showRiskManagement, setShowRiskManagement] = useState(false)

  // ===== PRESERVED WEBSOCKET INTEGRATION =====
  useEffect(() => {
    premiumWebSocketClient.onStateChange(setConnectionState)
    premiumWebSocketClient.connect().catch(console.error)

    return () => {
      premiumWebSocketClient.offStateChange(setConnectionState)
    }
  }, [])

  useEffect(() => {
    const handlePortfolioUpdate = (data: any) => {
      setPortfolioSummary(prev => ({
        ...prev,
        ...data,
        lastUpdate: new Date()
      }))
    }

    const handlePositionUpdate = (data: any) => {
      setPortfolioSummary(prev => {
        if (!prev) return prev
        
        const updatedPositions = prev.positions.map(pos => 
          pos.symbol === data.symbol ? { ...pos, ...data, lastUpdate: new Date() } : pos
        )
        
        return {
          ...prev,
          positions: updatedPositions
        }
      })
    }

    const handleRiskUpdate = (data: any) => {
      setPortfolioMetrics(prev => ({
        ...prev,
        ...data
      }))
    }

    premiumWebSocketClient.on('portfolio_update', handlePortfolioUpdate)
    premiumWebSocketClient.on('position_update', handlePositionUpdate)
    premiumWebSocketClient.on('risk_update', handleRiskUpdate)

    return () => {
      premiumWebSocketClient.off('portfolio_update', handlePortfolioUpdate)
      premiumWebSocketClient.off('position_update', handlePositionUpdate)
      premiumWebSocketClient.off('risk_update', handleRiskUpdate)
    }
  }, [])

  // ===== PRESERVED API INTEGRATION =====
  const loadPortfolioData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [summary, metrics, performance] = await Promise.all([
        enhancedBackendClient.getPortfolioSummary(),
        enhancedBackendClient.getRiskMetrics(),
        enhancedBackendClient.getPortfolioPerformance('1d')
      ])

      setPortfolioSummary(summary)
      setPortfolioMetrics(metrics)

      // Calculate asset allocation
      if (summary.positions) {
        const allocation = calculateAssetAllocation(summary.positions)
        setAssetAllocation(allocation)
        
        // Convert to sortable format for premium components
        const sortableData = summary.positions.map(pos => ({
          id: pos.id,
          symbol: pos.symbol,
          name: pos.name,
          quantity: pos.quantity,
          averagePrice: pos.averagePrice,
          currentPrice: pos.currentPrice,
          pnl: pos.totalPnl,
          pnlPercent: pos.unrealizedPnlPercent,
          portfolioWeight: pos.portfolioWeight,
          riskLevel: getRiskLevel(pos.portfolioWeight),
          lastUpdate: pos.lastUpdate,
          order: 0
        }))
        setSortablePositions(sortableData)
      }

    } catch (error) {
      console.error('Failed to load portfolio data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPortfolioData()
  }, [loadPortfolioData])

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(loadPortfolioData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, loadPortfolioData])

  // ===== UTILITY FUNCTIONS =====
  const calculateAssetAllocation = (positions: Position[]): AssetAllocation[] => {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0)
    const allocation = new Map<string, { value: number; count: number }>()

    positions.forEach(pos => {
      const existing = allocation.get(pos.assetClass) || { value: 0, count: 0 }
      allocation.set(pos.assetClass, {
        value: existing.value + pos.marketValue,
        count: existing.count + 1
      })
    })

    return Array.from(allocation.entries()).map(([assetClass, data]) => ({
      assetClass,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      count: data.count
    }))
  }

  const getRiskLevel = (portfolioWeight: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (portfolioWeight > 30) return 'critical'
    if (portfolioWeight > 20) return 'high'
    if (portfolioWeight > 10) return 'medium'
    return 'low'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // ===== POSITION MANAGEMENT =====
  const handlePositionVisibility = (symbol: string) => {
    setHiddenPositions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(symbol)) {
        newSet.delete(symbol)
      } else {
        newSet.add(symbol)
      }
      return newSet
    })
  }

  const handlePositionsReorder = (newPositions: any[]) => {
    setSortablePositions(newPositions)
    // Optionally save order to backend
    // enhancedBackendClient.updatePortfolioOrder(newPositions)
  }

  // ===== RISK MANAGEMENT =====
  const handleRiskSettingsSubmit = async (riskData: any) => {
    try {
      await enhancedBackendClient.updateRiskSettings(riskData)
      await loadPortfolioData() // Refresh data
    } catch (error) {
      console.error('Failed to update risk settings:', error)
    }
  }

  // ===== TABLE COLUMNS =====
  const positionColumns = useMemo(() => [
    {
      accessorKey: 'symbol',
      header: 'Symbol',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{row.getValue('symbol')}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handlePositionVisibility(row.getValue('symbol'))}
            className="h-6 w-6 p-0"
          >
            {hiddenPositions.has(row.getValue('symbol')) ? 
              <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />
            }
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }: any) => (
        <span className="font-mono">{row.getValue('quantity').toLocaleString()}</span>
      ),
    },
    createPriceColumn('averagePrice', 'Avg Price'),
    createPriceColumn('currentPrice', 'Current Price'),
    {
      accessorKey: 'marketValue',
      header: 'Market Value',
      cell: ({ row }: any) => (
        <span className="font-semibold">{formatCurrency(row.getValue('marketValue'))}</span>
      ),
    },
    createChangeColumn('pnlPercent', 'P&L %'),
    {
      accessorKey: 'portfolioWeight',
      header: 'Weight',
      cell: ({ row }: any) => {
        const weight = row.getValue('portfolioWeight')
        return (
          <div className="space-y-1">
            <span className="text-sm font-medium">{weight.toFixed(1)}%</span>
            <Progress value={weight} className="h-1" />
          </div>
        )
      },
    },
    {
      accessorKey: 'riskLevel',
      header: 'Risk',
      cell: ({ row }: any) => {
        const risk = row.getValue('riskLevel')
        const colors = {
          low: 'bg-green-100 text-green-800',
          medium: 'bg-yellow-100 text-yellow-800',
          high: 'bg-orange-100 text-orange-800',
          critical: 'bg-red-100 text-red-800'
        }
        return (
          <Badge className={colors[risk as keyof typeof colors]}>
            {risk}
          </Badge>
        )
      },
    },
  ], [hiddenPositions])

  if (!portfolioSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* ===== ENHANCED HEADER ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Enhanced Portfolio Monitor
              </CardTitle>
              <CardDescription>
                Real-time portfolio tracking with advanced analytics and risk management
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRiskManagement(!showRiskManagement)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Risk Settings
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={loadPortfolioData}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ===== PORTFOLIO SUMMARY ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalValue)}</div>
            <div className={cn('text-sm flex items-center gap-1',
              portfolioSummary.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {portfolioSummary.dayChangePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatPercentage(portfolioSummary.dayChangePercent)} today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold',
              portfolioSummary.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(portfolioSummary.totalPnl)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatPercentage(portfolioSummary.totalPnlPercent)} overall
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.cashBalance)}</div>
            <div className="text-sm text-muted-foreground">
              Buying power: {formatCurrency(portfolioSummary.buyingPower)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioSummary.positions.length}</div>
            <div className="text-sm text-muted-foreground">
              {portfolioSummary.positions.filter(p => p.unrealizedPnl > 0).length} profitable
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== RISK MANAGEMENT FORM ===== */}
      {showRiskManagement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Management Settings
            </CardTitle>
            <CardDescription>
              Configure portfolio risk parameters and limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutoForm
              schema={RiskManagementSchema}
              onSubmit={handleRiskSettingsSubmit}
              fieldConfig={{
                maxDailyLoss: {
                  fieldType: 'currency',
                  description: 'Maximum daily loss threshold'
                },
                maxPositions: {
                  fieldType: 'input',
                  description: 'Maximum number of open positions'
                },
                portfolioHeatPercent: {
                  fieldType: 'percentage',
                  description: 'Maximum portfolio concentration risk'
                },
                correlationLimit: {
                  fieldType: 'slider',
                  min: 0,
                  max: 1,
                  step: 0.1,
                  description: 'Maximum correlation between positions'
                }
              }}
              submitText="Update Risk Settings"
            />
          </CardContent>
        </Card>
      )}

      {/* ===== MAIN PORTFOLIO INTERFACE ===== */}
      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Allocation */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Portfolio distribution by asset class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assetAllocation.map((allocation) => (
                  <div key={allocation.assetClass} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{allocation.assetClass}</span>
                      <span>{allocation.percentage.toFixed(1)}%</span>
                    </div>
                    <ProgressWithValue
                      value={allocation.percentage}
                      max={100}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(allocation.value)}</span>
                      <span>{allocation.count} position{allocation.count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Portfolio risk and return analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioMetrics ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                      <div className="text-lg font-semibold">{portfolioMetrics.sharpeRatio.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Max Drawdown</div>
                      <div className="text-lg font-semibold text-red-600">
                        {formatPercentage(portfolioMetrics.maxDrawdown)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Volatility</div>
                      <div className="text-lg font-semibold">{formatPercentage(portfolioMetrics.volatility)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Beta</div>
                      <div className="text-lg font-semibold">{portfolioMetrics.beta.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Value at Risk</div>
                      <div className="text-lg font-semibold text-orange-600">
                        {formatCurrency(portfolioMetrics.valueAtRisk)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Alpha</div>
                      <div className="text-lg font-semibold">{formatPercentage(portfolioMetrics.alpha)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Loading performance metrics...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-6">
          <PortfolioSortable
            positions={sortablePositions}
            onPositionsChange={handlePositionsReorder}
            totalPortfolioValue={portfolioSummary.totalValue}
            showRiskIndicators={true}
            showPortfolioWeights={true}
            options={{
              enableMultiSelect: true,
              persistOrder: true,
              animationPreset: 'smooth'
            }}
          />
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Position Analysis</CardTitle>
              <CardDescription>
                Comprehensive view of all portfolio positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedDataTable
                data={portfolioSummary.positions.filter(pos => !hiddenPositions.has(pos.symbol))}
                columns={positionColumns}
                searchable={true}
                filterable={true}
                exportable={true}
                realTime={true}
                pageSize={20}
                emptyMessage="No positions in portfolio"
                title="Portfolio Positions"
                description={`${portfolioSummary.positions.length} total positions`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Metrics Tab */}
        <TabsContent value="risk">
          <div className="space-y-6">
            {portfolioMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Portfolio Risk Level</span>
                        <span className="text-sm font-medium">
                          {portfolioMetrics.beta > 1.5 ? 'High' : portfolioMetrics.beta > 1 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(portfolioMetrics.beta * 50, 100)} 
                        className="h-2"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Diversification Score</span>
                        <span className="text-sm font-medium">
                          {((1 - portfolioMetrics.correlation) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={(1 - portfolioMetrics.correlation) * 100} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Risk Limits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Daily VaR (95%)</span>
                      <span className="font-semibold text-orange-600">
                        {formatCurrency(portfolioMetrics.valueAtRisk)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Drawdown</span>
                      <span className="font-semibold text-red-600">
                        {formatPercentage(portfolioMetrics.maxDrawdown)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Portfolio Beta</span>
                      <span className="font-semibold">{portfolioMetrics.beta.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== CONNECTION STATUS ALERT ===== */}
      {connectionState !== ConnectionState.CONNECTED && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Real-time portfolio updates are not available. Connection status: {connectionState}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default EnhancedPortfolioMonitor