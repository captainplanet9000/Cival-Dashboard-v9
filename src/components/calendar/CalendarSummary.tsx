"use client"

interface CalendarSummaryProps {
  totalPnL: number
  totalTrades: number
  winningTrades: number
  tradingDays: number
}

export function CalendarSummary({ totalPnL, totalTrades, winningTrades, tradingDays }: CalendarSummaryProps) {
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
  const avgDailyPnL = tradingDays > 0 ? totalPnL / tradingDays : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm font-medium text-gray-600">Total P&L</div>
        <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">{tradingDays} trading days</div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm font-medium text-gray-600">Total Trades</div>
        <div className="text-2xl font-bold text-blue-600">{totalTrades}</div>
        <div className="text-xs text-gray-500">{winningTrades} winning</div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm font-medium text-gray-600">Win Rate</div>
        <div className={`text-2xl font-bold ${winRate >= 60 ? 'text-green-600' : winRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
          {winRate.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">{winningTrades}/{totalTrades}</div>
      </div>

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="text-sm font-medium text-gray-600">Avg Daily P&L</div>
        <div className={`text-2xl font-bold ${avgDailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${avgDailyPnL.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">per trading day</div>
      </div>
    </div>
  )
}