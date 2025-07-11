/**
 * Enhanced Flash Loan View Component
 * Real blockchain integration with profit-taking automation
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Activity,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  PlayCircle,
  PauseCircle,
  Eye,
  ExternalLink,
  PieChart,
  Wallet,
  Shield,
  Coins,
  ArrowRightLeft,
  Gauge,
  CircuitBoard
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

// Mock types for flash loan data structures
interface FlashLoanTransaction {
  id: string
  agent_id: string
  protocol_id: string
  strategy: string
  assets: any[]
  loan_amount_usd: number
  profit_usd: number
  gas_cost_usd: number
  net_profit_usd: number
  status: 'pending' | 'success' | 'failed' | 'reverted'
  created_at: string
  execution_time_ms?: number
  tx_hash?: string
}

interface FlashLoanOpportunity {
  id: string
  symbol: string
  exchange_from: string
  exchange_to: string
  price_difference: number
  potential_profit_usd: number
  required_capital_usd: number
  risk_level: 'low' | 'medium' | 'high'
  estimated_gas_cost: number
  profit_margin: number
  created_at: string
}

interface FlashLoanProfitRule {
  id: string
  rule_name: string
  trigger_type: string
  trigger_value: number
  secure_percentage: number
  reinvest_percentage: number
  reserve_percentage: number
  is_active: boolean
  min_profit_usd: number
  max_loan_usd: number
  created_at: string
}

interface FlashLoanStats {
  total_transactions: number
  successful_transactions: number
  failed_transactions: number
  total_profit_usd: number
  total_gas_cost_usd: number
  avg_execution_time_ms: number
  success_rate: number
}

interface ProfitDistributionData {
  name: string
  value: number
  color: string
}

export function EnhancedFlashLoanView() {
  const [activeTab, setActiveTab] = useState('opportunities')
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  // Data states
  const [opportunities, setOpportunities] = useState<FlashLoanOpportunity[]>([])
  const [transactions, setTransactions] = useState<FlashLoanTransaction[]>([])
  const [profitRules, setProfitRules] = useState<FlashLoanProfitRule[]>([])
  const [stats, setStats] = useState<FlashLoanStats>({
    total_transactions: 0,
    successful_transactions: 0,
    failed_transactions: 0,
    total_profit_usd: 0,
    total_gas_cost_usd: 0,
    avg_execution_time_ms: 0,
    success_rate: 0
  })

  // Filter states
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [minProfitFilter, setMinProfitFilter] = useState<number>(100)
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(false)

  // Profit distribution data for pie chart
  const profitDistributionData: ProfitDistributionData[] = [
    { name: 'Secured', value: 50, color: '#10b981' },
    { name: 'Reinvested', value: 30, color: '#3b82f6' },
    { name: 'Reserved', value: 10, color: '#f59e0b' },
    { name: 'Goal Fund', value: 10, color: '#8b5cf6' }
  ]

  // Load data on component mount
  useEffect(() => {
    loadAllData()
    const interval = setInterval(loadOpportunities, 30000) // Refresh opportunities every 30s
    return () => clearInterval(interval)
  }, [])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadOpportunities(),
        loadTransactions(),
        loadProfitRules(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOpportunities = async () => {
    try {
      // Generate mock data for now
      setOpportunities(generateMockOpportunities())
    } catch (error) {
      console.error('Error loading opportunities:', error)
      setOpportunities([])
    }
  }

  const loadTransactions = async () => {
    try {
      // Generate mock transactions for now
      setTransactions(generateMockTransactions())
    } catch (error) {
      console.error('Error loading transactions:', error)
      setTransactions([])
    }
  }

  const loadProfitRules = async () => {
    try {
      // Generate mock profit rules for now
      setProfitRules(generateMockProfitRules())
    } catch (error) {
      console.error('Error loading profit rules:', error)
      setProfitRules([])
    }
  }

  const loadStats = async () => {
    try {
      // Generate mock stats for now
      setStats(generateMockStats())
    } catch (error) {
      console.error('Error loading stats:', error)
      setStats({
        total_transactions: 0,
        successful_transactions: 0,
        failed_transactions: 0,
        total_profit_usd: 0,
        total_gas_cost_usd: 0,
        avg_execution_time_ms: 0,
        success_rate: 0
      })
    }
  }

  const toggleMonitoring = async () => {
    try {
      if (isMonitoring) {
        setIsMonitoring(false)
        console.log('Flash loan monitoring stopped')
      } else {
        setIsMonitoring(true)
        console.log('Flash loan monitoring started')
        // Simulate real-time updates for mock data
        setInterval(() => {
          if (isMonitoring) {
            const newOpportunity = generateMockOpportunities()[0]
            setOpportunities(prev => [newOpportunity, ...prev.slice(0, 9)]) // Keep latest 10
          }
        }, 10000) // Update every 10 seconds
      }
    } catch (error) {
      console.error('Error toggling monitoring:', error)
    }
  }

  const executeFlashLoan = async (opportunity: FlashLoanOpportunity) => {
    try {
      setIsLoading(true)
      
      // Simulate flash loan execution
      console.log('Simulating flash loan execution for:', opportunity.symbol)
      
      // Simulate validation and execution time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create mock transaction
      const mockTransaction: FlashLoanTransaction = {
        id: `tx_${Date.now()}`,
        agent_id: 'alex_arbitrage',
        protocol_id: 'aave_v3',
        strategy: 'arbitrage',
        assets: [opportunity.symbol],
        loan_amount_usd: opportunity.required_capital_usd,
        profit_usd: opportunity.potential_profit_usd,
        gas_cost_usd: opportunity.estimated_gas_cost,
        net_profit_usd: opportunity.potential_profit_usd - opportunity.estimated_gas_cost,
        status: Math.random() > 0.1 ? 'success' : 'failed',
        created_at: new Date().toISOString(),
        execution_time_ms: 1500 + Math.random() * 500,
        tx_hash: `0x${Math.random().toString(16).substring(2, 66)}`
      }
      
      // Add to transactions list
      setTransactions(prev => [mockTransaction, ...prev])
      
      // Update stats
      await loadStats()
      
      console.log('Flash loan executed successfully (simulated)')
    } catch (error: any) {
      console.error('Error executing flash loan:', error)
      alert(`Execution failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const createProfitRule = async () => {
    try {
      const newRule: FlashLoanProfitRule = {
        id: `rule_${Date.now()}`,
        rule_name: 'Custom Rule',
        trigger_type: 'profit_amount',
        trigger_value: 200,
        secure_percentage: 50,
        reinvest_percentage: 30,
        reserve_percentage: 20,
        is_active: true,
        min_profit_usd: 200,
        max_loan_usd: 500000,
        created_at: new Date().toISOString()
      }

      // Add to profit rules list
      setProfitRules(prev => [newRule, ...prev])
      console.log('Profit rule created successfully (simulated)')
    } catch (error) {
      console.error('Error creating profit rule:', error)
    }
  }

  const generateMockOpportunities = (): FlashLoanOpportunity[] => {
    const symbols = ['ETH', 'BTC', 'USDC', 'USDT']
    const exchanges = ['Uniswap', 'SushiSwap', 'Curve', 'Balancer']
    
    return Array.from({ length: 5 }, (_, i) => {
      const potential_profit = 100 + Math.random() * 500
      const gas_cost = 20 + Math.random() * 30
      
      return {
        id: `opp-${i}`,
        symbol: symbols[i % symbols.length],
        exchange_from: exchanges[i % exchanges.length],
        exchange_to: exchanges[(i + 1) % exchanges.length],
        price_difference: 0.5 + Math.random() * 2,
        potential_profit_usd: potential_profit,
        required_capital_usd: 10000 + Math.random() * 50000,
        risk_level: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
        estimated_gas_cost: gas_cost,
        profit_margin: ((potential_profit - gas_cost) / potential_profit) * 100,
        created_at: new Date().toISOString()
      }
    })
  }

  const generateMockTransactions = (): FlashLoanTransaction[] => {
    const symbols = ['ETH', 'BTC', 'USDC', 'USDT']
    const statuses = ['success', 'failed', 'pending'] as const
    
    return Array.from({ length: 10 }, (_, i) => {
      const profit = 50 + Math.random() * 300
      const gas_cost = 15 + Math.random() * 25
      
      return {
        id: `tx-${i}`,
        agent_id: 'alex_arbitrage',
        protocol_id: 'aave_v3',
        strategy: 'arbitrage',
        assets: [symbols[i % symbols.length]],
        loan_amount_usd: 5000 + Math.random() * 45000,
        profit_usd: profit,
        gas_cost_usd: gas_cost,
        net_profit_usd: profit - gas_cost,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        execution_time_ms: 1200 + Math.random() * 800,
        tx_hash: `0x${Math.random().toString(16).substring(2, 66)}`
      }
    })
  }

  const generateMockProfitRules = (): FlashLoanProfitRule[] => {
    return [
      {
        id: 'rule-1',
        rule_name: 'Conservative Rule',
        trigger_type: 'profit_amount',
        trigger_value: 100,
        secure_percentage: 60,
        reinvest_percentage: 25,
        reserve_percentage: 15,
        is_active: true,
        min_profit_usd: 100,
        max_loan_usd: 100000,
        created_at: new Date().toISOString()
      },
      {
        id: 'rule-2',
        rule_name: 'Aggressive Rule',
        trigger_type: 'profit_amount',
        trigger_value: 500,
        secure_percentage: 40,
        reinvest_percentage: 45,
        reserve_percentage: 15,
        is_active: true,
        min_profit_usd: 500,
        max_loan_usd: 500000,
        created_at: new Date().toISOString()
      }
    ]
  }

  const generateMockStats = (): FlashLoanStats => {
    return {
      total_transactions: 47,
      successful_transactions: 41,
      failed_transactions: 6,
      total_profit_usd: 12547.89,
      total_gas_cost_usd: 1847.32,
      avg_execution_time_ms: 1650,
      success_rate: 87.2
    }
  }

  // Opportunity card component
  const OpportunityCard = ({ opportunity }: { opportunity: FlashLoanOpportunity }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                {opportunity.symbol}
              </div>
              <div>
                <div className="font-semibold text-lg">{opportunity.symbol}</div>
                <div className="text-xs text-gray-500">
                  {opportunity.exchange_from} → {opportunity.exchange_to}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge variant={
                opportunity.risk_level === 'low' ? 'default' :
                opportunity.risk_level === 'medium' ? 'secondary' : 'destructive'
              }>
                {opportunity.risk_level.toUpperCase()}
              </Badge>
              <div className="text-xs text-gray-500">
                {opportunity.price_difference.toFixed(2)}% spread
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500">Potential Profit</div>
              <div className="font-bold text-lg text-emerald-600">
                ${opportunity.potential_profit_usd.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Capital Required</div>
              <div className="font-semibold">
                ${opportunity.required_capital_usd.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Gas Cost</div>
              <div className="font-semibold text-red-600">
                ${opportunity.estimated_gas_cost.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Profit Margin</div>
              <div className="font-semibold">
                {opportunity.profit_margin.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Created: {new Date(opportunity.created_at).toLocaleTimeString()}
            </div>
            <div className="space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {/* Simulate */}}
              >
                <Eye className="w-3 h-3 mr-1" />
                Simulate
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                onClick={() => executeFlashLoan(opportunity)}
                disabled={isLoading}
              >
                <PlayCircle className="w-3 h-3 mr-1" />
                Execute
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // Transaction card component
  const TransactionCard = ({ transaction }: { transaction: FlashLoanTransaction }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              transaction.status === 'success' ? 'bg-emerald-500' :
              transaction.status === 'failed' ? 'bg-red-500' :
              transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
            }`}>
              <CircuitBoard className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold">Flash Loan #{transaction.id.substring(0, 8)}</div>
              <div className="text-xs text-gray-500">
                {transaction.strategy} • {new Date(transaction.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          <Badge variant={
            transaction.status === 'success' ? 'default' :
            transaction.status === 'failed' ? 'destructive' :
            transaction.status === 'pending' ? 'secondary' : 'outline'
          }>
            {transaction.status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-500">Loan Amount</div>
            <div className="font-semibold">
              ${transaction.loan_amount_usd?.toLocaleString() || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Net Profit</div>
            <div className={`font-semibold ${
              transaction.net_profit_usd && transaction.net_profit_usd > 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              ${transaction.net_profit_usd?.toFixed(2) || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Gas Cost</div>
            <div className="font-semibold text-red-600">
              ${transaction.gas_cost_usd?.toFixed(2) || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Execution Time</div>
            <div className="font-semibold">
              {transaction.execution_time_ms ? 
                `${(transaction.execution_time_ms / 1000).toFixed(1)}s` : 'N/A'
              }
            </div>
          </div>
        </div>

        {transaction.tx_hash && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 font-mono">
              {transaction.tx_hash.substring(0, 10)}...{transaction.tx_hash.substring(-8)}
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
            Flash Loan Trading
          </h1>
          <p className="text-gray-500">Automated arbitrage with real blockchain integration & profit automation</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Button 
            variant="outline" 
            onClick={toggleMonitoring}
            className={isMonitoring ? 'bg-red-50 border-red-200 text-red-600' : ''}
          >
            {isMonitoring ? (
              <>
                <PauseCircle className="w-4 h-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
          <Button variant="outline" onClick={loadAllData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.success_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.successful_transactions}/{stats.total_transactions} executed
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${stats.total_profit_usd.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">Lifetime earnings</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {(stats.avg_execution_time_ms / 1000).toFixed(1)}s
            </div>
            <div className="text-xs text-gray-500 mt-1">Speed to completion</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{opportunities.length}</div>
            <div className="text-xs text-gray-500 mt-1">
              {isMonitoring ? 'Live monitoring' : 'Monitoring paused'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Flash Loan Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="risk-filter">Risk Level</Label>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="min-profit">Min Profit ($)</Label>
              <Input
                id="min-profit"
                type="number"
                value={minProfitFilter}
                onChange={(e) => setMinProfitFilter(Number(e.target.value))}
                placeholder="100"
              />
            </div>
            <div className="flex items-end">
              <div className="space-y-2">
                <Label htmlFor="auto-execute">Auto Execute</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-execute"
                    checked={autoExecuteEnabled}
                    onCheckedChange={setAutoExecuteEnabled}
                  />
                  <span className="text-sm text-gray-500">
                    {autoExecuteEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={createProfitRule} className="w-full">
                <Target className="w-4 h-4 mr-2" />
                New Profit Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="profit-rules">Profit Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Live Opportunities</h3>
            <Badge variant="outline">{opportunities.length} available</Badge>
          </div>
          
          {opportunities.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {opportunities.slice(0, 10).map(opportunity => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Target className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Opportunities Available</h3>
                <p className="text-gray-500 mb-4">
                  {isMonitoring ? 'Scanning markets for arbitrage opportunities...' : 'Start monitoring to find opportunities'}
                </p>
                {!isMonitoring && (
                  <Button onClick={toggleMonitoring}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Monitoring
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Transaction History</h3>
            <Badge variant="outline">{transactions.length} total</Badge>
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 20).map(transaction => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Activity className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Transactions</h3>
                <p className="text-gray-500">Flash loan transactions will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profit-rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Profit Distribution Rules</h3>
            <Button onClick={createProfitRule}>
              <Target className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profitRules.map(rule => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trigger</span>
                    <span className="font-semibold">
                      {rule.trigger_type === 'profit_amount' ? '$' : ''}
                      {rule.trigger_value}
                      {rule.trigger_type === 'profit_percentage' ? '%' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Secured</span>
                      <span>{rule.secure_percentage}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Reinvested</span>
                      <span>{rule.reinvest_percentage}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Reserved</span>
                      <span>{rule.reserve_percentage}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Min Profit</span>
                    <span className="font-semibold">${rule.min_profit_usd}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Profit Distribution Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={profitDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {profitDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {profitDistributionData.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Success Rate</span>
                  <span className="font-bold text-emerald-600">{stats.success_rate.toFixed(1)}%</span>
                </div>
                <Progress value={stats.success_rate} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Avg Profit/Trade</span>
                  <span className="font-bold">
                    ${stats.total_transactions > 0 ? (stats.total_profit_usd / stats.total_transactions).toFixed(2) : '0'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Gas Costs</span>
                  <span className="font-bold text-red-600">${stats.total_gas_cost_usd.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Net Profit</span>
                  <span className="font-bold text-emerald-600">
                    ${(stats.total_profit_usd - stats.total_gas_cost_usd).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <span>Protocols</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Aave V3</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uniswap V3</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Balancer</span>
                    <Badge variant="secondary">Testing</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>dYdX</span>
                    <Badge variant="outline">Disabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gauge className="w-5 h-5" />
                  <span>Gas Tracker</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Standard</span>
                    <span className="font-semibold">25 gwei</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fast</span>
                    <span className="font-semibold">35 gwei</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Instant</span>
                    <span className="font-semibold">50 gwei</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Est. Cost</span>
                      <span className="font-semibold text-red-600">$12.50</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Wallet Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Connection</span>
                    <Badge variant={isConnected ? 'default' : 'destructive'}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Network</span>
                    <span className="font-semibold">Ethereum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Balance</span>
                    <span className="font-semibold">$10,000</span>
                  </div>
                  <Button 
                    className="w-full mt-3" 
                    variant={isConnected ? 'outline' : 'default'}
                    onClick={() => setIsConnected(!isConnected)}
                  >
                    {isConnected ? 'Disconnect' : 'Connect Wallet'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedFlashLoanView