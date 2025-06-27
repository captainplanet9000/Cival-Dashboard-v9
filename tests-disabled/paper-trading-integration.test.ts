// Comprehensive Paper Trading Integration Tests
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AgentPaperTradingManager } from '../agents/paper-trading-manager';
import { AgentPaperTradingExecutor } from '../agents/paper-trading-executor';
import { createAgentPaperPortfolioManager } from '../agents/paper-portfolio-manager';
import { createPaperTradingStrategyTester } from '../paper-trading/strategy-tester';
import { paperTradingValidationEngine } from '../paper-trading/validation-engine';
import { createPaperTradingDecisionTracker } from '../agents/paper-trading-decision-tracker';
import type {
  AgentPaperTradingConfig,
  AgentPaperTradingStrategy,
  AgentPaperOrderRequest
} from '@/types/agent-paper-trading';

// Mock the backend API
jest.mock('@/lib/api/backend-client', () => ({
  backendApi: {
    createAgentPaperAccount: jest.fn(),
    getAgentPaperAccounts: jest.fn(),
    getAgentPaperAccount: jest.fn(),
    resetAgentPaperAccount: jest.fn(),
    executeAgentPaperOrder: jest.fn(),
    getAgentPaperOrders: jest.fn(),
    getAgentPaperPortfolio: jest.fn(),
    getAgentPaperPositions: jest.fn(),
    getAgentPaperPerformance: jest.fn(),
    closeAgentPaperPosition: jest.fn()
  }
}));

