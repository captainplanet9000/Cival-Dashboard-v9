"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Calendar, Target, Zap, Shield } from 'lucide-react'

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

interface CalendarSummaryProps {
  calendarData: CalendarData
  currentDate: Date
}

export function CalendarSummary({ calendarData, currentDate }: CalendarSummaryProps) {
  const analysis = useMemo(() => {
    const data = Object.values(calendarData)
    const tradingDays = data.filter(d => d.total_trades > 0)
    
    if (tradingDays.length === 0) {
      return {
        totalPnL: 0,
        totalTrades: 0,
        winRate: 0,
        avgDailyPnL: 0,
        profitableDays: 0,
        bestDay: null,
        worstDay: null,
        consistency: 0,
        efficiency: 0
      }
    }

    const totalPnL = tradingDays.reduce((sum, d) => sum + d.total_pnl, 0)
    const totalTrades = tradingDays.reduce((sum, d) => sum + d.total_trades, 0)
    const totalWins = tradingDays.reduce((sum, d) => sum + d.winning_trades, 0)
    const profitableDays = tradingDays.filter(d => d.total_pnl > 0).length
    
    const bestDay = tradingDays.reduce((best, current) => 
      current.total_pnl > best.total_pnl ? current : best
    )
    
    const worstDay = tradingDays.reduce((worst, current) => 
      current.total_pnl < worst.total_pnl ? current : worst
    )

    // Calculate consistency (lower standard deviation = higher consistency)
    const avgDailyPnL = totalPnL / tradingDays.length
    const variance = tradingDays.reduce((sum, d) => sum + Math.pow(d.total_pnl - avgDailyPnL, 2), 0) / tradingDays.length
    const stdDev = Math.sqrt(variance)
    const consistency = Math.max(0, 100 - (stdDev / Math.abs(avgDailyPnL)) * 20)

    // Calculate efficiency (profitable days / total trading days)
    const efficiency = (profitableDays / tradingDays.length) * 100

    return {
      totalPnL,
      totalTrades,
      winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
      avgDailyPnL,
      profitableDays,
      bestDay,
      worstDay,
      consistency: isNaN(consistency) ? 0 : Math.min(100, consistency),
      efficiency
    }
  }, [calendarData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Performance</CardTitle>
            {analysis.totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analysis.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(analysis.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analysis.avgDailyPnL)} avg/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analysis.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.totalTrades} total trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analysis.consistency.toFixed(0)}%
            </div>
            <Progress value={analysis.consistency} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analysis.efficiency.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.profitableDays} profitable days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Best and Worst Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.bestDay && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">Best Trading Day</CardTitle>
              <CardDescription>Highest daily profit this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <Badge variant="outline">{formatDate(analysis.bestDay.trading_date)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">P&L</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(analysis.bestDay.total_pnl)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Trades</span>
                  <span className="font-medium">{analysis.bestDay.total_trades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="font-medium">
                    {((analysis.bestDay.winning_trades / analysis.bestDay.total_trades) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.worstDay && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Worst Trading Day</CardTitle>
              <CardDescription>Largest daily loss this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <Badge variant="outline">{formatDate(analysis.worstDay.trading_date)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">P&L</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(analysis.worstDay.total_pnl)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Trades</span>
                  <span className="font-medium">{analysis.worstDay.total_trades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <span className="font-medium">
                    {analysis.worstDay.total_trades > 0 ? 
                      ((analysis.worstDay.winning_trades / analysis.worstDay.total_trades) * 100).toFixed(1) : 
                      '0'
                    }%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Trading Insights
          </CardTitle>
          <CardDescription>
            Performance analysis for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Performance Metrics</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sharpe Ratio</span>
                  <span className="font-medium">
                    {analysis.avgDailyPnL > 0 && analysis.consistency > 0 ? 
                      ((analysis.avgDailyPnL / 100) * (analysis.consistency / 100)).toFixed(2) : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Drawdown</span>
                  <span className="font-medium text-red-600">
                    {analysis.worstDay ? formatCurrency(analysis.worstDay.total_pnl) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit Factor</span>
                  <span className="font-medium">
                    {analysis.totalPnL > 0 ? (1 + analysis.efficiency / 100).toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Trading Activity</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Trades/Day</span>
                  <span className="font-medium">
                    {Object.values(calendarData).filter(d => d.total_trades > 0).length > 0 ?
                      (analysis.totalTrades / Object.values(calendarData).filter(d => d.total_trades > 0).length).toFixed(1) :
                      '0'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trading Days</span>
                  <span className="font-medium">
                    {Object.values(calendarData).filter(d => d.total_trades > 0).length} / 
                    {Object.keys(calendarData).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Activity Rate</span>
                  <span className="font-medium">
                    {Object.keys(calendarData).length > 0 ?
                      ((Object.values(calendarData).filter(d => d.total_trades > 0).length / Object.keys(calendarData).length) * 100).toFixed(1) :
                      '0'
                    }%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Risk Assessment</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Level</span>
                  <Badge variant={analysis.consistency > 70 ? "default" : analysis.consistency > 40 ? "secondary" : "destructive"}>
                    {analysis.consistency > 70 ? "Low" : analysis.consistency > 40 ? "Medium" : "High"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Volatility</span>
                  <span className="font-medium">
                    {analysis.consistency > 0 ? `${(100 - analysis.consistency).toFixed(0)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stability</span>
                  <Progress value={analysis.consistency} className="h-1 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}