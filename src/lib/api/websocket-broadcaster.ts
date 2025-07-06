/**
 * WebSocket Event Broadcasting Utility
 * Allows Next.js API routes to broadcast real-time events to connected clients
 * via the external WebSocket server (Python backend)
 */

interface BroadcastEvent {
  type: string
  data: any
  timestamp?: string
  priority?: number
}

interface BroadcastResponse {
  success: boolean
  message?: string
  error?: string
}

class WebSocketBroadcaster {
  private backendUrl: string

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  /**
   * Broadcast an event to all connected WebSocket clients
   */
  async broadcast(event: BroadcastEvent): Promise<BroadcastResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/api/v1/websocket/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: event.type,
          data: event.data,
          timestamp: event.timestamp || new Date().toISOString(),
          priority: event.priority || 5
        })
      })

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }

      const result = await response.json()
      return {
        success: true,
        message: result.message || 'Event broadcasted successfully'
      }
    } catch (error) {
      console.warn('WebSocket broadcast failed, continuing without real-time updates:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown broadcast error'
      }
    }
  }

  /**
   * Broadcast agent status update
   */
  async broadcastAgentUpdate(agentId: string, agentData: any): Promise<BroadcastResponse> {
    return this.broadcast({
      type: 'agent_update',
      data: {
        agentId,
        ...agentData
      },
      priority: 6
    })
  }

  /**
   * Broadcast portfolio update
   */
  async broadcastPortfolioUpdate(portfolioData: any): Promise<BroadcastResponse> {
    return this.broadcast({
      type: 'portfolio_update',
      data: portfolioData,
      priority: 7
    })
  }

  /**
   * Broadcast trading signal/decision
   */
  async broadcastTradingDecision(decision: any): Promise<BroadcastResponse> {
    return this.broadcast({
      type: 'trading_decision',
      data: decision,
      priority: 8
    })
  }

  /**
   * Broadcast paper trade execution
   */
  async broadcastPaperTrade(tradeData: any): Promise<BroadcastResponse> {
    return this.broadcast({
      type: 'paper_trade',
      data: tradeData,
      priority: 7
    })
  }

  /**
   * Broadcast farm update
   */
  async broadcastFarmUpdate(farmId: string, farmData: any): Promise<BroadcastResponse> {
    return this.broadcast({
      type: 'farm_update',
      data: {
        farmId,
        ...farmData
      },
      priority: 6
    })
  }

  /**
   * Broadcast goal update
   */
  async broadcastGoalUpdate(goalId: string, goalData: any): Promise<BroadcastResponse> {
    return this.broadcast({
      type: 'goal_update',
      data: {
        goalId,
        ...goalData
      },
      priority: 6
    })
  }

  /**
   * Broadcast market data update
   */
  async broadcastMarketData(marketData: any): Promise<BroadcastResponse> {
    return this.broadcast({
      type: 'market_data',
      data: marketData,
      priority: 5
    })
  }

  /**
   * Broadcast risk alert
   */
  async broadcastRiskAlert(alertData: any): Promise<BroadcastResponse> {
    return this.broadcast({
      type: 'risk_alert',
      data: alertData,
      priority: 9
    })
  }

  /**
   * Broadcast notification
   */
  async broadcastNotification(notification: any): Promise<BroadcastResponse> {
    return this.broadcast({
      type: 'notification',
      data: notification,
      priority: notification.priority || 5
    })
  }
}

// Export singleton instance
export const webSocketBroadcaster = new WebSocketBroadcaster()

// Export utility functions for easy use in API routes
export const broadcastEvent = (event: BroadcastEvent) => webSocketBroadcaster.broadcast(event)
export const broadcastAgentUpdate = (agentId: string, agentData: any) => webSocketBroadcaster.broadcastAgentUpdate(agentId, agentData)
export const broadcastPortfolioUpdate = (portfolioData: any) => webSocketBroadcaster.broadcastPortfolioUpdate(portfolioData)
export const broadcastTradingDecision = (decision: any) => webSocketBroadcaster.broadcastTradingDecision(decision)
export const broadcastPaperTrade = (tradeData: any) => webSocketBroadcaster.broadcastPaperTrade(tradeData)
export const broadcastFarmUpdate = (farmId: string, farmData: any) => webSocketBroadcaster.broadcastFarmUpdate(farmId, farmData)
export const broadcastGoalUpdate = (goalId: string, goalData: any) => webSocketBroadcaster.broadcastGoalUpdate(goalId, goalData)
export const broadcastMarketData = (marketData: any) => webSocketBroadcaster.broadcastMarketData(marketData)
export const broadcastRiskAlert = (alertData: any) => webSocketBroadcaster.broadcastRiskAlert(alertData)
export const broadcastNotification = (notification: any) => webSocketBroadcaster.broadcastNotification(notification)