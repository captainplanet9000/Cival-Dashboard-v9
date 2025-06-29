'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Target,
  Bot,
  TrendingUp,
  Shield,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  Settings,
  BarChart3,
  Plus,
  ArrowLeft,
  ArrowRight,
  Save
} from 'lucide-react'
import { paperTradingEngine, TradingAgent, TradingStrategy, RiskLimits } from '@/lib/trading/real-paper-trading-engine'

interface FarmConfig {
  name: string
  description: string
  strategy: {
    type: TradingStrategy['type']
    name: string
    parameters: Record<string, any>
    description: string
  }
  riskLimits: RiskLimits
  agentCount: number
  initialCapitalPerAgent: number
  totalAllocatedCapital: number
  targetDailyProfit: number
  targetWinRate: number
  maxRiskPerTrade: number
  coordinationMode: 'independent' | 'coordinated' | 'hierarchical'
  profitDistribution: 'equal' | 'performance' | 'capital'
  autoScaling: boolean
  emergencyStopLoss: number
}

interface RealFarmCreationWizardProps {
  onFarmCreated?: (farm: any) => void
  className?: string
}

const STRATEGY_TEMPLATES = {
  momentum: {
    name: 'Momentum Trading',
    description: 'Follows price trends and momentum indicators',
    defaultParams: {
      threshold: 0.02,
      lookbackPeriod: 20,
      confirmationPeriod: 5,
      stopLoss: 0.05,
      takeProfit: 0.1
    },
    riskProfile: 'medium',
    recommendedAgents: { min: 3, max: 8, optimal: 5 }
  },
  mean_reversion: {
    name: 'Mean Reversion',
    description: 'Trades against extreme price movements expecting reversion',
    defaultParams: {
      threshold: 0.03,
      oversoldLevel: 0.3,
      overboughtLevel: 0.7,
      holdingPeriod: 10,
      stopLoss: 0.04
    },
    riskProfile: 'low',
    recommendedAgents: { min: 2, max: 6, optimal: 4 }
  },
  arbitrage: {
    name: 'Arbitrage Hunter',
    description: 'Exploits price differences and spreads',
    defaultParams: {
      minSpread: 0.005,
      maxHoldTime: 60,
      maxExposure: 0.1,
      feeThreshold: 0.001
    },
    riskProfile: 'low',
    recommendedAgents: { min: 4, max: 12, optimal: 8 }
  },
  grid: {
    name: 'Grid Trading',
    description: 'Places buy/sell orders at regular intervals',
    defaultParams: {
      gridSize: 0.01,
      gridLevels: 10,
      baseOrderSize: 0.1,
      profitPercentage: 0.02
    },
    riskProfile: 'medium',
    recommendedAgents: { min: 3, max: 10, optimal: 6 }
  },
  dca: {
    name: 'Dollar Cost Averaging',
    description: 'Regularly buys assets regardless of price',
    defaultParams: {
      interval: 3600,
      amount: 100,
      maxDeviation: 0.05,
      pauseOnProfit: false
    },
    riskProfile: 'low',
    recommendedAgents: { min: 2, max: 5, optimal: 3 }
  }
}

const COORDINATION_MODES = {
  independent: {
    name: 'Independent',
    description: 'Each agent operates independently with its own strategy',
    pros: ['Simple setup', 'Lower complexity', 'Isolated risk'],
    cons: ['No coordination benefits', 'Potential conflicts']
  },
  coordinated: {
    name: 'Coordinated',
    description: 'Agents share information and coordinate entry/exit points',
    pros: ['Better timing', 'Reduced conflicts', 'Information sharing'],
    cons: ['Higher complexity', 'Potential bottlenecks']
  },
  hierarchical: {
    name: 'Hierarchical',
    description: 'Master agent coordinates subordinate agents',
    pros: ['Centralized control', 'Optimal resource allocation', 'Strategic coordination'],
    cons: ['Single point of failure', 'Complex setup']
  }
}

