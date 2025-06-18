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
    if (pnl > 500) return 'bg-green-100 border-green-300 hover:bg-green-200'
    if (pnl > 0) return 'bg-green-50 border-green-200 hover:bg-green-100'
    if (pnl < -500) return 'bg-red-100 border-red-300 hover:bg-red-200'
    if (pnl < 0) return 'bg-red-50 border-red-200 hover:bg-red-100'
    return 'bg-gray-50 border-gray-200 hover:bg-gray-100'
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 0.7) return 'text-green-600'
    if (winRate >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const winRate = data && data.total_trades > 0 ? data.winning_trades / data.total_trades : 0

  return (
    <div
      className={cn(
        "min-h-[120px] p-3 border-2 cursor-pointer transition-all duration-200",
        getPnLColor(data?.total_pnl || 0),
        !isCurrentMonth && "opacity-40",
        isToday && "ring-2 ring-blue-500 ring-offset-1"
      )}
      onClick={onClick}
    >
      {/* Date */}
      <div className="flex justify-between items-start mb-2">
        <span className={cn(
          "text-sm font-medium",
          isToday && "text-blue-600 font-bold",
          !isCurrentMonth && "text-gray-400"
        )}>
          {format(date, 'd')}
        </span>
        
        {data && data.total_trades > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            {data.active_agents}
          </Badge>
        )}
      </div>

      {/* Performance Data */}
      {data && data.total_trades > 0 ? (
        <div className="space-y-1">
          {/* P&L */}
          <div className={cn(
            "text-sm font-semibold",
            data.total_pnl >= 0 ? "text-green-700" : "text-red-700"
          )}>
            {data.total_pnl >= 0 ? '+' : ''}${data.total_pnl.toFixed(0)}
          </div>
          
          {/* Trades */}
          <div className="text-xs text-gray-600">
            {data.total_trades} trade{data.total_trades !== 1 ? 's' : ''}
          </div>
          
          {/* Win Rate */}
          <div className={cn("text-xs font-medium", getWinRateColor(winRate))}>
            {(winRate * 100).toFixed(0)}% win
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-400 italic">
          No trading
        </div>
      )}
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

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Performance Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const data = calendarData[dateStr] || null
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, today)

            return (
              <CalendarDay
                key={dateStr}
                date={day}
                data={data}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                onClick={() => onDateSelect(day)}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Profitable Day</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Loss Day</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
            <span>No Trading</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">3</Badge>
            <span>Active Agents</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}