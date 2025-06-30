'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Steps } from '@/components/ui/navigation/steps'
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown'
import { Alert } from '@/components/ui/feedback/alert'
import { Space } from '@/components/ui/layout/space'
import { Statistic } from '@/components/ui/data-display/statistic'
import {
  Target,
  Bot,
  TrendingUp,
  Shield,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Users,
  Settings,
  BarChart3
} from 'lucide-react'
import { paperTradingEngine, TradingStrategy, RiskLimits } from '@/lib/trading/real-paper-trading-engine'
import { backendApi } from '@/lib/api/backend-client'
import { toast } from 'react-hot-toast'

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

interface InlineFarmCreationProps {
  onFarmCreated?: (farm: any) => void
  onCancel?: () => void
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

export function InlineFarmCreation({ onFarmCreated, onCancel, className }: InlineFarmCreationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [farmData, setFarmData] = useState<FarmConfig>({
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
    // Update total allocated capital when agent count or capital per agent changes
    setFarmData(prev => ({
      ...prev,
      totalAllocatedCapital: prev.agentCount * prev.initialCapitalPerAgent
    }))
  }, [farmData.agentCount, farmData.initialCapitalPerAgent])

  const farmSteps = [
    {
      title: 'Farm Configuration',
      description: 'Set up basic farm details and capital allocation',
      icon: <Target className="h-4 w-4" />
    },
    {
      title: 'Strategy & Coordination',
      description: 'Choose trading strategy and coordination mode',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      title: 'Risk Management',
      description: 'Configure risk limits and targets',
      icon: <Shield className="h-4 w-4" />
    },
    {
      title: 'Review & Create',
      description: 'Review configuration and create farm',
      icon: <CheckCircle2 className="h-4 w-4" />
    }
  ]

  const handleNext = () => {
    if (currentStep < farmSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleCreateFarm()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStrategyChange = (strategyType: TradingStrategy['type']) => {
    const template = STRATEGY_TEMPLATES[strategyType]
    setFarmData(prev => ({
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

  const handleCreateFarm = async () => {
    setIsCreating(true)
    try {
      // Start the trading engine if not already running
      if (!paperTradingEngine.listenerCount('pricesUpdated')) {
        paperTradingEngine.start()
      }

      const createdAgents: any[] = []

      // Create agents for the farm
      for (let i = 0; i < farmData.agentCount; i++) {
        const agentConfig = {
          name: `${farmData.name} Agent ${i + 1}`,
          strategy: {
            name: `${farmData.strategy.name} ${i + 1}`,
            type: farmData.strategy.type,
            parameters: farmData.strategy.parameters,
            description: farmData.strategy.description
          },
          initialCapital: farmData.initialCapitalPerAgent,
          riskLimits: {
            ...farmData.riskLimits,
            maxDailyLoss: farmData.riskLimits.maxDailyLoss / farmData.agentCount
          }
        }

        const agent = paperTradingEngine.createAgent(agentConfig)
        createdAgents.push(agent)
      }

      // Create farm object
      const farm = {
        farm_id: `farm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        farm_name: farmData.name,
        description: farmData.description,
        strategy_type: farmData.strategy.type,
        status: 'active',
        created_at: new Date().toISOString(),
        target_daily_profit: farmData.targetDailyProfit,
        target_win_rate: farmData.targetWinRate,
        max_risk_per_trade: farmData.maxRiskPerTrade,
        total_allocated_capital: farmData.totalAllocatedCapital,
        coordination_mode: farmData.coordinationMode,
        profit_distribution: farmData.profitDistribution,
        auto_scaling: farmData.autoScaling,
        emergency_stop_loss: farmData.emergencyStopLoss,
        agents: createdAgents.map(agent => agent.id),
        metadata: {
          agent_count: farmData.agentCount,
          strategy_parameters: farmData.strategy.parameters,
          risk_limits: farmData.riskLimits,
          creation_wizard_version: '2.0'
        }
      }

      // Try to save to backend first
      try {
        const backendResponse = await backendApi.post('/api/v1/farms', farm)
        console.log('Farm saved to backend:', backendResponse.data)
      } catch (backendError) {
        console.warn('Backend save failed, using localStorage:', backendError)
      }

      // Store farm in localStorage for persistence
      const existingFarms = JSON.parse(localStorage.getItem('trading_farms') || '[]')
      existingFarms.push(farm)
      localStorage.setItem('trading_farms', JSON.stringify(existingFarms))

      toast.success(`Farm "${farmData.name}" created successfully with ${createdAgents.length} agents!`)
      onFarmCreated?.(farm)

      console.log('✅ Farm created successfully:', farm)
      console.log('✅ Created agents:', createdAgents)
    } catch (error) {
      console.error('❌ Failed to create farm:', error)
      toast.error('Failed to create farm. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const strategyOptions: DropdownOption[] = Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => ({
    value: key,
    label: template.name,
    description: template.description,
    icon: <TrendingUp className="h-4 w-4" />,
    group: template.riskProfile
  }))

  const coordinationOptions: DropdownOption[] = Object.entries(COORDINATION_MODES).map(([key, mode]) => ({
    value: key,
    label: mode.name,
    description: mode.description,
    icon: key === 'independent' ? <Bot className="h-4 w-4" /> : 
          key === 'coordinated' ? <Users className="h-4 w-4" /> : 
          <BarChart3 className="h-4 w-4" />
  }))

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Space direction="vertical" size="large" className="w-full">
            <Alert
              type="info"
              message="Farm Setup"
              description="Configure your trading farm with multiple AI agents working together to execute your strategy."
              showIcon
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Farm Name *</Label>
                <Input
                  id="name"
                  value={farmData.name}
                  onChange={(e) => setFarmData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High Frequency Momentum Farm"
                />
              </div>

              <div>
                <Label htmlFor="agentCount">Number of Agents</Label>
                <Input
                  id="agentCount"
                  type="number"
                  value={farmData.agentCount}
                  onChange={(e) => setFarmData(prev => ({ 
                    ...prev, 
                    agentCount: Math.max(1, Math.min(20, Number(e.target.value))) 
                  }))}
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={farmData.description}
                onChange={(e) => setFarmData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose and strategy of this farm..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Statistic
                title="Capital Per Agent"
                value={farmData.initialCapitalPerAgent}
                formatter={(value) => `$${Number(value).toLocaleString()}`}
                prefix={<DollarSign className="h-4 w-4" />}
              />
              <Statistic
                title="Total Agents"
                value={farmData.agentCount}
                prefix={<Bot className="h-4 w-4" />}
              />
              <Statistic
                title="Total Capital"
                value={farmData.totalAllocatedCapital}
                formatter={(value) => `$${Number(value).toLocaleString()}`}
                prefix={<Target className="h-4 w-4" />}
              />
            </div>
          </Space>
        )

      case 1:
        return (
          <Space direction="vertical" size="large" className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Strategy Type *</Label>
                <EnhancedDropdown
                  options={strategyOptions}
                  value={farmData.strategy.type}
                  onValueChange={(value) => handleStrategyChange(value as any)}
                  placeholder="Select strategy"
                  searchable
                  showGroupLabels
                />
              </div>

              <div>
                <Label>Coordination Mode</Label>
                <EnhancedDropdown
                  options={coordinationOptions}
                  value={farmData.coordinationMode}
                  onValueChange={(value) => setFarmData(prev => ({ 
                    ...prev, 
                    coordinationMode: value as any 
                  }))}
                  placeholder="Select coordination mode"
                />
              </div>
            </div>

            {farmData.strategy.description && (
              <Alert
                type="info"
                message="Strategy Description"
                description={farmData.strategy.description}
                showIcon
              />
            )}
          </Space>
        )

      case 2:
        return (
          <Space direction="vertical" size="large" className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="targetDailyProfit">Target Daily Profit ($)</Label>
                <Input
                  id="targetDailyProfit"
                  type="number"
                  value={farmData.targetDailyProfit}
                  onChange={(e) => setFarmData(prev => ({ 
                    ...prev, 
                    targetDailyProfit: Number(e.target.value) 
                  }))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="targetWinRate">Target Win Rate (%)</Label>
                <Input
                  id="targetWinRate"
                  type="number"
                  value={farmData.targetWinRate}
                  onChange={(e) => setFarmData(prev => ({ 
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
                  value={farmData.maxRiskPerTrade}
                  onChange={(e) => setFarmData(prev => ({ 
                    ...prev, 
                    maxRiskPerTrade: Number(e.target.value) 
                  }))}
                  min="0.1"
                  max="10"
                  step="0.1"
                />
              </div>
            </div>
          </Space>
        )

      case 3:
        return (
          <Space direction="vertical" size="large" className="w-full">
            <Alert
              type="success"
              message="Ready to Create Farm"
              description="Review your configuration below and click 'Create Farm' to deploy your agents."
              showIcon
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Farm Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{farmData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Strategy:</span>
                    <span className="font-medium">{farmData.strategy.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agents:</span>
                    <span className="font-medium">{farmData.agentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Capital:</span>
                    <span className="font-medium">${farmData.totalAllocatedCapital.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk & Targets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Target:</span>
                    <span className="font-medium">${farmData.targetDailyProfit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate Target:</span>
                    <span className="font-medium">{farmData.targetWinRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Risk/Trade:</span>
                    <span className="font-medium">{farmData.maxRiskPerTrade}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordination:</span>
                    <span className="font-medium">{COORDINATION_MODES[farmData.coordinationMode].name}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Space>
        )

      default:
        return null
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Steps */}
      <Steps 
        current={currentStep} 
        items={farmSteps.map((step, index) => ({
          title: step.title,
          description: step.description,
          icon: step.icon,
          status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait'
        }))}
      />

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {farmSteps[currentStep].icon}
            {farmSteps[currentStep].title}
          </CardTitle>
          <CardDescription>
            {farmSteps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button 
            onClick={handleNext}
            disabled={isCreating || (currentStep === 0 && !farmData.name.trim())}
            loading={isCreating}
          >
            {currentStep === farmSteps.length - 1 ? 'Create Farm' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InlineFarmCreation