'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Globe, 
  Zap, 
  TrendingUp, 
  BarChart3,
  Settings,
  RefreshCw,
  Activity
} from 'lucide-react'

// Import intelligence components
import { UnifiedIntelligencePanel } from '@/components/intelligence/UnifiedIntelligencePanel'
import { OpenRouterModelDashboard } from '@/components/intelligence/OpenRouterModelDashboard'
import { SerpAPIIntelligenceFeed } from '@/components/intelligence/SerpAPIIntelligenceFeed'

export function ConnectedIntelligenceTab() {
  const [intelligenceSubTab, setIntelligenceSubTab] = useState('unified')

  const intelligenceSubTabs = [
    {
      id: 'unified',
      label: 'Unified Intelligence',
      icon: <Zap className="h-4 w-4" />,
      component: <UnifiedIntelligencePanel />
    },
    {
      id: 'openrouter',
      label: 'OpenRouter Models',
      icon: <Brain className="h-4 w-4" />,
      component: <OpenRouterModelDashboard />
    },
    {
      id: 'serpapi',
      label: 'Web Intelligence',
      icon: <Globe className="h-4 w-4" />,
      component: <SerpAPIIntelligenceFeed />
    },
    {
      id: 'analytics',
      label: 'Intelligence Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      component: <IntelligenceAnalyticsPanel />
    }
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Intelligence Hub
        </CardTitle>
        <CardDescription>
          AI-powered intelligence combining OpenRouter LLMs with SerpAPI web search
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={intelligenceSubTab} onValueChange={setIntelligenceSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-purple-50 gap-2">
            {intelligenceSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 text-xs sm:text-sm p-2 truncate flex items-center gap-2"
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {intelligenceSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Intelligence Analytics Panel Component
function IntelligenceAnalyticsPanel() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const analyticsData = {
    totalRequests: 1247,
    successRate: 98.4,
    averageResponseTime: 850,
    costOptimization: 23.7,
    modelDistribution: {
      'gpt-4': 45,
      'claude-3-sonnet': 32,
      'gpt-3.5-turbo': 23
    },
    searchCategories: {
      'market_analysis': 34,
      'news_analysis': 28,
      'sentiment_analysis': 22,
      'research': 16
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Intelligence Analytics</h3>
          <p className="text-sm text-gray-600">Performance metrics and usage analytics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{analyticsData.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{analyticsData.successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{analyticsData.averageResponseTime}ms</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cost Optimization</p>
                <p className="text-2xl font-bold">{analyticsData.costOptimization}%</p>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 h-5" />
            Model Usage Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analyticsData.modelDistribution).map(([model, percentage]) => (
              <div key={model} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{model}</Badge>
                  <span className="text-sm text-gray-600">{percentage}%</span>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 h-5" />
            Search Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analyticsData.searchCategories).map(([category, percentage]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{category.replace('_', ' ')}</Badge>
                  <span className="text-sm text-gray-600">{percentage}%</span>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 h-5" />
            Recent Intelligence Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: '2 min ago', type: 'Market Analysis', status: 'success', model: 'gpt-4', cost: '$0.024' },
              { time: '5 min ago', type: 'News Analysis', status: 'success', model: 'claude-3-sonnet', cost: '$0.018' },
              { time: '8 min ago', type: 'Sentiment Analysis', status: 'success', model: 'gpt-3.5-turbo', cost: '$0.012' },
              { time: '12 min ago', type: 'Research', status: 'success', model: 'gpt-4', cost: '$0.032' },
              { time: '15 min ago', type: 'Market Analysis', status: 'success', model: 'claude-3-sonnet', cost: '$0.021' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium text-sm">{activity.type}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{activity.model}</Badge>
                  <span className="text-xs text-gray-600">{activity.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ConnectedIntelligenceTab