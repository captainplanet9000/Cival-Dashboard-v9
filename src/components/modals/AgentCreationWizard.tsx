'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Bot,
  Brain,
  TrendingUp,
  Target,
  Shield,
  Zap,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Sparkles,
  Settings2,
  BarChart3,
  Globe,
  Coins
} from 'lucide-react'

// Import Agent Persistence Service and System Lifecycle
// Lazy load services to avoid circular dependencies
const getAgentPersistenceService = () => import('@/lib/agents/AgentPersistenceService').then(m => m.agentPersistenceService.get())
import { type AgentConfig as PersistenceAgentConfig } from '@/lib/agents/AgentPersistenceService'
const getSystemLifecycleService = () => import('@/lib/system/SystemLifecycleService').then(m => m.systemLifecycleService.get())

interface AgentConfig {
  // Basic Info
  name: string
  description: string
  type: string
  
  // Trading Configuration
  initialCapital: number
  maxDrawdown: number
  riskTolerance: number
  timeHorizon: string
  
  // Assets & Markets
  preferredAssets: string[]
  excludedAssets: string[]
  tradingPairs: string[]
  
  // Strategy Configuration
  strategies: string[]
  indicators: string[]
  timeframes: string[]
  
  // Risk Management
  maxPositionSize: number
  stopLossPercent: number
  takeProfitPercent: number
  maxDailyLoss: number
  
  // DeFi & Protocols
  defiProtocols: string[]
  yieldFarming: boolean
  liquidityProvision: boolean
  
  // Advanced Settings
  autoRebalance: boolean
  compoundReturns: boolean
  notifications: boolean
  paperTradingDuration: number
}

interface AgentCreationWizardProps {
  open: boolean
  onClose: () => void
  onCreateAgent: (config: AgentConfig) => Promise<void>
  existingAgents?: any[]
}

const AGENT_TYPES = [
  {
    id: 'scalper',
    name: 'Scalper',
    description: 'High-frequency micro-profit strategy',
    icon: <Zap className="h-6 w-6" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  {
    id: 'swing_trader',
    name: 'Swing Trader',
    description: 'Medium-term trend following',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    id: 'momentum',
    name: 'Momentum',
    description: 'Trend acceleration strategies',
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion',
    description: 'Counter-trend strategies',
    icon: <Target className="h-6 w-6" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage',
    description: 'Cross-market price differences',
    icon: <Globe className="h-6 w-6" />,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  {
    id: 'yield_farmer',
    name: 'Yield Farmer',
    description: 'DeFi yield optimization',
    icon: <Coins className="h-6 w-6" />,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
]

const TRADING_STRATEGIES = [
  'Trend Following', 'Mean Reversion', 'Momentum', 'Breakout', 'Grid Trading',
  'DCA (Dollar Cost Average)', 'Martingale', 'Anti-Martingale', 'Pairs Trading',
  'Statistical Arbitrage', 'Market Making', 'Scalping'
]

const TECHNICAL_INDICATORS = [
  'SMA', 'EMA', 'RSI', 'MACD', 'Bollinger Bands', 'Stochastic', 'Williams %R',
  'CCI', 'ADX', 'Parabolic SAR', 'Ichimoku', 'Volume Profile', 'VWAP'
]

const DEFI_PROTOCOLS = [
  'Uniswap V3', 'Compound', 'Aave', '1inch', 'Curve', 'Balancer', 'SushiSwap',
  'PancakeSwap', 'Yearn Finance', 'Convex', 'Lido', 'Rocket Pool'
]

const TRADING_PAIRS = [
  'ETH/USD', 'BTC/USD', 'LINK/USD', 'UNI/USD', 'AAVE/USD', 'MATIC/USD',
  'SOL/USD', 'ADA/USD', 'DOT/USD', 'AVAX/USD', 'ATOM/USD', 'NEAR/USD'
]

export function AgentCreationWizard({ 
  open, 
  onClose, 
  onCreateAgent,
  existingAgents = []
}: AgentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    type: '',
    initialCapital: 10000,
    maxDrawdown: 10,
    riskTolerance: 50,
    timeHorizon: '30',
    preferredAssets: [],
    excludedAssets: [],
    tradingPairs: ['ETH/USD', 'BTC/USD'],
    strategies: [],
    indicators: ['SMA', 'RSI', 'MACD'],
    timeframes: ['1h', '4h', '1d'],
    maxPositionSize: 1000,
    stopLossPercent: 5,
    takeProfitPercent: 10,
    maxDailyLoss: 500,
    defiProtocols: [],
    yieldFarming: false,
    liquidityProvision: false,
    autoRebalance: true,
    compoundReturns: true,
    notifications: true,
    paperTradingDuration: 30
  })

  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Name and configure your trading agent',
      icon: <Bot className="h-5 w-5" />
    },
    {
      id: 'type',
      title: 'Agent Type',
      description: 'Choose the trading strategy type',
      icon: <Brain className="h-5 w-5" />
    },
    {
      id: 'trading',
      title: 'Trading Setup',
      description: 'Configure trading parameters',
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      id: 'risk',
      title: 'Risk Management',
      description: 'Set risk limits and controls',
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'defi',
      title: 'DeFi Integration',
      description: 'Configure DeFi protocols',
      icon: <Zap className="h-5 w-5" />
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Final review and deployment',
      icon: <Check className="h-5 w-5" />
    }
  ]

  const updateConfig = (updates: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreateAgent = async () => {
    setIsCreating(true)
    try {
      // Convert local config to persistence config format
      const persistenceConfig: PersistenceAgentConfig = {
        // Basic Info
        name: config.name,
        description: config.description,
        type: config.type as any,
        
        // Trading Configuration
        initialCapital: config.initialCapital,
        maxPositionSize: config.maxPositionSize / 100, // Convert percentage to decimal
        riskTolerance: config.riskTolerance / 100, // Convert percentage to decimal
        maxDrawdown: config.maxDrawdown / 100, // Convert percentage to decimal
        timeHorizon: config.timeHorizon,
        tradingPairs: config.tradingPairs,
        strategies: config.strategies,
        
        // DeFi Configuration
        enableDeFi: config.defiProtocols.length > 0 || config.yieldFarming || config.liquidityProvision,
        defiNetworks: ['sepolia'], // Default to Sepolia testnet
        defiProtocols: config.defiProtocols,
        autoCompound: config.compoundReturns,
        liquidityMining: config.yieldFarming,
        
        // AI Configuration
        llmProvider: 'gemini',
        llmModel: 'gemini-pro',
        systemPrompt: `You are a ${config.type} trading agent specialized in automated trading. Your role is to analyze market data and make informed trading decisions based on your configuration and risk parameters.`,
        decisionThreshold: 0.7,
        enableLearning: true,
        
        // MCP Tools Configuration (basic set)
        enabledTools: ['market_data', 'portfolio_analysis', 'risk_assessment'],
        toolPermissions: {
          'market_data': ['read'],
          'portfolio_analysis': ['read', 'analyze'],
          'risk_assessment': ['read', 'analyze', 'alert']
        },
        
        // Hierarchy & Coordination
        role: 'trader',
        permissions: ['trade', 'analyze', 'learn'],
        
        // Advanced Settings
        enableNotifications: config.notifications,
        enableLogging: true,
        enableWebhooks: false,
        
        // Metadata (will be set by persistence service)
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0'
      }

      // Create agent through complete system lifecycle (lazy loaded)
      const systemLifecycleService = await getSystemLifecycleService()
      const result = await systemLifecycleService.createCompleteAgent(persistenceConfig)
      
      if (result.success) {
        console.log('✅ Complete agent lifecycle finished:', result.agentId)
        console.log(`📊 Total creation time: ${result.totalDuration}ms`)
        
        // Call the original onCreateAgent for backward compatibility
        await onCreateAgent(config)
        
        onClose()
        
        // Reset form
        setCurrentStep(0)
        setConfig({
          name: '',
          description: '',
          type: '',
          initialCapital: 10000,
          maxDrawdown: 10,
          riskTolerance: 50,
          timeHorizon: '30',
          preferredAssets: [],
          excludedAssets: [],
          tradingPairs: ['ETH/USD', 'BTC/USD'],
          strategies: [],
          indicators: ['SMA', 'RSI', 'MACD'],
          timeframes: ['1h', '4h', '1d'],
          maxPositionSize: 1000,
          stopLossPercent: 5,
          takeProfitPercent: 10,
          maxDailyLoss: 500,
          defiProtocols: [],
          yieldFarming: false,
          liquidityProvision: false,
          autoRebalance: true,
          compoundReturns: true,
          notifications: true,
          paperTradingDuration: 30
        })
      } else {
        // Handle creation errors
        console.error('Agent creation failed:', result.errors)
        const errorMessage = result.errors?.join(', ') || 'Unknown error occurred'
        alert(`Failed to create agent: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error creating agent:', error)
      alert(`Failed to create agent: ${error}`)
    } finally {
      setIsCreating(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  placeholder="e.g., Alpha Trader, Market Hunter"
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a unique name for your trading agent
                </p>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => updateConfig({ description: e.target.value })}
                  placeholder="Describe your agent's purpose and strategy..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label>Initial Capital</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    value={[config.initialCapital]}
                    onValueChange={([value]) => updateConfig({ initialCapital: value })}
                    max={100000}
                    min={1000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$1,000</span>
                    <span className="font-medium">${config.initialCapital.toLocaleString()}</span>
                    <span>$100,000</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Virtual capital for paper trading simulation
                </p>
              </div>
            </div>
          </div>
        )

      case 1: // Agent Type
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AGENT_TYPES.map((type) => (
                <Card
                  key={type.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    config.type === type.id 
                      ? "ring-2 ring-primary border-primary" 
                      : "hover:border-primary/50"
                  )}
                  onClick={() => updateConfig({ type: type.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={cn("p-2 rounded-lg", type.color)}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {type.description}
                        </p>
                      </div>
                      {config.type === type.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {config.type && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Selected: {AGENT_TYPES.find(t => t.id === config.type)?.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {AGENT_TYPES.find(t => t.id === config.type)?.description}
                </p>
              </div>
            )}
          </div>
        )

      case 2: // Trading Setup
        return (
          <div className="space-y-6">
            <Tabs defaultValue="pairs" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pairs">Trading Pairs</TabsTrigger>
                <TabsTrigger value="strategies">Strategies</TabsTrigger>
                <TabsTrigger value="indicators">Indicators</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pairs" className="space-y-4">
                <div>
                  <Label>Selected Trading Pairs</Label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TRADING_PAIRS.map((pair) => (
                      <Card
                        key={pair}
                        className={cn(
                          "cursor-pointer transition-all duration-200 p-3",
                          config.tradingPairs.includes(pair)
                            ? "ring-2 ring-primary border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                        onClick={() => {
                          const pairs = config.tradingPairs.includes(pair)
                            ? config.tradingPairs.filter(p => p !== pair)
                            : [...config.tradingPairs, pair]
                          updateConfig({ tradingPairs: pairs })
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-medium">{pair}</span>
                          {config.tradingPairs.includes(pair) && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="strategies" className="space-y-4">
                <div>
                  <Label>Trading Strategies</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {TRADING_STRATEGIES.map((strategy) => (
                      <div key={strategy} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={strategy}
                          checked={config.strategies.includes(strategy)}
                          onChange={(e) => {
                            const strategies = e.target.checked
                              ? [...config.strategies, strategy]
                              : config.strategies.filter(s => s !== strategy)
                            updateConfig({ strategies })
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={strategy} className="text-sm">{strategy}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="indicators" className="space-y-4">
                <div>
                  <Label>Technical Indicators</Label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TECHNICAL_INDICATORS.map((indicator) => (
                      <Card
                        key={indicator}
                        className={cn(
                          "cursor-pointer transition-all duration-200 p-3",
                          config.indicators.includes(indicator)
                            ? "ring-2 ring-primary border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                        onClick={() => {
                          const indicators = config.indicators.includes(indicator)
                            ? config.indicators.filter(i => i !== indicator)
                            : [...config.indicators, indicator]
                          updateConfig({ indicators })
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{indicator}</span>
                          {config.indicators.includes(indicator) && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )

      case 3: // Risk Management
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Risk Tolerance</Label>
                  <div className="mt-2 space-y-2">
                    <Slider
                      value={[config.riskTolerance]}
                      onValueChange={([value]) => updateConfig({ riskTolerance: value })}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Conservative</span>
                      <span className="font-medium">{config.riskTolerance}%</span>
                      <span>Aggressive</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Maximum Drawdown (%)</Label>
                  <Input
                    type="number"
                    value={config.maxDrawdown}
                    onChange={(e) => updateConfig({ maxDrawdown: parseFloat(e.target.value) || 0 })}
                    className="mt-2"
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <Label>Stop Loss (%)</Label>
                  <Input
                    type="number"
                    value={config.stopLossPercent}
                    onChange={(e) => updateConfig({ stopLossPercent: parseFloat(e.target.value) || 0 })}
                    className="mt-2"
                    min="0.1"
                    max="20"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Take Profit (%)</Label>
                  <Input
                    type="number"
                    value={config.takeProfitPercent}
                    onChange={(e) => updateConfig({ takeProfitPercent: parseFloat(e.target.value) || 0 })}
                    className="mt-2"
                    min="0.1"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div>
                  <Label>Max Position Size ($)</Label>
                  <Input
                    type="number"
                    value={config.maxPositionSize}
                    onChange={(e) => updateConfig({ maxPositionSize: parseFloat(e.target.value) || 0 })}
                    className="mt-2"
                    min="100"
                    max={config.initialCapital}
                    step="100"
                  />
                </div>

                <div>
                  <Label>Max Daily Loss ($)</Label>
                  <Input
                    type="number"
                    value={config.maxDailyLoss}
                    onChange={(e) => updateConfig({ maxDailyLoss: parseFloat(e.target.value) || 0 })}
                    className="mt-2"
                    min="10"
                    max={config.initialCapital * 0.1}
                    step="10"
                  />
                </div>
              </div>
            </div>

            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Risk Management Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    These settings will automatically protect your capital. The agent will stop trading if any risk limits are exceeded.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )

      case 4: // DeFi Integration
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Yield Farming</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically farm yield on idle capital
                  </p>
                </div>
                <Switch
                  checked={config.yieldFarming}
                  onCheckedChange={(checked) => updateConfig({ yieldFarming: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Liquidity Provision</Label>
                  <p className="text-sm text-muted-foreground">
                    Provide liquidity to DEX pools for fees
                  </p>
                </div>
                <Switch
                  checked={config.liquidityProvision}
                  onCheckedChange={(checked) => updateConfig({ liquidityProvision: checked })}
                />
              </div>
            </div>

            {(config.yieldFarming || config.liquidityProvision) && (
              <div>
                <Label>DeFi Protocols</Label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {DEFI_PROTOCOLS.map((protocol) => (
                    <Card
                      key={protocol}
                      className={cn(
                        "cursor-pointer transition-all duration-200 p-3",
                        config.defiProtocols.includes(protocol)
                          ? "ring-2 ring-primary border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => {
                        const protocols = config.defiProtocols.includes(protocol)
                          ? config.defiProtocols.filter(p => p !== protocol)
                          : [...config.defiProtocols, protocol]
                        updateConfig({ defiProtocols: protocols })
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{protocol}</span>
                        {config.defiProtocols.includes(protocol) && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Rebalance</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically rebalance portfolio
                  </p>
                </div>
                <Switch
                  checked={config.autoRebalance}
                  onCheckedChange={(checked) => updateConfig({ autoRebalance: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Compound Returns</Label>
                  <p className="text-sm text-muted-foreground">
                    Reinvest profits automatically
                  </p>
                </div>
                <Switch
                  checked={config.compoundReturns}
                  onCheckedChange={(checked) => updateConfig({ compoundReturns: checked })}
                />
              </div>
            </div>
          </div>
        )

      case 5: // Review & Create
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agent Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{config.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">
                      {AGENT_TYPES.find(t => t.id === config.type)?.name}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capital:</span>
                    <span className="font-medium">${config.initialCapital.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className="font-medium">{config.riskTolerance}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trading Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-muted-foreground">Trading Pairs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.tradingPairs.slice(0, 3).map(pair => (
                        <Badge key={pair} variant="secondary" className="text-xs">
                          {pair}
                        </Badge>
                      ))}
                      {config.tradingPairs.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{config.tradingPairs.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Strategies:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.strategies.slice(0, 2).map(strategy => (
                        <Badge key={strategy} variant="secondary" className="text-xs">
                          {strategy}
                        </Badge>
                      ))}
                      {config.strategies.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{config.strategies.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Drawdown:</span>
                    <span className="font-medium">{config.maxDrawdown}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stop Loss:</span>
                    <span className="font-medium">{config.stopLossPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Take Profit:</span>
                    <span className="font-medium">{config.takeProfitPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Daily Loss:</span>
                    <span className="font-medium">${config.maxDailyLoss}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">DeFi Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yield Farming:</span>
                    <Badge variant={config.yieldFarming ? "default" : "secondary"}>
                      {config.yieldFarming ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidity Provision:</span>
                    <Badge variant={config.liquidityProvision ? "default" : "secondary"}>
                      {config.liquidityProvision ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto Rebalance:</span>
                    <Badge variant={config.autoRebalance ? "default" : "secondary"}>
                      {config.autoRebalance ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Ready to Deploy</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your agent is configured and ready for paper trading. Click "Create Agent" to deploy to the simulation environment.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return config.name.trim() && config.initialCapital > 0
      case 1:
        return config.type
      case 2:
        return config.tradingPairs.length > 0
      case 3:
        return config.maxDrawdown > 0 && config.stopLossPercent > 0
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden bg-background border-border">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Create AI Trading Agent</span>
          </DialogTitle>
          <DialogDescription>
            Configure and deploy an intelligent trading agent with advanced risk management
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="w-full" />
          
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center space-y-2 flex-1 relative",
                  index <= currentStep ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  index <= currentStep 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "border-muted-foreground/20"
                )}>
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="text-center hidden sm:block">
                  <div className="text-xs font-medium">{step.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
                <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
              </div>
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="flex justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleCreateAgent}
                disabled={!canProceed() || isCreating}
                className="bg-primary hover:bg-primary/90"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AgentCreationWizard