// Paper Trading Integration Examples
// This file demonstrates how to use the paper trading system with agents

import { AgentPaperTradingManager } from '@/lib/agents/paper-trading-manager';
import { AgentPaperTradingExecutor } from '@/lib/agents/paper-trading-executor';
import { createAgentPaperPortfolioManager } from '@/lib/agents/paper-portfolio-manager';
import { createPaperTradingStrategyTester } from '@/lib/paper-trading/strategy-tester';
import { paperTradingValidationEngine } from '@/lib/paper-trading/validation-engine';
import { createRealTimePaperTradingAgent } from '@/lib/agents/paper-trading-realtime';
import { createPaperTradingDecisionTracker } from '@/lib/agents/paper-trading-decision-tracker';
import { paperTradingEventBus } from '@/lib/websocket/paper-trading-events';
import { AGENT_PAPER_TRADING_CONFIGS } from '@/lib/agents/paper-trading-manager';
import type {
  AgentPaperTradingStrategy,
  AgentPaperTradingConfig,
  AgentPaperOrderRequest
} from '@/types/agent-paper-trading';

// ============================================================================
// Example 1: Basic Agent Paper Trading Setup
// ============================================================================

export async function basicPaperTradingSetup() {
  console.log('=== Basic Paper Trading Setup Example ===');
  
  const agentId = 'demo-agent-001';
  const paperTradingManager = new AgentPaperTradingManager(agentId);

  try {
    // Step 1: Create a paper trading account with conservative settings
    console.log('Creating paper trading account...');
    const account = await paperTradingManager.createPaperTradingAccount(
      AGENT_PAPER_TRADING_CONFIGS.conservative,
      'Conservative Demo Account'
    );
    console.log('Account created:', account.id);

    // Step 2: Get account information
    const accounts = await paperTradingManager.getPaperTradingAccounts();
    console.log('Available accounts:', accounts.length);

    // Step 3: Execute a simple market order
    console.log('Placing market order...');
    const order = await paperTradingManager.executePaperOrder({
      account_id: account.id,
      symbol: 'BTC/USD',
      side: 'buy',
      order_type: 'market',
      quantity: 0.01,
      strategy_reasoning: 'Demo market order for testing'
    });
    console.log('Order executed:', order);

    // Step 4: Check portfolio status
    const portfolio = await paperTradingManager.getPaperPortfolio(account.id);
    console.log('Portfolio value:', portfolio.total_equity);

  } catch (error) {
    console.error('Error in basic setup:', error);
  }
}

// ============================================================================
// Example 2: Strategy Development and Testing
// ============================================================================

export async function strategyDevelopmentExample() {
  console.log('=== Strategy Development Example ===');
  
  const agentId = 'strategy-dev-agent';
  const strategyTester = createPaperTradingStrategyTester(agentId);

  // Define a momentum strategy
  const momentumStrategy: AgentPaperTradingStrategy = {
    strategy_id: 'momentum-v1',
    agent_id: agentId,
    name: 'Simple Momentum Strategy',
    description: 'Buys on upward momentum, sells on downward momentum',
    strategy_type: 'momentum',
    parameters: {
      lookback_period: 14,
      momentum_threshold: 0.02,
      volume_threshold: 1.5
    },
    entry_conditions: [
      'Price momentum > threshold for lookback period',
      'Volume > 1.5x average volume',
      'No existing position in symbol'
    ],
    exit_conditions: [
      'Price momentum < negative threshold',
      'Stop loss triggered at 3%',
      'Take profit at 6%'
    ],
    risk_management_rules: [
      'Maximum 2% risk per trade',
      'Stop loss at 3% below entry',
      'Position size based on volatility',
      'Maximum 20% portfolio allocation per symbol'
    ],
    status: 'testing',
    created_at: new Date(),
    last_modified: new Date()
  };

  try {
    // Step 1: Validate the strategy
    console.log('Validating strategy...');
    const validation = await strategyTester.validateStrategy(momentumStrategy);
    console.log('Validation result:', validation.isValid ? 'PASSED' : 'FAILED');
    console.log('Validation score:', validation.score);
    
    if (!validation.isValid) {
      console.log('Validation errors:', validation.errors);
      return;
    }

    // Step 2: Run a quick test
    console.log('Running quick strategy test...');
    const testResult = await strategyTester.quickTest(momentumStrategy, ['BTC/USD', 'ETH/USD']);
    
    console.log('Test Results:');
    console.log('- Test ID:', testResult.testId);
    console.log('- Total Return:', testResult.performance.totalReturn.toFixed(4));
    console.log('- Win Rate:', (testResult.performance.winRate * 100).toFixed(1) + '%');
    console.log('- Max Drawdown:', (testResult.performance.maxDrawdown * 100).toFixed(1) + '%');
    console.log('- Total Trades:', testResult.performance.totalTrades);
    console.log('- Test Passed:', testResult.passed ? 'YES' : 'NO');

    // Step 3: Analyze results and recommendations
    console.log('\nRecommendations:');
    console.log('- Overall:', testResult.recommendations.overall);
    testResult.recommendations.improvements.forEach((improvement, index) => {
      console.log(`- Improvement ${index + 1}: ${improvement}`);
    });

  } catch (error) {
    console.error('Error in strategy development:', error);
  }
}

