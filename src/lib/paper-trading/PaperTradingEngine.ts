/**
 * Paper Trading Engine for AI Agents
 * Handles virtual trading with real market data
 */

import { supabase, dbHelpers } from '@/lib/supabase/client'
import { backendApi } from '@/lib/api/backend-client'

export interface PaperTradeOrder {
  id?: string
  agentId: string
  accountId: string
  symbol: string
  side: 'buy' | 'sell'
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit'
  quantity: number
  price: number
  stopPrice?: number
  strategy: string
  reasoning: string
  timeInForce?: 'GTC' | 'IOC' | 'FOK'
}

export interface PaperTradeExecution {
  orderId: string
  executedPrice: number
  executedQuantity: number
  commission: number
  timestamp: string
  marketData: Record<string, any>
}

export interface AgentAccount {
  id: string
  agentId: string
  accountName: string
  initialBalance: number
  currentBalance: number
  totalPnl: number
  realizedPnl: number
  unrealizedPnl: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  maxDrawdown: number
  sharpeRatio: number
}

export interface PortfolioPosition {
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  realizedPnl: number
  lastTradeAt?: string
}

export class PaperTradingEngine {
  private commission = 0.001 // 0.1% commission per trade
  private slippage = 0.0005 // 0.05% slippage for market orders

  constructor(private agentId: string) {}

  /**
   * Initialize paper trading account for agent
   */
  async initializeAccount(accountName = 'Primary Account', initialBalance = 100.00): Promise<AgentAccount> {
    try {
      // Check if account already exists
      const { data: existingAccount } = await supabase
        .from('agent_paper_accounts')
        .select('*')
        .eq('agent_id', this.agentId)
        .eq('account_name', accountName)
        .single()

      if (existingAccount) {
        return existingAccount as AgentAccount
      }

      // Create new account
      const { data, error } = await supabase
        .from('agent_paper_accounts')
        .insert([{
          agent_id: this.agentId,
          account_name: accountName,
          initial_balance: initialBalance,
          current_balance: initialBalance
        }])
        .select()
        .single()

      if (error) throw error

      return data as AgentAccount
    } catch (error) {
      console.error('Failed to initialize paper trading account:', error)
      throw error
    }
  }

  /**
   * Get current market price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      // Try to get from backend API first
      const response = await backendApi.get(`/api/v1/market/live-data/${symbol}`)
      if (response.data?.price) {
        return parseFloat(response.data.price)
      }

      // Fallback to mock price generation
      const basePrice = this.getMockPrice(symbol)
      const volatility = 0.02 // 2% volatility
      const change = (Math.random() - 0.5) * volatility
      return basePrice * (1 + change)
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error)
      return this.getMockPrice(symbol)
    }
  }

  /**
   * Place a paper trading order
   */
  async placeOrder(order: PaperTradeOrder): Promise<string> {
    try {
      const account = await this.getAccount(order.accountId)
      const currentPrice = await this.getCurrentPrice(order.symbol)
      
      // Validate order
      this.validateOrder(order, account, currentPrice)

      // Calculate execution price
      const executionPrice = this.calculateExecutionPrice(order, currentPrice)
      
      // Calculate required margin/funds
      const requiredFunds = this.calculateRequiredFunds(order, executionPrice)
      
      if (requiredFunds > account.currentBalance) {
        throw new Error('Insufficient funds for order')
      }

      // Create order record
      const { data: orderData, error } = await supabase
        .from('agent_paper_trades')
        .insert([{
          agent_id: order.agentId,
          account_id: order.accountId,
          symbol: order.symbol,
          side: order.side,
          order_type: order.orderType,
          quantity: order.quantity,
          price: order.price,
          executed_price: executionPrice,
          executed_quantity: order.quantity,
          executed_at: new Date().toISOString(),
          status: 'filled',
          strategy: order.strategy,
          reasoning: order.reasoning,
          commission: requiredFunds * this.commission,
          market_data: {
            marketPrice: currentPrice,
            timestamp: new Date().toISOString(),
            orderType: order.orderType
          }
        }])
        .select()
        .single()

      if (error) throw error

      // Update portfolio and account
      await this.updatePortfolio(order, executionPrice, orderData.commission)
      await this.updateAccount(order.accountId, requiredFunds, orderData.commission)

      // Log agent decision
      await this.logTradeDecision(order, executionPrice, orderData.id)

      return orderData.id
    } catch (error) {
      console.error('Failed to place paper trade order:', error)
      throw error
    }
  }

