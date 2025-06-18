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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/farm/calendar/${year}/${month}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Convert array to object keyed by date
      const dataByDate: CalendarData = {}
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach((item: DailyData) => {
          dataByDate[item.trading_date] = item
        })
      }
      
      setCalendarData(dataByDate)
    } catch (err) {
      console.error('Failed to fetch calendar data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar data')
      
      // Set mock data for development
      setCalendarData(generateMockCalendarData(year, month))
    } finally {
      setLoading(false)
    }
  }

  const generateMockCalendarData = (year: number, month: number): CalendarData => {
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