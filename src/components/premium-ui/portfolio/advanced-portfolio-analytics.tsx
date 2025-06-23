'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Calculator,
  Globe,
  Zap,
  Eye,
  Download,
  Settings,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  ArrowUpDown,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Slider } from '@/components/ui/slider'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
)

export interface Position {
  id: string
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  currentPrice: number
  unrealizedPnl: number
  realizedPnl: number
  leverage: number
  marginUsed: number
  timestamp: Date
  sector?: string
  region?: string
  marketCap?: 'large' | 'mid' | 'small'
}

export interface PortfolioMetrics {
  totalValue: number
  totalPnl: number
  totalPnlPercent: number
  dayPnl: number
  dayPnlPercent: number
  totalMarginUsed: number
  availableMargin: number
  marginRatio: number
  leverage: number
  sharpeRatio: number
  maxDrawdown: number
  beta: number
  alpha: number
  volatility: number
  correlation: number
}

export interface RiskMetrics {
  var95: number
  var99: number
  cvar95: number
  cvar99: number
  expectedShortfall: number
  riskRewardRatio: number
  kellyCriterion: number
  maximumLoss: number
  concentrationRisk: number
  correlationRisk: number
  liquidityRisk: number
  marginRisk: number
}

export interface PortfolioAnalyticsProps {
  positions: Position[]
  metrics: PortfolioMetrics
  riskMetrics: RiskMetrics
  historicalData: Array<{
    date: Date
    value: number
    benchmark?: number
    drawdown: number
  }>
  onPositionClick?: (position: Position) => void
  onRiskLimitChange?: (limit: number) => void
  timeframe?: '1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL'
  benchmark?: string
  className?: string
}

// Risk level configurations
const RISK_LEVELS = {
  conservative: { color: '#22c55e', threshold: 0.02, label: 'Conservative' },
  moderate: { color: '#f59e0b', threshold: 0.05, label: 'Moderate' },
  aggressive: { color: '#ef4444', threshold: 0.1, label: 'Aggressive' },
  extreme: { color: '#dc2626', threshold: 0.2, label: 'Extreme' }
}

const SECTOR_COLORS = {
  technology: '#3b82f6',
  finance: '#22c55e', 
  healthcare: '#ef4444',
  energy: '#f59e0b',
  consumer: '#8b5cf6',
  industrial: '#6b7280',
  materials: '#06b6d4',
  utilities: '#84cc16',
  other: '#64748b'
}

