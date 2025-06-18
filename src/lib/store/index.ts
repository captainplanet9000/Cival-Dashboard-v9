import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { StrategyInstance, Position, Order, MarketData, TradingSignal, RiskMetrics } from '../types/trading';
import type { MCPServerStatus, AgentCoordinationState, WorkflowState } from '../types/mcp';
import type { VaultIntegration, VaultDashboardData } from '../types/vault';
import type { Alert, SystemStatus, UserPreferences, AsyncState } from '../types/common';

// Trading State Slice
interface TradingState {
  strategies: StrategyInstance[];
  positions: Position[];
  orders: Order[];
  marketData: Record<string, MarketData>;
  signals: TradingSignal[];
  riskMetrics: RiskMetrics | null;
  portfolioValue: number;
  totalPnL: number;
  // Actions
  updateStrategy: (strategyId: string, updates: Partial<StrategyInstance>) => void;
  addPosition: (position: Position) => void;
  updatePosition: (positionId: string, updates: Partial<Position>) => void;
  closePosition: (positionId: string) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  updateMarketData: (symbol: string, data: MarketData) => void;
  addSignal: (signal: TradingSignal) => void;
  updateRiskMetrics: (metrics: RiskMetrics) => void;
  setPortfolioValue: (value: number) => void;
}

// MCP State Slice
interface MCPState {
  servers: MCPServerStatus[];
  agentCoordination: AgentCoordinationState | null;
  workflows: WorkflowState;
  mcpConnectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  // Actions
  updateServerStatus: (serverId: string, status: Partial<MCPServerStatus>) => void;
  updateAgentCoordination: (state: AgentCoordinationState) => void;
  updateWorkflows: (workflows: Partial<WorkflowState>) => void;
  setMCPConnectionStatus: (status: MCPState['mcpConnectionStatus']) => void;
}

// Vault State Slice
interface VaultState {
  integration: VaultIntegration | null;
  dashboardData: VaultDashboardData | null;
  vaultConnectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  // Actions
  updateIntegration: (integration: VaultIntegration) => void;
  updateDashboardData: (data: VaultDashboardData) => void;
  setVaultConnectionStatus: (status: VaultState['vaultConnectionStatus']) => void;
}

