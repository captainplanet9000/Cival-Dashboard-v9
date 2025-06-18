/**
 * Agent Configuration Manager
 * Provides UI for managing persistent agent configurations
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAgentConfig } from '@/hooks/usePersistentState'
import { useAgentMemory } from './AgentMemoryProvider'
import { Loader2, Save, RotateCcw, Brain, Settings, TrendingUp, Shield } from 'lucide-react'

interface AgentConfigManagerProps {
  agentId: string
  onConfigSaved?: (config: any) => void
  className?: string
}

export function AgentConfigManager({ 
  agentId, 
  onConfigSaved,
  className = '' 
}: AgentConfigManagerProps) {
  const { config, isLoading, error, saveConfig, updateConfigField } = useAgentConfig(agentId)
  const { getDecisionHistory, getTradingExperience } = useAgentMemory()
  
  const [localConfig, setLocalConfig] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [decisionCount, setDecisionCount] = useState(0)
  const [experienceCount, setExperienceCount] = useState(0)

  // Initialize local config when config loads
  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    } else {
      // Set default configuration
      setLocalConfig({
        agent_id: agentId,
        name: `Agent ${agentId}`,
        strategy_config: {
          strategy_type: 'momentum',
          timeframe: '1h',
          risk_per_trade: 0.02,
          max_positions: 3,
          entry_conditions: {
            rsi_oversold: 30,
            rsi_overbought: 70,
            volume_threshold: 1.5
          },
          exit_conditions: {
            profit_target: 0.03,
            stop_loss: 0.015,
            trailing_stop: true
          }
        },
        risk_config: {
          max_drawdown: 0.10,
          max_daily_loss: 0.05,
          position_sizing: 'fixed_percentage',
          leverage: 1.0,
          correlation_limit: 0.7
        },
        trading_config: {
          trading_hours: {
            start: '09:00',
            end: '16:00',
            timezone: 'EST'
          },
          allowed_symbols: ['BTC', 'ETH', 'SOL'],
          order_type: 'market',
          slippage_tolerance: 0.001
        },
        is_active: false,
        auto_start: false
      })
    }
  }, [config, agentId])

  // Load memory statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const decisions = await getDecisionHistory(agentId, 1000)
        const experiences = await getTradingExperience(agentId)
        setDecisionCount(decisions.length)
        setExperienceCount(experiences.length)
      } catch (error) {
        console.error('Failed to load memory stats:', error)
      }
    }

    loadStats()
  }, [agentId, getDecisionHistory, getTradingExperience])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      await saveConfig(localConfig)
      setSaveStatus('success')
      if (onConfigSaved) {
        onConfigSaved(localConfig)
      }
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      console.error('Failed to save agent config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (config) {
      setLocalConfig(config)
    }
    setSaveStatus('idle')
  }

  const updateLocalConfig = (path: string, value: any) => {
    const keys = path.split('.')
    const updatedConfig = { ...localConfig }
    let current = updatedConfig

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setLocalConfig(updatedConfig)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading agent configuration...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Agent Configuration
            </CardTitle>
            <CardDescription>
              Configure persistent settings for Agent {agentId}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {decisionCount} decisions
            </Badge>
            <Badge variant="outline">
              {experienceCount} experiences
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saveStatus === 'success' && (
          <Alert className="mb-4">
            <AlertDescription className="text-green-600">
              Configuration saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === 'error' && (
          <Alert className="mb-4">
            <AlertDescription className="text-red-600">
              Failed to save configuration. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="strategy">
              <TrendingUp className="h-4 w-4 mr-1" />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="risk">
              <Shield className="h-4 w-4 mr-1" />
              Risk
            </TabsTrigger>
            <TabsTrigger value="trading">
              <Settings className="h-4 w-4 mr-1" />
              Trading
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={localConfig.name || ''}
                  onChange={(e) => updateLocalConfig('name', e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-id">Agent ID</Label>
                <Input
                  id="agent-id"
                  value={localConfig.agent_id || agentId}
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={localConfig.is_active || false}
                onCheckedChange={(checked) => updateLocalConfig('is_active', checked)}
              />
              <Label htmlFor="is-active">Agent Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-start"
                checked={localConfig.auto_start || false}
                onCheckedChange={(checked) => updateLocalConfig('auto_start', checked)}
              />
              <Label htmlFor="auto-start">Auto-start on deployment</Label>
            </div>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Strategy Type</Label>
                <Select
                  value={localConfig.strategy_config?.strategy_type || 'momentum'}
                  onValueChange={(value) => updateLocalConfig('strategy_config.strategy_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="momentum">Momentum</SelectItem>
                    <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                    <SelectItem value="arbitrage">Arbitrage</SelectItem>
                    <SelectItem value="scalping">Scalping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select
                  value={localConfig.strategy_config?.timeframe || '1h'}
                  onValueChange={(value) => updateLocalConfig('strategy_config.timeframe', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1d">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Risk Per Trade (%)</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  max="0.1"
                  value={localConfig.strategy_config?.risk_per_trade || 0.02}
                  onChange={(e) => updateLocalConfig('strategy_config.risk_per_trade', parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Positions</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={localConfig.strategy_config?.max_positions || 3}
                  onChange={(e) => updateLocalConfig('strategy_config.max_positions', parseInt(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Drawdown (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.5"
                  value={localConfig.risk_config?.max_drawdown || 0.10}
                  onChange={(e) => updateLocalConfig('risk_config.max_drawdown', parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Daily Loss (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.2"
                  value={localConfig.risk_config?.max_daily_loss || 0.05}
                  onChange={(e) => updateLocalConfig('risk_config.max_daily_loss', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position Sizing</Label>
                <Select
                  value={localConfig.risk_config?.position_sizing || 'fixed_percentage'}
                  onValueChange={(value) => updateLocalConfig('risk_config.position_sizing', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_percentage">Fixed Percentage</SelectItem>
                    <SelectItem value="kelly_criterion">Kelly Criterion</SelectItem>
                    <SelectItem value="volatility_adjusted">Volatility Adjusted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Leverage</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={localConfig.risk_config?.leverage || 1.0}
                  onChange={(e) => updateLocalConfig('risk_config.leverage', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trading" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trading Start Time</Label>
                <Input
                  type="time"
                  value={localConfig.trading_config?.trading_hours?.start || '09:00'}
                  onChange={(e) => updateLocalConfig('trading_config.trading_hours.start', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Trading End Time</Label>
                <Input
                  type="time"
                  value={localConfig.trading_config?.trading_hours?.end || '16:00'}
                  onChange={(e) => updateLocalConfig('trading_config.trading_hours.end', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allowed Symbols (comma-separated)</Label>
              <Input
                value={localConfig.trading_config?.allowed_symbols?.join(', ') || 'BTC, ETH, SOL'}
                onChange={(e) => updateLocalConfig('trading_config.allowed_symbols', e.target.value.split(',').map((s: string) => s.trim()))}
                placeholder="BTC, ETH, SOL, ADA"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select
                  value={localConfig.trading_config?.order_type || 'market'}
                  onValueChange={(value) => updateLocalConfig('trading_config.order_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop_limit">Stop Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Slippage Tolerance (%)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="0.01"
                  value={localConfig.trading_config?.slippage_tolerance || 0.001}
                  onChange={(e) => updateLocalConfig('trading_config.slippage_tolerance', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}