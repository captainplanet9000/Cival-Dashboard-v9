'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Wizard, type WizardStep } from '@/components/ui/wizard'
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown'
import { Modal } from '@/components/ui/feedback/modal'
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
  Save
} from 'lucide-react'
import { paperTradingEngine, TradingAgent, TradingStrategy, RiskLimits } from '@/lib/trading/real-paper-trading-engine'
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

interface EnhancedFarmCreationWizardProps {
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

export function EnhancedFarmCreationWizard({ onFarmCreated, className }: EnhancedFarmCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
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

  useEffect(() => {
    if (isOpen) {
      loadExistingAgents()
    }
  }, [isOpen])

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
      const response = await backendApi.get('/api/v1/agents/status')
      if (response.data) {
        console.log('Backend agents:', response.data)
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }

  const validateStep = async (stepIndex: number, data: FarmConfig): Promise<boolean | string> => {
    switch (stepIndex) {
      case 0:
        if (!data.name?.trim()) {
          return 'Farm name is required'
        }
        if (data.name.length < 3) {
          return 'Farm name must be at least 3 characters'
        }
        if (data.totalAllocatedCapital < 5000) {
          return 'Minimum capital is $5,000'
        }
        break

      case 1:
        if (!data.strategy?.name?.trim()) {
          return 'Strategy name is required'
        }
        if (data.agentCount < 1 || data.agentCount > 20) {
          return 'Agent count must be between 1 and 20'
        }
        break

      case 2:
        if (data.riskLimits?.maxPositionSize < 1 || data.riskLimits?.maxPositionSize > 50) {
          return 'Position size must be between 1% and 50%'
        }
        if (data.riskLimits?.maxDailyLoss < 100) {
          return 'Minimum daily loss limit is $100'
        }
        if (data.targetDailyProfit <= 0) {
          return 'Target daily profit must be positive'
        }
        break
    }

    return true
  }

  const handleStepChange = (step: number) => {
    setCurrentStep(step)
  }

  const handleDataChange = (newData: FarmConfig) => {
    setWizardData(newData)
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

  const createFarm = async (finalData: FarmConfig) => {
    setIsCreating(true)
    try {
      // Start the trading engine if not already running
      if (!paperTradingEngine.listenerCount('pricesUpdated')) {
        paperTradingEngine.start()
      }

      const createdAgents: TradingAgent[] = []

      // Create agents for the farm
      for (let i = 0; i < finalData.agentCount; i++) {
        const agentConfig = {
          name: `${finalData.name} Agent ${i + 1}`,
          strategy: {
            name: `${finalData.strategy.name} ${i + 1}`,
            type: finalData.strategy.type,
            parameters: finalData.strategy.parameters,
            description: finalData.strategy.description
          },
          initialCapital: finalData.initialCapitalPerAgent,
          riskLimits: {
            ...finalData.riskLimits,
            maxDailyLoss: finalData.riskLimits.maxDailyLoss / finalData.agentCount
          }
        }

        const agent = paperTradingEngine.createAgent(agentConfig)
        createdAgents.push(agent)
      }

      // Create farm object
      const farm = {
        farm_id: `farm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        farm_name: finalData.name,
        description: finalData.description,
        strategy_type: finalData.strategy.type,
        status: 'active',
        created_at: new Date().toISOString(),
        target_daily_profit: finalData.targetDailyProfit,
        target_win_rate: finalData.targetWinRate,
        max_risk_per_trade: finalData.maxRiskPerTrade,
        total_allocated_capital: finalData.totalAllocatedCapital,
        coordination_mode: finalData.coordinationMode,
        profit_distribution: finalData.profitDistribution,
        auto_scaling: finalData.autoScaling,
        emergency_stop_loss: finalData.emergencyStopLoss,
        agents: createdAgents.map(agent => agent.id),
        metadata: {
          agent_count: finalData.agentCount,
          strategy_parameters: finalData.strategy.parameters,
          risk_limits: finalData.riskLimits,
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

      toast.success(`Farm "${finalData.name}" created successfully with ${createdAgents.length} agents!`)
      onFarmCreated?.(farm)

      // Reset wizard
      setWizardData({
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
      setCurrentStep(0)
      setIsOpen(false)

      console.log('✅ Farm created successfully:', farm)
      console.log('✅ Created agents:', createdAgents)
    } catch (error) {
      console.error('❌ Failed to create farm:', error)
      toast.error('Failed to create farm. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Create strategy options for enhanced dropdown
  const strategyOptions: DropdownOption[] = Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => ({
    value: key,
    label: template.name,
    description: template.description,
    icon: <TrendingUp className="h-4 w-4" />,
    group: template.riskProfile
  }))

  // Create coordination mode options
  const coordinationOptions: DropdownOption[] = Object.entries(COORDINATION_MODES).map(([key, mode]) => ({
    value: key,
    label: mode.name,
    description: mode.description,
    icon: key === 'independent' ? <Bot className="h-4 w-4" /> : 
          key === 'coordinated' ? <Users className="h-4 w-4" /> : 
          <BarChart3 className="h-4 w-4" />
  }))

  function renderBasicConfigStep() {
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
              value={wizardData.name}
              onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., High Frequency Momentum Farm"
            />
          </div>

          <div>
            <Label htmlFor="agentCount">Number of Agents</Label>
            <Input
              id="agentCount"
              type="number"
              value={wizardData.agentCount}
              onChange={(e) => setWizardData(prev => ({ 
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
            value={wizardData.description}
            onChange={(e) => setWizardData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the purpose and strategy of this farm..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Statistic
            title="Capital Per Agent"
            value={wizardData.initialCapitalPerAgent}
            formatter={(value) => `$${Number(value).toLocaleString()}`}
            prefix={<DollarSign className="h-4 w-4" />}
          />
          <Statistic
            title="Total Agents"
            value={wizardData.agentCount}
            prefix={<Bot className="h-4 w-4" />}
          />
          <Statistic
            title="Total Capital"
            value={wizardData.totalAllocatedCapital}
            formatter={(value) => `$${Number(value).toLocaleString()}`}
            prefix={<Target className="h-4 w-4" />}
          />
        </div>

        {existingAgents.length > 0 && (
          <Alert
            type="info"
            message="Existing Agents"
            description={`You have ${existingAgents.length} existing agents. This farm will create ${wizardData.agentCount} new agents.`}
            showIcon
          />
        )}
      </Space>
    )
  }

  function renderStrategyStep() {
    return (
      <Space direction="vertical" size="large" className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Strategy Type *</Label>
            <EnhancedDropdown
              options={strategyOptions}
              value={wizardData.strategy.type}
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
              value={wizardData.coordinationMode}
              onValueChange={(value) => setWizardData(prev => ({ 
                ...prev, 
                coordinationMode: value as any 
              }))}
              placeholder="Select coordination mode"
            />
          </div>
        </div>

        {wizardData.strategy.description && (
          <Alert
            type="info"
            message="Strategy Description"
            description={wizardData.strategy.description}
            showIcon
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Strategy Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(wizardData.strategy.parameters).map(([key, value]) => (
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
          </CardContent>
        </Card>

        {/* Coordination Mode Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {COORDINATION_MODES[wizardData.coordinationMode].name} Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {COORDINATION_MODES[wizardData.coordinationMode].description}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-600 mb-2">Advantages:</div>
                <ul className="space-y-1">
                  {COORDINATION_MODES[wizardData.coordinationMode].pros.map((pro, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium text-orange-600 mb-2">Considerations:</div>
                <ul className="space-y-1">
                  {COORDINATION_MODES[wizardData.coordinationMode].cons.map((con, idx) => (
                    <li key={idx} className="flex items-center">
                      <AlertTriangle className="h-3 w-3 text-orange-600 mr-1" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </Space>
    )
  }

  function renderRiskStep() {
    return (
      <Space direction="vertical" size="large" className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="targetDailyProfit">Target Daily Profit ($)</Label>
            <Input
              id="targetDailyProfit"
              type="number"
              value={wizardData.targetDailyProfit}
              onChange={(e) => setWizardData(prev => ({ 
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
              value={wizardData.targetWinRate}
              onChange={(e) => setWizardData(prev => ({ 
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
              value={wizardData.maxRiskPerTrade}
              onChange={(e) => setWizardData(prev => ({ 
                ...prev, 
                maxRiskPerTrade: Number(e.target.value) 
              }))}
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Statistic
            title="Target Daily Profit"
            value={wizardData.targetDailyProfit}
            formatter={(value) => `$${Number(value).toLocaleString()}`}
            prefix={<Target className="h-4 w-4" />}
          />
          <Statistic
            title="Target Win Rate"
            value={wizardData.targetWinRate}
            suffix="%"
            prefix={<TrendingUp className="h-4 w-4" />}
          />
          <Statistic
            title="Max Risk Per Trade"
            value={wizardData.maxRiskPerTrade}
            suffix="%"
            prefix={<AlertTriangle className="h-4 w-4" />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Risk Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="maxPositionSize">Max Position Size (%)</Label>
                <Input
                  id="maxPositionSize"
                  type="number"
                  value={wizardData.riskLimits.maxPositionSize}
                  onChange={(e) => setWizardData(prev => ({
                    ...prev,
                    riskLimits: { 
                      ...prev.riskLimits, 
                      maxPositionSize: Number(e.target.value) 
                    }
                  }))}
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <Label htmlFor="maxDailyLoss">Max Daily Loss ($)</Label>
                <Input
                  id="maxDailyLoss"
                  type="number"
                  value={wizardData.riskLimits.maxDailyLoss}
                  onChange={(e) => setWizardData(prev => ({
                    ...prev,
                    riskLimits: { 
                      ...prev.riskLimits, 
                      maxDailyLoss: Number(e.target.value) 
                    }
                  }))}
                  min="100"
                />
              </div>

              <div>
                <Label htmlFor="emergencyStopLoss">Emergency Stop Loss (%)</Label>
                <Input
                  id="emergencyStopLoss"
                  type="number"
                  value={wizardData.emergencyStopLoss}
                  onChange={(e) => setWizardData(prev => ({ 
                    ...prev, 
                    emergencyStopLoss: Number(e.target.value) 
                  }))}
                  min="5"
                  max="50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Profit Distribution</Label>
                <EnhancedDropdown
                  options={[
                    { value: 'equal', label: 'Equal Distribution', description: 'Split profits equally among agents' },
                    { value: 'performance', label: 'Performance Based', description: 'Distribute based on individual performance' },
                    { value: 'capital', label: 'Capital Weighted', description: 'Weight by allocated capital' }
                  ]}
                  value={wizardData.profitDistribution}
                  onValueChange={(value) => setWizardData(prev => ({ 
                    ...prev, 
                    profitDistribution: value as any 
                  }))}
                  placeholder="Select distribution method"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoScaling" className="text-sm">
                    Auto Scaling
                  </Label>
                  <Switch
                    id="autoScaling"
                    checked={wizardData.autoScaling}
                    onCheckedChange={(checked) =>
                      setWizardData(prev => ({ ...prev, autoScaling: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="stopLossEnabled" className="text-sm">
                    Stop Loss
                  </Label>
                  <Switch
                    id="stopLossEnabled"
                    checked={wizardData.riskLimits.stopLossEnabled}
                    onCheckedChange={(checked) => setWizardData(prev => ({
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
                    checked={wizardData.riskLimits.takeProfitEnabled}
                    onCheckedChange={(checked) => setWizardData(prev => ({
                      ...prev,
                      riskLimits: { ...prev.riskLimits, takeProfitEnabled: checked }
                    }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Space>
    )
  }

  // Create wizard steps
  const wizardSteps: WizardStep[] = [
    {
      id: 'basic',
      title: 'Farm Configuration',
      description: 'Set up basic farm details and capital allocation',
      icon: <Target className="h-4 w-4" />,
      validate: validateStep,
      content: renderBasicConfigStep()
    },
    {
      id: 'strategy',
      title: 'Strategy & Coordination',
      description: 'Choose trading strategy and coordination mode',
      icon: <TrendingUp className="h-4 w-4" />,
      validate: validateStep,
      content: renderStrategyStep()
    },
    {
      id: 'risk',
      title: 'Risk Management',
      description: 'Configure risk limits and targets',
      icon: <Shield className="h-4 w-4" />,
      validate: validateStep,
      content: renderRiskStep()
    }
  ]

  return (
    <>
      <Button 
        className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Farm
      </Button>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-emerald-600" />
            <div>
              <div className="text-xl font-semibold">Create Trading Farm</div>
              <div className="text-sm text-muted-foreground font-normal">
                Set up a coordinated group of AI agents to execute your trading strategy
              </div>
            </div>
          </div>
        }
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
        width="95vw"
        style={{ maxWidth: '1000px', maxHeight: '85vh' }}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}
        className="farm-creation-modal"
      >
        <Spin spinning={isCreating} tip="Creating farm and agents...">
          <Wizard
            steps={wizardSteps}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            data={wizardData}
            onDataChange={handleDataChange}
            onComplete={createFarm}
            onCancel={() => setIsOpen(false)}
            loading={isCreating}
            size="large"
            showProgress
            allowStepClick
          />
        </Spin>
      </Modal>
    </>
  )
}

export default EnhancedFarmCreationWizard