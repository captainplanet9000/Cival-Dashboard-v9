import { NextRequest, NextResponse } from 'next/server';
import { backendApi } from '@/lib/api/backend-client';

// Mock HyperLend positions for fallback
const mockPositions = [
  {
    id: 'hl-position-1',
    type: 'lending',
    asset: 'USDC',
    amount: 10000,
    apy: 12.4,
    platform: 'Hyperliquid',
    status: 'active',
    accrued_interest: 425.30,
    health_factor: 2.45,
    liquidation_price: null,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    last_updated: new Date().toISOString(),
    maturity: null // perpetual
  },
  {
    id: 'hl-position-2',
    type: 'borrowing',
    asset: 'ETH',
    amount: 5.2,
    apy: 8.7,
    platform: 'Hyperliquid',
    status: 'active',
    collateral: {
      asset: 'USDC',
      amount: 18500,
      ltv: 75.0
    },
    accrued_interest: -156.80,
    health_factor: 1.85,
    liquidation_price: 2850.00,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    last_updated: new Date().toISOString(),
    maturity: null // perpetual
  },
  {
    id: 'hl-position-3',
    type: 'lending',
    asset: 'WBTC',
    amount: 0.25,
    apy: 9.8,
    platform: 'Hyperliquid',
    status: 'active',
    accrued_interest: 125.45,
    health_factor: 3.12,
    liquidation_price: null,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    last_updated: new Date().toISOString(),
    maturity: null // perpetual
  }
];

const mockOpportunities = [
  {
    id: 'hl-opp-1',
    type: 'lending',
    asset: 'USDC',
    apy: 14.2,
    max_amount: 50000,
    risk_rating: 'A',
    platform: 'Hyperliquid',
    description: 'High-yield USDC lending with institutional backing',
    min_amount: 1000,
    lock_period: null, // flexible
    auto_compound: true
  },
  {
    id: 'hl-opp-2',
    type: 'borrowing',
    asset: 'ETH',
    apy: 7.5,
    max_ltv: 80.0,
    platform: 'Hyperliquid',
    description: 'ETH borrowing against USDC collateral',
    min_collateral: 5000,
    liquidation_threshold: 85.0,
    supported_collateral: ['USDC', 'USDT', 'DAI']
  },
  {
    id: 'hl-opp-3',
    type: 'yield_farming',
    asset: 'ETH-USDC LP',
    apy: 18.7,
    max_amount: 100000,
    risk_rating: 'B+',
    platform: 'Hyperliquid',
    description: 'ETH-USDC liquidity provision with HLP rewards',
    min_amount: 2000,
    lock_period: '7 days',
    impermanent_loss_protection: true
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'positions' or 'opportunities'
    const positionType = searchParams.get('position_type'); // 'lending', 'borrowing', 'yield_farming'
    const status = searchParams.get('status');

    if (type === 'positions') {
      // Try to get real positions from backend first
      try {
        const positionsResponse = await backendApi.getHyperLendPositions();
        if (positionsResponse.data && Array.isArray(positionsResponse.data)) {
          let positions = positionsResponse.data;

          // Apply filters
          if (positionType) {
            positions = positions.filter((pos: any) => pos.type === positionType);
          }
          if (status) {
            positions = positions.filter((pos: any) => pos.status === status);
          }

          return NextResponse.json({
            success: true,
            data: positions,
            total: positions.length,
            source: 'backend',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn('Backend HyperLend positions unavailable, using mock data:', error);
      }

      // Fallback to mock data
      let positions = mockPositions;

      // Apply filters
      if (positionType) {
        positions = positions.filter(pos => pos.type === positionType);
      }
      if (status) {
        positions = positions.filter(pos => pos.status === status);
      }

      const summary = {
        total_value: positions.reduce((sum, pos) => {
          const currentPrice = pos.asset === 'USDC' ? 1 : pos.asset === 'ETH' ? 3400 : 43250;
          return sum + (pos.amount * currentPrice);
        }, 0),
        total_interest: positions.reduce((sum, pos) => sum + pos.accrued_interest, 0),
        lending_positions: positions.filter(pos => pos.type === 'lending').length,
        borrowing_positions: positions.filter(pos => pos.type === 'borrowing').length,
        avg_health_factor: positions
          .filter(pos => pos.health_factor)
          .reduce((sum, pos) => sum + pos.health_factor!, 0) / 
          positions.filter(pos => pos.health_factor).length || 0
      };

      return NextResponse.json({
        success: true,
        data: positions,
        total: positions.length,
        source: 'fallback',
        summary,
        timestamp: new Date().toISOString(),
      });

    } else if (type === 'opportunities') {
      // Return available opportunities
      let opportunities = mockOpportunities;

      if (positionType) {
        opportunities = opportunities.filter(opp => opp.type === positionType);
      }

      return NextResponse.json({
        success: true,
        data: opportunities,
        total: opportunities.length,
        source: 'fallback',
        summary: {
          avg_apy: opportunities.reduce((sum, opp) => sum + opp.apy, 0) / opportunities.length,
          max_apy: Math.max(...opportunities.map(opp => opp.apy)),
          total_capacity: opportunities.reduce((sum, opp) => sum + (opp.max_amount || 0), 0)
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Default: return summary of both positions and opportunities
    return NextResponse.json({
      success: true,
      data: {
        positions: mockPositions.length,
        opportunities: mockOpportunities.length,
        total_portfolio_value: mockPositions.reduce((sum, pos) => {
          const currentPrice = pos.asset === 'USDC' ? 1 : pos.asset === 'ETH' ? 3400 : 43250;
          return sum + (pos.amount * currentPrice);
        }, 0),
        net_interest: mockPositions.reduce((sum, pos) => sum + pos.accrued_interest, 0)
      },
      source: 'fallback',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('HyperLend API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch HyperLend data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...positionData } = body;

    if (action === 'create') {
      // Try to create position via backend
      try {
        const createResponse = await backendApi.createHyperLendPosition(positionData);
        if (createResponse.data) {
          return NextResponse.json({
            success: true,
            data: createResponse.data,
            message: 'HyperLend position created successfully',
            source: 'backend',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn('Backend HyperLend position creation failed, using mock:', error);
      }

      // Fallback: create mock position
      const newPosition = {
        id: `hl-position-${Date.now()}`,
        type: positionData.type,
        asset: positionData.asset,
        amount: positionData.amount,
        apy: positionData.apy || 8.5,
        platform: 'Hyperliquid',
        status: 'pending',
        accrued_interest: 0,
        health_factor: positionData.type === 'borrowing' ? 2.0 : null,
        liquidation_price: positionData.type === 'borrowing' ? positionData.liquidation_price : null,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        maturity: positionData.maturity || null
      };

      return NextResponse.json({
        success: true,
        data: newPosition,
        message: 'HyperLend position created successfully (mock)',
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });

    } else if (action === 'close') {
      // Mock position closure
      return NextResponse.json({
        success: true,
        data: {
          position_id: positionData.position_id,
          status: 'closed',
          final_interest: positionData.accrued_interest || 0,
          closure_fee: positionData.amount * 0.001, // 0.1% fee
          net_return: (positionData.accrued_interest || 0) - (positionData.amount * 0.001),
          transaction_hash: '0x' + Math.random().toString(16).substr(2, 64)
        },
        message: 'Position closed successfully (mock)',
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('HyperLend operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process HyperLend operation',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}