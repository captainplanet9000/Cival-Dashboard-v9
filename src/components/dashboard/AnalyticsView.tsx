/**
 * Analytics View Component
 * Advanced analytics with USDT.D correlation analysis
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Activity,
  Target,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Settings,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Minus,
  Plus,
  DollarSign,
  Percent
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell,
  PieChart as RechartsPie,
  Legend
} from 'recharts'

import { useAppStore, USDTDData, USDTDCorrelation, USDTDSignal } from '@/lib/stores/app-store'
import { 
  usdtdMonitorService, 
  USDTDMetrics, 
  CorrelationAnalysis, 
  MarketRegime,
  TradingSignal 
} from '@/lib/services/usdtd-monitor-service'

interface AnalyticsMetrics {
  portfolioPerformance: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  avgReturn: number
  totalTrades: number
  profitFactor: number
  volatility: number
}

export function AnalyticsView() {
  const [activeTab, setActiveTab] = useState('usdtd')
  const [timeframe, setTimeframe] = useState('24h')
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')
  const [isLoading, setIsLoading] = useState(false)

  // USDT.D data states
  const [usdtdMetrics, setUsdtdMetrics] = useState<USDTDMetrics>({
    currentIndex: 0,
    change24h: 0,
    change7d: 0,
    change30d: 0,
    volatility: 0,
    momentum: 0,
    trend: 'neutral'
  })
  const [usdtdHistory, setUsdtdHistory] = useState<USDTDData[]>([])
  const [correlationData, setCorrelationData] = useState<CorrelationAnalysis[]>([])
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null)
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([])

  // Portfolio analytics
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics>({
    portfolioPerformance: 15.7,
    sharpeRatio: 1.85,
    maxDrawdown: -8.2,
    winRate: 68.5,
    avgReturn: 2.3,
    totalTrades: 147,
    profitFactor: 2.4,
    volatility: 18.5
  })

  // Store integration
  const {
    usdtdData,
    usdtdCorrelations,
    usdtdSignals,
    addUSDTDData,
    updateUSDTDCorrelations,
    addUSDTDSignal
  } = useAppStore()

  // Initialize services
  useEffect(() => {
    initializeAnalytics()
  }, [])

  const initializeAnalytics = async () => {
    setIsLoading(true)
    try {
      await usdtdMonitorService.start()
      await loadAnalyticsData()
    } catch (error) {
      console.error('Error initializing analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalyticsData = async () => {
    try {
      const [metrics, history, correlations, regime, signals] = await Promise.all([
        usdtdMonitorService.getCurrentMetrics(),
        usdtdMonitorService.getHistoricalData(100),
        usdtdMonitorService.getCorrelationAnalysis(),
        usdtdMonitorService.getMarketRegime(),
        usdtdMonitorService.getRecentSignals(10)
      ])

      setUsdtdMetrics(metrics)
      setUsdtdHistory(history)
      setCorrelationData(correlations)
      setMarketRegime(regime)
      setTradingSignals(signals)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    }
  }

  // Generate correlation chart data
  const getCorrelationChartData = () => {
    return correlationData.slice(0, 20).map(item => ({
      symbol: item.symbol,
      correlation24h: item.correlation24h,
      correlation7d: item.correlation7d,
      strength: Math.abs(item.correlation24h),
      direction: item.correlation24h >= 0 ? 'positive' : 'negative'
    }))
  }

  // Generate USDT.D historical chart data
  const getUSDTDChartData = () => {
    return usdtdHistory.map(item => ({
      time: item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: item.indexValue,
      change: item.change24h,
      volume: item.volume24h / 1000000000 // Convert to billions
    }))
  }

  // Generate market regime visualization data
  const getMarketRegimeData = () => {
    if (!marketRegime) return []

    return [
      { name: 'Risk On', value: marketRegime.regime === 'risk_on' ? 100 : 0, color: '#10b981' },
      { name: 'Risk Off', value: marketRegime.regime === 'risk_off' ? 100 : 0, color: '#ef4444' },
      { name: 'Neutral', value: marketRegime.regime === 'neutral' ? 100 : 0, color: '#6b7280' },
      { name: 'Transitional', value: marketRegime.regime === 'transitional' ? 100 : 0, color: '#f59e0b' }
    ].filter(item => item.value > 0)
  }

  // Generate portfolio performance chart
  const getPortfolioPerformanceData = () => {
    const data = []
    const now = new Date()
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const baseValue = 10000
      const randomReturn = (Math.random() - 0.4) * 200 // Slight upward bias
      const cumulativeReturn = (30 - i) * 15 + randomReturn // Trending up
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: baseValue + cumulativeReturn,
        benchmark: baseValue + (30 - i) * 10, // Slower benchmark growth
        drawdown: Math.min(0, -Math.abs(Math.sin(i * 0.5)) * 500)
      })
    }
    return data
  }

  // USDT.D metrics card component
  const USDTDMetricsCard = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">USDT.D Index</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usdtdMetrics.currentIndex.toFixed(3)}</div>
          <div className={`text-xs flex items-center mt-1 ${
            usdtdMetrics.change24h >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {usdtdMetrics.change24h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(usdtdMetrics.change24h).toFixed(2)}% (24h)
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Momentum</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            usdtdMetrics.momentum >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {(usdtdMetrics.momentum * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">6hr moving average</div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Volatility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {(usdtdMetrics.volatility * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">24hr standard deviation</div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
            variant={
              usdtdMetrics.trend === 'bullish' ? 'default' : 
              usdtdMetrics.trend === 'bearish' ? 'destructive' : 'secondary'
            }
            className="text-sm"
          >
            {usdtdMetrics.trend.toUpperCase()}
          </Badge>
          <div className="text-xs text-gray-500 mt-1">Current direction</div>
        </CardContent>
      </Card>
    </div>
  )

  // Correlation strength indicator
  const CorrelationStrengthIndicator = ({ correlation }: { correlation: CorrelationAnalysis }) => {
    const absCorr = Math.abs(correlation.correlation24h)
    const strengthColor = 
      absCorr > 0.8 ? 'text-red-600' :
      absCorr > 0.6 ? 'text-orange-600' :
      absCorr > 0.4 ? 'text-yellow-600' :
      absCorr > 0.2 ? 'text-blue-600' : 'text-gray-500'

    return (
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          absCorr > 0.8 ? 'bg-red-500' :
          absCorr > 0.6 ? 'bg-orange-500' :
          absCorr > 0.4 ? 'bg-yellow-500' :
          absCorr > 0.2 ? 'bg-blue-500' : 'bg-gray-400'
        }`} />
        <span className={`text-sm font-medium ${strengthColor}`}>
          {correlation.strength.replace('_', ' ').toUpperCase()}
        </span>
      </div>
    )
  }

  // Trading signal component
  const TradingSignalCard = ({ signal }: { signal: TradingSignal }) => (
    <Card className={`border-l-4 ${
      signal.signalType === 'long' ? 'border-emerald-500' :
      signal.signalType === 'short' ? 'border-red-500' : 'border-gray-500'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Badge variant={
              signal.signalType === 'long' ? 'default' :
              signal.signalType === 'short' ? 'destructive' : 'secondary'
            }>
              {signal.signalType.toUpperCase()}
            </Badge>
            <span className="text-sm font-medium">
              Strength: {(signal.strength * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {signal.timeframe} • {signal.confidence.toFixed(1)} confidence
          </div>
        </div>
        <div className="text-sm text-gray-700 mb-2">{signal.triggerReason}</div>
        <div className="flex flex-wrap gap-1">
          {signal.recommendedSymbols.slice(0, 5).map(symbol => (
            <Badge key={symbol} variant="outline" className="text-xs">
              {symbol}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
            Advanced Analytics
          </h1>
          <p className="text-gray-500">USDT.D correlation analysis and portfolio performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="4h">4 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalyticsData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usdtd">USDT.D Analysis</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="usdtd" className="space-y-6">
          {/* USDT.D Metrics */}
          <USDTDMetricsCard />

          {/* Market Regime */}
          {marketRegime && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Market Regime Analysis</span>
                  <Badge variant={
                    marketRegime.regime === 'risk_on' ? 'default' :
                    marketRegime.regime === 'risk_off' ? 'destructive' : 'secondary'
                  }>
                    {marketRegime.regime.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Current Regime</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Confidence</span>
                        <span className="font-medium">{(marketRegime.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={marketRegime.confidence * 100} className="h-2" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Market Implications</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Crypto</span>
                        <Badge variant={
                          marketRegime.implications.crypto === 'bullish' ? 'default' :
                          marketRegime.implications.crypto === 'bearish' ? 'destructive' : 'secondary'
                        }>
                          {marketRegime.implications.crypto}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Altcoins</span>
                        <Badge variant={
                          marketRegime.implications.alts === 'bullish' ? 'default' :
                          marketRegime.implications.alts === 'bearish' ? 'destructive' : 'secondary'
                        }>
                          {marketRegime.implications.alts}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stablecoins</span>
                        <Badge variant="outline">
                          {marketRegime.implications.stablecoins}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* USDT.D Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>USDT.D Index History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getUSDTDChartData()}>
                    <defs>
                      <linearGradient id="usdtdGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8b5cf6" 
                      fillOpacity={1} 
                      fill="url(#usdtdGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-6">
          {/* Correlation Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Strong Correlations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {correlationData.filter(c => Math.abs(c.correlation24h) > 0.6).length}
                </div>
                <div className="text-xs text-gray-500 mt-1">|r| &gt; 0.6</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Negative Correlations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {correlationData.filter(c => c.correlation24h < -0.3).length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Counter-trading opportunities</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">High Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet-600">
                  {correlationData.filter(c => c.confidence > 0.7).length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Reliable patterns</div>
              </CardContent>
            </Card>
          </div>

          {/* Correlation Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Symbol Correlations with USDT.D</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getCorrelationChartData()} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[-1, 1]} />
                    <YAxis dataKey="symbol" type="category" width={60} />
                    <Tooltip />
                    <Bar dataKey="correlation24h">
                      {getCorrelationChartData().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.correlation24h >= 0 ? '#ef4444' : '#10b981'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Correlation Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Detailed Correlation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {correlationData.slice(0, 15).map(correlation => (
                  <div key={correlation.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                        {correlation.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{correlation.symbol}</div>
                        <CorrelationStrengthIndicator correlation={correlation} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        correlation.correlation24h >= 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {correlation.correlation24h.toFixed(3)}
                      </div>
                      <div className="text-xs text-gray-500">
                        7d: {correlation.correlation7d.toFixed(3)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          {/* Portfolio Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">+{analyticsMetrics.portfolioPerformance}%</div>
                <div className="text-xs text-gray-500 mt-1">Total return</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Sharpe Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet-600">{analyticsMetrics.sharpeRatio}</div>
                <div className="text-xs text-gray-500 mt-1">Risk-adjusted return</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analyticsMetrics.maxDrawdown}%</div>
                <div className="text-xs text-gray-500 mt-1">Worst decline</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{analyticsMetrics.winRate}%</div>
                <div className="text-xs text-gray-500 mt-1">Successful trades</div>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Performance Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Portfolio Performance vs Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getPortfolioPerformanceData()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Portfolio"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#6b7280" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Benchmark"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Trading Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Trades</span>
                  <span className="font-semibold">{analyticsMetrics.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Average Return</span>
                  <span className="font-semibold text-emerald-600">+{analyticsMetrics.avgReturn}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Profit Factor</span>
                  <span className="font-semibold">{analyticsMetrics.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Volatility</span>
                  <span className="font-semibold">{analyticsMetrics.volatility}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Value at Risk (95%)</span>
                  <span className="font-semibold text-red-600">-2.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Beta</span>
                  <span className="font-semibold">0.85</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Alpha</span>
                  <span className="font-semibold text-emerald-600">+5.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Correlation to BTC</span>
                  <span className="font-semibold">0.72</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="signals" className="space-y-6">
          {/* Signal Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Active Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{tradingSignals.length}</div>
                <div className="text-xs text-gray-500 mt-1">Based on USDT.D analysis</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Long Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {tradingSignals.filter(s => s.signalType === 'long').length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Buy opportunities</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Short Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {tradingSignals.filter(s => s.signalType === 'short').length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Sell opportunities</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Signals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Trading Signals</h3>
            {tradingSignals.length > 0 ? (
              tradingSignals.map(signal => (
                <TradingSignalCard key={signal.id} signal={signal} />
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <Target className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Signals</h3>
                  <p className="text-gray-500">USDT.D analysis will generate signals when conditions are met</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}