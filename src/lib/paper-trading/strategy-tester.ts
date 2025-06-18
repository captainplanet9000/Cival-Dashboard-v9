// Paper Trading Strategy Testing Framework
import { AgentPaperTradingManager } from '@/lib/agents/paper-trading-manager';
import { AgentPaperTradingExecutor } from '@/lib/agents/paper-trading-executor';
import type {
  AgentPaperTradingStrategy,
  AgentPaperTradingSession,
  AgentPaperTradingConfig
} from '@/types/agent-paper-trading';
import type { MarketData, BacktestResult } from '@/types/trading';

export interface StrategyTestConfiguration {
  strategy: AgentPaperTradingStrategy;
  testDuration: number; // in milliseconds
  initialBalance: number;
  testSymbols: string[];
  testMode: 'backtesting' | 'forward_testing' | 'live_simulation';
  marketDataSource: 'mock' | 'historical' | 'live';
  riskLimits: {
    maxDrawdown: number;
    maxPositionSize: number;
    stopTestOnLoss: boolean;
  };
}

export interface StrategyTestResult {
  testId: string;
  strategy: AgentPaperTradingStrategy;
  configuration: StrategyTestConfiguration;
  startTime: Date;
  endTime: Date;
  duration: number;
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    totalTrades: number;
    avgTradeReturn: number;
    bestTrade: number;
    worstTrade: number;
    profitFactor: number;
  };
  riskMetrics: {
    volatility: number;
    var95: number;
    expectedShortfall: number;
    betaToMarket: number;
    correlationToMarket: number;
  };
  tradingActivity: {
    orders: any[];
    positions: any[];
    fills: any[];
    signals: any[];
  };
  marketConditions: {
    avgVolatility: number;
    trendDirection: string;
    marketRegime: string;
    correlations: Record<string, number>;
  };
  recommendations: {
    overall: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    nextSteps: string[];
  };
  passed: boolean;
  failureReasons?: string[];
}

export interface StrategyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  score: number; // 0-100
  categories: {
    logic: { score: number; issues: string[] };
    risk: { score: number; issues: string[] };
    parameters: { score: number; issues: string[] };
    performance: { score: number; issues: string[] };
  };
}

export class PaperTradingStrategyTester {
  private readonly agentId: string;
  private readonly paperTradingManager: AgentPaperTradingManager;
  private readonly executor: AgentPaperTradingExecutor;
  private activeSessions: Map<string, AgentPaperTradingSession> = new Map();

  constructor(agentId: string) {
    this.agentId = agentId;
    this.paperTradingManager = new AgentPaperTradingManager(agentId);
    this.executor = new AgentPaperTradingExecutor(agentId);
  }

  // Strategy Validation
  async validateStrategy(strategy: AgentPaperTradingStrategy): Promise<StrategyValidationResult> {
    const result: StrategyValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
      score: 0,
      categories: {
        logic: { score: 0, issues: [] },
        risk: { score: 0, issues: [] },
        parameters: { score: 0, issues: [] },
        performance: { score: 0, issues: [] }
      }
    };

    // Validate strategy logic
    this.validateStrategyLogic(strategy, result);
    
    // Validate risk parameters
    this.validateRiskParameters(strategy, result);
    
    // Validate strategy parameters
    this.validateStrategyParameters(strategy, result);
    
    // Calculate overall score
    const categoryScores = Object.values(result.categories).map(cat => cat.score);
    result.score = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
    
    // Set validity based on score and critical errors
    result.isValid = result.score >= 60 && result.errors.length === 0;
    
    // Generate recommendations
    this.generateValidationRecommendations(result);

