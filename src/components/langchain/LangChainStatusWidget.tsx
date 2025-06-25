/**
 * LangChain Status Widget
 * Compact widget showing LangChain integration status for dashboard embedding
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Wrench,
  TrendingUp,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
// Services will be lazy loaded to prevent circular dependencies

interface LangChainStatusWidgetProps {
  className?: string
  compact?: boolean
  onViewDetails?: () => void
}

export function LangChainStatusWidget({ 
  className, 
  compact = false,
  onViewDetails 
}: LangChainStatusWidgetProps) {
  const [status, setStatus] = useState<any>({})
  const [mcpStats, setMcpStats] = useState<any>({})
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy')
  const [isLoading, setIsLoading] = useState(true)
  const [services, setServices] = useState<any>(null)

  // Lazy load services to prevent circular dependencies
  useEffect(() => {
    const loadServices = async () => {
      try {
        // Only load on client side
        if (typeof window === 'undefined') {
          return
        }

        setIsLoading(true)
        
        const [
          { langGraphOrchestrator },
          { langChainService },
          { langChainMCPIntegration }
        ] = await Promise.all([
          import('@/lib/langchain/LangGraphOrchestratorClient'),
          import('@/lib/langchain/LangChainService'),
          import('@/lib/langchain/MCPIntegration')
        ])

        setServices({
          langGraphOrchestrator,
          langChainService,
          langChainMCPIntegration
        })

      } catch (error) {
        console.error('Failed to load LangChain services:', error)
        setHealth('degraded')
        // Set fallback services
        setServices({
          langGraphOrchestrator: { 
            getStatus: () => ({ isRunning: false, totalAgents: 0, activeAgents: 0 }),
            getPerformanceAnalytics: () => ({ overall: { totalTrades: 0, totalPnL: 0, winRate: 0 } })
          },
          langChainService: { 
            healthCheck: async () => ({ status: 'unavailable' }) 
          },
          langChainMCPIntegration: { 
            getIntegrationStats: () => ({ connectedClients: 0, toolsRegistered: 0, activeIntegrations: 0 })
          }
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [])

  useEffect(() => {
    if (!services || isLoading) return

    const updateStatus = async () => {
      try {
        // Get orchestrator status with null checks
        const orchestratorStatus = services.langGraphOrchestrator.getStatus() || {
          isRunning: false,
          totalAgents: 0,
          activeAgents: 0,
          performance: { totalTrades: 0, totalPnL: 0, winRate: 0 }
        }
        
        const analytics = services.langGraphOrchestrator.getPerformanceAnalytics() || {
          overall: { totalTrades: 0, totalPnL: 0, winRate: 0 }
        }
        
        // Get LangChain service health with fallback
        let serviceHealth
        try {
          serviceHealth = await services.langChainService.healthCheck()
        } catch (error) {
          serviceHealth = { status: 'unhealthy', errors: ['Service unavailable'] }
        }
        
        // Get MCP integration stats with fallback
        let mcpIntegrationStats
        try {
          mcpIntegrationStats = services.langChainMCPIntegration.getIntegrationStats()
        } catch (error) {
          mcpIntegrationStats = { connectedClients: 0, toolsRegistered: 0, activeIntegrations: 0 }
        }

        setStatus({
          ...orchestratorStatus,
          analytics,
          serviceHealth
        })
        
        setMcpStats(mcpIntegrationStats || {})

        // Determine overall health
        if (serviceHealth?.status === 'healthy' && orchestratorStatus?.isRunning) {
          setHealth('healthy')
        } else if (serviceHealth?.status === 'degraded' || !orchestratorStatus?.isRunning) {
          setHealth('degraded')
        } else {
          setHealth('unhealthy')
        }

      } catch (error) {
        console.error('Failed to update LangChain status:', error)
        setHealth('unhealthy')
        // Set safe fallback state
        setStatus({
          isRunning: false,
          totalAgents: 0,
          activeAgents: 0,
          performance: { totalTrades: 0, totalPnL: 0, winRate: 0 },
          analytics: { overall: { totalTrades: 0, totalPnL: 0, winRate: 0 } },
          serviceHealth: { status: 'unhealthy', errors: ['Component error'] }
        })
        setMcpStats({})
      } finally {
        setIsLoading(false)
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [services, isLoading])

  const getHealthColor = () => {
    switch (health) {
      case 'healthy': return 'text-green-500'
      case 'degraded': return 'text-yellow-500'
      case 'unhealthy': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getHealthIcon = () => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  if (compact) {
    return (
      <Card className={cn('cursor-pointer hover:shadow-md transition-shadow', className)} onClick={onViewDetails}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">LangChain AI</span>
            </div>
            <div className="flex items-center gap-2">
              {getHealthIcon()}
              <Badge variant={health === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                {status.activeAgents || 0} agents
              </Badge>
            </div>
          </div>
          
          {!isLoading && status.totalPnL !== undefined && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className={cn(
                'font-medium',
                status.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                ${status.totalPnL.toFixed(2)}
              </span>
              <span className="text-gray-500">P&L</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" />
            LangChain Integration
          </CardTitle>
          <div className="flex items-center gap-2">
            {getHealthIcon()}
            <Badge variant={health === 'healthy' ? 'default' : 'destructive'}>
              {health}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading status...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{status.totalAgents || 0}</div>
                <div className="text-xs text-gray-500">Total Agents</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{status.activeAgents || 0}</div>
                <div className="text-xs text-gray-500">Active Agents</div>
              </div>
            </div>

            {/* Performance */}
            {status.totalPnL !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Portfolio P&L</span>
                  <span className={cn(
                    'text-sm font-medium',
                    status.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    ${status.totalPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Value</span>
                  <span className="text-sm font-medium">${status.totalValue?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            )}

            {/* MCP Wrenchs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Wrench className="h-3 w-3 text-gray-500" />
                  <span className="text-sm text-gray-600">MCP Wrenchs</span>
                </div>
                <span className="text-sm font-medium">{mcpStats.totalWrenchs || 0}</span>
              </div>
              
              {mcpStats.totalCalls > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Success Rate</span>
                    <span>{((mcpStats.successRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(mcpStats.successRate || 0) * 100} 
                    className="h-1"
                  />
                </div>
              )}
            </div>

            {/* LLM Usage */}
            {status.analytics?.llmUsage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span className="text-sm text-gray-600">LLM Usage</span>
                  </div>
                  <span className="text-sm font-medium">
                    ${status.analytics.llmUsage.totalDailyCost?.toFixed(2) || '0.00'}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500">
                  {status.analytics.llmUsage.availableModels?.length || 0} models available
                </div>
              </div>
            )}

            {/* Action Button */}
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewDetails}
                className="w-full"
              >
                View Details
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default LangChainStatusWidget