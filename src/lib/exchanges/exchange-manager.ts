'use client'

import ExchangeConnectorBase, {
  MarketData,
  OrderBook,
  TradeOrder,
  OrderStatus,
  Balance,
  Position,
  ExchangeInfo
} from './exchange-connector-base'
import HyperliquidConnector, { HyperliquidConfig } from './hyperliquid-connector'
import InteractiveBrokersConnector, { IBConfig } from './interactive-brokers-connector'

export type ExchangeType = 'hyperliquid' | 'interactive_brokers'

export interface ExchangeConnection {
  id: string
  type: ExchangeType
  name: string
  connector: ExchangeConnectorBase
  isConnected: boolean
  lastError?: string
}

export interface MultiExchangeMarketData {
  symbol: string
  exchanges: {
    [exchangeId: string]: MarketData
  }
  bestBid: { price: number; exchange: string }
  bestAsk: { price: number; exchange: string }
  avgPrice: number
  totalVolume: number
  timestamp: number
}

export interface ArbitrageOpportunity {
  symbol: string
  buyExchange: string
  sellExchange: string
  buyPrice: number
  sellPrice: number
  spread: number
  spreadPercentage: number
  profitPotential: number
  timestamp: number
}

export class ExchangeManager {
  private exchanges: Map<string, ExchangeConnection> = new Map()
  private marketDataSubscriptions: Map<string, Set<string>> = new Map() // symbol -> exchange IDs
  private marketDataCallbacks: Map<string, (data: MultiExchangeMarketData) => void> = new Map()

  // Add Exchange Connection
  async addExchange(
    id: string,
    type: ExchangeType,
    config: HyperliquidConfig | IBConfig
  ): Promise<boolean> {
    try {
      let connector: ExchangeConnectorBase

      switch (type) {
        case 'hyperliquid':
          connector = new HyperliquidConnector(config as HyperliquidConfig)
          break
        case 'interactive_brokers':
          connector = new InteractiveBrokersConnector(config as IBConfig)
          break
        default:
          throw new Error(`Unsupported exchange type: ${type}`)
      }

      const connection: ExchangeConnection = {
        id,
        type,
        name: this.getExchangeName(type),
        connector,
        isConnected: false
      }

      this.exchanges.set(id, connection)

      // Attempt to connect
      const connected = await connector.connect()
      connection.isConnected = connected
      connection.lastError = connected ? undefined : connector.getLastError()

      console.log(`Exchange ${id} (${type}) ${connected ? 'connected' : 'failed to connect'}`)
      return connected
    } catch (error) {
      console.error(`Error adding exchange ${id}:`, error)
      return false
    }
  }

  // Remove Exchange Connection
  async removeExchange(id: string): Promise<void> {
    const connection = this.exchanges.get(id)
    if (connection) {
      await connection.connector.disconnect()
      this.exchanges.delete(id)

      // Clean up subscriptions
      this.marketDataSubscriptions.forEach((exchangeIds, symbol) => {
        exchangeIds.delete(id)
        if (exchangeIds.size === 0) {
          this.marketDataSubscriptions.delete(symbol)
        }
      })

      console.log(`Exchange ${id} removed`)
    }
  }

  // Get Connected Exchanges
  getConnectedExchanges(): ExchangeConnection[] {
    return Array.from(this.exchanges.values()).filter(conn => conn.isConnected)
  }

  // Get All Exchanges
  getAllExchanges(): ExchangeConnection[] {
    return Array.from(this.exchanges.values())
  }

  // Get Exchange by ID
  getExchange(id: string): ExchangeConnection | undefined {
    return this.exchanges.get(id)
  }

