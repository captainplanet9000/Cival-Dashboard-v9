'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bot, Plus, Settings, Brain, Zap, Target, DollarSign, 
  TrendingUp, BarChart3, Shield, Clock, Star, Award,
  Cpu, Database, Globe, Layers, MessageSquare, Key
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Import services
import { enhancedAgentCreationService } from '@/lib/agents/enhanced-agent-creation-service'
import { persistentAgentService } from '@/lib/agents/persistent-agent-service'
import { strategyService } from '@/lib/supabase/strategy-service'

/**
 * Comprehensive Agent Creation & Management Component
 * Unified interface for creating and managing all types of agents
 */

interface AgentConfig {
  // Basic Configuration
  name: string
  description: string
  type: 'standard' | 'enhanced' | 'hft' | 'arbitrage' | 'defi' | 'cross_chain'
  
  // Strategy Configuration
  strategy: string
  customStrategy?: any
  
  // Capital & Risk
  initialCapital: number
  maxDrawdown: number
  riskLevel: 'low' | 'medium' | 'high'
  positionSize: number
  
  // AI Configuration
  aiProvider: 'openai' | 'claude' | 'gemini' | 'multi_llm'
  enableMemory: boolean
  enableLearning: boolean
  memoryDepth: number
  
  // Advanced Features
  enableBlockchain: boolean
  enableDeFi: boolean
  enableCrossChain: boolean
  enableHFT: boolean
  
  // Communication & Coordination
  enableCommunication: boolean
  farmId?: string
  coordinationLevel: 'none' | 'basic' | 'advanced' | 'distributed'
  
  // Automation Settings
  autoStart: boolean
  autoRebalance: boolean
  emergencyStop: boolean
  
  // Performance Targets
  targetReturn: number
  targetWinRate: number
  maxTrades: number
}

const defaultConfig: AgentConfig = {
  name: '',
  description: '',
  type: 'standard',
  strategy: 'momentum_rsi',
  initialCapital: 10000,
  maxDrawdown: 10,
  riskLevel: 'medium',
  positionSize: 5,
  aiProvider: 'openai',
  enableMemory: true,
  enableLearning: true,
  memoryDepth: 100,
  enableBlockchain: false,
  enableDeFi: false,
  enableCrossChain: false,
  enableHFT: false,
  enableCommunication: true,
  coordinationLevel: 'basic',
  autoStart: false,
  autoRebalance: true,
  emergencyStop: true,
  targetReturn: 15,
  targetWinRate: 65,
  maxTrades: 1000
}

interface Strategy {
  id: string
  name: string
  description: string
  type: 'technical' | 'fundamental' | 'ml' | 'arbitrage' | 'hft'
  riskLevel: 'low' | 'medium' | 'high'
  timeframe: string[]
  indicators: string[]
  winRate: number
  maxDrawdown: number
  isActive: boolean
}

