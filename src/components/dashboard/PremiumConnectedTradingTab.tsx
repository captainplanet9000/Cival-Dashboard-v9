'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, BarChart3, Target, Activity, Zap, RefreshCw,
  DollarSign, Bot, PieChart, Settings, Shield
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useDashboardConnection } from './DashboardTabConnector'

// Import Premium Trading Components
import EnhancedTradingInterface from '@/components/premium-ui/trading/enhanced-trading-interface'
import AdvancedOrderEntry from '@/components/premium-ui/trading/advanced-order-entry'
import AdvancedOrderbook from '@/components/premium-ui/trading/advanced-orderbook'
import PremiumTradingCharts from '@/components/premium-ui/charts/premium-trading-charts'
import AdvancedPortfolioAnalytics from '@/components/premium-ui/portfolio/advanced-portfolio-analytics'
import VisualStrategyBuilder from '@/components/premium-ui/strategy/visual-strategy-builder'
import RiskManagementSuite from '@/components/premium-ui/compliance/risk-management-suite'

// Import existing components as fallbacks
import RealTradingInterface from '@/components/trading/RealTradingInterface'
import TradingCharts from '@/components/trading/TradingCharts'
import RealBacktestingDashboard from '@/components/backtesting/RealBacktestingDashboard'
import RealRiskManagementDashboard from '@/components/risk/RealRiskManagementDashboard'

interface PremiumConnectedTradingTabProps {
  className?: string
}

export function PremiumConnectedTradingTab({ className }: PremiumConnectedTradingTabProps) {
  const { state, actions } = useDashboardConnection('trading')
  const [tradingSubTab, setTradingSubTab] = useState('enhanced-interface')

  // Trading panel with premium order entry
  const PremiumTradingPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Premium Order Entry</CardTitle>
              <CardDescription>Advanced order placement with smart routing</CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedOrderEntry 
                onOrderSubmit={(order) => {
                  actions.placeOrder('premium', order)
                }}
                marketData={state.marketPrices}
                portfolioBalance={state.portfolioValue}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Order Book</CardTitle>
              <CardDescription>Real-time market depth visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedOrderbook 
                symbol="BTC/USD"
                marketData={state.marketPrices}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Enhanced Trading Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Trading Interface</CardTitle>
          <CardDescription>Professional-grade trading terminal</CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedTradingInterface />
        </CardContent>
      </Card>
    </div>
  )

  // Premium charts panel
  const PremiumChartsPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Premium Trading Charts</CardTitle>
          <CardDescription>Advanced charting with professional indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <PremiumTradingCharts
              symbol="BTC/USD"
              timeframe="1h"
              indicators={['SMA', 'EMA', 'RSI', 'MACD']}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Portfolio analytics panel
  const PremiumPortfolioPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Portfolio Analytics</CardTitle>
          <CardDescription>Comprehensive portfolio performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <AdvancedPortfolioAnalytics
            portfolioData={{
              totalValue: state.portfolioValue,
              totalPnL: state.totalPnL,
              positions: state.openPositions,
              trades: state.executedOrders
            }}
          />
        </CardContent>
      </Card>
    </div>
  )

  // Strategy builder panel
  const StrategyBuilderPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visual Strategy Builder</CardTitle>
          <CardDescription>Drag-and-drop strategy creation</CardDescription>
        </CardHeader>
        <CardContent>
          <VisualStrategyBuilder
            onStrategyCreate={(strategy) => {
              console.log('New strategy created:', strategy)
            }}
            availableIndicators={['SMA', 'EMA', 'RSI', 'MACD', 'BB']}
          />
        </CardContent>
      </Card>
    </div>
  )

  // Risk management panel
  const PremiumRiskPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Risk Management Suite</CardTitle>
          <CardDescription>Advanced risk monitoring and compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <RiskManagementSuite
            portfolioData={{
              totalValue: state.portfolioValue,
              positions: state.openPositions,
              dailyPnL: state.dailyPnL
            }}
          />
        </CardContent>
      </Card>
    </div>
  )

  const tradingSubTabs = [
    { 
      id: 'enhanced-interface', 
      label: 'Enhanced Trading', 
      component: <PremiumTradingPanel />,
      icon: <Zap className="h-4 w-4" />,
      premium: true
    },
    { 
      id: 'premium-charts', 
      label: 'Premium Charts', 
      component: <PremiumChartsPanel />,
      icon: <BarChart3 className="h-4 w-4" />,
      premium: true
    },
    { 
      id: 'portfolio-analytics', 
      label: 'Portfolio Analytics', 
      component: <PremiumPortfolioPanel />,
      icon: <PieChart className="h-4 w-4" />,
      premium: true
    },
    { 
      id: 'strategy-builder', 
      label: 'Strategy Builder', 
      component: <StrategyBuilderPanel />,
      icon: <Target className="h-4 w-4" />,
      premium: true
    },
    { 
      id: 'risk-suite', 
      label: 'Risk Suite', 
      component: <PremiumRiskPanel />,
      icon: <Shield className="h-4 w-4" />,
      premium: true
    },
    { 
      id: 'real-trading', 
      label: 'Real Trading', 
      component: <RealTradingInterface />,
      icon: <TrendingUp className="h-4 w-4" />,
      premium: false
    },
    { 
      id: 'basic-charts', 
      label: 'Basic Charts', 
      component: <TradingCharts />,
      icon: <Activity className="h-4 w-4" />,
      premium: false
    },
    { 
      id: 'backtesting', 
      label: 'Backtesting', 
      component: <RealBacktestingDashboard />,
      icon: <Settings className="h-4 w-4" />,
      premium: false
    },
    { 
      id: 'risk-management', 
      label: 'Risk Monitor', 
      component: <RealRiskManagementDashboard />,
      icon: <Shield className="h-4 w-4" />,
      premium: false
    }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Premium Trading Terminal
            </CardTitle>
            <CardDescription>
              Professional-grade trading interface with advanced features
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800">
              Premium Features
            </Badge>
            <Badge variant="outline" className="text-xs">
              ${state.portfolioValue.toLocaleString()} capital
            </Badge>
            <Button size="sm" variant="ghost" onClick={actions.refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tradingSubTab} onValueChange={setTradingSubTab} className="space-y-4">
          <div className="space-y-2">
            {/* Premium tabs row */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-2 rounded-lg">
              <div className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Premium Features
              </div>
              <TabsList className="grid w-full grid-cols-5 gap-1">
                {tradingSubTabs.filter(tab => tab.premium).map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-amber-400 data-[state=active]:text-white text-xs flex items-center gap-1"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {/* Standard tabs row */}
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-xs font-medium text-gray-600 mb-2">Standard Features</div>
              <TabsList className="grid w-full grid-cols-4 gap-1">
                {tradingSubTabs.filter(tab => !tab.premium).map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs flex items-center gap-1"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
          
          {tradingSubTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {tab.component}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default PremiumConnectedTradingTab