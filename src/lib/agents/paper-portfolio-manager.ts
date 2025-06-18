// Agent Paper Trading Portfolio Management
import { AgentPaperTradingManager } from './paper-trading-manager';
import type {
  AgentPaperTradingAccount,
  AgentPaperPosition,
  AgentPaperTradingPerformance
} from '@/types/agent-paper-trading';

export interface PortfolioAllocation {
  symbol: string;
  targetPercentage: number;
  currentPercentage: number;
  deviation: number;
  recommendedAction: 'buy' | 'sell' | 'hold';
  quantity: number;
}

export interface RiskAnalysis {
  totalRisk: number;
  concentrationRisk: number;
  correlationRisk: number;
  liquidityRisk: number;
  volatilityRisk: number;
  recommendations: string[];
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
}

export interface PortfolioOptimization {
  currentAllocation: PortfolioAllocation[];
  targetAllocation: PortfolioAllocation[];
  rebalanceOrders: Array<{
    symbol: string;
    action: 'buy' | 'sell';
    quantity: number;
    reasoning: string;
  }>;
  expectedImprovement: {
    riskReduction: number;
    returnIncrease: number;
    sharpeImprovement: number;
  };
}

export class AgentPaperPortfolioManager {
  private readonly paperTradingManager: AgentPaperTradingManager;
  private readonly agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.paperTradingManager = new AgentPaperTradingManager(agentId);
  }

  // Portfolio Analysis
  async getPortfolioSummary(accountId?: string): Promise<{
    account: AgentPaperTradingAccount;
    positions: AgentPaperPosition[];
    allocation: PortfolioAllocation[];
    performance: any;
    riskMetrics: RiskAnalysis;
  }> {
    const [accounts, positions, performance] = await Promise.all([
      this.paperTradingManager.getPaperTradingAccounts(),
      this.paperTradingManager.getPaperPositions(accountId),
      this.paperTradingManager.getPerformanceMetrics()
    ]);

    const account = accountId ? 
      accounts.find(acc => acc.id === accountId) || accounts[0] : 
      accounts[0];

    if (!account) {
      throw new Error('No paper trading account found');
    }

    const allocation = this.calculatePortfolioAllocation(positions, account.total_equity);
    const riskMetrics = await this.analyzePortfolioRisk(positions, allocation);

    return {
      account,
      positions,
      allocation,
      performance,
      riskMetrics
    };
  }

  // Portfolio Allocation Analysis
  private calculatePortfolioAllocation(
    positions: AgentPaperPosition[],
    totalEquity: number
  ): PortfolioAllocation[] {
    const allocations: PortfolioAllocation[] = [];
    
    // Group positions by symbol
    const positionsBySymbol = positions.reduce((acc, position) => {
      if (!acc[position.symbol]) {
        acc[position.symbol] = [];
      }
      acc[position.symbol].push(position);
      return acc;
    }, {} as Record<string, AgentPaperPosition[]>);

    // Calculate allocation for each symbol
    Object.entries(positionsBySymbol).forEach(([symbol, symbolPositions]) => {
      const totalValue = symbolPositions.reduce((sum, pos) => sum + pos.market_value, 0);
      const currentPercentage = (totalValue / totalEquity) * 100;
      const totalQuantity = symbolPositions.reduce((sum, pos) => sum + pos.quantity, 0);

      allocations.push({
        symbol,
        targetPercentage: 10, // Default target, would be configurable
        currentPercentage,
        deviation: currentPercentage - 10,
        recommendedAction: this.getRecommendedAction(currentPercentage, 10),
        quantity: totalQuantity
      });
    });

    return allocations.sort((a, b) => b.currentPercentage - a.currentPercentage);
  }

  private getRecommendedAction(current: number, target: number): 'buy' | 'sell' | 'hold' {
    const deviation = Math.abs(current - target);
    if (deviation < 2) return 'hold';
    return current > target ? 'sell' : 'buy';
  }

  // Risk Analysis
  async analyzePortfolioRisk(
    positions: AgentPaperPosition[],
    allocation: PortfolioAllocation[]
  ): Promise<RiskAnalysis> {
    const riskMetrics = {
      totalRisk: 0,
      concentrationRisk: 0,
      correlationRisk: 0,
      liquidityRisk: 0,
      volatilityRisk: 0,
      recommendations: [] as string[],
      alerts: [] as Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        message: string;
      }>
    };

    // Concentration Risk Analysis
    riskMetrics.concentrationRisk = this.calculateConcentrationRisk(allocation);
    if (riskMetrics.concentrationRisk > 0.5) {
      riskMetrics.alerts.push({
        type: 'concentration',
        severity: 'high',
        message: `High concentration risk detected. Largest position represents ${(riskMetrics.concentrationRisk * 100).toFixed(1)}% of portfolio.`
      });
      riskMetrics.recommendations.push('Consider diversifying portfolio to reduce concentration risk');
    }

    // Position Size Risk
    allocation.forEach(alloc => {
      if (alloc.currentPercentage > 25) {
        riskMetrics.alerts.push({
          type: 'position_size',
          severity: 'medium',
          message: `${alloc.symbol} represents ${alloc.currentPercentage.toFixed(1)}% of portfolio, consider reducing position size.`
        });
      }
    });

    // Volatility Risk (simplified)
    riskMetrics.volatilityRisk = this.estimatePortfolioVolatility(positions);
    if (riskMetrics.volatilityRisk > 0.3) {
      riskMetrics.alerts.push({
        type: 'volatility',
        severity: 'medium',
        message: 'Portfolio volatility is high, consider adding stable assets'
      });
    }

    // Number of positions risk
    if (positions.length < 3) {
      riskMetrics.alerts.push({
        type: 'diversification',
        severity: 'medium',
        message: 'Portfolio has few positions, consider adding more assets for diversification'
      });
      riskMetrics.recommendations.push('Increase number of positions to improve diversification');
    }

    // Calculate total risk score
    riskMetrics.totalRisk = (
      riskMetrics.concentrationRisk * 0.4 +
      riskMetrics.volatilityRisk * 0.3 +
      riskMetrics.correlationRisk * 0.2 +
      riskMetrics.liquidityRisk * 0.1
    );

    return riskMetrics;
  }

  private calculateConcentrationRisk(allocation: PortfolioAllocation[]): number {
    if (allocation.length === 0) return 0;
    
    // Herfindahl-Hirschman Index for concentration
    const hhi = allocation.reduce((sum, alloc) => {
      const weight = alloc.currentPercentage / 100;
      return sum + (weight * weight);
    }, 0);

    return hhi;
  }

  private estimatePortfolioVolatility(positions: AgentPaperPosition[]): number {
    // Simplified volatility calculation based on unrealized P&L
    if (positions.length === 0) return 0;

    const pnlVariance = positions.reduce((sum, pos) => {
      const pnlPercent = pos.unrealized_pnl / pos.market_value;
      return sum + (pnlPercent * pnlPercent);
    }, 0) / positions.length;

    return Math.sqrt(pnlVariance);
  }

  // Portfolio Optimization
  async optimizePortfolio(
    targetAllocation?: Record<string, number>
  ): Promise<PortfolioOptimization> {
    const portfolio = await this.getPortfolioSummary();
    const currentAllocation = portfolio.allocation;

    // Default target allocation if not provided
    const defaultTargets = this.getDefaultTargetAllocation(currentAllocation);
    const targets = targetAllocation || defaultTargets;

    // Calculate target allocation array
    const targetAllocationArray: PortfolioAllocation[] = Object.entries(targets).map(([symbol, percentage]) => {
      const current = currentAllocation.find(alloc => alloc.symbol === symbol);
      return {
        symbol,
        targetPercentage: percentage,
        currentPercentage: current?.currentPercentage || 0,
        deviation: (current?.currentPercentage || 0) - percentage,
        recommendedAction: this.getRecommendedAction(current?.currentPercentage || 0, percentage),
        quantity: current?.quantity || 0
      };
    });

    // Generate rebalance orders
    const rebalanceOrders = this.generateRebalanceOrders(
      currentAllocation,
      targetAllocationArray,
      portfolio.account.total_equity
    );

    // Calculate expected improvement
    const expectedImprovement = this.calculateExpectedImprovement(
      currentAllocation,
      targetAllocationArray
    );

    return {
      currentAllocation,
      targetAllocation: targetAllocationArray,
      rebalanceOrders,
      expectedImprovement
    };
  }

  private getDefaultTargetAllocation(currentAllocation: PortfolioAllocation[]): Record<string, number> {
    const targets: Record<string, number> = {};
    const numPositions = currentAllocation.length;
    
    if (numPositions === 0) return targets;

    // Equal weight allocation with some adjustments
    const baseWeight = 100 / numPositions;
    
    currentAllocation.forEach(alloc => {
      targets[alloc.symbol] = Math.min(baseWeight, 20); // Max 20% per position
    });

    return targets;
  }

  private generateRebalanceOrders(
    current: PortfolioAllocation[],
    target: PortfolioAllocation[],
    totalEquity: number
  ): Array<{
    symbol: string;
    action: 'buy' | 'sell';
    quantity: number;
    reasoning: string;
  }> {
    const orders: Array<{
      symbol: string;
      action: 'buy' | 'sell';
      quantity: number;
      reasoning: string;
    }> = [];

    target.forEach(targetAlloc => {
      const currentAlloc = current.find(c => c.symbol === targetAlloc.symbol);
      const currentPercent = currentAlloc?.currentPercentage || 0;
      const deviation = currentPercent - targetAlloc.targetPercentage;

      // Only rebalance if deviation is significant (>5%)
      if (Math.abs(deviation) > 5) {
        const targetValue = (targetAlloc.targetPercentage / 100) * totalEquity;
        const currentValue = (currentPercent / 100) * totalEquity;
        const valueDifference = targetValue - currentValue;

        // Estimate price (would need real market data)
        const estimatedPrice = 100; // Placeholder
        const quantity = Math.abs(valueDifference / estimatedPrice);

        if (quantity > 0.01) { // Minimum order size
          orders.push({
            symbol: targetAlloc.symbol,
            action: valueDifference > 0 ? 'buy' : 'sell',
            quantity: Math.round(quantity * 100) / 100,
            reasoning: `Rebalance ${targetAlloc.symbol} from ${currentPercent.toFixed(1)}% to ${targetAlloc.targetPercentage.toFixed(1)}%`
          });
        }
      }
    });

    return orders;
  }

  private calculateExpectedImprovement(
    current: PortfolioAllocation[],
    target: PortfolioAllocation[]
  ): {
    riskReduction: number;
    returnIncrease: number;
    sharpeImprovement: number;
  } {
    // Simplified improvement calculation
    const currentConcentration = this.calculateConcentrationRisk(current);
    const targetConcentration = this.calculateConcentrationRisk(target);
    
    const riskReduction = Math.max(0, currentConcentration - targetConcentration);
    const returnIncrease = 0.02; // Estimated 2% improvement
    const sharpeImprovement = riskReduction * 0.5; // Simplified

    return {
      riskReduction,
      returnIncrease,
      sharpeImprovement
    };
  }

  // Portfolio Rebalancing
  async executeRebalancing(
    optimization: PortfolioOptimization,
    autoExecute: boolean = false
  ): Promise<{
    executed: boolean;
    orders: any[];
    errors: string[];
  }> {
    const result = {
      executed: false,
      orders: [] as any[],
      errors: [] as string[]
    };

    if (!autoExecute) {
      result.errors.push('Auto-execution not enabled');
      return result;
    }

    // Execute rebalance orders
    for (const rebalanceOrder of optimization.rebalanceOrders) {
      try {
        const accounts = await this.paperTradingManager.getPaperTradingAccounts();
        if (accounts.length === 0) {
          result.errors.push('No paper trading accounts found');
          continue;
        }

        const orderRequest = {
          account_id: accounts[0].id,
          symbol: rebalanceOrder.symbol,
          side: rebalanceOrder.action,
          order_type: 'market' as const,
          quantity: rebalanceOrder.quantity,
          strategy_reasoning: `Portfolio rebalancing: ${rebalanceOrder.reasoning}`
        };

        const order = await this.paperTradingManager.executePaperOrder(orderRequest);
        result.orders.push(order);
      } catch (error) {
        result.errors.push(`Failed to execute ${rebalanceOrder.action} order for ${rebalanceOrder.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.executed = result.errors.length === 0;
    return result;
  }

  // Performance Attribution
  async getPerformanceAttribution(): Promise<{
    bySymbol: Array<{
      symbol: string;
      contribution: number;
      weight: number;
      return: number;
    }>;
    byStrategy: Array<{
      strategy: string;
      contribution: number;
      trades: number;
      winRate: number;
    }>;
    totalReturn: number;
  }> {
    const [positions, orders, performance] = await Promise.all([
      this.paperTradingManager.getPaperPositions(),
      this.paperTradingManager.getPaperOrders({ limit: 1000 }),
      this.paperTradingManager.getPerformanceMetrics()
    ]);

    const bySymbol = this.calculateSymbolAttribution(positions);
    const byStrategy = this.calculateStrategyAttribution(orders);

    return {
      bySymbol,
      byStrategy,
      totalReturn: performance.total_return_percent || 0
    };
  }

  private calculateSymbolAttribution(positions: AgentPaperPosition[]): Array<{
    symbol: string;
    contribution: number;
    weight: number;
    return: number;
  }> {
    const totalValue = positions.reduce((sum, pos) => sum + pos.market_value, 0);
    
    return positions.map(position => {
      const weight = position.market_value / totalValue;
      const positionReturn = position.unrealized_pnl / (position.market_value - position.unrealized_pnl);
      const contribution = weight * positionReturn;

      return {
        symbol: position.symbol,
        contribution,
        weight,
        return: positionReturn
      };
    });
  }

  private calculateStrategyAttribution(orders: any[]): Array<{
    strategy: string;
    contribution: number;
    trades: number;
    winRate: number;
  }> {
    // Group orders by strategy
    const ordersByStrategy = orders.reduce((acc, order) => {
      const strategy = order.strategy_id || 'default';
      if (!acc[strategy]) {
        acc[strategy] = [];
      }
      acc[strategy].push(order);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(ordersByStrategy).map(([strategy, strategyOrders]) => {
      const trades = strategyOrders.length;
      const filledOrders = strategyOrders.filter(order => order.status === 'filled');
      const winningOrders = filledOrders.filter(order => 
        (order.side === 'buy' && order.average_fill_price < (order.current_price || order.average_fill_price)) ||
        (order.side === 'sell' && order.average_fill_price > (order.current_price || order.average_fill_price))
      );

      return {
        strategy,
        contribution: 0, // Would need more complex calculation
        trades,
        winRate: filledOrders.length > 0 ? winningOrders.length / filledOrders.length : 0
      };
    });
  }

  // Utility Methods
  async getPortfolioHealth(): Promise<{
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    factors: Array<{
      name: string;
      score: number;
      weight: number;
      description: string;
    }>;
  }> {
    const portfolio = await this.getPortfolioSummary();
    
    const factors = [
      {
        name: 'Diversification',
        score: portfolio.positions.length >= 5 ? 100 : portfolio.positions.length * 20,
        weight: 0.3,
        description: 'Number of different positions in portfolio'
      },
      {
        name: 'Risk Management',
        score: Math.max(0, 100 - (portfolio.riskMetrics.totalRisk * 100)),
        weight: 0.25,
        description: 'Overall portfolio risk level'
      },
      {
        name: 'Performance',
        score: Math.max(0, Math.min(100, 50 + portfolio.performance.total_return_percent * 5)),
        weight: 0.25,
        description: 'Return performance relative to expectations'
      },
      {
        name: 'Position Sizing',
        score: portfolio.riskMetrics.concentrationRisk < 0.3 ? 100 : 
               portfolio.riskMetrics.concentrationRisk < 0.5 ? 70 : 40,
        weight: 0.2,
        description: 'Appropriate position sizing and concentration'
      }
    ];

    const weightedScore = factors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0);

    const grade = weightedScore >= 90 ? 'A' :
                  weightedScore >= 80 ? 'B' :
                  weightedScore >= 70 ? 'C' :
                  weightedScore >= 60 ? 'D' : 'F';

    return {
      score: Math.round(weightedScore),
      grade,
      factors
    };
  }
}

// Factory function
export function createAgentPaperPortfolioManager(agentId: string): AgentPaperPortfolioManager {
  return new AgentPaperPortfolioManager(agentId);
}