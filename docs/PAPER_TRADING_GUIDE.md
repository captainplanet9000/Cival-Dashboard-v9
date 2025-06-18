# Paper Trading Agent Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Core Components](#core-components)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Topics](#advanced-topics)

## Overview

The Paper Trading Agent Integration system enables AI agents to safely practice trading strategies in a simulated environment without risking real capital. This comprehensive system provides:

- **Agent-specific paper trading accounts** with configurable risk parameters
- **Strategy development and testing** framework with validation
- **Real-time simulation** with WebSocket events
- **Portfolio management** with optimization recommendations
- **Decision tracking** with learning insights
- **Performance analytics** with comprehensive metrics
- **Risk management** with automated alerts and controls

### Key Benefits

✅ **Safe Learning Environment** - Test strategies without financial risk  
✅ **Comprehensive Analytics** - Track performance and identify improvement areas  
✅ **Real-time Simulation** - Practice with live market-like conditions  
✅ **Agent Collaboration** - Multi-agent coordination and consensus  
✅ **Automated Risk Management** - Built-in safeguards and alerts  
✅ **Decision Intelligence** - Learn from outcomes and patterns  

## Quick Start

### 1. Basic Setup

```typescript
import { AgentPaperTradingManager, AGENT_PAPER_TRADING_CONFIGS } from '@/lib/agents/paper-trading-manager';

// Initialize for your agent
const agentId = 'my-trading-agent';
const paperTradingManager = new AgentPaperTradingManager(agentId);

// Create account with conservative settings
const account = await paperTradingManager.createPaperTradingAccount(
  AGENT_PAPER_TRADING_CONFIGS.conservative,
  'My Agent Paper Account'
);

console.log('Account created:', account.id);
```

### 2. Execute Your First Trade

```typescript
// Place a market order
const order = await paperTradingManager.executePaperOrder({
  account_id: account.id,
  symbol: 'BTC/USD',
  side: 'buy',
  order_type: 'market',
  quantity: 0.01,
  strategy_reasoning: 'My first paper trade'
});

console.log('Order executed:', order.id);
```

### 3. Check Performance

```typescript
// Get performance metrics
const performance = await paperTradingManager.getPerformanceMetrics();
console.log('Total return:', performance.total_return_percent + '%');
console.log('Win rate:', (performance.win_rate * 100) + '%');
```

## Core Components

### 1. AgentPaperTradingManager

The central component for managing paper trading accounts and orders.

```typescript
class AgentPaperTradingManager {
  // Account management
  async createPaperTradingAccount(config, name?): Promise<AgentPaperTradingAccount>
  async getPaperTradingAccounts(): Promise<AgentPaperTradingAccount[]>
  async resetPaperTradingAccount(accountId): Promise<AgentPaperTradingAccount>
  
  // Trading operations
  async executePaperOrder(orderRequest): Promise<Order>
  async getPaperOrders(filters?): Promise<Order[]>
  async getPaperPositions(accountId?): Promise<Position[]>
  async closePaperPosition(positionId, quantity?): Promise<any>
  
  // Performance tracking
  async getPerformanceMetrics(timeRange?): Promise<PerformanceMetrics>
  async checkRiskLimits(): Promise<AgentPaperTradingAlert[]>
}
```

### 2. AgentPaperTradingExecutor

Advanced trading execution engine with strategy support.

```typescript
class AgentPaperTradingExecutor {
  // Strategy execution
  async executeStrategy(strategy, context): Promise<StrategyExecutionResult>
  
  // Direct order execution
  async executeMarketOrder(symbol, side, quantity, reasoning?): Promise<Order>
  async executeLimitOrder(symbol, side, quantity, price, reasoning?): Promise<Order>
  async closeAllPositions(reasoning?): Promise<Order[]>
}
```

### 3. AgentPaperPortfolioManager

Portfolio analysis and optimization tools.

```typescript
class AgentPaperPortfolioManager {
  // Portfolio analysis
  async getPortfolioSummary(accountId?): Promise<PortfolioSummary>
  async getPortfolioHealth(): Promise<PortfolioHealthScore>
  
  // Optimization
  async optimizePortfolio(targetAllocation?): Promise<PortfolioOptimization>
  async executeRebalancing(optimization, autoExecute?): Promise<RebalanceResult>
  
  // Performance attribution
  async getPerformanceAttribution(): Promise<PerformanceAttribution>
}
```

### 4. PaperTradingStrategyTester

Comprehensive strategy testing and validation framework.

