// Agent Paper Trading Manager
import { backendApi } from '@/lib/api/backend-client';
import type {
  AgentPaperTradingAccount,
  AgentPaperOrderRequest,
  AgentPaperTradingConfig,
  AgentPaperTradingDecision,
  AgentPaperTradingAlert,
  AgentPaperTradingStrategy,
  AgentPaperTradingSession
} from '@/types/agent-paper-trading';
import type { ApiResponse } from '@/lib/api/backend-client';

export class AgentPaperTradingManager {
  private readonly agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  // Account Management
  async createPaperTradingAccount(
    config: AgentPaperTradingConfig,
    accountName?: string
  ): Promise<AgentPaperTradingAccount> {
    const accountData = {
      name: accountName || `${this.agentId}-paper-account`,
      initial_balance: config.initial_balance,
      config,
      risk_limits: {
        max_position_value: config.initial_balance * (config.max_position_size_percent / 100),
        max_daily_loss: config.initial_balance * (config.max_drawdown_percent / 100),
        max_correlation_exposure: 0.3,
        min_cash_reserve: config.initial_balance * 0.1,
      },
      trading_permissions: {
        can_trade: true,
        can_short: config.risk_tolerance === 'aggressive',
        can_use_margin: config.risk_tolerance !== 'conservative',
        max_leverage: config.risk_tolerance === 'conservative' ? 1 : 
                     config.risk_tolerance === 'moderate' ? 2 : 3,
      }
    };

    const response = await backendApi.createAgentPaperAccount(this.agentId, accountData);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data;
  }