export function AdvancedPortfolioAnalytics({
  positions,
  metrics,
  riskMetrics,
  historicalData,
  onPositionClick,
  onRiskLimitChange,
  timeframe = '30D',
  benchmark = 'SPY',
  className
}: PortfolioAnalyticsProps) {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [riskTolerance, setRiskTolerance] = useState([5])
  const [showBenchmark, setShowBenchmark] = useState(true)
  const [sortBy, setSortBy] = useState<'pnl' | 'size' | 'risk' | 'sector'>('pnl')
  const [filterBy, setFilterBy] = useState<'all' | 'long' | 'short' | 'profitable' | 'losing'>('all')

  // Calculate sector allocation
  const sectorAllocation = useMemo(() => {
    const allocation = positions.reduce((acc, position) => {
      const sector = position.sector || 'other'
      const value = Math.abs(position.size * position.currentPrice)
      acc[sector] = (acc[sector] || 0) + value
      return acc
    }, {} as Record<string, number>)

    const total = Object.values(allocation).reduce((sum, value) => sum + value, 0)
    
    return Object.entries(allocation).map(([sector, value]) => ({
      sector,
      value,
      percentage: (value / total) * 100,
      color: SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.other
    }))
  }, [positions])

  // Calculate geographic allocation
  const geographicAllocation = useMemo(() => {
    const allocation = positions.reduce((acc, position) => {
      const region = position.region || 'Unknown'
      const value = Math.abs(position.size * position.currentPrice)
      acc[region] = (acc[region] || 0) + value
      return acc
    }, {} as Record<string, number>)

    const total = Object.values(allocation).reduce((sum, value) => sum + value, 0)
    
    return Object.entries(allocation).map(([region, value]) => ({
      region,
      value,
      percentage: (value / total) * 100
    }))
  }, [positions])

  // Calculate correlation matrix (simplified)
  const correlationMatrix = useMemo(() => {
    // In a real implementation, this would use historical price data
    // For demo purposes, generating simulated correlations
    const symbols = positions.map(p => p.symbol).slice(0, 10)
    return symbols.map(symbol1 => 
      symbols.map(symbol2 => {
        if (symbol1 === symbol2) return 1
        // Simulate correlation based on sector similarity
        const pos1 = positions.find(p => p.symbol === symbol1)
        const pos2 = positions.find(p => p.symbol === symbol2)
        const sameSector = pos1?.sector === pos2?.sector
        return sameSector ? 0.6 + Math.random() * 0.3 : Math.random() * 0.4 - 0.2
      })
    )
  }, [positions])

  // Filter and sort positions
  const filteredPositions = useMemo(() => {
    let filtered = positions

    // Apply filters
    switch (filterBy) {
      case 'long':
        filtered = filtered.filter(p => p.side === 'long')
        break
      case 'short':
        filtered = filtered.filter(p => p.side === 'short')
        break
      case 'profitable':
        filtered = filtered.filter(p => p.unrealizedPnl > 0)
        break
      case 'losing':
        filtered = filtered.filter(p => p.unrealizedPnl < 0)
        break
    }

    // Apply sorting
    switch (sortBy) {
      case 'pnl':
        filtered.sort((a, b) => b.unrealizedPnl - a.unrealizedPnl)
        break
      case 'size':
        filtered.sort((a, b) => Math.abs(b.size * b.currentPrice) - Math.abs(a.size * a.currentPrice))
        break
      case 'risk':
        filtered.sort((a, b) => b.leverage - a.leverage)
        break
      case 'sector':
        filtered.sort((a, b) => (a.sector || '').localeCompare(b.sector || ''))
        break
    }

    return filtered
  }, [positions, filterBy, sortBy])

  // Risk assessment
  const riskAssessment = useMemo(() => {
    const currentRisk = Math.abs(metrics.totalPnlPercent) + (riskMetrics.var95 * 100)
    
    let level: keyof typeof RISK_LEVELS = 'conservative'
    if (currentRisk > RISK_LEVELS.extreme.threshold * 100) level = 'extreme'
    else if (currentRisk > RISK_LEVELS.aggressive.threshold * 100) level = 'aggressive'
    else if (currentRisk > RISK_LEVELS.moderate.threshold * 100) level = 'moderate'
    
    return {
      level,
      score: currentRisk,
      config: RISK_LEVELS[level],
      recommendations: generateRiskRecommendations(currentRisk, riskMetrics, positions)
    }
  }, [metrics, riskMetrics, positions])

  // Generate risk recommendations
  function generateRiskRecommendations(riskScore: number, risk: RiskMetrics, positions: Position[]) {
    const recommendations: string[] = []
    
    if (risk.concentrationRisk > 0.3) {
      recommendations.push('High concentration risk detected. Consider diversifying positions.')
    }
    
    if (risk.correlationRisk > 0.7) {
      recommendations.push('High correlation between positions. Reduce correlated assets.')
    }
    
    if (risk.marginRisk > 0.8) {
      recommendations.push('Margin utilization is high. Consider reducing leverage.')
    }
    
    if (risk.liquidityRisk > 0.6) {
      recommendations.push('Some positions may have liquidity issues in stress scenarios.')
    }
    
    if (riskScore > 15) {
      recommendations.push('Overall portfolio risk is elevated. Consider position sizing adjustments.')
    }
    
    return recommendations
  }

  // Performance metrics component
  const PerformanceMetrics = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border"
      >
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">Total P&L</span>
        </div>
        <div className="text-2xl font-bold text-green-700">
          ${metrics.totalPnl.toLocaleString()}
        </div>
        <div className="text-sm text-green-600">
          {metrics.totalPnlPercent >= 0 ? '+' : ''}{metrics.totalPnlPercent.toFixed(2)}%
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border"
      >
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Sharpe Ratio</span>
        </div>
        <div className="text-2xl font-bold text-blue-700">
          {metrics.sharpeRatio.toFixed(2)}
        </div>
        <div className="text-sm text-blue-600">
          Risk-adjusted return
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Max Drawdown</span>
        </div>
        <div className="text-2xl font-bold text-purple-700">
          {(metrics.maxDrawdown * 100).toFixed(1)}%
        </div>
        <div className="text-sm text-purple-600">
          Peak to trough
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border"
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-700">Alpha</span>
        </div>
        <div className="text-2xl font-bold text-orange-700">
          {(metrics.alpha * 100).toFixed(1)}%
        </div>
        <div className="text-sm text-orange-600">
          vs {benchmark}
        </div>
      </motion.div>
    </div>
  )

  // Risk dashboard component
  const RiskDashboard = () => (
    <div className="space-y-6">
      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Level</span>
                <Badge 
                  style={{ backgroundColor: riskAssessment.config.color }}
                  className="text-white"
                >
                  {riskAssessment.config.label}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Risk Score</span>
                  <span className="font-mono">{riskAssessment.score.toFixed(1)}</span>
                </div>
                <Progress 
                  value={Math.min(riskAssessment.score, 20)} 
                  max={20}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">VaR Analysis (95%)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">1-Day VaR</span>
                    <div className="font-mono">${(riskMetrics.var95 * metrics.totalValue).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CVaR</span>
                    <div className="font-mono">${(riskMetrics.cvar95 * metrics.totalValue).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Risk Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Concentration Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={riskMetrics.concentrationRisk * 100} className="w-16 h-2" />
                    <span className="text-xs font-mono">{(riskMetrics.concentrationRisk * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Correlation Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={riskMetrics.correlationRisk * 100} className="w-16 h-2" />
                    <span className="text-xs font-mono">{(riskMetrics.correlationRisk * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Liquidity Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={riskMetrics.liquidityRisk * 100} className="w-16 h-2" />
                    <span className="text-xs font-mono">{(riskMetrics.liquidityRisk * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Margin Risk</span>
                  <div className="flex items-center gap-2">
                    <Progress value={riskMetrics.marginRisk * 100} className="w-16 h-2" />
                    <span className="text-xs font-mono">{(riskMetrics.marginRisk * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Recommendations */}
          {riskAssessment.recommendations.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Risk Recommendations</h4>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    {riskAssessment.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-yellow-600">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // Portfolio composition component
  const PortfolioComposition = () => {
    const chartData = {
      labels: sectorAllocation.map(s => s.sector),
      datasets: [{
        data: sectorAllocation.map(s => s.value),
        backgroundColor: sectorAllocation.map(s => s.color),
        borderWidth: 0,
      }]
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const sector = sectorAllocation[context.dataIndex]
              return `${sector.sector}: $${sector.value.toLocaleString()} (${sector.percentage.toFixed(1)}%)`
            }
          }
        }
      }
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geographicAllocation.map((geo, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{geo.region}</span>
                  <div className="flex items-center gap-2 flex-1 ml-4">
                    <Progress value={geo.percentage} className="flex-1" />
                    <span className="text-sm font-mono min-w-12">
                      {geo.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("w-full space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive portfolio analysis and risk management
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeframe}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1D">1D</SelectItem>
                <SelectItem value="7D">7D</SelectItem>
                <SelectItem value="30D">30D</SelectItem>
                <SelectItem value="90D">90D</SelectItem>
                <SelectItem value="1Y">1Y</SelectItem>
                <SelectItem value="ALL">ALL</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Performance Overview */}
        <PerformanceMetrics />

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="composition">Composition</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick stats and charts overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Portfolio Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '300px' }}>
                    {/* Portfolio performance chart would go here */}
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Portfolio Performance Chart
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Portfolio Value</span>
                    <span className="font-mono">${metrics.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Available Margin</span>
                    <span className="font-mono">${metrics.availableMargin.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Leverage</span>
                    <span className="font-mono">{metrics.leverage.toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Beta</span>
                    <span className="font-mono">{metrics.beta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Volatility</span>
                    <span className="font-mono">{(metrics.volatility * 100).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            {/* Position filters and sorting */}
            <div className="flex items-center gap-4">
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="long">Long Only</SelectItem>
                  <SelectItem value="short">Short Only</SelectItem>
                  <SelectItem value="profitable">Profitable</SelectItem>
                  <SelectItem value="losing">Losing</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pnl">P&L</SelectItem>
                  <SelectItem value="size">Position Size</SelectItem>
                  <SelectItem value="risk">Risk Level</SelectItem>
                  <SelectItem value="sector">Sector</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Positions table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Symbol</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Side</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Size</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Entry Price</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Current Price</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">P&L</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">P&L %</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Leverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPositions.map((position, index) => {
                        const pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100
                        const isProfit = position.unrealizedPnl > 0
                        
                        return (
                          <motion.tr
                            key={position.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b hover:bg-muted/30 cursor-pointer"
                            onClick={() => onPositionClick?.(position)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{position.symbol}</span>
                                {position.sector && (
                                  <Badge variant="outline" className="text-xs">
                                    {position.sector}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                                {position.side.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {position.size.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              ${position.entryPrice.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              ${position.currentPrice.toFixed(2)}
                            </td>
                            <td className={cn(
                              "px-4 py-3 text-right font-mono font-semibold",
                              isProfit ? "text-green-600" : "text-red-600"
                            )}>
                              {isProfit ? '+' : ''}${position.unrealizedPnl.toLocaleString()}
                            </td>
                            <td className={cn(
                              "px-4 py-3 text-right font-mono",
                              isProfit ? "text-green-600" : "text-red-600"
                            )}>
                              {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {position.leverage.toFixed(1)}x
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk">
            <RiskDashboard />
          </TabsContent>

          <TabsContent value="composition">
            <PortfolioComposition />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance analysis charts and metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rolling Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '300px' }}>
                    {/* Rolling returns chart */}
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Rolling Returns Chart
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Drawdown Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '300px' }}>
                    {/* Drawdown chart */}
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Drawdown Chart
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}