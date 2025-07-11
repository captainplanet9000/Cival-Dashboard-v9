/**
 * Real-time WebSocket Client for Trading Dashboard
 * Handles live market data, portfolio updates, and agent communications
 */

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  bid: number;
  ask: number;
  spread: number;
}

export interface PortfolioUpdate {
  totalValue: number;
  cash: number;
  unrealizedPnL: number;
  realizedPnL: number;
  positions: Position[];
  timestamp: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  marketValue: number;
}

export interface AgentUpdate {
  agentId: string;
  status: 'active' | 'paused' | 'error';
  lastAction: string;
  timestamp: number;
  performance: {
    tradesExecuted: number;
    successRate: number;
    pnl: number;
  };
}

export interface TradingSignal {
  id: string;
  agentId: string;
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  price: number;
  quantity: number;
  reasoning: string[];
  timestamp: number;
}

export interface RiskAlert {
  id: string;
  type: 'position_limit' | 'loss_limit' | 'volatility' | 'correlation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  agentId?: string;
  symbol?: string;
  currentValue: number;
  threshold: number;
  timestamp: number;
}

export interface FarmUpdate {
  farmId: string;
  status: 'active' | 'paused' | 'stopped';
  performance: {
    totalValue: number;
    totalPnL: number;
    winRate: number;
    activeAgents: number;
  };
  timestamp: number;
}

export interface GoalUpdate {
  goalId: string;
  progress: number;
  status: 'active' | 'completed' | 'failed' | 'paused';
  currentValue: number;
  targetValue: number;
  timestamp: number;
}

export interface MemoryUpdate {
  agentId: string;
  memoryId: string;
  memoryType: 'trade_decision' | 'market_insight' | 'strategy_learning' | 'risk_observation' | 'pattern_recognition' | 'performance_feedback';
  content: string;
  importanceScore: number;
  action: 'stored' | 'updated' | 'archived' | 'deleted';
  timestamp: number;
}

export interface MemoryInsight {
  agentId: string;
  insightType: 'pattern_discovered' | 'strategy_improved' | 'risk_identified' | 'performance_analysis';
  description: string;
  confidence: number;
  memoryIds: string[];
  impact: {
    performanceChange: number;
    confidenceChange: number;
    strategyAdjustment?: string;
  };
  timestamp: number;
}

export interface AgentLearningUpdate {
  agentId: string;
  learningMetrics: {
    totalMemories: number;
    avgImportanceScore: number;
    learningEfficiency: number;
    adaptationScore: number;
    patternRecognitionScore: number;
  };
  recentActivity: {
    memoriesAddedToday: number;
    insightsGenerated: number;
    patternsRecognized: number;
  };
  timestamp: number;
}

// ============================================================================
// ORCHESTRATION-SPECIFIC WEBSOCKET EVENTS
// ============================================================================

export interface AgentAssignmentEvent {
  assignmentId: string;
  farmId: string;
  agentId: string;
  agentName: string;
  capitalAllocated: number;
  assignmentType: 'performance_based' | 'manual' | 'rebalance';
  performanceBaseline: number;
  status: 'assigned' | 'active' | 'under_review';
  timestamp: number;
}

export interface CapitalReallocationEvent {
  reallocationId: string;
  strategy: 'performance_weighted' | 'risk_adjusted' | 'equal_weighted' | 'dynamic';
  sourceType: 'goal' | 'farm' | 'agent';
  sourceId: string;
  targetType: 'goal' | 'farm' | 'agent';
  targetId: string;
  amount: number;
  reason: string;
  impact: {
    farmsAffected: string[];
    agentsAffected: string[];
    expectedPerformanceChange: number;
  };
  timestamp: number;
}

export interface PerformanceUpdateEvent {
  entityType: 'agent' | 'farm' | 'goal' | 'portfolio';
  entityId: string;
  entityName: string;
  metrics: {
    totalPnL: number;
    dailyPnL: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    tradesCount: number;
    performanceScore: number;
  };
  attributions: {
    contributions: Record<string, number>;
    confidence: number;
  };
  ranking: {
    position: number;
    totalEntities: number;
    percentile: number;
  };
  timestamp: number;
}

