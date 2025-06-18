import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MarketData, TradingSignal, Position, Order, StrategyInstance, PaperTradingAccount, BacktestResult, TradingAlert } from '@/types/trading';
import { MCPServerStatus, AgentCoordinationState, WorkflowState, MCPToolCall, MCPEvent } from '@/types/mcp';
import { VaultAccount, Transaction, FundingWorkflow, VaultIntegration } from '@/types/vault';
import { Alert, Notification, SystemStatus, UserPreferences, ConnectionState } from '@/types/common';

// Advanced Trading Feature Types
export interface WatchlistItem {
  id: string;
  symbol: string;
  exchange?: string;
  targetPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  currentPrice: number;
  change24h: number;
  volume24h: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  items: WatchlistItem[];
  isDefault: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  alertType: 'above' | 'below' | 'change_percent';
  targetPrice?: number;
  percentageChange?: number;
  isActive: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

export interface AgentWatchlistAssignment {
  id: string;
  agentId: string;
  watchlistId: string;
  symbol: string;
  strategy?: string;
  maxPositionSize?: number;
  maxTradeSize?: number;
  isActive: boolean;
}

export interface MultiChainBalance {
  id: string;
  network: string;
  symbol: string;
  balance: number;
  balanceUSD: number;
  address: string;
  isNative: boolean;
  decimals: number;
}

export interface MultiChainWallet {
  id: string;
  network: string;
  address: string;
  type: 'hot' | 'hardware' | 'exchange';
  balances: MultiChainBalance[];
  isActive: boolean;
  lastSync: Date;
}

export interface FlashLoanOpportunity {
  id: string;
  symbol: string;
  exchangeFrom: string;
  exchangeTo: string;
  priceFrom: number;
  priceTo: number;
  spreadPercentage: number;
  estimatedProfitUSD: number;
  minTradeSizeUSD: number;
  maxTradeSizeUSD: number;
  gasCostEstimate: number;
  isActive: boolean;
  expiresAt: Date;
}

export interface FlashLoanTransaction {
  id: string;
  agentId: string;
  protocol: string;
  strategy: string;
  assets: Array<{ symbol: string; amount: number }>;
  loanAmountUSD: number;
  profitUSD: number;
  gasCostUSD: number;
  feeUSD: number;
  netProfitUSD: number;
  txHash?: string;
  status: 'pending' | 'success' | 'failed' | 'reverted';
  executedAt?: Date;
  createdAt: Date;
}

export interface AgentFlashLoanLimit {
  agentId: string;
  maxLoanUSD: number;
  dailyLimitUSD: number;
  minProfitThresholdUSD: number;
  isEnabled: boolean;
  successRate: number;
  totalProfitUSD: number;
  totalVolumeUSD: number;
}

export interface HyperLendMarket {
  id: string;
  symbol: string;
  supplyRateAPR: number;
  borrowRateAPR: number;
  totalSupply: number;
  totalBorrow: number;
  utilizationRate: number;
  collateralFactor: number;
  liquidationThreshold: number;
  isActive: boolean;
}

export interface HyperLendPosition {
  id: string;
  marketId: string;
  positionType: 'supply' | 'borrow';
  amount: number;
  amountUSD: number;
  interestEarned: number;
  interestEarnedUSD: number;
  aprAtEntry: number;
  healthFactor?: number;
  liquidationPrice?: number;
  isActive: boolean;
  openedAt: Date;
}

export interface USDTDData {
  timestamp: Date;
  indexValue: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
}

export interface USDTDCorrelation {
  symbol: string;
  correlation1h: number;
  correlation4h: number;
  correlation24h: number;
  correlation7d: number;
  lastUpdated: Date;
}

export interface USDTDSignal {
  id: string;
  signalType: 'long' | 'short' | 'neutral';
  strength: number; // 0-1
  usdtdValue: number;
  triggerReason: string;
  confidence: number;
  recommendedSymbols: string[];
  createdAt: Date;
}

export interface DailyProfit {
  id: string;
  date: Date;
  agentId?: string;
  strategy?: string;
  grossProfitUSD: number;
  feesUSD: number;
  gasCostsUSD: number;
  netProfitUSD: number;
  tradesCount: number;
  winningTrades: number;
  volumeUSD: number;
}

export interface ProfitGoal {
  id: string;
  goalType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  targetAmountUSD: number;
  currentAmountUSD: number;
  startDate: Date;
  endDate: Date;
  isAchieved: boolean;
  achievedAt?: Date;
}

export interface SecuredProfit {
  id: string;
  sourceType: 'trading' | 'lending' | 'staking' | 'arbitrage' | 'flashloan';
  amountUSD: number;
  securedTo: string;
  txHash?: string;
  notes?: string;
  securedAt: Date;
}

export interface HFTStrategy {
  id: string;
  name: string;
  strategyType: string;
  symbols: string[];
  parameters: Record<string, any>;
  isActive: boolean;
  maxPositionSize: number;
  maxOrdersPerSecond: number;
  profitTargetBps: number;
  stopLossBps: number;
  latencyThresholdMs: number;
}

export interface HFTExecution {
  id: string;
  strategyId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  orderId: string;
  executionTimeUs: number; // microseconds
  latencyMs: number;
  slippageBps: number;
  profitLossUSD: number;
  status: string;
  executedAt: Date;
}

interface AppStore {
  // Trading State
  marketData: MarketData[];
  selectedSymbol: string;
  timeframe: string;
  positions: Position[];
  orders: Order[];
  signals: TradingSignal[];
  strategies: StrategyInstance[];
  paperAccounts: PaperTradingAccount[];
  selectedAccount: string;
  backtestResults: BacktestResult[];
  totalPnL: number;
  dailyPnL: number;
  winRate: number;
  tradingAlerts: TradingAlert[];

  // Watchlist State
  watchlists: Watchlist[];
  selectedWatchlist: string;
  priceAlerts: PriceAlert[];
  agentWatchlistAssignments: AgentWatchlistAssignment[];

  // Multi-Chain Wallet State
  multiChainWallets: MultiChainWallet[];
  selectedNetwork: string;
  
  // Flash Loan State
  flashLoanOpportunities: FlashLoanOpportunity[];
  flashLoanTransactions: FlashLoanTransaction[];
  agentFlashLoanLimits: AgentFlashLoanLimit[];
  
  // HyperLend State
  hyperLendMarkets: HyperLendMarket[];
  hyperLendPositions: HyperLendPosition[];
  
  // USDT.D State
  usdtdData: USDTDData[];
  usdtdCorrelations: USDTDCorrelation[];
  usdtdSignals: USDTDSignal[];
  
  // Profit Tracking State
  dailyProfits: DailyProfit[];
  profitGoals: ProfitGoal[];
  securedProfits: SecuredProfit[];
  
  // HFT State
  hftStrategies: HFTStrategy[];
  hftExecutions: HFTExecution[];

  // MCP State
  servers: MCPServerStatus[];
  coordinationState: AgentCoordinationState;
  workflowState: WorkflowState;
  activeCalls: MCPToolCall[];
  callHistory: MCPToolCall[];
  events: MCPEvent[];
  connectionState: ConnectionState;

  // Vault State
  accounts: VaultAccount[];
  vaultSelectedAccount: string;
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  fundingWorkflows: FundingWorkflow[];
  integration: VaultIntegration;

  // UI State
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  alerts: Alert[];
  notifications: Notification[];
  systemStatus: SystemStatus;
  userPreferences: UserPreferences;
  openModalId: string | null;
  modalData: any;
  loading: Record<string, boolean>;

  // Trading Actions
  setMarketData: (data: MarketData[]) => void;
  addPosition: (position: Position) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  addSignal: (signal: TradingSignal) => void;
  setSelectedSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;
  addTradingAlert: (alert: TradingAlert) => void;
  acknowledgeAlert: (id: string) => void;

  // Watchlist Actions
  addWatchlist: (watchlist: Watchlist) => void;
  updateWatchlist: (id: string, updates: Partial<Watchlist>) => void;
  deleteWatchlist: (id: string) => void;
  addWatchlistItem: (watchlistId: string, item: WatchlistItem) => void;
  updateWatchlistItem: (watchlistId: string, itemId: string, updates: Partial<WatchlistItem>) => void;
  removeWatchlistItem: (watchlistId: string, itemId: string) => void;
  setSelectedWatchlist: (id: string) => void;
  addPriceAlert: (alert: PriceAlert) => void;
  updatePriceAlert: (id: string, updates: Partial<PriceAlert>) => void;
  deletePriceAlert: (id: string) => void;
  addAgentWatchlistAssignment: (assignment: AgentWatchlistAssignment) => void;
  updateAgentWatchlistAssignment: (id: string, updates: Partial<AgentWatchlistAssignment>) => void;
  removeAgentWatchlistAssignment: (id: string) => void;

  // Multi-Chain Wallet Actions
  addMultiChainWallet: (wallet: MultiChainWallet) => void;
  updateMultiChainWallet: (id: string, updates: Partial<MultiChainWallet>) => void;
  syncWalletBalances: (walletId: string) => void;
  setSelectedNetwork: (network: string) => void;

  // Flash Loan Actions
  setFlashLoanOpportunities: (opportunities: FlashLoanOpportunity[]) => void;
  addFlashLoanTransaction: (transaction: FlashLoanTransaction) => void;
  updateFlashLoanTransaction: (id: string, updates: Partial<FlashLoanTransaction>) => void;
  updateAgentFlashLoanLimits: (agentId: string, limits: Partial<AgentFlashLoanLimit>) => void;

  // HyperLend Actions
  setHyperLendMarkets: (markets: HyperLendMarket[]) => void;
  addHyperLendPosition: (position: HyperLendPosition) => void;
  updateHyperLendPosition: (id: string, updates: Partial<HyperLendPosition>) => void;
  closeHyperLendPosition: (id: string) => void;

  // USDT.D Actions
  addUSDTDData: (data: USDTDData) => void;
  updateUSDTDCorrelations: (correlations: USDTDCorrelation[]) => void;
  addUSDTDSignal: (signal: USDTDSignal) => void;

  // Profit Tracking Actions
  addDailyProfit: (profit: DailyProfit) => void;
  updateDailyProfit: (id: string, updates: Partial<DailyProfit>) => void;
  addProfitGoal: (goal: ProfitGoal) => void;
  updateProfitGoal: (id: string, updates: Partial<ProfitGoal>) => void;
  addSecuredProfit: (profit: SecuredProfit) => void;

  // HFT Actions
  addHFTStrategy: (strategy: HFTStrategy) => void;
  updateHFTStrategy: (id: string, updates: Partial<HFTStrategy>) => void;
  toggleHFTStrategy: (id: string, isActive: boolean) => void;
  addHFTExecution: (execution: HFTExecution) => void;

  // MCP Actions
  updateServerStatus: (serverId: string, status: Partial<MCPServerStatus>) => void;
  addToolCall: (call: MCPToolCall) => void;
  updateToolCall: (id: string, updates: Partial<MCPToolCall>) => void;
  addEvent: (event: MCPEvent) => void;
  updateConnectionState: (state: Partial<ConnectionState>) => void;

  // Vault Actions
  addAccount: (account: VaultAccount) => void;
  updateAccount: (id: string, updates: Partial<VaultAccount>) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  addFundingWorkflow: (workflow: FundingWorkflow) => void;
  updateWorkflow: (id: string, updates: Partial<FundingWorkflow>) => void;
  setVaultSelectedAccount: (accountId: string) => void;

  // UI Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  showModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  setLoading: (key: string, loading: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Trading State
      marketData: [],
      selectedSymbol: 'AAPL',
      timeframe: '1h',
      positions: [],
      orders: [],
      signals: [],
      strategies: [],
      paperAccounts: [],
      selectedAccount: '',
      backtestResults: [],
      totalPnL: 0,
      dailyPnL: 0,
      winRate: 0,
      tradingAlerts: [],

      // Watchlist State
      watchlists: [],
      selectedWatchlist: '',
      priceAlerts: [],
      agentWatchlistAssignments: [],

      // Multi-Chain Wallet State
      multiChainWallets: [],
      selectedNetwork: 'ethereum',
      
      // Flash Loan State
      flashLoanOpportunities: [],
      flashLoanTransactions: [],
      agentFlashLoanLimits: [],
      
      // HyperLend State
      hyperLendMarkets: [],
      hyperLendPositions: [],
      
      // USDT.D State
      usdtdData: [],
      usdtdCorrelations: [],
      usdtdSignals: [],
      
      // Profit Tracking State
      dailyProfits: [],
      profitGoals: [],
      securedProfits: [],
      
      // HFT State
      hftStrategies: [],
      hftExecutions: [],

      // MCP State
      servers: [],
      coordinationState: {
        active_agents: 0,
        total_agents: 0,
        queued_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        average_task_time: 0,
        resource_utilization: {
          cpu_usage: 0,
          memory_usage: 0,
          agent_pools: []
        },
        communication_metrics: {
          messages_per_minute: 0,
          average_latency: 0,
          failed_communications: 0
        }
      },
      workflowState: {
        active_workflows: [],
        scheduled_workflows: [],
        workflow_templates: [],
        execution_history: []
      },
      activeCalls: [],
      callHistory: [],
      events: [],
      connectionState: {
        status: 'disconnected',
        last_connected: new Date(),
        reconnect_attempts: 0,
        latency: 0
      },

      // Vault State
      accounts: [],
      vaultSelectedAccount: '',
      transactions: [],
      pendingTransactions: [],
      fundingWorkflows: [],
      integration: {
        connection_status: 'disconnected',
        api_health: {
          status: 'down',
          response_time: 0,
          error_rate: 0,
          last_check: new Date()
        },
        accounts_summary: {
          total_accounts: 0,
          total_balance: 0,
          available_balance: 0,
          reserved_balance: 0,
          currency_breakdown: {}
        },
        recent_transactions: [],
        pending_workflows: [],
        compliance_alerts: [],
        system_limits: {
          daily_transaction_limit: 0,
          daily_volume_limit: 0,
          concurrent_transactions_limit: 0,
          api_rate_limit: 0
        }
      },

      // UI State
      theme: 'dark',
      sidebarCollapsed: false,
      alerts: [],
      notifications: [],
      systemStatus: {
        overall_status: 'operational',
        last_updated: new Date(),
        components: [],
        incidents: [],
        maintenance_windows: [],
        performance_metrics: {
          avg_response_time: 0,
          request_throughput: 0,
          error_rate: 0,
          active_users: 0,
          total_trades_today: 0,
          total_volume_today: 0,
          peak_memory_usage: 0,
          peak_cpu_usage: 0,
          database_connections: 0,
          cache_hit_rate: 0
        },
        uptime_stats: {
          current_uptime: '0 days',
          uptime_percentage_24h: 100,
          uptime_percentage_7d: 100,
          uptime_percentage_30d: 100,
          uptime_percentage_90d: 100,
          mttr: 0,
          mtbf: 0
        }
      },
      userPreferences: {
        user_id: 'default',
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          trade_executions: true,
          risk_alerts: true,
          system_updates: true,
          daily_reports: true,
          weekly_reports: true,
          price_alerts: true,
          compliance_alerts: true,
          channels: {
            in_app: true,
            email: true,
            sms: false,
            push: true
          },
          quiet_hours: {
            enabled: false,
            start_time: '22:00',
            end_time: '08:00',
            timezone: 'UTC'
          }
        },
        trading: {
          default_order_type: 'limit',
          default_time_in_force: 'gtc',
          confirm_orders: true,
          show_advanced_options: false,
          default_chart_timeframe: '1h',
          auto_refresh_interval: 5000,
          sound_alerts: true,
          position_size_warnings: true,
          risk_warnings: true
        },
        dashboard: {
          default_layout: 'standard',
          widget_settings: {},
          refresh_interval: 5000,
          auto_save_layout: true,
          compact_mode: false,
          show_tooltips: true,
          animation_speed: 'normal'
        },
        privacy: {
          analytics_tracking: true,
          performance_tracking: true,
          crash_reporting: true,
          usage_statistics: true,
          marketing_communications: false,
          data_retention_period: 90,
          data_export_format: 'json'
        },
        updated_at: new Date()
      },
      openModalId: null,
      modalData: null,
      loading: {},

      // Trading Actions
      setMarketData: (data: MarketData[]) => set({ marketData: data }),
      
      addPosition: (position: Position) => set((state) => ({
        positions: [...state.positions, position]
      })),
      
      updatePosition: (id: string, updates: Partial<Position>) => set((state) => ({
        positions: state.positions.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      
      addOrder: (order: Order) => set((state) => ({
        orders: [...state.orders, order]
      })),
      
      updateOrder: (id: string, updates: Partial<Order>) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o)
      })),
      
      addSignal: (signal: TradingSignal) => set((state) => ({
        signals: [...state.signals, signal]
      })),
      
      setSelectedSymbol: (symbol: string) => set({ selectedSymbol: symbol }),
      setTimeframe: (timeframe: string) => set({ timeframe }),
      
      addTradingAlert: (alert: TradingAlert) => set((state) => ({
        tradingAlerts: [...state.tradingAlerts, alert]
      })),
      
      acknowledgeAlert: (id: string) => set((state) => ({
        tradingAlerts: state.tradingAlerts.map(a => 
          a.id === id ? { ...a, acknowledged: true, acknowledged_at: new Date() } : a
        )
      })),

      // Watchlist Actions
      addWatchlist: (watchlist: Watchlist) => set((state) => ({
        watchlists: [...state.watchlists, watchlist]
      })),

      updateWatchlist: (id: string, updates: Partial<Watchlist>) => set((state) => ({
        watchlists: state.watchlists.map(w => w.id === id ? { ...w, ...updates } : w)
      })),

      deleteWatchlist: (id: string) => set((state) => ({
        watchlists: state.watchlists.filter(w => w.id !== id)
      })),

      addWatchlistItem: (watchlistId: string, item: WatchlistItem) => set((state) => ({
        watchlists: state.watchlists.map(w => 
          w.id === watchlistId ? { ...w, items: [...w.items, item] } : w
        )
      })),

      updateWatchlistItem: (watchlistId: string, itemId: string, updates: Partial<WatchlistItem>) => set((state) => ({
        watchlists: state.watchlists.map(w => 
          w.id === watchlistId ? {
            ...w,
            items: w.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
          } : w
        )
      })),

      removeWatchlistItem: (watchlistId: string, itemId: string) => set((state) => ({
        watchlists: state.watchlists.map(w => 
          w.id === watchlistId ? {
            ...w,
            items: w.items.filter(i => i.id !== itemId)
          } : w
        )
      })),

      setSelectedWatchlist: (id: string) => set({ selectedWatchlist: id }),

      addPriceAlert: (alert: PriceAlert) => set((state) => ({
        priceAlerts: [...state.priceAlerts, alert]
      })),

      updatePriceAlert: (id: string, updates: Partial<PriceAlert>) => set((state) => ({
        priceAlerts: state.priceAlerts.map(a => a.id === id ? { ...a, ...updates } : a)
      })),

      deletePriceAlert: (id: string) => set((state) => ({
        priceAlerts: state.priceAlerts.filter(a => a.id !== id)
      })),

      addAgentWatchlistAssignment: (assignment: AgentWatchlistAssignment) => set((state) => ({
        agentWatchlistAssignments: [...state.agentWatchlistAssignments, assignment]
      })),

      updateAgentWatchlistAssignment: (id: string, updates: Partial<AgentWatchlistAssignment>) => set((state) => ({
        agentWatchlistAssignments: state.agentWatchlistAssignments.map(a => a.id === id ? { ...a, ...updates } : a)
      })),

      removeAgentWatchlistAssignment: (id: string) => set((state) => ({
        agentWatchlistAssignments: state.agentWatchlistAssignments.filter(a => a.id !== id)
      })),

      // Multi-Chain Wallet Actions
      addMultiChainWallet: (wallet: MultiChainWallet) => set((state) => ({
        multiChainWallets: [...state.multiChainWallets, wallet]
      })),

      updateMultiChainWallet: (id: string, updates: Partial<MultiChainWallet>) => set((state) => ({
        multiChainWallets: state.multiChainWallets.map(w => w.id === id ? { ...w, ...updates } : w)
      })),

      syncWalletBalances: (walletId: string) => set((state) => ({
        multiChainWallets: state.multiChainWallets.map(w => 
          w.id === walletId ? { ...w, lastSync: new Date() } : w
        )
      })),

      setSelectedNetwork: (network: string) => set({ selectedNetwork: network }),

      // Flash Loan Actions
      setFlashLoanOpportunities: (opportunities: FlashLoanOpportunity[]) => set({ flashLoanOpportunities: opportunities }),

      addFlashLoanTransaction: (transaction: FlashLoanTransaction) => set((state) => ({
        flashLoanTransactions: [transaction, ...state.flashLoanTransactions]
      })),

      updateFlashLoanTransaction: (id: string, updates: Partial<FlashLoanTransaction>) => set((state) => ({
        flashLoanTransactions: state.flashLoanTransactions.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      updateAgentFlashLoanLimits: (agentId: string, limits: Partial<AgentFlashLoanLimit>) => set((state) => {
        const existingIndex = state.agentFlashLoanLimits.findIndex(l => l.agentId === agentId);
        if (existingIndex >= 0) {
          return {
            agentFlashLoanLimits: state.agentFlashLoanLimits.map(l => 
              l.agentId === agentId ? { ...l, ...limits } : l
            )
          };
        } else {
          return {
            agentFlashLoanLimits: [...state.agentFlashLoanLimits, { agentId, ...limits } as AgentFlashLoanLimit]
          };
        }
      }),

      // HyperLend Actions
      setHyperLendMarkets: (markets: HyperLendMarket[]) => set({ hyperLendMarkets: markets }),

      addHyperLendPosition: (position: HyperLendPosition) => set((state) => ({
        hyperLendPositions: [...state.hyperLendPositions, position]
      })),

      updateHyperLendPosition: (id: string, updates: Partial<HyperLendPosition>) => set((state) => ({
        hyperLendPositions: state.hyperLendPositions.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      closeHyperLendPosition: (id: string) => set((state) => ({
        hyperLendPositions: state.hyperLendPositions.map(p => 
          p.id === id ? { ...p, isActive: false } : p
        )
      })),

      // USDT.D Actions
      addUSDTDData: (data: USDTDData) => set((state) => ({
        usdtdData: [data, ...state.usdtdData].slice(0, 1000) // Keep last 1000 data points
      })),

      updateUSDTDCorrelations: (correlations: USDTDCorrelation[]) => set({ usdtdCorrelations: correlations }),

      addUSDTDSignal: (signal: USDTDSignal) => set((state) => ({
        usdtdSignals: [signal, ...state.usdtdSignals].slice(0, 100) // Keep last 100 signals
      })),

      // Profit Tracking Actions
      addDailyProfit: (profit: DailyProfit) => set((state) => ({
        dailyProfits: [profit, ...state.dailyProfits]
      })),

      updateDailyProfit: (id: string, updates: Partial<DailyProfit>) => set((state) => ({
        dailyProfits: state.dailyProfits.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      addProfitGoal: (goal: ProfitGoal) => set((state) => ({
        profitGoals: [...state.profitGoals, goal]
      })),

      updateProfitGoal: (id: string, updates: Partial<ProfitGoal>) => set((state) => ({
        profitGoals: state.profitGoals.map(g => g.id === id ? { ...g, ...updates } : g)
      })),

      addSecuredProfit: (profit: SecuredProfit) => set((state) => ({
        securedProfits: [profit, ...state.securedProfits]
      })),

      // HFT Actions
      addHFTStrategy: (strategy: HFTStrategy) => set((state) => ({
        hftStrategies: [...state.hftStrategies, strategy]
      })),

      updateHFTStrategy: (id: string, updates: Partial<HFTStrategy>) => set((state) => ({
        hftStrategies: state.hftStrategies.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      toggleHFTStrategy: (id: string, isActive: boolean) => set((state) => ({
        hftStrategies: state.hftStrategies.map(s => s.id === id ? { ...s, isActive } : s)
      })),

      addHFTExecution: (execution: HFTExecution) => set((state) => ({
        hftExecutions: [execution, ...state.hftExecutions].slice(0, 10000) // Keep last 10k executions
      })),

      // MCP Actions
      updateServerStatus: (serverId: string, status: Partial<MCPServerStatus>) => set((state) => ({
        servers: state.servers.map(s => s.id === serverId ? { ...s, ...status } : s)
      })),
      
      addToolCall: (call: MCPToolCall) => set((state) => ({
        activeCalls: [...state.activeCalls, call],
        callHistory: [...state.callHistory, call]
      })),
      
      updateToolCall: (id: string, updates: Partial<MCPToolCall>) => set((state) => ({
        activeCalls: state.activeCalls.map(c => c.id === id ? { ...c, ...updates } : c),
        callHistory: state.callHistory.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      
      addEvent: (event: MCPEvent) => set((state) => ({
        events: [event, ...state.events].slice(0, 1000) // Keep last 1000 events
      })),
      
      updateConnectionState: (connectionState: Partial<ConnectionState>) => set((state) => ({
        connectionState: { ...state.connectionState, ...connectionState }
      })),

      // Vault Actions
      addAccount: (account: VaultAccount) => set((state) => ({
        accounts: [...state.accounts, account]
      })),
      
      updateAccount: (id: string, updates: Partial<VaultAccount>) => set((state) => ({
        accounts: state.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
      })),
      
      addTransaction: (transaction: Transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions]
      })),
      
      updateTransaction: (id: string, updates: Partial<Transaction>) => set((state) => ({
        transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      
      addFundingWorkflow: (workflow: FundingWorkflow) => set((state) => ({
        fundingWorkflows: [...state.fundingWorkflows, workflow]
      })),
      
      updateWorkflow: (id: string, updates: Partial<FundingWorkflow>) => set((state) => ({
        fundingWorkflows: state.fundingWorkflows.map(w => w.id === id ? { ...w, ...updates } : w)
      })),
      
      setVaultSelectedAccount: (accountId: string) => set({ vaultSelectedAccount: accountId }),

      // UI Actions
      setTheme: (theme: 'light' | 'dark' | 'auto') => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      addAlert: (alert: Alert) => set((state) => ({
        alerts: [alert, ...state.alerts]
      })),
      
      dismissAlert: (id: string) => set((state) => ({
        alerts: state.alerts.filter(a => a.id !== id)
      })),
      
      addNotification: (notification: Notification) => set((state) => ({
        notifications: [notification, ...state.notifications]
      })),
      
      markNotificationRead: (id: string) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, status: 'read', read_at: new Date() } : n
        )
      })),
      
      updateSystemStatus: (status: Partial<SystemStatus>) => set((state) => ({
        systemStatus: { ...state.systemStatus, ...status }
      })),
      
      updateUserPreferences: (preferences: Partial<UserPreferences>) => set((state) => ({
        userPreferences: { ...state.userPreferences, ...preferences, updated_at: new Date() }
      })),
      
      showModal: (modalId: string, data?: any) => set({ openModalId: modalId, modalData: data }),
      closeModal: () => set({ openModalId: null, modalData: null }),
      
      setLoading: (key: string, loading: boolean) => set((state) => ({
        loading: { ...state.loading, [key]: loading }
      }))
    }),
    {
      name: 'cival-dashboard-storage',
      partialize: (state) => ({
        // Persist only essential state
        selectedSymbol: state.selectedSymbol,
        timeframe: state.timeframe,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        userPreferences: state.userPreferences,
        selectedAccount: state.selectedAccount,
        vaultSelectedAccount: state.vaultSelectedAccount,
        // Advanced trading features
        selectedWatchlist: state.selectedWatchlist,
        selectedNetwork: state.selectedNetwork,
        watchlists: state.watchlists,
        priceAlerts: state.priceAlerts,
        profitGoals: state.profitGoals,
        hftStrategies: state.hftStrategies
      })
    }
  )
); 