```typescript
class PaperTradingStrategyTester {
  // Strategy validation
  async validateStrategy(strategy): Promise<StrategyValidationResult>
  
  // Testing
  async testStrategy(configuration): Promise<StrategyTestResult>
  async quickTest(strategy, symbols?): Promise<StrategyTestResult>
  
  // Active test management
  async getActiveTests(): Promise<AgentPaperTradingSession[]>
  async stopTest(testId): Promise<boolean>
}
```

### 5. PaperTradingDecisionTracker

Decision tracking and learning system.

```typescript
class PaperTradingDecisionTracker {
  // Decision recording
  async recordDecision(decision): Promise<void>
  async recordDecisionOutcome(decisionId, orders, pnl, duration): Promise<void>
  
  // Analysis
  async analyzeDecision(decisionId): Promise<DecisionAnalysis>
  getPatterns(): Promise<DecisionPattern[]>
  getInsights(): Promise<LearningInsight[]>
  
  // Performance tracking
  getPerformanceSummary(): Promise<DecisionPerformanceSummary>
}
```

## API Reference

### Configuration Types

#### AgentPaperTradingConfig
```typescript
interface AgentPaperTradingConfig {
  initial_balance: number;              // Starting account balance
  max_drawdown_percent: number;         // Maximum allowed drawdown (5-50%)
  max_position_size_percent: number;    // Maximum position size (5-50%)
  max_daily_trades: number;             // Daily trade limit (1-100)
  allowed_symbols: string[];            // Permitted trading symbols
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  strategy_types: string[];             // Allowed strategy types
  auto_stop_loss: boolean;              // Automatic stop-loss orders
  auto_take_profit: boolean;            // Automatic take-profit orders
}
```

#### Pre-configured Settings
```typescript
// Conservative agent setup
AGENT_PAPER_TRADING_CONFIGS.conservative

// Moderate risk agent setup  
AGENT_PAPER_TRADING_CONFIGS.moderate

// Aggressive trading agent setup
AGENT_PAPER_TRADING_CONFIGS.aggressive
```

### Order Types

#### AgentPaperOrderRequest
```typescript
interface AgentPaperOrderRequest {
  account_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;                       // Required for limit orders
  stop_price?: number;                  // Required for stop orders
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
```

### Strategy Definition

#### AgentPaperTradingStrategy
```typescript
interface AgentPaperTradingStrategy {
  strategy_id: string;
  agent_id: string;
  name: string;
  description: string;
  strategy_type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'pairs_trading' | 'breakout' | 'custom';
  parameters: Record<string, any>;
  entry_conditions: string[];
  exit_conditions: string[];
  risk_management_rules: string[];
  status: 'active' | 'paused' | 'testing' | 'archived';
  created_at: Date;
  last_modified: Date;
}
```

## Examples

### Example 1: Complete Agent Setup

```typescript
import { 
  AgentPaperTradingManager,
  AgentPaperTradingExecutor,
  createAgentPaperPortfolioManager,
  AGENT_PAPER_TRADING_CONFIGS 
} from '@/lib/agents/paper-trading-manager';

async function setupTradingAgent() {
  const agentId = 'momentum-agent-001';
  
  // Initialize components
  const manager = new AgentPaperTradingManager(agentId);
  const executor = new AgentPaperTradingExecutor(agentId);
  const portfolioManager = createAgentPaperPortfolioManager(agentId);
  
  // Create account
  const account = await manager.createPaperTradingAccount(
    AGENT_PAPER_TRADING_CONFIGS.moderate,
    'Momentum Trading Agent'
  );
  
  // Execute first trade
  const order = await executor.executeMarketOrder(
    'BTC/USD', 
    'buy', 
    0.1, 
    'Initial momentum position'
  );
  
  // Check portfolio health
  const health = await portfolioManager.getPortfolioHealth();
  console.log('Portfolio grade:', health.grade);
  
  return { manager, executor, portfolioManager, account };
}
```

### Example 2: Strategy Development