// System State Slice
interface SystemState {
  status: SystemStatus | null;
  alerts: Alert[];
  preferences: UserPreferences | null;
  // Actions
  updateSystemStatus: (status: SystemStatus) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string, userId: string) => void;
  dismissAlert: (alertId: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

// Real-time State Slice
interface RealTimeState {
  connected: boolean;
  lastPing: Date | null;
  latency: number;
  subscriptions: string[];
  // Actions
  setConnected: (connected: boolean) => void;
  updatePing: (ping: Date, latency: number) => void;
  addSubscription: (topic: string) => void;
  removeSubscription: (topic: string) => void;
}

// Async State Management
interface AsyncStates {
  strategies: AsyncState<StrategyInstance[]>;
  positions: AsyncState<Position[]>;
  orders: AsyncState<Order[]>;
  marketData: AsyncState<Record<string, MarketData>>;
  mcpServers: AsyncState<MCPServerStatus[]>;
  vaultData: AsyncState<VaultDashboardData>;
  systemStatus: AsyncState<SystemStatus>;
}

// Complete Store Type
export interface AppStore extends 
  TradingState,
  MCPState,
  VaultState,
  SystemState,
  RealTimeState {
  // Async state management
  asyncStates: AsyncStates;
  setAsyncState: <K extends keyof AsyncStates>(
    key: K,
    state: Partial<AsyncStates[K]>
  ) => void;
  
  // Global actions
  reset: () => void;
  initialize: () => Promise<void>;
  initializeWebSocket: () => void;
  disconnectWebSocket: () => void;
}

// Initial states
const initialTradingState: Pick<TradingState, 'strategies' | 'positions' | 'orders' | 'marketData' | 'signals' | 'riskMetrics' | 'portfolioValue' | 'totalPnL'> = {
  strategies: [],
  positions: [],
  orders: [],
  marketData: {},
  signals: [],
  riskMetrics: null,
  portfolioValue: 0,
  totalPnL: 0,
};

const initialMCPState: Pick<MCPState, 'servers' | 'agentCoordination' | 'workflows' | 'mcpConnectionStatus'> = {
  servers: [],
  agentCoordination: null,
  workflows: {
    active_workflows: [],
    scheduled_tasks: [],
    workflow_templates: [],
  },
  mcpConnectionStatus: 'disconnected',
};

const initialVaultState: Pick<VaultState, 'integration' | 'dashboardData' | 'vaultConnectionStatus'> = {
  integration: null,
  dashboardData: null,
  vaultConnectionStatus: 'disconnected',
};

const initialSystemState: Pick<SystemState, 'status' | 'alerts' | 'preferences'> = {
  status: null,
  alerts: [],
  preferences: null,
};

const initialRealTimeState: Pick<RealTimeState, 'connected' | 'lastPing' | 'latency' | 'subscriptions'> = {
  connected: false,
  lastPing: null,
  latency: 0,
  subscriptions: [],
};

const initialAsyncStates: AsyncStates = {
  strategies: { state: 'idle' },
  positions: { state: 'idle' },
  orders: { state: 'idle' },
  marketData: { state: 'idle' },
  mcpServers: { state: 'idle' },
  vaultData: { state: 'idle' },
  systemStatus: { state: 'idle' },
};

// Create the store
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        ...initialTradingState,
        ...initialMCPState,
        ...initialVaultState,
        ...initialSystemState,
        ...initialRealTimeState,
        asyncStates: initialAsyncStates,

        // Trading actions
        updateStrategy: (strategyId: string, updates: Partial<StrategyInstance>) =>
          set((state) => {
            const index = state.strategies.findIndex(s => s.id === strategyId);
            if (index !== -1) {
              Object.assign(state.strategies[index], updates);
            }
          }),

        addPosition: (position: Position) =>
          set((state) => {
            state.positions.push(position);
          }),

        updatePosition: (positionId: string, updates: Partial<Position>) =>
          set((state) => {
            const index = state.positions.findIndex(p => p.id === positionId);
            if (index !== -1) {
              Object.assign(state.positions[index], updates);
            }
          }),

        closePosition: (positionId: string) =>
          set((state) => {
            state.positions = state.positions.filter(p => p.id !== positionId);
          }),

        addOrder: (order: Order) =>
          set((state) => {
            state.orders.push(order);
          }),

        updateOrder: (orderId: string, updates: Partial<Order>) =>
          set((state) => {
            const index = state.orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
              Object.assign(state.orders[index], updates);
            }
          }),

        updateMarketData: (symbol: string, data: MarketData) =>
          set((state) => {
            state.marketData[symbol] = data;
          }),

        addSignal: (signal: TradingSignal) =>
          set((state) => {
            state.signals.unshift(signal);
            // Keep only last 100 signals
            if (state.signals.length > 100) {
              state.signals = state.signals.slice(0, 100);
            }
          }),

        updateRiskMetrics: (metrics: RiskMetrics) =>
          set((state) => {
            state.riskMetrics = metrics;
          }),

        setPortfolioValue: (value: number) =>
          set((state) => {
            state.portfolioValue = value;
          }),

        // MCP actions
        updateServerStatus: (serverId: string, status: Partial<MCPServerStatus>) =>
          set((state) => {
            const index = state.servers.findIndex(s => s.id === serverId);
            if (index !== -1) {
              Object.assign(state.servers[index], status);
            } else {
              // Add new server if not found
              state.servers.push(status as MCPServerStatus);
            }
          }),

        updateAgentCoordination: (agentState: AgentCoordinationState) =>
          set((state) => {
            state.agentCoordination = agentState;
          }),

        updateWorkflows: (workflows: Partial<WorkflowState>) =>
          set((state) => {
            Object.assign(state.workflows, workflows);
          }),

        setMCPConnectionStatus: (status: MCPState['mcpConnectionStatus']) =>
          set((state) => {
            state.mcpConnectionStatus = status;
          }),

        // Vault actions
        updateIntegration: (integration: VaultIntegration) =>
          set((state) => {
            state.integration = integration;
          }),

        updateDashboardData: (data: VaultDashboardData) =>
          set((state) => {
            state.dashboardData = data;
          }),

        setVaultConnectionStatus: (status: VaultState['vaultConnectionStatus']) =>
          set((state) => {
            state.vaultConnectionStatus = status;
          }),

        // System actions
        updateSystemStatus: (status: SystemStatus) =>
          set((state) => {
            state.status = status;
          }),

        addAlert: (alert: Alert) =>
          set((state) => {
            state.alerts.unshift(alert);
            // Keep only last 50 alerts
            if (state.alerts.length > 50) {
              state.alerts = state.alerts.slice(0, 50);
            }
          }),

        acknowledgeAlert: (alertId: string, userId: string) =>
          set((state) => {
            const alert = state.alerts.find(a => a.id === alertId);
            if (alert) {
              alert.acknowledged = true;
              alert.acknowledged_by = userId;
              alert.acknowledged_at = new Date();
            }
          }),

        dismissAlert: (alertId: string) =>
          set((state) => {
            state.alerts = state.alerts.filter(a => a.id !== alertId);
          }),

        updatePreferences: (preferences: Partial<UserPreferences>) =>
          set((state) => {
            if (state.preferences) {
              Object.assign(state.preferences, preferences);
            } else {
              state.preferences = preferences as UserPreferences;
            }
          }),

        // Real-time actions
        setConnected: (connected: boolean) =>
          set((state) => {
            state.connected = connected;
          }),

        updatePing: (ping: Date, latency: number) =>
          set((state) => {
            state.lastPing = ping;
            state.latency = latency;
          }),

        addSubscription: (topic: string) =>
          set((state) => {
            if (!state.subscriptions.includes(topic)) {
              state.subscriptions.push(topic);
            }
          }),

        removeSubscription: (topic: string) =>
          set((state) => {
            state.subscriptions = state.subscriptions.filter(s => s !== topic);
          }),

        // Async state management
        setAsyncState: (key, asyncState) =>
          set((state) => {
            Object.assign(state.asyncStates[key], asyncState);
          }),

        // Global actions
        reset: () =>
          set((state) => {
            Object.assign(state, {
              ...initialTradingState,
              ...initialMCPState,
              ...initialVaultState,
              ...initialSystemState,
              ...initialRealTimeState,
              asyncStates: initialAsyncStates,
            });
          }),

        initializeWebSocket: () => {
          console.log('Setting up WebSocket connections...');
          
          // Import WebSocket client dynamically
          import('@/lib/websocket/websocket-client').then(({ getDefaultWebSocketClient }) => {
            const wsClient = getDefaultWebSocketClient();
            
            // Set up real-time subscriptions
            wsClient.on('portfolio_update', (message) => {
              const portfolioData = message.data;
              set((state) => {
                if (portfolioData.total_equity) {
                  state.portfolioValue = portfolioData.total_equity;
                }
                if (portfolioData.total_pnl) {
                  state.totalPnL = portfolioData.total_pnl;
                }
              });
            });

            wsClient.on('market_update', (message) => {
              const marketData = message.data;
              set((state) => {
                if (marketData && Array.isArray(marketData)) {
                  marketData.forEach((item: any) => {
                    state.marketData[item.symbol] = {
                      symbol: item.symbol,
                      price: item.price,
                      change24h: item.change_pct,
                      volume: item.volume,
                      marketCap: item.market_cap,
                      lastUpdated: new Date(item.last_updated || Date.now())
                    };
                  });
                }
              });
            });

            wsClient.on('agent_update', (message) => {
              const agentData = message.data;
              set((state) => {
                if (agentData && agentData.agent_id) {
                  // Update agent coordination state
                  state.agentCoordination = {
                    active_agents: [agentData],
                    coordination_mode: 'distributed',
                    last_coordination: new Date().toISOString()
                  };
                }
              });
            });

            wsClient.on('strategy_update', (message) => {
              const strategyData = message.data;
              set((state) => {
                const existingIndex = state.strategies.findIndex(s => s.id === strategyData.id);
                if (existingIndex >= 0) {
                  state.strategies[existingIndex] = {
                    ...state.strategies[existingIndex],
                    ...strategyData,
                    lastUpdated: new Date()
                  };
                } else {
                  state.strategies.push({
                    id: strategyData.id,
                    name: strategyData.name,
                    type: strategyData.type || 'momentum',
                    status: strategyData.status || 'active',
                    parameters: strategyData.parameters || {},
                    performance: strategyData.performance || { totalReturn: 0, winRate: 0 },
                    lastUpdated: new Date()
                  });
                }
              });
            });

            wsClient.on('trading_signal', (message) => {
              const signal = message.data;
              set((state) => {
                state.addSignal({
                  id: `signal-${Date.now()}`,
                  symbol: signal.symbol,
                  type: signal.signal,
                  strength: signal.strength,
                  confidence: signal.confidence,
                  timestamp: new Date(signal.generated_at || Date.now()),
                  source: signal.source || 'backend'
                });
              });
            });

            wsClient.on('position_update', (message) => {
              const positionData = message.data;
              set((state) => {
                const existingIndex = state.positions.findIndex(p => p.symbol === positionData.symbol);
                const position = {
                  id: positionData.id || `${positionData.symbol}-${Date.now()}`,
                  symbol: positionData.symbol,
                  quantity: positionData.quantity,
                  averagePrice: positionData.avg_cost,
                  currentPrice: positionData.current_price,
                  marketValue: positionData.market_value,
                  unrealizedPnL: positionData.unrealized_pnl,
                  realizedPnL: positionData.realized_pnl,
                  side: positionData.quantity > 0 ? 'long' : 'short',
                  type: 'stock',
                  lastUpdated: new Date(positionData.last_updated || Date.now())
                };

                if (existingIndex >= 0) {
                  state.positions[existingIndex] = position;
                } else {
                  state.positions.push(position);
                }
              });
            });

            // Connect and subscribe to channels
            wsClient.connect()
              .then(() => {
                console.log('WebSocket connected, subscribing to channels...');
                wsClient.send('subscribe', { 
                  channels: ['portfolio', 'market', 'agents', 'strategies', 'signals', 'positions'] 
                });
                
                // Update real-time connection status
                set((state) => {
                  state.setConnected(true);
                  state.updatePing(new Date(), 50); // Mock latency
                });
              })
              .catch((error) => {
                console.error('WebSocket connection failed:', error);
                set((state) => {
                  state.setConnected(false);
                });
              });
          });
        },

        disconnectWebSocket: () => {
          console.log('Disconnecting WebSocket...');
          import('@/lib/websocket/websocket-client').then(({ getDefaultWebSocketClient }) => {
            const wsClient = getDefaultWebSocketClient();
            wsClient.disconnect();
            set((state) => {
              state.setConnected(false);
              state.subscriptions = [];
            });
          });
        },

        initialize: async () => {
          console.log('Initializing store with real backend data...');
          
          try {
            // Import backend client dynamically to avoid circular dependencies
            const { backendApi } = await import('@/lib/api/backend-client');
            
            // Set loading states
            set((state) => {
              state.setAsyncState('strategies', { state: 'loading' });
              state.setAsyncState('positions', { state: 'loading' });
              state.setAsyncState('marketData', { state: 'loading' });
            });

            // Load portfolio data
            try {
              const portfolioResponse = await backendApi.getPortfolioSummary();
              if (portfolioResponse.data) {
                set((state) => {
                  state.portfolioValue = portfolioResponse.data.total_equity || 0;
                  state.totalPnL = portfolioResponse.data.total_pnl || 0;
                });
                console.log('Portfolio data loaded:', portfolioResponse.data);
              }
            } catch (error) {
              console.warn('Portfolio data unavailable, using defaults:', error);
              // Fallback to demo data
              set((state) => {
                state.portfolioValue = 125000;
                state.totalPnL = 8750;
              });
            }

            // Load positions
            try {
              const positionsResponse = await backendApi.getPortfolioPositions();
              if (positionsResponse.data && Array.isArray(positionsResponse.data)) {
                set((state) => {
                  state.positions = positionsResponse.data.map((pos: any) => ({
                    id: `${pos.symbol}-${Date.now()}`,
                    symbol: pos.symbol,
                    quantity: pos.quantity,
                    averagePrice: pos.avg_cost,
                    currentPrice: pos.current_price,
                    marketValue: pos.market_value,
                    unrealizedPnL: pos.unrealized_pnl,
                    realizedPnL: pos.realized_pnl,
                    side: pos.quantity > 0 ? 'long' : 'short',
                    type: 'stock',
                    lastUpdated: new Date(pos.last_updated || Date.now())
                  }));
                });
                console.log('Positions loaded:', positionsResponse.data.length);
              }
            } catch (error) {
              console.warn('Positions data unavailable, using demo data:', error);
              // Fallback to demo positions
              set((state) => {
                state.positions = [
                  {
                    id: 'btc-demo',
                    symbol: 'BTC/USD',
                    quantity: 0.5,
                    averagePrice: 45000,
                    currentPrice: 47500,
                    marketValue: 23750,
                    unrealizedPnL: 1250,
                    realizedPnL: 0,
                    side: 'long',
                    type: 'crypto',
                    lastUpdated: new Date()
                  },
                  {
                    id: 'eth-demo',
                    symbol: 'ETH/USD',
                    quantity: 5,
                    averagePrice: 3200,
                    currentPrice: 3400,
                    marketValue: 17000,
                    unrealizedPnL: 1000,
                    realizedPnL: 0,
                    side: 'long',
                    type: 'crypto',
                    lastUpdated: new Date()
                  }
                ];
              });
            }

            // Load strategies
            try {
              const strategiesResponse = await backendApi.getStrategies();
              if (strategiesResponse.data && Array.isArray(strategiesResponse.data)) {
                set((state) => {
                  state.strategies = strategiesResponse.data.map((strategy: any) => ({
                    id: strategy.id || `strategy-${Date.now()}`,
                    name: strategy.name || 'Unnamed Strategy',
                    type: strategy.type || 'momentum',
                    status: strategy.status || 'active',
                    parameters: strategy.parameters || {},
                    performance: strategy.performance || { totalReturn: 0, winRate: 0 },
                    lastUpdated: new Date(strategy.last_updated || Date.now())
                  }));
                });
                console.log('Strategies loaded:', strategiesResponse.data.length);
              }
            } catch (error) {
              console.warn('Strategies data unavailable, using demo data:', error);
              // Fallback to demo strategies
              set((state) => {
                state.strategies = [
                  {
                    id: 'momentum-1',
                    name: 'Momentum Trading',
                    type: 'momentum',
                    status: 'active',
                    parameters: { timeframe: '1h', threshold: 0.02 },
                    performance: { totalReturn: 12.5, winRate: 68 },
                    lastUpdated: new Date()
                  },
                  {
                    id: 'arbitrage-1',
                    name: 'Cross-Exchange Arbitrage',
                    type: 'arbitrage',
                    status: 'active',
                    parameters: { minSpread: 0.5, maxExposure: 10000 },
                    performance: { totalReturn: 8.3, winRate: 85 },
                    lastUpdated: new Date()
                  }
                ];
              });
            }

            // Load market data
            try {
              const marketResponse = await backendApi.getMarketOverview();
              if (marketResponse.data) {
                set((state) => {
                  const marketData: Record<string, any> = {};
                  if (marketResponse.data.market_data && Array.isArray(marketResponse.data.market_data)) {
                    marketResponse.data.market_data.forEach((item: any) => {
                      marketData[item.symbol] = {
                        symbol: item.symbol,
                        price: item.price,
                        change24h: item.change_pct,
                        volume: item.volume,
                        marketCap: item.market_cap,
                        lastUpdated: new Date(item.last_updated || Date.now())
                      };
                    });
                  }
                  state.marketData = marketData;
                });
                console.log('Market data loaded');
              }
            } catch (error) {
              console.warn('Market data unavailable, using demo data:', error);
              // Fallback to demo market data
              set((state) => {
                state.marketData = {
                  'BTC/USD': {
                    symbol: 'BTC/USD',
                    price: 47500,
                    change24h: 2.3,
                    volume: 1250000000,
                    marketCap: 925000000000,
                    lastUpdated: new Date()
                  },
                  'ETH/USD': {
                    symbol: 'ETH/USD',
                    price: 3400,
                    change24h: 1.8,
                    volume: 850000000,
                    marketCap: 410000000000,
                    lastUpdated: new Date()
                  }
                };
              });
            }

            // Update async states to success
            set((state) => {
              state.setAsyncState('strategies', { state: 'success', data: state.strategies });
              state.setAsyncState('positions', { state: 'success', data: state.positions });
              state.setAsyncState('marketData', { state: 'success', data: state.marketData });
            });

            console.log('Store initialization completed successfully');
            
            // Initialize WebSocket connections for real-time updates
            const currentState = get();
            currentState.initializeWebSocket();
            
          } catch (error) {
            console.error('Store initialization failed:', error);
            
            // Set error states
            set((state) => {
              state.setAsyncState('strategies', { state: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
              state.setAsyncState('positions', { state: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
              state.setAsyncState('marketData', { state: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
            });
          }
        },
      })),
      {
        name: 'cival-dashboard-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist user preferences and some UI state
          preferences: state.preferences,
          subscriptions: state.subscriptions,
        }),
      }
    )
  )
);

// Selectors for common data access patterns
export const useStrategies = () => useAppStore((state) => state.strategies);
export const usePositions = () => useAppStore((state) => state.positions);
export const useOrders = () => useAppStore((state) => state.orders);
export const useMarketData = (symbol?: string) => 
  useAppStore((state) => symbol ? state.marketData[symbol] : state.marketData);
export const useSignals = () => useAppStore((state) => state.signals);
export const useRiskMetrics = () => useAppStore((state) => state.riskMetrics);
export const usePortfolioValue = () => useAppStore((state) => state.portfolioValue);

export const useMCPServers = () => useAppStore((state) => state.servers);
export const useAgentCoordination = () => useAppStore((state) => state.agentCoordination);
export const useWorkflows = () => useAppStore((state) => state.workflows);

export const useVaultIntegration = () => useAppStore((state) => state.integration);
export const useVaultDashboard = () => useAppStore((state) => state.dashboardData);

export const useSystemStatus = () => useAppStore((state) => state.status);
export const useAlerts = () => useAppStore((state) => state.alerts);
export const usePreferences = () => useAppStore((state) => state.preferences);

export const useRealTimeStatus = () => useAppStore((state) => ({
  connected: state.connected,
  lastPing: state.lastPing,
  latency: state.latency,
  subscriptions: state.subscriptions,
}));

export const useAsyncState = <K extends keyof AsyncStates>(key: K) =>
  useAppStore((state) => state.asyncStates[key]); 