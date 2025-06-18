import { NextRequest, NextResponse } from 'next/server';
import { backendApi } from '@/lib/api/backend-client';

// Mock flash loan opportunities for fallback
const mockOpportunities = [
  {
    id: 'arbitrage-opportunity-1',
    type: 'arbitrage',
    asset: 'USDC',
    amount: 50000,
    source_protocol: 'Aave',
    target_protocol: 'Compound',
    source_price: 1.0012,
    target_price: 1.0034,
    profit_estimate: 110.00,
    gas_estimate: 45.30,
    net_profit: 64.70,
    risk_score: 'low',
    execution_time: '12 seconds',
    confidence: 95.2,
    available_until: new Date(Date.now() + 300000).toISOString(), // 5 minutes
    chain: 'ethereum'
  },
  {
    id: 'liquidation-opportunity-2',
    type: 'liquidation',
    asset: 'WETH',
    amount: 25.5,
    target_protocol: 'MakerDAO',
    collateral_value: 64750.00,
    debt_value: 59200.00,
    liquidation_bonus: 8.0,
    profit_estimate: 4200.00,
    gas_estimate: 120.50,
    net_profit: 4079.50,
    risk_score: 'medium',
    execution_time: '18 seconds',
    confidence: 87.8,
    available_until: new Date(Date.now() + 180000).toISOString(), // 3 minutes
    chain: 'ethereum'
  },
  {
    id: 'yield-opportunity-3',
    type: 'yield_farming',
    asset: 'USDT',
    amount: 100000,
    source_protocol: 'Uniswap V3',
    target_protocol: 'Curve',
    source_apy: 2.4,
    target_apy: 8.7,
    profit_estimate: 625.00,
    gas_estimate: 85.20,
    net_profit: 539.80,
    risk_score: 'medium',
    execution_time: '25 seconds',
    confidence: 78.5,
    available_until: new Date(Date.now() + 600000).toISOString(), // 10 minutes
    chain: 'ethereum'
  }
];

const mockExecutions = [
  {
    id: 'exec-1',
    opportunity_id: 'arbitrage-opportunity-1',
    status: 'completed',
    transaction_hash: '0x1234...5678',
    profit_realized: 62.45,
    gas_used: 47.80,
    execution_time: '14 seconds',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'exec-2',
    opportunity_id: 'liquidation-opportunity-2',
    status: 'pending',
    transaction_hash: '0x9abc...def0',
    estimated_completion: new Date(Date.now() + 30000).toISOString(),
    timestamp: new Date(Date.now() - 60000).toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'opportunities' or 'executions'
    const chain = searchParams.get('chain');
    const riskLevel = searchParams.get('risk');

    if (type === 'opportunities') {
      // Try to get real opportunities from backend first
      try {
        const opportunitiesResponse = await backendApi.getFlashLoanOpportunities();
        if (opportunitiesResponse.data && Array.isArray(opportunitiesResponse.data)) {
          let opportunities = opportunitiesResponse.data;

          // Apply filters
          if (chain) {
            opportunities = opportunities.filter((op: any) => op.chain === chain);
          }
          if (riskLevel) {
            opportunities = opportunities.filter((op: any) => op.risk_score === riskLevel);
          }

          return NextResponse.json({
            success: true,
            data: opportunities,
            total: opportunities.length,
            source: 'backend',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn('Backend flash loan opportunities unavailable, using mock data:', error);
      }

      // Fallback to mock data
      let opportunities = mockOpportunities;

      // Apply filters
      if (chain) {
        opportunities = opportunities.filter(op => op.chain === chain);
      }
      if (riskLevel) {
        opportunities = opportunities.filter(op => op.risk_score === riskLevel);
      }

      return NextResponse.json({
        success: true,
        data: opportunities,
        total: opportunities.length,
        source: 'fallback',
        summary: {
          total_profit_potential: opportunities.reduce((sum, op) => sum + op.net_profit, 0),
          avg_confidence: opportunities.reduce((sum, op) => sum + op.confidence, 0) / opportunities.length,
          risk_distribution: {
            low: opportunities.filter(op => op.risk_score === 'low').length,
            medium: opportunities.filter(op => op.risk_score === 'medium').length,
            high: opportunities.filter(op => op.risk_score === 'high').length
          }
        },
        timestamp: new Date().toISOString(),
      });

    } else if (type === 'executions') {
      // Return execution history
      return NextResponse.json({
        success: true,
        data: mockExecutions,
        total: mockExecutions.length,
        source: 'fallback',
        summary: {
          completed: mockExecutions.filter(e => e.status === 'completed').length,
          pending: mockExecutions.filter(e => e.status === 'pending').length,
          failed: mockExecutions.filter(e => e.status === 'failed').length
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Default: return both opportunities and executions summary
    return NextResponse.json({
      success: true,
      data: {
        opportunities: mockOpportunities.length,
        executions: mockExecutions.length,
        total_profit_potential: mockOpportunities.reduce((sum, op) => sum + op.net_profit, 0),
        active_executions: mockExecutions.filter(e => e.status === 'pending').length
      },
      source: 'fallback',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Flash loans API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch flash loan data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...loanData } = body;

    if (action === 'execute') {
      // Try to execute flash loan via backend
      try {
        const executeResponse = await backendApi.executeFlashLoan(loanData);
        if (executeResponse.data) {
          return NextResponse.json({
            success: true,
            data: executeResponse.data,
            message: 'Flash loan execution initiated',
            source: 'backend',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn('Backend flash loan execution failed, using mock:', error);
      }

      // Fallback: mock execution
      const execution = {
        id: `exec-${Date.now()}`,
        opportunity_id: loanData.opportunity_id,
        status: 'pending',
        transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
        estimated_completion: new Date(Date.now() + 30000).toISOString(),
        estimated_profit: loanData.estimated_profit,
        gas_estimate: loanData.gas_estimate,
        timestamp: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: execution,
        message: 'Flash loan execution initiated (mock)',
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Flash loan execution error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute flash loan',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}