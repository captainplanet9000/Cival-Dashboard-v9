'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  TrendingUp, TrendingDown, Target, Zap, BarChart3, 
  Settings, Play, Pause, RefreshCw, AlertTriangle
} from 'lucide-react'
import { motion } from 'framer-motion'

interface ClassicStrategy {
  id: string
  name: string
  description: string
  type: 'momentum' | 'mean_reversion' | 'breakout' | 'grid' | 'dca' | 'scalping'
  riskLevel: 'low' | 'medium' | 'high'
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  successRate: number
  avgReturn: number
  maxDrawdown: number
  parameters: Record<string, any>
  isActive: boolean
  performance: {
    totalTrades: number
    winRate: number
    profitFactor: number
    sharpeRatio: number
  }
}

const defaultStrategies: ClassicStrategy[] = [
  {
    id: 'moving_average_crossover',
    name: 'Moving Average Crossover',
    description: 'Classic strategy using fast and slow moving averages to identify trend reversals',
    type: 'momentum',
    riskLevel: 'medium',
    timeframe: '1h',
    successRate: 68,
    avgReturn: 0.024,
    maxDrawdown: 0.08,
    parameters: {
      fastMA: 10,
      slowMA: 20,
      stopLoss: 0.02,
      takeProfit: 0.04
    },
    isActive: false,
    performance: {
      totalTrades: 156,
      winRate: 68.2,
      profitFactor: 1.45,
      sharpeRatio: 1.23
    }
  },
  {
    id: 'rsi_divergence',
    name: 'RSI Divergence',
    description: 'Identifies overbought/oversold conditions and divergences for entry signals',
    type: 'mean_reversion',
    riskLevel: 'medium',
    timeframe: '15m',
    successRate: 72,
    avgReturn: 0.018,
    maxDrawdown: 0.06,
    parameters: {
      rsiPeriod: 14,
      overbought: 70,
      oversold: 30,
      divergenceLookback: 5
    },
    isActive: true,
    performance: {
      totalTrades: 203,
      winRate: 72.4,
      profitFactor: 1.68,
      sharpeRatio: 1.56
    }
  },
  {
    id: 'bollinger_bands',
    name: 'Bollinger Bands Squeeze',
    description: 'Trades volatility breakouts from Bollinger Bands squeeze conditions',
    type: 'breakout',
    riskLevel: 'high',
    timeframe: '5m',
    successRate: 65,
    avgReturn: 0.032,
    maxDrawdown: 0.12,
    parameters: {
      period: 20,
      standardDeviations: 2,
      squeezeThreshold: 0.1,
      breakoutMultiplier: 1.5
    },
    isActive: false,
    performance: {
      totalTrades: 89,
      winRate: 64.8,
      profitFactor: 1.34,
      sharpeRatio: 0.98
    }
  },
  {
    id: 'grid_trading',
    name: 'Grid Trading',
    description: 'Places buy and sell orders at regular intervals above and below market price',
    type: 'grid',
    riskLevel: 'low',
    timeframe: '1h',
    successRate: 78,
    avgReturn: 0.015,
    maxDrawdown: 0.04,
    parameters: {
      gridSpacing: 0.5,
      numberOfGrids: 10,
      orderSize: 100,
      maxPosition: 1000
    },
    isActive: true,
    performance: {
      totalTrades: 342,
      winRate: 78.1,
      profitFactor: 1.89,
      sharpeRatio: 2.01
    }
  },
  {
    id: 'dca_strategy',
    name: 'Dollar Cost Averaging',
    description: 'Systematic buying at regular intervals regardless of price movements',
    type: 'dca',
    riskLevel: 'low',
    timeframe: '4h',
    successRate: 82,
    avgReturn: 0.028,
    maxDrawdown: 0.15,
    parameters: {
      investmentAmount: 500,
      frequency: 'daily',
      durationWeeks: 12,
      rebalanceThreshold: 0.05
    },
    isActive: true,
    performance: {
      totalTrades: 84,
      winRate: 82.1,
      profitFactor: 2.15,
      sharpeRatio: 1.78
    }
  },
  {
    id: 'scalping_1m',
    name: '1-Minute Scalping',
    description: 'High-frequency scalping strategy targeting small, quick profits',
    type: 'scalping',
    riskLevel: 'high',
    timeframe: '1m',
    successRate: 58,
    avgReturn: 0.008,
    maxDrawdown: 0.18,
    parameters: {
      targetProfit: 0.003,
      stopLoss: 0.002,
      maxTradesPerHour: 20,
      volumeFilter: 1000000
    },
    isActive: false,
    performance: {
      totalTrades: 1247,
      winRate: 58.3,
      profitFactor: 1.12,
      sharpeRatio: 0.67
    }
  }
]

