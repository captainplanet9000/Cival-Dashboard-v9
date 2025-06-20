import { createClient } from '@supabase/supabase-js';
import { backendApi } from '@/lib/api/backend-client';
import Redis from 'ioredis';

interface AgentConfig {
  agentId: string;
  name: string;
  type: 'trading' | 'risk' | 'portfolio' | 'market-analysis';
  interval: number; // milliseconds
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'error';
}

interface AgentTask {
  taskId: string;
  agentId: string;
  action: string;
  parameters: any;
  priority: number;
  scheduledAt: Date;
  executedAt?: Date;
  result?: any;
  error?: string;
}

export class AutonomousAgentScheduler {
  private supabase: any;
  private redis: Redis | null = null;
  private agents: Map<string, AgentConfig> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;
  private taskQueue: AgentTask[] = [];

  constructor() {
    // Initialize Supabase client
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }

    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
    }

    this.initializeAgents();
  }

  private initializeAgents() {
    // Define autonomous agents
    const defaultAgents: AgentConfig[] = [
      {
        agentId: 'market-scanner-001',
        name: 'Market Scanner Agent',
        type: 'market-analysis',
        interval: 60000, // 1 minute
        enabled: true,
        status: 'idle'
      },
      {
        agentId: 'trading-executor-001',
        name: 'Trading Executor Agent',
        type: 'trading',
        interval: 300000, // 5 minutes
        enabled: true,
        status: 'idle'
      },
      {
        agentId: 'risk-monitor-001',
        name: 'Risk Monitor Agent',
        type: 'risk',
        interval: 120000, // 2 minutes
        enabled: true,
        status: 'idle'
      },
      {
        agentId: 'portfolio-optimizer-001',
        name: 'Portfolio Optimizer Agent',
        type: 'portfolio',
        interval: 600000, // 10 minutes
        enabled: true,
        status: 'idle'
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.agentId, agent);
    });
  }

  async start() {
    if (this.isRunning) return;
    
    console.log('🚀 Starting Autonomous Agent Scheduler...');
    this.isRunning = true;

    // Load agent states from database
    await this.loadAgentStates();

    // Start all enabled agents
    for (const [agentId, config] of this.agents) {
      if (config.enabled) {
        this.scheduleAgent(agentId);
      }
    }

    // Start task processor
    this.startTaskProcessor();

    // Start health monitor
    this.startHealthMonitor();

    console.log('✅ Autonomous Agent Scheduler started successfully');
  }

  async stop() {
    console.log('🛑 Stopping Autonomous Agent Scheduler...');
    this.isRunning = false;

    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Save agent states
    await this.saveAgentStates();

    console.log('✅ Autonomous Agent Scheduler stopped');
  }

  private scheduleAgent(agentId: string) {
    const config = this.agents.get(agentId);
    if (!config || !config.enabled) return;

    // Clear existing timer if any
    const existingTimer = this.timers.get(agentId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Calculate next run time
    const now = new Date();
    const nextRun = new Date(now.getTime() + config.interval);
    config.nextRun = nextRun;

    // Schedule the agent
    const timer = setTimeout(async () => {
      await this.executeAgent(agentId);
      
      // Reschedule if still enabled
      if (this.isRunning && config.enabled) {
        this.scheduleAgent(agentId);
      }
    }, config.interval);

    this.timers.set(agentId, timer);
  }

  private async executeAgent(agentId: string) {
    const config = this.agents.get(agentId);
    if (!config) return;

    console.log(`🤖 Executing agent: ${config.name}`);
    config.status = 'running';
    config.lastRun = new Date();

    try {
      // Execute based on agent type
      switch (config.type) {
        case 'market-analysis':
          await this.executeMarketAnalysis(agentId);
          break;
        case 'trading':
          await this.executeTradingAgent(agentId);
          break;
        case 'risk':
          await this.executeRiskMonitor(agentId);
          break;
        case 'portfolio':
          await this.executePortfolioOptimizer(agentId);
          break;
      }

      config.status = 'idle';
      
      // Save state to database
      await this.saveAgentState(agentId);
      
    } catch (error) {
      console.error(`❌ Agent execution failed: ${config.name}`, error);
      config.status = 'error';
      
      // Create alert task
      this.queueTask({
        taskId: `alert-${Date.now()}`,
        agentId: 'system',
        action: 'send-alert',
        parameters: {
          level: 'error',
          message: `Agent ${config.name} failed: ${error}`,
          timestamp: new Date()
        },
        priority: 1,
        scheduledAt: new Date()
      });
    }
  }

  private async executeMarketAnalysis(agentId: string) {
    // Scan markets for opportunities
    const markets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
    
    for (const symbol of markets) {
      try {
        // Get market data
        const marketData = await backendApi.get(`/api/v1/market/live-data/${symbol}`);
        
        // Analyze for trading signals
        const analysis = await backendApi.post('/api/v1/ai/analyze-market', {
          symbol,
          data: marketData.data,
          timeframe: '15m'
        });

        // Queue trading tasks if signals found
        if (analysis.data?.signals?.length > 0) {
          for (const signal of analysis.data.signals) {
            this.queueTask({
              taskId: `trade-signal-${Date.now()}-${symbol}`,
              agentId: 'trading-executor-001',
              action: 'evaluate-signal',
              parameters: {
                symbol,
                signal,
                confidence: signal.confidence
              },
              priority: signal.priority || 5,
              scheduledAt: new Date()
            });
          }
        }

        // Store analysis results
        await this.storeAnalysisResult(agentId, symbol, analysis.data);
        
      } catch (error) {
        console.error(`Market analysis failed for ${symbol}:`, error);
      }
    }
  }

  private async executeTradingAgent(agentId: string) {
    // Get portfolio status
    const portfolio = await backendApi.get('/api/v1/portfolio/summary');
    
    // Get pending trading signals
    const pendingTasks = this.taskQueue.filter(
      task => task.agentId === agentId && task.action === 'evaluate-signal'
    );

    for (const task of pendingTasks) {
      try {
        const { symbol, signal, confidence } = task.parameters;
        
        // Check risk limits
        const riskCheck = await backendApi.post('/api/v1/risk/check-limits', {
          action: signal.action,
          symbol,
          amount: signal.amount
        });

        if (riskCheck.data?.approved) {
          // Execute trade
          const order = await backendApi.post('/api/v1/trading/paper/order', {
            symbol,
            side: signal.action,
            quantity: signal.amount,
            type: 'market',
            metadata: {
              agentId,
              signalId: signal.id,
              confidence
            }
          });

          task.executedAt = new Date();
          task.result = order.data;
          
          console.log(`✅ Trade executed: ${symbol} ${signal.action} ${signal.amount}`);
        } else {
          task.error = 'Risk check failed';
          console.log(`⚠️ Trade rejected by risk management: ${symbol}`);
        }
        
      } catch (error) {
        task.error = String(error);
        console.error('Trade execution failed:', error);
      }
    }

    // Clean up executed tasks
    this.taskQueue = this.taskQueue.filter(task => !task.executedAt);
  }

  private async executeRiskMonitor(agentId: string) {
    try {
      // Get current risk metrics
      const riskMetrics = await backendApi.get('/api/v1/risk/metrics');
      
      // Check for risk violations
      const violations = this.checkRiskViolations(riskMetrics.data);
      
      if (violations.length > 0) {
        // Take protective actions
        for (const violation of violations) {
          this.queueTask({
            taskId: `risk-action-${Date.now()}`,
            agentId: 'trading-executor-001',
            action: 'risk-mitigation',
            parameters: violation,
            priority: 1, // High priority
            scheduledAt: new Date()
          });
        }
      }

      // Update risk dashboard
      if (this.redis) {
        await this.redis.set('risk:latest-metrics', JSON.stringify(riskMetrics.data));
        await this.redis.expire('risk:latest-metrics', 300); // 5 minutes
      }
      
    } catch (error) {
      console.error('Risk monitoring failed:', error);
    }
  }

  private async executePortfolioOptimizer(agentId: string) {
    try {
      // Get current portfolio
      const portfolio = await backendApi.get('/api/v1/portfolio/positions');
      
      // Run optimization algorithm
      const optimization = await backendApi.post('/api/v1/portfolio/optimize', {
        positions: portfolio.data,
        constraints: {
          maxPositionSize: 0.2,
          minDiversity: 5,
          targetSharpe: 1.5
        }
      });

      // Generate rebalancing orders
      if (optimization.data?.rebalancing?.length > 0) {
        for (const action of optimization.data.rebalancing) {
          this.queueTask({
            taskId: `rebalance-${Date.now()}-${action.symbol}`,
            agentId: 'trading-executor-001',
            action: 'rebalance',
            parameters: action,
            priority: 7,
            scheduledAt: new Date()
          });
        }
        
        console.log(`📊 Portfolio optimization: ${optimization.data.rebalancing.length} rebalancing actions queued`);
      }
      
    } catch (error) {
      console.error('Portfolio optimization failed:', error);
    }
  }

  private checkRiskViolations(metrics: any): any[] {
    const violations = [];
    
    // Check Value at Risk
    if (metrics.portfolio_var_95 > 0.05) {
      violations.push({
        type: 'var-exceeded',
        metric: 'portfolio_var_95',
        value: metrics.portfolio_var_95,
        threshold: 0.05,
        action: 'reduce-exposure'
      });
    }

    // Check concentration risk
    if (metrics.concentration_risk > 0.3) {
      violations.push({
        type: 'concentration-risk',
        metric: 'concentration_risk',
        value: metrics.concentration_risk,
        threshold: 0.3,
        action: 'diversify'
      });
    }

    // Check drawdown
    if (metrics.max_drawdown > 0.15) {
      violations.push({
        type: 'drawdown-exceeded',
        metric: 'max_drawdown',
        value: metrics.max_drawdown,
        threshold: 0.15,
        action: 'stop-trading'
      });
    }

    return violations;
  }

  private queueTask(task: AgentTask) {
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => a.priority - b.priority);
  }

  private async startTaskProcessor() {
    setInterval(async () => {
      if (this.taskQueue.length === 0) return;

      const task = this.taskQueue.shift();
      if (task && !task.executedAt) {
        console.log(`📋 Processing task: ${task.action} for ${task.agentId}`);
        // Task will be processed by the appropriate agent
      }
    }, 5000); // Process every 5 seconds
  }

  private async startHealthMonitor() {
    setInterval(async () => {
      const healthStatus = {
        timestamp: new Date(),
        scheduler: this.isRunning,
        agents: Array.from(this.agents.values()).map(agent => ({
          id: agent.agentId,
          name: agent.name,
          status: agent.status,
          lastRun: agent.lastRun,
          nextRun: agent.nextRun
        })),
        taskQueueSize: this.taskQueue.length,
        uptime: process.uptime()
      };

      // Store health status
      if (this.redis) {
        await this.redis.set('scheduler:health', JSON.stringify(healthStatus));
        await this.redis.expire('scheduler:health', 60);
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🏥 Health Check:', {
          agents: healthStatus.agents.length,
          tasks: healthStatus.taskQueueSize,
          uptime: Math.floor(healthStatus.uptime / 60) + ' minutes'
        });
      }
    }, 30000); // Every 30 seconds
  }

  private async loadAgentStates() {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('agent_states')
        .select('*');

      if (data) {
        data.forEach((state: any) => {
          const agent = this.agents.get(state.agent_id);
          if (agent) {
            agent.lastRun = state.last_run ? new Date(state.last_run) : undefined;
            agent.enabled = state.enabled;
            agent.status = state.status;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load agent states:', error);
    }
  }

  private async saveAgentStates() {
    if (!this.supabase) return;

    const states = Array.from(this.agents.values()).map(agent => ({
      agent_id: agent.agentId,
      name: agent.name,
      type: agent.type,
      enabled: agent.enabled,
      status: agent.status,
      last_run: agent.lastRun,
      next_run: agent.nextRun,
      updated_at: new Date()
    }));

    try {
      await this.supabase
        .from('agent_states')
        .upsert(states, { onConflict: 'agent_id' });
    } catch (error) {
      console.error('Failed to save agent states:', error);
    }
  }

  private async saveAgentState(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent || !this.supabase) return;

    try {
      await this.supabase
        .from('agent_states')
        .upsert({
          agent_id: agent.agentId,
          name: agent.name,
          type: agent.type,
          enabled: agent.enabled,
          status: agent.status,
          last_run: agent.lastRun,
          next_run: agent.nextRun,
          updated_at: new Date()
        }, { onConflict: 'agent_id' });
    } catch (error) {
      console.error(`Failed to save state for agent ${agentId}:`, error);
    }
  }

  private async storeAnalysisResult(agentId: string, symbol: string, analysis: any) {
    if (!this.supabase) return;

    try {
      await this.supabase
        .from('market_analysis')
        .insert({
          agent_id: agentId,
          symbol,
          analysis,
          timestamp: new Date()
        });
    } catch (error) {
      console.error('Failed to store analysis result:', error);
    }
  }
}

// Export singleton instance
export const agentScheduler = new AutonomousAgentScheduler();