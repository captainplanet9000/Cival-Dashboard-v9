import { NextRequest, NextResponse } from 'next/server';
import { backendApi } from '@/lib/api/backend-client';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = 'http://localhost:8000';
    
    // Test backend health endpoint directly
    const healthRes = await fetch(`${backendUrl}/health`);
    const healthData = await healthRes.json();
    
    // Test portfolio summary endpoint directly
    const portfolioRes = await fetch(`${backendUrl}/api/v1/portfolio/summary`);
    const portfolioData = await portfolioRes.json();
    
    // Test agent status endpoint directly
    const agentRes = await fetch(`${backendUrl}/api/v1/agents/status`);
    const agentData = await agentRes.json();
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      backend_url: backendUrl,
      backend_health: healthData,
      portfolio_data: portfolioData,
      agent_data: agentData,
      message: 'Successfully connected to backend!',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      backend_url: 'http://localhost:8000',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to connect to backend. Make sure it is running on port 8000.',
      instructions: [
        'Backend should be running on: http://localhost:8000',
        'Test health: curl http://localhost:8000/health',
        'Check backend logs for errors'
      ]
    }, { status: 503 });
  }
}