import { NextRequest, NextResponse } from 'next/server';
import { backendApi } from '@/lib/api/backend-client';

// Mock analytics data for fallback
const mockAnalytics = {
  usdt_dominance: {
    current: 5.8,
    change_24h: -0.3,
    trend: 'declining',
    correlation_with_btc: -0.72,
    correlation_with_market: -0.65,
    historical_data: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dominance: 5.8 + (Math.random() - 0.5) * 2,
      btc_price: 43000 + (Math.random() - 0.5) * 10000,
      total_market_cap: 1.7e12 + (Math.random() - 0.5) * 2e11
    }))
  },
  market_sentiment: {
    fear_greed_index: 72,
    sentiment_score: 0.65,
    social_volume: 145000,
    news_sentiment: 0.58,
    funding_rates: {
      btc: 0.0042,
      eth: 0.0038,
      average: 0.0041
    }
  },
  volatility_analysis: {
    btc_volatility: 0.045,
    eth_volatility: 0.052,
    market_volatility: 0.041,
    vix_equivalent: 28.5,
    garch_forecast: {
      "1_day": 0.046,
      "7_day": 0.048,
      "30_day": 0.052
    }
  },
  correlation_matrix: {
    assets: ['BTC', 'ETH', 'SOL', 'ADA', 'MATIC'],
    correlations: [
      [1.00, 0.85, 0.72, 0.68, 0.71],
      [0.85, 1.00, 0.78, 0.73, 0.76],
      [0.72, 0.78, 1.00, 0.65, 0.68],
      [0.68, 0.73, 0.65, 1.00, 0.72],
      [0.71, 0.76, 0.68, 0.72, 1.00]
    ]
  },
  technical_indicators: {
    rsi: {
      btc: 58.3,
      eth: 61.2,
      market: 59.1
    },
    macd: {
      btc: { value: 245.7, signal: 198.4, histogram: 47.3 },
      eth: { value: 12.8, signal: 8.9, histogram: 3.9 },
    },
    bollinger_bands: {
      btc: { upper: 45800, middle: 43250, lower: 40700, squeeze: false },
      eth: { upper: 3580, middle: 3400, lower: 3220, squeeze: true }
    }
  },
  on_chain_metrics: {
    active_addresses: 1245000,
    transaction_volume: 8.7e9,
    network_fees: {
      btc: 15.4,
      eth: 28.7,
      average: 22.1
    },
    exchange_flows: {
      inflow: 2.4e8,
      outflow: 1.9e8,
      net_flow: -5e7
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'usdt-dominance', 'sentiment', 'volatility', 'correlations', 'technical', 'onchain'
    const timeframe = searchParams.get('timeframe') || '24h';
    const symbol = searchParams.get('symbol');

    // Try to get real analytics from backend first
    try {
      const analyticsResponse = await backendApi.getAnalytics ? 
        await backendApi.getAnalytics(type || undefined, timeframe, symbol || undefined) : null;
      
      if (analyticsResponse?.data) {
        return NextResponse.json({
          success: true,
          data: analyticsResponse.data,
          source: 'backend',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn('Backend analytics unavailable, using mock data:', error);
    }

    // Fallback to mock data
    let data: any = mockAnalytics;

    // Filter by type if specified
    if (type) {
      switch (type) {
        case 'usdt-dominance':
          data = { usdt_dominance: mockAnalytics.usdt_dominance };
          break;
        case 'sentiment':
          data = { market_sentiment: mockAnalytics.market_sentiment };
          break;
        case 'volatility':
          data = { volatility_analysis: mockAnalytics.volatility_analysis };
          break;
        case 'correlations':
          data = { correlation_matrix: mockAnalytics.correlation_matrix };
          break;
        case 'technical':
          data = { technical_indicators: mockAnalytics.technical_indicators };
          break;
        case 'onchain':
          data = { on_chain_metrics: mockAnalytics.on_chain_metrics };
          break;
        default:
          // Return all data
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'fallback',
      metadata: {
        timeframe,
        last_updated: new Date().toISOString(),
        data_sources: ['coingecko', 'alternative.me', 'glassnode', 'santiment'],
        update_frequency: '5 minutes'
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...analyticsData } = body;

    if (action === 'calculate_correlation') {
      // Mock correlation calculation
      const { asset1, asset2, timeframe } = analyticsData;
      const correlation = 0.5 + (Math.random() - 0.5) * 0.8; // Random correlation between -0.3 and 1.3
      
      return NextResponse.json({
        success: true,
        data: {
          asset1,
          asset2,
          correlation: Math.round(correlation * 1000) / 1000,
          timeframe,
          significance: correlation > 0.7 ? 'high' : correlation > 0.3 ? 'medium' : 'low',
          p_value: Math.random() * 0.1, // Mock statistical significance
        },
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });

    } else if (action === 'run_analysis') {
      // Mock analysis execution
      const { analysis_type, parameters } = analyticsData;
      
      return NextResponse.json({
        success: true,
        data: {
          analysis_id: `analysis-${Date.now()}`,
          type: analysis_type,
          status: 'completed',
          results: {
            confidence: 0.85,
            prediction: 'bullish',
            time_horizon: '7 days',
            key_factors: ['technical momentum', 'market sentiment', 'on-chain activity'],
            risk_score: 'medium'
          },
          execution_time: '2.3 seconds'
        },
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Analytics operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process analytics operation',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}