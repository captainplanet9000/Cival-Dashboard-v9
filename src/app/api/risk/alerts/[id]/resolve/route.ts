import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id
    
    // In a real implementation, would update alert in database
    // For now, we'll emit a WebSocket event to update the frontend
    
    // Import the WebSocket broadcaster
    const { broadcastRiskEvent } = await import('@/lib/websocket/risk-broadcaster')
    
    // Broadcast alert resolution
    await broadcastRiskEvent('alert_resolved', {
      alertId,
      resolvedAt: Date.now(),
      resolvedBy: 'user' // In production, would use actual user ID
    })
    
    return NextResponse.json({ 
      success: true, 
      alertId,
      resolvedAt: Date.now()
    })
    
  } catch (error) {
    console.error('Error resolving alert:', error)
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    )
  }
}