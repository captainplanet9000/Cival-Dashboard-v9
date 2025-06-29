'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown'
import {
  Activity, Download, Filter, RefreshCw, Search, TrendingUp, TrendingDown,
  Calendar, Clock, DollarSign, Hash, User, FileText, BarChart3
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { Order } from '@/lib/trading/real-paper-trading-engine'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface ConnectedHistoryTabProps {
  className?: string
}

export function ConnectedHistoryTab({ className }: ConnectedHistoryTabProps) {
  const { state, actions } = useDashboardConnection('history')
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    symbol: 'all',
    side: 'all',
    agent: 'all',
    dateRange: 'all',
    status: 'all'
  })
  
  const [sortBy, setSortBy] = useState<'time' | 'symbol' | 'pnl' | 'quantity'>('time')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Combine all orders (executed and pending)
  const allOrders = useMemo(() => {
    return [...state.executedOrders, ...state.pendingOrders].sort((a, b) => {
      const aTime = a.timestamp.getTime()
      const bTime = b.timestamp.getTime()
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
    })
  }, [state.executedOrders, state.pendingOrders, sortOrder])
  
  // Calculate P&L for each order
  const ordersWithPnL = useMemo(() => {
    return allOrders.map(order => {
      const currentPrice = state.marketPrices.get(order.symbol) || order.price
      const pnl = order.status === 'filled' 
        ? (order.side === 'buy' 
          ? (currentPrice - order.price) * order.quantity
          : (order.price - currentPrice) * order.quantity)
        : 0
      
      return { ...order, pnl, currentPrice }
    })
  }, [allOrders, state.marketPrices])
  
  // Apply filters
  const filteredOrders = useMemo(() => {
    return ordersWithPnL.filter(order => {
      if (filters.search && !order.symbol.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      if (filters.symbol !== 'all' && order.symbol !== filters.symbol) {
        return false
      }
      if (filters.side !== 'all' && order.side !== filters.side) {
        return false
      }
      if (filters.agent !== 'all' && order.agentId !== filters.agent) {
        return false
      }
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false
      }
      return true
    })
  }, [ordersWithPnL, filters])
  
  // Sort filtered orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      switch (sortBy) {
        case 'symbol':
          return sortOrder === 'asc' 
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol)
        case 'pnl':
          return sortOrder === 'asc' ? a.pnl - b.pnl : b.pnl - a.pnl
        case 'quantity':
          return sortOrder === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity
        case 'time':
        default:
          return sortOrder === 'asc' 
            ? a.timestamp.getTime() - b.timestamp.getTime()
            : b.timestamp.getTime() - a.timestamp.getTime()
      }
    })
  }, [filteredOrders, sortBy, sortOrder])
  
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const filledOrders = sortedOrders.filter(o => o.status === 'filled')
    const totalPnL = filledOrders.reduce((sum, order) => sum + order.pnl, 0)
    const winningTrades = filledOrders.filter(o => o.pnl > 0).length
    const losingTrades = filledOrders.filter(o => o.pnl < 0).length
    const avgWin = winningTrades > 0 
      ? filledOrders.filter(o => o.pnl > 0).reduce((sum, o) => sum + o.pnl, 0) / winningTrades
      : 0
    const avgLoss = losingTrades > 0
      ? filledOrders.filter(o => o.pnl < 0).reduce((sum, o) => sum + o.pnl, 0) / losingTrades
      : 0
    
    return {
      totalOrders: sortedOrders.length,
      filledOrders: filledOrders.length,
      pendingOrders: sortedOrders.filter(o => o.status === 'pending').length,
      totalPnL,
      winningTrades,
      losingTrades,
      winRate: filledOrders.length > 0 ? (winningTrades / filledOrders.length) * 100 : 0,
      avgWin,
      avgLoss,
      profitFactor: avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0
    }
  }, [sortedOrders])
  
  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Symbol', 'Side', 'Quantity', 'Price', 'Status', 'P&L', 'Agent']
    const rows = sortedOrders.map(order => [
      format(order.timestamp, 'yyyy-MM-dd'),
      format(order.timestamp, 'HH:mm:ss'),
      order.symbol,
      order.side.toUpperCase(),
      order.quantity,
      order.price.toFixed(2),
      order.status,
      order.pnl.toFixed(2),
      state.agentPerformance.get(order.agentId)?.name || 'Unknown'
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trading_history_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trading History</h2>
          <p className="text-muted-foreground">
            Comprehensive record of all trading activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={actions.refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.filledOrders} filled • {summaryStats.pendingOrders} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summaryStats.totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {summaryStats.filledOrders} trades
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.winningTrades}W • {summaryStats.losingTrades}L
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Win</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summaryStats.avgWin.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per winning trade
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${Math.abs(summaryStats.avgLoss).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per losing trade
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Profit Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.profitFactor.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Win/Loss ratio
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Symbol..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label>Symbol</Label>
              <Select value={filters.symbol} onValueChange={(v) => setFilters({...filters, symbol: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Symbols</SelectItem>
                  {Array.from(state.marketPrices.keys()).map(symbol => (
                    <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Side</Label>
              <Select value={filters.side} onValueChange={(v) => setFilters({...filters, side: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sides</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Agent</Label>
              <Select value={filters.agent} onValueChange={(v) => setFilters({...filters, agent: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {Array.from(state.agentPerformance.values()).map(agent => (
                    <SelectItem key={agent.agentId} value={agent.agentId}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="symbol">Symbol</SelectItem>
                  <SelectItem value="pnl">P&L</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Trading History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>
            Showing {sortedOrders.length} of {allOrders.length} orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No trading history found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOrders.slice(0, 50).map((order, index) => {
                    const agent = state.agentPerformance.get(order.agentId)
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {format(order.timestamp, 'HH:mm:ss')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(order.timestamp, 'MMM dd')}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{order.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                            {order.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>${order.price.toFixed(2)}</TableCell>
                        <TableCell>${order.currentPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${order.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {order.pnl >= 0 ? '+' : ''}{order.pnl.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'filled' ? 'default' :
                            order.status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {agent?.name || 'Unknown'}
                        </TableCell>
                      </motion.tr>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {sortedOrders.length > 50 && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing first 50 of {sortedOrders.length} orders
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ConnectedHistoryTab