'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Zap, TrendingUp, TrendingDown, Brain, Activity, Target,
  BarChart3, Settings, Clock, Award, Lightbulb, RefreshCw,
  CheckCircle2, AlertTriangle, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Agent Learning Engine Component
 * Implements advanced machine learning capabilities for autonomous trading agents
 * Tracks performance, adapts strategies, and optimizes decision-making processes
 */

interface LearningModel {
  id: string
  name: string
  type: 'neural_network' | 'decision_tree' | 'reinforcement_learning' | 'ensemble'
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  trainingData: number
  lastUpdated: Date
  performance: PerformanceMetric[]
  hyperparameters: Record<string, any>
  isActive: boolean
}

interface PerformanceMetric {
  timestamp: Date
  metric: string
  value: number
  baseline: number
  improvement: number
  confidence: number
}

interface LearningSession {
  id: string
  startTime: Date
  endTime?: Date
  objective: 'profit_optimization' | 'risk_reduction' | 'accuracy_improvement' | 'strategy_adaptation'
  modelType: string
  trainingSize: number
  validationSize: number
  testResults: TestResult[]
  learningRate: number
  epochs: number
  status: 'running' | 'completed' | 'failed' | 'paused'
}

interface TestResult {
  epoch: number
  trainLoss: number
  validationLoss: number
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  timestamp: Date
}

interface AdaptationRule {
  id: string
  condition: string
  action: string
  priority: number
  successRate: number
  activations: number
  lastTriggered?: Date
  isEnabled: boolean
}

interface LearningMetrics {
  overallAccuracy: number
  improvementRate: number
  adaptationSpeed: number
  learningEfficiency: number
  modelStability: number
  performanceConsistency: number
  riskAdjustedReturns: number
}

interface AgentLearningEngineProps {
  agentId?: string
  onModelUpdate?: (model: LearningModel) => void
  onLearningComplete?: (session: LearningSession) => void
  onAdaptationTriggered?: (rule: AdaptationRule) => void
  isActive?: boolean
  className?: string
}

export function AgentLearningEngine({
  agentId = 'agent-001',
  onModelUpdate,
  onLearningComplete,
  onAdaptationTriggered,
  isActive = true,
  className
}: AgentLearningEngineProps) {
  const [learningEngine, setLearningEngine] = useState({
    enabled: isActive,
    autoAdaptation: true,
    learningRate: 0.001,
    batchSize: 32,
    maxEpochs: 100,
    validationSplit: 0.2,
    earlyStoppingPatience: 10,
    modelEnsemble: true,
    reinforcementLearning: true,
    continuousLearning: true
  })

  const [models, setModels] = useState<LearningModel[]>([])
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null)
  const [learningHistory, setLearningHistory] = useState<LearningSession[]>([])
  const [adaptationRules, setAdaptationRules] = useState<AdaptationRule[]>([])
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics>({
    overallAccuracy: 0,
    improvementRate: 0,
    adaptationSpeed: 0,
    learningEfficiency: 0,
    modelStability: 0,
    performanceConsistency: 0,
    riskAdjustedReturns: 0
  })

  const [selectedModel, setSelectedModel] = useState<LearningModel | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Generate mock learning models
  const generateMockModels = (): LearningModel[] => {
    const modelTypes = ['neural_network', 'decision_tree', 'reinforcement_learning', 'ensemble'] as const
    const modelNames = ['Alpha Predictor', 'Risk Analyzer', 'Trend Detector', 'Market Adapter', 'Signal Optimizer']
    
    return modelNames.map((name, index) => {
      const performance: PerformanceMetric[] = []
      for (let i = 0; i < 30; i++) {
        performance.push({
          timestamp: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
          metric: 'accuracy',
          value: 0.6 + Math.random() * 0.3 + (i * 0.005), // Improving over time
          baseline: 0.65,
          improvement: (0.6 + Math.random() * 0.3 + (i * 0.005)) - 0.65,
          confidence: 0.8 + Math.random() * 0.15
        })
      }

      return {
        id: `model-${index}`,
        name,
        type: modelTypes[index % modelTypes.length],
        accuracy: 75 + Math.random() * 20,
        precision: 70 + Math.random() * 25,
        recall: 68 + Math.random() * 27,
        f1Score: 72 + Math.random() * 23,
        trainingData: 1000 + Math.random() * 9000,
        lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        performance,
        hyperparameters: {
          learningRate: 0.001 + Math.random() * 0.009,
          batchSize: [16, 32, 64, 128][Math.floor(Math.random() * 4)],
          hiddenLayers: Math.floor(Math.random() * 5) + 2,
          dropout: 0.1 + Math.random() * 0.4,
          l2Regularization: Math.random() * 0.01
        },
        isActive: Math.random() > 0.3 // 70% chance of being active
      }
    })
  }

  // Generate mock learning sessions
  const generateMockSessions = (): LearningSession[] => {
    const objectives = ['profit_optimization', 'risk_reduction', 'accuracy_improvement', 'strategy_adaptation'] as const
    const modelTypes = ['neural_network', 'decision_tree', 'reinforcement_learning', 'ensemble']
    
    return Array.from({ length: 10 }, (_, index) => {
      const testResults: TestResult[] = []
      const epochs = 20 + Math.floor(Math.random() * 80)
      
      for (let epoch = 1; epoch <= epochs; epoch++) {
        testResults.push({
          epoch,
          trainLoss: 1.0 - (epoch / epochs) * 0.7 + Math.random() * 0.1,
          validationLoss: 1.1 - (epoch / epochs) * 0.6 + Math.random() * 0.15,
          accuracy: 0.5 + (epoch / epochs) * 0.4 + Math.random() * 0.05,
          precision: 0.48 + (epoch / epochs) * 0.42 + Math.random() * 0.05,
          recall: 0.52 + (epoch / epochs) * 0.38 + Math.random() * 0.05,
          f1Score: 0.5 + (epoch / epochs) * 0.4 + Math.random() * 0.05,
          timestamp: new Date(Date.now() - (10 - index) * 24 * 60 * 60 * 1000 + epoch * 60000)
        })
      }

      return {
        id: `session-${index}`,
        startTime: new Date(Date.now() - (10 - index) * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - (10 - index) * 24 * 60 * 60 * 1000 + epochs * 60000),
        objective: objectives[index % objectives.length],
        modelType: modelTypes[index % modelTypes.length],
        trainingSize: 800 + Math.random() * 1200,
        validationSize: 200 + Math.random() * 300,
        testResults,
        learningRate: 0.001 + Math.random() * 0.009,
        epochs,
        status: 'completed' as const
      }
    })
  }

  // Generate mock adaptation rules
  const generateMockRules = (): AdaptationRule[] => {
    return [
      {
        id: 'rule-1',
        condition: 'Market volatility > 3% and accuracy < 70%',
        action: 'Reduce position size by 50% and increase stop-loss sensitivity',
        priority: 1,
        successRate: 78.5,
        activations: 23,
        lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isEnabled: true
      },
      {
        id: 'rule-2', 
        condition: 'Consecutive losses >= 3',
        action: 'Switch to conservative strategy and reduce risk exposure',
        priority: 2,
        successRate: 84.2,
        activations: 15,
        lastTriggered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isEnabled: true
      },
      {
        id: 'rule-3',
        condition: 'Profit factor > 2.0 for 7 days',
        action: 'Gradually increase position size with enhanced risk monitoring',
        priority: 3,
        successRate: 72.1,
        activations: 8,
        lastTriggered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isEnabled: true
      },
      {
        id: 'rule-4',
        condition: 'Model accuracy degradation > 10%',
        action: 'Trigger immediate retraining with recent market data',
        priority: 1,
        successRate: 91.3,
        activations: 12,
        lastTriggered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isEnabled: true
      },
      {
        id: 'rule-5',
        condition: 'News sentiment extreme + high volume',
        action: 'Pause new positions and evaluate market conditions',
        priority: 2,
        successRate: 67.8,
        activations: 31,
        lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000),
        isEnabled: false
      }
    ]
  }

  // Calculate learning metrics
  const calculateLearningMetrics = useMemo(() => {
    if (models.length === 0) return learningMetrics

    const activeModels = models.filter(m => m.isActive)
    const overallAccuracy = activeModels.reduce((acc, m) => acc + m.accuracy, 0) / Math.max(1, activeModels.length)
    
    // Calculate improvement rate from recent sessions
    const recentSessions = learningHistory.slice(0, 5)
    const improvementRate = recentSessions.length > 1 ? 
      ((recentSessions[0].testResults[recentSessions[0].testResults.length - 1]?.accuracy || 0) - 
       (recentSessions[recentSessions.length - 1].testResults[recentSessions[recentSessions.length - 1].testResults.length - 1]?.accuracy || 0)) * 100 : 0

    // Mock other metrics with realistic values
    return {
      overallAccuracy,
      improvementRate,
      adaptationSpeed: 85 + Math.random() * 10,
      learningEfficiency: 78 + Math.random() * 15,
      modelStability: 82 + Math.random() * 12,
      performanceConsistency: 74 + Math.random() * 18,
      riskAdjustedReturns: 1.8 + Math.random() * 1.2
    }
  }, [models, learningHistory])

  // Initialize mock data
  useEffect(() => {
    if (learningEngine.enabled) {
      setModels(generateMockModels())
      setLearningHistory(generateMockSessions())
      setAdaptationRules(generateMockRules())
    }
  }, [learningEngine.enabled])

  // Update learning metrics
  useEffect(() => {
    setLearningMetrics(calculateLearningMetrics)
  }, [calculateLearningMetrics])

  // Start new learning session
  const startLearningSession = (objective: LearningSession['objective']) => {
    const newSession: LearningSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      objective,
      modelType: 'neural_network',
      trainingSize: 1000,
      validationSize: 250,
      testResults: [],
      learningRate: learningEngine.learningRate,
      epochs: learningEngine.maxEpochs,
      status: 'running'
    }
    
    setCurrentSession(newSession)
    
    // Simulate training progress
    const trainingInterval = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev || prev.testResults.length >= learningEngine.maxEpochs) {
          clearInterval(trainingInterval)
          if (prev) {
            const completedSession = { ...prev, status: 'completed' as const, endTime: new Date() }
            setLearningHistory(prevHistory => [completedSession, ...prevHistory.slice(0, 9)])
            if (onLearningComplete) {
              onLearningComplete(completedSession)
            }
          }
          return null
        }
        
        const epoch = prev.testResults.length + 1
        const progress = epoch / learningEngine.maxEpochs
        
        const newResult: TestResult = {
          epoch,
          trainLoss: 1.0 - progress * 0.7 + Math.random() * 0.1,
          validationLoss: 1.1 - progress * 0.6 + Math.random() * 0.15,
          accuracy: 0.5 + progress * 0.4 + Math.random() * 0.05,
          precision: 0.48 + progress * 0.42 + Math.random() * 0.05,
          recall: 0.52 + progress * 0.38 + Math.random() * 0.05,
          f1Score: 0.5 + progress * 0.4 + Math.random() * 0.05,
          timestamp: new Date()
        }
        
        return {
          ...prev,
          testResults: [...prev.testResults, newResult]
        }
      })
    }, 500) // Update every 500ms for demo
  }

  const stopLearningSession = () => {
    if (currentSession) {
      const stoppedSession = { ...currentSession, status: 'paused' as const }
      setCurrentSession(stoppedSession)
    }
  }

  const triggerAdaptation = (ruleId: string) => {
    const rule = adaptationRules.find(r => r.id === ruleId)
    if (rule) {
      const updatedRule = { 
        ...rule, 
        activations: rule.activations + 1, 
        lastTriggered: new Date() 
      }
      setAdaptationRules(prev => prev.map(r => r.id === ruleId ? updatedRule : r))
      
      if (onAdaptationTriggered) {
        onAdaptationTriggered(updatedRule)
      }
    }
  }

  const toggleLearningEngine = () => {
    setLearningEngine(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  return (
    <Card className={`${className} ${learningEngine.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              Agent Learning Engine
              <Badge variant={learningEngine.enabled ? "default" : "secondary"}>
                {learningEngine.enabled ? 'Learning' : 'Inactive'}
              </Badge>
              {currentSession && (
                <Badge variant="outline" className="ml-2">
                  Training in Progress
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Advanced machine learning and adaptation system for {agentId}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {currentSession ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={stopLearningSession}
              >
                Stop Training
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => startLearningSession('profit_optimization')}
                disabled={!learningEngine.enabled}
              >
                <Brain className="h-4 w-4 mr-1" />
                Start Learning
              </Button>
            )}
            <Button
              size="sm"
              variant={learningEngine.enabled ? "destructive" : "default"}
              onClick={toggleLearningEngine}
            >
              {learningEngine.enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="adaptation">Adaptation</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Learning Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Overall Accuracy</div>
                <AnimatedCounter 
                  value={learningMetrics.overallAccuracy}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-blue-600"
                />
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Improvement Rate</div>
                <AnimatedCounter 
                  value={Math.abs(learningMetrics.improvementRate)}
                  precision={1}
                  suffix="%"
                  className={`text-2xl font-bold ${learningMetrics.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
                <div className="text-xs text-muted-foreground">
                  {learningMetrics.improvementRate >= 0 ? '↗ Improving' : '↘ Declining'}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Learning Efficiency</div>
                <AnimatedCounter 
                  value={learningMetrics.learningEfficiency}
                  precision={1}
                  suffix="%"
                  className="text-2xl font-bold text-purple-600"
                />
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Risk-Adj Returns</div>
                <AnimatedCounter 
                  value={learningMetrics.riskAdjustedReturns}
                  precision={2}
                  className="text-2xl font-bold text-orange-600"
                />
              </div>
            </div>

            {/* Current Training Session */}
            {currentSession && (
              <Card className="border-2 border-dashed border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                    Current Training Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Objective</div>
                      <div className="font-semibold capitalize">{currentSession.objective.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Epoch</div>
                      <div className="font-semibold">{currentSession.testResults.length} / {learningEngine.maxEpochs}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Current Accuracy</div>
                      <div className="font-semibold">
                        {currentSession.testResults.length > 0 ? 
                          `${(currentSession.testResults[currentSession.testResults.length - 1].accuracy * 100).toFixed(1)}%` : 
                          'Starting...'
                        }
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(currentSession.testResults.length / learningEngine.maxEpochs) * 100} 
                    className="h-2"
                  />
                  {currentSession.testResults.length > 5 && (
                    <div className="h-32 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={currentSession.testResults.slice(-20)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="epoch" stroke="#6B7280" fontSize={12} />
                          <YAxis stroke="#6B7280" fontSize={12} />
                          <Tooltip />
                          <Line type="monotone" dataKey="trainLoss" stroke="#EF4444" strokeWidth={2} name="Train Loss" />
                          <Line type="monotone" dataKey="validationLoss" stroke="#F59E0B" strokeWidth={2} name="Validation Loss" />
                          <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} name="Accuracy" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Active Models */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Active Learning Models
              </h4>
              <div className="grid gap-3">
                {models.filter(m => m.isActive).slice(0, 3).map((model) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:border-blue-200"
                    onClick={() => setSelectedModel(model)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{model.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Type: {model.type.replace('_', ' ')} • Training data: {model.trainingData.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">{model.accuracy.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">F1: {model.f1Score.toFixed(1)}%</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <div className="grid gap-4">
              {models.map((model) => (
                <Card key={model.id} className={`cursor-pointer hover:border-blue-200 ${model.isActive ? 'border-green-200' : 'border-gray-200'}`} onClick={() => setSelectedModel(model)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={model.isActive ? 'default' : 'secondary'}>
                          {model.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{model.type.replace('_', ' ')}</Badge>
                        <span className="font-semibold">{model.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">{model.accuracy.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">accuracy</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Precision:</span> {model.precision.toFixed(1)}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recall:</span> {model.recall.toFixed(1)}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">F1 Score:</span> {model.f1Score.toFixed(1)}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Training Size:</span> {model.trainingData.toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm text-muted-foreground mb-1">Performance Trend</div>
                      <div className="h-16">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={model.performance.slice(-10)}>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#3B82F6"
                              fill="#3B82F6"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            {/* Training Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Training Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => startLearningSession('profit_optimization')}
                    disabled={!!currentSession || !learningEngine.enabled}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <TrendingUp className="h-6 w-6 mb-2" />
                    Profit Optimization
                  </Button>
                  <Button
                    onClick={() => startLearningSession('risk_reduction')}
                    disabled={!!currentSession || !learningEngine.enabled}
                    className="h-20 flex flex-col items-center justify-center"
                    variant="outline"
                  >
                    <TrendingDown className="h-6 w-6 mb-2" />
                    Risk Reduction
                  </Button>
                  <Button
                    onClick={() => startLearningSession('accuracy_improvement')}
                    disabled={!!currentSession || !learningEngine.enabled}
                    className="h-20 flex flex-col items-center justify-center"
                    variant="outline"
                  >
                    <Target className="h-6 w-6 mb-2" />
                    Accuracy Boost
                  </Button>
                  <Button
                    onClick={() => startLearningSession('strategy_adaptation')}
                    disabled={!!currentSession || !learningEngine.enabled}
                    className="h-20 flex flex-col items-center justify-center"
                    variant="outline"
                  >
                    <RefreshCw className="h-6 w-6 mb-2" />
                    Strategy Adapt
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Training History */}
            <Card>
              <CardHeader>
                <CardTitle>Training History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningHistory.map((session) => (
                    <div key={session.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                          <span className="font-semibold capitalize">{session.objective.replace('_', ' ')}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.startTime.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Model:</span> {session.modelType.replace('_', ' ')}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Epochs:</span> {session.epochs}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Final Accuracy:</span> 
                          {session.testResults.length > 0 ? 
                            ` ${(session.testResults[session.testResults.length - 1].accuracy * 100).toFixed(1)}%` : 
                            ' N/A'
                          }
                        </div>
                        <div>
                          <span className="text-muted-foreground">Training Size:</span> {session.trainingSize.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adaptation Tab */}
          <TabsContent value="adaptation" className="space-y-6">
            {/* Adaptation Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Adaptation Rules</CardTitle>
                <CardDescription>Automatic rules for strategy adaptation based on market conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adaptationRules.map((rule) => (
                    <div key={rule.id} className={`p-4 rounded-lg border ${rule.isEnabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.isEnabled ? 'default' : 'secondary'}>
                            Priority {rule.priority}
                          </Badge>
                          <Badge variant="outline">
                            {rule.successRate.toFixed(1)}% success
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => triggerAdaptation(rule.id)}
                            disabled={!rule.isEnabled}
                          >
                            Trigger
                          </Button>
                          <Switch
                            checked={rule.isEnabled}
                            onCheckedChange={(checked) => setAdaptationRules(prev => 
                              prev.map(r => r.id === rule.id ? { ...r, isEnabled: checked } : r)
                            )}
                          />
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="font-semibold text-sm">Condition:</div>
                        <div className="text-sm text-muted-foreground">{rule.condition}</div>
                      </div>
                      <div className="mb-2">
                        <div className="font-semibold text-sm">Action:</div>
                        <div className="text-sm text-muted-foreground">{rule.action}</div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Activations: {rule.activations}</span>
                        {rule.lastTriggered && (
                          <span>Last triggered: {rule.lastTriggered.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Engine Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="learningRate">Learning Rate</Label>
                      <Input
                        id="learningRate"
                        type="number"
                        step="0.0001"
                        value={learningEngine.learningRate}
                        onChange={(e) => setLearningEngine(prev => ({ 
                          ...prev, 
                          learningRate: parseFloat(e.target.value) || 0.001 
                        }))}
                        min="0.0001"
                        max="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batchSize">Batch Size</Label>
                      <Input
                        id="batchSize"
                        type="number"
                        value={learningEngine.batchSize}
                        onChange={(e) => setLearningEngine(prev => ({ 
                          ...prev, 
                          batchSize: parseInt(e.target.value) || 32 
                        }))}
                        min="8"
                        max="256"
                        step="8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxEpochs">Max Epochs</Label>
                      <Input
                        id="maxEpochs"
                        type="number"
                        value={learningEngine.maxEpochs}
                        onChange={(e) => setLearningEngine(prev => ({ 
                          ...prev, 
                          maxEpochs: parseInt(e.target.value) || 100 
                        }))}
                        min="10"
                        max="1000"
                        step="10"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Adaptation</Label>
                        <p className="text-sm text-muted-foreground">Automatically trigger adaptations</p>
                      </div>
                      <Switch 
                        checked={learningEngine.autoAdaptation}
                        onCheckedChange={(checked) => setLearningEngine(prev => ({ 
                          ...prev, 
                          autoAdaptation: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Model Ensemble</Label>
                        <p className="text-sm text-muted-foreground">Use multiple models together</p>
                      </div>
                      <Switch 
                        checked={learningEngine.modelEnsemble}
                        onCheckedChange={(checked) => setLearningEngine(prev => ({ 
                          ...prev, 
                          modelEnsemble: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Continuous Learning</Label>
                        <p className="text-sm text-muted-foreground">Learn from new data continuously</p>
                      </div>
                      <Switch 
                        checked={learningEngine.continuousLearning}
                        onCheckedChange={(checked) => setLearningEngine(prev => ({ 
                          ...prev, 
                          continuousLearning: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Reinforcement Learning</Label>
                        <p className="text-sm text-muted-foreground">Use RL for decision optimization</p>
                      </div>
                      <Switch 
                        checked={learningEngine.reinforcementLearning}
                        onCheckedChange={(checked) => setLearningEngine(prev => ({ 
                          ...prev, 
                          reinforcementLearning: checked 
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Status */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mt-6">
          <div className="flex items-center gap-2">
            {learningEngine.enabled ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <span className="font-medium">
              {learningEngine.enabled ? 'Learning Engine Active' : 'Learning Engine Inactive'}
            </span>
            {currentSession && (
              <Badge variant="outline" className="ml-2">
                Training: {currentSession.testResults.length}/{learningEngine.maxEpochs} epochs
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Agent: {agentId} • {models.filter(m => m.isActive).length} active models
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AgentLearningEngine