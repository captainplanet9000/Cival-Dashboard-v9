// Paper Trading WebSocket Event System
import type {
  AgentPaperTradingAccount,
  AgentPaperPosition,
  AgentPaperOrderRequest,
  AgentPaperTradingAlert,
  AgentPaperTradingDecision
} from '@/types/agent-paper-trading';

// Paper Trading Specific Events
export interface PaperTradingEvents {
  // Order Events
  'paper_order_created': {
    agentId: string;
    accountId: string;
    order: AgentPaperOrderRequest;
    timestamp: string;
  };
  
  'paper_order_filled': {
    agentId: string;
    accountId: string;
    orderId: string;
    fillPrice: number;
    fillQuantity: number;
    remainingQuantity: number;
    timestamp: string;
  };
  
  'paper_order_cancelled': {
    agentId: string;
    accountId: string;
    orderId: string;
    reason: string;
    timestamp: string;
  };
  
  'paper_order_rejected': {
    agentId: string;
    accountId: string;
    orderId: string;
    reason: string;
    timestamp: string;
  };

  // Position Events
  'paper_position_opened': {
    agentId: string;
    accountId: string;
    position: AgentPaperPosition;
    timestamp: string;
  };
  
  'paper_position_updated': {
    agentId: string;
    accountId: string;
    positionId: string;
    changes: Partial<AgentPaperPosition>;
    timestamp: string;
  };
  
  'paper_position_closed': {
    agentId: string;
    accountId: string;
    positionId: string;
    closePrice: number;
    pnl: number;
    timestamp: string;
  };

  // Account Events
  'paper_account_updated': {
    agentId: string;
    account: AgentPaperTradingAccount;
    changes: string[];
    timestamp: string;
  };
  
  'paper_balance_changed': {
    agentId: string;
    accountId: string;
    oldBalance: number;
    newBalance: number;
    change: number;
    reason: string;
    timestamp: string;
  };

  // Risk Events
  'paper_risk_alert': {
    agentId: string;
    accountId: string;
    alert: AgentPaperTradingAlert;
    timestamp: string;
  };
  
  'paper_drawdown_limit_hit': {
    agentId: string;
    accountId: string;
    currentDrawdown: number;
    maxAllowed: number;
    timestamp: string;
  };
  
  'paper_position_limit_exceeded': {
    agentId: string;
    accountId: string;
    symbol: string;
    currentSize: number;
    maxAllowed: number;
    timestamp: string;
  };

  // Strategy Events
  'paper_strategy_started': {
    agentId: string;
    accountId: string;
    strategyId: string;
    strategyName: string;
    timestamp: string;
  };
  
  'paper_strategy_stopped': {
    agentId: string;
    accountId: string;
    strategyId: string;
    reason: string;
    timestamp: string;
  };
  
  'paper_strategy_signal': {
    agentId: string;
    accountId: string;
    strategyId: string;
    signal: {
      symbol: string;
      action: 'buy' | 'sell' | 'hold';
      confidence: number;
      reasoning: string;
    };
    timestamp: string;
  };

  // Decision Events
  'paper_agent_decision': {
    agentId: string;
    accountId: string;
    decision: AgentPaperTradingDecision;
    timestamp: string;
  };
  
  'paper_execution_result': {
    agentId: string;
    accountId: string;
    decisionId: string;
    ordersCreated: string[];
    success: boolean;
    error?: string;
    timestamp: string;
  };

  // Performance Events
  'paper_performance_update': {
    agentId: string;
    accountId: string;
    performance: {
      totalReturn: number;
      dailyPnl: number;
      winRate: number;
      sharpeRatio: number;
    };
    timestamp: string;
  };
  
  'paper_milestone_reached': {
    agentId: string;
    accountId: string;
    milestone: {
      type: 'profit_target' | 'trade_count' | 'time_period';
      value: number;
      description: string;
    };
    timestamp: string;
  };

  // System Events
  'paper_trading_session_started': {
    agentId: string;
    accountId: string;
    sessionId: string;
    sessionType: string;
    timestamp: string;
  };
  
  'paper_trading_session_ended': {
    agentId: string;
    accountId: string;
    sessionId: string;
    duration: number;
    performance: any;
    timestamp: string;
  };
}