export interface FarmStatusEvent {
  farmId: string;
  farmName: string;
  previousStatus: 'active' | 'paused' | 'stopped' | 'maintenance';
  newStatus: 'active' | 'paused' | 'stopped' | 'maintenance';
  reason: string;
  agentsAffected: Array<{
    agentId: string;
    agentName: string;
    action: 'paused' | 'reassigned' | 'stopped';
  }>;
  capitalImpact: {
    totalCapital: number;
    availableForReallocation: number;
  };
  timestamp: number;
}

export interface GoalProgressEvent {
  goalId: string;
  goalName: string;
  goalType: string;
  progressData: {
    currentValue: number;
    targetValue: number;
    progressPercent: number;
    previousValue: number;
    changeAmount: number;
    changePercent: number;
  };
  attribution: {
    farmContributions: Record<string, number>;
    agentContributions: Record<string, number>;
    topContributor: {
      type: 'farm' | 'agent';
      id: string;
      name: string;
      contribution: number;
    };
  };
  timeline: {
    expectedCompletionDate: string;
    daysRemaining: number;
    achievementProbability: number;
  };
  timestamp: number;
}

export interface OrchestrationSystemEvent {
  eventId: string;
  eventType: 'agent_assigned' | 'capital_reallocated' | 'performance_calculated' | 'farm_status_changed' | 'goal_progress_updated' | 'system_rebalance' | 'risk_threshold_breached';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sourceService: string;
  targetService?: string;
  data: any;
  metadata: {
    correlationId?: string;
    parentEventId?: string;
    processingTime?: number;
  };
  timestamp: number;
}

export interface OrchestrationWebSocketEvents {
  'agent_assigned': AgentAssignmentEvent;
  'capital_reallocated': CapitalReallocationEvent;
  'performance_updated': PerformanceUpdateEvent;
  'farm_status_changed': FarmStatusEvent;
  'goal_progress_updated': GoalProgressEvent;
  'orchestration_event': OrchestrationSystemEvent;
}

export type WebSocketMessage = 
  | { type: 'market_data'; data: MarketData }
  | { type: 'portfolio_update'; data: PortfolioUpdate }
  | { type: 'agent_update'; data: AgentUpdate }
  | { type: 'trading_signal'; data: TradingSignal }
  | { type: 'risk_alert'; data: RiskAlert }
  | { type: 'farm_update'; data: FarmUpdate }
  | { type: 'goal_update'; data: GoalUpdate }
  | { type: 'memory_update'; data: MemoryUpdate }
  | { type: 'memory_insight'; data: MemoryInsight }
  | { type: 'agent_learning_update'; data: AgentLearningUpdate }
  | { type: 'agent_assigned'; data: AgentAssignmentEvent }
  | { type: 'capital_reallocated'; data: CapitalReallocationEvent }
  | { type: 'performance_updated'; data: PerformanceUpdateEvent }
  | { type: 'farm_status_changed'; data: FarmStatusEvent }
  | { type: 'goal_progress_updated'; data: GoalProgressEvent }
  | { type: 'orchestration_event'; data: OrchestrationSystemEvent }
  | { type: 'heartbeat'; timestamp: number }
  | { type: 'error'; message: string };

