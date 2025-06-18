// Agent Paper Trading Order Execution Engine
import { AgentPaperTradingManager } from './paper-trading-manager';
import type {
  AgentPaperOrderRequest,
  AgentPaperTradingStrategy,
  AgentPaperTradingDecision
} from '@/types/agent-paper-trading';
import type { MarketData, TradingSignal } from '@/types/trading';

export interface TradingContext {
  marketData: MarketData;
  portfolioValue: number;
  availableCash: number;
  currentPositions: any[];
  riskMetrics: any;
  marketSentiment: string;
}

export interface StrategyExecutionResult {
  orders: AgentPaperOrderRequest[];
  reasoning: string;
  confidence: number;
  riskScore: number;
  expectedReturn: number;
}

export class AgentPaperTradingExecutor {
  private readonly paperTradingManager: AgentPaperTradingManager;
  private readonly agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.paperTradingManager = new AgentPaperTradingManager(agentId);
  }

  // Strategy Execution Engine
  async executeStrategy(
    strategy: AgentPaperTradingStrategy,
    context: TradingContext
  ): Promise<StrategyExecutionResult> {
    try {
      // Analyze market conditions
      const marketAnalysis = await this.analyzeMarketConditions(context);
      
      // Generate trading signals based on strategy
      const signals = await this.generateTradingSignals(strategy, context, marketAnalysis);
      
      // Convert signals to orders
      const orders = await this.convertSignalsToOrders(signals, context, strategy);
      
      // Calculate execution metrics
      const executionMetrics = this.calculateExecutionMetrics(orders, context);

      return {
        orders,
        reasoning: this.generateExecutionReasoning(strategy, marketAnalysis, signals),
        confidence: executionMetrics.confidence,
        riskScore: executionMetrics.riskScore,
        expectedReturn: executionMetrics.expectedReturn
      };
    } catch (error) {
      console.error('Strategy execution failed:', error);
      return {
        orders: [],
        reasoning: `Strategy execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        riskScore: 1,
        expectedReturn: 0
      };
    }
  }

  // Market Analysis
  private async analyzeMarketConditions(context: TradingContext): Promise<{
    trend: 'bullish' | 'bearish' | 'neutral';
    volatility: 'low' | 'medium' | 'high';
    momentum: number;
    support: number;
    resistance: number;
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const marketData = context.marketData;
    
    // Simple trend analysis based on price movement
    const priceChange = ((marketData.close - marketData.open) / marketData.open) * 100;
    const trend = priceChange > 1 ? 'bullish' : priceChange < -1 ? 'bearish' : 'neutral';
    
    // Volatility analysis based on high-low range
    const volatilityPercent = ((marketData.high - marketData.low) / marketData.close) * 100;
    const volatility = volatilityPercent > 3 ? 'high' : volatilityPercent > 1.5 ? 'medium' : 'low';
    
    // Simple momentum calculation
    const momentum = priceChange;
    
    // Basic support/resistance (simplified)
    const support = Math.min(marketData.low, marketData.open * 0.98);
    const resistance = Math.max(marketData.high, marketData.open * 1.02);
    
    // Risk level based on volatility and market conditions
    const riskLevel = volatility === 'high' ? 'high' : 
                     context.marketSentiment === 'fear' ? 'high' : 'medium';

    return {
      trend,
      volatility,
      momentum,
      support,
      resistance,
      riskLevel
    };
  }

  // Signal Generation
  private async generateTradingSignals(
    strategy: AgentPaperTradingStrategy,
    context: TradingContext,
    marketAnalysis: any
  ): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    switch (strategy.strategy_type) {
      case 'momentum':
        signals.push(...this.generateMomentumSignals(context, marketAnalysis));
        break;
      case 'mean_reversion':
        signals.push(...this.generateMeanReversionSignals(context, marketAnalysis));
        break;
      case 'breakout':
        signals.push(...this.generateBreakoutSignals(context, marketAnalysis));
        break;
      case 'arbitrage':
        signals.push(...this.generateArbitrageSignals(context, marketAnalysis));
        break;
      default:
        signals.push(...this.generateDefaultSignals(context, marketAnalysis));
    }

    return signals.filter(signal => signal.confidence > 0.3); // Filter weak signals
  }

  private generateMomentumSignals(context: TradingContext, analysis: any): TradingSignal[] {
    const signals: TradingSignal[] = [];
    const marketData = context.marketData;

    if (analysis.trend === 'bullish' && analysis.momentum > 2 && analysis.volatility !== 'high') {
      signals.push({
        id: `momentum-buy-${Date.now()}`,
        symbol: marketData.symbol,
        strategy: 'momentum',
        signal: 'buy',
        strength: Math.min(analysis.momentum / 5, 1),
        confidence: analysis.volatility === 'low' ? 0.8 : 0.6,
        entry_price: marketData.close,
        stop_loss: analysis.support,
        take_profit: analysis.resistance,
        risk_reward_ratio: (analysis.resistance - marketData.close) / (marketData.close - analysis.support),
        timestamp: new Date(),
        metadata: {
          strategy_type: 'momentum',
          trend: analysis.trend,
          momentum_value: analysis.momentum
        }
      });
    }

    if (analysis.trend === 'bearish' && analysis.momentum < -2 && analysis.volatility !== 'high') {
      signals.push({
        id: `momentum-sell-${Date.now()}`,
        symbol: marketData.symbol,
        strategy: 'momentum',
        signal: 'sell',
        strength: Math.min(Math.abs(analysis.momentum) / 5, 1),
        confidence: analysis.volatility === 'low' ? 0.8 : 0.6,
        entry_price: marketData.close,
        stop_loss: analysis.resistance,
        take_profit: analysis.support,
        risk_reward_ratio: (marketData.close - analysis.support) / (analysis.resistance - marketData.close),
        timestamp: new Date(),
        metadata: {
          strategy_type: 'momentum',
          trend: analysis.trend,
          momentum_value: analysis.momentum
        }
      });
    }

    return signals;
  }

  private generateMeanReversionSignals(context: TradingContext, analysis: any): TradingSignal[] {
    const signals: TradingSignal[] = [];
    const marketData = context.marketData;

    // Mean reversion logic: buy when price is near support, sell when near resistance
    const distanceToSupport = Math.abs(marketData.close - analysis.support) / marketData.close;
    const distanceToResistance = Math.abs(marketData.close - analysis.resistance) / marketData.close;

    if (distanceToSupport < 0.02 && analysis.trend !== 'bearish') {
      signals.push({
        id: `mean-reversion-buy-${Date.now()}`,
        symbol: marketData.symbol,
        strategy: 'mean_reversion',
        signal: 'buy',
        strength: 1 - distanceToSupport,
        confidence: 0.7,
        entry_price: marketData.close,
        stop_loss: analysis.support * 0.99,
        take_profit: (analysis.support + analysis.resistance) / 2,
        risk_reward_ratio: 2,
        timestamp: new Date(),
        metadata: {
          strategy_type: 'mean_reversion',
          distance_to_support: distanceToSupport
        }
      });
    }

    if (distanceToResistance < 0.02 && analysis.trend !== 'bullish') {
      signals.push({
        id: `mean-reversion-sell-${Date.now()}`,
        symbol: marketData.symbol,
        strategy: 'mean_reversion',
        signal: 'sell',
        strength: 1 - distanceToResistance,
        confidence: 0.7,
        entry_price: marketData.close,
        stop_loss: analysis.resistance * 1.01,
        take_profit: (analysis.support + analysis.resistance) / 2,
        risk_reward_ratio: 2,
        timestamp: new Date(),
        metadata: {
          strategy_type: 'mean_reversion',
          distance_to_resistance: distanceToResistance
        }
      });
    }

    return signals;
  }

  private generateBreakoutSignals(context: TradingContext, analysis: any): TradingSignal[] {
    const signals: TradingSignal[] = [];
    const marketData = context.marketData;

    // Breakout above resistance
    if (marketData.close > analysis.resistance && analysis.volume > marketData.volume * 1.2) {
      signals.push({
        id: `breakout-buy-${Date.now()}`,
        symbol: marketData.symbol,
        strategy: 'breakout',
        signal: 'buy',
        strength: 0.8,
        confidence: 0.75,
        entry_price: marketData.close,
        stop_loss: analysis.resistance,
        take_profit: analysis.resistance + (analysis.resistance - analysis.support),
        risk_reward_ratio: 2,
        timestamp: new Date(),
        metadata: {
          strategy_type: 'breakout',
          breakout_level: analysis.resistance,
          volume_confirmation: true
        }
      });
    }

    // Breakdown below support
    if (marketData.close < analysis.support && analysis.volume > marketData.volume * 1.2) {
      signals.push({
        id: `breakdown-sell-${Date.now()}`,
        symbol: marketData.symbol,
        strategy: 'breakout',
        signal: 'sell',
        strength: 0.8,
        confidence: 0.75,
        entry_price: marketData.close,
        stop_loss: analysis.support,
        take_profit: analysis.support - (analysis.resistance - analysis.support),
        risk_reward_ratio: 2,
        timestamp: new Date(),
        metadata: {
          strategy_type: 'breakout',
          breakdown_level: analysis.support,
          volume_confirmation: true
        }
      });
    }

    return signals;
  }

  private generateArbitrageSignals(context: TradingContext, analysis: any): TradingSignal[] {
    // Arbitrage signals would require cross-exchange data
    // For now, return empty array
    return [];
  }

  private generateDefaultSignals(context: TradingContext, analysis: any): TradingSignal[] {
    // Basic buy/sell signals based on simple rules
    const signals: TradingSignal[] = [];
    const marketData = context.marketData;

    if (analysis.trend === 'bullish' && analysis.riskLevel !== 'high') {
      signals.push({
        id: `default-buy-${Date.now()}`,
        symbol: marketData.symbol,
        strategy: 'default',
        signal: 'buy',
        strength: 0.5,
        confidence: 0.5,
        entry_price: marketData.close,
        stop_loss: marketData.close * 0.95,
        take_profit: marketData.close * 1.1,
        risk_reward_ratio: 2,
        timestamp: new Date(),
        metadata: {
          strategy_type: 'default'
        }
      });
    }

    return signals;
  }

  // Order Generation
  private async convertSignalsToOrders(
    signals: TradingSignal[],
    context: TradingContext,
    strategy: AgentPaperTradingStrategy
  ): Promise<AgentPaperOrderRequest[]> {
    const orders: AgentPaperOrderRequest[] = [];
    const accounts = await this.paperTradingManager.getPaperTradingAccounts();
    
    if (accounts.length === 0) {
      throw new Error('No paper trading accounts found for agent');
    }

    const account = accounts[0]; // Use first account

    for (const signal of signals) {
      const positionSize = this.calculatePositionSize(signal, context, account.config);
      
      if (positionSize > 0) {
        const order: AgentPaperOrderRequest = {
          agent_id: this.agentId,
          account_id: account.id,
          symbol: signal.symbol,
          side: signal.signal === 'buy' ? 'buy' : 'sell',
          order_type: 'market', // Could be made configurable
          quantity: positionSize,
          strategy_id: strategy.strategy_id,
          strategy_reasoning: `${strategy.name} signal: ${signal.signal} with ${(signal.confidence * 100).toFixed(1)}% confidence`,
          agent_metadata: {
            confidence_level: signal.confidence,
            signal_strength: signal.strength,
            market_context: `Trend: ${context.marketSentiment}, Strategy: ${strategy.strategy_type}`,
            decision_factors: [
              `Signal strength: ${signal.strength}`,
              `Confidence: ${signal.confidence}`,
              `Risk-reward ratio: ${signal.risk_reward_ratio}`
            ]
          }
        };

        // Add stop loss and take profit if provided
        if (signal.stop_loss) {
          // Would need to create separate stop-loss order
        }

        orders.push(order);
      }
    }

    return orders;
  }

  // Position Sizing
  private calculatePositionSize(
    signal: TradingSignal,
    context: TradingContext,
    config: any
  ): number {
    const maxPositionValue = context.portfolioValue * (config.max_position_size_percent / 100);
    const riskAmount = context.portfolioValue * 0.02; // Risk 2% per trade
    
    let quantity = 0;

    if (signal.stop_loss && signal.entry_price) {
      // Calculate position size based on risk
      const riskPerShare = Math.abs(signal.entry_price - signal.stop_loss);
      quantity = riskAmount / riskPerShare;
    } else {
      // Use maximum position size
      quantity = maxPositionValue / signal.entry_price;
    }

    // Apply confidence scaling
    quantity *= signal.confidence;

    // Ensure we don't exceed available cash
    const orderValue = quantity * signal.entry_price;
    if (orderValue > context.availableCash) {
      quantity = context.availableCash / signal.entry_price * 0.95; // Leave some buffer
    }

    return Math.floor(quantity * 100) / 100; // Round to 2 decimal places
  }

  // Execution Metrics
  private calculateExecutionMetrics(
    orders: AgentPaperOrderRequest[],
    context: TradingContext
  ): {
    confidence: number;
    riskScore: number;
    expectedReturn: number;
  } {
    if (orders.length === 0) {
      return { confidence: 0, riskScore: 0, expectedReturn: 0 };
    }

    const avgConfidence = orders.reduce((sum, order) => 
      sum + (order.agent_metadata?.confidence_level || 0), 0) / orders.length;

    const totalOrderValue = orders.reduce((sum, order) => 
      sum + order.quantity * (order.price || context.marketData.close), 0);
    
    const riskScore = totalOrderValue / context.portfolioValue;
    
    // Simple expected return calculation
    const expectedReturn = avgConfidence * 0.05; // 5% max expected return

    return {
      confidence: avgConfidence,
      riskScore: Math.min(riskScore, 1),
      expectedReturn
    };
  }

  // Reasoning Generation
  private generateExecutionReasoning(
    strategy: AgentPaperTradingStrategy,
    marketAnalysis: any,
    signals: TradingSignal[]
  ): string {
    let reasoning = `Executed ${strategy.name} strategy based on current market conditions. `;
    
    reasoning += `Market Analysis: Trend is ${marketAnalysis.trend} with ${marketAnalysis.volatility} volatility. `;
    reasoning += `Momentum: ${marketAnalysis.momentum.toFixed(2)}%. `;
    
    if (signals.length > 0) {
      reasoning += `Generated ${signals.length} trading signal(s): `;
      signals.forEach(signal => {
        reasoning += `${signal.signal.toUpperCase()} ${signal.symbol} (confidence: ${(signal.confidence * 100).toFixed(1)}%) `;
      });
    } else {
      reasoning += 'No trading signals generated due to current market conditions.';
    }

    return reasoning;
  }

  // Public interface methods
  async executeMarketOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    reasoning?: string
  ): Promise<any> {
    const accounts = await this.paperTradingManager.getPaperTradingAccounts();
    if (accounts.length === 0) {
      throw new Error('No paper trading accounts found');
    }

    const orderRequest: Omit<AgentPaperOrderRequest, 'agent_id'> = {
      account_id: accounts[0].id,
      symbol,
      side,
      order_type: 'market',
      quantity,
      strategy_reasoning: reasoning || 'Manual market order execution'
    };

    return await this.paperTradingManager.executePaperOrder(orderRequest);
  }

  async executeLimitOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    price: number,
    reasoning?: string
  ): Promise<any> {
    const accounts = await this.paperTradingManager.getPaperTradingAccounts();
    if (accounts.length === 0) {
      throw new Error('No paper trading accounts found');
    }

    const orderRequest: Omit<AgentPaperOrderRequest, 'agent_id'> = {
      account_id: accounts[0].id,
      symbol,
      side,
      order_type: 'limit',
      quantity,
      price,
      strategy_reasoning: reasoning || 'Manual limit order execution'
    };

    return await this.paperTradingManager.executePaperOrder(orderRequest);
  }

  async closeAllPositions(reasoning?: string): Promise<any[]> {
    const positions = await this.paperTradingManager.getPaperPositions();
    const results = [];

    for (const position of positions) {
      try {
        const result = await this.paperTradingManager.closePaperPosition(
          position.id,
          Math.abs(position.quantity)
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to close position ${position.id}:`, error);
      }
    }

    return results;
  }
}

// Factory function
export function createAgentPaperTradingExecutor(agentId: string): AgentPaperTradingExecutor {
  return new AgentPaperTradingExecutor(agentId);
}