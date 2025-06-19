'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Trade {
  id: string
  timestamp: Date
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop'
  quantity: number
  price: number
  fee: number
  total: number
  status: 'filled' | 'pending' | 'cancelled'
  agent?: string
  strategy?: string
}

interface TradingDataTableProps {
  className?: string
}

export function TradingDataTable({ className }: TradingDataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [sortField, setSortField] = React.useState<keyof Trade>('timestamp')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = React.useState<string>('all')
  const [filterSide, setFilterSide] = React.useState<string>('all')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Mock trading data
  const mockTrades: Trade[] = [
    {
      id: 'T001',
      timestamp: new Date('2024-01-15T10:30:00'),
      symbol: 'BTC/USD',
      side: 'buy',
      type: 'market',
      quantity: 0.5,
      price: 45123.45,
      fee: 22.56,
      total: 22584.28,
      status: 'filled',
      agent: 'Darvas Box Master',
      strategy: 'Breakout Strategy'
    },
    {
      id: 'T002',
      timestamp: new Date('2024-01-15T09:15:00'),
      symbol: 'ETH/USD',
      side: 'sell',
      type: 'limit',
      quantity: 2.3,
      price: 2289.67,
      fee: 13.15,
      total: 5252.09,
      status: 'filled',
      agent: 'Elliott Wave Analyst',
      strategy: 'Wave Pattern'
    },
    {
      id: 'T003',
      timestamp: new Date('2024-01-15T08:45:00'),
      symbol: 'SOL/USD',
      side: 'buy',
      type: 'market',
      quantity: 10,
      price: 96.20,
      fee: 4.81,
      total: 966.81,
      status: 'filled',
      agent: 'Momentum Trader',
      strategy: 'Trend Following'
    },
    {
      id: 'T004',
      timestamp: new Date('2024-01-15T08:20:00'),
      symbol: 'ADA/USD',
      side: 'buy',
      type: 'limit',
      quantity: 1000,
      price: 0.4523,
      fee: 2.26,
      total: 454.56,
      status: 'pending',
      agent: 'Arbitrage Hunter',
      strategy: 'Cross Exchange'
    },
    {
      id: 'T005',
      timestamp: new Date('2024-01-15T07:55:00'),
      symbol: 'MATIC/USD',
      side: 'sell',
      type: 'stop',
      quantity: 500,
      price: 0.8750,
      fee: 2.19,
      total: 435.31,
      status: 'cancelled',
      strategy: 'Risk Management'
    },
    {
      id: 'T006',
      timestamp: new Date('2024-01-14T16:30:00'),
      symbol: 'BNB/USD',
      side: 'buy',
      type: 'market',
      quantity: 15,
      price: 234.56,
      fee: 17.59,
      total: 3536.09,
      status: 'filled',
      agent: 'Mean Reversion',
      strategy: 'Counter Trend'
    }
  ]

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = mockTrades.filter(trade => {
      const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trade.agent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trade.strategy?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || trade.status === filterStatus
      const matchesSide = filterSide === 'all' || trade.side === filterSide
      
      return matchesSearch && matchesStatus && matchesSide
    })

    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [mockTrades, searchTerm, sortField, sortDirection, filterStatus, filterSide])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: keyof Trade) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getStatusBadge = (status: Trade['status']) => {
    const variants = {
      filled: { variant: 'default' as const, className: 'bg-green-500' },
      pending: { variant: 'secondary' as const, className: 'bg-yellow-500' },
      cancelled: { variant: 'destructive' as const, className: '' }
    }
    
    const config = variants[status]
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getSideBadge = (side: Trade['side']) => {
    return (
      <Badge 
        variant={side === 'buy' ? 'default' : 'destructive'}
        className={side === 'buy' ? 'bg-green-500' : ''}
      >
        {side === 'buy' ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {side.toUpperCase()}
      </Badge>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Trading History</CardTitle>
        <CardDescription>Complete record of all trading activities</CardDescription>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trades, agents, or strategies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterSide} onValueChange={setFilterSide}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Side" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sides</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <Button variant="ghost" onClick={() => handleSort('id')}>
                    Trade ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('timestamp')}>
                    Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('price')}>
                    Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-mono font-medium">{trade.id}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{trade.timestamp.toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {trade.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>{getSideBadge(trade.side)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{trade.type.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {trade.quantity}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${trade.price.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${trade.total.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(trade.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{trade.agent || 'Manual'}</div>
                      {trade.strategy && (
                        <div className="text-muted-foreground text-xs">
                          {trade.strategy}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Trade
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Trade
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of{' '}
            {filteredData.length} trades
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TradingDataTable