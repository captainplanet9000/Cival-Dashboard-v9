'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Brain, 
  Database, 
  AlertTriangle, 
  Activity,
  BarChart3,
  Zap,
  Target,
  Clock,
  Cpu,
  LineChart,
  PieChart
} from 'lucide-react'

interface MLModel {
  name: string
  type: 'regression' | 'classification' | 'clustering' | 'reinforcement'
  accuracy: number
  training: boolean
  lastUpdated: string
  predictions: number
  status: 'active' | 'training' | 'error' | 'disabled'
}

interface AnalyticsMetric {
  name: string
  value: number
  trend: 'up' | 'down' | 'stable'
  change: number
  unit: string
}

export function AdvancedAnalytics() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const mlModels: MLModel[] = [
    {
      name: 'Price Prediction LSTM',
      type: 'regression',
      accuracy: 0.847,
      training: false,
      lastUpdated: '2 hours ago',
      predictions: 12543,
      status: 'active'
    },
    {
      name: 'Sentiment Analysis',
      type: 'classification',
      accuracy: 0.923,
      training: false,
      lastUpdated: '1 hour ago',
      predictions: 8932,
      status: 'active'
    },
    {
      name: 'Risk Clustering',
      type: 'clustering',
      accuracy: 0.756,
      training: true,
      lastUpdated: '5 minutes ago',
      predictions: 2341,
      status: 'training'
    },
    {
      name: 'Q-Learning Agent',
      type: 'reinforcement',
      accuracy: 0.672,
      training: false,
      lastUpdated: '3 hours ago',
      predictions: 15678,
      status: 'active'
    }
  ]

  const analyticsMetrics: AnalyticsMetric[] = [
    {
      name: 'Prediction Accuracy',
      value: 84.7,
      trend: 'up',
      change: 2.3,
      unit: '%'
    },
    {
      name: 'Model Latency',
      value: 23.5,
      trend: 'down',
      change: -1.2,
      unit: 'ms'
    },
    {
      name: 'Training Efficiency',
      value: 92.1,
      trend: 'up',
      change: 4.8,
      unit: '%'
    },
    {
      name: 'Data Processing Rate',
      value: 15674,
      trend: 'stable',
      change: 0.1,
      unit: 'records/sec'
    }
  ]

  const performanceData = [
    { model: 'LSTM', accuracy: 84.7, latency: 23.5, throughput: 1200 },
    { model: 'Random Forest', accuracy: 78.2, latency: 8.3, throughput: 3400 },
    { model: 'SVM', accuracy: 81.9, latency: 45.2, throughput: 890 },
    { model: 'Neural Network', accuracy: 89.1, latency: 67.8, throughput: 650 }
  ]

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsAnalyzing(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'training': return 'bg-blue-500'
      case 'error': return 'bg-red-500'
      case 'disabled': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
      case 'stable': return <Activity className="h-3 w-3 text-blue-500" />
      default: return <Activity className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Advanced Analytics:</strong> Machine learning models require significant computational resources
          and may affect system performance. Monitor resource usage closely.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">ML Models</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        {/* ML Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4">
            {mlModels.map((model, index) => (
              <Card key={index} className={`transition-all ${selectedModel === model.name ? 'border-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {model.type}
                          </Badge>
                          <div className={`w-2 h-2 rounded-full ${getModelStatusColor(model.status)}`} />
                          <span className="text-xs text-muted-foreground capitalize">
                            {model.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={selectedModel === model.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedModel(selectedModel === model.name ? null : model.name)}
                    >
                      {selectedModel === model.name ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(model.accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {model.predictions.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Predictions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{model.lastUpdated}</div>
                      <div className="text-xs text-muted-foreground">Last Updated</div>
                    </div>
                  </div>
                  
                  {model.training && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Training Progress</span>
                        <span>67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyticsMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {metric.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {metric.value.toLocaleString()} {metric.unit}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {getTrendIcon(metric.trend)}
                      <span className={`${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-blue-600'}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Model Performance Comparison
              </CardTitle>
              <CardDescription>
                Compare accuracy, latency, and throughput across different models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((model, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{model.model}</h4>
                      <Badge variant="outline">{model.accuracy}% accuracy</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Latency</div>
                        <div className="font-medium">{model.latency}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Throughput</div>
                        <div className="font-medium">{model.throughput}/sec</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Efficiency</div>
                        <div className="font-medium">{(model.accuracy / model.latency * 100).toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Model Training Control
              </CardTitle>
              <CardDescription>
                Train and optimize machine learning models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Training Status</span>
                  <Badge variant={isAnalyzing ? 'default' : 'secondary'}>
                    {isAnalyzing ? 'Running' : 'Stopped'}
                  </Badge>
                </div>
                
                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Training Sessions</div>
                  <div className="text-2xl font-bold text-blue-600">47</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Total Epochs</div>
                  <div className="text-2xl font-bold">12,847</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {isAnalyzing ? 'Training...' : 'Start Training'}
                </Button>
                <Button variant="outline" disabled>
                  <Target className="h-4 w-4 mr-2" />
                  Optimize
                </Button>
                <Button variant="outline" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}