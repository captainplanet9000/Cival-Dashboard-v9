/**
 * HyperLend View Component
 * Complete lending and borrowing interface for Hyperliquid
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  CreditCard, 
  Plus, 
  Minus,
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Shield,
  Target,
  DollarSign,
  Percent,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Zap,
  Settings,
  Eye,
  EyeOff,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Info
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

import { useAppStore, HyperLendMarket, HyperLendPosition } from '@/lib/stores/app-store'
import { LendingRate, LiquidationAlert, MarketConditions } from '@/lib/services/hyperlend-service'

interface PositionMetrics {
  totalSupplied: number
  totalBorrowed: number
  netAPY: number
  healthFactor: number
  borrowingPower: number
  liquidationRisk: 'low' | 'medium' | 'high' | 'critical'
}

export function HyperLendView() {
  const [activeTab, setActiveTab] = useState('markets')
  const [selectedMarket, setSelectedMarket] = useState<HyperLendMarket | null>(null)
  const [isSupplyDialogOpen, setIsSupplyDialogOpen] = useState(false)
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false)
  const [isStrategyDialogOpen, setIsStrategyDialogOpen] = useState(false)
  
  // Form states
  const [supplyForm, setSupplyForm] = useState({
    asset: '',
    amount: '',
    useAsCollateral: true
  })
  const [borrowForm, setBorrowForm] = useState({
    asset: '',
    amount: ''
  })

  // Data states
  const [markets, setMarkets] = useState<HyperLendMarket[]>([])
  const [lendingRates, setLendingRates] = useState<LendingRate[]>([])
  const [userPositions, setUserPositions] = useState<HyperLendPosition[]>([])
  const [liquidationAlerts, setLiquidationAlerts] = useState<LiquidationAlert[]>([])
  const [marketConditions, setMarketConditions] = useState<MarketConditions | null>(null)
  const [positionMetrics, setPositionMetrics] = useState<PositionMetrics>({
    totalSupplied: 0,
    totalBorrowed: 0,
    netAPY: 0,
    healthFactor: 0,
    borrowingPower: 0,
    liquidationRisk: 'low'
  })
  
  const [isLoading, setIsLoading] = useState(false)

  // Store integration
  const {
    hyperLendMarkets,
    hyperLendPositions,
    setHyperLendMarkets,
    addHyperLendPosition,
    updateHyperLendPosition
  } = useAppStore()

  // Initialize service and load data
  useEffect(() => {
    initializeService()
  }, [])

  const initializeService = async () => {
    setIsLoading(true)
    try {
      const { hyperLendService } = await import('@/lib/services/hyperlend-service')
      await hyperLendService.initialize()
      await loadAllData()
    } catch (error) {
      console.error('Error initializing HyperLend service:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllData = async () => {
    try {
      const { hyperLendService } = await import('@/lib/services/hyperlend-service')
      const [marketsData, ratesData, positionsData, conditionsData, alertsData] = await Promise.all([
        hyperLendService.getMarkets(),
        hyperLendService.getLendingRates(),
        hyperLendService.getUserPositions('user123'), // Mock user ID
        hyperLendService.getMarketConditions(),
        hyperLendService.getLiquidationAlerts('user123')
      ])

      setMarkets(marketsData)
      setLendingRates(ratesData)
      setUserPositions(positionsData)
      setMarketConditions(conditionsData)
      setLiquidationAlerts(alertsData)
      
      // Update store
      setHyperLendMarkets(marketsData)

      // Calculate position metrics
      await calculatePositionMetrics(positionsData)
    } catch (error) {
      console.error('Error loading HyperLend data:', error)
    }
  }

  const calculatePositionMetrics = async (positions: HyperLendPosition[]) => {
    let totalSupplied = 0
    let totalBorrowed = 0
    let weightedSupplyAPR = 0
    let weightedBorrowAPR = 0

    positions.forEach(position => {
      if (position.positionType === 'supply' && position.isActive) {
        totalSupplied += position.amountUSD
        weightedSupplyAPR += position.amountUSD * position.aprAtEntry
      } else if (position.positionType === 'borrow' && position.isActive) {
        totalBorrowed += position.amountUSD
        weightedBorrowAPR += position.amountUSD * position.aprAtEntry
      }
    })

    const avgSupplyAPR = totalSupplied > 0 ? weightedSupplyAPR / totalSupplied : 0
    const avgBorrowAPR = totalBorrowed > 0 ? weightedBorrowAPR / totalBorrowed : 0
    const netAPY = avgSupplyAPR - avgBorrowAPR

    const { hyperLendService } = await import('@/lib/services/hyperlend-service')
    const healthFactor = await hyperLendService.calculateHealthFactor('user123')
    const borrowingPower = await hyperLendService.getBorrowingPower('user123')

    let liquidationRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (healthFactor < 1.1) liquidationRisk = 'critical'
    else if (healthFactor < 1.3) liquidationRisk = 'high'
    else if (healthFactor < 1.5) liquidationRisk = 'medium'

    setPositionMetrics({
      totalSupplied,
      totalBorrowed,
      netAPY,
      healthFactor,
      borrowingPower,
      liquidationRisk
    })
  }

  const handleSupply = async () => {
    if (!supplyForm.asset || !supplyForm.amount) return

    setIsLoading(true)
    try {
      const { hyperLendService } = await import('@/lib/services/hyperlend-service')
      const txHash = await hyperLendService.supply(
        supplyForm.asset,
        parseFloat(supplyForm.amount),
        supplyForm.useAsCollateral
      )
      
      if (txHash) {
        await loadAllData() // Refresh data
        setIsSupplyDialogOpen(false)
        setSupplyForm({ asset: '', amount: '', useAsCollateral: true })
      }
    } catch (error) {
      console.error('Error supplying assets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBorrow = async () => {
    if (!borrowForm.asset || !borrowForm.amount) return

    setIsLoading(true)
    try {
      const { hyperLendService } = await import('@/lib/services/hyperlend-service')
      const txHash = await hyperLendService.borrow(
        borrowForm.asset,
        parseFloat(borrowForm.amount)
      )
      
      if (txHash) {
        await loadAllData() // Refresh data
        setIsBorrowDialogOpen(false)
        setBorrowForm({ asset: '', amount: '' })
      }
    } catch (error) {
      console.error('Error borrowing assets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate chart data for market overview
  const generateMarketChart = () => {
    return lendingRates.map(rate => ({
      asset: rate.symbol,
      supplyAPR: rate.supplyAPR,
      borrowAPR: rate.borrowAPR,
      utilization: rate.utilization,
      tvl: rate.totalSupply * 100 // Mock TVL calculation
    }))
  }

  // Market card component
  const MarketCard = ({ rate }: { rate: LendingRate }) => (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg"
      onClick={() => {
        const market = markets.find(m => m.symbol === rate.symbol)
        setSelectedMarket(market || null)
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 flex items-center justify-center text-white font-bold">
              {rate.symbol.substring(0, 2)}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{rate.symbol}</CardTitle>
              <CardDescription className="text-xs">Hyperliquid Market</CardDescription>
            </div>
          </div>
          <Badge variant={rate.utilization > 80 ? "destructive" : rate.utilization > 60 ? "default" : "secondary"}>
            {rate.utilization.toFixed(1)}% Utilized
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Supply APR</span>
            <span className="font-semibold text-emerald-600">{rate.supplyAPR.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Borrow APR</span>
            <span className="font-semibold text-red-600">{rate.borrowAPR.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Available</span>
            <span className="text-sm">${rate.availableLiquidity.toLocaleString()}</span>
          </div>
          <Progress value={rate.utilization} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )

  // Position card component
  const PositionCard = ({ position }: { position: HyperLendPosition }) => {
    const market = markets.find(m => m.id === position.marketId)
    const isSupply = position.positionType === 'supply'
    
    return (
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            {/* Asset */}
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${
                isSupply ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'
              } flex items-center justify-center text-white text-xs font-bold`}>
                {market?.symbol.substring(0, 2) || 'N/A'}
              </div>
              <div>
                <div className="font-semibold">{market?.symbol || 'Unknown'}</div>
                <Badge variant={isSupply ? "default" : "destructive"} className="text-xs">
                  {isSupply ? 'Supply' : 'Borrow'}
                </Badge>
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="font-semibold">
                {position.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </div>
              <div className="text-xs text-gray-500">{market?.symbol}</div>
            </div>

            {/* USD Value */}
            <div>
              <div className="font-semibold">${position.amountUSD.toLocaleString()}</div>
              <div className="text-xs text-gray-500">USD Value</div>
            </div>

            {/* APR */}
            <div>
              <div className={`font-semibold ${isSupply ? 'text-emerald-600' : 'text-red-600'}`}>
                {position.aprAtEntry.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500">APR</div>
            </div>

            {/* Interest/Health */}
            <div>
              {isSupply ? (
                <>
                  <div className="font-semibold text-emerald-600">
                    ${(position.interestEarnedUSD || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Earned</div>
                </>
              ) : (
                <>
                  <div className={`font-semibold ${
                    (position.healthFactor || 0) < 1.3 ? 'text-red-600' : 
                    (position.healthFactor || 0) < 1.5 ? 'text-yellow-600' : 'text-emerald-600'
                  }`}>
                    {(position.healthFactor || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Health Factor</div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isSupply) {
                    // Open withdraw dialog
                  } else {
                    // Open repay dialog
                  }
                }}
              >
                {isSupply ? <Minus className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Alert card component
  const AlertCard = ({ alert }: { alert: LiquidationAlert }) => (
    <Card className={`border-l-4 ${
      alert.severity === 'critical' ? 'border-red-500' :
      alert.severity === 'high' ? 'border-orange-500' :
      alert.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`w-5 h-5 ${
              alert.severity === 'critical' ? 'text-red-500' :
              alert.severity === 'high' ? 'text-orange-500' :
              alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
            }`} />
            <div>
              <div className="font-semibold">Health Factor: {alert.currentHealthFactor.toFixed(2)}</div>
              <div className="text-sm text-gray-500">
                {alert.timeToLiquidation < 24 ? 
                  `${alert.timeToLiquidation}h to liquidation` :
                  `${Math.round(alert.timeToLiquidation / 24)}d to liquidation`
                }
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={
              alert.severity === 'critical' ? 'destructive' : 
              alert.severity === 'high' ? 'destructive' : 'default'
            }>
              {alert.severity.toUpperCase()}
            </Badge>
            <div className="text-xs text-gray-500 mt-1">
              {alert.recommendedAction.replace('_', ' ').toUpperCase()}
            </div>
          </div>
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
            HyperLend Protocol
          </h1>
          <p className="text-gray-500">Lending and borrowing on Hyperliquid</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadAllData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Activity className="w-4 h-4 mr-2" />
            Live Rates
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Supplied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${positionMetrics.totalSupplied.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Earning interest</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Borrowed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${positionMetrics.totalBorrowed.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Paying interest</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Health Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              positionMetrics.healthFactor < 1.3 ? 'text-red-600' : 
              positionMetrics.healthFactor < 1.5 ? 'text-yellow-600' : 'text-emerald-600'
            }`}>
              {positionMetrics.healthFactor === Infinity ? '∞' : positionMetrics.healthFactor.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Liquidation safety</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Borrowing Power</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">${positionMetrics.borrowingPower.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Available to borrow</p>
          </CardContent>
        </Card>
      </div>

      {/* Liquidation Alerts */}
      {liquidationAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-red-600 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Liquidation Alerts ({liquidationAlerts.length})
          </h3>
          {liquidationAlerts.map(alert => (
            <AlertCard key={alert.positionId} alert={alert} />
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Dialog open={isSupplyDialogOpen} onOpenChange={setIsSupplyDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Supply Assets
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Supply Assets</DialogTitle>
                  <DialogDescription>Earn interest by supplying assets to HyperLend</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="supply-asset">Asset</Label>
                    <Select value={supplyForm.asset} onValueChange={(value) => setSupplyForm(prev => ({ ...prev, asset: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset to supply" />
                      </SelectTrigger>
                      <SelectContent>
                        {markets.map(market => (
                          <SelectItem key={market.id} value={market.symbol}>
                            {market.symbol} - {market.supplyRateAPR.toFixed(2)}% APR
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="supply-amount">Amount</Label>
                    <Input
                      id="supply-amount"
                      type="number"
                      value={supplyForm.amount}
                      onChange={(e) => setSupplyForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-as-collateral"
                      checked={supplyForm.useAsCollateral}
                      onChange={(e) => setSupplyForm(prev => ({ ...prev, useAsCollateral: e.target.checked }))}
                    />
                    <Label htmlFor="use-as-collateral">Use as collateral</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsSupplyDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSupply} disabled={isLoading}>
                      {isLoading ? 'Supplying...' : 'Supply'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isBorrowDialogOpen} onOpenChange={setIsBorrowDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  <Minus className="w-4 h-4 mr-2" />
                  Borrow Assets
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Borrow Assets</DialogTitle>
                  <DialogDescription>Borrow assets against your collateral</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="borrow-asset">Asset</Label>
                    <Select value={borrowForm.asset} onValueChange={(value) => setBorrowForm(prev => ({ ...prev, asset: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset to borrow" />
                      </SelectTrigger>
                      <SelectContent>
                        {markets.map(market => (
                          <SelectItem key={market.id} value={market.symbol}>
                            {market.symbol} - {market.borrowRateAPR.toFixed(2)}% APR
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="borrow-amount">Amount</Label>
                    <Input
                      id="borrow-amount"
                      type="number"
                      value={borrowForm.amount}
                      onChange={(e) => setBorrowForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Available to borrow:</span>
                        <span className="font-semibold">${positionMetrics.borrowingPower.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsBorrowDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleBorrow} disabled={isLoading}>
                      {isLoading ? 'Borrowing...' : 'Borrow'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Markets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lendingRates.map(rate => (
              <MarketCard key={rate.symbol} rate={rate} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          {userPositions.length > 0 ? (
            <div className="space-y-3">
              {userPositions.map(position => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Positions</h3>
                <p className="text-gray-500 mb-4">Start by supplying assets to earn interest</p>
                <Button onClick={() => setIsSupplyDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Supply Assets
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Market Overview Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generateMarketChart()}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="asset" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="supplyAPR" fill="#10b981" name="Supply APR %" />
                    <Bar dataKey="borrowAPR" fill="#ef4444" name="Borrow APR %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Market Conditions */}
          {marketConditions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Protocol Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Value Locked</span>
                    <span className="font-semibold">${marketConditions.totalValueLocked.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Average Supply APR</span>
                    <span className="font-semibold text-emerald-600">{marketConditions.averageSupplyAPR.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Average Borrow APR</span>
                    <span className="font-semibold text-red-600">{marketConditions.averageBorrowAPR.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Health Factor</span>
                    <span className="font-semibold">{marketConditions.riskMetrics.averageHealthFactor}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Markets by TVL</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {marketConditions.topAssetsByTVL.map(asset => (
                    <div key={asset.asset} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                          {asset.asset.substring(0, 2)}
                        </div>
                        <span className="font-medium">{asset.asset}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${asset.tvl.toLocaleString()}</div>
                        <div className="text-xs text-emerald-600">{asset.apr.toFixed(2)}% APR</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Target className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Automated Strategies</h3>
              <p className="text-gray-500 mb-4">Create automated lending strategies coming soon</p>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configure Strategy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}