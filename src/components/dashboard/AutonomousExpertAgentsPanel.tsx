'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Bot, Brain, Zap, Shield, Wallet, Database, TrendingUp, 
  Activity, BarChart3, Play, Settings, Plus, ChevronRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { enhancedAgentCreationService } from '@/lib/agents/enhanced-agent-creation-service'
import { useSharedRealtimeData } from '@/lib/realtime/shared-data-manager'

interface ExpertStrategy {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  performance: {
    winRate: number
    avgReturn: number
    sharpeRatio: number
    maxDrawdown: number
  }
  config: {
    timeframe: string
    riskLevel: string
    indicators: string[]
  }
  color: string
}

export function AutonomousExpertAgentsPanel() {
  const { agents } = useSharedRealtimeData()
  const [deployingAgent, setDeployingAgent] = useState<string | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState({
    memory: true,
    learning: true,
    vault: true,
    wallet: true,
    mcpTools: true
  })

  const expertStrategies: ExpertStrategy[] = [
    {
      id: 'darvas_box',
      name: 'Darvas Box Master',
      description: 'Box breakout pattern trading with momentum confirmation',
      icon: <BarChart3 className="h-5 w-5" />,
      performance: {
        winRate: 92,
        avgReturn: 2.4,
        sharpeRatio: 1.8,
        maxDrawdown: 8
      },
      config: {
        timeframe: '4H',
        riskLevel: 'Medium',
        indicators: ['Volume', 'ATR', 'Price Action']
      },
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'williams_alligator',
      name: 'Williams Alligator Pro',
      description: 'Trend following using alligator lines and fractals',
      icon: <TrendingUp className="h-5 w-5" />,
      performance: {
        winRate: 87,
        avgReturn: 1.9,
        sharpeRatio: 1.5,
        maxDrawdown: 12
      },
      config: {
        timeframe: '1D',
        riskLevel: 'Low',
        indicators: ['Alligator Lines', 'Fractals', 'Awesome Oscillator']
      },
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'renko_breakout',
      name: 'Renko Breakout Expert',
      description: 'Price brick patterns for clean trend identification',
      icon: <Activity className="h-5 w-5" />,
      performance: {
        winRate: 94,
        avgReturn: 3.1,
        sharpeRatio: 2.1,
        maxDrawdown: 6
      },
      config: {
        timeframe: 'Renko',
        riskLevel: 'High',
        indicators: ['Renko Bricks', 'ATR', 'Momentum']
      },
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'heikin_ashi',
      name: 'Heikin Ashi Trend',
      description: 'Modified candlesticks for smoother trend analysis',
      icon: <Zap className="h-5 w-5" />,
      performance: {
        winRate: 89,
        avgReturn: 2.2,
        sharpeRatio: 1.7,
        maxDrawdown: 10
      },
      config: {
        timeframe: '1H',
        riskLevel: 'Medium',
        indicators: ['Heikin Ashi', 'EMA', 'MACD']
      },
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'elliott_wave',
      name: 'Elliott Wave Analyst',
      description: 'Advanced wave pattern recognition for market cycles',
      icon: <Brain className="h-5 w-5" />,
      performance: {
        winRate: 91,
        avgReturn: 2.8,
        sharpeRatio: 1.9,
        maxDrawdown: 9
      },
      config: {
        timeframe: '4H',
        riskLevel: 'Advanced',
        indicators: ['Wave Patterns', 'Fibonacci', 'RSI']
      },
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  const deployExpertAgent = async (strategy: ExpertStrategy) => {
    setDeployingAgent(strategy.id)
    
    try {
      const config = {
        name: `${strategy.name} Agent`,
        strategy: strategy.id,
        initialCapital: 25000,
        
        // Autonomous features based on toggles
        autonomousConfig: {
          enabled: true,
          decisionFrequency: strategy.id === 'renko_breakout' ? 5 : 10,
          adaptiveParameters: true,
          learningEnabled: selectedFeatures.learning
        },
        
        // Memory system
        memoryConfig: {
          enabled: selectedFeatures.memory,
          patternRecognition: true,
          experienceStorage: true,
          adaptiveLearning: selectedFeatures.learning
        },
        
        // Wallet integration
        walletConfig: {
          createDedicatedWallet: selectedFeatures.wallet,
          walletType: 'hot' as const,
          vaultIntegration: selectedFeatures.vault,
          backupToVault: selectedFeatures.vault
        },
        
        // Vault security
        vaultConfig: {
          enabled: selectedFeatures.vault,
          encryptionLevel: 'high' as const,
          accessLevel: 'write' as const
        },
        
        // MCP Tools
        mcpConfig: {
          enabled: selectedFeatures.mcpTools,
          toolSuite: 'comprehensive' as const,
          permissionLevel: 'trading' as const
        },
        
        // LLM Integration
        llmConfig: {
          provider: 'gemini',
          model: 'gemini-pro',
          contextWindow: 'strategy_specific',
          decisionReasoning: true
        },
        
        // Paper Trading
        paperTradingConfig: {
          enabled: true,
          initialBalance: 25000,
          realTimeExecution: true
        },
        
        // Strategy-specific parameters
        strategyParameters: {
          timeframe: strategy.config.timeframe,
          riskLevel: strategy.config.riskLevel,
          indicators: strategy.config.indicators,
          targetWinRate: strategy.performance.winRate,
          maxDrawdown: strategy.performance.maxDrawdown / 100
        }
      }

      const agentId = await enhancedAgentCreationService.createAutonomousAgent(config)
      
      if (agentId) {
        toast.success(`${strategy.name} deployed successfully with ID: ${agentId}`)
      } else {
        toast.error(`Failed to deploy ${strategy.name}`)
      }
    } catch (error) {
      console.error('Error deploying expert agent:', error)
      toast.error('Error deploying expert agent')
    } finally {
      setDeployingAgent(null)
    }
  }

  // Check if strategy is already deployed
  const isStrategyDeployed = (strategyId: string) => {
    return agents.some(agent => agent.strategy === strategyId && agent.status === 'active')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold mb-2">Autonomous Expert Trading Agents</h3>
        <p className="text-muted-foreground">
          Deploy pre-configured expert agents with proven technical analysis strategies
        </p>
      </div>

      {/* Feature Toggles Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Autonomous Features Configuration
          </CardTitle>
          <CardDescription>
            Enable or disable features for all deployed agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="global-memory"
                checked={selectedFeatures.memory}
                onCheckedChange={(checked) => setSelectedFeatures(prev => ({ ...prev, memory: checked }))}
              />
              <Label htmlFor="global-memory" className="flex items-center gap-2 cursor-pointer">
                <Database className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">Memory</div>
                  <div className="text-xs text-muted-foreground">Pattern storage</div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="global-learning"
                checked={selectedFeatures.learning}
                onCheckedChange={(checked) => setSelectedFeatures(prev => ({ ...prev, learning: checked }))}
              />
              <Label htmlFor="global-learning" className="flex items-center gap-2 cursor-pointer">
                <Brain className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Learning</div>
                  <div className="text-xs text-muted-foreground">Adaptive AI</div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="global-vault"
                checked={selectedFeatures.vault}
                onCheckedChange={(checked) => setSelectedFeatures(prev => ({ ...prev, vault: checked }))}
              />
              <Label htmlFor="global-vault" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Vault</div>
                  <div className="text-xs text-muted-foreground">Secure backup</div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="global-wallet"
                checked={selectedFeatures.wallet}
                onCheckedChange={(checked) => setSelectedFeatures(prev => ({ ...prev, wallet: checked }))}
              />
              <Label htmlFor="global-wallet" className="flex items-center gap-2 cursor-pointer">
                <Wallet className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="font-medium">Wallet</div>
                  <div className="text-xs text-muted-foreground">Dedicated funds</div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="global-mcp"
                checked={selectedFeatures.mcpTools}
                onCheckedChange={(checked) => setSelectedFeatures(prev => ({ ...prev, mcpTools: checked }))}
              />
              <Label htmlFor="global-mcp" className="flex items-center gap-2 cursor-pointer">
                <Zap className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="font-medium">MCP Tools</div>
                  <div className="text-xs text-muted-foreground">Advanced tools</div>
                </div>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expert Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expertStrategies.map((strategy) => {
          const deployed = isStrategyDeployed(strategy.id)
          const isDeploying = deployingAgent === strategy.id
          
          return (
            <Card 
              key={strategy.id} 
              className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 ${
                deployed ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${strategy.color} opacity-5`} />
              
              <CardHeader className="relative">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${strategy.color} text-white`}>
                    {strategy.icon}
                  </div>
                  {deployed && (
                    <Badge variant="default" className="bg-green-500">
                      Deployed
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{strategy.name}</CardTitle>
                <CardDescription className="text-sm">
                  {strategy.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                    <div className="text-lg font-bold text-green-600">
                      {strategy.performance.winRate}%
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground">Avg Return</div>
                    <div className="text-lg font-bold">
                      {strategy.performance.avgReturn}%
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                    <div className="text-lg font-bold">
                      {strategy.performance.sharpeRatio}
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground">Max Drawdown</div>
                    <div className="text-lg font-bold text-red-600">
                      {strategy.performance.maxDrawdown}%
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Strategy Config */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Timeframe</span>
                    <Badge variant="outline">{strategy.config.timeframe}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Risk Level</span>
                    <Badge variant={
                      strategy.config.riskLevel === 'Low' ? 'secondary' :
                      strategy.config.riskLevel === 'Medium' ? 'default' :
                      strategy.config.riskLevel === 'High' ? 'destructive' :
                      'outline'
                    }>
                      {strategy.config.riskLevel}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Indicators</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {strategy.config.indicators.map((indicator) => (
                        <Badge key={indicator} variant="secondary" className="text-xs">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Deploy Button */}
                <Button
                  className="w-full"
                  variant={deployed ? "secondary" : "default"}
                  disabled={deployed || isDeploying}
                  onClick={() => deployExpertAgent(strategy)}
                >
                  {isDeploying ? (
                    <>
                      <Bot className="mr-2 h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : deployed ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Already Deployed
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Deploy Expert Agent
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Active Agents Summary */}
      {agents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Expert Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.filter(agent => 
                ['darvas_box', 'williams_alligator', 'renko_breakout', 'heikin_ashi', 'elliott_wave'].includes(agent.strategy)
              ).map((agent) => {
                const strategy = expertStrategies.find(s => s.id === agent.strategy)
                return (
                  <div key={agent.agentId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${strategy?.color || 'from-gray-500 to-gray-600'} text-white`}>
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">
                          P&L: <span className={agent.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${agent.totalPnL.toFixed(2)}
                          </span> • Win Rate: {(agent.winRate * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AutonomousExpertAgentsPanel