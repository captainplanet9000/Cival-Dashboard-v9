"use client"

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

interface CalendarViewProps {
  currentDate: Date
  calendarData: CalendarData
  onDateSelect: (date: Date) => void
}

interface CalendarDayProps {
  date: Date
  data: DailyData | null
  isCurrentMonth: boolean
  isToday: boolean
  onClick: () => void
}

function CalendarDay({ date, data, isCurrentMonth, isToday, onClick }: CalendarDayProps) {
  const getPnLColor = (pnl: number) => {
    if (pnl > 500) return 'bg-green-100'
    if (pnl > 100) return 'bg-green-50'
    if (pnl > 0) return 'bg-green-50/50'
    if (pnl < -500) return 'bg-red-100'
    if (pnl < -100) return 'bg-red-50'
    if (pnl < 0) return 'bg-red-50/50'
    return 'bg-white'
  }

  const getTextColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-700'
    if (pnl < 0) return 'text-red-700'
    return 'text-gray-600'
  }

  const winRate = data && data.total_trades > 0 ? data.winning_trades / data.total_trades : 0

  return (
    <div
      className={cn(
        "h-32 w-full cursor-pointer transition-all duration-200 hover:bg-opacity-80 relative",
        getPnLColor(data?.total_pnl || 0),
        !isCurrentMonth && "opacity-40 bg-gray-50",
        isToday && "ring-2 ring-blue-500 ring-inset"
      )}
      onClick={onClick}
    >
      {/* Date number in top-left corner */}
      <div className="absolute top-1 left-2">
        <span className={cn(
          "text-sm font-semibold",
          isToday && "text-blue-600 bg-blue-100 px-1 rounded",
          !isCurrentMonth && "text-gray-400"
        )}>
          {format(date, 'd')}
        </span>
      </div>

      {/* Agent count in top-right if there are trades */}
      {data && data.total_trades > 0 && (
        <div className="absolute top-1 right-1">
          <div className="text-xs bg-gray-100 text-gray-600 px-1 rounded">
            {data.active_agents}
          </div>
        </div>
      )}

      {/* Main content in center */}
      <div className="flex flex-col items-center justify-center h-full p-1">
        {data && data.total_trades > 0 ? (
          <div className="text-center space-y-1">
            {/* P&L - Main display */}
            <div className={cn("text-lg font-bold", getTextColor(data.total_pnl))}>
              {data.total_pnl >= 0 ? '+' : ''}${data.total_pnl.toFixed(0)}
            </div>
            
            {/* Trades count */}
            <div className="text-xs text-gray-600">
              {data.total_trades} trades
            </div>
            
            {/* Win rate */}
            <div className={cn(
              "text-xs font-medium",
              winRate >= 0.6 ? "text-green-600" : winRate >= 0.4 ? "text-yellow-600" : "text-red-600"
            )}>
              {(winRate * 100).toFixed(0)}% win
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center">
            No trades
          </div>
        )}
      </div>
    </div>
  )
}

export function CalendarView({ currentDate, calendarData, onDateSelect }: CalendarViewProps) {
  // Get the calendar grid (6 weeks)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const today = new Date()

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          Trading Performance Calendar
        </CardTitle>
        <p className="text-sm text-gray-600">Click on any day to view detailed trading activity</p>
      </CardHeader>
      <CardContent className="p-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border border-gray-300">
          {weekdays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-bold text-gray-700 bg-gray-100 border-r border-gray-300 last:border-r-0">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Calendar Grid - Traditional calendar layout */}
        <div className="grid grid-cols-7 border-l border-r border-b border-gray-300">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const data = calendarData[dateStr] || null
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, today)

            return (
              <div key={dateStr} className="border-r border-b border-gray-300 last:border-r-0">
                <CalendarDay
                  date={day}
                  data={data}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday}
                  onClick={() => onDateSelect(day)}
                />
              </div>
            )
          })}
        </div>

        {/* Enhanced Legend */}
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Calendar Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded shadow-sm"></div>
              <span className="text-gray-600">High Profit ($500+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded shadow-sm"></div>
              <span className="text-gray-600">Profitable Day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded shadow-sm"></div>
              <span className="text-gray-600">Loss Day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded shadow-sm"></div>
              <span className="text-gray-600">No Trading</span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs px-2 py-1">3 agents</Badge>
              <span className="text-gray-600 text-xs">Active Trading Agents</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">75% win</div>
              <span className="text-gray-600 text-xs">Daily Win Rate</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}