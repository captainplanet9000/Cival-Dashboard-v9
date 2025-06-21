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
    if (pnl > 500) return 'bg-emerald-100 border-emerald-400 hover:bg-emerald-200 shadow-emerald-100'
    if (pnl > 100) return 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 shadow-emerald-50'
    if (pnl > 0) return 'bg-green-50 border-green-200 hover:bg-green-100 shadow-green-50'
    if (pnl < -500) return 'bg-red-100 border-red-400 hover:bg-red-200 shadow-red-100'
    if (pnl < -100) return 'bg-red-50 border-red-300 hover:bg-red-100 shadow-red-50'
    if (pnl < 0) return 'bg-orange-50 border-orange-200 hover:bg-orange-100 shadow-orange-50'
    return 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-slate-50'
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 0.7) return 'text-emerald-700 bg-emerald-100'
    if (winRate >= 0.5) return 'text-amber-700 bg-amber-100'
    return 'text-red-700 bg-red-100'
  }

  const winRate = data && data.total_trades > 0 ? data.winning_trades / data.total_trades : 0

  return (
    <div
      className={cn(
        "min-h-[140px] p-3 border-2 cursor-pointer transition-all duration-300 rounded-lg shadow-sm hover:shadow-md",
        getPnLColor(data?.total_pnl || 0),
        !isCurrentMonth && "opacity-50",
        isToday && "ring-2 ring-blue-500 ring-offset-2 shadow-lg"
      )}
      onClick={onClick}
    >
      {/* Date Header */}
      <div className="flex justify-between items-start mb-3">
        <span className={cn(
          "text-lg font-bold",
          isToday && "text-blue-600",
          !isCurrentMonth && "text-gray-400",
          data && data.total_trades > 0 && "text-gray-800"
        )}>
          {format(date, 'd')}
        </span>
        
        {data && data.total_trades > 0 && (
          <div className="flex flex-col items-end space-y-1">
            <Badge variant="outline" className="text-xs px-2 py-1 bg-white/80">
              {data.active_agents} agents
            </Badge>
          </div>
        )}
      </div>

      {/* Performance Data */}
      {data && data.total_trades > 0 ? (
        <div className="space-y-2">
          {/* P&L Display */}
          <div className={cn(
            "text-lg font-bold flex items-center",
            data.total_pnl >= 0 ? "text-emerald-700" : "text-red-700"
          )}>
            <span className="text-xs mr-1">$</span>
            {data.total_pnl >= 0 ? '+' : ''}{Math.abs(data.total_pnl).toFixed(0)}
          </div>
          
          {/* Trades Count */}
          <div className="text-xs text-gray-600 font-medium">
            {data.total_trades} trade{data.total_trades !== 1 ? 's' : ''}
          </div>
          
          {/* Win Rate Badge */}
          <div className={cn(
            "text-xs font-semibold px-2 py-1 rounded-full text-center",
            getWinRateColor(winRate)
          )}>
            {(winRate * 100).toFixed(0)}% win
          </div>

          {/* Net Profit (smaller) */}
          <div className="text-xs text-gray-500">
            Net: ${data.net_profit.toFixed(0)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-16 text-center">
          <div className="text-xs text-gray-400 italic">No trading</div>
          <div className="text-xs text-gray-300 mt-1">activity</div>
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
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekdays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-bold text-gray-700 bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg border shadow-sm">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
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