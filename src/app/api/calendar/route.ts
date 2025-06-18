import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month parameters are required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/farm/calendar/${year}/${month}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Calendar API error:', error)
    
    // Return mock data on error for development
    const mockData = generateMockCalendarData()
    return NextResponse.json({ 
      data: mockData,
      error: 'Using mock data - backend unavailable',
      status: 'mock'
    })
  }
}

function generateMockCalendarData() {
  const mockData = []
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  // Generate data for current month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    
    // 70% chance of having trading activity
    if (Math.random() > 0.3) {
      const trades = Math.floor(Math.random() * 20) + 1
      const winRate = 0.4 + Math.random() * 0.4
      const winningTrades = Math.floor(trades * winRate)
      const pnl = (Math.random() - 0.4) * 2000
      
      mockData.push({
        trading_date: dateStr,
        total_pnl: pnl,
        total_trades: trades,
        winning_trades: winningTrades,
        active_agents: Math.floor(Math.random() * 5) + 1,
        net_profit: pnl * 0.98
      })
    } else {
      mockData.push({
        trading_date: dateStr,
        total_pnl: 0,
        total_trades: 0,
        winning_trades: 0,
        active_agents: 0,
        net_profit: 0
      })
    }
  }
  
  return mockData
}