// ============================================================================
// Example 3: Advanced Portfolio Management
// ============================================================================

export async function portfolioManagementExample() {
  console.log('=== Portfolio Management Example ===');
  
  const agentId = 'portfolio-manager-agent';
  const portfolioManager = createAgentPaperPortfolioManager(agentId);

  try {
    // Step 1: Get comprehensive portfolio summary
    console.log('Analyzing portfolio...');
    const portfolioSummary = await portfolioManager.getPortfolioSummary();
    
    console.log('Portfolio Summary:');
    console.log('- Total Equity:', portfolioSummary.account.total_equity);
    console.log('- Positions:', portfolioSummary.positions.length);
    console.log('- Allocation Quality:', portfolioSummary.allocation.length, 'assets');

    // Step 2: Analyze portfolio health
    console.log('\nAnalyzing portfolio health...');
    const healthScore = await portfolioManager.getPortfolioHealth();
    
    console.log('Portfolio Health:');
    console.log('- Overall Score:', healthScore.score);
    console.log('- Grade:', healthScore.grade);
    
    healthScore.factors.forEach(factor => {
      console.log(`- ${factor.name}: ${factor.score}/100 (${factor.description})`);
    });

    // Step 3: Portfolio optimization
    console.log('\nOptimizing portfolio...');
    const optimization = await portfolioManager.optimizePortfolio();
    
    console.log('Optimization Results:');
    console.log('- Rebalance Orders:', optimization.rebalanceOrders.length);
    console.log('- Expected Risk Reduction:', (optimization.expectedImprovement.riskReduction * 100).toFixed(2) + '%');
    console.log('- Expected Return Increase:', (optimization.expectedImprovement.returnIncrease * 100).toFixed(2) + '%');

    if (optimization.rebalanceOrders.length > 0) {
      console.log('\nRecommended Actions:');
      optimization.rebalanceOrders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.action.toUpperCase()} ${order.quantity} ${order.symbol}: ${order.reasoning}`);
      });
    }

    // Step 4: Performance attribution
    console.log('\nPerformance attribution...');
    const attribution = await portfolioManager.getPerformanceAttribution();
    
    console.log('Performance by Symbol:');
    attribution.bySymbol.forEach(item => {
      console.log(`- ${item.symbol}: ${(item.contribution * 100).toFixed(2)}% contribution, ${(item.weight * 100).toFixed(1)}% weight`);
    });

  } catch (error) {
    console.error('Error in portfolio management:', error);
  }
}

// ============================================================================
// Example 4: Real-time Trading Agent
// ============================================================================

export async function realTimeTradingExample() {
  console.log('=== Real-time Trading Agent Example ===');
  
  const agentId = 'realtime-agent';
  
  // Create real-time agent with custom configuration
  const realTimeAgent = createRealTimePaperTradingAgent(agentId, {
    autoReconnect: true,
    eventFilters: {
      includeOwnEvents: true,
      includeOtherAgents: false,
      eventTypes: ['paper_order_filled', 'paper_position_updated', 'paper_risk_alert']
    },
    riskMonitoring: {
      enabled: true,
      checkInterval: 15000, // 15 seconds
      autoAction: true
    },
    performanceTracking: {
      enabled: true,
      updateInterval: 30000, // 30 seconds
      benchmarkComparison: true
    }
  });

  try {
    // Step 1: Start real-time agent
    console.log('Starting real-time agent...');
    await realTimeAgent.start();
    console.log('Agent started successfully');

    // Step 2: Set up custom event handlers
    realTimeAgent.setEventHandler('order_filled', async (data: any) => {
      console.log(`🎯 Order filled: ${data.orderId} at ${data.fillPrice}`);
      
      // Custom logic for order fill handling
      const currentState = realTimeAgent.getState();
      console.log('Current agent state:', {
        connected: currentState.connected,
        activeAlerts: currentState.activeAlerts.length,
        riskStatus: currentState.riskStatus.status
      });
    });

    realTimeAgent.setEventHandler('risk_alert', async (data: any) => {
      console.log(`⚠️ Risk alert: ${data.alert.severity} - ${data.alert.message}`);
      
      // Implement custom risk response
      if (data.alert.severity === 'critical') {
        console.log('🛑 Critical risk detected - implementing emergency procedures');
        // Could automatically close positions, reduce exposure, etc.
      }
    });

    // Step 3: Simulate trading activity
    console.log('Simulating market decision...');
    const mockMarketData = {
      symbol: 'BTC/USD',
      timestamp: new Date(),
      open: 50000,
      high: 51000,
      low: 49500,
      close: 50500,
      volume: 1000000,
      source: 'simulation',
      quality: 'good' as const
    };

    await realTimeAgent.makeRealTimeDecision(mockMarketData, {
      strategy: 'momentum',
      confidence: 0.75
    });

    // Step 4: Monitor for a short period
    console.log('Monitoring agent for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Step 5: Get final state and stop
    const finalState = realTimeAgent.getState();
    console.log('Final agent state:', {
      connected: finalState.connected,
      recentDecisions: finalState.recentDecisions.length,
      performanceSnapshot: finalState.performanceSnapshot
    });

    await realTimeAgent.stop();
    console.log('Real-time agent stopped');

  } catch (error) {
    console.error('Error in real-time trading:', error);
  }
}

// ============================================================================
// Example 5: Decision Tracking and Learning
// ============================================================================

export async function decisionTrackingExample() {
  console.log('=== Decision Tracking and Learning Example ===');
  
  const agentId = 'learning-agent';
  const decisionTracker = createPaperTradingDecisionTracker(agentId);

  try {
    // Step 1: Record a series of trading decisions
    console.log('Recording trading decisions...');
    
    const decisions = [
      {
        decision_id: 'decision-001',
        agent_id: agentId,
        strategy_id: 'momentum-strategy',
        decision_type: 'entry' as const,
        symbol: 'BTC/USD',
        reasoning: 'Strong upward momentum with high volume confirmation',
        market_context: {
          price: 50000,
          volume: 1200000,
          volatility: 0.12,
          trend: 'bullish',
          sentiment: 'positive'
        },
        decision_factors: {
          technical_signals: ['MA crossover', 'Volume spike', 'RSI oversold recovery'],
          fundamental_factors: ['Institutional adoption news'],
          risk_considerations: ['Position size limited to 2%', 'Stop loss at 3%'],
          market_conditions: ['Bull market', 'Low VIX']
        },
        confidence_level: 0.85,
        expected_outcome: {
          expected_return: 0.06,
          risk_reward_ratio: 3.0
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        decision_id: 'decision-002',
        agent_id: agentId,
        strategy_id: 'mean-reversion',
        decision_type: 'entry' as const,
        symbol: 'ETH/USD',
        reasoning: 'Oversold condition with support level holding',
        market_context: {
          price: 3000,
          volume: 800000,
          volatility: 0.18,
          trend: 'neutral',
          sentiment: 'neutral'
        },
        decision_factors: {
          technical_signals: ['RSI oversold', 'Bollinger lower band'],
          fundamental_factors: [],
          risk_considerations: ['High volatility', 'Position size 1.5%'],
          market_conditions: ['Sideways market']
        },
        confidence_level: 0.65,
        expected_outcome: {
          expected_return: 0.04,
          risk_reward_ratio: 2.0
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Record decisions
    for (const decision of decisions) {
      await decisionTracker.recordDecision(decision);
    }

    // Step 2: Record outcomes
    console.log('Recording decision outcomes...');
    
    // Successful trade
    await decisionTracker.recordDecisionOutcome(
      'decision-001',
      ['order-001', 'order-002'], // Entry and exit orders
      0.045, // 4.5% profit
      18, // 18 hours hold time
      {
        exit_price: 52250,
        market_sentiment: 'positive',
        volatility_at_exit: 0.10
      }
    );

    // Losing trade
    await decisionTracker.recordDecisionOutcome(
      'decision-002',
      ['order-003', 'order-004'],
      -0.025, // 2.5% loss
      6, // 6 hours hold time
      {
        exit_price: 2925,
        market_sentiment: 'negative',
        volatility_at_exit: 0.22
      }
    );

    // Step 3: Analyze decision patterns
    console.log('Analyzing decision patterns...');
    const patterns = decisionTracker.getPatterns();
    console.log(`Identified ${patterns.length} patterns:`);
    
    patterns.forEach(pattern => {
      console.log(`- ${pattern.description}: ${pattern.frequency} occurrences, ${(pattern.success_rate * 100).toFixed(1)}% success rate`);
    });

    // Step 4: Generate learning insights
    console.log('\nGenerating learning insights...');
    const insights = decisionTracker.getInsights();
    console.log(`Generated ${insights.length} insights:`);
    
    insights.forEach(insight => {
      console.log(`\n📚 ${insight.title} (${insight.category})`);
      console.log(`   ${insight.description}`);
      console.log(`   Confidence: ${(insight.confidence_level * 100).toFixed(0)}%`);
      console.log(`   Impact: ${insight.impact_potential}`);
      
      if (insight.actionable_steps.length > 0) {
        console.log('   Action steps:');
        insight.actionable_steps.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step}`);
        });
      }
    });

    // Step 5: Performance summary
    console.log('\nPerformance summary:');
    const summary = decisionTracker.getPerformanceSummary();
    if (summary) {
      console.log(`- Total Decisions: ${summary.total_decisions}`);
      console.log(`- Completed Outcomes: ${summary.completed_outcomes}`);
      console.log(`- Total P&L: ${(summary.total_pnl * 100).toFixed(2)}%`);
      console.log(`- Win Rate: ${(summary.win_rate * 100).toFixed(1)}%`);
      console.log(`- Avg Duration: ${summary.avg_duration_hours.toFixed(1)} hours`);
      console.log(`- Patterns Identified: ${summary.patterns_identified}`);
      console.log(`- Insights Generated: ${summary.insights_generated}`);
    }

  } catch (error) {
    console.error('Error in decision tracking:', error);
  }
}