export function ClassicStrategies() {
  const [strategies, setStrategies] = useState<ClassicStrategy[]>(defaultStrategies)
  const [selectedStrategy, setSelectedStrategy] = useState<ClassicStrategy | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'momentum': return <TrendingUp className="h-4 w-4" />
      case 'mean_reversion': return <RefreshCw className="h-4 w-4" />
      case 'breakout': return <Zap className="h-4 w-4" />
      case 'grid': return <BarChart3 className="h-4 w-4" />
      case 'dca': return <Target className="h-4 w-4" />
      case 'scalping': return <TrendingDown className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const toggleStrategy = (strategyId: string) => {
    setStrategies(prev => prev.map(s => 
      s.id === strategyId 
        ? { ...s, isActive: !s.isActive }
        : s
    ))
  }

  const updateStrategyParameters = (strategyId: string, parameters: Record<string, any>) => {
    setStrategies(prev => prev.map(s => 
      s.id === strategyId 
        ? { ...s, parameters: { ...s.parameters, ...parameters } }
        : s
    ))
  }

  const StrategyCard = ({ strategy }: { strategy: ClassicStrategy }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden ${strategy.isActive ? 'ring-2 ring-blue-500/20 bg-blue-50/30' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                {getTypeIcon(strategy.type)}
              </div>
              <div>
                <CardTitle className="text-lg">{strategy.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={strategy.isActive ? 'default' : 'secondary'}>
                {strategy.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className={getRiskColor(strategy.riskLevel)}>
                {strategy.riskLevel} risk
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-semibold">{strategy.successRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Return</span>
                <span className={`font-semibold ${strategy.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(strategy.avgReturn * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Trades</span>
                <span className="font-semibold">{strategy.performance.totalTrades}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Max Drawdown</span>
                <span className="font-semibold text-red-600">{(strategy.maxDrawdown * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Profit Factor</span>
                <span className="font-semibold">{strategy.performance.profitFactor.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                <span className="font-semibold">{strategy.performance.sharpeRatio.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Strategy Details */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">Type</div>
              <p className="font-semibold capitalize">{strategy.type.replace('_', ' ')}</p>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Timeframe</div>
              <p className="font-semibold">{strategy.timeframe}</p>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Win Rate</div>
              <p className="font-semibold">{strategy.performance.winRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant={strategy.isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => toggleStrategy(strategy.id)}
              className="flex-1"
            >
              {strategy.isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStrategy(strategy)
                setIsEditing(true)
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const ParameterEditor = ({ strategy }: { strategy: ClassicStrategy }) => {
    const [localParams, setLocalParams] = useState(strategy.parameters)

    const updateParam = (key: string, value: any) => {
      setLocalParams(prev => ({ ...prev, [key]: value }))
    }

    const saveParameters = () => {
      updateStrategyParameters(strategy.id, localParams)
      setIsEditing(false)
      setSelectedStrategy(null)
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure {strategy.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(localParams).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
              {typeof value === 'number' ? (
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => updateParam(key, parseFloat(e.target.value) || 0)}
                    step={value < 1 ? 0.001 : 1}
                  />
                  {value <= 10 && (
                    <Slider
                      value={[value]}
                      onValueChange={(values) => updateParam(key, values[0])}
                      max={value <= 1 ? 1 : 100}
                      step={value <= 1 ? 0.01 : 1}
                    />
                  )}
                </div>
              ) : typeof value === 'boolean' ? (
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => updateParam(key, checked)}
                />
              ) : (
                <Input
                  value={value.toString()}
                  onChange={(e) => updateParam(key, e.target.value)}
                />
              )}
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <Button onClick={saveParameters} className="flex-1">
              Save Parameters
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false)
                setSelectedStrategy(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeStrategies = strategies.filter(s => s.isActive)
  const totalTrades = strategies.reduce((sum, s) => sum + s.performance.totalTrades, 0)
  const avgWinRate = strategies.reduce((sum, s) => sum + s.performance.winRate, 0) / strategies.length

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Active Strategies</span>
            </div>
            <p className="text-2xl font-bold">{activeStrategies.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Trades</span>
            </div>
            <p className="text-2xl font-bold">{totalTrades.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Avg Win Rate</span>
            </div>
            <p className="text-2xl font-bold">{avgWinRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Risk Level</span>
            </div>
            <p className="text-2xl font-bold">Medium</p>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Configuration */}
      {isEditing && selectedStrategy && (
        <ParameterEditor strategy={selectedStrategy} />
      )}

      {/* Strategy Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Strategies</TabsTrigger>
          <TabsTrigger value="active">Active ({activeStrategies.length})</TabsTrigger>
          <TabsTrigger value="momentum">Momentum</TabsTrigger>
          <TabsTrigger value="reversion">Mean Reversion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map(strategy => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeStrategies.map(strategy => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="momentum" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.filter(s => s.type === 'momentum' || s.type === 'breakout').map(strategy => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="reversion" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.filter(s => s.type === 'mean_reversion' || s.type === 'grid').map(strategy => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ClassicStrategies