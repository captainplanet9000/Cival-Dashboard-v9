// Agent Paper Trading Types
import { PaperTradingAccount, Position, Order, PerformanceMetrics, RiskMetrics } from './trading';

export interface AgentPaperTradingConfig {
  initial_balance: number;
  max_drawdown_percent: number;
  max_position_size_percent: number;
  max_daily_trades: number;
  allowed_symbols: string[];
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  strategy_types: string[];
  auto_stop_loss: boolean;
  auto_take_profit: boolean;
}

export interface AgentPaperTradingAccount extends PaperTradingAccount {
  agent_id: string;
  strategy_id?: string;
  allocation_percentage: number;
  config: AgentPaperTradingConfig;
  risk_limits: {
    max_position_value: number;
    max_daily_loss: number;
    max_correlation_exposure: number;
    min_cash_reserve: number;
  };
  trading_permissions: {
    can_trade: boolean;
    can_short: boolean;
    can_use_margin: boolean;
    max_leverage: number;
  };
  paper_trading_stats: {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    largest_win: number;
    largest_loss: number;
    average_hold_time: number;
    best_day: number;
    worst_day: number;
  };
}

export interface AgentPaperOrderRequest {
  agent_id: string;
  account_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stop_price?: number;
  strategy_id?: string;
  strategy_reasoning?: string;
  time_in_force?: 'day' | 'gtc' | 'ioc' | 'fok';
  agent_metadata?: {
    confidence_level: number;
    signal_strength: number;
    market_context: string;
    decision_factors: string[];
  };
}

export interface AgentPaperPosition extends Position {
  agent_id: string;
  strategy_id?: string;
  paper_account_id: string;
  entry_reasoning?: string;
  target_price?: number;
  stop_loss_price?: number;
  agent_metadata?: {
    conviction_level: number;
    risk_score: number;
    expected_hold_time: number;
    correlation_impact: number;
  };
}

export interface AgentPaperTradingPerformance extends PerformanceMetrics {
  agent_id: string;
  strategy_breakdown: {
    [strategy_id: string]: {
      trades: number;
      pnl: number;
      win_rate: number;
      avg_return: number;
      risk_adjusted_return: number;
    };
  };
  risk_analysis: {
    max_drawdown_date: Date;
    longest_losing_streak: number;
    consecutive_wins: number;
    risk_reward_ratio: number;
    position_sizing_efficiency: number;
  };
  decision_quality_metrics: {
    avg_confidence_level: number;
    confidence_vs_outcome_correlation: number;
    signal_strength_accuracy: number;
    market_timing_score: number;
  };
}

export interface AgentPaperTradingAlert {
  id: string;
  agent_id: string;
  account_id: string;
  alert_type: 'risk_limit' | 'performance' | 'position' | 'market' | 'strategy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  triggered_at: Date;
  acknowledged: boolean;
  auto_action_taken?: string;
  related_position_id?: string;
  related_order_id?: string;
}

export interface AgentPaperTradingDecision {
  decision_id: string;
  agent_id: string;
  strategy_id: string;
  decision_type: 'entry' | 'exit' | 'hold' | 'size_adjustment' | 'risk_management';
  symbol: string;
  reasoning: string;
  market_context: {
    price: number;
    volume: number;
    volatility: number;
    trend: string;
    sentiment: string;
  };
  decision_factors: {
    technical_signals: string[];
    fundamental_factors: string[];
    risk_considerations: string[];
    market_conditions: string[];
  };
  confidence_level: number; // 0-1
  expected_outcome: {
    target_price?: number;
    stop_loss?: number;
    expected_return: number;
    risk_reward_ratio: number;
  };
  execution_result?: {
    orders_placed: string[];
    execution_price?: number;
    slippage?: number;
    timing_delay: number;
  };
  outcome_tracking?: {
    actual_return?: number;
    hold_duration?: number;
    exit_reason?: string;
    lesson_learned?: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface AgentPaperTradingStrategy {
  strategy_id: string;
  agent_id: string;
  name: string;
  description: string;
  strategy_type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'pairs_trading' | 'breakout' | 'custom';
  parameters: {
    [key: string]: any;
  };
  entry_conditions: string[];
  exit_conditions: string[];
  risk_management_rules: string[];
  backtesting_results?: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    total_trades: number;
  };
  live_performance?: {
    trades_executed: number;
    current_pnl: number;
    success_rate: number;
    avg_return_per_trade: number;
  };
  status: 'active' | 'paused' | 'testing' | 'archived';
  created_at: Date;
  last_modified: Date;
}

export interface AgentPaperTradingSession {
  session_id: string;
  agent_id: string;
  account_id: string;
  start_time: Date;
  end_time?: Date;
  session_type: 'strategy_test' | 'live_simulation' | 'backtesting' | 'training';
  initial_balance: number;
  final_balance?: number;
  total_trades: number;
  strategies_used: string[];
  performance_summary?: {
    total_pnl: number;
    win_rate: number;
    max_drawdown: number;
    sharpe_ratio: number;
  };
  key_learnings?: string[];
  session_notes?: string;
  status: 'active' | 'completed' | 'terminated' | 'paused';
}