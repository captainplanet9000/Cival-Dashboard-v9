'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Bot, Play, Pause, Settings, Brain, Activity, Zap, Target, TrendingUp, 
  AlertTriangle, CheckCircle, Clock, BarChart3, Eye, MessageSquare, Users,
  DollarSign, PieChart, Gauge, Shield, Sparkles, Monitor
} from 'lucide-react'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface AgentPerformance {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalReturn: number
  totalReturnPercent: number
  avgTradeReturn: number
  maxDrawdown: number
  sharpeRatio: number
  profitFactor: number
}

interface AgentConfig {
  enabled: boolean
  maxPositions: number
  maxAllocation: number
  riskLevel: 'low' | 'medium' | 'high'
  strategies: string[]
  symbols: string[]
  timeframes: string[]
}

interface TradingAgent {
  id: string
  name: string
  type: 'momentum' | 'arbitrage' | 'mean_reversion' | 'risk_manager' | 'coordinator' | 'scalper' | 'swing'
  status: 'active' | 'inactive' | 'error' | 'paused' | 'initializing' | 'stopping'
  avatar?: string
  description: string
  performance: AgentPerformance
  config: AgentConfig
  currentDecision?: string
  confidence?: number
  lastActivity: number
  allocatedFunds: number
  activePositions: number
  pendingOrders: number
  isListening: boolean
  lastMessage?: string
  conversationCount: number
  healthScore?: number
  riskScore?: number
  paperBalance?: number
}

interface EnhancedAgentCardProps {
  agent: TradingAgent
  onToggle: (agentId: string, enabled: boolean) => Promise<void>
  onViewDetails: (agent: TradingAgent) => void
  onConfigure: (agent: TradingAgent) => void
  onTriggerDecision?: (agentId: string) => Promise<void>
  compact?: boolean
  showAdvancedMetrics?: boolean
}

