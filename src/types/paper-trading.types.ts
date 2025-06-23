// Paper Trading Engine Type Definitions
// Core types for the complete paper trading and agent farm system

export interface PaperTradingEngine {
  portfolio: PaperPortfolio
  orderManager: PaperOrderManager
  riskEngine: PaperRiskEngine
  performanceTracker: PaperPerformanceTracker
  defiProtocols: DeFiProtocolManager
  agentFarm: AgentFarmManager
}

// ===== PORTFOLIO TYPES =====

export interface PaperPortfolio {
  id: string
  agentId: string
  virtualBalance: number
  totalValue: number
  positions: PaperPosition[]
  openOrders: PaperOrder[]
  tradingHistory: PaperTrade[]
  performanceMetrics: PaperPerformance
  defiPositions: DeFiPosition[]
  yieldPositions: YieldPosition[]
}

export interface PaperPosition {
  id: string
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  realizedPnL: number
  entryDate: Date
  lastUpdated: Date
  side: 'long' | 'short'
  protocol?: DeFiProtocol
  fees: {
    entry: number
    exit: number
    ongoing: number
  }
}

export interface PaperOrder {
  id: string
  agentId: string
  portfolioId: string
  symbol: string
  type: 'market' | 'limit' | 'stop' | 'stop_limit'
  side: 'buy' | 'sell'
  quantity: number
  price?: number
  stopPrice?: number
  status: 'pending' | 'filled' | 'cancelled' | 'rejected'
  timeInForce: 'gtc' | 'ioc' | 'fok' | 'day'
  createdAt: Date
  executedAt?: Date
  protocol?: DeFiProtocol
  slippage: number
  estimatedGas?: number
  actualGas?: number
}

export interface PaperTrade {
  id: string
  orderId: string
  agentId: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  value: number
  fee: number
  timestamp: Date
  protocol?: DeFiProtocol
  pnl: number
  strategy: string
}

// ===== PERFORMANCE TYPES =====

export interface PaperPerformance {
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  currentDrawdown: number
  winRate: number
  profitFactor: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  consecutiveWins: number
  consecutiveLosses: number
  consistencyScore: number
  riskScore: number
  calmarRatio: number
  sortinoRatio: number
  informationRatio: number
  treynorRatio: number
  trackingError: number
  beta: number
  alpha: number
  volatility: number
  downside_deviation: number
  var95: number
  var99: number
  cvar95: number
  cvar99: number
  returnSeries: TimeSeriesData[]
  benchmarkComparison: BenchmarkComparison
  performanceAttribution: PerformanceAttribution[]
}

export interface TimeSeriesData {
  date: Date
  value: number
  benchmark?: number
}

export interface BenchmarkComparison {
  benchmark: string
  correlation: number
  beta: number
  alpha: number
  trackingError: number
  informationRatio: number
  outperformance: number
}

export interface PerformanceAttribution {
  category: string
  contribution: number
  weight: number
  return: number
}

// ===== DEFI PROTOCOL TYPES =====

export enum DeFiProtocol {
  UNISWAP_V3 = 'uniswap_v3',
  COMPOUND = 'compound',
  AAVE = 'aave',
  ONE_INCH = '1inch',
  CURVE = 'curve',
  BALANCER = 'balancer',
  SUSHISWAP = 'sushiswap',
  PANCAKESWAP = 'pancakeswap'
}

export interface DeFiPosition {
  id: string
  protocol: DeFiProtocol
  type: 'liquidity_pool' | 'lending' | 'borrowing' | 'staking' | 'farming'
  tokenA: string
  tokenB?: string
  amount: number
  shares: number
  currentValue: number
  entryValue: number
  unrealizedPnL: number
  impermanentLoss?: number
  apy: number
  feesEarned: number
  rewards: TokenReward[]
  liquidationRisk?: number
  healthFactor?: number
  entryDate: Date
  lastUpdated: Date
}

export interface YieldPosition {
  id: string
  protocol: DeFiProtocol
  strategy: 'supply' | 'borrow' | 'lp' | 'farm' | 'stake'
  token: string
  amount: number
  apy: number
  dailyRewards: number
  totalRewardsEarned: number
  compoundingFrequency: 'daily' | 'weekly' | 'monthly'
  autoCompound: boolean
  lockPeriod?: number
  unlockDate?: Date
}