```typescript
import { createPaperTradingStrategyTester } from '@/lib/paper-trading/strategy-tester';

async function developMomentumStrategy() {
  const agentId = 'strategy-developer';
  const tester = createPaperTradingStrategyTester(agentId);
  
  // Define strategy
  const strategy = {
    strategy_id: 'momentum-v2',
    agent_id: agentId,
    name: 'Enhanced Momentum Strategy',
    description: 'Momentum strategy with volume confirmation',
    strategy_type: 'momentum',
    parameters: {
      lookback_period: 14,
      momentum_threshold: 0.025,
      volume_multiplier: 1.5
    },
    entry_conditions: [
      'Price momentum > threshold for lookback period',
      'Volume > 1.5x average volume',
      'Trend confirmation from multiple timeframes'
    ],
    exit_conditions: [
      'Momentum reversal detected',
      'Stop loss at 3% below entry',
      'Take profit at 6% above entry'
    ],
    risk_management_rules: [
      'Maximum 2% portfolio risk per trade',
      'Position size based on volatility',
      'No more than 3 positions per symbol class'
    ],
    status: 'testing',
    created_at: new Date(),
    last_modified: new Date()
  };
  
  // Validate strategy
  const validation = await tester.validateStrategy(strategy);
  if (!validation.isValid) {
    console.log('Validation failed:', validation.errors);
    return;
  }
  
  // Run quick test
  const testResult = await tester.quickTest(strategy, ['BTC/USD', 'ETH/USD']);
  
  console.log('Test Results:');
  console.log('- Total Return:', testResult.performance.totalReturn);
  console.log('- Win Rate:', testResult.performance.winRate);
  console.log('- Max Drawdown:', testResult.performance.maxDrawdown);
  console.log('- Passed:', testResult.passed);
  
  return testResult;
}
```

### Example 3: Real-time Trading

```typescript
import { createRealTimePaperTradingAgent } from '@/lib/agents/paper-trading-realtime';

async function setupRealTimeAgent() {
  const agentId = 'realtime-trader';
  
  // Create real-time agent with custom config
  const realTimeAgent = createRealTimePaperTradingAgent(agentId, {
    autoReconnect: true,
    eventFilters: {
      includeOwnEvents: true,
      includeOtherAgents: false,
      eventTypes: ['paper_order_filled', 'paper_position_updated', 'paper_risk_alert']
    },
    riskMonitoring: {
      enabled: true,
      checkInterval: 30000, // 30 seconds
      autoAction: true
    }
  });
  
  // Set up event handlers
  realTimeAgent.setEventHandler('order_filled', async (data) => {
    console.log(`Order filled: ${data.orderId} at ${data.fillPrice}`);
    
    // Implement post-fill logic
    if (data.fillPrice > 50000) {
      console.log('High price fill - considering take profit order');
    }
  });
  
  realTimeAgent.setEventHandler('risk_alert', async (data) => {
    console.log(`Risk alert: ${data.alert.severity} - ${data.alert.message}`);
    
    if (data.alert.severity === 'critical') {
      console.log('Critical risk detected - reducing positions');
      // Could implement automatic position reduction
    }
  });
  
  // Start real-time monitoring
  await realTimeAgent.start();
  
  return realTimeAgent;
}
```

### Example 4: Multi-Agent Coordination

```typescript
async function coordinateMultipleAgents() {
  const agents = [
    { id: 'momentum-specialist', type: 'momentum' },
    { id: 'mean-reversion-specialist', type: 'mean_reversion' },
    { id: 'risk-manager', type: 'risk_management' }
  ];
  
  const managers = agents.map(agent => ({
    agent,
    manager: new AgentPaperTradingManager(agent.id),
    executor: new AgentPaperTradingExecutor(agent.id)
  }));
  
  // Set up all agents
  for (const { agent, manager } of managers) {
    await manager.createPaperTradingAccount(
      AGENT_PAPER_TRADING_CONFIGS.moderate,
      `${agent.type} Specialist Account`
    );
  }
  
  // Coordinate decisions
  const marketData = {
    symbol: 'BTC/USD',
    close: 51000,
    volume: 1500000,
    // ... other market data
  };
  
  const recommendations = [];
  for (const { agent, executor } of managers) {
    // Get recommendation from each agent
    const strategy = createStrategyForAgent(agent);
    const context = createMarketContext(marketData);
    
    try {
      const execution = await executor.executeStrategy(strategy, context);
      recommendations.push({
        agentId: agent.id,
        confidence: execution.confidence,
        orders: execution.orders,
        reasoning: execution.reasoning
      });
    } catch (error) {
      console.log(`Agent ${agent.id} recommendation failed:`, error);
    }
  }
  
  // Implement consensus mechanism
  const consensus = analyzeConsensus(recommendations);
  if (consensus.agreement >= 0.6) {
    console.log('Consensus reached - executing coordinated trades');
    // Execute trades based on consensus
  } else {
    console.log('No consensus - maintaining current positions');
  }
  
  return recommendations;
}
```

## Best Practices

### 1. Account Configuration

**✅ DO:**
- Start with conservative settings and gradually increase risk tolerance
- Set appropriate position size limits (10-25% max per position)
- Configure reasonable drawdown limits (5-15% for learning)
- Use realistic initial balances ($10,000 - $100,000)

