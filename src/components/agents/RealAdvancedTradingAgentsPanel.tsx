'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Brain, TrendingUp, Activity, Shield, Target, 
  Play, Pause, RefreshCw, AlertTriangle, CheckCircle2, Zap
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Import the real trading agents service
import { 
  useRealTradingAgents,
  RealAgentDecision,
  AgentAnalysisSession
} from '@/lib/agents/real-trading-agents-service'

// Import notification service
import { useNotifications } from '@/lib/notifications/apprise-service'

// Import enhanced market data hook to connect to live data
import { useEnhancedLiveMarketData } from '@/lib/market/enhanced-live-market-service'

interface RealAdvancedTradingAgentsPanelProps {
  className?: string
}

interface AgentStatus {
  id: string
  name: string
  type: string
  status: 'active' | 'idle' | 'analyzing' | 'error'
  lastDecision?: RealAgentDecision
  performance: {
    accuracy: number
    decisions: number
    successRate: number
  }
}

export function RealAdvancedTradingAgentsPanel({ className }: RealAdvancedTradingAgentsPanelProps) {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([])
  const [lastAnalysis, setLastAnalysis] = useState<AgentAnalysisSession | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD')
  const [analysisHistory, setAnalysisHistory] = useState<AgentAnalysisSession[]>([])
  const [paperTradingPerf, setPaperTradingPerf] = useState<any>(null)
  
  // Real trading agents service
  const {
    runAnalysis,
    startAutoAnalysis,
    stopAutoAnalysis,
    getHistory,
    isAutoActive,
    isAnalyzing,
    getWatchedSymbols,
    setWatchedSymbols,
    getPaperTradingPerformance
  } = useRealTradingAgents()
  
  // Enhanced live market data
  const { 
    prices: marketPrices, 
    loading: marketLoading,
    dataQuality: marketDataQuality,
    isLiveData: marketIsLive 
  } = useEnhancedLiveMarketData(['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD'])
  
  const { notifyAgentDecision, notifyRiskAlert } = useNotifications()
  
  const autoAnalysisActive = isAutoActive()
  const currentlyAnalyzing = isAnalyzing()

  // Initialize agent statuses and load history
  useEffect(() => {
    const initialStatuses: AgentStatus[] = [
      {
        id: 'fundamental-001',
        name: 'Fundamental Analyst',
        type: 'FUNDAMENTAL',
        status: 'idle',
        performance: { accuracy: 75, decisions: 0, successRate: 0 }
      },
      {
        id: 'technical-001',
        name: 'Technical Analyst',
        type: 'TECHNICAL',
        status: 'idle',
        performance: { accuracy: 82, decisions: 0, successRate: 0 }
      },
      {
        id: 'sentiment-001',
        name: 'Sentiment Analyst',
        type: 'SENTIMENT',
        status: 'idle',
        performance: { accuracy: 68, decisions: 0, successRate: 0 }
      },
      {
        id: 'risk-001',
        name: 'Risk Manager',
        type: 'RISK_MANAGER',
        status: 'idle',
        performance: { accuracy: 95, decisions: 0, successRate: 0 }
      }
    ]
    
    setAgentStatuses(initialStatuses)
    
    // Load analysis history
    const history = getHistory()
    setAnalysisHistory(history)
    if (history.length > 0) {
      setLastAnalysis(history[0])
    }

    // Load paper trading performance
    loadPaperTradingPerformance()
  }, [])

  // Load paper trading performance
  const loadPaperTradingPerformance = async () => {
    try {
      const perf = await getPaperTradingPerformance()
      setPaperTradingPerf(perf)
    } catch (error) {
      console.error('Error loading paper trading performance:', error)
    }
  }

  // Update agent statuses based on analysis
  const updateAgentStatuses = (session: AgentAnalysisSession) => {
    const updatedStatuses = agentStatuses.map(status => {
      const agentDecision = session.agentDecisions.find(d => d.agentType === status.type)
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
      return status
    })
    setAgentStatuses(updatedStatuses)
  }

  // Run real analysis with current market data
  const handleRunAnalysis = async () => {
    if (currentlyAnalyzing) return
    
    // Update agent statuses to analyzing
    setAgentStatuses(prev => prev.map(agent => ({ ...agent, status: 'analyzing' as const })))
    
    try {
      // Run analysis with real market data
      const session = await runAnalysis(selectedSymbol, marketPrices)
      
      setLastAnalysis(session)
      updateAgentStatuses(session)
      
      // Update history
      const updatedHistory = getHistory()
      setAnalysisHistory(updatedHistory)
      
      // Reload paper trading performance
      await loadPaperTradingPerformance()
      
      // Send notifications for high-confidence decisions
      if (session.finalRecommendation.confidence > 80) {
        await notifyAgentDecision(
          'Advanced Trading Agents',
          session.finalRecommendation.recommendation,
          session.finalRecommendation.confidence
        )
      }
      
      // Send risk alerts if needed
      if (session.finalRecommendation.riskLevel === 'HIGH') {
        await notifyRiskAlert(
          `High risk detected: ${session.finalRecommendation.reasoning}`,
          'high'
        )
      }
      
      toast.success(`Analysis completed: ${session.finalRecommendation.recommendation} with ${session.finalRecommendation.confidence}% confidence`)
      
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Analysis failed: ' + (error as Error).message)
      
      // Update statuses to error
      setAgentStatuses(prev => prev.map(agent => ({ ...agent, status: 'error' as const })))
    }
  }

  // Handle auto analysis toggle
  const handleAutoAnalysisToggle = () => {
    if (autoAnalysisActive) {
      stopAutoAnalysis()
      toast.success('Auto analysis stopped')
    } else {
      startAutoAnalysis(15, () => marketPrices) // 15 minutes, pass market prices
      toast.success('Auto analysis started (every 15 minutes)')
    }
  }

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
            Real Advanced Trading Agents
            <Badge variant="secondary" className="text-xs">
              Gemini AI Enhanced
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground">
            Live multi-agent AI framework with real market data and paper trading execution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getWatchedSymbols().map(symbol => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol.split('/')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoAnalysisToggle}
          >
            {autoAnalysisActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {autoAnalysisActive ? 'Stop Auto' : 'Auto Analysis'}
          </Button>
          <Button onClick={handleRunAnalysis} disabled={currentlyAnalyzing || marketLoading}>
            {currentlyAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {marketLoading ? 'Loading Data...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Real-time Status */}
      {marketPrices.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Live Market Data:</span>
                  <span className="font-semibold ml-2">{marketPrices.length} symbols connected</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Auto Analysis:</span>
                  <Badge variant={autoAnalysisActive ? 'default' : 'secondary'} className="ml-2">
                    {autoAnalysisActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Last Update: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                        {agent.lastDecision.supportingData?.geminiEnhanced && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Gemini Enhanced
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Paper Trading Performance */}
      {paperTradingPerf && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Paper Trading Performance
            </CardTitle>
            <CardDescription>
              Live performance from executed agent recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  ${paperTradingPerf.portfolio?.totalValue?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">Portfolio Value</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className={`text-lg font-bold ${paperTradingPerf.performance?.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {paperTradingPerf.performance?.totalPnL >= 0 ? '+' : ''}${paperTradingPerf.performance?.totalPnL?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">Total P&L</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {paperTradingPerf.performance?.winRate?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {paperTradingPerf.recentTrades?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Trades</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {lastAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Latest Analysis Results
              {lastAnalysis.executed && (
                <Badge variant="default" className="text-xs">
                  Executed
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Multi-agent consensus with real market data • {lastAnalysis.timestamp.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Final Decision */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Final Recommendation</h4>
                  <div className={`text-2xl font-bold ${getRecommendationColor(lastAnalysis.finalRecommendation.recommendation)}`}>
                    {lastAnalysis.finalRecommendation.recommendation}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lastAnalysis.finalRecommendation.confidence}% confidence
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Risk Assessment</h4>
                  <Badge variant={lastAnalysis.finalRecommendation.riskLevel === 'HIGH' ? 'destructive' : 
                                  lastAnalysis.finalRecommendation.riskLevel === 'MEDIUM' ? 'default' : 'secondary'}>
                    {lastAnalysis.finalRecommendation.riskLevel} RISK
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Agent Consensus</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={lastAnalysis.consensus * 100} className="flex-1" />
                    <span className="text-sm font-medium">{(lastAnalysis.consensus * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Market Conditions */}
                <div>
                  <h4 className="font-medium mb-2">Market Conditions</h4>
                  <div className="text-sm space-y-1">
                    <div>Trend: <span className="font-medium">{lastAnalysis.marketConditions.trend}</span></div>
                    <div>Volatility: <span className="font-medium">{(lastAnalysis.marketConditions.volatility * 100).toFixed(1)}%</span></div>
                    <div>Sentiment: <span className="font-medium">{lastAnalysis.marketConditions.sentiment.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
              
              {/* Market Data & Execution */}
              <div>
                <h4 className="font-medium mb-2">Analysis Details</h4>
                <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                  {lastAnalysis.finalRecommendation.reasoning.substring(0, 200)}...
                </div>
                
                {/* Market Data Summary */}
                {lastAnalysis.finalRecommendation.marketData && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Market Data</h4>
                    <div className="text-sm space-y-1">
                      <div>{lastAnalysis.finalRecommendation.marketData.symbol}: ${lastAnalysis.finalRecommendation.marketData.price.toFixed(2)}</div>
                      <div className={lastAnalysis.finalRecommendation.marketData.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                        24h: {lastAnalysis.finalRecommendation.marketData.change24h >= 0 ? '+' : ''}{lastAnalysis.finalRecommendation.marketData.change24h.toFixed(2)}%
                      </div>
                      <div>Volume: {lastAnalysis.finalRecommendation.marketData.volume.toLocaleString()}</div>
                      {lastAnalysis.finalRecommendation.executionPlan && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <div className="text-xs font-medium">Execution Plan:</div>
                          <div>Action: {lastAnalysis.finalRecommendation.executionPlan.action}</div>
                          {lastAnalysis.finalRecommendation.executionPlan.quantity && (
                            <div>Quantity: {lastAnalysis.finalRecommendation.executionPlan.quantity.toFixed(4)}</div>
                          )}
                          {lastAnalysis.finalRecommendation.paperTradeId && (
                            <div className="text-blue-600">Paper Trade: {lastAnalysis.finalRecommendation.paperTradeId}</div>
                          )}
                        </div>
                      )}
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
              {lastAnalysis.agentDecisions.map((decision: RealAgentDecision, index: number) => (
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
                      {decision.supportingData?.geminiEnhanced && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Gemini
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {decision.reasoning.split('\n')[0]} {/* Show first line of reasoning */}
                  </div>
                  {decision.paperTradeId && (
                    <div className="mt-2 text-xs text-blue-600">
                      Paper Trade ID: {decision.paperTradeId}
                    </div>
                  )}
                  {decision.backendId && (
                    <div className="text-xs text-green-600">
                      Stored in Backend: {decision.backendId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analysis History</CardTitle>
            <CardDescription>
              Last {Math.min(analysisHistory.length, 5)} analysis sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisHistory.slice(0, 5).map((session, index) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">
                      {session.finalRecommendation.recommendation} - {session.symbols.join(', ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.timestamp.toLocaleString()} • {session.finalRecommendation.confidence}% confidence
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.executed ? 'default' : 'secondary'} className="text-xs">
                      {session.executed ? 'Executed' : 'Not Executed'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {(session.consensus * 100).toFixed(0)}% consensus
                    </Badge>
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