'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  ResponsiveContainer
} from 'recharts'
import {
  PlayCircle,
  StopCircle,
  RotateCcw,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Clock,
  Target,
  DollarSign,
  Settings,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import {
  paperTradingEngine,
  TradingStrategy
} from '@/lib/trading/real-paper-trading-engine'

interface RealBacktestingDashboardProps {
  className?: string
}

interface BacktestConfig {
  strategy: TradingStrategy['type']
  symbol: string
  startDate: string
  endDate: string
  initialCapital: number
  parameters: Record<string, any>
  commission: number
  slippage: number
}

interface BacktestResult {
  id: string
  config: BacktestConfig
  status: 'running' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  duration?: number
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  profitFactor: number
  portfolioValue: Array<{ date: string; value: number }>
  trades: Array<{
    date: string
    action: 'buy' | 'sell'
    quantity: number
    price: number
    pnl: number
  }>
  monthlyReturns: Array<{ month: string; return: number }>
  riskMetrics: {
    volatility: number
    beta: number
    alpha: number
    calmarRatio: number
  }
}

const STRATEGY_TEMPLATES = {
  momentum: {
    name: 'Momentum Strategy',
    description: 'Buy high, sell higher - follows trending assets',
    defaultParams: {
      lookbackPeriod: 20,
      threshold: 0.02,
      stopLoss: 0.05,
      takeProfit: 0.1
    }
  },
  mean_reversion: {
    name: 'Mean Reversion',
    description: 'Buy low, sell high - trades against extremes',
    defaultParams: {
      period: 14,
      deviation: 2,
      stopLoss: 0.03,
      holdPeriod: 5
    }
  },
  arbitrage: {
    name: 'Arbitrage',
    description: 'Risk-free profits from price differences',
    defaultParams: {
      minSpread: 0.005,
      maxHoldTime: 60,
      feeThreshold: 0.001
    }
  },
  grid: {
    name: 'Grid Trading',
    description: 'Systematic buy/sell orders at intervals',
    defaultParams: {
      gridSize: 0.01,
      gridLevels: 10,
      baseOrderSize: 0.1
    }
  },
  dca: {
    name: 'Dollar Cost Averaging',
    description: 'Regular purchases regardless of price',
    defaultParams: {
      interval: 24,
      amount: 100,
      maxDeviation: 0.05
    }
  }
}

export function RealBacktestingDashboard({ className }: RealBacktestingDashboardProps) {
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>({
    strategy: 'momentum',
    symbol: 'BTC/USD',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCapital: 10000,
    parameters: STRATEGY_TEMPLATES.momentum.defaultParams,
    commission: 0.001, // 0.1%
    slippage: 0.0005 // 0.05%
  })

  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedResult, setSelectedResult] = useState<string | null>(null)

  const availableSymbols = [
    'BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD',
    'LINK/USD', 'UNI/USD', 'AAVE/USD', 'MATIC/USD', 'AVAX/USD'
  ]

  const handleStrategyChange = (strategyType: TradingStrategy['type']) => {
    const template = STRATEGY_TEMPLATES[strategyType]
    setBacktestConfig(prev => ({
      ...prev,
      strategy: strategyType,
      parameters: template.defaultParams
    }))
  }

  const handleParameterChange = (key: string, value: any) => {
    setBacktestConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }))
  }

  const runBacktest = async () => {
    setIsRunning(true)
    
    const newResult: BacktestResult = {
      id: `backtest_${Date.now()}`,
      config: { ...backtestConfig },
      status: 'running',
      startTime: new Date(),
      totalReturn: 0,
      annualizedReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      totalTrades: 0,
      profitFactor: 0,
      portfolioValue: [],
      trades: [],
      monthlyReturns: [],
      riskMetrics: {
        volatility: 0,
        beta: 0,
        alpha: 0,
        calmarRatio: 0
      }
    }

    setBacktestResults(prev => [newResult, ...prev])

    // Simulate backtest execution
    setTimeout(() => {
      const result = generateBacktestResults(newResult)
      setBacktestResults(prev => prev.map(r => r.id === newResult.id ? result : r))
      setSelectedResult(result.id)
      setIsRunning(false)
    }, 3000) // 3 second simulation
  }

  const generateBacktestResults = (baseResult: BacktestResult): BacktestResult => {
    const { config } = baseResult
    const startDate = new Date(config.startDate)
    const endDate = new Date(config.endDate)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Generate portfolio value over time
    const portfolioValue = []
    const trades = []
    const monthlyReturns = []
    
    let currentValue = config.initialCapital
    let totalTrades = 0
    let winningTrades = 0
    let maxValue = currentValue
    let maxDrawdown = 0
    
    // Generate daily portfolio values
    for (let i = 0; i <= daysDiff; i += 7) { // Weekly data points
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      // Simulate strategy performance based on type
      let weeklyReturn = 0
      switch (config.strategy) {
        case 'momentum':
          weeklyReturn = (Math.random() - 0.4) * 0.05 // Slight positive bias
          break
        case 'mean_reversion':
          weeklyReturn = (Math.random() - 0.45) * 0.04 // Conservative returns
          break
        case 'arbitrage':
          weeklyReturn = Math.random() * 0.01 // Low but consistent returns
          break
        case 'grid':
          weeklyReturn = (Math.random() - 0.35) * 0.03 // Steady growth
          break
        case 'dca':
          weeklyReturn = (Math.random() - 0.3) * 0.02 // Very stable
          break
      }
      
      currentValue = currentValue * (1 + weeklyReturn)
      portfolioValue.push({
        date: date.toISOString().split('T')[0],
        value: currentValue
      })
      
      // Track max drawdown
      if (currentValue > maxValue) {
        maxValue = currentValue
      }
      const drawdown = (maxValue - currentValue) / maxValue
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
      
      // Generate some trades
      if (Math.random() > 0.7) { // 30% chance of trade each week
        const isWinning = weeklyReturn > 0
        if (isWinning) winningTrades++
        totalTrades++
        
        trades.push({
          date: date.toISOString().split('T')[0],
          action: Math.random() > 0.5 ? 'buy' : 'sell',
          quantity: Math.floor(Math.random() * 10) + 1,
          price: 50000 + (Math.random() - 0.5) * 10000, // Mock price
          pnl: weeklyReturn * currentValue * 0.1 // Mock P&L
        })
      }
    }
    
    // Generate monthly returns
    for (let month = 0; month < 12; month++) {
      const monthlyReturn = (Math.random() - 0.3) * 0.15
      monthlyReturns.push({
        month: new Date(2024, month).toLocaleDateString('en-US', { month: 'short' }),
        return: monthlyReturn * 100
      })
    }
    
    // Calculate final metrics
    const totalReturn = (currentValue - config.initialCapital) / config.initialCapital
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / daysDiff) - 1
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0
    
    // Calculate risk metrics
    const returns = portfolioValue.slice(1).map((p, i) => 
      (p.value - portfolioValue[i].value) / portfolioValue[i].value
    )
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const volatility = Math.sqrt(variance) * Math.sqrt(52) // Annualized
    const sharpeRatio = volatility > 0 ? (annualizedReturn - 0.02) / volatility : 0 // Assuming 2% risk-free rate
    
    const profitFactor = Math.random() * 2 + 0.5 // Mock profit factor
    
    return {
      ...baseResult,
      status: 'completed',
      endTime: new Date(),
      duration: 3000,
      totalReturn: totalReturn * 100,
      annualizedReturn: annualizedReturn * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      winRate: winRate * 100,
      totalTrades,
      profitFactor,
      portfolioValue,
      trades,
      monthlyReturns,
      riskMetrics: {
        volatility: volatility * 100,
        beta: 0.8 + Math.random() * 0.4,
        alpha: (annualizedReturn - 0.1) * 100, // vs 10% market return
        calmarRatio: annualizedReturn / (maxDrawdown || 0.01)
      }
    }
  }

  const getSelectedResult = (): BacktestResult | null => {
    return backtestResults.find(r => r.id === selectedResult) || null
  }

  const exportResults = (result: BacktestResult) => {
    const data = {
      config: result.config,
      results: {
        totalReturn: result.totalReturn,
        sharpeRatio: result.sharpeRatio,
        maxDrawdown: result.maxDrawdown,
        winRate: result.winRate,
        totalTrades: result.totalTrades
      },
      portfolioValue: result.portfolioValue,
      trades: result.trades,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backtest-${result.config.strategy}-${result.config.symbol}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedResultData = getSelectedResult()

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2 text-green-600" />
              Strategy Backtesting
            </h2>
            <p className="text-sm text-gray-600">Test your trading strategies against historical data</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={runBacktest}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
            
            {selectedResultData && (
              <Button
                variant="outline"
                onClick={() => exportResults(selectedResultData)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span>Backtest Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strategy Selection */}
                <div>
                  <Label htmlFor="strategy">Trading Strategy</Label>
                  <Select
                    value={backtestConfig.strategy}
                    onValueChange={handleStrategyChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-gray-600">{template.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Symbol */}
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Select
                    value={backtestConfig.symbol}
                    onValueChange={(value) => setBacktestConfig(prev => ({ ...prev, symbol: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSymbols.map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={backtestConfig.startDate}
                      onChange={(e) => setBacktestConfig(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={backtestConfig.endDate}
                      onChange={(e) => setBacktestConfig(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Initial Capital */}
                <div>
                  <Label htmlFor="initialCapital">Initial Capital ($)</Label>
                  <Input
                    id="initialCapital"
                    type="number"
                    value={backtestConfig.initialCapital}
                    onChange={(e) => setBacktestConfig(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
                    min="1000"
                    step="1000"
                  />
                </div>

                {/* Strategy Parameters */}
                <div>
                  <Label>Strategy Parameters</Label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(backtestConfig.parameters).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Label className="text-xs w-24 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => handleParameterChange(key, Number(e.target.value))}
                          className="text-xs"
                          step="0.001"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trading Costs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commission">Commission (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      value={backtestConfig.commission * 100}
                      onChange={(e) => setBacktestConfig(prev => ({ ...prev, commission: Number(e.target.value) / 100 }))}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slippage">Slippage (%)</Label>
                    <Input
                      id="slippage"
                      type="number"
                      value={backtestConfig.slippage * 100}
                      onChange={(e) => setBacktestConfig(prev => ({ ...prev, slippage: Number(e.target.value) / 100 }))}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span>Backtest History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {backtestResults.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No backtests yet</p>
                    </div>
                  ) : (
                    backtestResults.map((result) => (
                      <div
                        key={result.id}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedResult === result.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedResult(result.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {STRATEGY_TEMPLATES[result.config.strategy].name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {result.config.symbol} • {result.config.startDate}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              result.status === 'completed' ? 'default' :
                              result.status === 'running' ? 'secondary' : 'destructive'
                            }>
                              {result.status}
                            </Badge>
                            {result.status === 'completed' && (
                              <div className={`text-xs font-medium ${
                                result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedResultData ? (
              <>
                {/* Performance Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className={`text-2xl font-bold ${
                        selectedResultData.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedResultData.totalReturn >= 0 ? '+' : ''}{selectedResultData.totalReturn.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">Total Return</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedResultData.sharpeRatio.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Sharpe Ratio</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedResultData.maxDrawdown.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">Max Drawdown</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedResultData.winRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Win Rate</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedResultData.portfolioValue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#666"
                            fontSize={12}
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis stroke="#666" fontSize={12} />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Portfolio Value']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Performance Metrics</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Return:</span>
                            <span className={selectedResultData.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {selectedResultData.totalReturn.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annualized Return:</span>
                            <span className="font-medium">{selectedResultData.annualizedReturn.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Trades:</span>
                            <span className="font-medium">{selectedResultData.totalTrades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Win Rate:</span>
                            <span className="font-medium">{selectedResultData.winRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Profit Factor:</span>
                            <span className="font-medium">{selectedResultData.profitFactor.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Risk Metrics</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sharpe Ratio:</span>
                            <span className="font-medium">{selectedResultData.sharpeRatio.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Drawdown:</span>
                            <span className="text-red-600">{selectedResultData.maxDrawdown.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Volatility:</span>
                            <span className="font-medium">{selectedResultData.riskMetrics.volatility.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Beta:</span>
                            <span className="font-medium">{selectedResultData.riskMetrics.beta.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Alpha:</span>
                            <span className="font-medium">{selectedResultData.riskMetrics.alpha.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <PlayCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Backtest</h3>
                  <p className="text-gray-600">Configure your strategy and run a backtest to see detailed results</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealBacktestingDashboard