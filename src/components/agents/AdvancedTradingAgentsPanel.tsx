'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, TrendingUp, Activity, Shield, Target, 
  Play, Pause, RefreshCw, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Import the advanced trading agents framework
import { 
  tradingAgentCoordinator, 
  AgentDecision, 
  MarketData, 
  NewsData 
} from '@/lib/agents/advanced-trading-agents'

// Import notification service
import { useNotifications } from '@/lib/notifications/apprise-service'

interface AdvancedTradingAgentsPanelProps {
  className?: string
}

interface AgentStatus {
  id: string
  name: string
  type: string
  status: 'active' | 'idle' | 'analyzing' | 'error'
  lastDecision?: AgentDecision
  performance: {
    accuracy: number
    decisions: number
    successRate: number
  }
}

export function AdvancedTradingAgentsPanel({ className }: AdvancedTradingAgentsPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([])
  const [lastAnalysis, setLastAnalysis] = useState<any>(null)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [newsData, setNewsData] = useState<NewsData[]>([])
  const [autoAnalysis, setAutoAnalysis] = useState(false)
  
  const { notifyAgentDecision, notifyRiskAlert } = useNotifications()

  // Initialize agent statuses
  useEffect(() => {
    const agentInfo = tradingAgentCoordinator.getAgentStatus()
    
    const initialStatuses: AgentStatus[] = [
      {
        id: agentInfo.fundamentalAnalyst.id,
        name: agentInfo.fundamentalAnalyst.name,
        type: 'FUNDAMENTAL',
        status: 'idle',
        performance: { accuracy: 75, decisions: 0, successRate: 0 }
      },
      {
        id: agentInfo.technicalAnalyst.id,
        name: agentInfo.technicalAnalyst.name,
        type: 'TECHNICAL',
        status: 'idle',
        performance: { accuracy: 82, decisions: 0, successRate: 0 }
      },
      {
        id: agentInfo.sentimentAnalyst.id,
        name: agentInfo.sentimentAnalyst.name,
        type: 'SENTIMENT',
        status: 'idle',
        performance: { accuracy: 68, decisions: 0, successRate: 0 }
      },
      {
        id: agentInfo.riskManager.id,
        name: agentInfo.riskManager.name,
        type: 'RISK_MANAGER',
        status: 'idle',
        performance: { accuracy: 95, decisions: 0, successRate: 0 }
      }
    ]
    
    setAgentStatuses(initialStatuses)
  }, [])

  // Mock market data generator
  const generateMockMarketData = (): MarketData => {
    const symbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'ADA']
    const symbol = symbols[Math.floor(Math.random() * symbols.length)]
    
    return {
      symbol,
      price: Math.random() * 50000 + 10000,
      volume: Math.random() * 1000000 + 100000,
      change24h: (Math.random() - 0.5) * 20,
      timestamp: new Date(),
      technicals: {
        rsi: Math.random() * 100,
        ma50: Math.random() * 45000 + 15000,
        ma200: Math.random() * 40000 + 20000,
        bollinger: {
          upper: Math.random() * 55000 + 20000,
          middle: Math.random() * 50000 + 15000,
          lower: Math.random() * 45000 + 10000
        }
      }
    }
  }

  // Mock news data generator
  const generateMockNewsData = (): NewsData[] => {
    const newsItems: NewsData[] = [
      {
        title: 'Bitcoin ETF Approval Drives Market Sentiment',
        content: 'Major institutional adoption continues as new ETF receives regulatory approval.',
        sentiment: 'positive',
        source: 'CryptoNews',
        timestamp: new Date(),
        relevanceScore: 0.9
      },
      {
        title: 'Market Volatility Increases Amid Economic Uncertainty',
        content: 'Global economic factors contributing to increased market volatility.',
        sentiment: 'negative',
        source: 'FinanceDaily',
        timestamp: new Date(),
        relevanceScore: 0.7
      },
      {
        title: 'DeFi Protocol Launches New Features',
        content: 'Innovation in decentralized finance continues with new protocol features.',
        sentiment: 'neutral',
        source: 'DeFiTimes',
        timestamp: new Date(),
        relevanceScore: 0.6
      }
    ]
    
    return newsItems
  }

  // Run analysis with all agents
  const runAnalysis = async () => {
    if (isAnalyzing) return
    
    setIsAnalyzing(true)
    
    // Update agent statuses to analyzing
    setAgentStatuses(prev => prev.map(agent => ({ ...agent, status: 'analyzing' as const })))
    
    try {
      // Generate or use real market data
      const currentMarketData = marketData || generateMockMarketData()
      const currentNewsData = newsData.length > 0 ? newsData : generateMockNewsData()
      
      setMarketData(currentMarketData)
      setNewsData(currentNewsData)
      
      // Run multi-agent analysis
      const analysisResult = await tradingAgentCoordinator.analyzeAndDecide({
        marketData: currentMarketData,
        newsData: currentNewsData,
        portfolioValue: 10000, // Mock portfolio value
        currentPositions: [], // Mock positions
        marketVolatility: 0.15 // Mock volatility
      })
      
      setLastAnalysis(analysisResult)
      
      // Update agent statuses with decisions
      const updatedStatuses = agentStatuses.map(status => {
        const agentDecision = analysisResult.agentDecisions.find(d => d.agentType === status.type)
        if (agentDecision) {
          return {
            ...status,
            status: 'active' as const,
            lastDecision: agentDecision,
            performance: {
              ...status.performance,
              decisions: status.performance.decisions + 1
            }
          }
        }
        return { ...status, status: 'idle' as const }
      })
      
      setAgentStatuses(updatedStatuses)
      
      // Send notifications for high-confidence decisions
      if (analysisResult.finalDecision.confidence > 80) {
        await notifyAgentDecision(
          'Advanced Trading Agents',
          analysisResult.finalDecision.recommendation,
          analysisResult.finalDecision.confidence
        )
      }
      
      // Send risk alerts if needed
      if (analysisResult.finalDecision.riskLevel === 'HIGH') {
        await notifyRiskAlert(
          `High risk detected: ${analysisResult.finalDecision.reasoning}`,
          'high'
        )
      }
      
      toast.success('Analysis completed successfully')
      
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Analysis failed')
      
      // Update statuses to error
      setAgentStatuses(prev => prev.map(agent => ({ ...agent, status: 'error' as const })))
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto analysis effect
  useEffect(() => {
    if (!autoAnalysis) return
    
    const interval = setInterval(() => {
      if (!isAnalyzing) {
        runAnalysis()
      }
    }, 30000) // Run every 30 seconds
    
    return () => clearInterval(interval)
  }, [autoAnalysis, isAnalyzing])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'analyzing': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4" />
      case 'analyzing': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'error': return <AlertTriangle className="h-4 w-4" />
      default: return <Pause className="h-4 w-4" />
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'text-green-600'
      case 'SELL': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Advanced Trading Agents
          </h3>
          <p className="text-sm text-muted-foreground">
            Multi-agent AI framework for sophisticated trading analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoAnalysis(!autoAnalysis)}
          >
            {autoAnalysis ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {autoAnalysis ? 'Stop Auto' : 'Auto Analysis'}
          </Button>
          <Button onClick={runAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {agentStatuses.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{agent.name}</CardTitle>
                    <Badge className={getStatusColor(agent.status)} variant="secondary">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(agent.status)}
                        {agent.status}
                      </span>
                    </Badge>
                  </div>
                  <CardDescription>{agent.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Performance Metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Accuracy</span>
                        <span>{agent.performance.accuracy}%</span>
                      </div>
                      <Progress value={agent.performance.accuracy} className="h-2" />
                    </div>
                    
                    {/* Decisions Count */}
                    <div className="text-xs text-muted-foreground">
                      Decisions: {agent.performance.decisions}
                    </div>
                    
                    {/* Last Decision */}
                    {agent.lastDecision && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium">Last Decision:</div>
                        <div className={`text-sm font-semibold ${getRecommendationColor(agent.lastDecision.recommendation)}`}>
                          {agent.lastDecision.recommendation}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {agent.lastDecision.confidence}% confidence
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Risk: {agent.lastDecision.riskLevel}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Analysis Results */}
      {lastAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Latest Analysis Results
            </CardTitle>
            <CardDescription>
              Multi-agent consensus and final trading recommendation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Final Decision */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Final Recommendation</h4>
                  <div className={`text-2xl font-bold ${getRecommendationColor(lastAnalysis.finalDecision.recommendation)}`}>
                    {lastAnalysis.finalDecision.recommendation}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lastAnalysis.finalDecision.confidence}% confidence
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Risk Assessment</h4>
                  <Badge variant={lastAnalysis.finalDecision.riskLevel === 'HIGH' ? 'destructive' : 
                                  lastAnalysis.finalDecision.riskLevel === 'MEDIUM' ? 'default' : 'secondary'}>
                    {lastAnalysis.finalDecision.riskLevel} RISK
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Agent Consensus</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={lastAnalysis.consensus * 100} className="flex-1" />
                    <span className="text-sm font-medium">{(lastAnalysis.consensus * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              
              {/* Reasoning */}
              <div>
                <h4 className="font-medium mb-2">Analysis Reasoning</h4>
                <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                  {lastAnalysis.finalDecision.reasoning}
                </div>
                
                {/* Market Data Summary */}
                {marketData && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Market Data</h4>
                    <div className="text-sm space-y-1">
                      <div>{marketData.symbol}: ${marketData.price.toFixed(2)}</div>
                      <div className={marketData.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                        24h: {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}%
                      </div>
                      <div>Volume: {marketData.volume.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Decisions Breakdown */}
      {lastAnalysis?.agentDecisions && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Agent Decisions</CardTitle>
            <CardDescription>
              Detailed breakdown of each agent's analysis and recommendation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastAnalysis.agentDecisions.map((decision: AgentDecision, index: number) => (
                <div key={decision.agentId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{decision.agentType} Agent</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getRecommendationColor(decision.recommendation)} variant="outline">
                        {decision.recommendation}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {decision.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {decision.reasoning.split('\\n')[0]} {/* Show first line of reasoning */}
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