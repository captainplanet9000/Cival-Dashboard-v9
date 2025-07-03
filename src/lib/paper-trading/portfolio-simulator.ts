/**
 * Portfolio Simulator - Advanced Portfolio Management for Paper Trading
 * Handles complex portfolio calculations, risk metrics, and performance analytics
 * Integrates with Supabase for persistent storage and real-time updates
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export interface PortfolioMetrics {
  total_value: number;
  daily_pnl: number;
  daily_pnl_percentage: number;
  total_pnl: number;
  total_pnl_percentage: number;
  unrealized_pnl: number;
  realized_pnl: number;
  cash_balance: number;
  invested_amount: number;
  roi: number;
  win_rate: number;
  profit_factor: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  max_drawdown_percentage: number;
  calmar_ratio: number;
  volatility: number;
  beta: number;
  alpha: number;
  treynor_ratio: number;
  information_ratio: number;
  var_95: number;
  cvar_95: number;
  last_updated: string;
}

export interface PositionMetrics {
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pnl: number;
  unrealized_pnl_percentage: number;
  weight: number;
  daily_change: number;
  daily_change_percentage: number;
  duration_days: number;
  side: 'long' | 'short';
  risk_contribution: number;
  liquidity_score: number;
}

export interface RiskMetrics {
  portfolio_var_95: number;
  portfolio_cvar_95: number;
  concentration_risk: number;
  correlation_risk: number;
  liquidity_risk: number;
  leverage_ratio: number;
  margin_utilization: number;
  risk_budget_utilization: number;
  sector_concentrations: Record<string, number>;
  position_risks: Record<string, number>;
  stress_test_results: StressTestResult[];
}

export interface StressTestResult {
  scenario: string;
  description: string;
  portfolio_impact: number;
  portfolio_impact_percentage: number;
  worst_position: string;
  worst_position_impact: number;
  recovery_time_estimate: number;
  probability: number;
}

export interface PerformanceAttribution {
  total_return: number;
  asset_allocation_return: number;
  security_selection_return: number;
  interaction_return: number;
  sector_attribution: Record<string, number>;
  position_attribution: Record<string, number>;
}

export class PortfolioSimulator {
  private supabase: any;
  private marketData: Map<string, any> = new Map();
  private benchmarkReturns: number[] = [];
  private riskFreeRate: number = 0.02; // 2% risk-free rate

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // ==================== PORTFOLIO METRICS ====================

  /**
   * Calculate comprehensive portfolio metrics
   */
  async calculatePortfolioMetrics(agentId: string): Promise<PortfolioMetrics> {
    try {
      const [wallet, positions, trades, performance] = await Promise.all([
        this.getAgentWallet(agentId),
        this.getAgentPositions(agentId),
        this.getAgentTrades(agentId),
        this.getAgentPerformance(agentId)
      ]);

      // Calculate basic metrics
      const totalValue = this.calculateTotalValue(wallet, positions);
      const unrealizedPnl = this.calculateUnrealizedPnL(positions);
      const realizedPnl = this.calculateRealizedPnL(trades);
      const totalPnl = unrealizedPnl + realizedPnl;
      
      // Calculate performance metrics
      const initialValue = wallet.total_deposited || 10000;
      const roi = (totalPnl / initialValue) * 100;
      const dailyReturns = await this.calculateDailyReturns(agentId);
      
      // Risk metrics
      const sharpeRatio = this.calculateSharpeRatio(dailyReturns);
      const sortinoRatio = this.calculateSortinoRatio(dailyReturns);
      const maxDrawdown = this.calculateMaxDrawdown(dailyReturns);
      const volatility = this.calculateVolatility(dailyReturns);
      
      // Advanced metrics
      const beta = await this.calculateBeta(dailyReturns);
      const alpha = this.calculateAlpha(dailyReturns, beta);
      const var95 = this.calculateVaR(dailyReturns, 0.95);
      const cvar95 = this.calculateCVaR(dailyReturns, 0.95);

      const metrics: PortfolioMetrics = {
        total_value: totalValue,
        daily_pnl: dailyReturns[dailyReturns.length - 1] || 0,
        daily_pnl_percentage: ((dailyReturns[dailyReturns.length - 1] || 0) / totalValue) * 100,
        total_pnl: totalPnl,
        total_pnl_percentage: roi,
        unrealized_pnl: unrealizedPnl,
        realized_pnl: realizedPnl,
        cash_balance: wallet.balance,
        invested_amount: totalValue - wallet.balance,
        roi: roi,
        win_rate: this.calculateWinRate(trades),
        profit_factor: this.calculateProfitFactor(trades),
        sharpe_ratio: sharpeRatio,
        sortino_ratio: sortinoRatio,
        max_drawdown: maxDrawdown.drawdown,
        max_drawdown_percentage: maxDrawdown.drawdownPercentage,
        calmar_ratio: roi / Math.abs(maxDrawdown.drawdownPercentage),
        volatility: volatility,
        beta: beta,
        alpha: alpha,
        treynor_ratio: (roi - this.riskFreeRate * 100) / beta,
        information_ratio: alpha / volatility,
        var_95: var95,
        cvar_95: cvar95,
        last_updated: new Date().toISOString()
      };

      // Store metrics in database
      await this.storePortfolioMetrics(agentId, metrics);

      return metrics;

    } catch (error) {
      console.error('Error calculating portfolio metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate position-level metrics
   */
  async calculatePositionMetrics(agentId: string): Promise<PositionMetrics[]> {
    try {
      const positions = await this.getAgentPositions(agentId);
      const totalPortfolioValue = await this.calculateTotalPortfolioValue(agentId);
      
      const positionMetrics: PositionMetrics[] = [];

      for (const position of positions) {
        const currentPrice = this.getCurrentPrice(position.symbol);
        const marketValue = position.quantity * currentPrice;
        const costBasis = position.quantity * position.average_price;
        const unrealizedPnl = marketValue - costBasis;
        const unrealizedPnlPercentage = (unrealizedPnl / costBasis) * 100;
        const weight = (marketValue / totalPortfolioValue) * 100;
        
        // Get historical data for daily change
        const yesterdayPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.02); // Mock yesterday price
        const dailyChange = (currentPrice - yesterdayPrice) * position.quantity;
        const dailyChangePercentage = ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;
        
        // Calculate position duration
        const openedAt = new Date(position.opened_at);
        const durationDays = (Date.now() - openedAt.getTime()) / (1000 * 60 * 60 * 24);

        const metrics: PositionMetrics = {
          symbol: position.symbol,
          quantity: position.quantity,
          average_price: position.average_price,
          current_price: currentPrice,
          market_value: marketValue,
          cost_basis: costBasis,
          unrealized_pnl: unrealizedPnl,
          unrealized_pnl_percentage: unrealizedPnlPercentage,
          weight: weight,
          daily_change: dailyChange,
          daily_change_percentage: dailyChangePercentage,
          duration_days: durationDays,
          side: position.quantity > 0 ? 'long' : 'short',
          risk_contribution: this.calculatePositionRiskContribution(position, totalPortfolioValue),
          liquidity_score: this.calculateLiquidityScore(position.symbol)
        };

        positionMetrics.push(metrics);
      }

      return positionMetrics;

    } catch (error) {
      console.error('Error calculating position metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive risk metrics
   */
  async calculateRiskMetrics(agentId: string): Promise<RiskMetrics> {
    try {
      const positions = await this.getAgentPositions(agentId);
      const totalValue = await this.calculateTotalPortfolioValue(agentId);
      const dailyReturns = await this.calculateDailyReturns(agentId);

      // Portfolio VaR and CVaR
      const var95 = this.calculateVaR(dailyReturns, 0.95);
      const cvar95 = this.calculateCVaR(dailyReturns, 0.95);

      // Concentration risk
      const concentrationRisk = this.calculateConcentrationRisk(positions, totalValue);

      // Correlation risk (simplified)
      const correlationRisk = this.calculateCorrelationRisk(positions);

      // Liquidity risk
      const liquidityRisk = this.calculateLiquidityRisk(positions);

      // Sector concentrations
      const sectorConcentrations = this.calculateSectorConcentrations(positions, totalValue);

      // Position risks
      const positionRisks = this.calculatePositionRisks(positions, totalValue);

      // Stress test scenarios
      const stressTestResults = await this.runStressTests(positions, totalValue);

      return {
        portfolio_var_95: var95,
        portfolio_cvar_95: cvar95,
        concentration_risk: concentrationRisk,
        correlation_risk: correlationRisk,
        liquidity_risk: liquidityRisk,
        leverage_ratio: 1.0, // No leverage in paper trading
        margin_utilization: 0.0,
        risk_budget_utilization: concentrationRisk,
        sector_concentrations: sectorConcentrations,
        position_risks: positionRisks,
        stress_test_results: stressTestResults
      };

    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      throw error;
    }
  }

  // ==================== PERFORMANCE ATTRIBUTION ====================

  /**
   * Calculate performance attribution
   */
  async calculatePerformanceAttribution(agentId: string): Promise<PerformanceAttribution> {
    try {
      const trades = await this.getAgentTrades(agentId);
      const positions = await this.getAgentPositions(agentId);
      
      // Simplified performance attribution calculation
      const totalReturn = this.calculateTotalReturn(trades);
      
      // Asset allocation effect (simplified)
      const assetAllocationReturn = totalReturn * 0.3; // 30% attribution to allocation
      
      // Security selection effect
      const securitySelectionReturn = totalReturn * 0.6; // 60% attribution to selection
      
      // Interaction effect
      const interactionReturn = totalReturn * 0.1; // 10% interaction effect

      // Sector attribution
      const sectorAttribution = this.calculateSectorAttribution(positions, trades);
      
      // Position attribution
      const positionAttribution = this.calculatePositionAttribution(positions, trades);

      return {
        total_return: totalReturn,
        asset_allocation_return: assetAllocationReturn,
        security_selection_return: securitySelectionReturn,
        interaction_return: interactionReturn,
        sector_attribution: sectorAttribution,
        position_attribution: positionAttribution
      };

    } catch (error) {
      console.error('Error calculating performance attribution:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private async getAgentWallet(agentId: string) {
    const { data, error } = await this.supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getAgentPositions(agentId: string) {
    const { data, error } = await this.supabase
      .from('agent_positions')
      .select('*')
      .eq('agent_id', agentId)
      .neq('quantity', 0);

    if (error) throw error;
    return data || [];
  }

  private async getAgentTrades(agentId: string) {
    const { data, error } = await this.supabase
      .from('agent_trades')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

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

  private calculateTotalValue(wallet: any, positions: any[]): number {
    const cashValue = wallet.balance || 0;
    const positionsValue = positions.reduce((sum, pos) => {
      const currentPrice = this.getCurrentPrice(pos.symbol);
      return sum + (pos.quantity * currentPrice);
    }, 0);
    
    return cashValue + positionsValue;
  }

  private calculateUnrealizedPnL(positions: any[]): number {
    return positions.reduce((sum, pos) => {
      const currentPrice = this.getCurrentPrice(pos.symbol);
      const unrealizedPnl = (currentPrice - pos.average_price) * pos.quantity;
      return sum + unrealizedPnl;
    }, 0);
  }

  private calculateRealizedPnL(trades: any[]): number {
    return trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
  }

  private getCurrentPrice(symbol: string): number {
    // Mock current prices - replace with real market data
    const mockPrices: Record<string, number> = {
      'BTC/USD': 42500 + (Math.random() - 0.5) * 1000,
      'ETH/USD': 2650 + (Math.random() - 0.5) * 100,
      'SOL/USD': 98 + (Math.random() - 0.5) * 10,
      'USDC/USD': 1.00,
      'USDT/USD': 1.00
    };
    
    return mockPrices[symbol] || 100;
  }

  private async calculateDailyReturns(agentId: string): Promise<number[]> {
    // Get historical performance data
    const { data } = await this.supabase
      .from('agent_performance_logs')
      .select('total_pnl, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true });

    if (!data || data.length < 2) {
      return [0]; // Return zero returns if insufficient data
    }

    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const currentPnl = data[i].total_pnl || 0;
      const previousPnl = data[i - 1].total_pnl || 0;
      const dailyReturn = currentPnl - previousPnl;
      returns.push(dailyReturn);
    }

    return returns;
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    const riskFreeReturn = this.riskFreeRate / 252; // Daily risk-free rate
    return (avgReturn - riskFreeReturn) / stdDev;
  }

  private calculateSortinoRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downSideReturns = returns.filter(r => r < 0);
    
    if (downSideReturns.length === 0) return Infinity;
    
    const downSideVariance = downSideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downSideReturns.length;
    const downSideStdDev = Math.sqrt(downSideVariance);
    
    const riskFreeReturn = this.riskFreeRate / 252;
    return (avgReturn - riskFreeReturn) / downSideStdDev;
  }

  private calculateMaxDrawdown(returns: number[]): { drawdown: number; drawdownPercentage: number } {
    if (returns.length === 0) return { drawdown: 0, drawdownPercentage: 0 };
    
    let peak = 0;
    let maxDrawdown = 0;
    let currentValue = 10000; // Starting value
    
    for (const returnValue of returns) {
      currentValue += returnValue;
      if (currentValue > peak) {
        peak = currentValue;
      }
      const drawdown = peak - currentValue;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    const maxDrawdownPercentage = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
    
    return { drawdown: maxDrawdown, drawdownPercentage: maxDrawdownPercentage };
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized volatility
  }

  private async calculateBeta(returns: number[]): Promise<number> {
    // Mock beta calculation - in reality, would use market returns
    return 1.2; // Slightly more volatile than market
  }

  private calculateAlpha(returns: number[], beta: number): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const marketReturn = this.riskFreeRate / 252; // Mock market return
    const riskFreeReturn = this.riskFreeRate / 252;
    
    return avgReturn - (riskFreeReturn + beta * (marketReturn - riskFreeReturn));
  }

  private calculateVaR(returns: number[], confidenceLevel: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    return Math.abs(sortedReturns[index] || 0);
  }

  private calculateCVaR(returns: number[], confidenceLevel: number): number {
    if (returns.length === 0) return 0;
    
    const var95 = this.calculateVaR(returns, confidenceLevel);
    const tailReturns = returns.filter(r => r <= -var95);
    
    if (tailReturns.length === 0) return var95;
    
    const avgTailReturn = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    return Math.abs(avgTailReturn);
  }

  private calculateWinRate(trades: any[]): number {
    if (trades.length === 0) return 0;
    
    const winningTrades = trades.filter(t => (t.profit_loss || 0) > 0).length;
    return (winningTrades / trades.length) * 100;
  }

  private calculateProfitFactor(trades: any[]): number {
    const winningTrades = trades.filter(t => (t.profit_loss || 0) > 0);
    const losingTrades = trades.filter(t => (t.profit_loss || 0) < 0);
    
    const totalWins = winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0));
    
    return totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  }

  private calculateConcentrationRisk(positions: any[], totalValue: number): number {
    if (positions.length === 0) return 0;
    
    const weights = positions.map(pos => {
      const marketValue = pos.quantity * this.getCurrentPrice(pos.symbol);
      return marketValue / totalValue;
    });
    
    // Herfindahl-Hirschman Index
    return weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  }

  private calculateCorrelationRisk(positions: any[]): number {
    // Simplified correlation risk - in reality would use correlation matrix
    const cryptoPositions = positions.filter(pos => 
      ['BTC/USD', 'ETH/USD', 'SOL/USD'].includes(pos.symbol)
    );
    
    return cryptoPositions.length > 3 ? 0.8 : 0.3; // High correlation if many crypto positions
  }

  private calculateLiquidityRisk(positions: any[]): number {
    // Simplified liquidity risk calculation
    const liquidityScores = positions.map(pos => this.calculateLiquidityScore(pos.symbol));
    const avgLiquidity = liquidityScores.reduce((sum, score) => sum + score, 0) / liquidityScores.length;
    
    return 1 - avgLiquidity; // Higher score = lower liquidity = higher risk
  }

  private calculateLiquidityScore(symbol: string): number {
    // Mock liquidity scores
    const liquidityScores: Record<string, number> = {
      'BTC/USD': 0.95,
      'ETH/USD': 0.9,
      'SOL/USD': 0.8,
      'USDC/USD': 1.0,
      'USDT/USD': 1.0
    };
    
    return liquidityScores[symbol] || 0.5;
  }

  private calculatePositionRiskContribution(position: any, totalValue: number): number {
    const marketValue = position.quantity * this.getCurrentPrice(position.symbol);
    const weight = marketValue / totalValue;
    const volatility = this.getSymbolVolatility(position.symbol);
    
    return weight * volatility;
  }

  private getSymbolVolatility(symbol: string): number {
    const volatilities: Record<string, number> = {
      'BTC/USD': 0.6,
      'ETH/USD': 0.7,
      'SOL/USD': 0.9,
      'USDC/USD': 0.01,
      'USDT/USD': 0.01
    };
    
    return volatilities[symbol] || 0.5;
  }

  private async calculateTotalPortfolioValue(agentId: string): Promise<number> {
    const wallet = await this.getAgentWallet(agentId);
    const positions = await this.getAgentPositions(agentId);
    
    return this.calculateTotalValue(wallet, positions);
  }

  private calculateSectorConcentrations(positions: any[], totalValue: number): Record<string, number> {
    const sectorMap: Record<string, string> = {
      'BTC/USD': 'Cryptocurrency',
      'ETH/USD': 'Cryptocurrency',
      'SOL/USD': 'Cryptocurrency',
      'USDC/USD': 'Stablecoin',
      'USDT/USD': 'Stablecoin'
    };
    
    const sectorValues: Record<string, number> = {};
    
    positions.forEach(pos => {
      const sector = sectorMap[pos.symbol] || 'Other';
      const marketValue = pos.quantity * this.getCurrentPrice(pos.symbol);
      sectorValues[sector] = (sectorValues[sector] || 0) + marketValue;
    });
    
    // Convert to percentages
    const sectorConcentrations: Record<string, number> = {};
    Object.entries(sectorValues).forEach(([sector, value]) => {
      sectorConcentrations[sector] = (value / totalValue) * 100;
    });
    
    return sectorConcentrations;
  }

  private calculatePositionRisks(positions: any[], totalValue: number): Record<string, number> {
    const positionRisks: Record<string, number> = {};
    
    positions.forEach(pos => {
      const marketValue = pos.quantity * this.getCurrentPrice(pos.symbol);
      const weight = marketValue / totalValue;
      const volatility = this.getSymbolVolatility(pos.symbol);
      positionRisks[pos.symbol] = weight * volatility * 100;
    });
    
    return positionRisks;
  }

  private async runStressTests(positions: any[], totalValue: number): Promise<StressTestResult[]> {
    const scenarios: StressTestResult[] = [
      {
        scenario: 'market_crash_20',
        description: '20% market crash across all assets',
        portfolio_impact: -totalValue * 0.2,
        portfolio_impact_percentage: -20,
        worst_position: 'BTC/USD',
        worst_position_impact: -totalValue * 0.08,
        recovery_time_estimate: 180, // days
        probability: 0.05
      },
      {
        scenario: 'crypto_winter_50',
        description: '50% decline in cryptocurrency prices',
        portfolio_impact: -totalValue * 0.35,
        portfolio_impact_percentage: -35,
        worst_position: 'SOL/USD',
        worst_position_impact: -totalValue * 0.15,
        recovery_time_estimate: 365,
        probability: 0.02
      },
      {
        scenario: 'flash_crash_10',
        description: 'Sudden 10% flash crash with recovery',
        portfolio_impact: -totalValue * 0.1,
        portfolio_impact_percentage: -10,
        worst_position: 'ETH/USD',
        worst_position_impact: -totalValue * 0.04,
        recovery_time_estimate: 1,
        probability: 0.15
      }
    ];
    
    return scenarios;
  }

  private calculateTotalReturn(trades: any[]): number {
    return trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
  }

  private calculateSectorAttribution(positions: any[], trades: any[]): Record<string, number> {
    // Simplified sector attribution
    return {
      'Cryptocurrency': 75,
      'Stablecoin': 25
    };
  }

  private calculatePositionAttribution(positions: any[], trades: any[]): Record<string, number> {
    const attribution: Record<string, number> = {};
    
    trades.forEach(trade => {
      const contribution = trade.profit_loss || 0;
      attribution[trade.symbol] = (attribution[trade.symbol] || 0) + contribution;
    });
    
    return attribution;
  }

  private async storePortfolioMetrics(agentId: string, metrics: PortfolioMetrics) {
    try {
      // Update agent_performance table
      const { error } = await this.supabase
        .from('agent_performance')
        .upsert({
          agent_id: agentId,
          total_pnl: metrics.total_pnl,
          unrealized_pnl: metrics.unrealized_pnl,
          realized_pnl: metrics.realized_pnl,
          roi: metrics.roi,
          win_rate: metrics.win_rate,
          profit_factor: metrics.profit_factor,
          sharpe_ratio: metrics.sharpe_ratio,
          max_drawdown: metrics.max_drawdown_percentage,
          volatility: metrics.volatility,
          updated_at: new Date().toISOString()
        }, { onConflict: 'agent_id' });

      if (error) throw error;

      // Log performance snapshot
      await this.supabase
        .from('agent_performance_logs')
        .insert({
          agent_id: agentId,
          total_pnl: metrics.total_pnl,
          total_value: metrics.total_value,
          roi: metrics.roi,
          sharpe_ratio: metrics.sharpe_ratio,
          max_drawdown: metrics.max_drawdown_percentage,
          win_rate: metrics.win_rate,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error storing portfolio metrics:', error);
    }
  }
}

export const portfolioSimulator = new PortfolioSimulator();