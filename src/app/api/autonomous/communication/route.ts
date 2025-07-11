import { NextRequest, NextResponse } from 'next/server'

// Agent communication API endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const agent_id = searchParams.get('agent_id')
    
    switch (action) {
      case 'messages':
        return NextResponse.json({
          success: true,
          data: [
            {
              message_id: 'msg-1',
              conversation_id: 'conv-1',
              from_agent_id: 'marcus_momentum',
              to_agent_id: 'alex_arbitrage',
              message_type: 'market_insight',
              priority: 'high',
              subject: 'BTC/USD Breakout Pattern',
              content: 'I\'ve detected a strong bullish breakout pattern in BTC/USD. RSI shows momentum building, and volume is increasing.',
              metadata: { symbol: 'BTC/USD', confidence: 0.85 },
              timestamp: new Date(Date.now() - 120000).toISOString(),
              read: false,
              processed: false,
              response_required: true
            },
            {
              message_id: 'msg-2',
              conversation_id: 'conv-1',
              from_agent_id: 'alex_arbitrage',
              to_agent_id: 'marcus_momentum',
              message_type: 'trading_opportunity',
              priority: 'high',
              subject: 'Re: BTC/USD Breakout Pattern',
              content: 'Confirmed! I see a 0.12% spread between Binance and Coinbase. Executing arbitrage now.',
              metadata: { spread: 0.0012, exchanges: ['binance', 'coinbase'] },
              timestamp: new Date(Date.now() - 60000).toISOString(),
              read: true,
              processed: false,
              response_required: false
            }
          ]
        })
      
      case 'conversations':
        return NextResponse.json({
          success: true,
          data: [
            {
              conversation_id: 'conv-1',
              participants: ['marcus_momentum', 'alex_arbitrage'],
              topic: 'BTC/USD Trading Opportunity',
              status: 'active',
              created_at: new Date(Date.now() - 1800000).toISOString(),
              updated_at: new Date(Date.now() - 120000).toISOString(),
              message_count: 8,
              last_message_id: 'msg-8'
            },
            {
              conversation_id: 'conv-2',
              participants: ['riley_risk', 'marcus_momentum', 'alex_arbitrage'],
              topic: 'Risk Assessment: High Volatility Alert',
              status: 'active',
              created_at: new Date(Date.now() - 3600000).toISOString(),
              updated_at: new Date(Date.now() - 300000).toISOString(),
              message_count: 5,
              last_message_id: 'msg-5'
            }
          ]
        })
      
      case 'metrics':
        return NextResponse.json({
          success: true,
          data: {
            total_messages: 156,
            messages_by_type: {
              market_insight: 45,
              trading_opportunity: 32,
              risk_alert: 23,
              coordination_request: 28,
              decision_vote: 18,
              status_update: 10
            },
            active_conversations: 3,
            registered_agents: 4,
            agent_participation: {
              marcus_momentum: 42,
              alex_arbitrage: 38,
              sophia_reversion: 35,
              riley_risk: 41
            },
            message_success_rate: 0.96,
            recent_activity: {
              last_hour: 8,
              last_day: 45
            }
          }
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Communication API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    switch (action) {
      case 'send_message':
        const { from_agent_id, to_agent_id, message_type, subject, content, priority, response_required } = body
        
        return NextResponse.json({
          success: true,
          message: 'Message sent successfully',
          data: {
            message_id: `msg-${Date.now()}`,
            conversation_id: 'conv-new',
            from_agent_id,
            to_agent_id,
            message_type,
            subject,
            content,
            priority,
            response_required,
            timestamp: new Date().toISOString()
          }
        })
      
      case 'mark_read':
        const { message_id, agent_id } = body
        
        return NextResponse.json({
          success: true,
          message: 'Message marked as read',
          data: {
            message_id,
            agent_id,
            timestamp: new Date().toISOString()
          }
        })
      
      case 'create_conversation':
        const { agent_ids, topic } = body
        
        return NextResponse.json({
          success: true,
          message: 'Conversation created',
          data: {
            conversation_id: `conv-${Date.now()}`,
            participants: agent_ids,
            topic,
            status: 'active',
            created_at: new Date().toISOString(),
            message_count: 0
          }
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Communication API POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}