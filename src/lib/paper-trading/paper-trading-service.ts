/**
 * Paper Trading Service - Core Simulation Engine
 * Connects MCP tools to Supabase database for realistic trading simulation
 * Manages portfolio, trades, positions, and agent performance in simulation mode
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Types for paper trading simulation
export interface PaperTrade {
  id: string;
  agent_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  executed_price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  strategy: string;
  reason: string;
  created_at: string;
  filled_at?: string;
  profit_loss?: number;
  fees?: number;
}

export interface PaperPortfolio {
  agent_id: string;
  total_value: number;
  cash_balance: number;
  positions: Record<string, PaperPosition>;
  unrealized_pnl: number;
  realized_pnl: number;
  total_trades: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  last_updated: string;
}

export interface PaperPosition {
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percentage: number;
  side: 'long' | 'short';
}

export interface AgentSimulationState {
  agent_id: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
  last_decision: string;
  decision_count: number;
  performance_score: number;
  risk_score: number;
  memory_usage: number;
  active_strategies: string[];
  last_activity: string;
}

export class PaperTradingService {
  private supabase: any;
  private marketData: Map<string, number> = new Map();
  private simulationActive: boolean = true;
  
  // Market price simulation (replace with real data in production)
  private readonly MOCK_PRICES: Record<string, number> = {
    'BTC/USD': 42500,
    'ETH/USD': 2650,
    'SOL/USD': 98,
    'USDC/USD': 1.00,
    'USDT/USD': 1.00,
    'BNB/USD': 315,
    'ADA/USD': 0.45,
    'DOT/USD': 7.2,
    'AVAX/USD': 37,
    'MATIC/USD': 0.95
  };

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    this.initializeMarketData();
    this.startMarketSimulation();
  }

  private initializeMarketData() {
    // Initialize market data with mock prices
    Object.entries(this.MOCK_PRICES).forEach(([symbol, price]) => {
      this.marketData.set(symbol, price);
    });
  }

  private startMarketSimulation() {
    // Simulate market price movements every 1-5 seconds
    setInterval(() => {
      this.updateMarketPrices();
    }, Math.random() * 4000 + 1000);
  }

  private updateMarketPrices() {
    // Simulate realistic price movements
    this.marketData.forEach((currentPrice, symbol) => {
      const volatility = this.getSymbolVolatility(symbol);
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      const newPrice = Math.max(0.01, currentPrice + change);
      this.marketData.set(symbol, newPrice);
    });
  }

  private getSymbolVolatility(symbol: string): number {
    const volatilities: Record<string, number> = {
      'BTC/USD': 0.02,   // 2% volatility
      'ETH/USD': 0.025,  // 2.5% volatility
      'SOL/USD': 0.04,   // 4% volatility
      'USDC/USD': 0.001, // 0.1% volatility
      'USDT/USD': 0.001,
      'BNB/USD': 0.03,
      'ADA/USD': 0.05,
      'DOT/USD': 0.04,
      'AVAX/USD': 0.05,
      'MATIC/USD': 0.06
    };
    return volatilities[symbol] || 0.03;
  }

  // ==================== AGENT MANAGEMENT ====================

  /**
   * Register agent in paper trading system
   */
  async registerAgent(agentData: {
    agent_id: string;
    agent_name: string;
    initial_balance: number;
    risk_tolerance: number;
    supported_chains: string[];
    strategies: string[];
  }): Promise<AgentSimulationState> {
    try {
      // Insert agent into agents table
      const { data: agent, error: agentError } = await this.supabase
        .from('agents')
        .upsert({
          id: agentData.agent_id,
          name: agentData.agent_name,
          type: 'trading',
          status: 'active',
          configuration: {
            initial_balance: agentData.initial_balance,
            risk_tolerance: agentData.risk_tolerance,
            supported_chains: agentData.supported_chains,
            strategies: agentData.strategies,
            paper_trading: true
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (agentError) throw agentError;

      // Create agent status entry
      const { error: statusError } = await this.supabase
        .from('agent_status')
        .upsert({
          agent_id: agentData.agent_id,
          status: 'active',
          last_heartbeat: new Date().toISOString(),
          performance_score: 0.5,
          risk_score: agentData.risk_tolerance,
          active_tasks: 0,
          memory_usage: 0.1,
          created_at: new Date().toISOString()
        }, { onConflict: 'agent_id' });

      if (statusError) throw statusError;

      // Initialize wallet
      await this.initializeAgentWallet(agentData.agent_id, agentData.initial_balance);

      // Initialize performance tracking
      await this.initializeAgentPerformance(agentData.agent_id);

      return {
        agent_id: agentData.agent_id,
        status: 'active',
        last_decision: 'Agent registered for paper trading',
        decision_count: 0,
        performance_score: 0.5,
        risk_score: agentData.risk_tolerance,
        memory_usage: 0.1,
        active_strategies: agentData.strategies,
        last_activity: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error registering agent:', error);
      throw error;
    }
  }

  private async initializeAgentWallet(agentId: string, initialBalance: number) {
    const { error } = await this.supabase
      .from('wallets')
      .upsert({
        id: `wallet_${agentId}`,
        user_id: agentId,
        agent_id: agentId,
        currency: 'USD',
        balance: initialBalance,
        available_balance: initialBalance,
        reserved_balance: 0,
        total_deposited: initialBalance,
        total_withdrawn: 0,
        is_paper_trading: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
  }

  private async initializeAgentPerformance(agentId: string) {
    const { error } = await this.supabase
      .from('agent_performance')
      .upsert({
        agent_id: agentId,
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        total_pnl: 0,
        unrealized_pnl: 0,
        realized_pnl: 0,
        win_rate: 0,
        profit_factor: 0,
        sharpe_ratio: 0,
        max_drawdown: 0,
        average_trade_duration: 0,
        best_trade: 0,
        worst_trade: 0,
        total_fees: 0,
        roi: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'agent_id' });

    if (error) throw error;
  }

  // ==================== TRADING SIMULATION ====================

  /**
   * Execute paper trade
   */
  async executeTrade(tradeData: {
    agent_id: string;
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    order_type: 'market' | 'limit';
    limit_price?: number;
    strategy: string;
    reason: string;
  }): Promise<PaperTrade> {
    try {
      const currentPrice = this.getCurrentPrice(tradeData.symbol);
      const executedPrice = tradeData.order_type === 'market' 
        ? currentPrice 
        : tradeData.limit_price || currentPrice;

      // Simulate slippage for market orders
      const slippage = tradeData.order_type === 'market' ? this.calculateSlippage(tradeData.amount) : 0;
      const finalPrice = executedPrice * (1 + (tradeData.side === 'buy' ? slippage : -slippage));

      // Calculate fees (0.1% trading fee)
      const fees = tradeData.amount * finalPrice * 0.001;
      const totalCost = tradeData.side === 'buy' 
        ? (tradeData.amount * finalPrice) + fees
        : (tradeData.amount * finalPrice) - fees;

      // Check if agent has sufficient balance
      const wallet = await this.getAgentWallet(tradeData.agent_id);
      if (tradeData.side === 'buy' && wallet.available_balance < totalCost) {
        throw new Error('Insufficient balance for trade');
      }

      // Create trade record
      const trade: PaperTrade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agent_id: tradeData.agent_id,
        symbol: tradeData.symbol,
        side: tradeData.side,
        amount: tradeData.amount,
        price: currentPrice,
        executed_price: finalPrice,
        status: 'filled',
        strategy: tradeData.strategy,
        reason: tradeData.reason,
        created_at: new Date().toISOString(),
        filled_at: new Date().toISOString(),
        fees: fees,
        profit_loss: 0 // Will be calculated when position is closed
      };

      // Insert trade into database
      const { error: tradeError } = await this.supabase
        .from('agent_trades')
        .insert({
          id: trade.id,
          agent_id: trade.agent_id,
          symbol: trade.symbol,
          side: trade.side,
          quantity: trade.amount,
          price: trade.executed_price,
          status: trade.status,
          strategy: trade.strategy,
          metadata: {
            reason: trade.reason,
            fees: trade.fees,
            slippage: slippage,
            order_type: tradeData.order_type
          },
          executed_at: trade.filled_at,
          created_at: trade.created_at
        });

      if (tradeError) throw tradeError;

      // Update wallet balance
      await this.updateWalletAfterTrade(tradeData.agent_id, trade);

      // Update or create position
      await this.updateAgentPosition(tradeData.agent_id, trade);

      // Update agent performance
      await this.updateAgentPerformance(tradeData.agent_id);

      // Log agent decision
      await this.logAgentDecision(tradeData.agent_id, `Executed ${trade.side} order for ${trade.amount} ${trade.symbol} at ${finalPrice}`, trade.reason);

      return trade;

    } catch (error) {
      console.error('Error executing trade:', error);
      throw error;
    }
  }

  private calculateSlippage(amount: number): number {
    // Simulate slippage based on order size
    // Larger orders have more slippage
    const baseSlippage = 0.0005; // 0.05% base slippage
    const amountFactor = Math.min(amount / 10000, 0.01); // Max 1% additional slippage
    return baseSlippage + amountFactor;
  }

  private getCurrentPrice(symbol: string): number {
    return this.marketData.get(symbol) || this.MOCK_PRICES[symbol] || 100;
  }

  private async getAgentWallet(agentId: string) {
    const { data, error } = await this.supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error) throw error;
    return data;
  }

  private async updateWalletAfterTrade(agentId: string, trade: PaperTrade) {
    const wallet = await this.getAgentWallet(agentId);
    const tradeValue = trade.amount * (trade.executed_price || 0);
    
    let newBalance = wallet.balance;
    let newAvailable = wallet.available_balance;

    if (trade.side === 'buy') {
      newBalance -= (tradeValue + (trade.fees || 0));
      newAvailable -= (tradeValue + (trade.fees || 0));
    } else {
      newBalance += (tradeValue - (trade.fees || 0));
      newAvailable += (tradeValue - (trade.fees || 0));
    }

    const { error } = await this.supabase
      .from('wallets')
      .update({
        balance: newBalance,
        available_balance: newAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId);

    if (error) throw error;
  }

  private async updateAgentPosition(agentId: string, trade: PaperTrade) {
    // Check if position exists
    const { data: existingPosition } = await this.supabase
      .from('agent_positions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('symbol', trade.symbol)
      .single();

    const currentPrice = this.getCurrentPrice(trade.symbol);
    const executedPrice = trade.executed_price || 0;

    if (existingPosition) {
      // Update existing position
      let newQuantity = existingPosition.quantity;
      let newAvgPrice = existingPosition.average_price;

      if (trade.side === 'buy') {
        const totalValue = (existingPosition.quantity * existingPosition.average_price) + (trade.amount * executedPrice);
        newQuantity += trade.amount;
        newAvgPrice = totalValue / newQuantity;
      } else {
        newQuantity -= trade.amount;
        // Average price stays the same for sells
      }

      const marketValue = newQuantity * currentPrice;
      const unrealizedPnl = (currentPrice - newAvgPrice) * newQuantity;

      const { error } = await this.supabase
        .from('agent_positions')
        .update({
          quantity: newQuantity,
          average_price: newAvgPrice,
          current_price: currentPrice,
          market_value: marketValue,
          unrealized_pnl: unrealizedPnl,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPosition.id);

      if (error) throw error;
    } else {
      // Create new position
      const quantity = trade.side === 'buy' ? trade.amount : -trade.amount;
      const marketValue = quantity * currentPrice;
      const unrealizedPnl = (currentPrice - executedPrice) * quantity;

      const { error } = await this.supabase
        .from('agent_positions')
        .insert({
          agent_id: agentId,
          symbol: trade.symbol,
          quantity: quantity,
          average_price: executedPrice,
          current_price: currentPrice,
          market_value: marketValue,
          unrealized_pnl: unrealizedPnl,
          position_type: trade.side === 'buy' ? 'long' : 'short',
          opened_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    }
  }

  private async updateAgentPerformance(agentId: string) {
    // Get all trades for agent
    const { data: trades } = await this.supabase
      .from('agent_trades')
      .select('*')
      .eq('agent_id', agentId);

    // Get all positions for unrealized PnL
    const { data: positions } = await this.supabase
      .from('agent_positions')
      .select('*')
      .eq('agent_id', agentId);

    if (!trades || !positions) return;

    const totalTrades = trades.length;
    const unrealizedPnl = positions.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0);
    
    // Calculate realized PnL from closed trades
    const realizedPnl = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
    const totalPnl = realizedPnl + unrealizedPnl;

    // Calculate win rate (simplified)
    const winningTrades = trades.filter(t => (t.profit_loss || 0) > 0).length;
    const losingTrades = trades.filter(t => (t.profit_loss || 0) < 0).length;
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;

    // Calculate ROI (simplified)
    const wallet = await this.getAgentWallet(agentId);
    const initialBalance = wallet.total_deposited || 10000;
    const roi = (totalPnl / initialBalance) * 100;

    const { error } = await this.supabase
      .from('agent_performance')
      .update({
        total_trades: totalTrades,
        winning_trades: winningTrades,
        losing_trades: losingTrades,
        total_pnl: totalPnl,
        unrealized_pnl: unrealizedPnl,
        realized_pnl: realizedPnl,
        win_rate: winRate,
        roi: roi,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId);

    if (error) throw error;
  }

  private async logAgentDecision(agentId: string, decision: string, reasoning: string) {
    const { error } = await this.supabase
      .from('agent_decisions')
      .insert({
        agent_id: agentId,
        decision_type: 'trading',
        decision: decision,
        reasoning: reasoning,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        metadata: {
          timestamp: new Date().toISOString(),
          market_conditions: 'simulated'
        },
        created_at: new Date().toISOString()
      });

    if (error) console.error('Error logging decision:', error);
  }

  // ==================== PORTFOLIO MANAGEMENT ====================

  /**
   * Get agent's complete portfolio
   */
  async getAgentPortfolio(agentId: string): Promise<PaperPortfolio> {
    try {
      const [wallet, positions, performance] = await Promise.all([
        this.getAgentWallet(agentId),
        this.getAgentPositions(agentId),
        this.getAgentPerformance(agentId)
      ]);

      const portfolioPositions: Record<string, PaperPosition> = {};
      let totalMarketValue = 0;

      // Process positions
      for (const position of positions) {
        const currentPrice = this.getCurrentPrice(position.symbol);
        const marketValue = position.quantity * currentPrice;
        const unrealizedPnl = (currentPrice - position.average_price) * position.quantity;
        const unrealizedPnlPercentage = (unrealizedPnl / (position.average_price * Math.abs(position.quantity))) * 100;

        portfolioPositions[position.symbol] = {
          symbol: position.symbol,
          quantity: position.quantity,
          average_price: position.average_price,
          current_price: currentPrice,
          market_value: marketValue,
          unrealized_pnl: unrealizedPnl,
          unrealized_pnl_percentage: unrealizedPnlPercentage,
          side: position.quantity > 0 ? 'long' : 'short'
        };

        totalMarketValue += marketValue;
      }

      const totalValue = wallet.balance + totalMarketValue;

      return {
        agent_id: agentId,
        total_value: totalValue,
        cash_balance: wallet.balance,
        positions: portfolioPositions,
        unrealized_pnl: performance.unrealized_pnl || 0,
        realized_pnl: performance.realized_pnl || 0,
        total_trades: performance.total_trades || 0,
        win_rate: performance.win_rate || 0,
        sharpe_ratio: performance.sharpe_ratio || 0,
        max_drawdown: performance.max_drawdown || 0,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting portfolio:', error);
      throw error;
    }
  }

  private async getAgentPositions(agentId: string) {
    const { data, error } = await this.supabase
      .from('agent_positions')
      .select('*')
      .eq('agent_id', agentId)
      .neq('quantity', 0); // Only active positions

    if (error) throw error;
    return data || [];
  }

  private async getAgentPerformance(agentId: string) {
    const { data, error } = await this.supabase
      .from('agent_performance')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || {};
  }

  // ==================== MARKET DATA ====================

  /**
   * Get current market prices
   */
  getMarketData(symbols?: string[]): Record<string, number> {
    if (!symbols) {
      return Object.fromEntries(this.marketData.entries());
    }
    
    const result: Record<string, number> = {};
    symbols.forEach(symbol => {
      const price = this.marketData.get(symbol);
      if (price !== undefined) {
        result[symbol] = price;
      }
    });
    
    return result;
  }

  /**
   * Get live market data with metadata
   */
  getLiveMarketData(symbols: string[]) {
    return symbols.map(symbol => {
      const price = this.getCurrentPrice(symbol);
      const volatility = this.getSymbolVolatility(symbol);
      
      return {
        symbol,
        price,
        bid: price * 0.999,
        ask: price * 1.001,
        volume_24h: Math.random() * 1000000 + 500000,
        change_24h_percentage: (Math.random() - 0.5) * 10,
        volatility_24h: volatility,
        timestamp: new Date().toISOString(),
        latency_ms: Math.random() * 20 + 5
      };
    });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get simulation status
   */
  getSimulationStatus() {
    return {
      active: this.simulationActive,
      market_data_points: this.marketData.size,
      last_price_update: new Date().toISOString(),
      supported_symbols: Object.keys(this.MOCK_PRICES)
    };
  }

  /**
   * Reset agent's paper trading data
   */
  async resetAgent(agentId: string, initialBalance: number = 10000) {
    try {
      // Reset wallet
      await this.supabase
        .from('wallets')
        .update({
          balance: initialBalance,
          available_balance: initialBalance,
          total_deposited: initialBalance,
          total_withdrawn: 0,
          updated_at: new Date().toISOString()
        })
        .eq('agent_id', agentId);

      // Clear positions
      await this.supabase
        .from('agent_positions')
        .delete()
        .eq('agent_id', agentId);

      // Clear trades
      await this.supabase
        .from('agent_trades')
        .delete()
        .eq('agent_id', agentId);

      // Reset performance
      await this.initializeAgentPerformance(agentId);

      return { success: true, message: 'Agent reset successfully' };
    } catch (error) {
      console.error('Error resetting agent:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paperTradingService = new PaperTradingService();