export interface TokenReward {
  token: string
  amount: number
  valueUsd: number
}

export interface DeFiProtocolManager {
  uniswapV3: UniswapV3Simulator
  compound: CompoundSimulator
  aave: AaveSimulator
  oneInch: OneInchSimulator
}

// ===== PROTOCOL SIMULATORS =====

export interface UniswapV3Simulator {
  simulateSwap(tokenIn: string, tokenOut: string, amount: number): Promise<SwapSimulation>
  simulateLiquidity(tokenA: string, tokenB: string, amount: number, range: PriceRange): Promise<LiquiditySimulation>
  getPoolData(tokenA: string, tokenB: string): Promise<PoolData>
  calculateImpermanentLoss(position: DeFiPosition, currentPrices: Record<string, number>): number
}

export interface CompoundSimulator {
  simulateSupply(token: string, amount: number): Promise<SupplySimulation>
  simulateBorrow(token: string, amount: number, collateral: CollateralInfo[]): Promise<BorrowSimulation>
  getSupplyRate(token: string): Promise<number>
  getBorrowRate(token: string): Promise<number>
  calculateHealthFactor(collateral: CollateralInfo[], debt: DebtInfo[]): number
}

export interface AaveSimulator {
  simulateFlashLoan(token: string, amount: number, strategy: FlashLoanStrategy): Promise<FlashLoanSimulation>
  simulateSupply(token: string, amount: number, rateMode: 'stable' | 'variable'): Promise<SupplySimulation>
  simulateBorrow(token: string, amount: number, rateMode: 'stable' | 'variable'): Promise<BorrowSimulation>
  calculateLiquidationRisk(position: DeFiPosition): number
}

export interface OneInchSimulator {
  findBestRoute(tokenIn: string, tokenOut: string, amount: number): Promise<RouteSimulation>
  simulateAggregatedSwap(tokenIn: string, tokenOut: string, amount: number): Promise<SwapSimulation>
  calculateMEVProtection(route: RouteSimulation): MEVProtection
}

// ===== SIMULATION TYPES =====

export interface SwapSimulation {
  tokenIn: string
  tokenOut: string
  amountIn: number
  amountOut: number
  priceImpact: number
  slippage: number
  gasEstimate: number
  gasCost: number
  route: string[]
  effectivePrice: number
  minimumReceived: number
  fees: SwapFees
}

export interface SwapFees {
  protocolFee: number
  liquidityProviderFee: number
  gasFee: number
  totalFeeUsd: number
}

export interface LiquiditySimulation {
  tokenA: string
  tokenB: string
  amountA: number
  amountB: number
  liquidityTokens: number
  priceRange: PriceRange
  currentPrice: number
  expectedFeeAPY: number
  impermanentLossRisk: number
  capitalEfficiency: number
}

export interface PriceRange {
  lower: number
  upper: number
}

export interface PoolData {
  tokenA: string
  tokenB: string
  fee: number
  liquidity: number
  sqrtPriceX96: string
  tick: number
  volume24h: number
  feesEarned24h: number
  apr: number
}

export interface SupplySimulation {
  token: string
  amount: number
  apy: number
  collateralValue: number
  collateralFactor: number
  liquidationThreshold: number
  expectedYieldDaily: number
  expectedYieldAnnual: number
}

export interface BorrowSimulation {
  token: string
  amount: number
  apy: number
  collateralRequired: number
  healthFactor: number
  liquidationPrice: number
  borrowCapacity: number
  interestDaily: number
  interestAnnual: number
}

export interface FlashLoanStrategy {
  type: 'arbitrage' | 'liquidation' | 'collateral_swap' | 'debt_refinancing'
  params: Record<string, any>
  expectedProfit: number
  riskLevel: number
}

export interface FlashLoanSimulation {
  loan: {
    token: string
    amount: number
    fee: number
  }
  strategy: FlashLoanStrategy
  execution: {
    steps: FlashLoanStep[]
    gasEstimate: number
    totalCost: number
    netProfit: number
    successProbability: number
  }
}

