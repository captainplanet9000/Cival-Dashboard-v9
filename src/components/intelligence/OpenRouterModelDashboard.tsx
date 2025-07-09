'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Cpu, 
  DollarSign, 
  Clock, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Zap,
  AlertCircle
} from 'lucide-react'
import { openRouterService } from '@/lib/services/openrouter-service'

interface ModelMetrics {
  model_id: string
  average_response_time: number
  success_rate: number
  cost_per_request: number
  accuracy_score: number
  last_updated: Date
}

interface OpenRouterModelDashboardProps {
  refreshInterval?: number
}

export function OpenRouterModelDashboard({ refreshInterval = 30000 }: OpenRouterModelDashboardProps) {
  const [models, setModels] = useState<any[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<ModelMetrics[]>([])
  const [rateLimitStatus, setRateLimitStatus] = useState<any>({})
  const [usageStatistics, setUsageStatistics] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [testPrompt, setTestPrompt] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [isTestingModel, setIsTestingModel] = useState(false)

  useEffect(() => {
    loadDashboardData()
    
    const interval = setInterval(loadDashboardData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load all data in parallel
      const [
        availableModels,
        metrics,
        rateLimits,
        usage,
        healthStatus
      ] = await Promise.all([
        openRouterService.getAvailableModels(),
        openRouterService.getPerformanceMetrics(),
        openRouterService.getRateLimitStatus(),
        openRouterService.getUsageStatistics(),
        openRouterService.healthCheck()
      ])

      setModels(availableModels)
      setPerformanceMetrics(metrics)
      setRateLimitStatus(rateLimits)
      setUsageStatistics(usage)
      
      console.log('OpenRouter Dashboard loaded:', {
        models: availableModels.length,
        metrics: metrics.length,
        healthy: healthStatus.healthy
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestModel = async () => {
    if (!selectedModel || !testPrompt) return
    
    setIsTestingModel(true)
    try {
      const response = await openRouterService.request({
        prompt: testPrompt,
        model: selectedModel,
        task_type: 'calculations',
        cost_priority: 'high',
        quality_priority: 'medium'
      })
      
      setTestResult(response)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      })
    } finally {
      setIsTestingModel(false)
    }
  }

  const getModelStatusColor = (model: any) => {
    const metrics = performanceMetrics.find(m => m.model_id === model.id)
    if (!metrics) return 'bg-gray-100 text-gray-800'
    
    if (metrics.success_rate > 0.95) return 'bg-green-100 text-green-800'
    if (metrics.success_rate > 0.9) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getProviderColor = (provider: string) => {
    const colors = {
      'anthropic': 'bg-blue-100 text-blue-800',
      'openai': 'bg-green-100 text-green-800',
      'google': 'bg-purple-100 text-purple-800',
      'meta': 'bg-indigo-100 text-indigo-800',
      'mistral': 'bg-orange-100 text-orange-800'
    }
    return colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Brain className="w-6 h-6 mr-2 text-blue-600" />
            OpenRouter Model Dashboard
          </h2>
          <p className="text-gray-600">Monitor and manage LLM models for trading AI</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => openRouterService.clearCache()}
          >
            <Zap className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Models</p>
                <p className="text-2xl font-bold">{models.length}</p>
              </div>
              <Cpu className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{usageStatistics.total_requests || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">${(usageStatistics.total_cost || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{(usageStatistics.average_response_time || 0).toFixed(0)}ms</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Rate Limit Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Requests per Minute</span>
                <span className="text-sm text-gray-600">
                  {rateLimitStatus.minute?.current || 0} / {rateLimitStatus.minute?.limit || 60}
                </span>
              </div>
              <Progress 
                value={((rateLimitStatus.minute?.current || 0) / (rateLimitStatus.minute?.limit || 60)) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Requests per Hour</span>
                <span className="text-sm text-gray-600">
                  {rateLimitStatus.hour?.current || 0} / {rateLimitStatus.hour?.limit || 1000}
                </span>
              </div>
              <Progress 
                value={((rateLimitStatus.hour?.current || 0) / (rateLimitStatus.hour?.limit || 1000)) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Daily Cost</span>
                <span className="text-sm text-gray-600">
                  ${(rateLimitStatus.daily_cost?.current || 0).toFixed(2)} / ${rateLimitStatus.daily_cost?.limit || 50}
                </span>
              </div>
              <Progress 
                value={((rateLimitStatus.daily_cost?.current || 0) / (rateLimitStatus.daily_cost?.limit || 50)) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Model Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Choose a model...</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Test Prompt</label>
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Enter a test prompt..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={handleTestModel}
                disabled={!selectedModel || !testPrompt || isTestingModel}
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {isTestingModel ? 'Testing...' : 'Test Model'}
              </Button>
              
              {testResult && (
                <Badge 
                  variant={testResult.success ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {testResult.success ? 'Success' : 'Failed'}
                </Badge>
              )}
            </div>
            
            {testResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Test Result</h4>
                {testResult.success ? (
                  <div className="space-y-2">
                    <p className="text-sm">{testResult.data}</p>
                    <div className="text-xs text-gray-600">
                      Model: {testResult.model_used} | 
                      Cost: ${testResult.cost_estimate.toFixed(4)} | 
                      Time: {testResult.response_time}ms
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-600">{testResult.error}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Available Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map((model) => {
              const metrics = performanceMetrics.find(m => m.model_id === model.id)
              
              return (
                <div key={model.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-sm text-gray-600">{model.description}</p>
                      </div>
                      <Badge className={`text-xs ${getProviderColor(model.provider)}`}>
                        {model.provider}
                      </Badge>
                    </div>
                    <Badge className={`text-xs ${getModelStatusColor(model)}`}>
                      {metrics ? `${(metrics.success_rate * 100).toFixed(1)}%` : 'N/A'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Context Length</p>
                      <p className="font-medium">{model.context_length?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Prompt Cost</p>
                      <p className="font-medium">${(model.pricing?.prompt || 0).toFixed(4)}/1K</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Completion Cost</p>
                      <p className="font-medium">${(model.pricing?.completion || 0).toFixed(4)}/1K</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg Response Time</p>
                      <p className="font-medium">{metrics ? `${metrics.average_response_time.toFixed(0)}ms` : 'N/A'}</p>
                    </div>
                  </div>
                  
                  {model.specialized_for && model.specialized_for.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-500 mb-2">Specialized for:</p>
                      <div className="flex flex-wrap gap-1">
                        {model.specialized_for.map((specialty: string) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}