'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Brain, Cpu, Zap, Activity, TrendingUp, TrendingDown, 
  Settings, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Star, Award, Target, BarChart3, PieChart, Users, Shield,
  Play, Pause, StopCircle, Eye, Download, Upload, ArrowRight,
  MessageSquare, Layers, GitBranch, Gauge, Timer, Sparkles,
  DollarSign, Percent, ThumbsUp, ThumbsDown, LineChart
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter, ScatterChart, PieChart as RechartsPieChart, Cell
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * AI Model Performance Comparison Dashboard
 * Comprehensive analysis and comparison of AI model performance
 * Features model benchmarking, cost analysis, and optimization recommendations
 */

interface ModelPerformance {
  id: string
  modelName: string
  provider: string
  version: string
  benchmarkScore: number
  accuracyScore: number
  responseTime: number
  costPerToken: number
  throughput: number
  memoryUsage: number
  energyEfficiency: number
  reliability: number
  creativeScore: number
  logicalScore: number
  mathematicalScore: number
  languageScore: number
  codeScore: number
  tasksCompleted: number
  successRate: number
  totalCost: number
  totalTokens: number
  uptime: number
  errorRate: number
  lastTested: Date
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

interface ComparisonMetrics {
  performance: number
  cost: number
  reliability: number
  efficiency: number
  versatility: number
  overallScore: number
  rank: number
}

interface BenchmarkTest {
  id: string
  name: string
  description: string
  category: 'reasoning' | 'creativity' | 'math' | 'language' | 'code' | 'trading'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  maxScore: number
  timeLimit: number
  weight: number
}

const BENCHMARK_TESTS: BenchmarkTest[] = [
  {
    id: 'logical-reasoning',
    name: 'Logical Reasoning',
    description: 'Complex logical deduction and pattern recognition',
    category: 'reasoning',
    difficulty: 'hard',
    maxScore: 100,
    timeLimit: 60,
    weight: 0.2
  },
  {
    id: 'creative-writing',
    name: 'Creative Analysis',
    description: 'Creative market analysis and scenario generation',
    category: 'creativity',
    difficulty: 'medium',
    maxScore: 100,
    timeLimit: 90,
    weight: 0.15
  },
  {
    id: 'mathematical-computation',
    name: 'Mathematical Computation',
    description: 'Complex financial calculations and optimization',
    category: 'math',
    difficulty: 'expert',
    maxScore: 100,
    timeLimit: 45,
    weight: 0.25
  },
  {
    id: 'language-understanding',
    name: 'Language Understanding',
    description: 'Natural language processing and sentiment analysis',
    category: 'language',
    difficulty: 'medium',
    maxScore: 100,
    timeLimit: 30,
    weight: 0.15
  },
  {
    id: 'code-generation',
    name: 'Code Generation',
    description: 'Trading algorithm generation and optimization',
    category: 'code',
    difficulty: 'hard',
    maxScore: 100,
    timeLimit: 120,
    weight: 0.15
  },
  {
    id: 'trading-strategy',
    name: 'Trading Strategy',
    description: 'Market analysis and trading decision making',
    category: 'trading',
    difficulty: 'expert',
    maxScore: 100,
    timeLimit: 180,
    weight: 0.1
  }
]

const MOCK_MODELS: ModelPerformance[] = [
  {
    id: 'gpt-4-turbo',
    modelName: 'GPT-4 Turbo',
    provider: 'OpenAI',
    version: '1106-preview',
    benchmarkScore: 92.5,
    accuracyScore: 89.2,
    responseTime: 2.3,
    costPerToken: 0.003,
    throughput: 450,
    memoryUsage: 85,
    energyEfficiency: 78,
    reliability: 96.8,
    creativeScore: 94,
    logicalScore: 91,
    mathematicalScore: 95,
    languageScore: 96,
    codeScore: 88,
    tasksCompleted: 15847,
    successRate: 94.2,
    totalCost: 2847.56,
    totalTokens: 949186,
    uptime: 99.2,
    errorRate: 0.8,
    lastTested: new Date(Date.now() - 2 * 60 * 60 * 1000),
    strengths: ['Excellent reasoning', 'High accuracy', 'Versatile applications', 'Strong math skills'],
    weaknesses: ['Higher cost', 'Moderate response time', 'Energy consumption'],
    recommendations: ['Optimize for cost-sensitive tasks', 'Use for complex analysis', 'Consider for high-value decisions']
  },
  {
    id: 'gemini-pro',
    modelName: 'Gemini Pro',
    provider: 'Google',
    version: '1.5',
    benchmarkScore: 88.7,
    accuracyScore: 86.5,
    responseTime: 1.8,
    costPerToken: 0.0015,
    throughput: 620,
    memoryUsage: 72,
    energyEfficiency: 85,
    reliability: 94.3,
    creativeScore: 87,
    logicalScore: 92,
    mathematicalScore: 89,
    languageScore: 93,
    codeScore: 85,
    tasksCompleted: 12456,
    successRate: 91.8,
    totalCost: 1654.32,
    totalTokens: 1102880,
    uptime: 98.7,
    errorRate: 1.3,
    lastTested: new Date(Date.now() - 1 * 60 * 60 * 1000),
    strengths: ['Fast response', 'Cost effective', 'Good energy efficiency', 'Strong logical reasoning'],
    weaknesses: ['Lower creativity', 'Moderate accuracy', 'Limited specialized knowledge'],
    recommendations: ['Use for high-frequency tasks', 'Optimize for speed-critical applications', 'Consider for large-scale analysis']
  },
  {
    id: 'claude-3-sonnet',
    modelName: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    version: '20240229',
    benchmarkScore: 90.1,
    accuracyScore: 92.3,
    responseTime: 2.1,
    costPerToken: 0.0025,
    throughput: 380,
    memoryUsage: 78,
    energyEfficiency: 82,
    reliability: 97.5,
    creativeScore: 96,
    logicalScore: 89,
    mathematicalScore: 87,
    languageScore: 98,
    codeScore: 84,
    tasksCompleted: 8932,
    successRate: 96.7,
    totalCost: 1987.43,
    totalTokens: 794972,
    uptime: 99.5,
    errorRate: 0.5,
    lastTested: new Date(Date.now() - 3 * 60 * 60 * 1000),
    strengths: ['Highest accuracy', 'Excellent language skills', 'Very reliable', 'Strong creativity'],
    weaknesses: ['Higher cost', 'Lower throughput', 'Moderate math performance'],
    recommendations: ['Use for quality-critical tasks', 'Optimize for language-heavy analysis', 'Consider for creative applications']
  },
  {
    id: 'custom-model',
    modelName: 'Custom Trading Model',
    provider: 'Internal',
    version: '2.1',
    benchmarkScore: 84.2,
    accuracyScore: 88.1,
    responseTime: 1.2,
    costPerToken: 0.0008,
    throughput: 850,
    memoryUsage: 65,
    energyEfficiency: 92,
    reliability: 91.2,
    creativeScore: 72,
    logicalScore: 86,
    mathematicalScore: 92,
    languageScore: 81,
    codeScore: 89,
    tasksCompleted: 23847,
    successRate: 89.4,
    totalCost: 987.23,
    totalTokens: 1234038,
    uptime: 97.8,
    errorRate: 2.2,
    lastTested: new Date(Date.now() - 30 * 60 * 1000),
    strengths: ['Very fast', 'Low cost', 'High energy efficiency', 'Trading optimized'],
    weaknesses: ['Limited creativity', 'Specialized scope', 'Lower language skills'],
    recommendations: ['Use for high-frequency trading', 'Optimize for cost efficiency', 'Consider for automated decisions']
  }
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

interface AIModelComparisonDashboardProps {
  onModelSelect?: (modelId: string) => void
  onBenchmarkRun?: (testId: string) => void
  className?: string
}

export function AIModelComparisonDashboard({
  onModelSelect,
  onBenchmarkRun,
  className = ''
}: AIModelComparisonDashboardProps) {
  const [models, setModels] = useState<ModelPerformance[]>(MOCK_MODELS)
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4-turbo', 'gemini-pro', 'claude-3-sonnet'])
  const [comparisonMetric, setComparisonMetric] = useState<'performance' | 'cost' | 'speed' | 'accuracy'>('performance')
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false)
  const [benchmarkProgress, setBenchmarkProgress] = useState(0)

  // Calculate comparison metrics
  const comparisonData = useMemo(() => {
    return models.map(model => {
      const performance = (model.benchmarkScore + model.accuracyScore + model.reliability) / 3
      const cost = 100 - (model.costPerToken * 1000) // Lower cost is better
      const efficiency = (model.throughput / 10) + model.energyEfficiency
      const reliability = model.reliability
      const versatility = (model.creativeScore + model.logicalScore + model.mathematicalScore + model.languageScore + model.codeScore) / 5
      
      const overallScore = (performance * 0.3) + (cost * 0.2) + (efficiency * 0.2) + (reliability * 0.15) + (versatility * 0.15)
      
      return {
        ...model,
        metrics: {
          performance: performance,
          cost: cost,
          reliability: reliability,
          efficiency: efficiency,
          versatility: versatility,
          overallScore: overallScore,
          rank: 0 // Will be calculated after sorting
        }
      }
    }).sort((a, b) => b.metrics.overallScore - a.metrics.overallScore)
     .map((model, index) => ({
       ...model,
       metrics: {
         ...model.metrics,
         rank: index + 1
       }
     }))
  }, [models])

  // Filter selected models for comparison
  const selectedModelData = useMemo(() => {
    return comparisonData.filter(model => selectedModels.includes(model.id))
  }, [comparisonData, selectedModels])

  // Performance comparison chart data
  const performanceChartData = useMemo(() => {
    return selectedModelData.map(model => ({
      name: model.modelName,
      performance: model.benchmarkScore,
      accuracy: model.accuracyScore,
      reliability: model.reliability,
      speed: 100 - (model.responseTime * 10), // Convert to score
      cost: 100 - (model.costPerToken * 1000), // Convert to score
      efficiency: model.energyEfficiency
    }))
  }, [selectedModelData])

  // Cost analysis chart data
  const costAnalysisData = useMemo(() => {
    return selectedModelData.map(model => ({
      name: model.modelName,
      costPerToken: model.costPerToken,
      totalCost: model.totalCost,
      tokensUsed: model.totalTokens,
      efficiency: model.totalTokens / model.totalCost
    }))
  }, [selectedModelData])

  // Benchmark category scores
  const benchmarkScoreData = useMemo(() => {
    return selectedModelData.map(model => ({
      name: model.modelName,
      creative: model.creativeScore,
      logical: model.logicalScore,
      mathematical: model.mathematicalScore,
      language: model.languageScore,
      code: model.codeScore
    }))
  }, [selectedModelData])

  // Run benchmark test
  const runBenchmark = async (testId?: string) => {
    if (isRunningBenchmark) return
    
    setIsRunningBenchmark(true)
    setBenchmarkProgress(0)
    
    try {
      // Simulate benchmark execution
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setBenchmarkProgress(i)
      }
      
      // Update model scores with slight variations
      setModels(prev => prev.map(model => ({
        ...model,
        benchmarkScore: Math.max(70, Math.min(100, model.benchmarkScore + (Math.random() - 0.5) * 5)),
        accuracyScore: Math.max(70, Math.min(100, model.accuracyScore + (Math.random() - 0.5) * 3)),
        responseTime: Math.max(0.5, model.responseTime + (Math.random() - 0.5) * 0.5),
        lastTested: new Date()
      })))
      
      if (testId && onBenchmarkRun) {
        onBenchmarkRun(testId)
      }
    } catch (error) {
      console.error('Benchmark failed:', error)
    } finally {
      setIsRunningBenchmark(false)
      setBenchmarkProgress(0)
    }
  }

  // Toggle model selection
  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                AI Model Performance Comparison
                <Badge variant="secondary">
                  {selectedModels.length} models selected
                </Badge>
              </CardTitle>
              <CardDescription>
                Comprehensive benchmarking and analysis of AI model performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBenchmark()}
                disabled={isRunningBenchmark}
              >
                {isRunningBenchmark ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Benchmarks
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Benchmark Progress */}
      <AnimatePresence>
        {isRunningBenchmark && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Running Benchmarks</span>
                  <span className="text-sm text-muted-foreground">{benchmarkProgress}%</span>
                </div>
                <Progress value={benchmarkProgress} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Model Selection</CardTitle>
          <CardDescription>Select models to compare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparisonData.map(model => (
              <div
                key={model.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedModels.includes(model.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleModelSelection(model.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedModels.includes(model.id) ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className="font-medium">{model.modelName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    #{model.metrics.rank}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {model.provider} • {model.version}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Score:</span>
                    <span className="font-medium">{model.benchmarkScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cost:</span>
                    <span className="font-medium">${model.costPerToken.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Speed:</span>
                    <span className="font-medium">{model.responseTime.toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedModelData.map(model => (
              <Card key={model.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.modelName}</CardTitle>
                    <Badge variant="outline">#{model.metrics.rank}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Overall Score:</span>
                      <span className="font-bold text-blue-600">
                        {model.metrics.overallScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Performance:</span>
                      <span className="font-medium">{model.metrics.performance.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cost Efficiency:</span>
                      <span className="font-medium">{model.metrics.cost.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Reliability:</span>
                      <span className="font-medium">{model.reliability.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span className="font-medium">{model.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Radar Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    {selectedModelData.map((model, index) => (
                      <Radar
                        key={model.id}
                        name={model.modelName}
                        dataKey="performance"
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.1}
                      />
                    ))}
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="performance" fill="#3B82F6" name="Performance" />
                    <Bar dataKey="accuracy" fill="#10B981" name="Accuracy" />
                    <Bar dataKey="reliability" fill="#F59E0B" name="Reliability" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time vs Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis 
                      dataKey="responseTime" 
                      name="Response Time (s)"
                      type="number"
                      domain={[0, 'dataMax']}
                    />
                    <YAxis 
                      dataKey="accuracyScore" 
                      name="Accuracy Score"
                      type="number"
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => [value, name]}
                    />
                    <Scatter
                      name="Models"
                      data={selectedModelData}
                      fill="#3B82F6"
                    >
                      {selectedModelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={costAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalCost" fill="#EF4444" name="Total Cost ($)" />
                    <Line 
                      type="monotone" 
                      dataKey="costPerToken" 
                      stroke="#3B82F6" 
                      name="Cost Per Token ($)"
                      yAxisId="right"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Efficiency Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedModelData
                    .sort((a, b) => a.costPerToken - b.costPerToken)
                    .map((model, index) => (
                      <div key={model.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{model.modelName}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${model.costPerToken.toFixed(4)}</div>
                          <div className="text-sm text-muted-foreground">per token</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedModelData.map(model => (
                    <div key={model.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{model.modelName}</span>
                        <span>{model.totalTokens.toLocaleString()} tokens</span>
                      </div>
                      <Progress 
                        value={(model.totalTokens / Math.max(...selectedModelData.map(m => m.totalTokens))) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Benchmark Category Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={benchmarkScoreData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Creative"
                      dataKey="creative"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Logical"
                      dataKey="logical"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Mathematical"
                      dataKey="mathematical"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Language"
                      dataKey="language"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Code"
                      dataKey="code"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Benchmark Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BENCHMARK_TESTS.map(test => (
                  <div key={test.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{test.name}</h4>
                      <Badge variant={
                        test.difficulty === 'easy' ? 'secondary' :
                        test.difficulty === 'medium' ? 'default' :
                        test.difficulty === 'hard' ? 'destructive' : 'outline'
                      }>
                        {test.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{test.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Weight:</span> {(test.weight * 100).toFixed(0)}%
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runBenchmark(test.id)}
                        disabled={isRunningBenchmark}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {selectedModelData.map(model => (
            <Card key={model.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {model.modelName} Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-green-600 mb-2 flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {model.strengths.map((strength, index) => (
                        <li key={index} className="text-sm flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4" />
                      Weaknesses
                    </h4>
                    <ul className="space-y-1">
                      {model.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {model.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparison Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comparisonMetric">Primary Comparison Metric</Label>
                <Select
                  value={comparisonMetric}
                  onValueChange={(value) => setComparisonMetric(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="cost">Cost Efficiency</SelectItem>
                    <SelectItem value="speed">Response Speed</SelectItem>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Benchmark Weights</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BENCHMARK_TESTS.map(test => (
                    <div key={test.id} className="flex items-center justify-between">
                      <span className="text-sm">{test.name}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={test.weight}
                          className="w-20"
                          disabled
                        />
                        <span className="text-sm text-muted-foreground">
                          {(test.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AIModelComparisonDashboard