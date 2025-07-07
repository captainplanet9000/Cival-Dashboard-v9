import { NextRequest, NextResponse } from 'next/server'
import { realPaperTradingEngine } from '@/lib/trading/real-paper-trading-engine'

export async function POST(request: NextRequest) {
  try {
    const { reason = 'Manual emergency stop activated' } = await request.json().catch(() => ({}))
    
    // Activate emergency stop in the trading engine
    await realPaperTradingEngine.emergencyStop(reason)
    
    // Get all active agents
    const agents = await realPaperTradingEngine.getAllAgents()
    
    // Stop all agent trading
    const stopPromises = agents.map(async (agent) => {
      try {
        await realPaperTradingEngine.pauseAgent(agent.id)
        return { agentId: agent.id, status: 'stopped' }
      } catch (error) {
        console.error(`Failed to stop agent ${agent.id}:`, error)
        return { agentId: agent.id, status: 'error', error: (error as Error).message }
      }
    })
    
    const stopResults = await Promise.allSettled(stopPromises)
    
    // Cancel all pending orders
    const cancelPromises = agents.flatMap(agent => 
      agent.portfolio.orders
        .filter((order: any) => order.status === 'pending')
        .map(async (order: any) => {
          try {
            await realPaperTradingEngine.cancelOrder(order.id)
            return { orderId: order.id, status: 'cancelled' }
          } catch (error) {
            console.error(`Failed to cancel order ${order.id}:`, error)
            return { orderId: order.id, status: 'error', error: (error as Error).message }
          }
        })
    )
    
    const cancelResults = await Promise.allSettled(cancelPromises)
    
    // Create emergency alert
    const emergencyAlert = {
      id: `emergency_${Date.now()}`,
      type: 'emergency',
      severity: 'critical' as const,
      message: 'Emergency stop activated - all trading halted',
      details: reason,
      agentId: null,
      symbol: null,
      value: 0,
      threshold: 0,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    }
    
    // Broadcast emergency stop via WebSocket
    try {
      const { broadcastRiskEvent } = await import('@/lib/websocket/risk-broadcaster')
      await broadcastRiskEvent('emergency_stop', {
        reason,
        timestamp: Date.now(),
        affectedAgents: agents.length,
        cancelledOrders: cancelResults.length,
        alert: emergencyAlert
      })
    } catch (error) {
      console.error('Error broadcasting emergency stop:', error)
    }
    
    // Log emergency stop
    console.log(`🚨 EMERGENCY STOP ACTIVATED: ${reason}`)
    console.log(`- Stopped ${agents.length} agents`)
    console.log(`- Cancelled ${cancelResults.length} pending orders`)
    
    return NextResponse.json({
      success: true,
      emergencyStop: {
        activated: true,
        reason,
        timestamp: Date.now(),
        affectedAgents: agents.length,
        stoppedAgents: stopResults.filter(r => r.status === 'fulfilled').length,
        cancelledOrders: cancelResults.filter(r => r.status === 'fulfilled').length,
        alert: emergencyAlert
      },
      agents: stopResults.map(result => ({
        ...(result.status === 'fulfilled' ? result.value : { status: 'error', error: 'Unknown error' })
      })),
      orders: cancelResults.map(result => ({
        ...(result.status === 'fulfilled' ? result.value : { status: 'error', error: 'Unknown error' })
      }))
    })
    
  } catch (error) {
    console.error('Error activating emergency stop:', error)
    return NextResponse.json(
      { error: 'Failed to activate emergency stop' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Deactivate emergency stop
    await realPaperTradingEngine.resumeTrading()
    
    // Broadcast emergency stop deactivation
    try {
      const { broadcastRiskEvent } = await import('@/lib/websocket/risk-broadcaster')
      await broadcastRiskEvent('emergency_stop_deactivated', {
        deactivatedAt: Date.now(),
        deactivatedBy: 'user' // In production, would use actual user ID
      })
    } catch (error) {
      console.error('Error broadcasting emergency stop deactivation:', error)
    }
    
    console.log('✅ Emergency stop deactivated - trading can resume')
    
    return NextResponse.json({
      success: true,
      emergencyStop: {
        activated: false,
        deactivatedAt: Date.now()
      }
    })
    
  } catch (error) {
    console.error('Error deactivating emergency stop:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate emergency stop' },
      { status: 500 }
    )
  }
}