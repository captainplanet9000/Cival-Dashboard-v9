// Consolidated Type Definitions for Premium UI Component Library
// Comprehensive TypeScript interfaces for all trading components

// ===== CORE COMPONENT TYPES =====

export interface BaseComponent {
  id: string
  className?: string
  disabled?: boolean
  loading?: boolean
}

export interface ComponentConfig {
  theme?: string
  variant?: string
  size?: 'sm' | 'md' | 'lg'
  animation?: boolean
}

// ===== SORTABLE TYPES =====

export interface SortableItem {
  id: string
  order?: number
}

export interface SortableOptions {
  enableMultiSelect?: boolean
  enableVirtualization?: boolean
  maxItems?: number
  persistOrder?: boolean
  animationPreset?: 'smooth' | 'snappy' | 'minimal' | 'dramatic'
  onError?: (error: Error) => void
}

export interface DragEndEvent {
  active: {
    id: string
    data: { current?: any }
  }
  over?: {
    id: string
    data: { current?: any }
  } | null
}

export interface AnimationConfig {
  duration: number
  easing: string
  stiffness?: number
  damping?: number
}

// ===== TRADING ENTITY TYPES =====

export interface WatchlistItem extends SortableItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  priority?: 'high' | 'medium' | 'low'
  alerts?: number
  lastUpdate?: Date
}

export interface PortfolioPosition extends SortableItem {
  symbol: string
  name: string
  quantity: number
  averagePrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  portfolioWeight: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  lastUpdate?: Date
}

export interface TradingStrategy extends SortableItem {
  name: string
  description: string
  status: 'running' | 'paused' | 'stopped' | 'error'
  priority: 'high' | 'medium' | 'low'
  allocatedCapital: number
  currentPnl: number
  totalTrades: number
  winRate: number
  lastExecuted?: Date
}

// ===== MARKET DATA TYPES =====

export type MarketCategory = 'stocks' | 'crypto' | 'forex' | 'commodities' | 'indices' | 'etf'

export interface Symbol {
  id: string
  symbol: string
  name: string
  price?: number
  change?: number
  changePercent?: number
  volume?: number
  marketCap?: number
  category: MarketCategory
  exchange?: string
  sector?: string
  lastUpdate?: Date
}

export interface MarketData {
  symbol: string
  price: number
  bid: number
  ask: number
  volume: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  close: number
  timestamp: Date
}

export interface OrderBookEntry {
  price: number
  quantity: number
  total: number
}

export interface OrderBook {
  symbol: string
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  spread: number
  lastUpdate: Date
}

// ===== TRADING OPERATION TYPES =====

export type OrderType = 'market' | 'limit' | 'stop' | 'stop-limit'
export type OrderSide = 'buy' | 'sell'
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'DAY'
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected' | 'expired'

export interface TradingOrder {
  id: string
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce: TimeInForce
  status: OrderStatus
  filledQuantity: number
  remainingQuantity: number
  averagePrice: number
  createdAt: Date
  updatedAt: Date
  exchange?: string
}

export interface Trade {
  id: string
  orderId: string
  symbol: string
  side: OrderSide
  quantity: number
  price: number
  commission: number
  timestamp: Date
  exchange?: string
}

// ===== PORTFOLIO TYPES =====

export interface Portfolio {
  id: string
  name: string
  totalValue: number
  totalPnl: number
  totalPnlPercent: number
  cashBalance: number
  positions: PortfolioPosition[]
  lastUpdate: Date
}

export interface PortfolioMetrics {
  totalReturn: number
  totalReturnPercent: number
  sharpeRatio: number
  maxDrawdown: number
  volatility: number
  beta: number
  alpha: number
  winRate: number
  profitFactor: number
}

// ===== RISK MANAGEMENT TYPES =====

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive' | 'custom'

export interface RiskMetrics {
  portfolioValue: number
  var95: number
  var99: number
  expectedShortfall: number
  maximumDrawdown: number
  volatility: number
  beta: number
  correlation: number
  leverage: number
}

export interface RiskLimits {
  maxPositionSize: number
  maxPortfolioRisk: number
  maxDrawdown: number
  maxLeverage: number
  maxConcentration: number
  correlationLimit: number
}

export interface PriceRange {
  min: number
  max: number
  current?: number
  precision?: number
}

// ===== AGENT TYPES =====

export type AgentType = 'darvas' | 'elliott' | 'alligator' | 'adx' | 'renko' | 'custom'
export type AgentStatus = 'active' | 'inactive' | 'error' | 'paused'

export interface TradingAgent {
  id: string
  name: string
  type: AgentType
  status: AgentStatus
  description: string
  symbols: string[]
  strategy: string
  parameters: Record<string, any>
  performance: {
    totalTrades: number
    winRate: number
    totalPnl: number
    sharpeRatio: number
    maxDrawdown: number
  }
  riskProfile: RiskLevel
  createdAt: Date
  lastActive: Date
}

export interface AgentDecision {
  id: string
  agentId: string
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  parameters: Record<string, any>
  timestamp: Date
  executed?: boolean
}

// ===== ANALYTICS TYPES =====

export interface PerformanceMetrics {
  period: string
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  volatility: number
  winRate: number
  profitFactor: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
}

export interface ChartData {
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalIndicator {
  name: string
  values: number[]
  parameters: Record<string, any>
  timestamp: Date[]
}

// ===== FORM TYPES =====

export interface FieldConfig {
  description?: string
  placeholder?: string
  inputProps?: Record<string, any>
  showLabel?: boolean
  orderIndex?: number
  fieldType?: 'input' | 'select' | 'switch' | 'textarea' | 'slider' | 'currency' | 'percentage'
  options?: Array<{ label: string; value: string | number }>
  min?: number
  max?: number
  step?: number
  icon?: React.ReactNode
}

export interface AutoFormProps<T> {
  schema: any // Zod schema
  onSubmit: (data: T) => void | Promise<void>
  defaultValues?: Partial<T>
  fieldConfig?: Partial<Record<keyof T, FieldConfig>>
  title?: string
  description?: string
  submitText?: string
  className?: string
  isLoading?: boolean
  children?: React.ReactNode
}

// ===== TABLE TYPES =====

export interface DataTableProps<TData, TValue> {
  columns: any[] // ColumnDef from @tanstack/react-table
  data: TData[]
  title?: string
  description?: string
  searchable?: boolean
  searchPlaceholder?: string
  filterable?: boolean
  exportable?: boolean
  refreshable?: boolean
  onRefresh?: () => void
  selectable?: boolean
  onSelectionChange?: (selectedRows: TData[]) => void
  realTime?: boolean
  className?: string
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
  toolbar?: React.ReactNode
}

// ===== EXPANSION TYPES =====

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  group?: string
}

export interface TradingSession {
  name: string
  start: Date
  end: Date
  timezone: string
  isActive: boolean
}

export interface DateTimeRange {
  start: Date | null
  end: Date | null
}

export interface SearchResult {
  total: number
  items: any[]
  hasMore: boolean
  nextCursor?: string
}

export type NoteCategory = 'trade' | 'analysis' | 'idea' | 'reminder' | 'general'

export interface TradingNote {
  id: string
  title: string
  content: string
  category: NoteCategory
  tags: string[]
  symbol?: string
  timestamp: Date
  pinned?: boolean
  archived?: boolean
}

// ===== WEBSOCKET TYPES =====

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Date
}

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

// ===== API TYPES =====

export interface ApiResponse<T> {
  data: T
  status: number
  message: string
  timestamp: Date
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// ===== THEME TYPES =====

export type ThemeName = 'default' | 'dark' | 'trading-green' | 'trading-blue' | 'trading-modern' | 'high-contrast'

export interface ThemeConfig {
  name: ThemeName
  displayName: string
  description: string
  colors: Record<string, string>
  isDark: boolean
}

// ===== COMPONENT CONTAINER TYPES =====

export interface SortableContainerProps<T extends SortableItem> {
  items: T[]
  onItemsChange: (items: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  options?: SortableOptions
  loading?: boolean
  emptyMessage?: string
  title?: string
  description?: string
}

// ===== MIGRATION TYPES =====

export interface ComponentMigrationStatus {
  componentName: string
  status: 'completed' | 'in-progress' | 'pending'
  originalPath: string
  premiumPath: string
  features: string[]
  enhancements: string[]
  dependencies: string[]
  migrationDate?: Date
}

export interface MigrationProgress {
  totalComponents: number
  completedCount: number
  inProgressCount: number
  pendingCount: number
  completionPercentage: number
  estimatedCompletion?: Date
}

// ===== PERFORMANCE TYPES =====

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  threshold?: number
  status: 'good' | 'warning' | 'critical'
}

export interface ComponentPerformance {
  componentName: string
  renderTime: number
  memoryUsage: number
  rerenderCount: number
  lastUpdate: Date
}

// ===== EVENT TYPES =====

export interface ComponentEvent {
  type: string
  componentId: string
  data: any
  timestamp: Date
  userId?: string
}

export interface TradingEvent {
  type: 'order' | 'trade' | 'price' | 'portfolio' | 'agent'
  symbol?: string
  data: any
  timestamp: Date
  source: string
}