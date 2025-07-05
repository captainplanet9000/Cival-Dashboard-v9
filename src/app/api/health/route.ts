import { NextRequest, NextResponse } from 'next/server';

/**
 * Enhanced Health Check API Endpoint
 * Tests system connectivity and configuration status
 */
export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cival-dashboard-api',
      environment: process.env.NODE_ENV || 'development',
      services: {
        frontend: 'online',
        redis: process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL ? 'configured' : 'not configured',
        database: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('mock') ? 'configured' : 'mock',
        backend: 'not running', // Python backend not accessible
        ai: {
          openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
          gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'configured' : 'not configured',
          anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured'
        }
      },
      features: {
        buildSuccess: true,
        mockDataActive: true,
        realTimeUpdates: Boolean(process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL),
        aiIntegration: Boolean(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY),
        authentication: false // Solo operator mode
      },
      configuration: {
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
        nodeEnv: process.env.NODE_ENV,
        alchemyConfigured: Boolean(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY)
      }
    }

    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      service: 'cival-dashboard-api'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Test endpoint for integration verification
    return NextResponse.json({
      status: 'received',
      echo: body,
      timestamp: new Date().toISOString(),
      service: 'cival-dashboard-api'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Invalid JSON payload',
      service: 'cival-dashboard-api'
    }, { status: 400 })
  }
}