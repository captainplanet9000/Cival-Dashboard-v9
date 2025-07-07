'use client'

// WebSocket risk event broadcaster
export async function broadcastRiskEvent(eventType: string, data: any) {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log(`🔊 Risk Event [${eventType}]:`, data)
      return
    }

    // Import WebSocket service dynamically
    const { webSocketService } = await import('@/lib/websocket/websocket-service')
    
    // Broadcast risk event
    webSocketService.emit('risk_event', {
      type: eventType,
      data,
      timestamp: Date.now()
    })
    
    console.log(`📡 Risk event broadcast: ${eventType}`)
    
  } catch (error) {
    console.error('Error broadcasting risk event:', error)
  }
}

// Specific risk event broadcasters
export async function broadcastRiskAlert(alert: any) {
  await broadcastRiskEvent('risk_alert', alert)
}

export async function broadcastRiskMetricsUpdate(metrics: any) {
  await broadcastRiskEvent('risk_metrics_update', metrics)
}

export async function broadcastPositionRiskUpdate(positionRisk: any) {
  await broadcastRiskEvent('position_risk_update', positionRisk)
}

export async function broadcastEmergencyStop(reason: string) {
  await broadcastRiskEvent('emergency_stop', { reason, timestamp: Date.now() })
}

export async function broadcastStopLossTriggered(agentId: string, symbol: string, details: any) {
  await broadcastRiskEvent('stop_loss_triggered', {
    agentId,
    symbol,
    details,
    timestamp: Date.now()
  })
}

export async function broadcastTakeProfitTriggered(agentId: string, symbol: string, details: any) {
  await broadcastRiskEvent('take_profit_triggered', {
    agentId,
    symbol,
    details,
    timestamp: Date.now()
  })
}