// ============================================================================
// Example 6: Multi-Agent Coordination
// ============================================================================

export async function multiAgentCoordinationExample() {
  console.log('=== Multi-Agent Coordination Example ===');

  const agents = [
    { id: 'momentum-specialist', type: 'momentum', config: AGENT_PAPER_TRADING_CONFIGS.aggressive },
    { id: 'mean-reversion-specialist', type: 'mean_reversion', config: AGENT_PAPER_TRADING_CONFIGS.moderate },
    { id: 'risk-manager', type: 'risk_management', config: AGENT_PAPER_TRADING_CONFIGS.conservative }
  ];

  const managers = agents.map(agent => ({
    agent,
    manager: new AgentPaperTradingManager(agent.id),
    executor: new AgentPaperTradingExecutor(agent.id)
  }));

  try {
    // Step 1: Set up all agents
    console.log('Setting up multi-agent system...');
    for (const { agent, manager } of managers) {
      console.log(`Setting up ${agent.id}...`);
      await manager.createPaperTradingAccount(agent.config, `${agent.type} Agent Account`);
    }

    // Step 2: Coordinate decisions across agents
    console.log('Coordinating agent decisions...');
    
    const marketData = {
      symbol: 'BTC/USD',
      timestamp: new Date(),
      open: 50000,
      high: 51500,
      low: 49800,
      close: 51200,
      volume: 1500000,
      source: 'coordination',
      quality: 'excellent' as const
    };

    const context = {
      marketData,
      portfolioValue: 10000,
      availableCash: 8000,
      currentPositions: [],
      riskMetrics: {},
      marketSentiment: 'bullish'
    };

    // Get recommendations from each specialist
    const agentRecommendations = [];
    
    for (const { agent, executor } of managers) {
      console.log(`Getting recommendation from ${agent.id}...`);
      
      const strategy: AgentPaperTradingStrategy = {
        strategy_id: `${agent.type}-strategy`,
        agent_id: agent.id,
        name: `${agent.type} Strategy`,
        description: `Specialized ${agent.type} strategy`,
        strategy_type: agent.type as any,
        parameters: {},
        entry_conditions: [`${agent.type} signal detected`],
        exit_conditions: [`${agent.type} exit signal`],
        risk_management_rules: ['Standard risk management'],
        status: 'active',
        created_at: new Date(),
        last_modified: new Date()
      };

      try {
        const execution = await executor.executeStrategy(strategy, context);
        agentRecommendations.push({
          agentId: agent.id,
          agentType: agent.type,
          recommendation: execution
        });
      } catch (error) {
        console.log(`${agent.id} recommendation failed:`, error);
      }
    }

    // Step 3: Analyze and consolidate recommendations
    console.log('\nAgent Recommendations:');
    agentRecommendations.forEach(rec => {
      console.log(`${rec.agentType} (${rec.agentId}):`);
      console.log(`  - Orders: ${rec.recommendation.orders.length}`);
      console.log(`  - Confidence: ${(rec.recommendation.confidence * 100).toFixed(1)}%`);
      console.log(`  - Risk Score: ${(rec.recommendation.riskScore * 100).toFixed(1)}%`);
      console.log(`  - Reasoning: ${rec.recommendation.reasoning}`);
    });

    // Step 4: Implement consensus mechanism
    console.log('\nImplementing consensus mechanism...');
    
    const consensus = {
      totalOrders: agentRecommendations.reduce((sum, rec) => sum + rec.recommendation.orders.length, 0),
      avgConfidence: agentRecommendations.reduce((sum, rec) => sum + rec.recommendation.confidence, 0) / agentRecommendations.length,
      avgRiskScore: agentRecommendations.reduce((sum, rec) => sum + rec.recommendation.riskScore, 0) / agentRecommendations.length,
      agreement: agentRecommendations.filter(rec => rec.recommendation.orders.length > 0).length / agentRecommendations.length
    };

    console.log('Consensus Results:');
    console.log(`- Total Proposed Orders: ${consensus.totalOrders}`);
    console.log(`- Average Confidence: ${(consensus.avgConfidence * 100).toFixed(1)}%`);
    console.log(`- Average Risk Score: ${(consensus.avgRiskScore * 100).toFixed(1)}%`);
    console.log(`- Agent Agreement: ${(consensus.agreement * 100).toFixed(1)}%`);

    // Decision logic
    if (consensus.agreement >= 0.6 && consensus.avgConfidence >= 0.7) {
      console.log('✅ Consensus reached - proceeding with coordinated action');
    } else {
      console.log('❌ No consensus - maintaining current positions');
    }

  } catch (error) {
    console.error('Error in multi-agent coordination:', error);
  }
}

