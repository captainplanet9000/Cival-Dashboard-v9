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

export interface DragEndEvent {
  active: {
    id: string
    data: {
      current?: any
    }
  }
  over?: {
    id: string
    data: {
      current?: any
    }
  } | null
}

export interface AnimationConfig {
  duration: number
  easing: string
  stiffness?: number
  damping?: number
}