// Event Handler Types
export type PaperTradingEventHandler<T> = (data: T) => void | Promise<void>;

export interface PaperTradingEventSubscription {
  id: string;
  eventType: keyof PaperTradingEvents;
  handler: PaperTradingEventHandler<any>;
  agentFilter?: string;
  accountFilter?: string;
}

// WebSocket Event Bus for Paper Trading
export class PaperTradingEventBus {
  private subscriptions: Map<string, PaperTradingEventSubscription> = new Map();
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isConnected = false;

  constructor(private wsUrl: string = 'ws://localhost:8000/ws/paper-trading') {}

  // Connection Management
  async connect(): Promise<void> {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.wsUrl);

        this.websocket.onopen = () => {
          console.log('Paper Trading WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.resubscribeAll();
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.websocket.onclose = () => {
          console.log('Paper Trading WebSocket disconnected');
          this.isConnected = false;
          this.attemptReconnect();
        };

        this.websocket.onerror = (error) => {
          console.error('Paper Trading WebSocket error:', error);
          reject(error);
        };

        // Timeout the connection attempt
        setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect Paper Trading WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached for Paper Trading WebSocket');
    }
  }

  private resubscribeAll(): void {
    // Send subscription requests for all active subscriptions
    for (const subscription of this.subscriptions.values()) {
      this.sendSubscriptionMessage(subscription);
    }
  }

  private sendSubscriptionMessage(subscription: PaperTradingEventSubscription): void {
    if (!this.isConnected || !this.websocket) return;

    const message = {
      type: 'subscribe',
      eventType: subscription.eventType,
      filters: {
        agentId: subscription.agentFilter,
        accountId: subscription.accountFilter
      }
    };

    this.websocket.send(JSON.stringify(message));
  }

  // Event Subscription
  subscribe<K extends keyof PaperTradingEvents>(
    eventType: K,
    handler: PaperTradingEventHandler<PaperTradingEvents[K]>,
    filters?: {
      agentId?: string;
      accountId?: string;
    }
  ): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: PaperTradingEventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      agentFilter: filters?.agentId,
      accountFilter: filters?.accountId
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message if connected
    if (this.isConnected) {
      this.sendSubscriptionMessage(subscription);
    }

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    this.subscriptions.delete(subscriptionId);

    // Send unsubscribe message if connected
    if (this.isConnected && this.websocket) {
      const message = {
        type: 'unsubscribe',
        subscriptionId
      };
      this.websocket.send(JSON.stringify(message));
    }

    return true;
  }

  // Event Emission (for local events)
  emit<K extends keyof PaperTradingEvents>(
    eventType: K,
    data: PaperTradingEvents[K]
  ): void {
    // Find matching subscriptions
    const matchingSubscriptions = Array.from(this.subscriptions.values()).filter(sub => {
      if (sub.eventType !== eventType) return false;
      
      // Apply filters
      if (sub.agentFilter && data.agentId !== sub.agentFilter) return false;
      if (sub.accountFilter && data.accountId !== sub.accountFilter) return false;
      
      return true;
    });

    // Call handlers
    matchingSubscriptions.forEach(sub => {
      try {
        sub.handler(data);
      } catch (error) {
        console.error('Error in paper trading event handler:', error);
      }
    });
  }

  // Message Handling
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'event' && message.eventType && message.data) {
        this.emit(message.eventType, message.data);
      } else if (message.type === 'ping') {
        // Respond to ping
        this.websocket?.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('Error parsing paper trading WebSocket message:', error);
    }
  }

  // Utility Methods
  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  getSubscriptionsForAgent(agentId: string): PaperTradingEventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => 
      sub.agentFilter === agentId
    );
  }

  // Convenience subscription methods
  subscribeToAgentEvents(
    agentId: string,
    handler: PaperTradingEventHandler<any>
  ): string[] {
    const subscriptionIds: string[] = [];
    
    // Subscribe to key events for this agent
    const eventTypes: (keyof PaperTradingEvents)[] = [
      'paper_order_filled',
      'paper_position_updated',
      'paper_account_updated',
      'paper_risk_alert',
      'paper_performance_update'
    ];

    eventTypes.forEach(eventType => {
      const id = this.subscribe(eventType, handler, { agentId });
      subscriptionIds.push(id);
    });

    return subscriptionIds;
  }

  subscribeToAccountEvents(
    accountId: string,
    handler: PaperTradingEventHandler<any>
  ): string[] {
    const subscriptionIds: string[] = [];
    
    const eventTypes: (keyof PaperTradingEvents)[] = [
      'paper_order_created',
      'paper_order_filled',
      'paper_position_opened',
      'paper_position_closed',
      'paper_balance_changed'
    ];

    eventTypes.forEach(eventType => {
      const id = this.subscribe(eventType, handler, { accountId });
      subscriptionIds.push(id);
    });

    return subscriptionIds;
  }

  subscribeToRiskEvents(
    handler: PaperTradingEventHandler<any>,
    agentId?: string
  ): string[] {
    const subscriptionIds: string[] = [];
    
    const riskEvents: (keyof PaperTradingEvents)[] = [
      'paper_risk_alert',
      'paper_drawdown_limit_hit',
      'paper_position_limit_exceeded'
    ];

    riskEvents.forEach(eventType => {
      const id = this.subscribe(eventType, handler, agentId ? { agentId } : undefined);
      subscriptionIds.push(id);
    });

    return subscriptionIds;
  }

  // Batch unsubscribe
  unsubscribeMultiple(subscriptionIds: string[]): number {
    let unsubscribed = 0;
    subscriptionIds.forEach(id => {
      if (this.unsubscribe(id)) {
        unsubscribed++;
      }
    });
    return unsubscribed;
  }
}