  /**
   * Get agent's paper trading account
   */
  async getAccount(accountId?: string): Promise<AgentAccount> {
    try {
      let query = supabase
        .from('agent_paper_accounts')
        .select('*')
        .eq('agent_id', this.agentId)

      if (accountId) {
        query = query.eq('id', accountId)
      }

      const { data, error } = await query.single()
      
      if (error) throw error
      return data as AgentAccount
    } catch (error) {
      console.error('Failed to get account:', error)
      throw error
    }
  }

  /**
   * Get agent's portfolio positions
   */
  async getPortfolio(accountId: string): Promise<PortfolioPosition[]> {
    try {
      const { data, error } = await supabase
        .from('agent_portfolios')
        .select('*')
        .eq('agent_id', this.agentId)
        .eq('account_id', accountId)

      if (error) throw error

      // Update current prices and PnL
      const positions: PortfolioPosition[] = []
      for (const position of data || []) {
        const currentPrice = await this.getCurrentPrice(position.symbol)
        const marketValue = position.quantity * currentPrice
        const unrealizedPnl = marketValue - (position.quantity * position.avg_price)

        positions.push({
          symbol: position.symbol,
          quantity: position.quantity,
          avgPrice: position.avg_price,
          currentPrice,
          marketValue,
          unrealizedPnl,
          realizedPnl: position.realized_pnl,
          lastTradeAt: position.last_trade_at
        })
      }

      return positions
    } catch (error) {
      console.error('Failed to get portfolio:', error)
      return []
    }
  }

