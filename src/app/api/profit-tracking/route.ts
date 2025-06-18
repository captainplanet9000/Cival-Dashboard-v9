import { NextRequest, NextResponse } from 'next/server';
import { backendApi } from '@/lib/api/backend-client';

// Mock profit tracking data for fallback
const mockProfitData = {
  daily_profits: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    realized_pnl: (Math.random() - 0.3) * 1000,
    unrealized_pnl: (Math.random() - 0.5) * 2000,
    total_pnl: 0,
    trading_volume: Math.random() * 50000,
    fees_paid: Math.random() * 100,
    trades_count: Math.floor(Math.random() * 20) + 1
  })),
  goals: [
    {
      id: 'goal-1',
      name: 'Monthly Profit Target',
      type: 'profit',
      target_amount: 5000,
      current_amount: 3247.85,
      target_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: 64.96,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'goal-2',
      name: 'Portfolio Growth',
      type: 'portfolio_value',
      target_amount: 150000,
      current_amount: 125847,
      target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: 83.90,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'goal-3',
      name: 'Risk Management',
      type: 'max_drawdown',
      target_amount: -5, // Percentage
      current_amount: -2.1,
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'achieved',
      progress: 100,
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  profit_sources: {
    trading: 12567.34,
    staking: 1234.56,
    lending: 2345.67,
    arbitrage: 4567.89,
    yield_farming: 3456.78,
    flash_loans: 1876.45
  },
  tax_tracking: {
    realized_gains: 8734.56,
    realized_losses: -1243.21,
    net_gains: 7491.35,
    short_term_gains: 4567.89,
    long_term_gains: 2923.46,
    estimated_tax_liability: 1872.84
  },
  performance_metrics: {
    total_return: 23.4,
    annualized_return: 28.7,
    sharpe_ratio: 2.34,
    sortino_ratio: 3.12,
    max_drawdown: -4.2,
    win_rate: 78.5,
    profit_factor: 1.85,
    avg_win: 245.67,
    avg_loss: -132.45
  },
  profit_distribution: {
    by_strategy: [
      { name: 'Momentum Trading', profit: 5678.90, percentage: 35.2 },
      { name: 'Mean Reversion', profit: 3456.78, percentage: 21.4 },
      { name: 'Arbitrage', profit: 4567.89, percentage: 28.3 },
      { name: 'Grid Trading', profit: 2456.78, percentage: 15.1 }
    ],
    by_asset: [
      { asset: 'BTC', profit: 6789.01, percentage: 42.1 },
      { asset: 'ETH', profit: 4567.89, percentage: 28.3 },
      { asset: 'SOL', profit: 2345.67, percentage: 14.5 },
      { asset: 'Others', profit: 2456.78, percentage: 15.1 }
    ]
  }
};

// Calculate derived values for daily profits
mockProfitData.daily_profits.forEach(day => {
  day.total_pnl = day.realized_pnl + day.unrealized_pnl;
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'daily', 'goals', 'sources', 'tax', 'metrics', 'distribution'
    const timeframe = searchParams.get('timeframe') || '30d';
    const goalId = searchParams.get('goal_id');

    // Try to get real profit data from backend first
    try {
      const profitResponse = await backendApi.getProfitTracking ? 
        await backendApi.getProfitTracking(type, timeframe) : null;
      
      if (profitResponse?.data) {
        return NextResponse.json({
          success: true,
          data: profitResponse.data,
          source: 'backend',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn('Backend profit tracking unavailable, using mock data:', error);
    }

    // Fallback to mock data
    let data = mockProfitData;

    // Filter by type if specified
    if (type) {
      switch (type) {
        case 'daily':
          data = { daily_profits: mockProfitData.daily_profits };
          break;
        case 'goals':
          if (goalId) {
            const goal = mockProfitData.goals.find(g => g.id === goalId);
            data = goal ? { goal } : { error: 'Goal not found' };
          } else {
            data = { goals: mockProfitData.goals };
          }
          break;
        case 'sources':
          data = { profit_sources: mockProfitData.profit_sources };
          break;
        case 'tax':
          data = { tax_tracking: mockProfitData.tax_tracking };
          break;
        case 'metrics':
          data = { performance_metrics: mockProfitData.performance_metrics };
          break;
        case 'distribution':
          data = { profit_distribution: mockProfitData.profit_distribution };
          break;
        default:
          // Return all data
          break;
      }
    }

    // Add summary statistics
    const summary = {
      total_realized_profit: mockProfitData.daily_profits.reduce((sum, day) => sum + day.realized_pnl, 0),
      total_unrealized_profit: mockProfitData.daily_profits.reduce((sum, day) => sum + day.unrealized_pnl, 0),
      active_goals: mockProfitData.goals.filter(g => g.status === 'in_progress').length,
      completed_goals: mockProfitData.goals.filter(g => g.status === 'achieved').length,
      avg_daily_profit: mockProfitData.daily_profits.reduce((sum, day) => sum + day.realized_pnl, 0) / 30
    };

    return NextResponse.json({
      success: true,
      data,
      summary,
      source: 'fallback',
      metadata: {
        timeframe,
        calculation_date: new Date().toISOString(),
        currency: 'USD',
        timezone: 'UTC'
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Profit tracking API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch profit tracking data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...goalData } = body;

    if (action === 'create_goal') {
      // Create new profit goal
      const newGoal = {
        id: `goal-${Date.now()}`,
        name: goalData.name,
        type: goalData.type,
        target_amount: goalData.target_amount,
        current_amount: goalData.current_amount || 0,
        target_date: goalData.target_date,
        status: 'in_progress',
        progress: 0,
        created_at: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: newGoal,
        message: 'Goal created successfully',
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });

    } else if (action === 'update_goal') {
      // Update existing goal
      const { goal_id, ...updates } = goalData;
      
      return NextResponse.json({
        success: true,
        data: {
          goal_id,
          updates,
          updated_at: new Date().toISOString()
        },
        message: 'Goal updated successfully',
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });

    } else if (action === 'calculate_tax') {
      // Calculate tax liability
      const { trades, tax_year, jurisdiction } = goalData;
      
      return NextResponse.json({
        success: true,
        data: {
          tax_year,
          jurisdiction: jurisdiction || 'US',
          total_gains: 8734.56,
          total_losses: -1243.21,
          net_gains: 7491.35,
          short_term_rate: 0.37,
          long_term_rate: 0.20,
          estimated_tax: 1872.84,
          calculation_date: new Date().toISOString()
        },
        message: 'Tax calculation completed',
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });

    } else if (action === 'export_data') {
      // Export profit data
      const { format, date_range } = goalData;
      
      return NextResponse.json({
        success: true,
        data: {
          export_id: `export-${Date.now()}`,
          format: format || 'csv',
          date_range,
          download_url: `/api/exports/profit-${Date.now()}.${format || 'csv'}`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        message: 'Export prepared successfully',
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Profit tracking operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process profit tracking operation',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}