**❌ DON'T:**
- Use unrealistic initial balances or risk settings
- Allow unlimited position sizes or drawdowns
- Skip validation steps

### 2. Strategy Development

**✅ DO:**
- Always validate strategies before testing
- Use comprehensive entry and exit conditions
- Implement proper risk management rules
- Test strategies across different market conditions
- Document reasoning and parameters

**❌ DON'T:**
- Skip strategy validation
- Use strategies without risk management
- Over-optimize based on limited test data
- Ignore backtesting results

### 3. Risk Management

**✅ DO:**
- Monitor risk metrics continuously
- Set up automated alerts for limit breaches
- Implement stop-loss and take-profit rules
- Diversify across symbols and strategies
- Review and adjust risk parameters regularly

**❌ DON'T:**
- Ignore risk alerts
- Concentrate too much in single positions
- Trade without stop-losses
- Override risk limits frequently

### 4. Decision Tracking

**✅ DO:**
- Record all trading decisions with reasoning
- Track outcomes and learn from mistakes
- Analyze patterns in decision-making
- Use insights to improve strategies
- Document lessons learned

**❌ DON'T:**
- Trade without recording decisions
- Ignore pattern analysis
- Repeat the same mistakes
- Skip outcome tracking

### 5. Performance Analysis

**✅ DO:**
- Review performance metrics regularly
- Compare against benchmarks
- Analyze performance attribution
- Track improvement over time
- Use multiple performance measures

**❌ DON'T:**
- Focus only on returns
- Ignore risk-adjusted metrics
- Skip regular performance reviews
- Compare unrealistic timeframes

## Troubleshooting

### Common Issues

#### 1. API Connection Errors
```typescript
// Check backend connectivity
const manager = new AgentPaperTradingManager('test-agent');
try {
  const accounts = await manager.getPaperTradingAccounts();
  console.log('API connected successfully');
} catch (error) {
  console.error('API connection failed:', error.message);
  // Check NEXT_PUBLIC_API_URL environment variable
}
```

#### 2. Validation Failures
```typescript
import { paperTradingValidationEngine } from '@/lib/paper-trading/validation-engine';

// Validate order before execution
const order = { /* order data */ };
const validation = paperTradingValidationEngine.validateOrder(order);

if (!validation.isValid) {
  console.log('Validation errors:', validation.blockers);
  console.log('Quick fix:', validation.recommendations);
}
```

#### 3. Strategy Test Failures
```typescript
// Debug strategy validation
const strategy = { /* strategy definition */ };
const validation = await tester.validateStrategy(strategy);

if (!validation.isValid) {
  console.log('Strategy issues:');
  console.log('- Logic errors:', validation.categories.logic.issues);
  console.log('- Risk errors:', validation.categories.risk.issues);
  console.log('- Parameter errors:', validation.categories.parameters.issues);
}
```

#### 4. Real-time Connection Issues
```typescript
// Debug WebSocket connection
import { paperTradingEventBus } from '@/lib/websocket/paper-trading-events';

try {
  await paperTradingEventBus.connect();
  console.log('WebSocket connected');
} catch (error) {
  console.error('WebSocket connection failed:', error);
  // Check WS_URL and backend WebSocket server
}
```

### Performance Issues

#### 1. Slow API Responses
- Check backend server status
- Verify network connectivity
- Review API timeout settings
- Consider implementing caching

#### 2. Memory Usage
- Clean up unused subscriptions
- Limit decision tracking history
- Implement data pagination
- Monitor component lifecycle

#### 3. WebSocket Reconnection
- Verify auto-reconnect settings
- Check network stability
- Review server-side connection limits
- Implement connection retry logic

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `VALIDATION_FAILED` | Input validation error | Check validation messages and fix input |
| `ACCOUNT_NOT_FOUND` | Paper trading account missing | Create account first |
| `INSUFFICIENT_FUNDS` | Not enough buying power | Check account balance |
| `POSITION_LIMIT_EXCEEDED` | Position size too large | Reduce order quantity |
| `STRATEGY_INVALID` | Strategy validation failed | Fix strategy definition |
| `API_CONNECTION_FAILED` | Backend API unavailable | Check backend server status |

## Advanced Topics

### 1. Custom Strategy Types

