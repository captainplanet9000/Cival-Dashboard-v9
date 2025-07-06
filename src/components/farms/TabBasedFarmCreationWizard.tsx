'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown'
import { Alert } from '@/components/ui/feedback/alert'
import { Space } from '@/components/ui/layout/space'
import { Statistic } from '@/components/ui/data-display/statistic'
import { Spin } from '@/components/ui/other/spin'
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
  Save,
  ArrowLeft,
  ArrowRight,
  Check
} from 'lucide-react'
import { paperTradingEngine, TradingAgent, TradingStrategy, RiskLimits } from '@/lib/trading/real-paper-trading-engine'
import { backendApi } from '@/lib/api/backend-client'
import { toast } from 'react-hot-toast'

// Import shared data manager to prevent duplicate requests
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'

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

interface TabBasedFarmCreationWizardProps {
  onFarmCreated?: (farm: any) => void
  onCancel?: () => void
  className?: string
  onReturn?: () => void // To return to the farms list view
}

// Strategy templates (same as EnhancedFarmCreationWizard)
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
    riskProfile: 'very_low',
    recommendedAgents: { min: 5, max: 12, optimal: 8 }
  },
  trend_following: {
    name: 'Trend Following',
    description: 'Identifies and follows market trends',
    defaultParams: {
      entryThreshold: 0.015,
      exitThreshold: 0.01,
      lookbackWindow: 30,
      stopLoss: 0.06,
      trailingStop: true
    },
    riskProfile: 'medium',
    recommendedAgents: { min: 3, max: 7, optimal: 5 }
  },
  breakout: {
    name: 'Breakout Trading',
    description: 'Capitalizes on price movements beyond support/resistance',
    defaultParams: {
      volatilityWindow: 20,
      breachThreshold: 0.025,
      volumeConfirmation: true,
      stopLoss: 0.07,
      profitTarget: 0.15
    },
    riskProfile: 'high',
    recommendedAgents: { min: 2, max: 5, optimal: 3 }
  }
}