    return result;
  }

  private validateStrategyLogic(
    strategy: AgentPaperTradingStrategy,
    result: StrategyValidationResult
  ): void {
    let logicScore = 100;

    // Check if strategy has entry conditions
    if (!strategy.entry_conditions || strategy.entry_conditions.length === 0) {
      result.errors.push('Strategy must have at least one entry condition');
      result.categories.logic.issues.push('No entry conditions defined');
      logicScore -= 40;
    }

    // Check if strategy has exit conditions
    if (!strategy.exit_conditions || strategy.exit_conditions.length === 0) {
      result.errors.push('Strategy must have at least one exit condition');
      result.categories.logic.issues.push('No exit conditions defined');
      logicScore -= 40;
    }

    // Check strategy type validity
    const validTypes = ['momentum', 'mean_reversion', 'arbitrage', 'pairs_trading', 'breakout', 'custom'];
    if (!validTypes.includes(strategy.strategy_type)) {
      result.errors.push(`Invalid strategy type: ${strategy.strategy_type}`);
      result.categories.logic.issues.push('Invalid strategy type');
      logicScore -= 20;
    }

    // Check parameter completeness
    if (!strategy.parameters || Object.keys(strategy.parameters).length === 0) {
      result.warnings.push('Strategy has no parameters defined');
      result.categories.logic.issues.push('No parameters defined');
      logicScore -= 15;
    }

    result.categories.logic.score = Math.max(0, logicScore);
  }

  private validateRiskParameters(
    strategy: AgentPaperTradingStrategy,
    result: StrategyValidationResult
  ): void {
    let riskScore = 100;

    // Check if risk management rules exist
    if (!strategy.risk_management_rules || strategy.risk_management_rules.length === 0) {
      result.warnings.push('Strategy should have risk management rules');
      result.categories.risk.issues.push('No risk management rules');
      riskScore -= 30;
    }

    // Check for stop-loss rules
    const hasStopLoss = strategy.risk_management_rules?.some(rule => 
      rule.toLowerCase().includes('stop') || rule.toLowerCase().includes('loss')
    );
    if (!hasStopLoss) {
      result.warnings.push('Strategy should include stop-loss rules');
      result.categories.risk.issues.push('No stop-loss rules found');
      riskScore -= 20;
    }

    // Check for position sizing rules
    const hasPositionSizing = strategy.risk_management_rules?.some(rule => 
      rule.toLowerCase().includes('size') || rule.toLowerCase().includes('position')
    );
    if (!hasPositionSizing) {
      result.warnings.push('Strategy should include position sizing rules');
      result.categories.risk.issues.push('No position sizing rules');
      riskScore -= 20;
    }

    result.categories.risk.score = Math.max(0, riskScore);
  }

  private validateStrategyParameters(
    strategy: AgentPaperTradingStrategy,
    result: StrategyValidationResult
  ): void {
    let paramScore = 100;

    if (strategy.parameters) {
      // Check for reasonable parameter values based on strategy type
      switch (strategy.strategy_type) {
        case 'momentum':
          if (!strategy.parameters.lookback_period) {
            result.warnings.push('Momentum strategy should have lookback_period parameter');
            paramScore -= 15;
          }
          if (!strategy.parameters.momentum_threshold) {
            result.warnings.push('Momentum strategy should have momentum_threshold parameter');
            paramScore -= 15;
          }
          break;
          
        case 'mean_reversion':
          if (!strategy.parameters.deviation_threshold) {
            result.warnings.push('Mean reversion strategy should have deviation_threshold parameter');
            paramScore -= 15;
          }
          if (!strategy.parameters.reversion_period) {
            result.warnings.push('Mean reversion strategy should have reversion_period parameter');
            paramScore -= 15;
          }
          break;

        case 'breakout':
          if (!strategy.parameters.breakout_threshold) {
            result.warnings.push('Breakout strategy should have breakout_threshold parameter');
            paramScore -= 15;
          }
          if (!strategy.parameters.volume_confirmation) {
            result.warnings.push('Breakout strategy should have volume_confirmation parameter');
            paramScore -= 10;
          }
          break;
      }

      // Check for extreme parameter values
      Object.entries(strategy.parameters).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (value <= 0) {
            result.warnings.push(`Parameter ${key} should be positive`);
            paramScore -= 5;
          }
          if (value > 1000) {
            result.warnings.push(`Parameter ${key} seems unusually large`);
            paramScore -= 3;
          }
        }
      });
    }

    result.categories.parameters.score = Math.max(0, paramScore);
  }

  private generateValidationRecommendations(result: StrategyValidationResult): void {
    if (result.score < 70) {
      result.recommendations.push('Strategy needs significant improvements before testing');
    }
    
    if (result.categories.logic.score < 80) {
      result.recommendations.push('Review and improve strategy logic and conditions');
    }
    
    if (result.categories.risk.score < 80) {
      result.recommendations.push('Add comprehensive risk management rules');
    }
    
    if (result.categories.parameters.score < 80) {
      result.recommendations.push('Review and optimize strategy parameters');
    }

    if (result.warnings.length > 3) {
      result.recommendations.push('Address warning messages before production use');
    }
  }

  // Strategy Testing
  async testStrategy(configuration: StrategyTestConfiguration): Promise<StrategyTestResult> {
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    // Validate strategy first
    const validation = await this.validateStrategy(configuration.strategy);
    if (!validation.isValid) {
      throw new Error(`Strategy validation failed: ${validation.errors.join(', ')}`);
    }

    // Create test session
    const session = await this.createTestSession(testId, configuration);
    this.activeSessions.set(testId, session);

    let testResult: StrategyTestResult;

    try {
      switch (configuration.testMode) {
        case 'backtesting':
          testResult = await this.runBacktest(testId, configuration, session);
          break;
        case 'forward_testing':
          testResult = await this.runForwardTest(testId, configuration, session);
          break;
        case 'live_simulation':
          testResult = await this.runLiveSimulation(testId, configuration, session);
          break;
        default:
          throw new Error(`Unsupported test mode: ${configuration.testMode}`);
      }

      testResult.endTime = new Date();
      testResult.duration = testResult.endTime.getTime() - startTime.getTime();
      
      // Generate recommendations
      testResult.recommendations = this.generateTestRecommendations(testResult);
      
      // Determine if test passed
      testResult.passed = this.evaluateTestSuccess(testResult, configuration);

    } catch (error) {
      testResult = this.createFailedTestResult(testId, configuration, startTime, error);
    } finally {
      this.activeSessions.delete(testId);
    }

    return testResult;
  }

  private async createTestSession(
    testId: string,
    configuration: StrategyTestConfiguration
  ): Promise<AgentPaperTradingSession> {
    // Create a dedicated paper trading account for testing
    const testAccountConfig: AgentPaperTradingConfig = {
      initial_balance: configuration.initialBalance,
      max_drawdown_percent: configuration.riskLimits.maxDrawdown,
      max_position_size_percent: configuration.riskLimits.maxPositionSize,
      max_daily_trades: 100, // High limit for testing
      allowed_symbols: configuration.testSymbols,
      risk_tolerance: 'moderate',
      strategy_types: [configuration.strategy.strategy_type],
      auto_stop_loss: true,
      auto_take_profit: false
    };

    await this.paperTradingManager.createPaperTradingAccount(
      testAccountConfig,
      `test-account-${testId}`
    );

    return {
      session_id: testId,
      agent_id: this.agentId,
      account_id: `test-account-${testId}`,
      start_time: new Date(),
      session_type: 'strategy_test',
      initial_balance: configuration.initialBalance,
      total_trades: 0,
      strategies_used: [configuration.strategy.strategy_id],
      status: 'active'
    };
  }

  private async runBacktest(
    testId: string,
    configuration: StrategyTestConfiguration,
    session: AgentPaperTradingSession
  ): Promise<StrategyTestResult> {
    // Generate historical market data
    const historicalData = await this.generateHistoricalData(
      configuration.testSymbols,
      configuration.testDuration
    );

    const tradingActivity = {
      orders: [] as any[],
      positions: [] as any[],
      fills: [] as any[],
      signals: [] as any[]
    };

    let currentBalance = configuration.initialBalance;
    let maxDrawdown = 0;
    let peakValue = currentBalance;

    // Simulate trading over historical data
    for (const dataPoint of historicalData) {
      const context = {
        marketData: dataPoint,
        portfolioValue: currentBalance,
        availableCash: currentBalance * 0.8, // Assume 80% available
        currentPositions: tradingActivity.positions,
        riskMetrics: {},
        marketSentiment: 'neutral'
      };

      // Execute strategy
      const execution = await this.executor.executeStrategy(configuration.strategy, context);
      
      // Simulate order fills and update positions
      for (const order of execution.orders) {
        const fill = this.simulateOrderFill(order, dataPoint);
        tradingActivity.orders.push(order);
        tradingActivity.fills.push(fill);
        
        // Update balance (simplified)
        const orderValue = order.quantity * dataPoint.close;
        currentBalance += order.side === 'sell' ? orderValue : -orderValue;
      }

      // Track drawdown
      if (currentBalance > peakValue) {
        peakValue = currentBalance;
      }
      const drawdown = (peakValue - currentBalance) / peakValue;
      maxDrawdown = Math.max(maxDrawdown, drawdown);

      // Check stop conditions
      if (configuration.riskLimits.stopTestOnLoss && drawdown > configuration.riskLimits.maxDrawdown / 100) {
        break;
      }
    }

    // Calculate performance metrics
    const totalReturn = (currentBalance - configuration.initialBalance) / configuration.initialBalance;
    const performance = this.calculatePerformanceMetrics(
      tradingActivity,
      configuration.initialBalance,
      currentBalance,
      maxDrawdown
    );

    return {
      testId,
      strategy: configuration.strategy,
      configuration,
      startTime: session.start_time,
      endTime: new Date(),
      duration: 0, // Will be set later
      performance,
      riskMetrics: this.calculateRiskMetrics(tradingActivity, historicalData),
      tradingActivity,
      marketConditions: this.analyzeMarketConditions(historicalData),
      recommendations: { // Will be set later
        overall: 'fair',
        strengths: [],
        weaknesses: [],
        improvements: [],
        nextSteps: []
      },
      passed: false // Will be set later
    };
  }

  private async runForwardTest(
    testId: string,
    configuration: StrategyTestConfiguration,
    session: AgentPaperTradingSession
  ): Promise<StrategyTestResult> {
    // Forward testing uses live market data but with paper trading
    // This is a simplified implementation
    return this.runLiveSimulation(testId, configuration, session);
  }

  private async runLiveSimulation(
    testId: string,
    configuration: StrategyTestConfiguration,
    session: AgentPaperTradingSession
  ): Promise<StrategyTestResult> {
    const tradingActivity = {
      orders: [] as any[],
      positions: [] as any[],
      fills: [] as any[],
      signals: [] as any[]
    };

    const startBalance = configuration.initialBalance;
    let currentBalance = startBalance;
    let tradeCount = 0;
    const maxTrades = 10; // Limit for demo

    // Simulate live trading for a shorter period
    const testDurationMs = Math.min(configuration.testDuration, 60000); // Max 1 minute for demo
    const startTime = Date.now();
    
    while (Date.now() - startTime < testDurationMs && tradeCount < maxTrades) {
      // Generate mock market data
      const marketData = this.generateMockMarketData(configuration.testSymbols[0]);
      
      const context = {
        marketData,
        portfolioValue: currentBalance,
        availableCash: currentBalance * 0.8,
        currentPositions: tradingActivity.positions,
        riskMetrics: {},
        marketSentiment: 'neutral'
      };

      try {
        // Execute strategy
        const execution = await this.executor.executeStrategy(configuration.strategy, context);
        
        // Process any generated orders
        for (const order of execution.orders) {
          tradingActivity.orders.push(order);
          tradeCount++;
          
          // Simulate immediate fill for demo
          const fill = this.simulateOrderFill(order, marketData);
          tradingActivity.fills.push(fill);
          
          // Update balance
          const orderValue = order.quantity * marketData.close;
          currentBalance += order.side === 'sell' ? orderValue : -orderValue;
        }
      } catch (error) {
        console.error('Error during live simulation:', error);
      }

      // Wait a bit before next iteration
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate final metrics
    const totalReturn = (currentBalance - startBalance) / startBalance;
    const performance = this.calculatePerformanceMetrics(
      tradingActivity,
      startBalance,
      currentBalance,
      0.05 // Assume max 5% drawdown for demo
    );

    return {
      testId,
      strategy: configuration.strategy,
      configuration,
      startTime: session.start_time,
      endTime: new Date(),
      duration: 0,
      performance,
      riskMetrics: {
        volatility: 0.15,
        var95: 0.05,
        expectedShortfall: 0.08,
        betaToMarket: 1.0,
        correlationToMarket: 0.7
      },
      tradingActivity,
      marketConditions: {
        avgVolatility: 0.15,
        trendDirection: 'neutral',
        marketRegime: 'normal',
        correlations: {}
      },
      recommendations: {
        overall: 'fair',
        strengths: [],
        weaknesses: [],
        improvements: [],
        nextSteps: []
      },
      passed: false
    };
  }

  // Helper Methods
  private generateMockMarketData(symbol: string): MarketData {
    const basePrice = 100;
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const price = basePrice * (1 + change);

    return {
      symbol,
      timestamp: new Date(),
      open: price * 0.999,
      high: price * 1.002,
      low: price * 0.998,
      close: price,
      volume: Math.floor(Math.random() * 1000000),
      source: 'mock',
      quality: 'good'
    };
  }

  private async generateHistoricalData(symbols: string[], duration: number): Promise<MarketData[]> {
    const data: MarketData[] = [];
    const dataPoints = Math.min(100, Math.floor(duration / 60000)); // One point per minute, max 100
    
    for (let i = 0; i < dataPoints; i++) {
      for (const symbol of symbols) {
        data.push(this.generateMockMarketData(symbol));
      }
    }
    
    return data;
  }

  private simulateOrderFill(order: any, marketData: MarketData): any {
    return {
      fill_id: `fill-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      order_id: `order-${Date.now()}`,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: marketData.close,
      timestamp: new Date(),
      commission: order.quantity * 0.001 // 0.1% commission
    };
  }

  private calculatePerformanceMetrics(
    tradingActivity: any,
    initialBalance: number,
    finalBalance: number,
    maxDrawdown: number
  ): any {
    const totalReturn = (finalBalance - initialBalance) / initialBalance;
    const totalTrades = tradingActivity.orders.length;
    const winningTrades = tradingActivity.fills.filter((fill: any) => 
      (fill.side === 'sell' && fill.price > 100) || (fill.side === 'buy' && fill.price < 100)
    ).length;

    return {
      totalReturn,
      annualizedReturn: totalReturn * 365 / 30, // Assume 30-day test
      maxDrawdown,
      sharpeRatio: totalReturn / 0.15, // Simplified
      winRate: totalTrades > 0 ? winningTrades / totalTrades : 0,
      totalTrades,
      avgTradeReturn: totalTrades > 0 ? totalReturn / totalTrades : 0,
      bestTrade: 0.05, // Mock
      worstTrade: -0.03, // Mock
      profitFactor: 1.2 // Mock
    };
  }

  private calculateRiskMetrics(tradingActivity: any, marketData: MarketData[]): any {
    return {
      volatility: 0.15,
      var95: 0.05,
      expectedShortfall: 0.08,
      betaToMarket: 1.0,
      correlationToMarket: 0.7
    };
  }

  private analyzeMarketConditions(marketData: MarketData[]): any {
    return {
      avgVolatility: 0.15,
      trendDirection: 'neutral',
      marketRegime: 'normal',
      correlations: {}
    };
  }

  private generateTestRecommendations(result: StrategyTestResult): any {
    const recommendations = {
      overall: 'fair' as const,
      strengths: [] as string[],
      weaknesses: [] as string[],
      improvements: [] as string[],
      nextSteps: [] as string[]
    };

    // Analyze performance
    if (result.performance.totalReturn > 0.1) {
      recommendations.strengths.push('Strong positive returns');
      recommendations.overall = 'good';
    } else if (result.performance.totalReturn < -0.05) {
      recommendations.weaknesses.push('Negative returns');
      recommendations.improvements.push('Review entry and exit criteria');
    }

    if (result.performance.winRate > 0.6) {
      recommendations.strengths.push('High win rate');
    } else if (result.performance.winRate < 0.4) {
      recommendations.weaknesses.push('Low win rate');
      recommendations.improvements.push('Improve signal quality');
    }

    if (result.performance.maxDrawdown > 0.2) {
      recommendations.weaknesses.push('High maximum drawdown');
      recommendations.improvements.push('Implement tighter risk controls');
    }

    // Next steps
    if (result.performance.totalReturn > 0.05 && result.performance.maxDrawdown < 0.15) {
      recommendations.nextSteps.push('Consider live trading with small position sizes');
      recommendations.overall = 'good';
    } else {
      recommendations.nextSteps.push('Optimize parameters and retest');
    }

    if (result.performance.totalTrades < 5) {
      recommendations.nextSteps.push('Run longer test to gather more data');
    }

    return recommendations;
  }

  private evaluateTestSuccess(result: StrategyTestResult, configuration: StrategyTestConfiguration): boolean {
    // Define success criteria
    const criteria = {
      minReturn: 0.02, // 2% minimum return
      maxDrawdown: configuration.riskLimits.maxDrawdown / 100,
      minWinRate: 0.4,
      minTrades: 3
    };

    return (
      result.performance.totalReturn >= criteria.minReturn &&
      result.performance.maxDrawdown <= criteria.maxDrawdown &&
      result.performance.winRate >= criteria.minWinRate &&
      result.performance.totalTrades >= criteria.minTrades
    );
  }

  private createFailedTestResult(
    testId: string,
    configuration: StrategyTestConfiguration,
    startTime: Date,
    error: any
  ): StrategyTestResult {
    return {
      testId,
      strategy: configuration.strategy,
      configuration,
      startTime,
      endTime: new Date(),
      duration: Date.now() - startTime.getTime(),
      performance: {
        totalReturn: 0,
        annualizedReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        winRate: 0,
        totalTrades: 0,
        avgTradeReturn: 0,
        bestTrade: 0,
        worstTrade: 0,
        profitFactor: 0
      },
      riskMetrics: {
        volatility: 0,
        var95: 0,
        expectedShortfall: 0,
        betaToMarket: 0,
        correlationToMarket: 0
      },
      tradingActivity: {
        orders: [],
        positions: [],
        fills: [],
        signals: []
      },
      marketConditions: {
        avgVolatility: 0,
        trendDirection: 'unknown',
        marketRegime: 'unknown',
        correlations: {}
      },
      recommendations: {
        overall: 'dangerous',
        strengths: [],
        weaknesses: ['Test failed to complete'],
        improvements: ['Fix strategy implementation errors'],
        nextSteps: ['Debug and retest strategy']
      },
      passed: false,
      failureReasons: [error instanceof Error ? error.message : 'Unknown error']
    };
  }

  // Public API Methods
  async quickTest(strategy: AgentPaperTradingStrategy, symbols: string[] = ['BTC/USD']): Promise<StrategyTestResult> {
    const config: StrategyTestConfiguration = {
      strategy,
      testDuration: 300000, // 5 minutes
      initialBalance: 10000,
      testSymbols: symbols,
      testMode: 'live_simulation',
      marketDataSource: 'mock',
      riskLimits: {
        maxDrawdown: 10,
        maxPositionSize: 25,
        stopTestOnLoss: true
      }
    };

    return this.testStrategy(config);
  }

  async getActiveTests(): Promise<AgentPaperTradingSession[]> {
    return Array.from(this.activeSessions.values());
  }

  async stopTest(testId: string): Promise<boolean> {
    const session = this.activeSessions.get(testId);
    if (session) {
      session.status = 'terminated';
      this.activeSessions.delete(testId);
      return true;
    }
    return false;
  }
}

// Factory function
export function createPaperTradingStrategyTester(agentId: string): PaperTradingStrategyTester {
  return new PaperTradingStrategyTester(agentId);
}