export class TradingWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private subscriptions = new Set<string>();
  
  // Event handlers
  private handlers: Map<string, Set<(data: any) => void>> = new Map();

  constructor(url: string = 'ws://localhost:8001/ws/trading') {
    this.url = url;
    this.setupHandlers();
  }

  private setupHandlers() {
    // Initialize handler sets for each message type
    const messageTypes = [
      'market_data', 'portfolio_update', 'agent_update', 
      'trading_signal', 'risk_alert', 'farm_update', 'goal_update',
      'memory_update', 'memory_insight', 'agent_learning_update',
      'agent_assigned', 'capital_reallocated', 'performance_updated',
      'farm_status_changed', 'goal_progress_updated', 'orchestration_event',
      'connect', 'disconnect', 'error'
    ];
    
    messageTypes.forEach(type => {
      this.handlers.set(type, new Set());
    });
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected to trading server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connect', { timestamp: Date.now() });
          
          // Re-subscribe to previous subscriptions
          this.subscriptions.forEach(subscription => {
            this.send({ type: 'subscribe', channel: subscription });
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnect', { timestamp: Date.now() });
          
          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', { message: 'WebSocket connection error' });
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    
    this.ws = null;
    this.isConnected = false;
  }

  /**
   * Subscribe to real-time data channel
   */
  subscribe(channel: string): void {
    this.subscriptions.add(channel);
    
    if (this.isConnected) {
      this.send({ type: 'subscribe', channel });
    }
  }

  /**
   * Unsubscribe from data channel
   */
  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    
    if (this.isConnected) {
      this.send({ type: 'unsubscribe', channel });
    }
  }

  /**
   * Add event listener
   */
  on(event: string, handler: (data: any) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  /**
   * Remove event listener
   */
  off(event: string, handler: (data: any) => void): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get subscription list
   */
  get activeSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  // Private methods

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'market_data':
        this.emit('market_data', message.data);
        break;
      case 'portfolio_update':
        this.emit('portfolio_update', message.data);
        break;
      case 'agent_update':
        this.emit('agent_update', message.data);
        break;
      case 'trading_signal':
        this.emit('trading_signal', message.data);
        break;
      case 'risk_alert':
        this.emit('risk_alert', message.data);
        break;
      case 'farm_update':
        this.emit('farm_update', message.data);
        break;
      case 'goal_update':
        this.emit('goal_update', message.data);
        break;
      case 'memory_update':
        this.emit('memory_update', message.data);
        break;
      case 'memory_insight':
        this.emit('memory_insight', message.data);
        break;
      case 'agent_learning_update':
        this.emit('agent_learning_update', message.data);
        break;
      // Orchestration-specific events
      case 'agent_assigned':
        this.emit('agent_assigned', message.data);
        this.emit('orchestration_event', { type: 'agent_assigned', ...message.data });
        break;
      case 'capital_reallocated':
        this.emit('capital_reallocated', message.data);
        this.emit('orchestration_event', { type: 'capital_reallocated', ...message.data });
        break;
      case 'performance_updated':
        this.emit('performance_updated', message.data);
        this.emit('orchestration_event', { type: 'performance_updated', ...message.data });
        break;
      case 'farm_status_changed':
        this.emit('farm_status_changed', message.data);
        this.emit('orchestration_event', { type: 'farm_status_changed', ...message.data });
        break;
      case 'goal_progress_updated':
        this.emit('goal_progress_updated', message.data);
        this.emit('orchestration_event', { type: 'goal_progress_updated', ...message.data });
        break;
      case 'orchestration_event':
        this.emit('orchestration_event', message.data);
        // Also emit the specific event type
        this.emit(message.data.eventType, message.data);
        break;
      case 'heartbeat':
        // Heartbeat received, connection is alive
        break;
      case 'error':
        this.emit('error', { message: message.message });
        break;
      default:
        console.warn('Unknown message type:', message);
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in WebSocket handler for ${event}:`, error);
        }
      });
    }
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, message not sent:', data);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(error => {
        console.error('WebSocket reconnect failed:', error);
      });
    }, delay);
  }
}

// Singleton instance for the dashboard
let wsClient: TradingWebSocketClient | null = null;

export function getWebSocketClient(): TradingWebSocketClient {
  if (!wsClient) {
    wsClient = new TradingWebSocketClient();
  }
  return wsClient;
}

export function disconnectWebSocket(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}

// React hook for using WebSocket in components
import { useEffect, useState } from 'react';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [client] = useState(() => getWebSocketClient());

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    client.on('connect', handleConnect);
    client.on('disconnect', handleDisconnect);

    // Connect if not already connected
    if (!client.connected) {
      client.connect().catch(error => {
        console.error('Failed to connect WebSocket:', error);
      });
    } else {
      setIsConnected(true);
    }

    return () => {
      client.off('connect', handleConnect);
      client.off('disconnect', handleDisconnect);
    };
  }, [client]);

  return {
    client,
    isConnected,
    subscribe: (channel: string) => client.subscribe(channel),
    unsubscribe: (channel: string) => client.unsubscribe(channel),
    on: (event: string, handler: (data: any) => void) => client.on(event, handler),
    off: (event: string, handler: (data: any) => void) => client.off(event, handler)
  };
}

// Market data hooks
export function useMarketData(symbols: string[]) {
  const { client, isConnected } = useWebSocket();
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());

  useEffect(() => {
    if (!isConnected) return;

    const handleMarketData = (data: MarketData) => {
      setMarketData(prev => new Map(prev.set(data.symbol, data)));
    };

    client.on('market_data', handleMarketData);

    // Subscribe to symbols
    symbols.forEach(symbol => {
      client.subscribe(`market_data:${symbol}`);
    });

    return () => {
      client.off('market_data', handleMarketData);
      symbols.forEach(symbol => {
        client.unsubscribe(`market_data:${symbol}`);
      });
    };
  }, [client, isConnected, symbols]);

  return marketData;
}

// Portfolio updates hook
export function usePortfolioUpdates() {
  const { client, isConnected } = useWebSocket();
  const [portfolio, setPortfolio] = useState<PortfolioUpdate | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    const handlePortfolioUpdate = (data: PortfolioUpdate) => {
      setPortfolio(data);
    };

    client.on('portfolio_update', handlePortfolioUpdate);
    client.subscribe('portfolio_updates');

    return () => {
      client.off('portfolio_update', handlePortfolioUpdate);
      client.unsubscribe('portfolio_updates');
    };
  }, [client, isConnected]);

  return portfolio;
}

// Trading signals hook
export function useTradingSignals() {
  const { client, isConnected } = useWebSocket();
  const [signals, setSignals] = useState<TradingSignal[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleTradingSignal = (data: TradingSignal) => {
      setSignals(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 signals
    };

    client.on('trading_signal', handleTradingSignal);
    client.subscribe('trading_signals');

    return () => {
      client.off('trading_signal', handleTradingSignal);
      client.unsubscribe('trading_signals');
    };
  }, [client, isConnected]);

  return signals;
}

// Risk alerts hook
export function useRiskAlerts() {
  const { client, isConnected } = useWebSocket();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleRiskAlert = (data: RiskAlert) => {
      setAlerts(prev => [data, ...prev.slice(0, 19)]); // Keep last 20 alerts
    };

    client.on('risk_alert', handleRiskAlert);
    client.subscribe('risk_alerts');

    return () => {
      client.off('risk_alert', handleRiskAlert);
      client.unsubscribe('risk_alerts');
    };
  }, [client, isConnected]);

  return alerts;
}

// Farm updates hook
export function useFarmUpdates() {
  const { client, isConnected } = useWebSocket();
  const [farmUpdates, setFarmUpdates] = useState<FarmUpdate[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleFarmUpdate = (data: FarmUpdate) => {
      setFarmUpdates(prev => {
        const existingIndex = prev.findIndex(f => f.farmId === data.farmId);
        if (existingIndex >= 0) {
          // Update existing farm
          const updated = [...prev];
          updated[existingIndex] = data;
          return updated;
        } else {
          // Add new farm
          return [data, ...prev.slice(0, 19)]; // Keep last 20 updates
        }
      });
    };

    client.on('farm_update', handleFarmUpdate);
    client.subscribe('farm_updates');

    return () => {
      client.off('farm_update', handleFarmUpdate);
      client.unsubscribe('farm_updates');
    };
  }, [client, isConnected]);

  return farmUpdates;
}

// Goal updates hook
export function useGoalUpdates() {
  const { client, isConnected } = useWebSocket();
  const [goalUpdates, setGoalUpdates] = useState<GoalUpdate[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleGoalUpdate = (data: GoalUpdate) => {
      setGoalUpdates(prev => {
        const existingIndex = prev.findIndex(g => g.goalId === data.goalId);
        if (existingIndex >= 0) {
          // Update existing goal
          const updated = [...prev];
          updated[existingIndex] = data;
          return updated;
        } else {
          // Add new goal
          return [data, ...prev.slice(0, 19)]; // Keep last 20 updates
        }
      });
    };

    client.on('goal_update', handleGoalUpdate);
    client.subscribe('goal_updates');

    return () => {
      client.off('goal_update', handleGoalUpdate);
      client.unsubscribe('goal_updates');
    };
  }, [client, isConnected]);

  return goalUpdates;
}

// Memory updates hook
export function useMemoryUpdates(agentId?: string) {
  const { client, isConnected } = useWebSocket();
  const [memoryUpdates, setMemoryUpdates] = useState<MemoryUpdate[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleMemoryUpdate = (data: MemoryUpdate) => {
      // Filter by agent if specified
      if (agentId && data.agentId !== agentId) return;
      
      setMemoryUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates
    };

    client.on('memory_update', handleMemoryUpdate);
    
    // Subscribe to memory updates for specific agent or all agents
    const channel = agentId ? `memory_updates:${agentId}` : 'memory_updates';
    client.subscribe(channel);

    return () => {
      client.off('memory_update', handleMemoryUpdate);
      client.unsubscribe(channel);
    };
  }, [client, isConnected, agentId]);

  return memoryUpdates;
}

// Memory insights hook
export function useMemoryInsights(agentId?: string) {
  const { client, isConnected } = useWebSocket();
  const [insights, setInsights] = useState<MemoryInsight[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleMemoryInsight = (data: MemoryInsight) => {
      // Filter by agent if specified
      if (agentId && data.agentId !== agentId) return;
      
      setInsights(prev => [data, ...prev.slice(0, 19)]); // Keep last 20 insights
    };

    client.on('memory_insight', handleMemoryInsight);
    
    // Subscribe to memory insights for specific agent or all agents
    const channel = agentId ? `memory_insights:${agentId}` : 'memory_insights';
    client.subscribe(channel);

    return () => {
      client.off('memory_insight', handleMemoryInsight);
      client.unsubscribe(channel);
    };
  }, [client, isConnected, agentId]);

  return insights;
}

// Agent learning updates hook
export function useAgentLearningUpdates(agentId?: string) {
  const { client, isConnected } = useWebSocket();
  const [learningUpdates, setLearningUpdates] = useState<AgentLearningUpdate[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleLearningUpdate = (data: AgentLearningUpdate) => {
      // Filter by agent if specified
      if (agentId && data.agentId !== agentId) return;
      
      setLearningUpdates(prev => {
        const existingIndex = prev.findIndex(l => l.agentId === data.agentId);
        if (existingIndex >= 0) {
          // Update existing agent learning data
          const updated = [...prev];
          updated[existingIndex] = data;
          return updated;
        } else {
          // Add new agent learning data
          return [data, ...prev.slice(0, 9)]; // Keep last 10 agent updates
        }
      });
    };

    client.on('agent_learning_update', handleLearningUpdate);
    
    // Subscribe to learning updates for specific agent or all agents
    const channel = agentId ? `agent_learning:${agentId}` : 'agent_learning';
    client.subscribe(channel);

    return () => {
      client.off('agent_learning_update', handleLearningUpdate);
      client.unsubscribe(channel);
    };
  }, [client, isConnected, agentId]);

  return learningUpdates;
}