/**
 * Enhanced Agent Creation Wizard
 * Complete agent creation with leverage and profit securing integration
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bot, Settings, Target, Shield, Zap, DollarSign,
  ChevronRight, ChevronLeft, CheckCircle, AlertCircle,
  TrendingUp, Coins, Lock, Activity
} from 'lucide-react'
import { backendClient } from '@/lib/api/backend-client'
import { getAgentWalletIntegration } from '@/lib/blockchain/agent-wallet-integration'
import { toast } from 'react-hot-toast'

interface AgentConfig {
  // Basic Configuration
  name: string
  description: string
  agent_type: string
  trading_style: string
  
  // Risk and Capital
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
  initial_capital: number
  max_position_size: number
  
  // Wallet Configuration (NEW)
  use_real_wallets: boolean
  master_wallet_allocation: number
  chains: ('ethereum' | 'arbitrum')[]
  allowed_tokens: string[]
  max_trade_size: number
  
  // Leverage Configuration
  leverage_enabled: boolean
  max_leverage: number
  auto_deleveraging: boolean
  margin_call_threshold: number
  
  // Profit Securing Configuration
  profit_securing_enabled: boolean
  milestone_amounts: number[]
  auto_secure_on_milestone: boolean
  borrow_percentage: number
  preferred_protocol: 'aave' | 'compound' | 'makerdao' | 'auto'
  
  // Advanced Settings
  goal_creation_enabled: boolean
  performance_tracking: boolean
  state_persistence: boolean
  auto_trading: boolean
}

interface EnhancedAgentCreationWizardProps {
  onAgentCreated?: (agent: any) => void
  onCancel?: () => void
  className?: string
}

export default function EnhancedAgentCreationWizard({ 
  onAgentCreated, 
  onCancel, 
  className 
}: EnhancedAgentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [creationResult, setCreationResult] = useState<any>(null)
  
  const [config, setConfig] = useState<AgentConfig>({
    // Basic Configuration
    name: '',
    description: '',
    agent_type: 'balanced',
    trading_style: 'balanced_momentum',
    
    // Risk and Capital
    risk_tolerance: 'moderate',
    initial_capital: 10000,
    max_position_size: 2500,
    
    // Wallet Configuration (NEW)
    use_real_wallets: false, // Start with testnet for safety
    master_wallet_allocation: 1000,
    chains: ['ethereum'],
    allowed_tokens: ['USDC', 'USDT', 'ETH', 'WBTC'],
    max_trade_size: 1000,
    
    // Leverage Configuration
    leverage_enabled: true,
    max_leverage: 10,
    auto_deleveraging: true,
    margin_call_threshold: 80,
    
    // Profit Securing Configuration
    profit_securing_enabled: true,
    milestone_amounts: [100, 1000, 10000, 50000],
    auto_secure_on_milestone: true,
    borrow_percentage: 20,
    preferred_protocol: 'auto',
    
    // Advanced Settings
    goal_creation_enabled: true,
    performance_tracking: true,
    state_persistence: true,
    auto_trading: false // Start with manual approval for safety
  })

  const steps = [
    {
      id: 'basic',
      title: 'Basic Configuration',
      description: 'Agent identity and trading style',
      icon: Bot
    },
    {
      id: 'risk',
      title: 'Risk & Capital',
      description: 'Risk tolerance and capital allocation',
      icon: Shield
    },
    {
      id: 'wallet',
      title: 'Wallet Setup',
      description: 'Blockchain wallet configuration',
      icon: Coins
    },
    {
      id: 'leverage',
      title: 'Leverage Settings',
      description: 'Leverage limits and risk management',
      icon: Zap
    },
    {
      id: 'profit',
      title: 'Profit Securing',
      description: 'Milestone configuration and DeFi integration',
      icon: Target
    },
    {
      id: 'advanced',
      title: 'Advanced Features',
      description: 'Goals, persistence, and monitoring',
      icon: Settings
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Final configuration review',
      icon: CheckCircle
    }
  ]

  const agentTypes = [
    { value: 'trend_following', label: 'Trend Following', description: 'Momentum and trend-based strategies' },
    { value: 'arbitrage', label: 'Arbitrage', description: 'Cross-exchange and statistical arbitrage' },
    { value: 'mean_reversion', label: 'Mean Reversion', description: 'Contrarian and reversion strategies' },
    { value: 'balanced', label: 'Balanced', description: 'Multi-strategy balanced approach' },
    { value: 'scalping', label: 'Scalping', description: 'High-frequency short-term trades' }
  ]

  const tradingStyles = [
    { value: 'conservative_momentum', label: 'Conservative Momentum', risk: 'Low' },
    { value: 'balanced_momentum', label: 'Balanced Momentum', risk: 'Medium' },
    { value: 'aggressive_momentum', label: 'Aggressive Momentum', risk: 'High' },
    { value: 'risk_neutral_arbitrage', label: 'Risk-Neutral Arbitrage', risk: 'Very Low' },
    { value: 'conservative_mean_reversion', label: 'Conservative Reversion', risk: 'Low' },
    { value: 'adaptive_strategy', label: 'Adaptive Strategy', risk: 'Variable' }
  ]

  const protocolOptions = [
    { value: 'auto', label: 'Auto-Select', description: 'Best protocol based on conditions' },
    { value: 'aave', label: 'Aave V3', description: 'High liquidity, 3.5% APY' },
    { value: 'compound', label: 'Compound V3', description: 'Stable returns, 2.9% APY' },
    { value: 'makerdao', label: 'MakerDAO', description: 'Decentralized, 4.1% APY' }
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

  const createAgent = async () => {
    try {
      setIsCreating(true)
      toast.loading('Creating agent and setting up wallets...', { id: 'agent-creation' })
      
      // Step 1: Create agent in database
      const agentData = {
        name: config.name,
        description: config.description,
        agent_type: config.agent_type,
        trading_style: config.trading_style,
        risk_tolerance: config.risk_tolerance,
        initial_capital: config.initial_capital,
        max_position_size: config.max_position_size,
        leverage_enabled: config.leverage_enabled,
        max_leverage: config.max_leverage,
        auto_deleveraging: config.auto_deleveraging,
        margin_call_threshold: config.margin_call_threshold,
        profit_securing_enabled: config.profit_securing_enabled,
        milestone_amounts: config.milestone_amounts,
        auto_secure_on_milestone: config.auto_secure_on_milestone,
        borrow_percentage: config.borrow_percentage,
        preferred_protocol: config.preferred_protocol,
        goal_creation_enabled: config.goal_creation_enabled,
        performance_tracking: config.performance_tracking,
        state_persistence: config.state_persistence,
        auto_trading: config.auto_trading,
        status: 'active',
        created_at: new Date().toISOString()
      }

      // Create agent via API endpoint
      const agentResponse = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      })
      
      if (!agentResponse.ok) {
        const error = await agentResponse.json()
        throw new Error(error.message || 'Failed to create agent')
      }
      
      const agentResult = await agentResponse.json()
      const agentId = agentResult.data?.id || `agent_${Date.now()}`
      
      // Step 2: Set up wallet integration
      const walletIntegration = getAgentWalletIntegration()
      
      const walletConfig = {
        agentId,
        agentName: config.name,
        agentType: config.agent_type as 'trading' | 'arbitrage' | 'liquidity' | 'yield_farming',
        chains: config.chains,
        riskLevel: config.risk_tolerance as 'low' | 'medium' | 'high',
        maxTradeSize: config.max_trade_size,
        allowedTokens: config.allowed_tokens,
        tradingStrategy: config.trading_style,
        autoTrading: config.auto_trading,
        useRealWallets: config.use_real_wallets,
        masterWalletAllocation: config.master_wallet_allocation
      }
      
      // Register agent with wallet system
      const walletSuccess = await walletIntegration.registerAgent(walletConfig)
      
      if (!walletSuccess) {
        console.warn('Wallet registration failed, but agent was created')
      }
      
      // Step 3: Store agent configuration in Supabase
      try {
        await backendClient.storeAgentConfig(agentId, {
          ...agentData,
          wallet_config: walletConfig,
          wallet_integration: walletSuccess
        })
      } catch (error) {
        console.warn('Failed to store agent config in Supabase:', error)
      }
      
      const result = {
        success: true,
        agent: {
          agent_id: agentId,
          name: config.name,
          type: config.agent_type,
          status: 'active',
          created_at: new Date().toISOString(),
          wallet_integration: walletSuccess,
          use_real_wallets: config.use_real_wallets,
          chains: config.chains,
          master_wallet_allocation: config.master_wallet_allocation
        },
        leverage_enabled: config.leverage_enabled,
        profit_securing_enabled: config.profit_securing_enabled,
        milestone_tracking_enabled: config.milestone_amounts.length > 0,
        wallet_setup: walletSuccess
      }
      
      setCreationResult(result)
      
      if (result.success && onAgentCreated) {
        onAgentCreated(result.agent)
      }
      
      toast.success(`Agent "${config.name}" created successfully!`, { id: 'agent-creation' })
      
      // Display wallet information
      if (walletSuccess) {
        const walletSummary = walletIntegration.getAgentWalletSummary(agentId)
        toast.success(
          `Agent wallets ${config.use_real_wallets ? '(REAL)' : '(Testnet)'} created on ${config.chains.join(', ')}`,
          { duration: 5000 }
        )
      }
      
    } catch (error) {
      console.error('Error creating agent:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create agent. Please try again.'
      
      setCreationResult({ 
        success: false, 
        error: errorMessage
      })
      
      toast.error(errorMessage, { id: 'agent-creation' })
    } finally {
      setIsCreating(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'very low': return 'text-green-600'
      case 'low': return 'text-green-500'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-500'
      case 'variable': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const calculateProjectedReturns = () => {
    const baseReturn = config.initial_capital * 0.15 // 15% base annual return
    const leverageMultiplier = config.leverage_enabled ? (1 + (config.max_leverage - 1) * 0.1) : 1
    const riskMultiplier = config.risk_tolerance === 'aggressive' ? 1.3 : config.risk_tolerance === 'conservative' ? 0.7 : 1
    
    return Math.round(baseReturn * leverageMultiplier * riskMultiplier)
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full border-2 
            ${index <= currentStep 
              ? 'bg-primary border-primary text-primary-foreground' 
              : 'border-muted-foreground text-muted-foreground'
            }
          `}>
            {index < currentStep ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <step.icon className="h-5 w-5" />
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`
              w-12 h-0.5 mx-2 
              ${index < currentStep ? 'bg-primary' : 'bg-muted-foreground'}
            `} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Create Enhanced Trading Agent
          </CardTitle>
          <CardDescription>
            Configure a new autonomous trading agent with leverage and profit securing capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StepIndicator />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 0: Basic Configuration */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Agent Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Marcus Momentum"
                        value={config.name}
                        onChange={(e) => updateConfig({ name: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="agent_type">Agent Type</Label>
                      <Select value={config.agent_type} onValueChange={(value) => updateConfig({ agent_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {agentTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the agent's purpose and strategy..."
                      value={config.description}
                      onChange={(e) => updateConfig({ description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trading Style</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tradingStyles.map(style => (
                        <div
                          key={style.value}
                          className={`
                            p-3 border rounded-lg cursor-pointer transition-colors
                            ${config.trading_style === style.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-primary/50'
                            }
                          `}
                          onClick={() => updateConfig({ trading_style: style.value })}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{style.label}</span>
                            <Badge variant="outline" className={getRiskColor(style.risk)}>
                              {style.risk}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Risk & Capital */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Risk Tolerance</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { value: 'conservative', label: 'Conservative', desc: 'Lower risk, stable returns' },
                        { value: 'moderate', label: 'Moderate', desc: 'Balanced risk and return' },
                        { value: 'aggressive', label: 'Aggressive', desc: 'Higher risk, higher potential returns' }
                      ].map(option => (
                        <div
                          key={option.value}
                          className={`
                            p-4 border rounded-lg cursor-pointer transition-colors
                            ${config.risk_tolerance === option.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-primary/50'
                            }
                          `}
                          onClick={() => updateConfig({ risk_tolerance: option.value as any })}
                        >
                          <div className="text-center">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="initial_capital">Initial Capital ($)</Label>
                      <Input
                        id="initial_capital"
                        type="number"
                        value={config.initial_capital}
                        onChange={(e) => updateConfig({ initial_capital: Number(e.target.value) })}
                        min="1000"
                        max="1000000"
                        step="1000"
                      />
                      <p className="text-sm text-muted-foreground">
                        Starting capital for the agent
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_position_size">Max Position Size ($)</Label>
                      <Input
                        id="max_position_size"
                        type="number"
                        value={config.max_position_size}
                        onChange={(e) => updateConfig({ max_position_size: Number(e.target.value) })}
                        min="100"
                        max={config.initial_capital}
                        step="100"
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum size per position
                      </p>
                    </div>
                  </div>

                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Projected annual return: <strong>${calculateProjectedReturns().toLocaleString()}</strong> 
                      ({((calculateProjectedReturns() / config.initial_capital) * 100).toFixed(1)}%)
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 2: Wallet Configuration */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="use_real_wallets">Use Real Blockchain Wallets</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable real blockchain trading (⚠️ REAL MONEY) vs testnet simulation
                      </p>
                    </div>
                    <Switch
                      id="use_real_wallets"
                      checked={config.use_real_wallets}
                      onCheckedChange={(checked) => updateConfig({ use_real_wallets: checked })}
                    />
                  </div>

                  {config.use_real_wallets && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>⚠️ WARNING:</strong> Real wallets use actual cryptocurrency. 
                        Ensure you understand the risks before enabling.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="master_wallet_allocation">Master Wallet Allocation ($)</Label>
                      <Input
                        id="master_wallet_allocation"
                        type="number"
                        value={config.master_wallet_allocation}
                        onChange={(e) => updateConfig({ master_wallet_allocation: Number(e.target.value) })}
                        min="100"
                        max="50000"
                        step="100"
                      />
                      <p className="text-sm text-muted-foreground">
                        Amount allocated from master wallet to this agent
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_trade_size">Max Trade Size ($)</Label>
                      <Input
                        id="max_trade_size"
                        type="number"
                        value={config.max_trade_size}
                        onChange={(e) => updateConfig({ max_trade_size: Number(e.target.value) })}
                        min="10"
                        max={config.master_wallet_allocation}
                        step="10"
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum size per individual trade
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Supported Blockchains</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'ethereum', label: 'Ethereum', desc: 'ETH mainnet & testnet' },
                        { value: 'arbitrum', label: 'Arbitrum', desc: 'L2 scaling solution' }
                      ].map(chain => (
                        <div
                          key={chain.value}
                          className={`
                            p-3 border rounded-lg cursor-pointer transition-colors
                            ${config.chains.includes(chain.value as 'ethereum' | 'arbitrum')
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-primary/50'
                            }
                          `}
                          onClick={() => {
                            const newChains = config.chains.includes(chain.value as 'ethereum' | 'arbitrum')
                              ? config.chains.filter(c => c !== chain.value)
                              : [...config.chains, chain.value as 'ethereum' | 'arbitrum']
                            updateConfig({ chains: newChains.length > 0 ? newChains : ['ethereum'] })
                          }}
                        >
                          <div className="text-sm font-medium">{chain.label}</div>
                          <div className="text-xs text-muted-foreground">{chain.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Allowed Tokens</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['USDC', 'USDT', 'ETH', 'WBTC', 'DAI', 'LINK'].map(token => (
                        <div
                          key={token}
                          className={`
                            p-2 border rounded cursor-pointer transition-colors text-center text-sm
                            ${config.allowed_tokens.includes(token)
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-primary/50'
                            }
                          `}
                          onClick={() => {
                            const newTokens = config.allowed_tokens.includes(token)
                              ? config.allowed_tokens.filter(t => t !== token)
                              : [...config.allowed_tokens, token]
                            updateConfig({ allowed_tokens: newTokens.length > 0 ? newTokens : ['USDC'] })
                          }}
                        >
                          {token}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Leverage Settings */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="leverage_enabled">Enable Leverage Trading</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow the agent to use leverage up to 20x
                      </p>
                    </div>
                    <Switch
                      id="leverage_enabled"
                      checked={config.leverage_enabled}
                      onCheckedChange={(checked) => updateConfig({ leverage_enabled: checked })}
                    />
                  </div>

                  {config.leverage_enabled && (
                    <>
                      <div className="space-y-4">
                        <Label>Maximum Leverage: {config.max_leverage}x</Label>
                        <div className="px-3">
                          <Slider
                            value={[config.max_leverage]}
                            onValueChange={([value]) => updateConfig({ max_leverage: value })}
                            min={1}
                            max={20}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>1x (No leverage)</span>
                            <span>20x (Maximum)</span>
                          </div>
                        </div>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Higher leverage increases both potential profits and risks. 
                            Current setting: <strong>{config.max_leverage}x leverage</strong>
                          </AlertDescription>
                        </Alert>
                      </div>

                      <div className="space-y-4">
                        <Label>Margin Call Threshold: {config.margin_call_threshold}%</Label>
                        <div className="px-3">
                          <Slider
                            value={[config.margin_call_threshold]}
                            onValueChange={([value]) => updateConfig({ margin_call_threshold: value })}
                            min={50}
                            max={95}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>50% (Conservative)</span>
                            <span>95% (Aggressive)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto_deleveraging">Auto-Deleveraging</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically reduce leverage when limits are approached
                          </p>
                        </div>
                        <Switch
                          id="auto_deleveraging"
                          checked={config.auto_deleveraging}
                          onCheckedChange={(checked) => updateConfig({ auto_deleveraging: checked })}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 4: Profit Securing */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profit_securing_enabled">Enable Profit Securing</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically secure profits and use DeFi protocols
                      </p>
                    </div>
                    <Switch
                      id="profit_securing_enabled"
                      checked={config.profit_securing_enabled}
                      onCheckedChange={(checked) => updateConfig({ profit_securing_enabled: checked })}
                    />
                  </div>

                  {config.profit_securing_enabled && (
                    <>
                      <div className="space-y-4">
                        <Label>Milestone Amounts ($)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {config.milestone_amounts.map((amount, index) => (
                            <Input
                              key={index}
                              type="number"
                              value={amount}
                              onChange={(e) => {
                                const newAmounts = [...config.milestone_amounts]
                                newAmounts[index] = Number(e.target.value)
                                updateConfig({ milestone_amounts: newAmounts })
                              }}
                              min="100"
                              step="100"
                            />
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateConfig({ 
                            milestone_amounts: [...config.milestone_amounts, 100000] 
                          })}
                        >
                          Add Milestone
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <Label>Borrow Percentage: {config.borrow_percentage}%</Label>
                        <div className="px-3">
                          <Slider
                            value={[config.borrow_percentage]}
                            onValueChange={([value]) => updateConfig({ borrow_percentage: value })}
                            min={10}
                            max={30}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>10% (Conservative)</span>
                            <span>30% (Aggressive)</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Percentage of secured profits to borrow for continued trading
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred DeFi Protocol</Label>
                        <Select 
                          value={config.preferred_protocol} 
                          onValueChange={(value) => updateConfig({ preferred_protocol: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {protocolOptions.map(protocol => (
                              <SelectItem key={protocol.value} value={protocol.value}>
                                <div>
                                  <div className="font-medium">{protocol.label}</div>
                                  <div className="text-sm text-muted-foreground">{protocol.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto_secure_on_milestone">Auto-Secure on Milestones</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically secure profits when milestones are reached
                          </p>
                        </div>
                        <Switch
                          id="auto_secure_on_milestone"
                          checked={config.auto_secure_on_milestone}
                          onCheckedChange={(checked) => updateConfig({ auto_secure_on_milestone: checked })}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 5: Advanced Features */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="goal_creation_enabled">Automatic Goal Creation</Label>
                        <p className="text-sm text-muted-foreground">
                          Create trading goals automatically based on performance
                        </p>
                      </div>
                      <Switch
                        id="goal_creation_enabled"
                        checked={config.goal_creation_enabled}
                        onCheckedChange={(checked) => updateConfig({ goal_creation_enabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="performance_tracking">Performance Tracking</Label>
                        <p className="text-sm text-muted-foreground">
                          Track detailed performance metrics and analytics
                        </p>
                      </div>
                      <Switch
                        id="performance_tracking"
                        checked={config.performance_tracking}
                        onCheckedChange={(checked) => updateConfig({ performance_tracking: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="state_persistence">State Persistence</Label>
                        <p className="text-sm text-muted-foreground">
                          Maintain agent memory across system restarts
                        </p>
                      </div>
                      <Switch
                        id="state_persistence"
                        checked={config.state_persistence}
                        onCheckedChange={(checked) => updateConfig({ state_persistence: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto_trading">Auto Trading</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow agent to execute trades automatically without approval
                        </p>
                      </div>
                      <Switch
                        id="auto_trading"
                        checked={config.auto_trading}
                        onCheckedChange={(checked) => updateConfig({ auto_trading: checked })}
                      />
                    </div>
                  </div>

                  {config.auto_trading && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>⚠️ WARNING:</strong> Auto trading will execute trades without manual approval. 
                        Ensure proper risk management is configured.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Advanced features enable autonomous operation with minimal manual intervention.
                      Recommended for experienced users.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 6: Review & Create */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  {!creationResult ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Configuration Summary</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Basic Configuration</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Name:</span>
                              <span className="font-medium">{config.name || 'Unnamed Agent'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span className="font-medium">{config.agent_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Style:</span>
                              <span className="font-medium">{config.trading_style}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Risk:</span>
                              <span className="font-medium">{config.risk_tolerance}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Capital & Risk</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Initial Capital:</span>
                              <span className="font-medium">${config.initial_capital.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max Position:</span>
                              <span className="font-medium">${config.max_position_size.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Leverage:</span>
                              <span className="font-medium">
                                {config.leverage_enabled ? `${config.max_leverage}x` : 'Disabled'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Margin Call:</span>
                              <span className="font-medium">{config.margin_call_threshold}%</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Profit Securing</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Enabled:</span>
                              <span className="font-medium">
                                {config.profit_securing_enabled ? 'Yes' : 'No'}
                              </span>
                            </div>
                            {config.profit_securing_enabled && (
                              <>
                                <div className="flex justify-between">
                                  <span>Milestones:</span>
                                  <span className="font-medium">{config.milestone_amounts.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Borrow %:</span>
                                  <span className="font-medium">{config.borrow_percentage}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Protocol:</span>
                                  <span className="font-medium capitalize">{config.preferred_protocol}</span>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Wallet Configuration</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Mode:</span>
                              <span className="font-medium">
                                {config.use_real_wallets ? 'Real Wallets' : 'Testnet'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Allocation:</span>
                              <span className="font-medium">${config.master_wallet_allocation.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Chains:</span>
                              <span className="font-medium">{config.chains.join(', ')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max Trade:</span>
                              <span className="font-medium">${config.max_trade_size.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tokens:</span>
                              <span className="font-medium">{config.allowed_tokens.length} types</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Advanced Features</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Auto Goals:</span>
                              <span className="font-medium">
                                {config.goal_creation_enabled ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Performance:</span>
                              <span className="font-medium">
                                {config.performance_tracking ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Persistence:</span>
                              <span className="font-medium">
                                {config.state_persistence ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Auto Trading:</span>
                              <span className="font-medium">
                                {config.auto_trading ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : creationResult.success ? (
                    <div className="text-center space-y-4">
                      <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                      <h3 className="text-lg font-semibold">Agent Created Successfully!</h3>
                      <div className="space-y-2">
                        <p>Agent ID: <code className="bg-muted px-2 py-1 rounded">{creationResult.agent.agent_id}</code></p>
                        <p>Name: <strong>{creationResult.agent.name}</strong></p>
                        <div className="flex justify-center gap-2">
                          {creationResult.leverage_enabled && (
                            <Badge variant="default">Leverage Enabled</Badge>
                          )}
                          {creationResult.profit_securing_enabled && (
                            <Badge variant="default">Profit Securing</Badge>
                          )}
                          {creationResult.milestone_tracking_enabled && (
                            <Badge variant="default">Milestone Tracking</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <AlertCircle className="h-16 w-16 text-red-600 mx-auto" />
                      <h3 className="text-lg font-semibold">Creation Failed</h3>
                      <p className="text-muted-foreground">{creationResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onCancel : prevStep}
              disabled={isCreating}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={isCreating || (currentStep === 0 && !config.name)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              !creationResult && (
                <Button
                  onClick={createAgent}
                  disabled={isCreating || !config.name}
                >
                  {isCreating ? 'Creating...' : 'Create Agent'}
                  <Bot className="h-4 w-4 ml-2" />
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}