export interface FlashLoanStep {
  action: string
  protocol: DeFiProtocol
  input: any
  output: any
  gasUsed: number
}

export interface RouteSimulation {
  routes: RouteStep[]
  totalGasEstimate: number
  bestPrice: number
  worstPrice: number
  priceImpact: number
  mevRisk: number
  executionTime: number
}

export interface RouteStep {
  protocol: DeFiProtocol
  tokenIn: string
  tokenOut: string
  amountIn: number
  amountOut: number
  priceImpact: number
  gasEstimate: number
}

export interface MEVProtection {
  frontRunningRisk: number
  sandwichAttackRisk: number
  protectionMethods: string[]
  recommendedSlippage: number
  optimalTiming: Date
}

export interface CollateralInfo {
  token: string
  amount: number
  value: number
  collateralFactor: number
  liquidationThreshold: number
}

export interface DebtInfo {
  token: string
  amount: number
  value: number
  interestRate: number
}

// ===== AGENT TYPES =====

export interface AgentFarmManager {
  agents: PaperTradingAgent[]
  performance: AgentFarmPerformance
  resources: ResourceAllocation
  graduation: GraduationSystem
}

export interface PaperTradingAgent {
  id: string
  name: string
  type: AgentType
  status: AgentStatus
  config: AgentConfig
  paperTrading: {
    virtualBalance: number
    portfolio: PaperPortfolio
    performanceMetrics: PaperPerformance
    goals: AgentGoal[]
    graduationStatus: GraduationStatus
    strategies: AgentStrategy[]
    riskLimits: RiskLimits
  }
  defiCapabilities: DeFiCapability[]
  communication: AgentCommunication
  learning: AgentLearning
  createdAt: Date
  lastActiveAt: Date
}

export enum AgentType {
  SCALPER = 'scalper',
  SWING_TRADER = 'swing_trader',
  MOMENTUM = 'momentum',
  MEAN_REVERSION = 'mean_reversion',
  ARBITRAGE = 'arbitrage',
  MARKET_MAKER = 'market_maker',
  YIELD_FARMER = 'yield_farmer',
  LIQUIDATION_BOT = 'liquidation_bot',
  MEV_SEARCHER = 'mev_searcher',
  PORTFOLIO_MANAGER = 'portfolio_manager'
}

export enum AgentStatus {
  INITIALIZING = 'initializing',
  TRAINING = 'training',
  PAPER_TRADING = 'paper_trading',
  READY_FOR_GRADUATION = 'ready_for_graduation',
  GRADUATED = 'graduated',
  PAUSED = 'paused',
  ERROR = 'error',
  ARCHIVED = 'archived'
}

export interface AgentConfig {
  name: string
  type: AgentType
  description: string
  initialCapital: number
  maxDrawdown: number
  riskTolerance: number
  timeHorizon: number
  preferredAssets: string[]
  excludedAssets: string[]
  tradingHours: TradingHours
  strategies: string[]
  defiProtocols: DeFiProtocol[]
  autoRebalance: boolean
  compoundReturns: boolean
}

export interface TradingHours {
  timezone: string
  sessions: TradingSession[]
  excludeWeekends: boolean
  excludeHolidays: boolean
}

export interface TradingSession {
  start: string // HH:MM format
  end: string
  daysOfWeek: number[] // 0 = Sunday, 6 = Saturday
}

export interface AgentGoal {
  id: string
  type: GoalType
  target: number
  timeframe: string
  priority: Priority
  strategy: string
  progress: number
  progressHistory: GoalProgress[]
  createdAt: Date
  targetDate: Date
  status: 'active' | 'completed' | 'failed' | 'paused'
  description: string
}

