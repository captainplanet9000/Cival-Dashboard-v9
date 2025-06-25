/**
 * Simple AI Status Widget
 * Lightweight replacement for LangChain status widget using direct AI service
 * Focuses on core functionality without complex dependencies
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Zap,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { directAIService } from '@/lib/ai/DirectAIService'

interface SimpleAIStatusWidgetProps {
  className?: string
  onViewDetails?: () => void
  compact?: boolean
}

export function SimpleAIStatusWidget({ 
  className, 
  onViewDetails, 
  compact = false 
}: SimpleAIStatusWidgetProps) {
  const [status, setStatus] = useState<{
    health: 'healthy' | 'degraded' | 'unhealthy'
    provider: string
    model: string
    lastChecked: number
  }>({
    health: 'healthy',
    provider: 'openai',
    model: 'gpt-4o-mini',
    lastChecked: Date.now()
  })
  
  const [usage, setUsage] = useState({
    totalCalls: 0,
    totalTokens: 0,
    dailyCost: 0
  })
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateStatus = async () => {
      try {
        setIsLoading(true)
        
        // Get health status
        const healthStatus = await directAIService.healthCheck()
        setStatus(healthStatus)
        
        // Get usage stats
        const usageStats = directAIService.getUsageStats()
        setUsage(usageStats)

      } catch (error) {
        console.error('Failed to update AI status:', error)
        setStatus(prev => ({ ...prev, health: 'unhealthy' }))
      } finally {
        setIsLoading(false)
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const getHealthColor = () => {
    switch (status.health) {
      case 'healthy': return 'text-green-500'
      case 'degraded': return 'text-yellow-500'
      case 'unhealthy': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getHealthIcon = () => {
    switch (status.health) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  if (compact) {
    return (
      <Card className={cn('cursor-pointer hover:shadow-md transition-shadow', className)} onClick={onViewDetails}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span className="font-medium">AI Engine</span>
            </div>
            <div className="flex items-center gap-2">
              {getHealthIcon()}
              <Badge variant={status.health === 'healthy' ? 'default' : 'secondary'}>
                {status.health}
              </Badge>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {status.provider} • {status.model}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          AI Trading Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="animate-pulse h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : (
          <>
            {/* Status Overview */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getHealthIcon()}
                <span className="font-medium">System Status</span>
              </div>
              <Badge 
                variant={status.health === 'healthy' ? 'default' : 'secondary'}
                className={status.health === 'healthy' ? 'bg-green-500' : ''}
              >
                {status.health.toUpperCase()}
              </Badge>
            </div>

            {/* Provider Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Provider</div>
                <div className="font-medium">{status.provider}</div>
              </div>
              <div>
                <div className="text-gray-600">Model</div>
                <div className="font-medium">{status.model}</div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Usage Today</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{usage.totalCalls}</div>
                  <div className="text-gray-500">API Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{usage.totalTokens.toLocaleString()}</div>
                  <div className="text-gray-500">Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">${usage.dailyCost.toFixed(2)}</div>
                  <div className="text-gray-500">Cost</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewDetails?.()}
                className="flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                Test AI
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/api/ai/health', '_blank')}
                className="flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Analytics
              </Button>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center">
              Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SimpleAIStatusWidget