// ============================================================================
// Example 7: Event-Driven Trading
// ============================================================================

export async function eventDrivenTradingExample() {
  console.log('=== Event-Driven Trading Example ===');

  try {
    // Step 1: Connect to event bus
    console.log('Connecting to paper trading event bus...');
    await paperTradingEventBus.connect();
    console.log('Connected to event bus');

    // Step 2: Set up comprehensive event monitoring
    const subscriptions: string[] = [];

    // Monitor all order events
    const orderSubscription = paperTradingEventBus.subscribe(
      'paper_order_filled',
      (data) => {
        console.log(`📈 Order Filled: ${data.orderId} for agent ${data.agentId}`);
        console.log(`   Price: $${data.fillPrice}, Quantity: ${data.fillQuantity}`);
        
        // Trigger follow-up actions
        if (data.fillQuantity > 0) {
          console.log('   🎯 Considering follow-up orders (stop-loss, take-profit)');
        }
      }
    );
    subscriptions.push(orderSubscription);

    // Monitor risk alerts
    const riskSubscription = paperTradingEventBus.subscribe(
      'paper_risk_alert',
      (data) => {
        console.log(`⚠️ Risk Alert: ${data.alert.severity} for agent ${data.agentId}`);
        console.log(`   Message: ${data.alert.message}`);
        
        if (data.alert.severity === 'critical') {
          console.log('   🚨 Critical risk - implementing emergency procedures');
          // Could trigger automatic position closure, trading halt, etc.
        }
      }
    );
    subscriptions.push(riskSubscription);

    // Monitor performance updates
    const performanceSubscription = paperTradingEventBus.subscribe(
      'paper_performance_update',
      (data) => {
        console.log(`📊 Performance Update for agent ${data.agentId}:`);
        console.log(`   Total Return: ${(data.performance.totalReturn * 100).toFixed(2)}%`);
        console.log(`   Win Rate: ${(data.performance.winRate * 100).toFixed(1)}%`);
        console.log(`   Sharpe Ratio: ${data.performance.sharpeRatio.toFixed(2)}`);
      }
    );
    subscriptions.push(performanceSubscription);

    // Step 3: Simulate trading events
    console.log('\nSimulating trading events...');
    
    // Simulate order fill
    setTimeout(() => {
      paperTradingEventBus.emit('paper_order_filled', {
        agentId: 'demo-agent',
        accountId: 'account-123',
        orderId: 'order-456',
        fillPrice: 50500,
        fillQuantity: 0.1,
        remainingQuantity: 0,
        timestamp: new Date().toISOString()
      });
    }, 1000);

    // Simulate risk alert
    setTimeout(() => {
      paperTradingEventBus.emit('paper_risk_alert', {
        agentId: 'demo-agent',
        accountId: 'account-123',
        alert: {
          id: 'alert-789',
          agent_id: 'demo-agent',
          account_id: 'account-123',
          alert_type: 'position',
          severity: 'medium',
          title: 'Position Size Warning',
          message: 'Position size approaching 25% of portfolio',
          triggered_at: new Date(),
          acknowledged: false
        },
        timestamp: new Date().toISOString()
      });
    }, 2000);

    // Simulate performance update
    setTimeout(() => {
      paperTradingEventBus.emit('paper_performance_update', {
        agentId: 'demo-agent',
        accountId: 'account-123',
        performance: {
          totalReturn: 0.055,
          dailyPnl: 275,
          winRate: 0.68,
          sharpeRatio: 1.45
        },
        timestamp: new Date().toISOString()
      });
    }, 3000);

    // Step 4: Wait for events to process
    console.log('Monitoring events for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Step 5: Clean up subscriptions
    console.log('Cleaning up event subscriptions...');
    paperTradingEventBus.unsubscribeMultiple(subscriptions);
    console.log(`Unsubscribed from ${subscriptions.length} event types`);

  } catch (error) {
    console.error('Error in event-driven trading:', error);
  }
}

// ============================================================================
// Example 8: Comprehensive Integration Demo
// ============================================================================

export async function comprehensiveIntegrationDemo() {
  console.log('=== Comprehensive Paper Trading Integration Demo ===');
  
  const agentId = 'integration-demo-agent';

  try {
    // Initialize all components
    console.log('Initializing paper trading system...');
    const paperTradingManager = new AgentPaperTradingManager(agentId);
    const executor = new AgentPaperTradingExecutor(agentId);
    const portfolioManager = createAgentPaperPortfolioManager(agentId);
    const strategyTester = createPaperTradingStrategyTester(agentId);
    const decisionTracker = createPaperTradingDecisionTracker(agentId);
    const realTimeAgent = createRealTimePaperTradingAgent(agentId);

    // Step 1: Account setup and validation
    console.log('\n1. Setting up paper trading account...');
    const account = await paperTradingManager.createPaperTradingAccount(
      AGENT_PAPER_TRADING_CONFIGS.moderate,
      'Integration Demo Account'
    );
    console.log(`✅ Account created: ${account.id}`);

    // Step 2: Strategy development and testing
    console.log('\n2. Developing and testing strategy...');
    const strategy: AgentPaperTradingStrategy = {
      strategy_id: 'integration-momentum',
      agent_id: agentId,
      name: 'Integration Demo Momentum Strategy',
      description: 'A comprehensive momentum strategy for demo purposes',
      strategy_type: 'momentum',
      parameters: {
        lookback_period: 20,
        momentum_threshold: 0.025,
        volume_confirmation: true
      },
      entry_conditions: ['Positive momentum', 'Volume spike', 'Clear trend'],
      exit_conditions: ['Momentum reversal', 'Stop loss', 'Take profit'],
      risk_management_rules: ['2% max risk', 'Position size limits'],
      status: 'active',
      created_at: new Date(),
      last_modified: new Date()
    };

    const quickTest = await strategyTester.quickTest(strategy);
    console.log(`✅ Strategy test completed: ${quickTest.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   Return: ${(quickTest.performance.totalReturn * 100).toFixed(2)}%`);

    // Step 3: Execute trades
    console.log('\n3. Executing trades...');
    const tradeResult = await executor.executeMarketOrder('BTC/USD', 'buy', 0.05, 'Integration demo trade');
    console.log(`✅ Trade executed: ${tradeResult?.id || 'Demo order'}`);

    // Step 4: Portfolio analysis
    console.log('\n4. Analyzing portfolio...');
    const portfolioHealth = await portfolioManager.getPortfolioHealth();
    console.log(`✅ Portfolio health: ${portfolioHealth.grade} (${portfolioHealth.score}/100)`);

    // Step 5: Decision tracking
    console.log('\n5. Tracking decisions...');
    await decisionTracker.recordDecision({
      decision_id: 'integration-decision',
      agent_id: agentId,
      strategy_id: strategy.strategy_id,
      decision_type: 'entry',
      symbol: 'BTC/USD',
      reasoning: 'Integration demo decision',
      market_context: {
        price: 50000,
        volume: 1000000,
        volatility: 0.15,
        trend: 'bullish',
        sentiment: 'positive'
      },
      decision_factors: {
        technical_signals: ['Momentum'],
        fundamental_factors: [],
        risk_considerations: ['Position size'],
        market_conditions: ['Bull market']
      },
      confidence_level: 0.75,
      expected_outcome: {
        expected_return: 0.05,
        risk_reward_ratio: 2.5
      },
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log('✅ Decision recorded for tracking');

    // Step 6: Real-time monitoring
    console.log('\n6. Starting real-time monitoring...');
    await realTimeAgent.start();
    console.log('✅ Real-time agent started');

    // Brief monitoring period
    await new Promise(resolve => setTimeout(resolve, 5000));
    await realTimeAgent.stop();
    console.log('✅ Real-time agent stopped');

    // Step 7: Final summary
    console.log('\n7. Integration Summary:');
    const summary = decisionTracker.getPerformanceSummary();
    if (summary) {
      console.log(`✅ Total Decisions: ${summary.total_decisions}`);
      console.log(`✅ Insights Generated: ${summary.insights_generated}`);
    }

    console.log('\n🎉 Comprehensive integration demo completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('- Paper trading account management');
    console.log('- Strategy development and testing');
    console.log('- Order execution and validation');
    console.log('- Portfolio optimization');
    console.log('- Decision tracking and learning');
    console.log('- Real-time monitoring');
    console.log('- Risk management');
    console.log('- Performance analytics');

  } catch (error) {
    console.error('Error in comprehensive integration demo:', error);
  }
}

// ============================================================================
// Usage Instructions
// ============================================================================

/*
To run these examples:

1. Basic Setup:
   await basicPaperTradingSetup();

2. Strategy Development:
   await strategyDevelopmentExample();

3. Portfolio Management:
   await portfolioManagementExample();

4. Real-time Trading:
   await realTimeTradingExample();

5. Decision Tracking:
   await decisionTrackingExample();

6. Multi-Agent System:
   await multiAgentCoordinationExample();

7. Event-Driven Trading:
   await eventDrivenTradingExample();

8. Complete Integration:
   await comprehensiveIntegrationDemo();

Note: Make sure your backend API is running and properly configured
before running these examples. The examples include error handling
and will gracefully handle API unavailability.
*/

// Export all examples for easy importing
export const paperTradingExamples = {
  basicSetup: basicPaperTradingSetup,
  strategyDevelopment: strategyDevelopmentExample,
  portfolioManagement: portfolioManagementExample,
  realTimeTrading: realTimeTradingExample,
  decisionTracking: decisionTrackingExample,
  multiAgentCoordination: multiAgentCoordinationExample,
  eventDrivenTrading: eventDrivenTradingExample,
  comprehensiveDemo: comprehensiveIntegrationDemo
};