```typescript
// Define custom strategy type
interface CustomStrategy extends AgentPaperTradingStrategy {
  strategy_type: 'custom';
  parameters: {
    custom_param_1: number;
    custom_param_2: string;
    // ... other custom parameters
  };
}

// Implement custom execution logic
class CustomStrategyExecutor extends AgentPaperTradingExecutor {
  async executeCustomStrategy(strategy: CustomStrategy, context: any) {
    // Custom strategy logic here
    return {
      orders: [],
      reasoning: 'Custom strategy execution',
      confidence: 0.5,
      riskScore: 0.3,
      expectedReturn: 0.02
    };
  }
}
```

### 2. Advanced Analytics

```typescript
import { createPaperTradingAnalyticsEngine } from '@/lib/agents/paper-trading-analytics';

async function advancedAnalysis(agentId: string) {
  const analyticsEngine = createPaperTradingAnalyticsEngine(agentId);
  
  // Get comprehensive analytics
  const analytics = await analyticsEngine.generateComprehensiveAnalytics(
    account,
    positions,
    decisions,
    orders,
    marketData
  );
  
  // Performance analytics
  console.log('Sharpe Ratio:', analytics.performance.risk_adjusted.sharpe_ratio);
  console.log('Max Drawdown:', analytics.performance.drawdown.max_drawdown);
  
  // Behavioral analysis
  console.log('Overconfidence Score:', analytics.behavior.psychological_metrics.overconfidence_bias);
  console.log('Discipline Score:', analytics.risk.behavioral_risk.discipline_score);
  
  // Strategy effectiveness
  analytics.strategy.strategy_performance.forEach(strategy => {
    console.log(`${strategy.name}: ${strategy.returns} return, ${strategy.win_rate} win rate`);
  });
  
  // Recommendations
  console.log('Performance improvements:', analytics.recommendations.performance_improvements);
  console.log('Risk adjustments:', analytics.recommendations.risk_adjustments);
  
  return analytics;
}
```

### 3. Event-Driven Architecture

```typescript
// Advanced event handling
class AdvancedEventHandler {
  constructor(agentId: string) {
    this.setupEventHandlers(agentId);
  }
  
  private setupEventHandlers(agentId: string) {
    // Order event pipeline
    paperTradingEventBus.subscribe('paper_order_filled', this.handleOrderFilled.bind(this));
    paperTradingEventBus.subscribe('paper_position_updated', this.handlePositionUpdate.bind(this));
    paperTradingEventBus.subscribe('paper_risk_alert', this.handleRiskAlert.bind(this));
    
    // Performance monitoring
    paperTradingEventBus.subscribe('paper_performance_update', this.handlePerformanceUpdate.bind(this));
    
    // Agent coordination
    paperTradingEventBus.subscribe('paper_agent_decision', this.handleAgentDecision.bind(this));
  }
  
  private async handleOrderFilled(data: any) {
    // Implement sophisticated order fill handling
    await this.updatePortfolioState(data);
    await this.checkRebalancingNeeds(data);
    await this.evaluateFollowUpOrders(data);
  }
  
  private async handleRiskAlert(data: any) {
    // Implement intelligent risk response
    if (data.alert.severity === 'critical') {
      await this.executeCrisisProtocol(data);
    } else {
      await this.adjustRiskExposure(data);
    }
  }
  
  // ... implement other handlers
}
```

### 4. Machine Learning Integration

```typescript
// Integrate ML models with paper trading
class MLEnhancedPaperTrading {
  private model: any; // Your ML model
  
  async predictMarketDirection(marketData: MarketData): Promise<number> {
    // Use ML model to predict market direction
    const features = this.extractFeatures(marketData);
    return await this.model.predict(features);
  }
  
  async optimizePositionSize(
    confidence: number,
    riskMetrics: any,
    portfolioState: any
  ): Promise<number> {
    // ML-based position sizing
    const inputs = [confidence, ...Object.values(riskMetrics)];
    return await this.model.predictOptimalSize(inputs);
  }
  
  async enhanceStrategy(
    strategy: AgentPaperTradingStrategy,
    historicalPerformance: any[]
  ): Promise<AgentPaperTradingStrategy> {
    // Use ML to optimize strategy parameters
    const optimizedParams = await this.model.optimizeParameters(
      strategy.parameters,
      historicalPerformance
    );
    
    return {
      ...strategy,
      parameters: optimizedParams
    };
  }
}
```

---

## Support and Resources

### Documentation
- [API Reference](./API_REFERENCE.md)
- [Examples Repository](../examples/)
- [Testing Guide](./TESTING_GUIDE.md)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/paper-trading)

### Updates
This system is actively developed. Check the [CHANGELOG](./CHANGELOG.md) for the latest updates and breaking changes.

---

*Last updated: December 2025*