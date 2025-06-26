'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Minus,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Globe,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target
} from 'lucide-react'

// Lazy load service to prevent circular dependencies

interface VaultData {
  id: string
  name: string
  agentId: string
  network: string
  address: string
  balance: {
    total: number
    available: number
    locked: number
    staked: number
  }
  performance: {
    totalValue: number
    totalPnL: number
    totalPnLPercent: number
    dailyPnL: number
    dailyPnLPercent: number
    apy: number
  }
  positions: Array<{
    protocol: string
    type: string
    amount: number
    value: number
    apy: number
    status: string
  }>
  transactions: Array<{
    id: string
    type: string
    amount: number
    timestamp: number
    status: string
    txHash: string
  }>
  status: 'active' | 'inactive' | 'error'
  lastUpdate: number
}

interface VaultStats {
  totalVaults: number
  activeVaults: number
  totalValue: number
  totalPnL: number
  totalPnLPercent: number
  averageAPY: number
  networkDistribution: Record<string, number>
  protocolDistribution: Record<string, number>
  topPerformers: VaultData[]
  recentTransactions: Array<{
    vaultId: string
    type: string
    amount: number
    timestamp: number
    status: string
  }>
}

const networkColors = {
  'sepolia': 'bg-blue-500',
  'polygon-mumbai': 'bg-purple-500',
  'bsc-testnet': 'bg-yellow-500',
  'ethereum': 'bg-gray-500'
}

const networkNames = {
  'sepolia': 'Sepolia',
  'polygon-mumbai': 'Polygon Mumbai',
  'bsc-testnet': 'BSC Testnet',
  'ethereum': 'Ethereum'
}

export function VaultIntegrationPanel() {
  const [vaults, setVaults] = useState<VaultData[]>([])
  const [stats, setStats] = useState<VaultStats>({
    totalVaults: 0,
    activeVaults: 0,
    totalValue: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    averageAPY: 0,
    networkDistribution: {},
    protocolDistribution: {},
    topPerformers: [],
    recentTransactions: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')

  useEffect(() => {
    const updateVaultData = async () => {
      try {
        // Lazy load the service to prevent circular dependencies
        const { vaultIntegrationService } = await import('@/lib/vault/VaultIntegrationService')
        
        // Get all vaults
        const allVaults = await vaultIntegrationService.getAllVaults()
        setVaults(allVaults)
        
        // Get vault statistics
        const vaultStats = await vaultIntegrationService.getVaultStats()
        setStats(vaultStats)
      } catch (error) {
        console.error('Failed to fetch vault data:', error)
      } finally {
        setLoading(false)
      }
    }

    updateVaultData()
    const interval = setInterval(updateVaultData, 15000) // Update every 15 seconds

    return () => clearInterval(interval)
  }, [])

  const filteredVaults = selectedNetwork === 'all' 
    ? vaults 
    : vaults.filter(vault => vault.network === selectedNetwork)

  const networks = Array.from(new Set(vaults.map(vault => vault.network)))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(percent / 100)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vault Integration Panel
          </CardTitle>
          <CardDescription>Loading vault integration status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Vault Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vault Integration Overview
          </CardTitle>
          <CardDescription>
            Multi-network DeFi vault management and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.totalVaults}</div>
              <div className="text-sm text-muted-foreground">Total Vaults</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.activeVaults}</div>
              <div className="text-sm text-muted-foreground">Active Vaults</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{formatCurrency(stats.totalValue)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(stats.totalPnL)}
              </div>
              <div className="text-sm text-muted-foreground">Total P&L</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.totalPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(stats.totalPnLPercent)}
              </div>
              <div className="text-sm text-muted-foreground">P&L %</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{formatPercent(stats.averageAPY)}</div>
              <div className="text-sm text-muted-foreground">Avg APY</div>
            </div>
          </div>

          {/* Performance Progress */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Portfolio Performance</span>
                <span className={stats.totalPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.totalPnLPercent >= 0 ? '+' : ''}{formatPercent(stats.totalPnLPercent)}
                </span>
              </div>
              <Progress 
                value={Math.min(Math.abs(stats.totalPnLPercent), 100)} 
                className={`h-2 ${stats.totalPnLPercent >= 0 ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vaults by Network */}
      <Tabs value={selectedNetwork} onValueChange={setSelectedNetwork}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
          <TabsTrigger value="all">All Networks</TabsTrigger>
          {networks.map(network => (
            <TabsTrigger key={network} value={network} className="capitalize">
              {networkNames[network as keyof typeof networkNames] || network}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedNetwork} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVaults.map((vault) => {
              const networkColor = networkColors[vault.network as keyof typeof networkColors] || 'bg-gray-500'
              
              return (
                <motion.div
                  key={vault.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${networkColor}`}>
                            <Wallet className="h-3 w-3 text-white" />
                          </div>
                          {vault.name}
                        </div>
                        <Badge variant={vault.status === 'active' ? 'default' : 'destructive'}>
                          {vault.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Agent: {vault.agentId} • {networkNames[vault.network as keyof typeof networkNames]}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Balance Info */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Balance</span>
                            <span className="font-medium">{formatCurrency(vault.balance.total)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Available</span>
                            <span>{formatCurrency(vault.balance.available)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Staked</span>
                            <span>{formatCurrency(vault.balance.staked)}</span>
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="space-y-2 border-t pt-2">
                          <div className="flex justify-between text-sm">
                            <span>Total P&L</span>
                            <span className={`flex items-center gap-1 ${vault.performance.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {vault.performance.totalPnL >= 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {formatCurrency(Math.abs(vault.performance.totalPnL))}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>APY</span>
                            <span className="text-orange-500">{formatPercent(vault.performance.apy)}</span>
                          </div>
                        </div>

                        {/* Active Positions */}
                        <div className="space-y-2 border-t pt-2">
                          <div className="text-xs font-medium">Active Positions ({vault.positions.length})</div>
                          {vault.positions.slice(0, 3).map((position, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span>{position.protocol}</span>
                              <span>{formatCurrency(position.value)}</span>
                            </div>
                          ))}
                          {vault.positions.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{vault.positions.length - 3} more positions
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                          <span>Last Update</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(vault.lastUpdate).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top Performing Vaults
          </CardTitle>
          <CardDescription>
            Best performing vaults by total return
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topPerformers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No vault performance data available
              </div>
            ) : (
              stats.topPerformers.slice(0, 5).map((vault, index) => (
                <div key={vault.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">#{index + 1}</div>
                    <div className={`p-1 rounded ${networkColors[vault.network as keyof typeof networkColors] || 'bg-gray-500'}`}>
                      <Wallet className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{vault.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {networkNames[vault.network as keyof typeof networkNames]} • Agent: {vault.agentId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${vault.performance.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercent(vault.performance.totalPnLPercent)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(vault.performance.totalValue)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Vault Transactions
          </CardTitle>
          <CardDescription>
            Latest DeFi transactions across all vaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent transactions
              </div>
            ) : (
              stats.recentTransactions.slice(0, 10).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded ${transaction.type === 'deposit' || transaction.type === 'stake' ? 'bg-green-500' : 'bg-blue-500'}`}>
                      {transaction.type === 'deposit' || transaction.type === 'stake' ? (
                        <Plus className="h-3 w-3 text-white" />
                      ) : (
                        <Minus className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm capitalize">{transaction.type}</div>
                      <div className="text-xs text-muted-foreground">Vault: {transaction.vaultId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(transaction.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}