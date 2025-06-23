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

export type MarketCategory = 'stocks' | 'crypto' | 'forex' | 'commodities' | 'indices' | 'etf'

export interface TradingSession {
  name: string
  start: Date
  end: Date
  timezone: string
  isActive: boolean
}

export interface PriceRange {
  min: number
  max: number
  current?: number
  precision?: number
}

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive' | 'custom'

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

export type NoteCategory = 'trade' | 'analysis' | 'idea' | 'reminder' | 'general'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  group?: string
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