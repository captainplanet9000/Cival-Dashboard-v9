/**
 * Universal Trading Mode Panel
 * Provides system-wide trading mode control and component synchronization status
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Shield,
  RefreshCw,
  Play,
  Pause,
  Zap,
  Activity
} from 'lucide-react'
import { useUniversalTradingMode, useComponentRegistration } from '@/lib/hooks/useUniversalTradingMode'
import { toast } from 'react-hot-toast'

interface TradingModeConfig {
  enabledExchanges: string[]
  riskLimits: Record<string, number>
  positionLimits: Record<string, number>
  safetyChecks: boolean
  notifications: boolean
  paperBalance: number
}

export default function UniversalTradingModePanel() {
  // Register this component for mode coordination
  useComponentRegistration('trading_mode_panel', 'dashboard')
  
  const {
    currentMode,
    config,
    modeStatus,
    loading,
    error,
    setTradingMode,
    toggleTradingMode,
    refreshStatus,
    isLiveMode,
    isPaperMode,
    allComponentsSynced,
    hasErrors
  } = useUniversalTradingMode()

  const [isToggling, setIsToggling] = useState(false)

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [refreshStatus])

  const handleToggleMode = async () => {
    setIsToggling(true)
    try {
      const success = await toggleTradingMode()
      if (!success) {
        toast.error('Failed to toggle trading mode')
      }
    } finally {
      setIsToggling(false)
    }
  }

  const handleSetMode = async (mode: 'paper' | 'live' | 'simulation') => {
    setIsToggling(true)
    try {
      const success = await setTradingMode(mode)
      if (!success) {
        toast.error(`Failed to set ${mode} mode`)
      }
    } finally {
      setIsToggling(false)
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'live':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'paper':
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      case 'simulation':
        return <Activity className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'live':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'paper':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'simulation':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getComponentStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'updating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading trading mode...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Mode Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getModeIcon(currentMode)}
                Universal Trading Mode
              </CardTitle>
              <CardDescription>
                System-wide trading mode coordination
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={`${getModeColor(currentMode)} font-medium`}
            >
              {currentMode.toUpperCase()} MODE
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quick Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLiveMode ? 'bg-green-100' : 'bg-blue-100'}`}>
                {isLiveMode ? (
                  <Zap className="h-5 w-5 text-green-600" />
                ) : (
                  <Play className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium">
                  {isLiveMode ? 'Live Trading Active' : 'Paper Trading Active'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isLiveMode 
                    ? 'Trading with real funds and live market data'
                    : 'Safe trading simulation with virtual funds'
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={handleToggleMode}
              disabled={isToggling}
              variant={isLiveMode ? "destructive" : "default"}
              size="sm"
            >
              {isToggling ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                getModeIcon(isLiveMode ? 'paper' : 'live')
              )}
              Switch to {isLiveMode ? 'Paper' : 'Live'}
            </Button>
          </div>

          {/* Mode Selection Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={isPaperMode ? "default" : "outline"}
              onClick={() => handleSetMode('paper')}
              disabled={isToggling}
              className="flex flex-col h-auto py-3"
            >
              <TrendingDown className="h-4 w-4 mb-1" />
              <span className="text-xs">Paper</span>
            </Button>
            <Button
              variant={currentMode === 'simulation' ? "default" : "outline"}
              onClick={() => handleSetMode('simulation')}
              disabled={isToggling}
              className="flex flex-col h-auto py-3"
            >
              <Activity className="h-4 w-4 mb-1" />
              <span className="text-xs">Simulation</span>
            </Button>
            <Button
              variant={isLiveMode ? "default" : "outline"}
              onClick={() => handleSetMode('live')}
              disabled={isToggling}
              className="flex flex-col h-auto py-3"
            >
              <TrendingUp className="h-4 w-4 mb-1" />
              <span className="text-xs">Live</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Status */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Component Status</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Component Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Component Synchronization</CardTitle>
                <Button variant="outline" size="sm" onClick={refreshStatus}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Status of all components registered for mode coordination
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modeStatus ? (
                <div className="space-y-4">
                  {/* Sync Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Synchronization Progress</span>
                      <span>{modeStatus.syncedComponents}/{modeStatus.totalComponents} synced</span>
                    </div>
                    <Progress 
                      value={(modeStatus.syncedComponents / Math.max(modeStatus.totalComponents, 1)) * 100}
                      className="h-2"
                    />
                  </div>

                  {/* Status Summary */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {modeStatus.syncedComponents}
                      </div>
                      <div className="text-sm text-gray-500">Synced</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {modeStatus.errorComponents}
                      </div>
                      <div className="text-sm text-gray-500">Errors</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {modeStatus.modeChangesToday}
                      </div>
                      <div className="text-sm text-gray-500">Changes Today</div>
                    </div>
                  </div>

                  {/* Component List */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Component Details</h4>
                    {Object.entries(modeStatus.components).map(([componentId, component]) => (
                      <div
                        key={componentId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getComponentStatusIcon(component.status)}
                          <div>
                            <div className="font-medium">{componentId}</div>
                            <div className="text-sm text-gray-500">{component.componentType}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline"
                            className={getModeColor(component.currentMode)}
                          >
                            {component.currentMode}
                          </Badge>
                          {component.errorMessage && (
                            <div className="text-xs text-red-500 mt-1">
                              {component.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No status information available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Trading Mode Configuration
              </CardTitle>
              <CardDescription>
                Current settings and risk parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config ? (
                <div className="space-y-6">
                  {/* Safety Settings */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Safety Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Safety Checks</span>
                        <Badge variant={config.safetyChecks ? "default" : "destructive"}>
                          {config.safetyChecks ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Real Funds</span>
                        <Badge variant={config.realFunds ? "destructive" : "default"}>
                          {config.realFunds ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Live Data</span>
                        <Badge variant={config.liveData ? "default" : "secondary"}>
                          {config.liveData ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Notifications</span>
                        <Badge variant={config.notifications ? "default" : "secondary"}>
                          {config.notifications ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Risk Limits */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Risk Limits</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(config.riskLimits).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 border rounded">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-mono">{(value * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Position Limits */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Position Limits</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(config.positionLimits).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 border rounded">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-mono">
                            {key === 'maxLeverage' ? `${value}x` : `${(value * 100).toFixed(1)}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exchanges */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Enabled Exchanges</h4>
                    <div className="flex flex-wrap gap-2">
                      {config.enabledExchanges.map((exchange) => (
                        <Badge key={exchange} variant="outline" className="capitalize">
                          {exchange}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Paper Trading Balance */}
                  {isPaperMode && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Paper Trading</h4>
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-gray-500">Virtual Balance</div>
                        <div className="text-2xl font-bold">
                          ${config.paperBalance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No configuration available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mode Statistics</CardTitle>
              <CardDescription>
                Historical mode usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {modeStatus?.modeChangesToday || 0}
                    </div>
                    <div className="text-sm text-gray-500">Mode Changes Today</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {allComponentsSynced ? '100%' : '0%'}
                    </div>
                    <div className="text-sm text-gray-500">Sync Rate</div>
                  </div>
                </div>

                {modeStatus?.lastModeChange && (
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-gray-500">Last Mode Change</div>
                    <div className="font-medium">
                      {new Date(modeStatus.lastModeChange).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}