  async getPaperTradingAccounts(): Promise<AgentPaperTradingAccount[]> {
    const response = await backendApi.getAgentPaperAccounts(this.agentId);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  async getPaperTradingAccount(accountId: string): Promise<AgentPaperTradingAccount> {
    const response = await backendApi.getAgentPaperAccount(this.agentId, accountId);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data;
  }

  async resetPaperTradingAccount(accountId: string): Promise<AgentPaperTradingAccount> {
    const response = await backendApi.resetAgentPaperAccount(this.agentId, accountId);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data;
  }

  // Trading Operations
  async executePaperOrder(orderRequest: Omit<AgentPaperOrderRequest, 'agent_id'>): Promise<any> {
    const fullOrderRequest = {
      ...orderRequest,
      agent_id: this.agentId,
    };

    // Validate order before execution
    await this.validateOrder(fullOrderRequest);

    const response = await backendApi.executeAgentPaperOrder(this.agentId, fullOrderRequest);
    if (response.error) {
      throw new Error(response.error);
    }

    // Log the trading decision
    await this.logTradingDecision({
      decision_type: orderRequest.side === 'buy' ? 'entry' : 'exit',
      symbol: orderRequest.symbol,
      reasoning: orderRequest.strategy_reasoning || 'Automated trading decision',
      confidence_level: orderRequest.agent_metadata?.confidence_level || 0.5,
      expected_outcome: {
        expected_return: 0, // Will be calculated based on strategy
        risk_reward_ratio: 2, // Default
      }
    });

    return response.data;
  }

  async getPaperOrders(filters?: {
    status?: string;
    symbol?: string;
    limit?: number;
  }): Promise<any[]> {
    const response = await backendApi.getAgentPaperOrders(this.agentId, filters);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  async getPaperPortfolio(accountId?: string): Promise<any> {
    const response = await backendApi.getAgentPaperPortfolio(this.agentId, accountId);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data;
  }

  async getPaperPositions(accountId?: string): Promise<any[]> {
    const response = await backendApi.getAgentPaperPositions(this.agentId, accountId);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  async closePaperPosition(positionId: string, quantity?: number): Promise<any> {
    const response = await backendApi.closeAgentPaperPosition(this.agentId, positionId, quantity);
    if (response.error) {
      throw new Error(response.error);
    }

    // Log the exit decision
    await this.logTradingDecision({
      decision_type: 'exit',
      symbol: 'UNKNOWN', // Would need to get from position
      reasoning: 'Position closure',
      confidence_level: 0.8,
      expected_outcome: {
        expected_return: 0,
        risk_reward_ratio: 1,
      }
    });

    return response.data;
  }

  // Performance Analysis
  async getPerformanceMetrics(timeRange?: {
    start: string;
    end: string;
    period?: string;
  }): Promise<any> {
    const response = await backendApi.getAgentPaperPerformance(this.agentId, timeRange);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data;
  }

  async analyzeTradingPerformance(): Promise<{
    summary: any;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    const performance = await this.getPerformanceMetrics();
    const positions = await this.getPaperPositions();
    const orders = await this.getPaperOrders({ limit: 100 });

    // Analyze performance patterns
    const analysis = {
      summary: performance,
      strengths: [] as string[],
      weaknesses: [] as string[],
      recommendations: [] as string[],
    };

    // Win rate analysis
    if (performance.win_rate > 0.6) {
      analysis.strengths.push('High win rate indicates good entry timing');
    } else if (performance.win_rate < 0.4) {
      analysis.weaknesses.push('Low win rate suggests poor entry signals');
      analysis.recommendations.push('Review entry criteria and market timing');
    }

    // Risk-adjusted returns
    if (performance.sharpe_ratio > 1.5) {
      analysis.strengths.push('Excellent risk-adjusted returns');
    } else if (performance.sharpe_ratio < 0.5) {
      analysis.weaknesses.push('Poor risk-adjusted returns');
      analysis.recommendations.push('Improve risk management and position sizing');
    }

    // Drawdown analysis
    if (performance.max_drawdown > 0.2) {
      analysis.weaknesses.push('High maximum drawdown indicates excessive risk');
      analysis.recommendations.push('Implement stricter stop-loss rules');
    }

    return analysis;
  }

  // Strategy Management
  async testStrategy(
    strategy: Partial<AgentPaperTradingStrategy>,
    testDuration: number = 24 * 60 * 60 * 1000 // 24 hours in ms
  ): Promise<AgentPaperTradingSession> {
    // Create a new paper trading session for strategy testing
    const session: Partial<AgentPaperTradingSession> = {
      agent_id: this.agentId,
      session_type: 'strategy_test',
      start_time: new Date(),
      strategies_used: [strategy.strategy_id || 'test-strategy'],
      status: 'active'
    };

    // This would be implemented on the backend
    // For now, return a mock session
    return {
      session_id: `session-${Date.now()}`,
      agent_id: this.agentId,
      account_id: 'test-account',
      start_time: new Date(),
      session_type: 'strategy_test',
      initial_balance: 10000,
      total_trades: 0,
      strategies_used: [strategy.strategy_id || 'test-strategy'],
      status: 'active'
    };
  }

  // Risk Management
  async validateOrder(orderRequest: AgentPaperOrderRequest): Promise<void> {
    const account = await this.getPaperTradingAccount(orderRequest.account_id);
    const portfolio = await this.getPaperPortfolio(orderRequest.account_id);

    // Check if symbol is allowed
    if (!account.config.allowed_symbols.includes(orderRequest.symbol)) {
      throw new Error(`Symbol ${orderRequest.symbol} not allowed for this agent`);
    }

    // Check position size limits
    const orderValue = orderRequest.quantity * (orderRequest.price || 100); // Use price or estimate
    if (orderValue > account.risk_limits.max_position_value) {
      throw new Error('Order exceeds maximum position size limit');
    }

    // Check daily trade limits
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = await this.getPaperOrders({ limit: 1000 });
    const todayTradeCount = todayOrders.filter(order => 
      order.created_at.startsWith(today)
    ).length;

    if (todayTradeCount >= account.config.max_daily_trades) {
      throw new Error('Daily trade limit exceeded');
    }

    // Check available cash
    if (orderRequest.side === 'buy' && orderValue > portfolio.available_buying_power) {
      throw new Error('Insufficient buying power for order');
    }
  }

  async checkRiskLimits(): Promise<AgentPaperTradingAlert[]> {
    const alerts: AgentPaperTradingAlert[] = [];
    const accounts = await this.getPaperTradingAccounts();

    for (const account of accounts) {
      const portfolio = await this.getPaperPortfolio(account.id);
      
      // Check drawdown
      const drawdown = (account.initial_balance - portfolio.total_equity) / account.initial_balance;
      if (drawdown > account.config.max_drawdown_percent / 100) {
        alerts.push({
          id: `alert-${Date.now()}`,
          agent_id: this.agentId,
          account_id: account.id,
          alert_type: 'risk_limit',
          severity: 'high',
          title: 'Maximum Drawdown Exceeded',
          message: `Current drawdown of ${(drawdown * 100).toFixed(2)}% exceeds limit of ${account.config.max_drawdown_percent}%`,
          triggered_at: new Date(),
          acknowledged: false
        });
      }

      // Check cash reserves
      if (portfolio.cash_balance < account.risk_limits.min_cash_reserve) {
        alerts.push({
          id: `alert-${Date.now()}-cash`,
          agent_id: this.agentId,
          account_id: account.id,
          alert_type: 'risk_limit',
          severity: 'medium',
          title: 'Low Cash Reserves',
          message: `Cash balance below minimum reserve requirement`,
          triggered_at: new Date(),
          acknowledged: false
        });
      }
    }

    return alerts;
  }

  // Decision Logging
  private async logTradingDecision(
    decision: Partial<AgentPaperTradingDecision>
  ): Promise<void> {
    const fullDecision: AgentPaperTradingDecision = {
      decision_id: `decision-${Date.now()}`,
      agent_id: this.agentId,
      strategy_id: decision.strategy_id || 'default',
      decision_type: decision.decision_type || 'entry',
      symbol: decision.symbol || '',
      reasoning: decision.reasoning || '',
      market_context: decision.market_context || {
        price: 0,
        volume: 0,
        volatility: 0,
        trend: 'neutral',
        sentiment: 'neutral'
      },
      decision_factors: decision.decision_factors || {
        technical_signals: [],
        fundamental_factors: [],
        risk_considerations: [],
        market_conditions: []
      },
      confidence_level: decision.confidence_level || 0.5,
      expected_outcome: decision.expected_outcome || {
        expected_return: 0,
        risk_reward_ratio: 1
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    // This would be sent to the backend for storage
    console.log('Trading decision logged:', fullDecision);
  }

  // Utility Methods
  getAgentId(): string {
    return this.agentId;
  }

  async generateTradingReport(): Promise<{
    performance: any;
    positions: any[];
    recentOrders: any[];
    alerts: AgentPaperTradingAlert[];
    analysis: any;
  }> {
    const [performance, positions, recentOrders, alerts, analysis] = await Promise.all([
      this.getPerformanceMetrics(),
      this.getPaperPositions(),
      this.getPaperOrders({ limit: 10 }),
      this.checkRiskLimits(),
      this.analyzeTradingPerformance()
    ]);

    return {
      performance,
      positions,
      recentOrders,
      alerts,
      analysis
    };
  }
}

// Factory function for creating agent paper trading managers
export function createAgentPaperTradingManager(agentId: string): AgentPaperTradingManager {
  return new AgentPaperTradingManager(agentId);
}

// Default configurations for different agent types
export const AGENT_PAPER_TRADING_CONFIGS = {
  conservative: {
    initial_balance: 10000,
    max_drawdown_percent: 5,
    max_position_size_percent: 10,
    max_daily_trades: 5,
    allowed_symbols: ['BTC/USD', 'ETH/USD', 'SPY', 'QQQ'],
    risk_tolerance: 'conservative' as const,
    strategy_types: ['mean_reversion', 'momentum'],
    auto_stop_loss: true,
    auto_take_profit: true,
  },
  moderate: {
    initial_balance: 10000,
    max_drawdown_percent: 10,
    max_position_size_percent: 15,
    max_daily_trades: 10,
    allowed_symbols: ['BTC/USD', 'ETH/USD', 'SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL'],
    risk_tolerance: 'moderate' as const,
    strategy_types: ['mean_reversion', 'momentum', 'breakout'],
    auto_stop_loss: true,
    auto_take_profit: false,
  },
  aggressive: {
    initial_balance: 10000,
    max_drawdown_percent: 20,
    max_position_size_percent: 25,
    max_daily_trades: 20,
    allowed_symbols: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'DOGE/USD', 'SPY', 'QQQ', 'AAPL', 'MSFT', 'TSLA'],
    risk_tolerance: 'aggressive' as const,
    strategy_types: ['momentum', 'breakout', 'arbitrage', 'pairs_trading'],
    auto_stop_loss: false,
    auto_take_profit: false,
  }
} as const;