export function ComprehensiveAgentCreation({ 
  onAgentCreated,
  onClose 
}: { 
  onAgentCreated?: () => void
  onClose?: () => void 
}) {
  const [config, setConfig] = useState<AgentConfig>(defaultConfig)
  const [currentStep, setCurrentStep] = useState('basic')
  const [creating, setCreating] = useState(false)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [previewMode, setPreviewMode] = useState(false)

  // Load available strategies
  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = async () => {
    try {
      // Load strategies from strategy service
      const allStrategies: Strategy[] = [
        // Classic Strategies
        {
          id: 'momentum_rsi',
          name: 'RSI Momentum',
          description: 'Momentum trading with RSI confirmation',
          type: 'technical',
          riskLevel: 'medium',
          timeframe: ['5m', '15m', '1h'],
          indicators: ['RSI', 'MACD', 'Moving Average'],
          winRate: 68.5,
          maxDrawdown: 8.2,
          isActive: true
        },
        {
          id: 'bollinger_reversion',
          name: 'Bollinger Band Reversion',
          description: 'Mean reversion using Bollinger Bands',
          type: 'technical',
          riskLevel: 'low',
          timeframe: ['15m', '1h', '4h'],
          indicators: ['Bollinger Bands', 'RSI', 'Volume'],
          winRate: 72.1,
          maxDrawdown: 5.8,
          isActive: true
        },
        // Advanced Strategies (Phase 1)
        {
          id: 'darvas_box',
          name: 'Darvas Box Strategy',
          description: 'Box breakout pattern trading with volume confirmation',
          type: 'technical',
          riskLevel: 'medium',
          timeframe: ['1h', '4h', '1d'],
          indicators: ['Price Action', 'Volume', 'Support/Resistance'],
          winRate: 74.3,
          maxDrawdown: 12.1,
          isActive: true
        },
        {
          id: 'williams_alligator',
          name: 'Williams Alligator',
          description: 'Trend following with Williams Alligator indicator',
          type: 'technical',
          riskLevel: 'medium',
          timeframe: ['15m', '1h', '4h'],
          indicators: ['Alligator', 'Fractals', 'Awesome Oscillator'],
          winRate: 69.8,
          maxDrawdown: 9.7,
          isActive: true
        },
        {
          id: 'renko_breakout',
          name: 'Renko Breakout',
          description: 'Brick-based price action trading system',
          type: 'technical',
          riskLevel: 'high',
          timeframe: ['5m', '15m', '1h'],
          indicators: ['Renko Bricks', 'RSI', 'Moving Average'],
          winRate: 71.2,
          maxDrawdown: 15.3,
          isActive: true
        },
        {
          id: 'heikin_ashi',
          name: 'Heikin Ashi Trend',
          description: 'Modified candlestick trend analysis',
          type: 'technical',
          riskLevel: 'low',
          timeframe: ['30m', '1h', '4h'],
          indicators: ['Heikin Ashi', 'EMA', 'Stochastic'],
          winRate: 76.5,
          maxDrawdown: 7.2,
          isActive: true
        },
        {
          id: 'elliott_wave',
          name: 'Elliott Wave Pattern',
          description: 'Wave pattern recognition and trading',
          type: 'technical',
          riskLevel: 'high',
          timeframe: ['1h', '4h', '1d'],
          indicators: ['Wave Analysis', 'Fibonacci', 'RSI'],
          winRate: 68.9,
          maxDrawdown: 18.4,
          isActive: true
        },
        // HFT Strategies
        {
          id: 'hft_scalping',
          name: 'HFT Scalping',
          description: 'High-frequency scalping with sub-second execution',
          type: 'hft',
          riskLevel: 'medium',
          timeframe: ['1s', '5s', '15s'],
          indicators: ['Order Flow', 'Level 2', 'Tick Data'],
          winRate: 85.2,
          maxDrawdown: 3.1,
          isActive: true
        },
        {
          id: 'arbitrage_triangular',
          name: 'Triangular Arbitrage',
          description: 'Cross-exchange triangular arbitrage opportunities',
          type: 'arbitrage',
          riskLevel: 'low',
          timeframe: ['real-time'],
          indicators: ['Price Spreads', 'Order Books', 'Latency'],
          winRate: 92.7,
          maxDrawdown: 1.8,
          isActive: true
        },
        // AI/ML Strategies
        {
          id: 'ml_ensemble',
          name: 'ML Ensemble',
          description: 'Machine learning ensemble model predictions',
          type: 'ml',
          riskLevel: 'medium',
          timeframe: ['15m', '1h', '4h'],
          indicators: ['Neural Network', 'Random Forest', 'SVM'],
          winRate: 73.6,
          maxDrawdown: 11.4,
          isActive: true
        }
      ]
      
      setStrategies(allStrategies)
    } catch (error) {
      console.error('Error loading strategies:', error)
      toast.error('Failed to load strategies')
    }
  }

  const updateConfig = (field: keyof AgentConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const validateConfig = (): string[] => {
    const errors: string[] = []
    
    if (!config.name.trim()) errors.push('Agent name is required')
    if (config.initialCapital <= 0) errors.push('Initial capital must be greater than 0')
    if (config.maxDrawdown <= 0 || config.maxDrawdown > 50) errors.push('Max drawdown must be between 1-50%')
    if (config.positionSize <= 0 || config.positionSize > 100) errors.push('Position size must be between 1-100%')
    
    return errors
  }

  const createAgent = async () => {
    const errors = validateConfig()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    setCreating(true)
    try {
      const agentData = {
        name: config.name,
        description: config.description,
        type: config.type,
        strategy: config.strategy,
        initialCapital: config.initialCapital,
        riskLevel: config.riskLevel,
        
        // Enhanced configuration
        enhancedConfig: {
          aiProvider: config.aiProvider,
          enableMemory: config.enableMemory,
          enableLearning: config.enableLearning,
          memoryDepth: config.memoryDepth,
          enableBlockchain: config.enableBlockchain,
          enableDeFi: config.enableDeFi,
          enableCrossChain: config.enableCrossChain,
          enableHFT: config.enableHFT,
          enableCommunication: config.enableCommunication,
          coordinationLevel: config.coordinationLevel
        },
        
        // Risk management
        riskConfig: {
          maxDrawdown: config.maxDrawdown,
          positionSize: config.positionSize,
          emergencyStop: config.emergencyStop,
          autoRebalance: config.autoRebalance
        },
        
        // Performance targets
        targets: {
          targetReturn: config.targetReturn,
          targetWinRate: config.targetWinRate,
          maxTrades: config.maxTrades
        },
        
        // Automation
        automation: {
          autoStart: config.autoStart
        }
      }

      // Create agent using enhanced service
      const createdAgent = await enhancedAgentCreationService.createAgent(agentData)
      
      toast.success(`Agent "${config.name}" created successfully!`)
      
      // Auto-start if configured
      if (config.autoStart) {
        try {
          await enhancedAgentCreationService.startAgent(createdAgent.id)
          toast.success(`Agent "${config.name}" started automatically`)
        } catch (error) {
          console.error('Error auto-starting agent:', error)
          toast.error('Agent created but failed to auto-start')
        }
      }
      
      // Reset form
      setConfig(defaultConfig)
      setCurrentStep('basic')
      
      // Callback
      if (onAgentCreated) onAgentCreated()
      
    } catch (error) {
      console.error('Error creating agent:', error)
      toast.error('Failed to create agent')
    } finally {
      setCreating(false)
    }
  }

  const steps = [
    { id: 'basic', label: 'Basic Info', icon: Bot },
    { id: 'strategy', label: 'Strategy', icon: Brain },
    { id: 'capital', label: 'Capital & Risk', icon: DollarSign },
    { id: 'ai', label: 'AI Features', icon: Cpu },
    { id: 'advanced', label: 'Advanced', icon: Settings },
    { id: 'review', label: 'Review', icon: Star }
  ]

  const selectedStrategy = strategies.find(s => s.id === config.strategy)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Create New Agent
              <Badge variant="secondary">Comprehensive</Badge>
            </CardTitle>
            <CardDescription>
              Configure and deploy a new trading agent with advanced features
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {previewMode ? (
          <AgentConfigPreview config={config} strategy={selectedStrategy} />
        ) : (
          <>
            {/* Step Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = step.id === currentStep
                const isCompleted = steps.findIndex(s => s.id === currentStep) > index
                
                return (
                  <Button
                    key={step.id}
                    variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentStep(step.id)}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    {step.label}
                  </Button>
                )
              })}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {currentStep === 'basic' && (
                <BasicInfoStep config={config} updateConfig={updateConfig} />
              )}
              {currentStep === 'strategy' && (
                <StrategyStep 
                  config={config} 
                  updateConfig={updateConfig} 
                  strategies={strategies}
                />
              )}
              {currentStep === 'capital' && (
                <CapitalRiskStep config={config} updateConfig={updateConfig} />
              )}
              {currentStep === 'ai' && (
                <AIFeaturesStep config={config} updateConfig={updateConfig} />
              )}
              {currentStep === 'advanced' && (
                <AdvancedFeaturesStep config={config} updateConfig={updateConfig} />
              )}
              {currentStep === 'review' && (
                <ReviewStep 
                  config={config} 
                  strategy={selectedStrategy}
                  onCreateAgent={createAgent}
                  creating={creating}
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === currentStep)
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1].id)
                  }
                }}
                disabled={currentStep === 'basic'}
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === currentStep)
                  if (currentIndex < steps.length - 1) {
                    setCurrentStep(steps[currentIndex + 1].id)
                  }
                }}
                disabled={currentStep === 'review'}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Step Components
function BasicInfoStep({ 
  config, 
  updateConfig 
}: { 
  config: AgentConfig
  updateConfig: (field: keyof AgentConfig, value: any) => void 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => updateConfig('name', e.target.value)}
              placeholder="Enter agent name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => updateConfig('description', e.target.value)}
              placeholder="Describe your agent's purpose and strategy"
              rows={3}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Agent Type</Label>
            <Select value={config.type} onValueChange={(value) => updateConfig('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard - Basic trading agent</SelectItem>
                <SelectItem value="enhanced">Enhanced - AI-powered with memory</SelectItem>
                <SelectItem value="hft">HFT - High-frequency trading</SelectItem>
                <SelectItem value="arbitrage">Arbitrage - Cross-exchange opportunities</SelectItem>
                <SelectItem value="defi">DeFi - Decentralized finance protocols</SelectItem>
                <SelectItem value="cross_chain">Cross-Chain - Multi-blockchain trading</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-start"
              checked={config.autoStart}
              onCheckedChange={(checked) => updateConfig('autoStart', checked)}
            />
            <Label htmlFor="auto-start">Auto-start agent after creation</Label>
          </div>
        </div>
      </div>
    </div>
  )
}

function StrategyStep({ 
  config, 
  updateConfig, 
  strategies 
}: { 
  config: AgentConfig
  updateConfig: (field: keyof AgentConfig, value: any) => void
  strategies: Strategy[]
}) {
  const selectedStrategy = strategies.find(s => s.id === config.strategy)
  
  return (
    <div className="space-y-6">
      <div>
        <Label>Select Trading Strategy</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {strategies.map((strategy) => (
            <Card
              key={strategy.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                config.strategy === strategy.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => updateConfig('strategy', strategy.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{strategy.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {strategy.description}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    strategy.riskLevel === 'low' ? 'secondary' :
                    strategy.riskLevel === 'medium' ? 'default' : 'destructive'
                  }>
                    {strategy.riskLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span>{strategy.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Max DD:</span>
                    <span>{strategy.maxDrawdown.toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {strategy.indicators.slice(0, 3).map((indicator) => (
                      <Badge key={indicator} variant="outline" className="text-xs">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {selectedStrategy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Strategy Details: {selectedStrategy.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Type</Label>
                <p className="capitalize">{selectedStrategy.type}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Risk Level</Label>
                <p className="capitalize">{selectedStrategy.riskLevel}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Win Rate</Label>
                <p>{selectedStrategy.winRate.toFixed(1)}%</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Max Drawdown</Label>
                <p>{selectedStrategy.maxDrawdown.toFixed(1)}%</p>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-sm text-muted-foreground">Indicators Used</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedStrategy.indicators.map((indicator) => (
                  <Badge key={indicator} variant="outline">
                    {indicator}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-sm text-muted-foreground">Timeframes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedStrategy.timeframe.map((tf) => (
                  <Badge key={tf} variant="secondary">
                    {tf}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CapitalRiskStep({ 
  config, 
  updateConfig 
}: { 
  config: AgentConfig
  updateConfig: (field: keyof AgentConfig, value: any) => void 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="capital">Initial Capital ($)</Label>
            <Input
              id="capital"
              type="number"
              value={config.initialCapital}
              onChange={(e) => updateConfig('initialCapital', parseFloat(e.target.value) || 0)}
              min="1000"
              step="1000"
            />
          </div>
          
          <div>
            <Label htmlFor="risk-level">Risk Level</Label>
            <Select value={config.riskLevel} onValueChange={(value) => updateConfig('riskLevel', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Conservative approach</SelectItem>
                <SelectItem value="medium">Medium - Balanced risk/reward</SelectItem>
                <SelectItem value="high">High - Aggressive trading</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Max Drawdown: {config.maxDrawdown}%</Label>
            <Slider
              value={[config.maxDrawdown]}
              onValueChange={(value) => updateConfig('maxDrawdown', value[0])}
              min={1}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label>Position Size: {config.positionSize}%</Label>
            <Slider
              value={[config.positionSize]}
              onValueChange={(value) => updateConfig('positionSize', value[0])}
              min={1}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Target Return: {config.targetReturn}%</Label>
          <Slider
            value={[config.targetReturn]}
            onValueChange={(value) => updateConfig('targetReturn', value[0])}
            min={5}
            max={100}
            step={5}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label>Target Win Rate: {config.targetWinRate}%</Label>
          <Slider
            value={[config.targetWinRate]}
            onValueChange={(value) => updateConfig('targetWinRate', value[0])}
            min={50}
            max={95}
            step={5}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label htmlFor="max-trades">Max Trades</Label>
          <Input
            id="max-trades"
            type="number"
            value={config.maxTrades}
            onChange={(e) => updateConfig('maxTrades', parseInt(e.target.value) || 0)}
            min="10"
            step="10"
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-rebalance"
            checked={config.autoRebalance}
            onCheckedChange={(checked) => updateConfig('autoRebalance', checked)}
          />
          <Label htmlFor="auto-rebalance">Enable automatic portfolio rebalancing</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="emergency-stop"
            checked={config.emergencyStop}
            onCheckedChange={(checked) => updateConfig('emergencyStop', checked)}
          />
          <Label htmlFor="emergency-stop">Enable emergency stop on high losses</Label>
        </div>
      </div>
    </div>
  )
}

function AIFeaturesStep({ 
  config, 
  updateConfig 
}: { 
  config: AgentConfig
  updateConfig: (field: keyof AgentConfig, value: any) => void 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="ai-provider">AI Provider</Label>
            <Select value={config.aiProvider} onValueChange={(value) => updateConfig('aiProvider', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI GPT-4 - Advanced reasoning</SelectItem>
                <SelectItem value="claude">Anthropic Claude - Analytical focus</SelectItem>
                <SelectItem value="gemini">Google Gemini - Multi-modal AI</SelectItem>
                <SelectItem value="multi_llm">Multi-LLM - Consensus decisions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-memory"
                checked={config.enableMemory}
                onCheckedChange={(checked) => updateConfig('enableMemory', checked)}
              />
              <Label htmlFor="enable-memory">Enable agent memory system</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-learning"
                checked={config.enableLearning}
                onCheckedChange={(checked) => updateConfig('enableLearning', checked)}
              />
              <Label htmlFor="enable-learning">Enable machine learning adaptation</Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {config.enableMemory && (
            <div>
              <Label>Memory Depth: {config.memoryDepth} decisions</Label>
              <Slider
                value={[config.memoryDepth]}
                onValueChange={(value) => updateConfig('memoryDepth', value[0])}
                min={50}
                max={1000}
                step={50}
                className="mt-2"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-communication"
              checked={config.enableCommunication}
              onCheckedChange={(checked) => updateConfig('enableCommunication', checked)}
            />
            <Label htmlFor="enable-communication">Enable inter-agent communication</Label>
          </div>
          
          {config.enableCommunication && (
            <div>
              <Label htmlFor="coordination-level">Coordination Level</Label>
              <Select 
                value={config.coordinationLevel} 
                onValueChange={(value) => updateConfig('coordinationLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None - Independent operation</SelectItem>
                  <SelectItem value="basic">Basic - Share market insights</SelectItem>
                  <SelectItem value="advanced">Advanced - Coordinated strategies</SelectItem>
                  <SelectItem value="distributed">Distributed - Consensus decisions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdvancedFeaturesStep({ 
  config, 
  updateConfig 
}: { 
  config: AgentConfig
  updateConfig: (field: keyof AgentConfig, value: any) => void 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blockchain Features</CardTitle>
            <CardDescription>Enable blockchain and DeFi functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-blockchain"
                checked={config.enableBlockchain}
                onCheckedChange={(checked) => updateConfig('enableBlockchain', checked)}
              />
              <Label htmlFor="enable-blockchain">Enable blockchain trading</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-defi"
                checked={config.enableDeFi}
                onCheckedChange={(checked) => updateConfig('enableDeFi', checked)}
              />
              <Label htmlFor="enable-defi">Enable DeFi protocol integration</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-cross-chain"
                checked={config.enableCrossChain}
                onCheckedChange={(checked) => updateConfig('enableCrossChain', checked)}
              />
              <Label htmlFor="enable-cross-chain">Enable cross-chain arbitrage</Label>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">High-Performance Features</CardTitle>
            <CardDescription>Advanced trading capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-hft"
                checked={config.enableHFT}
                onCheckedChange={(checked) => updateConfig('enableHFT', checked)}
              />
              <Label htmlFor="enable-hft">Enable high-frequency trading</Label>
            </div>
            
            {config.enableHFT && (
              <div className="pl-6 text-sm text-muted-foreground">
                <p>⚡ Sub-20ms execution latency</p>
                <p>📊 Level 2 market data</p>
                <p>🔄 Microsecond order management</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {(config.enableBlockchain || config.enableDeFi || config.enableCrossChain || config.enableHFT) && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.enableBlockchain && (
                <div>
                  <Label className="text-sm font-medium">Supported Networks</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">Ethereum</Badge>
                    <Badge variant="outline">Polygon</Badge>
                    <Badge variant="outline">Arbitrum</Badge>
                    <Badge variant="outline">Base</Badge>
                  </div>
                </div>
              )}
              
              {config.enableDeFi && (
                <div>
                  <Label className="text-sm font-medium">DeFi Protocols</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">Uniswap</Badge>
                    <Badge variant="outline">Aave</Badge>
                    <Badge variant="outline">Compound</Badge>
                    <Badge variant="outline">Curve</Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ReviewStep({ 
  config, 
  strategy, 
  onCreateAgent, 
  creating 
}: { 
  config: AgentConfig
  strategy?: Strategy
  onCreateAgent: () => void
  creating: boolean
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration Summary</CardTitle>
          <CardDescription>Review your agent configuration before creation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Basic Info</Label>
                <div className="mt-2 space-y-1">
                  <p><strong>Name:</strong> {config.name}</p>
                  <p><strong>Type:</strong> {config.type}</p>
                  <p><strong>Description:</strong> {config.description || 'No description'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Capital & Risk</Label>
                <div className="mt-2 space-y-1">
                  <p><strong>Initial Capital:</strong> ${config.initialCapital.toLocaleString()}</p>
                  <p><strong>Risk Level:</strong> {config.riskLevel}</p>
                  <p><strong>Max Drawdown:</strong> {config.maxDrawdown}%</p>
                  <p><strong>Position Size:</strong> {config.positionSize}%</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Strategy</Label>
                <div className="mt-2 space-y-1">
                  <p><strong>Strategy:</strong> {strategy?.name || config.strategy}</p>
                  <p><strong>Type:</strong> {strategy?.type || 'Unknown'}</p>
                  {strategy && (
                    <>
                      <p><strong>Expected Win Rate:</strong> {strategy.winRate.toFixed(1)}%</p>
                      <p><strong>Max Drawdown:</strong> {strategy.maxDrawdown.toFixed(1)}%</p>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">AI Features</Label>
                <div className="mt-2 space-y-1">
                  <p><strong>AI Provider:</strong> {config.aiProvider}</p>
                  <p><strong>Memory:</strong> {config.enableMemory ? 'Enabled' : 'Disabled'}</p>
                  <p><strong>Learning:</strong> {config.enableLearning ? 'Enabled' : 'Disabled'}</p>
                  <p><strong>Communication:</strong> {config.enableCommunication ? config.coordinationLevel : 'Disabled'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Summary */}
          <div className="mt-6">
            <Label className="text-sm font-medium text-muted-foreground">Enabled Features</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {config.enableMemory && <Badge variant="secondary">Memory System</Badge>}
              {config.enableLearning && <Badge variant="secondary">Machine Learning</Badge>}
              {config.enableCommunication && <Badge variant="secondary">Agent Communication</Badge>}
              {config.enableBlockchain && <Badge variant="secondary">Blockchain Trading</Badge>}
              {config.enableDeFi && <Badge variant="secondary">DeFi Integration</Badge>}
              {config.enableCrossChain && <Badge variant="secondary">Cross-Chain</Badge>}
              {config.enableHFT && <Badge variant="secondary">High-Frequency Trading</Badge>}
              {config.autoStart && <Badge variant="secondary">Auto-Start</Badge>}
              {config.autoRebalance && <Badge variant="secondary">Auto-Rebalance</Badge>}
              {config.emergencyStop && <Badge variant="secondary">Emergency Stop</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button
          onClick={onCreateAgent}
          disabled={creating}
          size="lg"
          className="px-8"
        >
          {creating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Creating Agent...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function AgentConfigPreview({ 
  config, 
  strategy 
}: { 
  config: AgentConfig
  strategy?: Strategy
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {config.name || 'Unnamed Agent'}
            <Badge variant="outline">{config.type}</Badge>
          </CardTitle>
          <CardDescription>{config.description || 'No description provided'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Capital</Label>
              <p className="text-lg font-semibold">${config.initialCapital.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Risk Level</Label>
              <p className="text-lg font-semibold capitalize">{config.riskLevel}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Max Drawdown</Label>
              <p className="text-lg font-semibold">{config.maxDrawdown}%</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">AI Provider</Label>
              <p className="text-lg font-semibold">{config.aiProvider}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {strategy && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Strategy: {strategy.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{strategy.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Win Rate</Label>
                <p className="text-lg font-semibold">{strategy.winRate.toFixed(1)}%</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Max DD</Label>
                <p className="text-lg font-semibold">{strategy.maxDrawdown.toFixed(1)}%</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Type</Label>
                <p className="text-lg font-semibold capitalize">{strategy.type}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Risk</Label>
                <p className="text-lg font-semibold capitalize">{strategy.riskLevel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ComprehensiveAgentCreation