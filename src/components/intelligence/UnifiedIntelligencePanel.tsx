'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Zap, 
  Brain, 
  Globe, 
  Target, 
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react'
import { unifiedIntelligenceService } from '@/lib/services/unified-intelligence-service'

interface UnifiedIntelligencePanelProps {
  refreshInterval?: number
}

export function UnifiedIntelligencePanel({ refreshInterval = 30000 }: UnifiedIntelligencePanelProps) {
  const [prompt, setPrompt] = useState('')
  const [taskType, setTaskType] = useState('market_analysis')
  const [symbols, setSymbols] = useState<string[]>(['BTC', 'ETH'])
  const [timeframe, setTimeframe] = useState('day')
  const [useWebSearch, setUseWebSearch] = useState(true)
  const [useLLMAnalysis, setUseLLMAnalysis] = useState(true)
  const [costPriority, setCostPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [qualityPriority, setQualityPriority] = useState<'low' | 'medium' | 'high'>('high')
  const [maxCost, setMaxCost] = useState(1.0)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<any>({})
  const [usageStats, setUsageStats] = useState<any>({})
  const [recentTasks, setRecentTasks] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
    
    const interval = setInterval(loadDashboardData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const loadDashboardData = async () => {
    try {
      const [health, usage] = await Promise.all([
        unifiedIntelligenceService.getHealthStatus(),
        unifiedIntelligenceService.getUsageStatistics()
      ])
      
      setHealthStatus(health)
      setUsageStats(usage)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim()) return
    
    setIsProcessing(true)
    setResult(null)
    
    try {
      const response = await unifiedIntelligenceService.processRequest({
        task: taskType,
        prompt: prompt,
        context: {
          symbols: symbols,
          timeframe: timeframe
        },
        preferences: {
          use_web_search: useWebSearch,
          use_llm_analysis: useLLMAnalysis,
          cost_priority: costPriority,
          quality_priority: qualityPriority,
          max_cost: maxCost
        }
      })
      
      setResult(response)
      
      // Update recent tasks
      setRecentTasks(prev => [
        { prompt: prompt.substring(0, 50) + '...', result: response, timestamp: new Date() },
        ...prev.slice(0, 4)
      ])
      
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSymbolToggle = (symbol: string) => {
    setSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    )
  }

  const getTaskTypeColor = (type: string) => {
    const colors = {
      'market_analysis': 'bg-blue-100 text-blue-800',
      'news_analysis': 'bg-green-100 text-green-800',
      'sentiment_analysis': 'bg-purple-100 text-purple-800',
      'research': 'bg-orange-100 text-orange-800',
      'strategy_generation': 'bg-red-100 text-red-800',
      'risk_assessment': 'bg-yellow-100 text-yellow-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Zap className="w-6 h-6 mr-2 text-purple-600" />
            Unified Intelligence Panel
          </h2>
          <p className="text-gray-600">Combined AI and web intelligence for trading decisions</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Overall Health</span>
              <div className="flex items-center gap-2">
                {healthStatus.healthy ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">{healthStatus.healthy ? 'Healthy' : 'Degraded'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">OpenRouter</span>
              <div className="flex items-center gap-2">
                {healthStatus.services?.openrouter ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">{healthStatus.services?.openrouter ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">SerpAPI</span>
              <div className="flex items-center gap-2">
                {healthStatus.services?.serpapi ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">{healthStatus.services?.serpapi ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Total Tasks</span>
              </div>
              <p className="text-2xl font-bold">{usageStats.total_tasks || 0}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Success Rate</span>
              </div>
              <p className="text-2xl font-bold">
                {usageStats.total_tasks ? Math.round((usageStats.successful_tasks / usageStats.total_tasks) * 100) : 0}%
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600">Avg Cost</span>
              </div>
              <p className="text-2xl font-bold">${(usageStats.average_cost || 0).toFixed(3)}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">Avg Time</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(usageStats.average_processing_time || 0)}ms</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intelligence Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Intelligence Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Type and Symbols */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="market_analysis">Market Analysis</option>
                  <option value="news_analysis">News Analysis</option>
                  <option value="sentiment_analysis">Sentiment Analysis</option>
                  <option value="research">Research</option>
                  <option value="strategy_generation">Strategy Generation</option>
                  <option value="risk_assessment">Risk Assessment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Symbols</label>
                <div className="flex flex-wrap gap-1">
                  {['BTC', 'ETH', 'SPY', 'AAPL', 'TSLA', 'GOOGL', 'NVDA', 'MSFT'].map(symbol => (
                    <Badge
                      key={symbol}
                      variant={symbols.includes(symbol) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => handleSymbolToggle(symbol)}
                    >
                      {symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your trading intelligence request..."
                className="min-h-[100px]"
              />
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Cost Priority</label>
                <select
                  value={costPriority}
                  onChange={(e) => setCostPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="low">Low (Premium)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Efficient)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Quality Priority</label>
                <select
                  value={qualityPriority}
                  onChange={(e) => setQualityPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Max Cost ($)</label>
                <Input
                  type="number"
                  value={maxCost}
                  onChange={(e) => setMaxCost(parseFloat(e.target.value) || 1.0)}
                  step="0.01"
                  min="0.01"
                  max="10.00"
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                />
                <Globe className="w-4 h-4" />
                <span className="text-sm">Use Web Search</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useLLMAnalysis}
                  onChange={(e) => setUseLLMAnalysis(e.target.checked)}
                />
                <Brain className="w-4 h-4" />
                <span className="text-sm">Use LLM Analysis</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isProcessing || !prompt.trim()}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Intelligence
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Processing Time</p>
                    <p className="font-medium">{result.metadata?.processing_time || 0}ms</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="font-medium">${(result.metadata?.total_cost || 0).toFixed(4)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="font-medium">{Math.round((result.data?.confidence || 0) * 100)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Sources</p>
                    <p className="font-medium">{result.data?.sources?.length || 0}</p>
                  </div>
                </div>

                {/* Analysis */}
                {result.data?.analysis && (
                  <div>
                    <h4 className="font-medium mb-2">Analysis</h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{result.data.analysis}</p>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.data?.recommendations && result.data.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {result.data.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Web Results */}
                {result.data?.web_results && result.data.web_results.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Web Sources</h4>
                    <div className="space-y-2">
                      {result.data.web_results.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h5 className="font-medium text-sm mb-1">{item.title}</h5>
                          <p className="text-xs text-gray-600 mb-1">{item.snippet}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.source}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 font-medium">Processing Failed</p>
                <p className="text-sm text-gray-600">{result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Tasks */}
      {recentTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs ${getTaskTypeColor(taskType)}`}>
                      {taskType.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm">{task.prompt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-xs text-gray-500">{formatTimeAgo(task.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}