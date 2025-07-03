import { NextRequest } from 'next/server'

// WebSocket endpoint for development
// This provides mock WebSocket functionality via Server-Sent Events (SSE)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stream = searchParams.get('stream')
  
  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder()
  
  const readable = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectionData = `data: ${JSON.stringify({
        type: 'connection',
        status: 'connected',
        timestamp: new Date().toISOString()
      })}\n\n`
      controller.enqueue(encoder.encode(connectionData))
      
      // Send periodic updates based on requested stream
      const interval = setInterval(() => {
        let data
        
        switch (stream) {
          case 'market_data':
            data = {
              type: 'market_data',
              data: {
                symbol: 'BTC/USD',
                price: 45000 + Math.random() * 1000,
                change24h: (Math.random() - 0.5) * 2000,
                volume24h: Math.random() * 1000000000,
                timestamp: new Date().toISOString()
              }
            }
            break
            
          case 'farm_update':
            data = {
              type: 'farm_update',
              data: {
                farmId: 'farm_darvas_1',
                status: 'active',
                performance: {
                  totalValue: 52000 + Math.random() * 1000,
                  totalPnL: 2000 + Math.random() * 500,
                  winRate: 92 + Math.random() * 5,
                  activeAgents: 3
                },
                timestamp: new Date().toISOString()
              }
            }
            break
            
          case 'goal_update':
            data = {
              type: 'goal_update',
              data: {
                goalId: 'goal_profit_001',
                progress: Math.min(100, 47 + Math.random() * 10),
                status: 'active',
                currentValue: 2350 + Math.random() * 100,
                targetValue: 5000,
                timestamp: new Date().toISOString()
              }
            }
            break
            
          case 'trading_signal':
            data = {
              type: 'trading_signal',
              data: {
                symbol: 'ETH/USD',
                action: Math.random() > 0.5 ? 'buy' : 'sell',
                price: 3000 + Math.random() * 200,
                confidence: 0.7 + Math.random() * 0.3,
                strategy: 'darvas_box',
                timestamp: new Date().toISOString()
              }
            }
            break
            
          default:
            data = {
              type: 'heartbeat',
              data: { timestamp: new Date().toISOString() }
            }
        }
        
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }, 2000) // Update every 2 seconds
      
      // Cleanup on stream close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })
  
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle WebSocket-like messages sent via POST
    console.log('📡 WebSocket message received:', body)
    
    // Echo back the message with a response
    const response = {
      type: 'response',
      originalMessage: body,
      status: 'received',
      timestamp: new Date().toISOString()
    }
    
    return Response.json(response)
  } catch (error) {
    console.error('❌ Error handling WebSocket message:', error)
    return Response.json({ error: 'Invalid message format' }, { status: 400 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control'
    }
  })
}