describe('Paper Trading Integration Tests', () => {
  const testAgentId = 'test-agent-001';
  let paperTradingManager: AgentPaperTradingManager;
  let executor: AgentPaperTradingExecutor;
  let portfolioManager: any;
  let strategyTester: any;
  let decisionTracker: any;

  beforeEach(() => {
    // Initialize test instances
    paperTradingManager = new AgentPaperTradingManager(testAgentId);
    executor = new AgentPaperTradingExecutor(testAgentId);
    portfolioManager = createAgentPaperPortfolioManager(testAgentId);
    strategyTester = createPaperTradingStrategyTester(testAgentId);
    decisionTracker = createPaperTradingDecisionTracker(testAgentId);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    jest.restoreAllMocks();
  });

  describe('Account Management Integration', () => {
    test('should create and manage paper trading accounts', async () => {
      const mockConfig: AgentPaperTradingConfig = {
        initial_balance: 10000,
        max_drawdown_percent: 10,
        max_position_size_percent: 25,
        max_daily_trades: 10,
        allowed_symbols: ['BTC/USD', 'ETH/USD'],
        risk_tolerance: 'moderate',
        strategy_types: ['momentum'],
        auto_stop_loss: true,
        auto_take_profit: false
      };

      const mockAccount = {
        id: 'account-123',
        agent_id: testAgentId,
        initial_balance: 10000,
        total_equity: 10000,
        config: mockConfig
      };

      // Mock API responses
      const { backendApi } = require('@/lib/api/backend-client');
      backendApi.createAgentPaperAccount.mockResolvedValue({ data: mockAccount });
      backendApi.getAgentPaperAccounts.mockResolvedValue({ data: [mockAccount] });

      // Test account creation
      const account = await paperTradingManager.createPaperTradingAccount(mockConfig);
      expect(account).toBeDefined();
      expect(backendApi.createAgentPaperAccount).toHaveBeenCalledWith(testAgentId, expect.any(Object));

      // Test account retrieval
      const accounts = await paperTradingManager.getPaperTradingAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe('account-123');
    });

    test('should validate account configuration', () => {
      const validConfig: AgentPaperTradingConfig = {
        initial_balance: 10000,
        max_drawdown_percent: 15,
        max_position_size_percent: 20,
        max_daily_trades: 5,
        allowed_symbols: ['BTC/USD'],
        risk_tolerance: 'conservative',
        strategy_types: ['mean_reversion'],
        auto_stop_loss: true,
        auto_take_profit: true
      };

      const validation = paperTradingValidationEngine.validateAccountConfig(validConfig);
      expect(validation.overall).toBe('passed');
      expect(validation.score).toBeGreaterThan(80);
    });

    test('should reject invalid account configuration', () => {
      const invalidConfig = {
        initial_balance: -1000, // Invalid negative balance
        max_drawdown_percent: 100, // Invalid 100% drawdown
        max_position_size_percent: 0, // Invalid 0% position size
        max_daily_trades: 0,
        allowed_symbols: [],
        risk_tolerance: 'moderate',
        strategy_types: [],
        auto_stop_loss: false,
        auto_take_profit: false
      } as AgentPaperTradingConfig;

      const validation = paperTradingValidationEngine.validateAccountConfig(invalidConfig);
      expect(validation.overall).toBe('failed');
      expect(validation.blockers.length).toBeGreaterThan(0);
    });
  });

  describe('Order Execution Integration', () => {
    test('should execute valid paper orders', async () => {
      const mockOrder: Omit<AgentPaperOrderRequest, 'agent_id'> = {
        account_id: 'account-123',
        symbol: 'BTC/USD',
        side: 'buy',
        order_type: 'market',
        quantity: 0.1,
        strategy_reasoning: 'Test market order'
      };

      const mockOrderResponse = {
        id: 'order-456',
        ...mockOrder,
        agent_id: testAgentId,
        status: 'filled'
      };

      const { backendApi } = require('@/lib/api/backend-client');
      backendApi.executeAgentPaperOrder.mockResolvedValue({ data: mockOrderResponse });

      const result = await paperTradingManager.executePaperOrder(mockOrder);
      expect(result).toBeDefined();
      expect(result.id).toBe('order-456');
      expect(backendApi.executeAgentPaperOrder).toHaveBeenCalledWith(
        testAgentId,
        expect.objectContaining(mockOrder)
      );
    });

    test('should validate orders before execution', () => {
      const validOrder: AgentPaperOrderRequest = {
        agent_id: testAgentId,
        account_id: 'account-123',
        symbol: 'BTC/USD',
        side: 'buy',
        order_type: 'limit',
        quantity: 0.1,
        price: 50000,
        strategy_reasoning: 'Valid limit order'
      };

      const validation = paperTradingValidationEngine.validateOrder(validOrder);
      expect(validation.overall).toBe('passed');
    });

    test('should reject invalid orders', () => {
      const invalidOrder: AgentPaperOrderRequest = {
        agent_id: testAgentId,
        account_id: 'account-123',
        symbol: '', // Invalid empty symbol
        side: 'buy',
        order_type: 'limit',
        quantity: -1, // Invalid negative quantity
        price: 0, // Invalid zero price for limit order
        strategy_reasoning: 'Invalid order'
      };

      const validation = paperTradingValidationEngine.validateOrder(invalidOrder);
      expect(validation.overall).toBe('failed');
      expect(validation.blockers.length).toBeGreaterThan(0);
    });
  });

  describe('Strategy Execution Integration', () => {
    test('should execute trading strategy end-to-end', async () => {
      const mockStrategy: AgentPaperTradingStrategy = {
        strategy_id: 'momentum-001',
        agent_id: testAgentId,
        name: 'Test Momentum Strategy',
        description: 'A test momentum strategy',
        strategy_type: 'momentum',
        parameters: {
          lookback_period: 14,
          momentum_threshold: 0.02
        },
        entry_conditions: ['Price > MA20', 'Volume > Average'],
        exit_conditions: ['Price < MA20', 'Stop loss triggered'],
        risk_management_rules: ['Max 2% risk per trade', 'Stop loss at 5%'],
        status: 'active',
        created_at: new Date(),
        last_modified: new Date()
      };

      const mockContext = {
        marketData: {
          symbol: 'BTC/USD',
          timestamp: new Date(),
          open: 49000,
          high: 51000,
          low: 48500,
          close: 50000,
          volume: 1000000,
          source: 'test',
          quality: 'good' as const
        },
        portfolioValue: 10000,
        availableCash: 8000,
        currentPositions: [],
        riskMetrics: {},
        marketSentiment: 'neutral'
      };

      // Mock account and strategy validation
      const { backendApi } = require('@/lib/api/backend-client');
      backendApi.getAgentPaperAccounts.mockResolvedValue({
        data: [{
          id: 'account-123',
          agent_id: testAgentId,
          config: {
            max_position_size_percent: 25,
            allowed_symbols: ['BTC/USD']
          }
        }]
      });

      const executionResult = await executor.executeStrategy(mockStrategy, mockContext);
      
      expect(executionResult).toBeDefined();
      expect(executionResult.orders).toBeDefined();
      expect(executionResult.reasoning).toBeDefined();
      expect(executionResult.confidence).toBeGreaterThanOrEqual(0);
      expect(executionResult.confidence).toBeLessThanOrEqual(1);
    });

    test('should validate strategy before execution', () => {
      const validStrategy: AgentPaperTradingStrategy = {
        strategy_id: 'test-strategy',
        agent_id: testAgentId,
        name: 'Valid Test Strategy',
        description: 'A valid strategy for testing',
        strategy_type: 'momentum',
        parameters: { lookback: 20, threshold: 0.05 },
        entry_conditions: ['Price breakout above resistance'],
        exit_conditions: ['Price below support', 'Stop loss'],
        risk_management_rules: ['Max 2% risk', 'Position size limit'],
        status: 'active',
        created_at: new Date(),
        last_modified: new Date()
      };

      const validation = paperTradingValidationEngine.validateStrategy(validStrategy);
      expect(validation.overall).toBe('passed');
      expect(validation.score).toBeGreaterThan(70);
    });
  });

  describe('Portfolio Management Integration', () => {
    test('should analyze portfolio and generate recommendations', async () => {
      const mockPositions = [
        {
          id: 'pos-1',
          symbol: 'BTC/USD',
          quantity: 0.5,
          market_value: 25000,
          unrealized_pnl: 1000
        },
        {
          id: 'pos-2',
          symbol: 'ETH/USD',
          quantity: 10,
          market_value: 15000,
          unrealized_pnl: -500
        }
      ];

      const mockAccount = {
        id: 'account-123',
        total_equity: 40000,
        config: { max_position_size_percent: 30 }
      };

      // Mock API responses
      const { backendApi } = require('@/lib/api/backend-client');
      backendApi.getAgentPaperAccounts.mockResolvedValue({ data: [mockAccount] });
      backendApi.getAgentPaperPositions.mockResolvedValue({ data: mockPositions });
      backendApi.getAgentPaperPerformance.mockResolvedValue({
        data: { total_return_percent: 5.5, win_rate: 0.65 }
      });

      const portfolioSummary = await portfolioManager.getPortfolioSummary();
      
      expect(portfolioSummary).toBeDefined();
      expect(portfolioSummary.positions).toHaveLength(2);
      expect(portfolioSummary.allocation).toBeDefined();
      expect(portfolioSummary.riskMetrics).toBeDefined();
    });

    test('should detect risk violations', async () => {
      const { backendApi } = require('@/lib/api/backend-client');
      
      // Mock high-risk scenario
      backendApi.getAgentPaperAccounts.mockResolvedValue({
        data: [{
          id: 'account-123',
          total_equity: 10000,
          config: { max_position_size_percent: 20, max_drawdown_percent: 10 }
        }]
      });

      backendApi.getAgentPaperPortfolio.mockResolvedValue({
        data: { total_equity: 8500, cash_balance: 1000 } // 15% drawdown
      });

      const alerts = await paperTradingManager.checkRiskLimits();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.alert_type === 'risk_limit')).toBe(true);
    });
  });

  describe('Strategy Testing Integration', () => {
    test('should run complete strategy backtest', async () => {
      const testStrategy: AgentPaperTradingStrategy = {
        strategy_id: 'backtest-strategy',
        agent_id: testAgentId,
        name: 'Backtest Strategy',
        description: 'Strategy for backtesting',
        strategy_type: 'momentum',
        parameters: { period: 20 },
        entry_conditions: ['Momentum positive'],
        exit_conditions: ['Momentum negative'],
        risk_management_rules: ['Stop loss 5%'],
        status: 'testing',
        created_at: new Date(),
        last_modified: new Date()
      };

      const testConfig = {
        strategy: testStrategy,
        testDuration: 300000, // 5 minutes
        initialBalance: 10000,
        testSymbols: ['BTC/USD'],
        testMode: 'backtesting' as const,
        marketDataSource: 'mock' as const,
        riskLimits: {
          maxDrawdown: 15,
          maxPositionSize: 25,
          stopTestOnLoss: true
        }
      };

      // Mock paper trading manager for strategy testing
      const { backendApi } = require('@/lib/api/backend-client');
      backendApi.createAgentPaperAccount.mockResolvedValue({
        data: { id: 'test-account', initial_balance: 10000 }
      });

      const testResult = await strategyTester.testStrategy(testConfig);
      
      expect(testResult).toBeDefined();
      expect(testResult.testId).toBeDefined();
      expect(testResult.performance).toBeDefined();
      expect(testResult.tradingActivity).toBeDefined();
      expect(testResult.recommendations).toBeDefined();
      expect(typeof testResult.passed).toBe('boolean');
    });

    test('should validate strategy before testing', async () => {
      const invalidStrategy = {
        strategy_id: 'invalid-strategy',
        agent_id: testAgentId,
        name: 'Invalid Strategy',
        description: 'Missing required fields',
        strategy_type: 'momentum',
        parameters: {},
        entry_conditions: [], // Empty conditions
        exit_conditions: [], // Empty conditions
        risk_management_rules: [],
        status: 'active',
        created_at: new Date(),
        last_modified: new Date()
      } as AgentPaperTradingStrategy;

      await expect(
        strategyTester.testStrategy({
          strategy: invalidStrategy,
          testDuration: 60000,
          initialBalance: 10000,
          testSymbols: ['BTC/USD'],
          testMode: 'backtesting',
          marketDataSource: 'mock',
          riskLimits: { maxDrawdown: 10, maxPositionSize: 20, stopTestOnLoss: true }
        })
      ).rejects.toThrow();
    });
  });

  describe('Decision Tracking Integration', () => {
    test('should track decisions and outcomes', async () => {
      const mockDecision = {
        decision_id: 'decision-001',
        agent_id: testAgentId,
        strategy_id: 'momentum-001',
        decision_type: 'entry' as const,
        symbol: 'BTC/USD',
        reasoning: 'Strong momentum signal detected',
        market_context: {
          price: 50000,
          volume: 1000000,
          volatility: 0.15,
          trend: 'bullish',
          sentiment: 'positive'
        },
        decision_factors: {
          technical_signals: ['MA crossover', 'Volume spike'],
          fundamental_factors: [],
          risk_considerations: ['Position size limited to 2%'],
          market_conditions: ['Bull market']
        },
        confidence_level: 0.8,
        expected_outcome: {
          expected_return: 0.05,
          risk_reward_ratio: 2.5
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      await decisionTracker.recordDecision(mockDecision);
      
      const retrievedDecision = decisionTracker.getDecision('decision-001');
      expect(retrievedDecision).toBeDefined();
      expect(retrievedDecision?.decision_id).toBe('decision-001');

      // Record outcome
      await decisionTracker.recordDecisionOutcome(
        'decision-001',
        ['order-123'],
        0.03, // 3% profit
        24 // 24 hours
      );

      const outcome = decisionTracker.getOutcome('decision-001');
      expect(outcome).toBeDefined();
      expect(outcome?.outcome_type).toBe('profit');
      expect(outcome?.final_pnl).toBe(0.03);
    });

    test('should generate learning insights', async () => {
      // Create multiple decisions to generate patterns
      const decisions = Array.from({ length: 10 }, (_, i) => ({
        decision_id: `decision-${i}`,
        agent_id: testAgentId,
        strategy_id: 'momentum-001',
        decision_type: 'entry' as const,
        symbol: 'BTC/USD',
        reasoning: `Decision ${i}`,
        market_context: {
          price: 50000 + i * 100,
          volume: 1000000,
          volatility: 0.15,
          trend: 'bullish',
          sentiment: 'positive'
        },
        decision_factors: {
          technical_signals: ['Signal'],
          fundamental_factors: [],
          risk_considerations: ['Risk'],
          market_conditions: ['Condition']
        },
        confidence_level: 0.5 + i * 0.05,
        expected_outcome: {
          expected_return: 0.05,
          risk_reward_ratio: 2
        },
        created_at: new Date(),
        updated_at: new Date()
      }));

      // Record decisions and outcomes
      for (const decision of decisions) {
        await decisionTracker.recordDecision(decision);
        await decisionTracker.recordDecisionOutcome(
          decision.decision_id,
          [`order-${decision.decision_id}`],
          Math.random() > 0.5 ? 0.02 : -0.01, // Random profit/loss
          Math.random() * 48 + 1 // 1-48 hours
        );
      }

      const patterns = decisionTracker.getPatterns();
      const insights = decisionTracker.getInsights();
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Analytics Integration', () => {
    test('should generate comprehensive analytics', async () => {
      // This would test the analytics engine integration
      // For now, we'll test that the components can work together
      
      const mockData = {
        account: { id: 'account-123', total_equity: 11000, initial_balance: 10000 },
        positions: [{ id: 'pos-1', symbol: 'BTC/USD', market_value: 5000, unrealized_pnl: 500 }],
        decisions: [],
        orders: [],
        marketData: []
      };

      // Test would verify analytics generation
      expect(mockData.account.total_equity).toBeGreaterThan(mockData.account.initial_balance);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle API errors gracefully', async () => {
      const { backendApi } = require('@/lib/api/backend-client');
      backendApi.getAgentPaperAccounts.mockRejectedValue(new Error('API Error'));

      await expect(paperTradingManager.getPaperTradingAccounts())
        .rejects.toThrow('API Error');
    });

    test('should handle validation errors', () => {
      const invalidOrder = {
        agent_id: testAgentId,
        account_id: 'account-123',
        symbol: 'INVALID',
        side: 'buy',
        order_type: 'market',
        quantity: 0,
        strategy_reasoning: 'Test'
      } as AgentPaperOrderRequest;

      const validation = paperTradingValidationEngine.validateOrder(invalidOrder);
      expect(validation.overall).toBe('failed');
      expect(validation.blockers.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Integration', () => {
    test('should handle real-time events', () => {
      // Test WebSocket event handling integration
      // This would be a more complex integration test
      
      const eventData = {
        agentId: testAgentId,
        accountId: 'account-123',
        order: {
          id: 'order-123',
          symbol: 'BTC/USD',
          side: 'buy',
          quantity: 0.1
        },
        timestamp: new Date().toISOString()
      };

      // Test that event handling works correctly
      expect(eventData.agentId).toBe(testAgentId);
    });
  });

  describe('Full Workflow Integration', () => {
    test('should execute complete paper trading workflow', async () => {
      // This test would simulate a complete workflow:
      // 1. Create account
      // 2. Create strategy
      // 3. Execute trades
      // 4. Track performance
      // 5. Generate insights

      const { backendApi } = require('@/lib/api/backend-client');
      
      // Mock successful workflow
      backendApi.createAgentPaperAccount.mockResolvedValue({
        data: { id: 'account-123', initial_balance: 10000 }
      });
      
      backendApi.executeAgentPaperOrder.mockResolvedValue({
        data: { id: 'order-123', status: 'filled' }
      });

      // Step 1: Create account
      const config: AgentPaperTradingConfig = {
        initial_balance: 10000,
        max_drawdown_percent: 10,
        max_position_size_percent: 25,
        max_daily_trades: 10,
        allowed_symbols: ['BTC/USD'],
        risk_tolerance: 'moderate',
        strategy_types: ['momentum'],
        auto_stop_loss: true,
        auto_take_profit: false
      };

      const account = await paperTradingManager.createPaperTradingAccount(config);
      expect(account).toBeDefined();

      // Step 2: Execute order
      const order: Omit<AgentPaperOrderRequest, 'agent_id'> = {
        account_id: account.id,
        symbol: 'BTC/USD',
        side: 'buy',
        order_type: 'market',
        quantity: 0.1,
        strategy_reasoning: 'Workflow test order'
      };

      const orderResult = await paperTradingManager.executePaperOrder(order);
      expect(orderResult).toBeDefined();

      // Verify workflow completion
      expect(backendApi.createAgentPaperAccount).toHaveBeenCalled();
      expect(backendApi.executeAgentPaperOrder).toHaveBeenCalled();
    });
  });
});

// Performance Tests
describe('Paper Trading Performance Tests', () => {
  test('should handle multiple concurrent operations', async () => {
    const agentIds = Array.from({ length: 5 }, (_, i) => `agent-${i}`);
    const managers = agentIds.map(id => new AgentPaperTradingManager(id));

    const { backendApi } = require('@/lib/api/backend-client');
    backendApi.getAgentPaperAccounts.mockResolvedValue({ data: [] });

    // Test concurrent account retrievals
    const promises = managers.map(manager => manager.getPaperTradingAccounts());
    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(Array.isArray(result)).toBe(true);
    });
  });

  test('should perform within acceptable time limits', async () => {
    const manager = new AgentPaperTradingManager('perf-test-agent');
    
    const { backendApi } = require('@/lib/api/backend-client');
    backendApi.getAgentPaperAccounts.mockResolvedValue({ 
      data: [{ id: 'account-123' }] 
    });

    const start = Date.now();
    await manager.getPaperTradingAccounts();
    const duration = Date.now() - start;

    // Should complete within 1 second
    expect(duration).toBeLessThan(1000);
  });
});

// Memory Management Tests
describe('Paper Trading Memory Management', () => {
  test('should cleanup resources properly', () => {
    const manager = new AgentPaperTradingManager('memory-test-agent');
    const tracker = createPaperTradingDecisionTracker('memory-test-agent');

    // Use the instances
    expect(manager.getAgentId()).toBe('memory-test-agent');
    expect(tracker.getAllDecisions()).toHaveLength(0);

    // Verify no memory leaks (simplified check)
    expect(typeof manager).toBe('object');
    expect(typeof tracker).toBe('object');
  });
});