export function EnhancedAgentCard({ 
  agent, 
  onToggle, 
  onViewDetails, 
  onConfigure, 
  onTriggerDecision,
  compact = false,
  showAdvancedMetrics = true 
}: EnhancedAgentCardProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [isTriggeringDecision, setIsTriggeringDecision] = useState(false)

  const handleToggle = useCallback(async (checked: boolean) => {
    setIsToggling(true)
    try {
      await onToggle(agent.id, checked)
    } finally {
      setIsToggling(false)
    }
  }, [agent.id, onToggle])

  const handleTriggerDecision = useCallback(async () => {
    if (!onTriggerDecision) return
    setIsTriggeringDecision(true)
    try {
      await onTriggerDecision(agent.id)
    } finally {
      setIsTriggeringDecision(false)
    }
  }, [agent.id, onTriggerDecision])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': 
        return { 
          color: 'bg-green-500/10 text-green-700 border-green-200', 
          icon: <CheckCircle className="h-3 w-3" />,
          pulse: true
        }
      case 'paused': 
        return { 
          color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200', 
          icon: <Pause className="h-3 w-3" />,
          pulse: false
        }
      case 'inactive': 
        return { 
          color: 'bg-gray-500/10 text-gray-700 border-gray-200', 
          icon: <Clock className="h-3 w-3" />,
          pulse: false
        }
      case 'error': 
        return { 
          color: 'bg-red-500/10 text-red-700 border-red-200', 
          icon: <AlertTriangle className="h-3 w-3" />,
          pulse: false
        }
      case 'initializing': 
        return { 
          color: 'bg-blue-500/10 text-blue-700 border-blue-200', 
          icon: <Sparkles className="h-3 w-3" />,
          pulse: true
        }
      case 'stopping': 
        return { 
          color: 'bg-orange-500/10 text-orange-700 border-orange-200', 
          icon: <Pause className="h-3 w-3" />,
          pulse: true
        }
      default: 
        return { 
          color: 'bg-gray-500/10 text-gray-700 border-gray-200', 
          icon: <Clock className="h-3 w-3" />,
          pulse: false
        }
    }
  }

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'momentum': 
        return { 
          icon: <TrendingUp className="h-4 w-4" />, 
          color: 'bg-blue-500', 
          label: 'Momentum'
        }
      case 'arbitrage': 
        return { 
          icon: <BarChart3 className="h-4 w-4" />, 
          color: 'bg-purple-500', 
          label: 'Arbitrage'
        }
      case 'mean_reversion': 
        return { 
          icon: <Activity className="h-4 w-4" />, 
          color: 'bg-green-500', 
          label: 'Mean Reversion'
        }
      case 'risk_manager': 
        return { 
          icon: <Shield className="h-4 w-4" />, 
          color: 'bg-red-500', 
          label: 'Risk Manager'
        }
      case 'coordinator': 
        return { 
          icon: <Users className="h-4 w-4" />, 
          color: 'bg-indigo-500', 
          label: 'Coordinator'
        }
      case 'scalper': 
        return { 
          icon: <Zap className="h-4 w-4" />, 
          color: 'bg-yellow-500', 
          label: 'Scalper'
        }
      case 'swing': 
        return { 
          icon: <PieChart className="h-4 w-4" />, 
          color: 'bg-pink-500', 
          label: 'Swing Trader'
        }
      default: 
        return { 
          icon: <Bot className="h-4 w-4" />, 
          color: 'bg-gray-500', 
          label: 'Unknown'
        }
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const statusConfig = getStatusConfig(agent.status)
  const typeConfig = getTypeConfig(agent.type)
  
  const isHealthy = (agent.healthScore || 0.8) > 0.7
  const isRisky = (agent.riskScore || 0.3) > 0.7
  const hasRecentActivity = Date.now() - agent.lastActivity < 300000 // 5 minutes

  if (compact) {
    return (
      <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${typeConfig.color} text-white`}>
                {typeConfig.icon}
              </div>
              <div>
                <h4 className="font-semibold text-sm">{agent.name}</h4>
                <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn(statusConfig.color, "text-xs border")}>
                {statusConfig.icon}
                {agent.status}
              </Badge>
              <Switch
                checked={agent.config.enabled}
                onCheckedChange={handleToggle}
                disabled={isToggling}
                size="sm"
              />
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">P&L: </span>
              <span className={cn("font-medium", agent.performance.totalReturn >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(agent.performance.totalReturn)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Win Rate: </span>
              <span className="font-medium">{formatPercent(agent.performance.winRate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "group hover:shadow-xl transition-all duration-300 border-2 relative overflow-hidden",
      agent.config.enabled ? "hover:border-blue-300 shadow-md" : "hover:border-gray-300",
      isHealthy ? "bg-gradient-to-br from-white to-green-50/30" : "bg-gradient-to-br from-white to-red-50/30"
    )}>
      {/* Status Indicator Strip */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        statusConfig.pulse ? "animate-pulse" : "",
        agent.status === 'active' ? "bg-gradient-to-r from-green-400 to-green-600" :
        agent.status === 'error' ? "bg-gradient-to-r from-red-400 to-red-600" :
        agent.status === 'paused' ? "bg-gradient-to-r from-yellow-400 to-yellow-600" :
        "bg-gradient-to-r from-gray-400 to-gray-600"
      )} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                <AvatarImage src={agent.avatar} alt={agent.name} />
                <AvatarFallback className={`${typeConfig.color} text-white`}>
                  {typeConfig.icon}
                </AvatarFallback>
              </Avatar>
              {/* Activity Indicator */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                hasRecentActivity ? "bg-green-500" : "bg-gray-400",
                agent.isListening && hasRecentActivity ? "animate-pulse" : ""
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-bold truncate">{agent.name}</CardTitle>
                {isRisky && (
                  <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" title="High Risk" />
                )}
              </div>
              <CardDescription className="flex items-center gap-2">
                <span className="capitalize">{typeConfig.label}</span>
                <span className="text-xs">•</span>
                <Badge variant="outline" className={cn("text-xs", getRiskLevelColor(agent.config.riskLevel))}>
                  {agent.config.riskLevel} risk
                </Badge>
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn(statusConfig.color, "text-xs border font-medium")}>
              {statusConfig.icon}
              <span className="ml-1">{agent.status}</span>
            </Badge>
            <Switch
              checked={agent.config.enabled}
              onCheckedChange={handleToggle}
              disabled={isToggling || agent.status === 'initializing' || agent.status === 'stopping'}
              size="sm"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-800">Total P&L</span>
            </div>
            <div className={cn(
              "text-lg font-bold",
              agent.performance.totalReturn >= 0 ? "text-green-700" : "text-red-700"
            )}>
              {formatCurrency(agent.performance.totalReturn)}
            </div>
            <div className="text-xs text-green-600">
              {formatPercent(agent.performance.totalReturnPercent)}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Win Rate</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {formatPercent(agent.performance.winRate)}
            </div>
            <div className="text-xs text-blue-600">
              {agent.performance.winningTrades}W / {agent.performance.losingTrades}L
            </div>
          </div>
        </div>

        {/* Advanced Metrics */}
        {showAdvancedMetrics && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-700">{agent.performance.totalTrades}</div>
              <div className="text-gray-500">Trades</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-700">{agent.performance.sharpeRatio.toFixed(2)}</div>
              <div className="text-gray-500">Sharpe</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-700">{formatPercent(agent.performance.maxDrawdown)}</div>
              <div className="text-gray-500">Drawdown</div>
            </div>
          </div>
        )}

        {/* Current Decision */}
        {agent.currentDecision && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Current Decision</span>
            </div>
            <p className="text-sm text-purple-700 mb-2 line-clamp-2">{agent.currentDecision}</p>
            {agent.confidence && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-600">Confidence:</span>
                <Progress value={agent.confidence * 100} className="h-1.5 flex-1" />
                <span className="text-xs font-medium text-purple-700">
                  {formatPercent(agent.confidence)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Paper Trading Balance */}
        {agent.paperBalance !== undefined && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Paper Balance</span>
              </div>
              <div className="text-sm font-bold text-amber-700">
                {formatCurrency(agent.paperBalance)}
              </div>
            </div>
          </div>
        )}

        {/* Activity & Status */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              agent.isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <span className="text-muted-foreground">
              {agent.isListening ? 'Listening' : 'Silent'}
            </span>
            {hasRecentActivity && (
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatDate(new Date(agent.lastActivity))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(agent)}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConfigure(agent)}
          >
            <Settings className="h-3 w-3" />
          </Button>
          
          {onTriggerDecision && (
            <Button
              size="sm"
              variant="agent"
              onClick={handleTriggerDecision}
              disabled={isTriggeringDecision || !agent.config.enabled}
            >
              {isTriggeringDecision ? (
                <Monitor className="h-3 w-3 animate-spin" />
              ) : (
                <Zap className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default EnhancedAgentCard