export function RealFarmCreationWizard({ onFarmCreated, className }: RealFarmCreationWizardProps) {
  const [step, setStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [existingAgents, setExistingAgents] = useState<TradingAgent[]>([])
  
  const [config, setConfig] = useState<FarmConfig>({
    name: '',
    description: '',
    strategy: {
      type: 'momentum',
      name: STRATEGY_TEMPLATES.momentum.name,
      parameters: STRATEGY_TEMPLATES.momentum.defaultParams,
      description: STRATEGY_TEMPLATES.momentum.description
    },
    riskLimits: {
      maxPositionSize: 10,
      maxDailyLoss: 500,
      maxDrawdown: 20,
      maxLeverage: 1,
      allowedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
      stopLossEnabled: true,
      takeProfitEnabled: true
    },
    agentCount: 5,
    initialCapitalPerAgent: 10000,
    totalAllocatedCapital: 50000,
    targetDailyProfit: 1000,
    targetWinRate: 75,
    maxRiskPerTrade: 2.5,
    coordinationMode: 'coordinated',
    profitDistribution: 'performance',
    autoScaling: true,
    emergencyStopLoss: 10
  })

  useEffect(() => {
    if (isOpen) {
      // Load existing agents when modal opens
      const agents = paperTradingEngine.getAllAgents()
      setExistingAgents(agents)
    }
  }, [isOpen])

  useEffect(() => {
    // Update total allocated capital when agent count or capital per agent changes
    setConfig(prev => ({
      ...prev,
      totalAllocatedCapital: prev.agentCount * prev.initialCapitalPerAgent
    }))
  }, [config.agentCount, config.initialCapitalPerAgent])

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (stepNumber) {
      case 1:
        if (!config.name.trim()) {
          newErrors.name = 'Farm name is required'
        } else if (config.name.length < 3) {
          newErrors.name = 'Farm name must be at least 3 characters'
        }
        if (config.totalAllocatedCapital < 5000) {
          newErrors.capital = 'Minimum capital is $5,000'
        }
        break

      case 2:
        if (!config.strategy.name.trim()) {
          newErrors.strategyName = 'Strategy name is required'
        }
        if (config.agentCount < 1 || config.agentCount > 20) {
          newErrors.agentCount = 'Agent count must be between 1 and 20'
        }
        break

      case 3:
        if (config.riskLimits.maxPositionSize < 1 || config.riskLimits.maxPositionSize > 50) {
          newErrors.maxPositionSize = 'Position size must be between 1% and 50%'
        }
        if (config.riskLimits.maxDailyLoss < 100) {
          newErrors.maxDailyLoss = 'Minimum daily loss limit is $100'
        }
        if (config.targetDailyProfit <= 0) {
          newErrors.targetDailyProfit = 'Target daily profit must be positive'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleStrategyChange = (strategyType: TradingStrategy['type']) => {
    const template = STRATEGY_TEMPLATES[strategyType]
    setConfig(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        type: strategyType,
        name: template.name,
        description: template.description,
        parameters: template.defaultParams
      },
      agentCount: template.recommendedAgents.optimal
    }))
  }

  const handleParameterChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        parameters: {
          ...prev.strategy.parameters,
          [key]: value
        }
      }
    }))
  }

  const createFarm = async () => {
    if (!validateStep(3)) return

    setIsCreating(true)
    try {
      // Start the trading engine if not already running
      if (!paperTradingEngine.listenerCount('pricesUpdated')) {
        paperTradingEngine.start()
      }

      const createdAgents: TradingAgent[] = []

      // Create agents for the farm
      for (let i = 0; i < config.agentCount; i++) {
        const agentConfig = {
          name: `${config.name} Agent ${i + 1}`,
          strategy: {
            name: `${config.strategy.name} ${i + 1}`,
            type: config.strategy.type,
            parameters: config.strategy.parameters,
            description: config.strategy.description
          },
          initialCapital: config.initialCapitalPerAgent,
          riskLimits: {
            ...config.riskLimits,
            maxDailyLoss: config.riskLimits.maxDailyLoss / config.agentCount // Distribute risk across agents
          }
        }

        const agent = paperTradingEngine.createAgent(agentConfig)
        createdAgents.push(agent)
      }

      // Create farm object
      const farm = {
        farm_id: `farm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        farm_name: config.name,
        description: config.description,
        strategy_type: config.strategy.type,
        status: 'active',
        created_at: new Date().toISOString(),
        target_daily_profit: config.targetDailyProfit,
        target_win_rate: config.targetWinRate,
        max_risk_per_trade: config.maxRiskPerTrade,
        total_allocated_capital: config.totalAllocatedCapital,
        coordination_mode: config.coordinationMode,
        profit_distribution: config.profitDistribution,
        auto_scaling: config.autoScaling,
        emergency_stop_loss: config.emergencyStopLoss,
        agents: createdAgents.map(agent => agent.id),
        metadata: {
          agent_count: config.agentCount,
          strategy_parameters: config.strategy.parameters,
          risk_limits: config.riskLimits,
          creation_wizard_version: '1.0'
        }
      }

      // Store farm in localStorage for persistence
      const existingFarms = JSON.parse(localStorage.getItem('trading_farms') || '[]')
      existingFarms.push(farm)
      localStorage.setItem('trading_farms', JSON.stringify(existingFarms))

      onFarmCreated?.(farm)

      // Reset form
      setConfig({
        name: '',
        description: '',
        strategy: {
          type: 'momentum',
          name: STRATEGY_TEMPLATES.momentum.name,
          parameters: STRATEGY_TEMPLATES.momentum.defaultParams,
          description: STRATEGY_TEMPLATES.momentum.description
        },
        riskLimits: {
          maxPositionSize: 10,
          maxDailyLoss: 500,
          maxDrawdown: 20,
          maxLeverage: 1,
          allowedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
          stopLossEnabled: true,
          takeProfitEnabled: true
        },
        agentCount: 5,
        initialCapitalPerAgent: 10000,
        totalAllocatedCapital: 50000,
        targetDailyProfit: 1000,
        targetWinRate: 75,
        maxRiskPerTrade: 2.5,
        coordinationMode: 'coordinated',
        profitDistribution: 'performance',
        autoScaling: true,
        emergencyStopLoss: 10
      })
      setStep(1)
      setIsOpen(false)

      console.log('✅ Farm created successfully:', farm)
      console.log('✅ Created agents:', createdAgents)
    } catch (error) {
      console.error('❌ Failed to create farm:', error)
      setErrors({ general: 'Failed to create farm. Please try again.' })
    } finally {
      setIsCreating(false)
    }
  }

  const availableSymbols = [
    'BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD',
    'LINK/USD', 'UNI/USD', 'AAVE/USD', 'MATIC/USD', 'AVAX/USD'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Farm
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-emerald-600" />
            <div>
              <DialogTitle className="text-2xl">Create Trading Farm</DialogTitle>
              <DialogDescription className="mt-1">
                Set up a coordinated group of AI agents to execute your trading strategy
              </DialogDescription>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${step >= stepNum 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-1 transition-colors ${
                    step > stepNum ? 'bg-emerald-600' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-2">
            <Progress value={(step / 3) * 100} className="h-2" />
          </div>
        </DialogHeader>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Configuration */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-emerald-600" />
                    Farm Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Farm Name *</Label>
                      <Input
                        id="name"
                        value={config.name}
                        onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., High Frequency Momentum Farm"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="agentCount">Number of Agents</Label>
                      <Input
                        id="agentCount"
                        type="number"
                        value={config.agentCount}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          agentCount: Math.max(1, Math.min(20, Number(e.target.value))) 
                        }))}
                        min="1"
                        max="20"
                        className={errors.agentCount ? 'border-red-500' : ''}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: {STRATEGY_TEMPLATES[config.strategy.type]?.recommendedAgents.optimal || 5} agents
                      </p>
                      {errors.agentCount && (
                        <p className="text-sm text-red-500 mt-1">{errors.agentCount}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={config.description}
                      onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the purpose and strategy of this farm..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <Label htmlFor="capitalPerAgent">Capital Per Agent</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="capitalPerAgent"
                          type="number"
                          value={config.initialCapitalPerAgent}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            initialCapitalPerAgent: Number(e.target.value) 
                          }))}
                          className="pl-9"
                          min="1000"
                          step="1000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Total Allocated Capital</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={config.totalAllocatedCapital.toLocaleString()}
                          className="pl-9 bg-muted"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Calculated: {config.agentCount} agents × ${config.initialCapitalPerAgent.toLocaleString()}
                      </p>
                      {errors.capital && (
                        <p className="text-sm text-red-500 mt-1">{errors.capital}</p>
                      )}
                    </div>
                  </div>

                  {existingAgents.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Existing Agents</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        You have {existingAgents.length} existing agents. This farm will create {config.agentCount} new agents.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Strategy Configuration */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Strategy & Coordination
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="strategyType">Strategy Type *</Label>
                      <Select
                        value={config.strategy.type}
                        onValueChange={handleStrategyChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center space-x-2">
                                <span>{template.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {template.riskProfile}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="coordinationMode">Coordination Mode</Label>
                      <Select
                        value={config.coordinationMode}
                        onValueChange={(value: any) => setConfig(prev => ({ 
                          ...prev, 
                          coordinationMode: value 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COORDINATION_MODES).map(([key, mode]) => (
                            <SelectItem key={key} value={key}>
                              <div>
                                <div className="font-medium">{mode.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {mode.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Strategy Description</Label>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                      {config.strategy.description}
                    </p>
                  </div>

                  {/* Strategy Parameters */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Strategy Parameters
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(config.strategy.parameters).map(([key, value]) => (
                        <div key={key}>
                          <Label className="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </Label>
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => handleParameterChange(key, Number(e.target.value))}
                            step="0.001"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coordination Mode Details */}
                  <div className="mt-6 p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">
                      {COORDINATION_MODES[config.coordinationMode].name} Mode
                    </h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      {COORDINATION_MODES[config.coordinationMode].description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="font-medium text-green-600 mb-1">Advantages:</div>
                        <ul className="space-y-1">
                          {COORDINATION_MODES[config.coordinationMode].pros.map((pro, idx) => (
                            <li key={idx} className="flex items-center">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-orange-600 mb-1">Considerations:</div>
                        <ul className="space-y-1">
                          {COORDINATION_MODES[config.coordinationMode].cons.map((con, idx) => (
                            <li key={idx} className="flex items-center">
                              <AlertTriangle className="h-3 w-3 text-orange-600 mr-1" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Risk Management & Targets */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Risk Management & Targets
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="targetDailyProfit">Target Daily Profit ($)</Label>
                      <Input
                        id="targetDailyProfit"
                        type="number"
                        value={config.targetDailyProfit}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          targetDailyProfit: Number(e.target.value) 
                        }))}
                        min="0"
                        className={errors.targetDailyProfit ? 'border-red-500' : ''}
                      />
                      {errors.targetDailyProfit && (
                        <p className="text-sm text-red-500 mt-1">{errors.targetDailyProfit}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="targetWinRate">Target Win Rate (%)</Label>
                      <Input
                        id="targetWinRate"
                        type="number"
                        value={config.targetWinRate}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          targetWinRate: Number(e.target.value) 
                        }))}
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxRiskPerTrade">Max Risk Per Trade (%)</Label>
                      <Input
                        id="maxRiskPerTrade"
                        type="number"
                        value={config.maxRiskPerTrade}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          maxRiskPerTrade: Number(e.target.value) 
                        }))}
                        min="0.1"
                        max="10"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <Label htmlFor="maxPositionSize">Max Position Size (%)</Label>
                      <Input
                        id="maxPositionSize"
                        type="number"
                        value={config.riskLimits.maxPositionSize}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          riskLimits: { 
                            ...prev.riskLimits, 
                            maxPositionSize: Number(e.target.value) 
                          }
                        }))}
                        min="1"
                        max="50"
                        className={errors.maxPositionSize ? 'border-red-500' : ''}
                      />
                      {errors.maxPositionSize && (
                        <p className="text-sm text-red-500 mt-1">{errors.maxPositionSize}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="maxDailyLoss">Max Daily Loss ($)</Label>
                      <Input
                        id="maxDailyLoss"
                        type="number"
                        value={config.riskLimits.maxDailyLoss}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          riskLimits: { 
                            ...prev.riskLimits, 
                            maxDailyLoss: Number(e.target.value) 
                          }
                        }))}
                        min="100"
                        className={errors.maxDailyLoss ? 'border-red-500' : ''}
                      />
                      {errors.maxDailyLoss && (
                        <p className="text-sm text-red-500 mt-1">{errors.maxDailyLoss}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="emergencyStopLoss">Emergency Stop Loss (%)</Label>
                      <Input
                        id="emergencyStopLoss"
                        type="number"
                        value={config.emergencyStopLoss}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          emergencyStopLoss: Number(e.target.value) 
                        }))}
                        min="5"
                        max="50"
                      />
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium">Advanced Options</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Profit Distribution</Label>
                        <Select
                          value={config.profitDistribution}
                          onValueChange={(value: any) => setConfig(prev => ({ 
                            ...prev, 
                            profitDistribution: value 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equal">Equal Distribution</SelectItem>
                            <SelectItem value="performance">Performance Based</SelectItem>
                            <SelectItem value="capital">Capital Weighted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="autoScaling" className="text-sm">
                            Auto Scaling
                          </Label>
                          <Switch
                            id="autoScaling"
                            checked={config.autoScaling}
                            onCheckedChange={(checked) =>
                              setConfig(prev => ({ ...prev, autoScaling: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="stopLossEnabled" className="text-sm">
                            Stop Loss
                          </Label>
                          <Switch
                            id="stopLossEnabled"
                            checked={config.riskLimits.stopLossEnabled}
                            onCheckedChange={(checked) => setConfig(prev => ({
                              ...prev,
                              riskLimits: { ...prev.riskLimits, stopLossEnabled: checked }
                            }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="takeProfitEnabled" className="text-sm">
                            Take Profit
                          </Label>
                          <Switch
                            id="takeProfitEnabled"
                            checked={config.riskLimits.takeProfitEnabled}
                            onCheckedChange={(checked) => setConfig(prev => ({
                              ...prev,
                              riskLimits: { ...prev.riskLimits, takeProfitEnabled: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trading Symbols */}
                  <div className="mt-6">
                    <Label>Trading Symbols</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                      {availableSymbols.map(symbol => (
                        <TooltipProvider key={symbol}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`
                                  p-2 border rounded cursor-pointer text-center text-sm font-medium transition-colors
                                  ${config.riskLimits.allowedSymbols.includes(symbol)
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-border hover:border-border/70'
                                  }
                                `}
                                onClick={() => setConfig(prev => ({
                                  ...prev,
                                  riskLimits: {
                                    ...prev.riskLimits,
                                    allowedSymbols: prev.riskLimits.allowedSymbols.includes(symbol)
                                      ? prev.riskLimits.allowedSymbols.filter(s => s !== symbol)
                                      : [...prev.riskLimits.allowedSymbols, symbol]
                                  }
                                }))}
                              >
                                {symbol}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Click to toggle {symbol}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Selected: {config.riskLimits.allowedSymbols.length} symbols
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {errors.general && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg mt-6">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {step} of 3
            </div>

            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={createFarm}
                disabled={isCreating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Farm...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Farm
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RealFarmCreationWizard