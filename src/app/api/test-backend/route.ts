import { NextRequest, NextResponse } from 'next/server';
import { backendApi } from '@/lib/api/backend-client';

export async function GET(request: NextRequest) {
  try {
    // Test backend health endpoint
    const healthResponse = await backendApi.getHealth();
    
    // Test portfolio summary endpoint
    const portfolioResponse = await backendApi.getPortfolioSummary();
    
    // Test agent status endpoint
    const agentResponse = await backendApi.getAgentStatus();
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      backend_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      health: healthResponse,
      portfolio: portfolioResponse,
      agents: agentResponse,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      backend_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to connect to backend. Make sure it is running on port 8000.',
      instructions: [
        'Run: npm run backend:start',
        'Or: npm run dev:full',
        'Check: npm run backend:check'
      ]
    }, { status: 503 });
  }
}