  // Multi-Exchange Market Data
  async getMultiExchangeMarketData(symbol: string): Promise<MultiExchangeMarketData | null> {
    const connectedExchanges = this.getConnectedExchanges()
    if (connectedExchanges.length === 0) return null

    const exchangeData: { [exchangeId: string]: MarketData } = {}
    const promises = connectedExchanges.map(async (exchange) => {
      try {
        const data = await exchange.connector.getMarketData(symbol)
        if (data) {
          exchangeData[exchange.id] = data
        }
      } catch (error) {
        console.error(`Error getting market data from ${exchange.id}:`, error)
      }
    })

    await Promise.all(promises)

    const dataEntries = Object.entries(exchangeData)
    if (dataEntries.length === 0) return null

    // Find best bid and ask
    let bestBid = { price: 0, exchange: '' }
    let bestAsk = { price: Number.MAX_VALUE, exchange: '' }
    let totalVolume = 0
    let totalPrice = 0

    dataEntries.forEach(([exchangeId, data]) => {
      if (data.bid > bestBid.price) {
        bestBid = { price: data.bid, exchange: exchangeId }
      }
      if (data.ask < bestAsk.price) {
        bestAsk = { price: data.ask, exchange: exchangeId }
      }
      totalVolume += data.volume
      totalPrice += data.price
    })

    return {
      symbol,
      exchanges: exchangeData,
      bestBid,
      bestAsk,
      avgPrice: totalPrice / dataEntries.length,
      totalVolume,
      timestamp: Date.now()
    }
  }

  // Arbitrage Detection
  async findArbitrageOpportunities(symbols: string[]): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = []

    for (const symbol of symbols) {
      const multiData = await this.getMultiExchangeMarketData(symbol)
      if (!multiData || Object.keys(multiData.exchanges).length < 2) continue

      const exchanges = Object.entries(multiData.exchanges)
      
      // Compare each exchange pair
      for (let i = 0; i < exchanges.length; i++) {
        for (let j = i + 1; j < exchanges.length; j++) {
          const [exchangeA_id, dataA] = exchanges[i]
          const [exchangeB_id, dataB] = exchanges[j]

          // Check A buy -> B sell
          const spreadAB = dataB.bid - dataA.ask
          const spreadPercentageAB = (spreadAB / dataA.ask) * 100

          if (spreadAB > 0 && spreadPercentageAB > 0.1) { // Minimum 0.1% spread
            opportunities.push({
              symbol,
              buyExchange: exchangeA_id,
              sellExchange: exchangeB_id,
              buyPrice: dataA.ask,
              sellPrice: dataB.bid,
              spread: spreadAB,
              spreadPercentage: spreadPercentageAB,
              profitPotential: spreadAB * 1000, // Assume 1000 units
              timestamp: Date.now()
            })
          }

          // Check B buy -> A sell
          const spreadBA = dataA.bid - dataB.ask
          const spreadPercentageBA = (spreadBA / dataB.ask) * 100

          if (spreadBA > 0 && spreadPercentageBA > 0.1) {
            opportunities.push({
              symbol,
              buyExchange: exchangeB_id,
              sellExchange: exchangeA_id,
              buyPrice: dataB.ask,
              sellPrice: dataA.bid,
              spread: spreadBA,
              spreadPercentage: spreadPercentageBA,
              profitPotential: spreadBA * 1000,
              timestamp: Date.now()
            })
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.spreadPercentage - a.spreadPercentage)
  }

  // Smart Order Routing
  async findBestExecution(order: TradeOrder): Promise<{
    exchange: string
    estimatedPrice: number
    estimatedFees: number
  } | null> {
    const multiData = await this.getMultiExchangeMarketData(order.symbol)
    if (!multiData) return null

    let bestExchange = ''
    let bestPrice = 0

    if (order.side === 'buy') {
      // Find exchange with lowest ask price
      bestPrice = Number.MAX_VALUE
      Object.entries(multiData.exchanges).forEach(([exchangeId, data]) => {
        if (data.ask < bestPrice) {
          bestPrice = data.ask
          bestExchange = exchangeId
        }
      })
    } else {
      // Find exchange with highest bid price
      Object.entries(multiData.exchanges).forEach(([exchangeId, data]) => {
        if (data.bid > bestPrice) {
          bestPrice = data.bid
          bestExchange = exchangeId
        }
      })
    }

    if (!bestExchange) return null

    const exchange = this.exchanges.get(bestExchange)
    if (!exchange) return null

    const exchangeInfo = await exchange.connector.getExchangeInfo()
    const estimatedFees = bestPrice * order.quantity * (order.side === 'buy' ? exchangeInfo.fees.taker : exchangeInfo.fees.maker)

    return {
      exchange: bestExchange,
      estimatedPrice: bestPrice,
      estimatedFees
    }
  }

  // Execute Order on Specific Exchange
  async executeOrder(exchangeId: string, order: TradeOrder): Promise<OrderStatus | null> {
    const exchange = this.exchanges.get(exchangeId)
    if (!exchange || !exchange.isConnected) {
      console.error(`Exchange ${exchangeId} not connected`)
      return null
    }

    try {
      return await exchange.connector.placeOrder(order)
    } catch (error) {
      console.error(`Error executing order on ${exchangeId}:`, error)
      return null
    }
  }

  // Get Consolidated Portfolio
  async getConsolidatedPortfolio(): Promise<{
    balances: Balance[]
    positions: Position[]
    totalValue: number
  }> {
    const connectedExchanges = this.getConnectedExchanges()
    const allBalances: Balance[] = []
    const allPositions: Position[] = []

    for (const exchange of connectedExchanges) {
      try {
        const balances = await exchange.connector.getBalances()
        const positions = await exchange.connector.getPositions()

        // Add exchange identifier to track source
        balances.forEach(balance => {
          balance.asset = `${balance.asset} (${exchange.id})`
        })
        positions.forEach(position => {
          position.symbol = `${position.symbol} (${exchange.id})`
        })

        allBalances.push(...balances)
        allPositions.push(...positions)
      } catch (error) {
        console.error(`Error getting portfolio from ${exchange.id}:`, error)
      }
    }

    // Calculate total value (simplified)
    const totalValue = allBalances
      .filter(b => b.asset.includes('USD'))
      .reduce((sum, b) => sum + b.total, 0) +
      allPositions.reduce((sum, p) => sum + (p.size * p.markPrice), 0)

    return {
      balances: allBalances,
      positions: allPositions,
      totalValue
    }
  }

  // Health Check All Exchanges
  async healthCheckAll(): Promise<{ [exchangeId: string]: boolean }> {
    const results: { [exchangeId: string]: boolean } = {}

    const promises = Array.from(this.exchanges.entries()).map(async ([id, connection]) => {
      try {
        const isHealthy = await connection.connector.ping()
        connection.isConnected = isHealthy
        results[id] = isHealthy
      } catch (error) {
        connection.isConnected = false
        connection.lastError = error.message
        results[id] = false
      }
    })

    await Promise.all(promises)
    return results
  }

  // Real-time Market Data Subscription
  async subscribeToMultiExchangeMarketData(
    symbol: string,
    callback: (data: MultiExchangeMarketData) => void
  ): Promise<void> {
    this.marketDataCallbacks.set(symbol, callback)

    const connectedExchanges = this.getConnectedExchanges()
    const exchangeIds = new Set<string>()

    for (const exchange of connectedExchanges) {
      try {
        if (exchange.connector.subscribeToMarketData) {
          await exchange.connector.subscribeToMarketData(symbol, async () => {
            // When any exchange updates, get consolidated data
            const multiData = await this.getMultiExchangeMarketData(symbol)
            if (multiData) {
              callback(multiData)
            }
          })
          exchangeIds.add(exchange.id)
        }
      } catch (error) {
        console.error(`Error subscribing to ${symbol} on ${exchange.id}:`, error)
      }
    }

    this.marketDataSubscriptions.set(symbol, exchangeIds)
  }

  // Utility Methods
  private getExchangeName(type: ExchangeType): string {
    const names = {
      hyperliquid: 'Hyperliquid',
      interactive_brokers: 'Interactive Brokers'
    }
    return names[type] || type
  }

  // Cleanup
  async disconnect(): Promise<void> {
    const promises = Array.from(this.exchanges.values()).map(connection =>
      connection.connector.disconnect()
    )
    await Promise.all(promises)
    this.exchanges.clear()
    this.marketDataSubscriptions.clear()
    this.marketDataCallbacks.clear()
  }
}

// Export singleton instance
export const exchangeManager = new ExchangeManager()
export default exchangeManager