// Global event bus instance
export const paperTradingEventBus = new PaperTradingEventBus();

// Event emitter helpers
export class PaperTradingEventEmitter {
  static emitOrderCreated(
    agentId: string,
    accountId: string,
    order: AgentPaperOrderRequest
  ): void {
    paperTradingEventBus.emit('paper_order_created', {
      agentId,
      accountId,
      order,
      timestamp: new Date().toISOString()
    });
  }

  static emitOrderFilled(
    agentId: string,
    accountId: string,
    orderId: string,
    fillPrice: number,
    fillQuantity: number,
    remainingQuantity: number
  ): void {
    paperTradingEventBus.emit('paper_order_filled', {
      agentId,
      accountId,
      orderId,
      fillPrice,
      fillQuantity,
      remainingQuantity,
      timestamp: new Date().toISOString()
    });
  }

  static emitPositionOpened(
    agentId: string,
    accountId: string,
    position: AgentPaperPosition
  ): void {
    paperTradingEventBus.emit('paper_position_opened', {
      agentId,
      accountId,
      position,
      timestamp: new Date().toISOString()
    });
  }

  static emitRiskAlert(
    agentId: string,
    accountId: string,
    alert: AgentPaperTradingAlert
  ): void {
    paperTradingEventBus.emit('paper_risk_alert', {
      agentId,
      accountId,
      alert,
      timestamp: new Date().toISOString()
    });
  }

  static emitPerformanceUpdate(
    agentId: string,
    accountId: string,
    performance: {
      totalReturn: number;
      dailyPnl: number;
      winRate: number;
      sharpeRatio: number;
    }
  ): void {
    paperTradingEventBus.emit('paper_performance_update', {
      agentId,
      accountId,
      performance,
      timestamp: new Date().toISOString()
    });
  }

  static emitAgentDecision(
    agentId: string,
    accountId: string,
    decision: AgentPaperTradingDecision
  ): void {
    paperTradingEventBus.emit('paper_agent_decision', {
      agentId,
      accountId,
      decision,
      timestamp: new Date().toISOString()
    });
  }
}

// React hook for paper trading events (optional)
export function usePaperTradingEvents() {
  return {
    eventBus: paperTradingEventBus,
    subscribe: paperTradingEventBus.subscribe.bind(paperTradingEventBus),
    unsubscribe: paperTradingEventBus.unsubscribe.bind(paperTradingEventBus),
    emit: paperTradingEventBus.emit.bind(paperTradingEventBus),
    isConnected: paperTradingEventBus.isConnectedToServer.bind(paperTradingEventBus)
  };
}