export enum GoalType {
  PROFIT_TARGET = 'profit_target',
  RISK_LIMIT = 'risk_limit',
  TIME_LIMIT = 'time_limit',
  LEARNING_OBJECTIVE = 'learning_objective',
  SHARPE_RATIO = 'sharpe_ratio',
  WIN_RATE = 'win_rate',
  MAX_DRAWDOWN = 'max_drawdown',
  TRADE_COUNT = 'trade_count',
  PROTOCOL_MASTERY = 'protocol_mastery',
  YIELD_TARGET = 'yield_target'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface GoalProgress {
  date: Date
  value: number
  target: number
  percentage: number
  notes?: string
}

export interface GraduationStatus {
  eligible: boolean
  criteria: GraduationCriteria
  checks: GraduationChecks
  recommendedCapital: number
  nextReviewDate: Date
  graduationDate?: Date
  notes: string[]
}

export interface GraduationCriteria {
  minProfitability: number // e.g., 15% annual return
  minSharpeRatio: number   // e.g., 1.5
  maxDrawdown: number      // e.g., 10%
  consistencyPeriod: number // e.g., 90 days
  minTradeCount: number    // e.g., 100 trades
  minWinRate: number       // e.g., 55%
  maxRiskScore: number     // max acceptable risk
  protocolProficiency: number // DeFi protocol mastery
  minYieldGenerated: number   // for yield farming agents
}

export interface GraduationChecks {
  profitability: boolean
  sharpeRatio: boolean
  drawdown: boolean
  consistency: boolean
  tradeCount: boolean
  winRate: boolean
  riskScore: boolean
  protocolProficiency: boolean
  yieldGeneration: boolean
  overallScore: number
}

export interface AgentStrategy {
  id: string
  name: string
  type: string
  description: string
  parameters: Record<string, any>
  backtest: BacktestResult
  performance: StrategyPerformance
  isActive: boolean
  createdAt: Date
  lastModified: Date
}

export interface BacktestResult {
  period: {
    start: Date
    end: Date
  }
  initialCapital: number
  finalValue: number
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  trades: number
  profitFactor: number
  equity: TimeSeriesData[]
  trades_detail: BacktestTrade[]
}

export interface BacktestTrade {
  entryDate: Date
  exitDate: Date
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  pnlPercent: number
  duration: number
}

export interface StrategyPerformance {
  livePerformance: PaperPerformance
  backtestPerformance: BacktestResult
  paperTradingDays: number
  averageTradesPerDay: number
  bestDay: number
  worstDay: number
  volatility: number
  adaptability: number
  robustness: number
}

export interface RiskLimits {
  maxPositionSize: number
  maxPortfolioRisk: number
  maxDrawdown: number
  maxLeverage: number
  stopLossPercent: number
  takeProfitPercent: number
  maxDailyLoss: number
  maxWeeklyLoss: number
  maxMonthlyLoss: number
  maxCorrelation: number
  maxConcentration: number
  var95Limit: number
  var99Limit: number
  protocolExposureLimit: Record<DeFiProtocol, number>
}

export interface DeFiCapability {
  protocol: DeFiProtocol
  capabilities: string[]
  proficiencyLevel: number
  successRate: number
  totalVolume: number
  profitGenerated: number
  riskAssessment: number
}

export interface AgentCommunication {
  canCommunicate: boolean
  preferredChannels: string[]
  responseTime: number
  collaborationScore: number
  messagesExchanged: number
  coordinationSuccess: number
}

export interface AgentLearning {
  learningRate: number
  adaptationSpeed: number
  knowledgeBase: string[]
  experienceLevel: number
  mistakeCount: number
  improvementRate: number
  lastLearningUpdate: Date
}

export interface AgentFarmPerformance {
  totalAgents: number
  activeAgents: number
  graduatedAgents: number
  totalVirtualCapital: number
  totalRealCapital: number
  averagePerformance: number
  topPerformers: PaperTradingAgent[]
  worstPerformers: PaperTradingAgent[]
  graduationRate: number
  farmEfficiency: number
  resourceUtilization: number
}

export interface ResourceAllocation {
  computing: ComputingResources
  memory: MemoryResources
  network: NetworkResources
  apiLimits: ApiLimits
  costs: ResourceCosts
}

export interface ComputingResources {
  totalCPU: number
  usedCPU: number
  cpuPerAgent: number
  maxConcurrentAgents: number
  processingQueue: number
}

export interface MemoryResources {
  totalRAM: number
  usedRAM: number
  ramPerAgent: number
  dataStorageUsed: number
  cacheSize: number
}

export interface NetworkResources {
  bandwidth: number
  latency: number
  requests_per_second: number
  websocket_connections: number
  api_calls_per_minute: number
}

export interface ApiLimits {
  exchangeApi: Record<string, number>
  defiProtocols: Record<DeFiProtocol, number>
  priceFeeds: number
  newsFeeds: number
  remainingQuota: Record<string, number>
}

export interface ResourceCosts {
  computing: number
  storage: number
  networking: number
  apiCalls: number
  totalMonthlyCost: number
  costPerAgent: number
  costPerTrade: number
}

export interface GraduationSystem {
  criteria: GraduationCriteria
  evaluationFrequency: number // days
  autoGraduation: boolean
  manualReview: boolean
  capitalAllocation: CapitalAllocationStrategy
  graduatedAgents: GraduatedAgent[]
  pendingGraduation: PaperTradingAgent[]
}

export interface CapitalAllocationStrategy {
  type: 'performance_based' | 'equal_weight' | 'risk_adjusted' | 'kelly_criterion'
  initialAllocation: number
  maxAllocation: number
  scalingFactor: number
  reviewPeriod: number
  reallocationThreshold: number
}

export interface GraduatedAgent {
  agentId: string
  graduationDate: Date
  paperTradingPeriod: number
  paperTradingPerformance: PaperPerformance
  allocatedCapital: number
  realTradingPerformance?: PaperPerformance
  status: 'active' | 'paused' | 'terminated'
}

// ===== MARKET DATA TYPES =====

export interface MarketData {
  symbol: string
  price: number
  bid?: number
  ask?: number
  volume: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  marketCap: number
  timestamp: Date
  source?: 'chainlink-mainnet' | 'chainlink-testnet' | 'fallback' | 'simulation'
  chainlinkData?: {
    roundId: string
    decimals: number
    updatedAt: Date
  }
}

export interface OrderBookData {
  symbol: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  timestamp: Date
}

export interface OrderBookLevel {
  price: number
  quantity: number
  orders: number
}

// ===== EVENT TYPES =====

export interface PaperTradingEvent {
  id: string
  type: EventType
  agentId?: string
  portfolioId?: string
  orderId?: string
  tradeId?: string
  timestamp: Date
  data: any
  processed: boolean
}

export enum EventType {
  ORDER_PLACED = 'order_placed',
  ORDER_FILLED = 'order_filled',
  ORDER_CANCELLED = 'order_cancelled',
  POSITION_OPENED = 'position_opened',
  POSITION_CLOSED = 'position_closed',
  RISK_LIMIT_BREACHED = 'risk_limit_breached',
  GOAL_ACHIEVED = 'goal_achieved',
  GRADUATION_ELIGIBLE = 'graduation_eligible',
  AGENT_CREATED = 'agent_created',
  AGENT_STOPPED = 'agent_stopped',
  PERFORMANCE_UPDATE = 'performance_update',
  DEFI_POSITION_OPENED = 'defi_position_opened',
  DEFI_POSITION_CLOSED = 'defi_position_closed',
  YIELD_HARVESTED = 'yield_harvested',
  LIQUIDATION_WARNING = 'liquidation_warning',
  PROTOCOL_ERROR = 'protocol_error'
}

// ===== UTILITY TYPES =====

export interface TimeRange {
  start: Date
  end: Date
}

export interface FilterOptions {
  agents?: string[]
  protocols?: DeFiProtocol[]
  timeRange?: TimeRange
  minPerformance?: number
  maxRisk?: number
  status?: AgentStatus[]
  goalTypes?: GoalType[]
}

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchOptions {
  query: string
  fields: string[]
  fuzzy?: boolean
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel'
  fields: string[]
  timeRange?: TimeRange
  includeMetadata: boolean
}

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrevious: boolean
}

// ===== WEBSOCKET TYPES =====

export interface WebSocketMessage {
  type: string
  channel: string
  data: any
  timestamp: Date
}

export interface WebSocketSubscription {
  channel: string
  symbols?: string[]
  agentIds?: string[]
  eventTypes?: EventType[]
}