  /**
   * Get trade history for agent
   */
  async getTradeHistory(accountId: string, limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('agent_paper_trades')
        .select('*')
        .eq('agent_id', this.agentId)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get trade history:', error)
      return []
    }
  }

  /**
   * Calculate portfolio metrics
   */
  async calculateMetrics(accountId: string): Promise<{
    totalPnl: number
    unrealizedPnl: number
    realizedPnl: number
    winRate: number
    sharpeRatio: number
    maxDrawdown: number
  }> {
    try {
      const trades = await this.getTradeHistory(accountId, 1000)
      const portfolio = await this.getPortfolio(accountId)

      const totalTrades = trades.length
      const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

      const realizedPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
      const unrealizedPnl = portfolio.reduce((sum, pos) => sum + pos.unrealizedPnl, 0)
      const totalPnl = realizedPnl + unrealizedPnl

      // Calculate Sharpe ratio (simplified)
      const returns = trades.map(t => (t.pnl || 0) / 100) // Normalize to percentage
      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length || 0
      const returnStdDev = this.calculateStandardDeviation(returns)
      const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0

      // Calculate max drawdown
      let maxDrawdown = 0
      let peak = 100 // Starting balance
      let runningPnl = 0

      for (const trade of trades.reverse()) {
        runningPnl += trade.pnl || 0
        const currentValue = 100 + runningPnl
        
        if (currentValue > peak) {
          peak = currentValue
        }
        
        const drawdown = (peak - currentValue) / peak * 100
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown
        }
      }

      return {
        totalPnl,
        unrealizedPnl,
        realizedPnl,
        winRate,
        sharpeRatio,
        maxDrawdown
      }
    } catch (error) {
      console.error('Failed to calculate metrics:', error)
      return {
        totalPnl: 0,
        unrealizedPnl: 0,
        realizedPnl: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      }
    }
  }

  // Private helper methods

  private validateOrder(order: PaperTradeOrder, account: AgentAccount, currentPrice: number): void {
    if (order.quantity <= 0) {
      throw new Error('Order quantity must be greater than 0')
    }

    if (order.orderType === 'limit' && order.price <= 0) {
      throw new Error('Limit price must be greater than 0')
    }

    if (order.side === 'buy' && order.orderType === 'limit' && order.price > currentPrice * 1.1) {
      throw new Error('Buy limit price too far above market price')
    }

    if (order.side === 'sell' && order.orderType === 'limit' && order.price < currentPrice * 0.9) {
      throw new Error('Sell limit price too far below market price')
    }
  }

  private calculateExecutionPrice(order: PaperTradeOrder, currentPrice: number): number {
    switch (order.orderType) {
      case 'market':
        // Apply slippage for market orders
        const slippageAdjustment = order.side === 'buy' ? (1 + this.slippage) : (1 - this.slippage)
        return currentPrice * slippageAdjustment

      case 'limit':
        return order.price

      case 'stop':
        return currentPrice

      case 'stop_limit':
        return order.price

      default:
        return currentPrice
    }
  }

  private calculateRequiredFunds(order: PaperTradeOrder, executionPrice: number): number {
    const notionalValue = order.quantity * executionPrice
    return order.side === 'buy' ? notionalValue : 0 // For sells, we need to check position
  }

  private async updatePortfolio(order: PaperTradeOrder, executionPrice: number, commission: number): Promise<void> {
    try {
      const { data: existingPosition } = await supabase
        .from('agent_portfolios')
        .select('*')
        .eq('agent_id', order.agentId)
        .eq('account_id', order.accountId)
        .eq('symbol', order.symbol)
        .single()

      if (existingPosition) {
        // Update existing position
        const currentQuantity = existingPosition.quantity
        const currentAvgPrice = existingPosition.avg_price

        let newQuantity: number
        let newAvgPrice: number
        let realizedPnl = 0

        if (order.side === 'buy') {
          newQuantity = currentQuantity + order.quantity
          newAvgPrice = ((currentQuantity * currentAvgPrice) + (order.quantity * executionPrice)) / newQuantity
        } else {
          newQuantity = currentQuantity - order.quantity
          realizedPnl = (executionPrice - currentAvgPrice) * order.quantity - commission
          newAvgPrice = currentAvgPrice // Avg price doesn't change on sells
        }

        await supabase
          .from('agent_portfolios')
          .update({
            quantity: newQuantity,
            avg_price: newAvgPrice,
            current_price: executionPrice,
            market_value: newQuantity * executionPrice,
            realized_pnl: existingPosition.realized_pnl + realizedPnl,
            last_trade_at: new Date().toISOString()
          })
          .eq('id', existingPosition.id)

      } else if (order.side === 'buy') {
        // Create new position for buy orders
        await supabase
          .from('agent_portfolios')
          .insert([{
            agent_id: order.agentId,
            account_id: order.accountId,
            symbol: order.symbol,
            quantity: order.quantity,
            avg_price: executionPrice,
            current_price: executionPrice,
            market_value: order.quantity * executionPrice,
            realized_pnl: -commission,
            last_trade_at: new Date().toISOString()
          }])
      }
    } catch (error) {
      console.error('Failed to update portfolio:', error)
      throw error
    }
  }

  private async updateAccount(accountId: string, requiredFunds: number, commission: number): Promise<void> {
    try {
      const account = await this.getAccount(accountId)
      const newBalance = account.currentBalance - requiredFunds - commission

      await supabase
        .from('agent_paper_accounts')
        .update({
          current_balance: newBalance,
          total_trades: account.totalTrades + 1
        })
        .eq('id', accountId)
    } catch (error) {
      console.error('Failed to update account:', error)
      throw error
    }
  }

  private async logTradeDecision(order: PaperTradeOrder, executionPrice: number, tradeId: string): Promise<void> {
    try {
      await supabase
        .from('agent_decisions')
        .insert([{
          agent_id: order.agentId,
          decision_type: 'trade',
          symbol: order.symbol,
          reasoning: `${order.side.toUpperCase()} ${order.quantity} ${order.symbol} at $${executionPrice.toFixed(4)}. Strategy: ${order.strategy}. Reasoning: ${order.reasoning}`,
          confidence_score: 0.8, // This could be provided by the agent
          market_data: {
            executionPrice,
            orderType: order.orderType,
            strategy: order.strategy,
            tradeId
          },
          action_taken: true,
          result: {
            tradeId,
            executionPrice,
            commission: executionPrice * order.quantity * this.commission
          }
        }])
    } catch (error) {
      console.error('Failed to log trade decision:', error)
      // Don't throw here as it's not critical for trade execution
    }
  }

  private getMockPrice(symbol: string): number {
    // Mock prices for testing
    const mockPrices: Record<string, number> = {
      'BTC': 45000,
      'ETH': 3000,
      'AAPL': 150,
      'GOOGL': 140,
      'TSLA': 250,
      'SPY': 450,
      'QQQ': 380,
      'IWM': 200
    }
    return mockPrices[symbol] || 100
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    
    return Math.sqrt(avgSquaredDiff)
  }
}

export default PaperTradingEngine