export function TabBasedFarmCreationWizard({ onFarmCreated, onCancel, onReturn, className }: TabBasedFarmCreationWizardProps) {
  const [activeStep, setActiveStep] = useState('basic')
  const [isCreating, setIsCreating] = useState(false)
  const [existingAgents, setExistingAgents] = useState<TradingAgent[]>([])
  const [wizardData, setWizardData] = useState<FarmConfig>({
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

  // Load existing agents on component mount
  useEffect(() => {
    loadExistingAgents()
  }, [])

  useEffect(() => {
    // Update total allocated capital when agent count or capital per agent changes
    setWizardData(prev => ({
      ...prev,
      totalAllocatedCapital: prev.agentCount * prev.initialCapitalPerAgent
    }))
  }, [wizardData.agentCount, wizardData.initialCapitalPerAgent])

  const loadExistingAgents = async () => {
    try {
      const agents = paperTradingEngine.getAllAgents()
      setExistingAgents(agents)
      
      // Also try to load from backend
      try {
        const response = await backendApi.get('/api/v1/agents/status')
        if (response.data) {
          console.log('Backend agents:', response.data)
        }
      } catch (backendError) {
        console.log('Backend API not available:', backendError)
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }

  const handleStrategyChange = (strategyType: TradingStrategy['type']) => {
    const template = STRATEGY_TEMPLATES[strategyType]
    setWizardData(prev => ({
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
    setWizardData(prev => ({
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

  const validateStep = (stepId: string): boolean | string => {
    switch (stepId) {
      case 'basic':
        if (!wizardData.name?.trim()) {
          return 'Farm name is required'
        }
        if (wizardData.name.length < 3) {
          return 'Farm name must be at least 3 characters'
        }
        if (wizardData.totalAllocatedCapital < 5000) {
          return 'Minimum capital is $5,000'
        }
        break

      case 'strategy':
        if (!wizardData.strategy?.name?.trim()) {
          return 'Strategy name is required'
        }
        if (wizardData.agentCount < 1 || wizardData.agentCount > 20) {
          return 'Agent count must be between 1 and 20'
        }
        break

      case 'risk':
        if (wizardData.riskLimits?.maxPositionSize < 1 || wizardData.riskLimits?.maxPositionSize > 50) {
          return 'Position size must be between 1% and 50%'
        }
        if (wizardData.riskLimits?.maxDailyLoss < 100) {
          return 'Minimum daily loss limit is $100'
        }
        if (wizardData.targetDailyProfit <= 0) {
          return 'Target daily profit must be positive'
        }
        break
    }

    return true
  }

  const handleNextStep = () => {
    const validation = validateStep(activeStep)
    if (validation !== true) {
      toast.error(validation as string)
      return
    }

    if (activeStep === 'basic') {
      setActiveStep('strategy')
    } else if (activeStep === 'strategy') {
      setActiveStep('risk')
    } else if (activeStep === 'risk') {
      setActiveStep('review')
    } else if (activeStep === 'review') {
      handleCreateFarm()
    }
  }

  const handlePrevStep = () => {
    if (activeStep === 'strategy') {
      setActiveStep('basic')
    } else if (activeStep === 'risk') {
      setActiveStep('strategy')
    } else if (activeStep === 'review') {
      setActiveStep('risk')
    }
  }

  const handleCreateFarm = async () => {
    setIsCreating(true)
    try {
      // Start the trading engine if not already running
      if (!paperTradingEngine.listenerCount('pricesUpdated')) {
        paperTradingEngine.start()
      }

      const createdAgents: TradingAgent[] = []

      // Create agents for the farm
      for (let i = 0; i < wizardData.agentCount; i++) {
        const agentConfig = {
          name: `${wizardData.name} Agent ${i + 1}`,
          strategy: {
            name: `${wizardData.strategy.name} ${i + 1}`,
            type: wizardData.strategy.type,
            parameters: wizardData.strategy.parameters,
            description: wizardData.strategy.description
          },
          initialCapital: wizardData.initialCapitalPerAgent,
          riskLimits: {
            ...wizardData.riskLimits,
            maxDailyLoss: wizardData.riskLimits.maxDailyLoss / wizardData.agentCount
          }
        }

        const agent = paperTradingEngine.createAgent(agentConfig)
        createdAgents.push(agent)
      }

      // Create farm object
      const farm = {
        farm_id: `farm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        farm_name: wizardData.name,
        description: wizardData.description,
        strategy_type: wizardData.strategy.type,
        status: 'active',
        created_at: new Date().toISOString(),
        target_daily_profit: wizardData.targetDailyProfit,
        target_win_rate: wizardData.targetWinRate,
        max_risk_per_trade: wizardData.maxRiskPerTrade,
        total_allocated_capital: wizardData.totalAllocatedCapital,
        coordination_mode: wizardData.coordinationMode,
        profit_distribution: wizardData.profitDistribution,
        auto_scaling: wizardData.autoScaling,
        emergency_stop_loss: wizardData.emergencyStopLoss,
        agents: createdAgents.map(agent => agent.id),
        metadata: {
          agent_count: wizardData.agentCount,
          strategy_parameters: wizardData.strategy.parameters,
          risk_limits: wizardData.riskLimits,
          creation_wizard_version: '2.0'
        }
      }

      // Try to save to backend first
      try {
        const backendResponse = await backendApi.post('/api/v1/farms', farm)
        console.log('Farm saved to backend:', backendResponse.data)
      } catch (backendError) {
        console.error('Error saving farm to backend:', backendError)
        // Continue with local creation even if backend fails
      }

      toast.success('Farm created successfully!')
      
      if (onFarmCreated) {
        onFarmCreated(farm)
      }
      
      // Return to farms list view
      if (onReturn) {
        onReturn()
      }

    } catch (error) {
      console.error('Error creating farm:', error)
      toast.error('Failed to create farm')
    } finally {
      setIsCreating(false)
    }
  }
