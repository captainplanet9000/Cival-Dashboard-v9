'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Wallet, Shield, TrendingUp, DollarSign, Activity, 
  RefreshCw, BarChart3, PieChart, Target, Users
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { motion } from 'framer-motion'
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import RealPortfolioAnalyticsDashboard from '@/components/portfolio/RealPortfolioAnalyticsDashboard'

interface ConnectedVaultTabProps {
  className?: string
}

export function ConnectedVaultTab({ className }: ConnectedVaultTabProps) {
  const { state, actions } = useDashboardConnection('vault')
  const [vaultSubTab, setVaultSubTab] = useState('overview')
  
  // Calculate vault metrics from state
  const vaultMetrics = {
    totalAssets: state.portfolioValue,
    availableCash: state.portfolioValue * 0.15, // Mock 15% cash
    investedAmount: state.portfolioValue * 0.85, // Mock 85% invested
    totalPnL: state.totalPnL,
    dailyPnL: state.dailyPnL,
    weeklyPnL: state.weeklyPnL,
    monthlyPnL: state.monthlyPnL
  }
  
  // Asset allocation data
  const assetAllocation = [
    { name: 'Crypto', value: state.portfolioValue * 0.45, percentage: 45, color: '#3B82F6' },
    { name: 'Stocks', value: state.portfolioValue * 0.25, percentage: 25, color: '#10B981' },
    { name: 'Forex', value: state.portfolioValue * 0.15, percentage: 15, color: '#F59E0B' },
    { name: 'Cash', value: state.portfolioValue * 0.15, percentage: 15, color: '#6B7280' }
  ]
  
  // Agent contribution data
  const agentContributions = Array.from(state.agentPerformance.values()).map(agent => ({
    name: agent.name.split(' ')[0],
    value: agent.portfolioValue,
    pnl: agent.pnl,
    percentage: (agent.portfolioValue / state.portfolioValue) * 100
  }))
  
  // Portfolio overview panel
  const PortfolioOverviewPanel = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${vaultMetrics.totalAssets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Portfolio value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${vaultMetrics.availableCash.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to invest
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${vaultMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {vaultMetrics.totalPnL >= 0 ? '+' : ''}${vaultMetrics.totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${vaultMetrics.monthlyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {((vaultMetrics.monthlyPnL / (state.totalAgents * 10000)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Distribution across asset classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {assetAllocation.map((asset, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: asset.color }}
                  />
                  <span className="text-sm">{asset.name} ({asset.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Agent Contributions</CardTitle>
            <CardDescription>Portfolio value by agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentContributions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                  />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Timeline</CardTitle>
          <CardDescription>P&L breakdown across time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Daily P&L</span>
                <span className={`text-sm font-medium ${vaultMetrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {vaultMetrics.dailyPnL >= 0 ? '+' : ''}${vaultMetrics.dailyPnL.toFixed(2)}
                </span>
              </div>
              <Progress 
                value={Math.min(Math.abs(vaultMetrics.dailyPnL / 1000) * 100, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Weekly P&L</span>
                <span className={`text-sm font-medium ${vaultMetrics.weeklyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {vaultMetrics.weeklyPnL >= 0 ? '+' : ''}${vaultMetrics.weeklyPnL.toFixed(2)}
                </span>
              </div>
              <Progress 
                value={Math.min(Math.abs(vaultMetrics.weeklyPnL / 5000) * 100, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly P&L</span>
                <span className={`text-sm font-medium ${vaultMetrics.monthlyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {vaultMetrics.monthlyPnL >= 0 ? '+' : ''}${vaultMetrics.monthlyPnL.toFixed(2)}
                </span>
              </div>
              <Progress 
                value={Math.min(Math.abs(vaultMetrics.monthlyPnL / 10000) * 100, 100)} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Multi-chain wallets panel
  const MultiChainWalletsPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Ethereum', balance: '$45,230', assets: '12 tokens', network: 'ETH', color: 'bg-blue-100 text-blue-800' },
          { name: 'Binance Smart Chain', balance: '$28,450', assets: '8 tokens', network: 'BSC', color: 'bg-yellow-100 text-yellow-800' },
          { name: 'Polygon', balance: '$15,320', assets: '15 tokens', network: 'MATIC', color: 'bg-purple-100 text-purple-800' },
          { name: 'Solana', balance: '$22,100', assets: '6 tokens', network: 'SOL', color: 'bg-green-100 text-green-800' },
          { name: 'Avalanche', balance: '$12,890', assets: '4 tokens', network: 'AVAX', color: 'bg-red-100 text-red-800' },
          { name: 'Arbitrum', balance: '$8,750', assets: '7 tokens', network: 'ARB', color: 'bg-indigo-100 text-indigo-800' }
        ].map((wallet, index) => (
          <motion.div
            key={wallet.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{wallet.name}</CardTitle>
                  <Badge className={wallet.color}>{wallet.network}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{wallet.balance}</div>
                  <p className="text-xs text-muted-foreground">{wallet.assets}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Send
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Receive
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Cross-Chain Analytics</CardTitle>
          <CardDescription>Performance across different blockchain networks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center p-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Multi-chain wallet integration coming soon</p>
              <p className="text-sm">Connect external wallets for comprehensive portfolio tracking</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // DeFi operations panel
  const DeFiOperationsPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Pools</CardTitle>
            <CardDescription>Active liquidity positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { pair: 'ETH/USDC', apy: '12.5%', liquidity: '$25,000', rewards: '$125.30' },
                { pair: 'BTC/ETH', apy: '8.2%', liquidity: '$18,500', rewards: '$89.45' },
                { pair: 'MATIC/USDT', apy: '15.7%', liquidity: '$12,000', rewards: '$156.80' }
              ].map((pool, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{pool.pair}</div>
                    <div className="text-sm text-muted-foreground">APY: {pool.apy}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{pool.liquidity}</div>
                    <div className="text-sm text-green-600">+{pool.rewards}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Staking Positions</CardTitle>
            <CardDescription>Staked assets and rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { asset: 'ETH 2.0', amount: '5.2 ETH', apy: '4.5%', rewards: '0.234 ETH' },
                { asset: 'MATIC', amount: '15,000 MATIC', apy: '7.8%', rewards: '1,170 MATIC' },
                { asset: 'SOL', amount: '100 SOL', apy: '6.2%', rewards: '6.2 SOL' }
              ].map((stake, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{stake.asset}</div>
                    <div className="text-sm text-muted-foreground">APY: {stake.apy}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{stake.amount}</div>
                    <div className="text-sm text-green-600">+{stake.rewards}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>DeFi Opportunities</CardTitle>
          <CardDescription>Recommended yield farming and staking opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>DeFi integration in development</p>
            <p className="text-sm">Automated yield farming and staking coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  const vaultSubTabs = [
    { id: 'overview', label: 'Portfolio Overview', component: <PortfolioOverviewPanel /> },
    { id: 'analytics', label: 'Analytics', component: <RealPortfolioAnalyticsDashboard /> },
    { id: 'wallets', label: 'Multi-Chain Wallets', component: <MultiChainWalletsPanel /> },
    { id: 'defi', label: 'DeFi Operations', component: <DeFiOperationsPanel /> }
  ]
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Vault & Portfolio Management
            </CardTitle>
            <CardDescription>
              Comprehensive portfolio tracking and multi-chain asset management
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              ${vaultMetrics.totalAssets.toLocaleString()} managed
            </Badge>
            <Button size="sm" variant="ghost" onClick={actions.refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={vaultSubTab} onValueChange={setVaultSubTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            {vaultSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {vaultSubTabs.map((tab) => (
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

export default ConnectedVaultTab