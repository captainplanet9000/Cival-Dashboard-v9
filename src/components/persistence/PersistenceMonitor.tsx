/**
 * Persistence Monitor Component
 * Real-time monitoring of autonomous persistence system health
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Database,
  Shield,
  Activity,
  HardDrive,
  Cloud,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  Clock,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface PersistenceHealth {
  layer: string
  status: 'healthy' | 'degraded' | 'failed'
  latency: number
  lastCheck: string
  errorCount: number
  errorMessage?: string
}

interface PersistenceMetrics {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageLatency: number
  lastOperation: string
  dataSize: number
  compressionRatio: number
  successRate: string
}

interface PersistenceMonitorData {
  overall: {
    status: string
    healthScore: string
    healthyLayers: number
    totalLayers: number
  }
  layers: Record<string, PersistenceHealth>
  metrics: Record<string, PersistenceMetrics>
  environment: {
    nodeEnv: string
    enabledPersistence: boolean
    enabledAutoBackup: boolean
    backupInterval: string
    healthCheckInterval: string
  }
}

export function PersistenceMonitor({ className }: { className?: string }) {
  const [data, setData] = useState<PersistenceMonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch persistence health data
  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/persistence/health')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setData(result)
        setError(null)
        setLastUpdate(new Date())
      } else {
        throw new Error(result.error || 'Failed to fetch health data')
      }
    } catch (err) {
      console.error('❌ Failed to fetch persistence health:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch health data')
    } finally {
      setLoading(false)
    }
  }

  // Execute persistence action
  const executeAction = async (action: string) => {
    try {
      setActionLoading(action)
      
      const response = await fetch('/api/persistence/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message, {
          icon: action === 'backup' ? '💾' : action === 'restore' ? '📥' : '🔧'
        })
        
        // Refresh health data after action
        setTimeout(() => {
          fetchHealthData()
        }, 1000)
      } else {
        throw new Error(result.error || `${action} failed`)
      }
    } catch (err) {
      console.error(`❌ ${action} failed:`, err)
      toast.error(err instanceof Error ? err.message : `${action} failed`)
    } finally {
      setActionLoading(null)
    }
  }

  // Auto-refresh health data
  useEffect(() => {
    fetchHealthData()
    
    const interval = setInterval(fetchHealthData, 10000) // Update every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLayerIcon = (layer: string) => {
    switch (layer) {
      case 'supabase':
        return <Database className="h-4 w-4" />
      case 'redis':
        return <Zap className="h-4 w-4" />
      case 'localStorage':
        return <HardDrive className="h-4 w-4" />
      case 'sessionStorage':
        return <Clock className="h-4 w-4" />
      case 'memory':
        return <Activity className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Persistence Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Persistence Monitor
            <Badge variant="destructive">Error</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchHealthData}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Persistence Monitor
            <Badge className={getStatusColor(data.overall.status)}>
              {data.overall.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeAction('backup')}
              disabled={actionLoading === 'backup'}
            >
              {actionLoading === 'backup' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Backup
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeAction('restore')}
              disabled={actionLoading === 'restore'}
            >
              {actionLoading === 'restore' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchHealthData}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Health Score</span>
            <span className="font-medium">{data.overall.healthScore}%</span>
          </div>
          <Progress value={parseFloat(data.overall.healthScore)} className="h-2" />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {data.overall.healthyLayers} of {data.overall.totalLayers} layers healthy
            </span>
            {lastUpdate && (
              <span>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Persistence Layers */}
          <div>
            <h4 className="font-medium mb-3">Persistence Layers</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(data.layers).map(([layer, health]) => (
                <motion.div
                  key={layer}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getLayerIcon(layer)}
                      <span className="font-medium text-sm capitalize">{layer}</span>
                    </div>
                    {getStatusIcon(health.status)}
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span>{health.latency}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <span>{health.errorCount}</span>
                    </div>
                    {health.errorMessage && (
                      <div className="text-red-600 text-xs break-words">
                        {health.errorMessage}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h4 className="font-medium mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(data.metrics).map(([layer, metrics]) => (
                <div key={layer} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {getLayerIcon(layer)}
                    <span className="font-medium text-sm capitalize">{layer}</span>
                    <Badge variant="outline" className="text-xs">
                      {metrics.successRate}% success
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <div>Operations: {metrics.totalOperations}</div>
                      <div>Successful: {metrics.successfulOperations}</div>
                    </div>
                    <div>
                      <div>Failed: {metrics.failedOperations}</div>
                      <div>Avg Latency: {metrics.averageLatency.toFixed(1)}ms</div>
                    </div>
                  </div>
                  
                  {metrics.dataSize > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Data: {(metrics.dataSize / 1024).toFixed(1)}KB
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Environment Info */}
          <div>
            <h4 className="font-medium mb-3">Configuration</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Environment:</span>
                <Badge variant="outline" className="ml-2">
                  {data.environment.nodeEnv}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Auto Backup:</span>
                <Badge variant={data.environment.enabledAutoBackup ? "default" : "secondary"} className="ml-2">
                  {data.environment.enabledAutoBackup ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Backup Interval: {parseInt(data.environment.backupInterval) / 1000}s
              </div>
              <div className="text-xs text-muted-foreground">
                Health Check: {parseInt(data.environment.healthCheckInterval) / 1000}s
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PersistenceMonitor