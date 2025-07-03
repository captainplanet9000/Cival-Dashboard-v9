'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Bot, TrendingUp, TrendingDown, Target, Clock, 
  DollarSign, BarChart3, AlertTriangle, Play, Pause
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAgentPerformance } from '@/hooks/useAgentTrading'
import type { AgentConfig } from '@/lib/agents/enhanced-agent-trading'

interface AgentPerformanceCardProps {
  agent: AgentConfig
  onToggle?: (agent: AgentConfig) => void
  onEdit?: (agent: AgentConfig) => void
  className?: string
}

export function AgentPerformanceCard({ 
  agent, 
  onToggle, 
  onEdit, 
  className 
}: AgentPerformanceCardProps) {
  const { performance, positions, recentDecisions } = useAgentPerformance(agent.id)

  const openPositions = positions.filter(p => p.unrealizedPnL !== 0)
  const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0)
  const recentSuccessfulDecisions = recentDecisions.filter(d => 
    d.executed && d.executionResult?.status === 'success'
  ).length

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'momentum': return 'bg-blue-500'
      case 'arbitrage': return 'bg-green-500'
      case 'mean_reversion': return 'bg-purple-500'
      case 'scalping': return 'bg-orange-500'
      case 'swing': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className={`relative overflow-hidden ${agent.isActive ? 'ring-2 ring-blue-500/20 bg-blue-50/30' : ''}`}>
        {/* Agent Type Indicator */}
        <div className={`absolute top-0 left-0 w-1 h-full ${getAgentTypeColor(agent.type)}`} />
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${getAgentTypeColor(agent.type)} flex items-center justify-center text-white`}>
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {agent.type.replace('_', ' ')} Strategy
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                {agent.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className={getRiskColor(agent.riskTolerance)}>
                {agent.riskTolerance} risk
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Performance Metrics */}
          {performance && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total P&L</span>
                  <span className={`font-semibold ${performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${performance.totalPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="font-semibold">{performance.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Trades</span>
                  <span className="font-semibold">{performance.totalTrades}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Unrealized P&L</span>
                  <span className={`font-semibold ${totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totalUnrealizedPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max Drawdown</span>
                  <span className="font-semibold text-red-600">{performance.maxDrawdown.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                  <span className="font-semibold">{performance.sharpeRatio.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Win Rate Progress */}
          {performance && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Win Rate Progress</span>
                <span className="text-sm text-muted-foreground">
                  {performance.successfulTrades}/{performance.totalTrades}
                </span>
              </div>
              <Progress value={performance.winRate} className="h-2" />
            </div>
          )}

          {/* Drawdown Warning */}
          {performance && performance.maxDrawdown > agent.settings.maxDrawdown * 0.8 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">
                Approaching max drawdown limit ({agent.settings.maxDrawdown}%)
              </span>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Target className="h-3 w-3" />
                <span className="text-xs">Positions</span>
              </div>
              <p className="text-sm font-semibold">{openPositions.length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Recent</span>
              </div>
              <p className="text-sm font-semibold">{recentSuccessfulDecisions}/10</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                <span className="text-xs">Daily Limit</span>
              </div>
              <p className="text-sm font-semibold">{agent.maxDailyTrades}</p>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
            <div>
              <p className="text-muted-foreground">Stop Loss</p>
              <p className="font-semibold">{agent.settings.stopLoss}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Take Profit</p>
              <p className="font-semibold">{agent.settings.takeProfit}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Position</p>
              <p className="font-semibold">${agent.maxPositionSize}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paper Trading</p>
              <p className="font-semibold">{agent.settings.enablePaperTrading ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Allowed Symbols */}
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Trading Symbols</p>
            <div className="flex flex-wrap gap-1">
              {agent.allowedSymbols.map((symbol) => (
                <Badge key={symbol} variant="outline" className="text-xs">
                  {symbol}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant={agent.isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => onToggle?.(agent)}
              className="flex-1"
            >
              {agent.isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(agent)}
            >
              Edit
            </Button>
          </div>

          {/* Last Update */}
          {performance && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Last updated: {new Date(performance.lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default AgentPerformanceCard