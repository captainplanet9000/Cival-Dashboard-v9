/**
 * Strategy Signal Feed
 * Real-time feed of strategy signals and trading recommendations
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Filter,
  Search,
  Bell,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { strategyService, STRATEGY_TYPES, StrategyType } from '@/lib/supabase/strategy-service'
import { agentStrategyIntegration } from '@/lib/agents/agent-strategy-integration'

interface StrategySignal {
  id: string
  strategyType: StrategyType
  strategyName: string
  agentId: string
  symbol: string
  signalType: 'buy' | 'sell' | 'hold'
  strength: number
  confidence: number
  entryPrice: number
  stopLoss: number
  takeProfit: number
  conditionsMet: string[]
  recommendation: string
  timestamp: Date
  status: 'active' | 'executed' | 'expired' | 'cancelled'
  marketConditions: {
    trend: string
    volatility: number
    volume: string
    momentum: string
  }
}

interface SignalFilters {
  strategyType: string
  signalType: string
  symbol: string
  minConfidence: number
  status: string
}

export default function StrategySignalFeed() {
  const [signals, setSignals] = useState<StrategySignal[]>([])
  const [filteredSignals, setFilteredSignals] = useState<StrategySignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SignalFilters>({
    strategyType: 'all',
    signalType: 'all',
    symbol: '',
    minConfidence: 0,
    status: 'all'
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadSignals()
    const interval = setInterval(loadSignals, 15000) // Update every 15 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [signals, filters, searchTerm])

  const loadSignals = async () => {
    try {
      setLoading(true)
      setError(null)

      // Generate mock signals for demonstration
      const mockSignals: StrategySignal[] = []
      const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD', 'AVAX/USD']
      const strategies = Object.values(STRATEGY_TYPES)
      const signalTypes: ('buy' | 'sell' | 'hold')[] = ['buy', 'sell', 'hold']
      const statuses: ('active' | 'executed' | 'expired' | 'cancelled')[] = ['active', 'executed', 'expired', 'cancelled']

      // Generate 50 mock signals
      for (let i = 0; i < 50; i++) {
        const strategyType = strategies[Math.floor(Math.random() * strategies.length)]
        const strategy = await strategyService.getOrCreateStrategy(strategyType)
        const symbol = symbols[Math.floor(Math.random() * symbols.length)]
        const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)]
        const basePrice = Math.random() * 50000 + 1000
        const confidence = Math.random() * 100
        const strength = Math.random() * 100

        const signal: StrategySignal = {
          id: `signal_${i}_${Date.now()}`,
          strategyType,
          strategyName: strategy?.name || strategyType,
          agentId: `agent_${Math.floor(Math.random() * 5) + 1}`,
          symbol,
          signalType,
          strength,
          confidence,
          entryPrice: basePrice,
          stopLoss: basePrice * (signalType === 'buy' ? 0.95 : 1.05),
          takeProfit: basePrice * (signalType === 'buy' ? 1.1 : 0.9),
          conditionsMet: [
            `${strategyType}_condition_1`,
            `${strategyType}_condition_2`,
            'volume_confirmation'
          ].slice(0, Math.floor(Math.random() * 3) + 1),
          recommendation: generateRecommendation(signalType, confidence, strength),
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          marketConditions: {
            trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
            volatility: Math.random() * 0.3 + 0.05,
            volume: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
            momentum: Math.random() > 0.6 ? 'strong' : Math.random() > 0.3 ? 'moderate' : 'weak'
          }
        }

        mockSignals.push(signal)
      }

      // Sort by timestamp (newest first)
      mockSignals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      setSignals(mockSignals)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signals')
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendation = (signalType: string, confidence: number, strength: number): string => {
    const confidenceLevel = confidence > 80 ? 'Strong' : confidence > 60 ? 'Moderate' : 'Weak'
    const action = signalType.toUpperCase()
    
    if (signalType === 'buy') {
      return `${confidenceLevel} ${action} signal. Entry opportunity with ${confidence.toFixed(0)}% confidence.`
    } else if (signalType === 'sell') {
      return `${confidenceLevel} ${action} signal. Exit opportunity with ${confidence.toFixed(0)}% confidence.`
    } else {
      return `${confidenceLevel} HOLD signal. Monitor position with ${confidence.toFixed(0)}% confidence.`
    }
  }

  const applyFilters = () => {
    let filtered = [...signals]

    // Apply strategy type filter
    if (filters.strategyType !== 'all') {
      filtered = filtered.filter(signal => signal.strategyType === filters.strategyType)
    }

    // Apply signal type filter
    if (filters.signalType !== 'all') {
      filtered = filtered.filter(signal => signal.signalType === filters.signalType)
    }

    // Apply symbol filter
    if (filters.symbol) {
      filtered = filtered.filter(signal => 
        signal.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      )
    }

    // Apply confidence filter
    if (filters.minConfidence > 0) {
      filtered = filtered.filter(signal => signal.confidence >= filters.minConfidence)
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(signal => signal.status === filters.status)
    }

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(signal => 
        signal.strategyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        signal.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        signal.recommendation.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredSignals(filtered)
  }

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'sell':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'hold':
        return <Minus className="w-4 h-4 text-yellow-500" />
      default:
        return <Zap className="w-4 h-4 text-gray-500" />
    }
  }

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'buy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'sell':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Bell className="w-4 h-4 text-blue-500" />
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'expired':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'executed':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Strategy Signal Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Strategy Signal Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 p-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p>Error loading signals: {error}</p>
            <Button onClick={loadSignals} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Strategy Signal Feed
          </div>
          <Badge variant="outline">{filteredSignals.length} signals</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search signals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Select value={filters.strategyType} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, strategyType: value }))
            }>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Strategy Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {Object.values(STRATEGY_TYPES).map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.signalType} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, signalType: value }))
            }>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Signal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Signals</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value }))
            }>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min Confidence %"
              value={filters.minConfidence || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                minConfidence: parseInt(e.target.value) || 0 
              }))}
              className="w-36"
            />
          </div>
        </div>

        {/* Signal Feed */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredSignals.map((signal) => (
            <div key={signal.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getSignalIcon(signal.signalType)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{signal.strategyName}</span>
                      <Badge className={`${getSignalColor(signal.signalType)} text-xs`}>
                        {signal.signalType.toUpperCase()}
                      </Badge>
                      <Badge className={`${getStatusColor(signal.status)} text-xs`}>
                        {getStatusIcon(signal.status)}
                        {signal.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="font-medium">{signal.symbol}</span>
                      <span>Agent: {signal.agentId}</span>
                      <span>Entry: {formatCurrency(signal.entryPrice)}</span>
                      <span className={getConfidenceColor(signal.confidence)}>
                        {formatPercentage(signal.confidence)} confidence
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{signal.recommendation}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>SL: {formatCurrency(signal.stopLoss)}</span>
                      <span>TP: {formatCurrency(signal.takeProfit)}</span>
                      <span>Strength: {formatPercentage(signal.strength)}</span>
                      <span>Conditions: {signal.conditionsMet.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right text-sm text-gray-500">
                  <div>{signal.timestamp.toLocaleTimeString()}</div>
                  <div>{signal.timestamp.toLocaleDateString()}</div>
                </div>
              </div>
              
              {/* Market Conditions */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Trend: {signal.marketConditions.trend}</span>
                  <span>Volatility: {formatPercentage(signal.marketConditions.volatility * 100)}</span>
                  <span>Volume: {signal.marketConditions.volume}</span>
                  <span>Momentum: {signal.marketConditions.momentum}</span>
                </div>
              </div>
            </div>
          ))}
          
          {filteredSignals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-4" />
              <p>No signals match your current filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}