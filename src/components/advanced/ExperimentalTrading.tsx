'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Target,
  Activity,
  DollarSign,
  Clock,
  BarChart3
} from 'lucide-react'

export function ExperimentalTrading() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const experimentalStrategies = [
    {
      name: 'Quantum Momentum',
      description: 'Advanced quantum-inspired momentum trading with ML predictions',
      status: 'experimental',
      riskLevel: 'high',
      performance: '+15.2%',
      trades: 847,
      winRate: '68%'
    },
    {
      name: 'Neural Arbitrage',
      description: 'Deep learning arbitrage detection across multiple exchanges',
      status: 'testing',
      riskLevel: 'medium',
      performance: '+8.7%',
      trades: 234,
      winRate: '72%'
    },
    {
      name: 'Adaptive Grid',
      description: 'Self-adjusting grid trading with dynamic parameter optimization',
      status: 'stable',
      riskLevel: 'low',
      performance: '+4.3%',
      trades: 1205,
      winRate: '64%'
    }
  ]

  const experimentalFeatures = [
    {
      name: 'High-Frequency Execution',
      description: 'Sub-millisecond order execution with co-location support',
      enabled: false,
      risk: 'Very High - Can cause significant losses'
    },
    {
      name: 'Cross-Exchange Arbitrage',
      description: 'Automated arbitrage across multiple exchanges',
      enabled: false,
      risk: 'High - Network latency sensitive'
    },
    {
      name: 'ML Price Prediction',
      description: 'Machine learning models for price movement prediction',
      enabled: false,
      risk: 'Medium - Model accuracy varies'
    },
    {
      name: 'Options Strategy Engine',
      description: 'Automated options trading strategies',
      enabled: false,
      risk: 'Very High - Complex derivatives'
    }
  ]

  const toggleExperimentalTrading = () => {
    if (!isRunning) {
      setIsRunning(true)
      // Simulate progress
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += 10
        setProgress(currentProgress)
        if (currentProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsRunning(false)
            setProgress(0)
          }, 1000)
        }
      }, 200)
    } else {
      setIsRunning(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>High Risk:</strong> These trading features are experimental and can result in
          significant financial losses. Only use with money you can afford to lose.
        </AlertDescription>
      </Alert>

      {/* Experimental Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Experimental Trading Strategies
          </CardTitle>
          <CardDescription>
            Advanced AI-powered trading strategies under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {experimentalStrategies.map((strategy, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{strategy.name}</h4>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={strategy.status === 'stable' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {strategy.status}
                    </Badge>
                    <Badge 
                      variant={strategy.riskLevel === 'high' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {strategy.riskLevel} risk
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="text-center">
                    <div className="text-sm font-medium flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {strategy.performance}
                    </div>
                    <div className="text-xs text-muted-foreground">Performance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium flex items-center justify-center gap-1">
                      <Activity className="h-3 w-3" />
                      {strategy.trades}
                    </div>
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium flex items-center justify-center gap-1">
                      <Target className="h-3 w-3" />
                      {strategy.winRate}
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Experimental Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Experimental Features
          </CardTitle>
          <CardDescription>
            Advanced trading features with high risk/reward potential
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {experimentalFeatures.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{feature.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-yellow-600">{feature.risk}</span>
                  </div>
                </div>
                <Button 
                  variant={feature.enabled ? "destructive" : "outline"}
                  size="sm"
                  disabled
                >
                  {feature.enabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trading Test Environment
          </CardTitle>
          <CardDescription>
            Safe environment for testing experimental trading strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Test Environment Status</span>
              <Badge variant={isRunning ? 'default' : 'secondary'}>
                {isRunning ? 'Running' : 'Stopped'}
              </Badge>
            </div>
            
            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Paper Trading Balance</div>
              <div className="text-2xl font-bold text-green-600">$10,000</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Test Duration</div>
              <div className="text-2xl font-bold">24h</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={toggleExperimentalTrading}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              {isRunning ? 'Running Test...' : 'Start Test Trading'}
            </Button>
            <Button variant="outline" disabled>
              <DollarSign className="h-4 w-4 mr-2" />
              View Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}