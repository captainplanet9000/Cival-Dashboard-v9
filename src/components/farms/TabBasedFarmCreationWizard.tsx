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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Info, ArrowLeft, ArrowRight, Check, CheckCircle2 } from 'lucide-react'
import { paperTradingEngine, TradingAgent, TradingStrategy, RiskLimits } from '@/lib/trading/real-paper-trading-engine'
import { backendApi } from '@/lib/api/backend-client'
import { toast } from 'react-hot-toast'

// Import farms service for proper backend integration
import { useFarms, FarmCreateConfig } from '@/lib/farms/farms-service'

// Import all agent services for comprehensive integration
import { enhancedAgentCreationService } from '@/lib/agents/enhanced-agent-creation-service'
import { persistentAgentService } from '@/lib/agents/persistent-agent-service'
import { agentLifecycleManager } from '@/lib/agents/agent-lifecycle-manager'

// Import shared data manager
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
  onReturn?: () => void
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
    riskProfile: 'very_low',
    recommendedAgents: { min: 5, max: 12, optimal: 8 }
  }
}

export function TabBasedFarmCreationWizard({ onFarmCreated, onCancel, onReturn, className }: TabBasedFarmCreationWizardProps) {
  const [activeStep, setActiveStep] = useState('basic')
  const [isCreating, setIsCreating] = useState(false)
  const [existingAgents, setExistingAgents] = useState<TradingAgent[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availableAgents, setAvailableAgents] = useState<any[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  
  // Use farms service for backend integration
  const { createFarm } = useFarms()
  
  // Get real-time agent data
  const { agents: realtimeAgents } = useSharedRealtimeData()
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
    loadExistingAgents()
    loadAvailableAgents()
  }, [realtimeAgents])

  // Load available agents from all sources
  const loadAvailableAgents = async () => {
    try {
      const allAgents = []
      
      // Get agents from paper trading engine
      const tradingAgents = paperTradingEngine.getAllAgents()
      allAgents.push(...tradingAgents.map(agent => ({
        ...agent,
        source: 'paper_trading',
        available: true
      })))
      
      // Get agents from persistent service
      const persistentAgents = persistentAgentService.getAllAgents()
      allAgents.push(...persistentAgents.map(agent => ({
        ...agent,
        source: 'persistent',
        available: true
      })))
      
      // Get agents from lifecycle manager
      const lifecycleAgents = await agentLifecycleManager.getAllAgents()
      allAgents.push(...lifecycleAgents.map(agent => ({
        ...agent,
        source: 'lifecycle',
        available: true
      })))
      
      // Get agents from enhanced service
      try {
        const enhancedAgents = enhancedAgentCreationService.getCreatedAgents()
        allAgents.push(...enhancedAgents.map(agent => ({
          ...agent,
          source: 'enhanced',
          available: true
        })))
      } catch (error) {
        console.log('Enhanced agents not available:', error)
      }
      
      // Add realtime agents
      allAgents.push(...realtimeAgents.map(agent => ({
        ...agent,
        source: 'realtime',
        available: agent.status !== 'assigned_to_farm'
      })))
      
      // Remove duplicates by ID/name
      const uniqueAgents = allAgents.filter((agent, index, self) => 
        index === self.findIndex(a => a.id === agent.id || a.name === agent.name)
      )
      
      setAvailableAgents(uniqueAgents)
    } catch (error) {
      console.error('Error loading available agents:', error)
    }
  }

  useEffect(() => {
    setWizardData(prev => ({
      ...prev,
      totalAllocatedCapital: prev.agentCount * prev.initialCapitalPerAgent
    }))
  }, [wizardData.agentCount, wizardData.initialCapitalPerAgent])

  const loadExistingAgents = async () => {
    try {
      const agents = paperTradingEngine.getAllAgents()
      setExistingAgents(agents)
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }

  const handleStrategyChange = (strategyType: TradingStrategy['type']) => {
    const template = STRATEGY_TEMPLATES[strategyType]
    if (template) {
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
  }

  const validateStep = (stepId: string): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (stepId) {
      case 'basic':
        if (!wizardData.name?.trim()) {
          newErrors.name = 'Farm name is required'
        } else if (wizardData.name.length < 3) {
          newErrors.name = 'Farm name must be at least 3 characters'
        }
        if (wizardData.totalAllocatedCapital < 5000) {
          newErrors.totalCapital = 'Minimum capital is $5,000'
        }
        break
      case 'strategy':
        if (!wizardData.strategy?.name?.trim()) {
          newErrors.strategyName = 'Strategy name is required'
        }
        if (wizardData.agentCount < 1 || wizardData.agentCount > 20) {
          newErrors.agentCount = 'Agent count must be between 1 and 20'
        }
        break
      case 'risk':
        if (wizardData.riskLimits?.maxPositionSize < 1 || wizardData.riskLimits?.maxPositionSize > 50) {
          newErrors.maxPositionSize = 'Position size must be between 1% and 50%'
        }
        if (wizardData.riskLimits?.maxDailyLoss < 100) {
          newErrors.maxDailyLoss = 'Minimum daily loss limit is $100'
        }
        if (wizardData.targetDailyProfit <= 0) {
          newErrors.targetDailyProfit = 'Target daily profit must be positive'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (!validateStep(activeStep)) {
      return // Errors are set in validateStep
    }

    if (activeStep === 'basic') {
      setActiveStep('strategy')
    } else if (activeStep === 'strategy') {
      setActiveStep('agents')
    } else if (activeStep === 'agents') {
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
    } else if (activeStep === 'agents') {
      setActiveStep('strategy')
    } else if (activeStep === 'risk') {
      setActiveStep('agents')
    } else if (activeStep === 'review') {
      setActiveStep('risk')
    }
  }

  const handleCreateFarm = async () => {
    setIsCreating(true)
    try {
      // Start the paper trading engine if not already running
      if (!paperTradingEngine.listenerCount('pricesUpdated')) {
        paperTradingEngine.start()
      }

      const assignedAgents: string[] = []
      
      // Use selected existing agents first
      if (selectedAgents.length > 0) {
        assignedAgents.push(...selectedAgents)
        toast.success(`Assigned ${selectedAgents.length} existing agents to farm`)
      }
      
      // Create additional agents if needed
      const remainingAgentsNeeded = wizardData.agentCount - selectedAgents.length
      const createdAgents: TradingAgent[] = []

      for (let i = 0; i < remainingAgentsNeeded; i++) {
        // Try enhanced agent creation first
        try {
          const enhancedConfig = {
            name: `${wizardData.name} Agent ${i + 1}`,
            description: `Advanced trading agent for ${wizardData.name} farm using ${wizardData.strategy.name}`,
            initialCapital: wizardData.initialCapitalPerAgent,
            strategy: {
              type: wizardData.strategy.type,
              frequency: 'medium' as const,
              targetProfitPerTrade: wizardData.targetDailyProfit / wizardData.agentCount / 10, // 10 trades per day target
              parameters: wizardData.strategy.parameters
            },
            riskLimits: {
              ...wizardData.riskLimits,
              maxDailyLoss: wizardData.riskLimits.maxDailyLoss / wizardData.agentCount
            },
            walletConfig: {
              createDedicatedWallet: true,
              walletType: 'hot' as const,
              initialFunding: wizardData.initialCapitalPerAgent,
              autoFunding: true,
              fundingThreshold: wizardData.initialCapitalPerAgent * 0.1,
              maxWalletBalance: wizardData.initialCapitalPerAgent * 2,
              vaultIntegration: true,
              backupToVault: true,
              vaultBackupFrequency: 'daily' as const
            },
            vaultConfig: {
              enabled: true,
              encryptionLevel: 'high' as const,
              accessLevel: 'write' as const,
              sharedVault: true,
              backupStrategy: 'incremental' as const,
              retentionPeriod: 30
            },
            llmConfig: {
              provider: 'gemini' as const,
              model: 'gemini-pro',
              decisionFrequency: 30000,
              contextWindow: 4000,
              temperature: 0.7,
              enableLearning: true
            },
            mcpTools: {
              enabled: ['market_analysis', 'risk_assessment', 'portfolio_optimization'],
              permissions: ['read_market_data', 'execute_trades', 'manage_risk']
            },
            memory: {
              historyRetention: 30,
              learningEnabled: true,
              adaptiveParameters: true,
              performanceTracking: true
            },
            autonomous: {
              autoStart: true,
              continuousTrading: true,
              adaptiveStrategy: true,
              riskAdjustment: true
            }
          }
          
          const enhancedAgentId = await enhancedAgentCreationService.createAutonomousAgent(enhancedConfig)
          assignedAgents.push(enhancedAgentId)
          console.log(`✅ Created enhanced agent: ${enhancedAgentId}`)
          
        } catch (enhancedError) {
          console.log('Enhanced agent creation failed, using paper trading agent:', enhancedError)
          
          // Fallback to paper trading agent
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
          assignedAgents.push(agent.id)
        }
      }

      // Create farm configuration for the service
      const farmConfig: FarmCreateConfig = {
        name: wizardData.name,
        description: wizardData.description,
        farmType: wizardData.strategy.type,
        targetAllocation: wizardData.totalAllocatedCapital,
        strategy: wizardData.strategy.type,
        parameters: {
          ...wizardData.strategy.parameters,
          targetDailyProfit: wizardData.targetDailyProfit,
          targetWinRate: wizardData.targetWinRate,
          maxRiskPerTrade: wizardData.maxRiskPerTrade,
          profitDistribution: wizardData.profitDistribution,
          autoScaling: wizardData.autoScaling,
          emergencyStopLoss: wizardData.emergencyStopLoss,
          coordinationMode: wizardData.coordinationMode
        },
        riskLimits: {
          maxDrawdown: wizardData.riskLimits.maxDrawdown,
          maxConcentration: wizardData.riskLimits.maxPositionSize,
          maxLeverage: wizardData.riskLimits.maxLeverage
        },
        agents: assignedAgents
      }

      // Create farm using the farms service
      const farmId = await createFarm(farmConfig)
      
      // Get the created farm data
      const farmData = {
        id: farmId,
        name: wizardData.name,
        description: wizardData.description,
        strategy: wizardData.strategy.type,
        agentCount: wizardData.agentCount,
        totalCapital: wizardData.totalAllocatedCapital,
        coordinationMode: wizardData.coordinationMode,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        agents: assignedAgents,
        performance: {
          totalValue: wizardData.totalAllocatedCapital,
          totalPnL: 0,
          winRate: 0,
          tradeCount: 0,
          roiPercent: 0,
          activeAgents: wizardData.agentCount,
          avgAgentPerformance: 0
        }
      }
      
      toast.success(`Farm "${wizardData.name}" created successfully with ${assignedAgents.length} agents!`)
      
      if (onFarmCreated) {
        onFarmCreated(farmData)
      }
      
      // Reset wizard data
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
      setActiveStep('basic')
      
      if (onReturn) {
        onReturn()
      }

    } catch (error) {
      console.error('Error creating farm:', error)
      toast.error('Failed to create farm. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const getStepProgress = () => {
    const steps = ['basic', 'strategy', 'agents', 'risk', 'review']
    const currentIndex = steps.indexOf(activeStep)
    return ((currentIndex + 1) / steps.length) * 100
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className || ''}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Trading Farm</h1>
            <p className="text-gray-600">Set up a coordinated group of AI trading agents</p>
          </div>
          <div className="flex gap-2">
            {onReturn && (
              <Button variant="outline" onClick={onReturn}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Farms
              </Button>
            )}
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(getStepProgress())}%</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>
      </div>

      <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="risk">Risk & Capital</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Farm Configuration</CardTitle>
              <CardDescription>Basic settings for your trading farm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farm-name">Farm Name *</Label>
                  <Input
                    id="farm-name"
                    value={wizardData.name}
                    onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter farm name..."
                    className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="agent-count">Number of Agents</Label>
                  <Input
                    id="agent-count"
                    type="number"
                    min="1"
                    max="20"
                    value={wizardData.agentCount}
                    onChange={(e) => setWizardData(prev => ({ ...prev, agentCount: parseInt(e.target.value) || 1 }))}
                    className={`mt-1 ${errors.agentCount ? 'border-red-500' : ''}`}
                  />
                  {errors.agentCount && <p className="text-sm text-red-600 mt-1">{errors.agentCount}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="farm-description">Description</Label>
                <Textarea
                  id="farm-description"
                  value={wizardData.description}
                  onChange={(e) => setWizardData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your farm's purpose and strategy..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capital-per-agent">Capital per Agent ($)</Label>
                  <Input
                    id="capital-per-agent"
                    type="number"
                    min="1000"
                    value={wizardData.initialCapitalPerAgent}
                    onChange={(e) => setWizardData(prev => ({ ...prev, initialCapitalPerAgent: parseInt(e.target.value) || 10000 }))}
                    className={`mt-1 ${errors.totalCapital ? 'border-red-500' : ''}`}
                  />
                  {errors.totalCapital && <p className="text-sm text-red-600 mt-1">{errors.totalCapital}</p>}
                </div>
                <div>
                  <Label>Total Allocated Capital</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <div className="text-lg font-semibold text-green-600">
                      ${wizardData.totalAllocatedCapital.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {wizardData.agentCount} agents × ${wizardData.initialCapitalPerAgent.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Strategy</CardTitle>
              <CardDescription>Configure the trading strategy for your farm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Strategy Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all ${
                        wizardData.strategy.type === key
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleStrategyChange(key as TradingStrategy['type'])}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {wizardData.strategy.type === key && (
                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {template.riskProfile.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {template.recommendedAgents.optimal} agents
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Assignment</CardTitle>
              <CardDescription>
                Assign existing agents or create new ones for your farm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">Available Agents ({availableAgents.filter(a => a.available).length})</Label>
                  <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg">
                    {availableAgents.filter(a => a.available).map(agent => (
                      <div 
                        key={agent.id} 
                        className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                          selectedAgents.includes(agent.id) ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => {
                          if (selectedAgents.includes(agent.id)) {
                            setSelectedAgents(prev => prev.filter(id => id !== agent.id))
                          } else if (selectedAgents.length < wizardData.agentCount) {
                            setSelectedAgents(prev => [...prev, agent.id])
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{agent.name}</div>
                            <div className="text-xs text-gray-500">
                              Source: {agent.source} • 
                              Status: {agent.status || 'available'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {agent.strategy || agent.strategyType || 'General'}
                            </Badge>
                            {selectedAgents.includes(agent.id) && (
                              <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {availableAgents.filter(a => a.available).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No available agents found
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Farm Configuration</Label>
                  <div className="mt-2 space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <div className="flex justify-between mb-2">
                          <span>Total Agents Needed:</span>
                          <span className="font-medium">{wizardData.agentCount}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Selected Existing:</span>
                          <span className="font-medium">{selectedAgents.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Will Create New:</span>
                          <span className="font-medium">{Math.max(0, wizardData.agentCount - selectedAgents.length)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Coordination Mode</Label>
                      <Select 
                        value={wizardData.coordinationMode} 
                        onValueChange={(value: any) => setWizardData(prev => ({ ...prev, coordinationMode: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="independent">Independent - Agents trade separately</SelectItem>
                          <SelectItem value="coordinated">Coordinated - Agents share information</SelectItem>
                          <SelectItem value="hierarchical">Hierarchical - Master agent coordinates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Profit Distribution</Label>
                      <Select 
                        value={wizardData.profitDistribution} 
                        onValueChange={(value: any) => setWizardData(prev => ({ ...prev, profitDistribution: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equal">Equal - Split profits equally</SelectItem>
                          <SelectItem value="performance">Performance - Based on results</SelectItem>
                          <SelectItem value="capital">Capital - Based on allocation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Auto-scaling</div>
                        <div className="text-xs text-gray-600">Automatically add/remove agents</div>
                      </div>
                      <Switch
                        checked={wizardData.autoScaling}
                        onCheckedChange={(checked) => setWizardData(prev => ({ ...prev, autoScaling: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {selectedAgents.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-blue-900 text-sm mb-1">Selected Agents</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgents.map(agentId => {
                      const agent = availableAgents.find(a => a.id === agentId)
                      return (
                        <Badge key={agentId} variant="secondary" className="text-xs">
                          {agent?.name || agentId}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Configure risk limits and safety measures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-position">Max Position Size (%)</Label>
                  <Input
                    id="max-position"
                    type="number"
                    min="1"
                    max="50"
                    value={wizardData.riskLimits.maxPositionSize}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      riskLimits: { ...prev.riskLimits, maxPositionSize: parseInt(e.target.value) || 10 }
                    }))}
                    className={`mt-1 ${errors.maxPositionSize ? 'border-red-500' : ''}`}
                  />
                  {errors.maxPositionSize && <p className="text-sm text-red-600 mt-1">{errors.maxPositionSize}</p>}
                </div>
                <div>
                  <Label htmlFor="max-daily-loss">Max Daily Loss ($)</Label>
                  <Input
                    id="max-daily-loss"
                    type="number"
                    min="100"
                    value={wizardData.riskLimits.maxDailyLoss}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      riskLimits: { ...prev.riskLimits, maxDailyLoss: parseInt(e.target.value) || 500 }
                    }))}
                    className={`mt-1 ${errors.maxDailyLoss ? 'border-red-500' : ''}`}
                  />
                  {errors.maxDailyLoss && <p className="text-sm text-red-600 mt-1">{errors.maxDailyLoss}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-profit">Target Daily Profit ($)</Label>
                  <Input
                    id="target-profit"
                    type="number"
                    min="1"
                    value={wizardData.targetDailyProfit}
                    onChange={(e) => setWizardData(prev => ({ ...prev, targetDailyProfit: parseInt(e.target.value) || 1000 }))}
                    className={`mt-1 ${errors.targetDailyProfit ? 'border-red-500' : ''}`}
                  />
                  {errors.targetDailyProfit && <p className="text-sm text-red-600 mt-1">{errors.targetDailyProfit}</p>}
                </div>
                <div>
                  <Label htmlFor="target-winrate">Target Win Rate (%)</Label>
                  <Input
                    id="target-winrate"
                    type="number"
                    min="50"
                    max="95"
                    value={wizardData.targetWinRate}
                    onChange={(e) => setWizardData(prev => ({ ...prev, targetWinRate: parseInt(e.target.value) || 75 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Risk Controls</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Stop Loss Protection</div>
                      <div className="text-sm text-gray-600">Automatically close losing positions</div>
                    </div>
                    <Switch
                      checked={wizardData.riskLimits.stopLossEnabled}
                      onCheckedChange={(checked) => setWizardData(prev => ({
                        ...prev,
                        riskLimits: { ...prev.riskLimits, stopLossEnabled: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Take Profit Orders</div>
                      <div className="text-sm text-gray-600">Lock in profits at target levels</div>
                    </div>
                    <Switch
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
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>Review your farm configuration before creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Basic Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Farm Name:</span>
                      <span className="font-medium">{wizardData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agents:</span>
                      <span className="font-medium">{wizardData.agentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Capital:</span>
                      <span className="font-medium">${wizardData.totalAllocatedCapital.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Strategy:</span>
                      <span className="font-medium">{wizardData.strategy.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coordination:</span>
                      <span className="font-medium capitalize">{wizardData.coordinationMode}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Risk Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Position:</span>
                      <span className="font-medium">{wizardData.riskLimits.maxPositionSize}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Daily Loss:</span>
                      <span className="font-medium">${wizardData.riskLimits.maxDailyLoss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Profit:</span>
                      <span className="font-medium">${wizardData.targetDailyProfit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Win Rate:</span>
                      <span className="font-medium">{wizardData.targetWinRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {wizardData.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {wizardData.description}
                  </p>
                </div>
              )}

              {selectedAgents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Selected Agents ({selectedAgents.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgents.map(agentId => {
                      const agent = availableAgents.find(a => a.id === agentId)
                      return (
                        <Badge key={agentId} variant="secondary" className="text-xs">
                          {agent?.name || agentId}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900">Ready to Create</div>
                  <div className="text-sm text-blue-800 mt-1">
                    Your farm will use {selectedAgents.length} existing agents and create {Math.max(0, wizardData.agentCount - selectedAgents.length)} new agents 
                    with ${wizardData.initialCapitalPerAgent.toLocaleString()} each.
                    They will trade using the {wizardData.strategy.name} strategy in {wizardData.coordinationMode} mode.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={activeStep === 'basic'}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleNextStep}
          disabled={isCreating}
          className="min-w-[120px]"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : activeStep === 'review' ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Create Farm
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}