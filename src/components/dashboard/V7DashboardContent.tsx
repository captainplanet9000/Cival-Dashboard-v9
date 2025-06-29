'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  DollarSign, 
  Bot,
  Activity,
  ArrowRight,
  Target,
  BarChart3,
  Brain
} from 'lucide-react'
import { getMockDataService } from '@/lib/mock/comprehensive-mock-data'
import ChainlinkMarketData from '@/components/paper-trading/ChainlinkMarketData'

export default function V7DashboardContent() {
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null)
  const [agentData, setAgentData] = useState<any[]>([])
  const [marketSummary, setMarketSummary] = useState<any>(null)
  
  const mockService = getMockDataService()

  useEffect(() => {
    // Load initial data
    setPortfolioSummary(mockService.getPortfolioSummary())
    setAgentData(mockService.getAgentPerformance())
    setMarketSummary(mockService.getMarketSummary())

    // Update data every 5 seconds
    const interval = setInterval(() => {
      setPortfolioSummary(mockService.getPortfolioSummary())
      setMarketSummary(mockService.getMarketSummary())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Chainlink Price Feeds - Main Feature */}
      <ChainlinkMarketData className="w-full" />
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">✅ Online</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paper Trading</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Ready</div>
            <p className="text-xs text-muted-foreground">
              Complete simulation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mock Data</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Live</div>
            <p className="text-xs text-muted-foreground">
              Real-time updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
            <Bot className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{agentData.length}</div>
            <p className="text-xs text-muted-foreground">
              Agents available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Paper Trading System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete trading simulation with real-time mock data, AI agents, and portfolio management.
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                30+ Mock trading pairs with live price updates
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Portfolio tracking with P&L calculation
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                AI agents with persistent memory and learning
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Real-time agent thoughts and decision tracking
              </li>
            </ul>
            {portfolioSummary && (
              <div className="pt-2 border-t">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Portfolio Value:</span>
                    <span className="font-medium">${portfolioSummary.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total P&L:</span>
                    <span className={`font-medium ${portfolioSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${portfolioSummary.totalPnL.toLocaleString()} ({portfolioSummary.totalPnLPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Button className="w-full" asChild>
              <a href="/dashboard/paper-trading">
                Launch Paper Trading
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI Memory System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Advanced AI memory system with persistent learning and real-time decision tracking.
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                ✅ Persistent memory system with local storage
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                ✅ Real-time agent thoughts and decision tracking
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                ✅ Memory connections and learning algorithms
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                ✅ Live memory updates and background processing
              </li>
            </ul>
            {marketSummary && (
              <div className="pt-2 border-t">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Market Trend:</span>
                    <span className={`font-medium capitalize ${
                      marketSummary.marketTrend === 'bullish' ? 'text-green-600' : 
                      marketSummary.marketTrend === 'bearish' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {marketSummary.marketTrend}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Pairs:</span>
                    <span className="font-medium">30+ symbols</span>
                  </div>
                </div>
              </div>
            )}
            <Badge variant="outline" className="w-full justify-center">
              <Activity className="w-4 h-4 mr-1" />
              All Systems Operational
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="w-full h-20 flex flex-col" asChild>
              <a href="/dashboard/paper-trading">
                <Target className="w-6 h-6 mb-2" />
                Paper Trading
              </a>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col" asChild>
              <a href="/dashboard/agent-memory">
                <Bot className="w-6 h-6 mb-2" />
                AI Agent Memory
              </a>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col" disabled>
              <TrendingUp className="w-6 h-6 mb-2" />
              Analytics
              <span className="text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col" disabled>
              <BarChart3 className="w-6 h-6 mb-2" />
              Advanced Features
              <span className="text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}