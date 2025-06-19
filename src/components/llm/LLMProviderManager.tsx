'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain,
  Zap,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Settings,
  TrendingUp,
  Gauge
} from 'lucide-react'

interface LLMProvider {
  id: string
  name: string
  model: string
  status: 'active' | 'inactive' | 'error'
  costPerToken: number
  responseTime: number
  successRate: number
  dailyCost: number
  requestsToday: number
  description: string
}

interface LLMProviderManagerProps {
  className?: string
}

export function LLMProviderManager({ className }: LLMProviderManagerProps) {
  const [providers, setProviders] = useState<LLMProvider[]>([
    {
      id: 'gemini_flash',
      name: 'Gemini Flash',
      model: 'gemini-1.5-flash',
      status: 'active',
      costPerToken: 0.0,
      responseTime: 1.2,
      successRate: 0.98,
      dailyCost: 0.0,
      requestsToday: 1247,
      description: 'Free, fast model for routine decisions and tool calling'
    },
    {
      id: 'google_gemini',
      name: 'Gemini Pro',
      model: 'gemini-pro',
      status: 'active',
      costPerToken: 0.0,
      responseTime: 2.8,
      successRate: 0.96,
      dailyCost: 0.0,
      requestsToday: 567,
      description: 'Free advanced model for complex analysis'
    },
    {
      id: 'openrouter_gpt4',
      name: 'OpenRouter GPT-4',
      model: 'openai/gpt-4-turbo-preview',
      status: 'active',
      costPerToken: 0.00003,
      responseTime: 4.2,
      successRate: 0.99,
      dailyCost: 12.45,
      requestsToday: 89,
      description: 'Premium model for complex market analysis'
    },
    {
      id: 'openrouter_claude',
      name: 'OpenRouter Claude',
      model: 'anthropic/claude-3-opus',
      status: 'active',
      costPerToken: 0.000015,
      responseTime: 3.8,
      successRate: 0.97,
      dailyCost: 8.23,
      requestsToday: 45,
      description: 'Excellent for pattern analysis and reasoning'
    },
    {
      id: 'openrouter_llama',
      name: 'OpenRouter Llama',
      model: 'meta-llama/llama-3-70b-instruct',
      status: 'active',
      costPerToken: 0.0000009,
      responseTime: 5.1,
      successRate: 0.94,
      dailyCost: 2.15,
      requestsToday: 234,
      description: 'Cost-effective open-source model'
    }
  ])

  const [costOptimization, setCostOptimization] = useState(true)
  const [dailyBudget, setDailyBudget] = useState(50.0)
  const [selectedProvider, setSelectedProvider] = useState('gemini_flash')

  const totalDailyCost = providers.reduce((sum, p) => sum + p.dailyCost, 0)
  const totalRequests = providers.reduce((sum, p) => sum + p.requestsToday, 0)
  const averageResponseTime = providers.reduce((sum, p) => sum + p.responseTime, 0) / providers.length
  const averageSuccessRate = providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive': return <Clock className="h-4 w-4 text-gray-500" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getPerformanceColor = (value: number, type: 'cost' | 'speed' | 'success') => {
    switch (type) {
      case 'cost':
        return value === 0 ? 'text-green-500' : value < 0.01 ? 'text-yellow-500' : 'text-red-500'
      case 'speed':
        return value < 2 ? 'text-green-500' : value < 4 ? 'text-yellow-500' : 'text-red-500'
      case 'success':
        return value > 0.95 ? 'text-green-500' : value > 0.9 ? 'text-yellow-500' : 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Daily Cost</p>
                    <p className="text-2xl font-bold">${totalDailyCost.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={(totalDailyCost / dailyBudget) * 100} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalDailyCost / dailyBudget) * 100).toFixed(1)}% of ${dailyBudget} budget
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Across {providers.filter(p => p.status === 'active').length} active providers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{averageResponseTime.toFixed(1)}s</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {averageResponseTime < 3 ? 'Excellent' : averageResponseTime < 5 ? 'Good' : 'Needs improvement'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{(averageSuccessRate * 100).toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {averageSuccessRate > 0.95 ? 'Excellent' : 'Good'} reliability
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cost Optimization Alert */}
          {totalDailyCost > dailyBudget * 0.8 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Daily cost is approaching budget limit. Consider enabling cost optimization or increasing budget.
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Provider Status */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Status</CardTitle>
              <CardDescription>Real-time status of all LLM providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => (
                  <div key={provider.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(provider.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{provider.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{provider.model}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getPerformanceColor(provider.dailyCost, 'cost')}`}>
                        ${provider.dailyCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {provider.requestsToday} req
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(provider.status)}
                        {provider.name}
                      </CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                    <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                      {provider.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Model</p>
                      <p className="text-sm font-bold">{provider.model}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cost/Token</p>
                      <p className={`text-sm font-bold ${getPerformanceColor(provider.costPerToken, 'cost')}`}>
                        {provider.costPerToken === 0 ? 'FREE' : `$${provider.costPerToken.toFixed(6)}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                      <p className={`text-sm font-bold ${getPerformanceColor(provider.responseTime, 'speed')}`}>
                        {provider.responseTime}s
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <p className={`text-sm font-bold ${getPerformanceColor(provider.successRate, 'success')}`}>
                        {(provider.successRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Daily Cost</p>
                      <p className={`text-sm font-bold ${getPerformanceColor(provider.dailyCost, 'cost')}`}>
                        ${provider.dailyCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {provider.requestsToday} requests today
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Switch 
                        checked={provider.status === 'active'}
                        onCheckedChange={(checked) => {
                          setProviders(providers.map(p => 
                            p.id === provider.id 
                              ? { ...p, status: checked ? 'active' : 'inactive' }
                              : p
                          ))
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Settings</CardTitle>
              <CardDescription>Configure automatic cost optimization and routing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Cost Optimization</p>
                  <p className="text-sm text-muted-foreground">Automatically route to cost-effective providers</p>
                </div>
                <Switch 
                  checked={costOptimization}
                  onCheckedChange={setCostOptimization}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Daily Budget: ${dailyBudget}</label>
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$10</span>
                  <span>$200</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Default Provider for Routine Tasks</label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.filter(p => p.status === 'active').map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name} - {provider.costPerToken === 0 ? 'FREE' : `$${provider.costPerToken.toFixed(6)}/token`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Current Optimization Strategy</h4>
                <ul className="text-sm space-y-1">
                  <li>• Routine decisions → Gemini Flash (FREE)</li>
                  <li>• Tool calling → Gemini Flash (FREE)</li>
                  <li>• Complex analysis → GPT-4 (Premium)</li>
                  <li>• Pattern recognition → Claude (Premium)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Usage analytics chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {providers.filter(p => p.dailyCost > 0).map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between">
                      <span className="text-sm">{provider.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(provider.dailyCost / totalDailyCost) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">${provider.dailyCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LLMProviderManager