'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Zap,
  Shield,
  Gauge,
  Settings,
  Activity,
  DollarSign,
  Target,
  RefreshCw
} from 'lucide-react'

// Types
interface Agent {
  agent_id: string
  name: string
  status: 'active' | 'paused' | 'stopped'
  current_leverage: number
  max_leverage: number
  margin_usage: number
  portfolio_value: number
  daily_pnl: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface LeverageSettings {
  agent_id: string
  leverage_ratio: number
  auto_delever_enabled: boolean
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
}

interface LeverageControlPanelProps {
  agents: Agent[]
  onLeverageChange: (agentId: string, leverage: number) => void
  onAutoDeleverToggle: (agentId: string, enabled: boolean) => void
  onEmergencyDelever: (agentId: string) => void
  onRiskToleranceChange: (agentId: string, tolerance: string) => void
}

export function LeverageControlPanel({
  agents,
  onLeverageChange,
  onAutoDeleverToggle,
  onEmergencyDelever,
  onRiskToleranceChange
}: LeverageControlPanelProps) {
  const [leverageSettings, setLeverageSettings] = useState<Record<string, LeverageSettings>>({})
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({})
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  // Initialize leverage settings for each agent
  useEffect(() => {
    const settings: Record<string, LeverageSettings> = {}
    agents.forEach(agent => {
      settings[agent.agent_id] = {
        agent_id: agent.agent_id,
        leverage_ratio: agent.current_leverage,
        auto_delever_enabled: true,
        risk_tolerance: 'moderate'
      }
    })
    setLeverageSettings(settings)
  }, [agents])

  const handleLeverageChange = useCallback(async (agentId: string, newLeverage: number) => {
    setIsUpdating(prev => ({ ...prev, [agentId]: true }))
    
    try {
      // Update local state immediately for responsive UI
      setLeverageSettings(prev => ({
        ...prev,
        [agentId]: { ...prev[agentId], leverage_ratio: newLeverage }
      }))
      
      // Call parent handler
      await onLeverageChange(agentId, newLeverage)
    } catch (error) {
      console.error(`Failed to update leverage for ${agentId}:`, error)
      // Revert on error
      const agent = agents.find(a => a.agent_id === agentId)
      if (agent) {
        setLeverageSettings(prev => ({
          ...prev,
          [agentId]: { ...prev[agentId], leverage_ratio: agent.current_leverage }
        }))
      }
    } finally {
      setIsUpdating(prev => ({ ...prev, [agentId]: false }))
    }
  }, [agents, onLeverageChange])

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'HIGH': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getMarginColor = (usage: number) => {
    if (usage >= 0.9) return 'bg-red-500'
    if (usage >= 0.7) return 'bg-yellow-500'
    if (usage >= 0.5) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getLeverageColor = (leverage: number) => {
    if (leverage >= 15) return 'text-red-600'
    if (leverage >= 10) return 'text-yellow-600'
    if (leverage >= 5) return 'text-blue-600'
    return 'text-green-600'
  }

  // Portfolio-wide statistics
  const portfolioStats = {
    totalValue: agents.reduce((sum, agent) => sum + agent.portfolio_value, 0),
    totalPnL: agents.reduce((sum, agent) => sum + agent.daily_pnl, 0),
    avgLeverage: agents.length > 0 
      ? agents.reduce((sum, agent) => sum + agent.current_leverage, 0) / agents.length 
      : 0,
    highRiskAgents: agents.filter(agent => agent.risk_level === 'HIGH').length
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gauge className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Portfolio Leverage Overview</CardTitle>
                <CardDescription>Real-time leverage monitoring and control</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                <p className="text-xl font-bold text-gray-900">
                  ${portfolioStats.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <TrendingUp className={`h-8 w-8 ${portfolioStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm font-medium text-gray-600">Daily P&L</p>
                <p className={`text-xl font-bold ${portfolioStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioStats.totalPnL >= 0 ? '+' : ''}${portfolioStats.totalPnL.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Average Leverage</p>
                <p className={`text-xl font-bold ${getLeverageColor(portfolioStats.avgLeverage)}`}>
                  {portfolioStats.avgLeverage.toFixed(1)}x
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <AlertTriangle className={`h-8 w-8 ${portfolioStats.highRiskAgents > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk Agents</p>
                <p className={`text-xl font-bold ${portfolioStats.highRiskAgents > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {portfolioStats.highRiskAgents}
                </p>
              </div>
            </div>
          </div>

          {/* Global Controls */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium">Global Controls:</Label>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => agents.forEach(agent => onEmergencyDelever(agent.agent_id))}
              >
                <Shield className="h-4 w-4 mr-2" />
                Emergency Delever All
              </Button>
            </div>
            <Badge variant={portfolioStats.highRiskAgents > 0 ? "destructive" : "secondary"}>
              {portfolioStats.highRiskAgents > 0 ? "RISK DETECTED" : "ALL SYSTEMS NORMAL"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Individual Agent Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <Card key={agent.agent_id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500' : 
                    agent.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription>Agent ID: {agent.agent_id}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRiskColor(agent.risk_level)}>
                    {agent.risk_level} RISK
                  </Badge>
                  <Badge variant="outline">
                    {agent.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Agent Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${agent.portfolio_value.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Daily P&L</p>
                  <p className={`text-lg font-bold ${agent.daily_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {agent.daily_pnl >= 0 ? '+' : ''}${agent.daily_pnl.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Leverage Control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Leverage: {leverageSettings[agent.agent_id]?.leverage_ratio.toFixed(1) || agent.current_leverage.toFixed(1)}x
                  </Label>
                  <span className={`text-sm font-medium ${getLeverageColor(agent.current_leverage)}`}>
                    Max: {agent.max_leverage}x
                  </span>
                </div>
                
                <Slider
                  value={[leverageSettings[agent.agent_id]?.leverage_ratio || agent.current_leverage]}
                  onValueChange={([value]) => handleLeverageChange(agent.agent_id, value)}
                  max={agent.max_leverage}
                  min={1}
                  step={0.1}
                  className="w-full"
                  disabled={isUpdating[agent.agent_id] || agent.status === 'stopped'}
                />
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1x</span>
                  <span>Conservative (5x)</span>
                  <span>Moderate (10x)</span>
                  <span>Aggressive ({agent.max_leverage}x)</span>
                </div>
              </div>

              {/* Margin Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Margin Usage</Label>
                  <span className="text-sm font-medium">
                    {(agent.margin_usage * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={agent.margin_usage * 100} 
                  className="w-full h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Safe (0-50%)</span>
                  <span>Warning (50-80%)</span>
                  <span>Critical (80%+)</span>
                </div>
              </div>

              {/* Agent Controls */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Auto-Delever</Label>
                  <Switch
                    checked={leverageSettings[agent.agent_id]?.auto_delever_enabled ?? true}
                    onCheckedChange={(checked) => {
                      setLeverageSettings(prev => ({
                        ...prev,
                        [agent.agent_id]: { 
                          ...prev[agent.agent_id], 
                          auto_delever_enabled: checked 
                        }
                      }))
                      onAutoDeleverToggle(agent.agent_id, checked)
                    }}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onEmergencyDelever(agent.agent_id)}
                    disabled={isUpdating[agent.agent_id]}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Emergency Delever
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAgent(
                      selectedAgent === agent.agent_id ? null : agent.agent_id
                    )}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>

              {/* Risk Alerts */}
              {agent.risk_level === 'HIGH' && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    <strong>High Risk Detected:</strong> Consider reducing leverage or deleveraging positions.
                  </AlertDescription>
                </Alert>
              )}

              {agent.margin_usage >= 0.8 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-orange-800">
                    <strong>Margin Warning:</strong> Usage above 80%. Monitor closely for margin calls.
                  </AlertDescription>
                </Alert>
              )}

              {/* Loading Indicator */}
              {isUpdating[agent.agent_id] && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Updating...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Agents Message */}
      {agents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Agents</h3>
            <p className="text-gray-600">
              Create and activate trading agents to start using leverage controls.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}