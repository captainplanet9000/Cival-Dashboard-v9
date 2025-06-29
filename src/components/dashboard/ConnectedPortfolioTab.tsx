'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp, TrendingDown, DollarSign, Activity, Shield, 
  Target, BarChart3, PieChart, RefreshCw, Download, Settings,
  AlertTriangle, Eye, Calculator, Zap, ArrowUpDown, Filter
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Import the advanced portfolio analytics component
import { AdvancedPortfolioAnalytics } from '@/components/premium-ui/portfolio/advanced-portfolio-analytics'
import type { Position, PortfolioMetrics, RiskMetrics } from '@/components/premium-ui/portfolio/advanced-portfolio-analytics'

interface ConnectedPortfolioTabProps {
  className?: string
}

export function ConnectedPortfolioTab({ className }: ConnectedPortfolioTabProps) {
  const { state, actions } = useDashboardConnection('portfolio')
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL'>('30D')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Convert dashboard state to portfolio analytics format
  const portfolioPositions = useMemo<Position[]>(() => {
    return state.openPositions.map(position => ({
      id: position.id || `pos_${Date.now()}_${Math.random()}`,
      symbol: position.symbol,
      side: position.side === 'buy' ? 'long' : 'short' as 'long' | 'short',
      size: position.quantity,
      entryPrice: position.entryPrice || position.price,
      currentPrice: state.marketPrices.get(position.symbol) || position.price,
      unrealizedPnl: calculateUnrealizedPnL(position, state.marketPrices.get(position.symbol) || position.price),
      realizedPnl: 0, // Would need to track this from completed trades
      leverage: 1, // Default leverage
      marginUsed: (position.quantity * position.price) * 0.1, // Assume 10% margin
      timestamp: position.timestamp || new Date(),
      sector: getSectorForSymbol(position.symbol),
      region: getRegionForSymbol(position.symbol),
      marketCap: getMarketCapForSymbol(position.symbol)
    }))
  }, [state.openPositions, state.marketPrices])

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo<PortfolioMetrics>(() => {
    const totalValue = state.portfolioValue
    const totalPnl = state.totalPnL
    const totalPnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0
    const dayPnl = state.dailyPnL
    const dayPnlPercent = totalValue > 0 ? (dayPnl / totalValue) * 100 : 0
    
    return {
      totalValue,
      totalPnl,
      totalPnlPercent,
      dayPnl,
      dayPnlPercent,
      totalMarginUsed: portfolioPositions.reduce((sum, pos) => sum + pos.marginUsed, 0),
      availableMargin: totalValue * 0.8, // Mock 80% available
      marginRatio: 0.2, // Mock 20% margin ratio
      leverage: portfolioPositions.length > 0 ? 
        portfolioPositions.reduce((sum, pos) => sum + pos.leverage, 0) / portfolioPositions.length : 1,
      sharpeRatio: 1.2 + Math.random() * 0.8, // Mock Sharpe ratio
      maxDrawdown: 0.05 + Math.random() * 0.1, // Mock max drawdown
      beta: 0.8 + Math.random() * 0.4, // Mock beta
      alpha: (Math.random() - 0.5) * 0.1, // Mock alpha
      volatility: 0.15 + Math.random() * 0.1, // Mock volatility
      correlation: 0.3 + Math.random() * 0.4 // Mock correlation
    }
  }, [state, portfolioPositions])

  // Calculate risk metrics
  const riskMetrics = useMemo<RiskMetrics>(() => {
    const portfolioValue = portfolioMetrics.totalValue
    
    return {
      var95: 0.02 + Math.random() * 0.03, // 2-5% VaR
      var99: 0.04 + Math.random() * 0.06, // 4-10% VaR
      cvar95: 0.03 + Math.random() * 0.04, // CVaR
      cvar99: 0.06 + Math.random() * 0.08, // CVaR
      expectedShortfall: 0.025 + Math.random() * 0.025,
      riskRewardRatio: 1.5 + Math.random() * 1,
      kellyCriterion: 0.1 + Math.random() * 0.1,
      maximumLoss: portfolioValue * (0.1 + Math.random() * 0.1),
      concentrationRisk: calculateConcentrationRisk(portfolioPositions),
      correlationRisk: 0.3 + Math.random() * 0.4,
      liquidityRisk: 0.2 + Math.random() * 0.3,
      marginRisk: portfolioMetrics.marginRatio
    }
  }, [portfolioMetrics, portfolioPositions])

  // Generate historical data
  const historicalData = useMemo(() => {
    const days = getTimeframeDays(selectedTimeframe)
    const data = []
    let currentValue = portfolioMetrics.totalValue
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Simulate price movement
      const change = (Math.random() - 0.5) * 0.02 // ±1% daily change
      currentValue *= (1 + change)
      
      const drawdown = Math.max(0, (portfolioMetrics.totalValue - currentValue) / portfolioMetrics.totalValue)
      
      data.push({
        date,
        value: currentValue,
        benchmark: currentValue * (0.95 + Math.random() * 0.1), // Mock benchmark
        drawdown
      })
    }
    
    return data
  }, [selectedTimeframe, portfolioMetrics.totalValue])

  function calculateUnrealizedPnL(position: any, currentPrice: number): number {
    const side = position.side === 'buy' ? 1 : -1
    return (currentPrice - position.price) * position.quantity * side
  }

  function getSectorForSymbol(symbol: string): string {
    const sectorMap: Record<string, string> = {
      'BTC': 'technology',
      'ETH': 'technology', 
      'AAPL': 'technology',
      'GOOGL': 'technology',
      'MSFT': 'technology',
      'TSLA': 'consumer',
      'JPM': 'finance',
      'BAC': 'finance',
      'XOM': 'energy',
      'JNJ': 'healthcare'
    }
    return sectorMap[symbol.replace('/USD', '').replace('-USD', '')] || 'other'
  }

  function getRegionForSymbol(symbol: string): string {
    if (symbol.includes('BTC') || symbol.includes('ETH')) return 'Global'
    return 'United States' // Default for most stocks
  }

  function getMarketCapForSymbol(symbol: string): 'large' | 'mid' | 'small' {
    const largeCap = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'JPM', 'BTC', 'ETH']
    if (largeCap.some(cap => symbol.includes(cap))) return 'large'
    return 'mid' // Default
  }

  function calculateConcentrationRisk(positions: Position[]): number {
    if (positions.length === 0) return 0
    
    const totalValue = positions.reduce((sum, pos) => sum + Math.abs(pos.size * pos.currentPrice), 0)
    const largest = Math.max(...positions.map(pos => Math.abs(pos.size * pos.currentPrice)))
    
    return totalValue > 0 ? largest / totalValue : 0
  }

  function getTimeframeDays(timeframe: string): number {
    switch (timeframe) {
      case '1D': return 1
      case '7D': return 7
      case '30D': return 30
      case '90D': return 90
      case '1Y': return 365
      case 'ALL': return 730 // 2 years
      default: return 30
    }
  }

  const handlePositionClick = (position: Position) => {
    toast.success(`Viewing details for ${position.symbol}`)
    // Could open a detailed position modal here
  }

  const handleRiskLimitChange = (limit: number) => {
    toast.success(`Risk limit updated to ${limit}%`)
    // Could update risk management settings
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive portfolio analysis, risk management, and performance tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={showAdvanced ? "default" : "outline"}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Simple View' : 'Advanced View'}
          </Button>
          <Button variant="outline" size="sm" onClick={actions.refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioMetrics.totalValue.toLocaleString()}</div>
            <p className={`text-xs ${portfolioMetrics.dayPnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioMetrics.dayPnlPercent >= 0 ? '+' : ''}{portfolioMetrics.dayPnlPercent.toFixed(2)}% today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              portfolioMetrics.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolioMetrics.totalPnl >= 0 ? '+' : ''}${portfolioMetrics.totalPnl.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioMetrics.totalPnlPercent.toFixed(2)}% return
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioPositions.length}</div>
            <p className="text-xs text-muted-foreground">
              {portfolioPositions.filter(p => p.unrealizedPnl > 0).length} profitable
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(riskMetrics.var95 * 100).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              95% VaR
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {showAdvanced ? (
        // Advanced Analytics View
        <AdvancedPortfolioAnalytics
          positions={portfolioPositions}
          metrics={portfolioMetrics}
          riskMetrics={riskMetrics}
          historicalData={historicalData}
          onPositionClick={handlePositionClick}
          onRiskLimitChange={handleRiskLimitChange}
          timeframe={selectedTimeframe}
          benchmark="SPY"
          className="mt-6"
        />
      ) : (
        // Simple Portfolio View
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex items-center gap-4">
            <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1D">1 Day</SelectItem>
                <SelectItem value="7D">7 Days</SelectItem>
                <SelectItem value="30D">30 Days</SelectItem>
                <SelectItem value="90D">90 Days</SelectItem>
                <SelectItem value="1Y">1 Year</SelectItem>
                <SelectItem value="ALL">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Positions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
              <CardDescription>
                Your active trading positions and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {portfolioPositions.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Positions</h3>
                  <p className="text-muted-foreground">
                    Start trading to see your portfolio positions here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Symbol</th>
                        <th className="text-left p-2">Side</th>
                        <th className="text-right p-2">Size</th>
                        <th className="text-right p-2">Entry Price</th>
                        <th className="text-right p-2">Current Price</th>
                        <th className="text-right p-2">P&L</th>
                        <th className="text-right p-2">P&L %</th>
                        <th className="text-right p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioPositions.map((position, index) => {
                        const pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100
                        const isProfit = position.unrealizedPnl > 0
                        const positionValue = Math.abs(position.size * position.currentPrice)
                        
                        return (
                          <motion.tr
                            key={position.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => handlePositionClick(position)}
                          >
                            <td className="p-2 font-medium">{position.symbol}</td>
                            <td className="p-2">
                              <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                                {position.side.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-2 text-right font-mono">{position.size.toLocaleString()}</td>
                            <td className="p-2 text-right font-mono">${position.entryPrice.toFixed(2)}</td>
                            <td className="p-2 text-right font-mono">${position.currentPrice.toFixed(2)}</td>
                            <td className={cn(
                              "p-2 text-right font-mono font-semibold",
                              isProfit ? "text-green-600" : "text-red-600"
                            )}>
                              {isProfit ? '+' : ''}${position.unrealizedPnl.toFixed(0)}
                            </td>
                            <td className={cn(
                              "p-2 text-right font-mono",
                              isProfit ? "text-green-600" : "text-red-600"
                            )}>
                              {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                            </td>
                            <td className="p-2 text-right font-mono">${positionValue.toLocaleString()}</td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                    <div className="text-xl font-bold">{portfolioMetrics.sharpeRatio.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Max Drawdown</span>
                    <div className="text-xl font-bold text-red-600">
                      {(portfolioMetrics.maxDrawdown * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Beta</span>
                    <div className="text-xl font-bold">{portfolioMetrics.beta.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Alpha</span>
                    <div className={`text-xl font-bold ${
                      portfolioMetrics.alpha >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(portfolioMetrics.alpha * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Concentration Risk</span>
                    <div className="flex items-center gap-2">
                      <Progress value={riskMetrics.concentrationRisk * 100} className="w-16 h-2" />
                      <span className="text-xs font-mono">{(riskMetrics.concentrationRisk * 100).toFixed(0)}%</span>
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
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Value at Risk (95%)</div>
                  <div className="text-lg font-bold text-red-600">
                    ${(riskMetrics.var95 * portfolioMetrics.totalValue).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectedPortfolioTab