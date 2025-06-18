// Real-time Paper Trading Integration for Agents
import { paperTradingEventBus, PaperTradingEventEmitter } from '@/lib/websocket/paper-trading-events';
import { AgentPaperTradingManager } from './paper-trading-manager';
import { AgentPaperTradingExecutor } from './paper-trading-executor';
import type {
  AgentPaperTradingAccount,
  AgentPaperTradingAlert,
  AgentPaperTradingDecision
} from '@/types/agent-paper-trading';
import type { MarketData } from '@/types/trading';

export interface RealTimeAgentConfig {
  agentId: string;
  autoReconnect: boolean;
  eventFilters: {
    includeOwnEvents: boolean;
    includeOtherAgents: boolean;
    eventTypes: string[];
  };
  riskMonitoring: {
    enabled: boolean;
    checkInterval: number; // milliseconds
    autoAction: boolean;
  };
  performanceTracking: {
    enabled: boolean;
    updateInterval: number; // milliseconds
    benchmarkComparison: boolean;
  };
}

export interface RealTimeAgentState {
  connected: boolean;
  lastUpdate: Date;
  subscriptionIds: string[];
  activeAlerts: AgentPaperTradingAlert[];
  recentDecisions: AgentPaperTradingDecision[];
  performanceSnapshot: any;
  riskStatus: {
    status: 'normal' | 'warning' | 'critical';
    lastCheck: Date;
    issues: string[];
  };
}

export class RealTimePaperTradingAgent {
  private readonly agentId: string;
  private readonly config: RealTimeAgentConfig;
  private readonly paperTradingManager: AgentPaperTradingManager;
  private readonly executor: AgentPaperTradingExecutor;
  
  private state: RealTimeAgentState;
  private riskMonitoringInterval?: NodeJS.Timer;
  private performanceUpdateInterval?: NodeJS.Timer;
  private eventHandlers: Map<string, Function> = new Map();

  constructor(agentId: string, config?: Partial<RealTimeAgentConfig>) {
    this.agentId = agentId;
    this.config = {
      agentId,
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
      },
      performanceTracking: {
        enabled: true,
        updateInterval: 60000, // 1 minute
        benchmarkComparison: false
      },
      ...config
    };

    this.paperTradingManager = new AgentPaperTradingManager(agentId);
    this.executor = new AgentPaperTradingExecutor(agentId);

    this.state = {
      connected: false,
      lastUpdate: new Date(),
      subscriptionIds: [],
      activeAlerts: [],
      recentDecisions: [],
      performanceSnapshot: null,
      riskStatus: {
        status: 'normal',
        lastCheck: new Date(),
        issues: []
      }
    };

    this.initializeEventHandlers();
  }

  // Initialization and Connection
  async start(): Promise<void> {
    try {
      // Connect to WebSocket
      await paperTradingEventBus.connect();
      
      // Subscribe to relevant events
      await this.subscribeToEvents();
      
      // Start monitoring intervals
      this.startRiskMonitoring();
      this.startPerformanceTracking();
      
      this.state.connected = true;
      this.state.lastUpdate = new Date();
      
      console.log(`Real-time paper trading agent ${this.agentId} started`);
      
      // Emit agent started event
      this.emitAgentEvent('started', { message: 'Real-time agent started successfully' });
      
    } catch (error) {
      console.error(`Failed to start real-time agent ${this.agentId}:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      // Unsubscribe from events
      this.unsubscribeFromEvents();
      
      // Stop monitoring intervals
      this.stopRiskMonitoring();
      this.stopPerformanceTracking();
      
      this.state.connected = false;
      
      console.log(`Real-time paper trading agent ${this.agentId} stopped`);
      
      // Emit agent stopped event
      this.emitAgentEvent('stopped', { message: 'Real-time agent stopped' });
      
    } catch (error) {
      console.error(`Error stopping real-time agent ${this.agentId}:`, error);
    }
  }

  // Event Subscription Management
  private async subscribeToEvents(): Promise<void> {
    const subscriptionIds: string[] = [];

    // Subscribe to order events
    if (this.config.eventFilters.eventTypes.includes('paper_order_filled')) {
      const id = paperTradingEventBus.subscribe(
        'paper_order_filled',
        this.handleOrderFilled.bind(this),
        { agentId: this.agentId }
      );
      subscriptionIds.push(id);
    }

    // Subscribe to position events
    if (this.config.eventFilters.eventTypes.includes('paper_position_updated')) {
      const id = paperTradingEventBus.subscribe(
        'paper_position_updated',
        this.handlePositionUpdated.bind(this),
        { agentId: this.agentId }
      );
      subscriptionIds.push(id);
    }

    // Subscribe to risk alerts
    if (this.config.eventFilters.eventTypes.includes('paper_risk_alert')) {
      const id = paperTradingEventBus.subscribe(
        'paper_risk_alert',
        this.handleRiskAlert.bind(this),
        { agentId: this.agentId }
      );
      subscriptionIds.push(id);
    }

    // Subscribe to performance updates
    const perfId = paperTradingEventBus.subscribe(
      'paper_performance_update',
      this.handlePerformanceUpdate.bind(this),
      { agentId: this.agentId }
    );
    subscriptionIds.push(perfId);

    // Subscribe to account updates
    const accId = paperTradingEventBus.subscribe(
      'paper_account_updated',
      this.handleAccountUpdated.bind(this),
      { agentId: this.agentId }
    );
    subscriptionIds.push(accId);

    this.state.subscriptionIds = subscriptionIds;
  }

  private unsubscribeFromEvents(): void {
    paperTradingEventBus.unsubscribeMultiple(this.state.subscriptionIds);
    this.state.subscriptionIds = [];
  }

  // Event Handlers
  private initializeEventHandlers(): void {
    this.eventHandlers.set('order_filled', this.onOrderFilled.bind(this));
    this.eventHandlers.set('position_updated', this.onPositionUpdated.bind(this));
    this.eventHandlers.set('risk_alert', this.onRiskAlert.bind(this));
    this.eventHandlers.set('performance_update', this.onPerformanceUpdate.bind(this));
    this.eventHandlers.set('account_updated', this.onAccountUpdated.bind(this));
  }

  private async handleOrderFilled(data: any): Promise<void> {
    try {
      console.log(`Agent ${this.agentId}: Order filled - ${data.orderId} at ${data.fillPrice}`);
      
      // Update internal state
      this.state.lastUpdate = new Date();
      
      // Call custom handler
      const handler = this.eventHandlers.get('order_filled');
      if (handler) {
        await handler(data);
      }
      
      // Check if this order fill triggers any automatic actions
      await this.evaluatePostFillActions(data);
      
    } catch (error) {
      console.error(`Error handling order filled event for agent ${this.agentId}:`, error);
    }
  }

  private async handlePositionUpdated(data: any): Promise<void> {
    try {
      console.log(`Agent ${this.agentId}: Position updated - ${data.positionId}`);
      
      this.state.lastUpdate = new Date();
      
      const handler = this.eventHandlers.get('position_updated');
      if (handler) {
        await handler(data);
      }
      
      // Check position-based risk rules
      await this.evaluatePositionRisk(data);
      
    } catch (error) {
      console.error(`Error handling position updated event for agent ${this.agentId}:`, error);
    }
  }

  private async handleRiskAlert(data: any): Promise<void> {
    try {
      console.log(`Agent ${this.agentId}: Risk alert - ${data.alert.severity}: ${data.alert.message}`);
      
      // Add to active alerts
      this.state.activeAlerts.push(data.alert);
      
      // Update risk status
      if (data.alert.severity === 'critical') {
        this.state.riskStatus.status = 'critical';
      } else if (data.alert.severity === 'high' && this.state.riskStatus.status === 'normal') {
        this.state.riskStatus.status = 'warning';
      }
      
      this.state.riskStatus.lastCheck = new Date();
      this.state.riskStatus.issues.push(data.alert.message);
      
      const handler = this.eventHandlers.get('risk_alert');
      if (handler) {
        await handler(data);
      }
      
      // Take automatic action if configured
      if (this.config.riskMonitoring.autoAction) {
        await this.handleRiskAlertAction(data.alert);
      }
      
    } catch (error) {
      console.error(`Error handling risk alert for agent ${this.agentId}:`, error);
    }
  }

  private async handlePerformanceUpdate(data: any): Promise<void> {
    try {
      console.log(`Agent ${this.agentId}: Performance update - Return: ${data.performance.totalReturn}%`);
      
      this.state.performanceSnapshot = data.performance;
      this.state.lastUpdate = new Date();
      
      const handler = this.eventHandlers.get('performance_update');
      if (handler) {
        await handler(data);
      }
      
    } catch (error) {
      console.error(`Error handling performance update for agent ${this.agentId}:`, error);
    }
  }

  private async handleAccountUpdated(data: any): Promise<void> {
    try {
      console.log(`Agent ${this.agentId}: Account updated - Changes: ${data.changes.join(', ')}`);
      
      this.state.lastUpdate = new Date();
      
      const handler = this.eventHandlers.get('account_updated');
      if (handler) {
        await handler(data);
      }
      
    } catch (error) {
      console.error(`Error handling account updated event for agent ${this.agentId}:`, error);
    }
  }

  // Risk Monitoring
  private startRiskMonitoring(): void {
    if (!this.config.riskMonitoring.enabled) return;

    this.riskMonitoringInterval = setInterval(
      this.performRiskCheck.bind(this),
      this.config.riskMonitoring.checkInterval
    );
  }

  private stopRiskMonitoring(): void {
    if (this.riskMonitoringInterval) {
      clearInterval(this.riskMonitoringInterval);
      this.riskMonitoringInterval = undefined;
    }
  }

  private async performRiskCheck(): Promise<void> {
    try {
      const alerts = await this.paperTradingManager.checkRiskLimits();
      
      this.state.riskStatus.lastCheck = new Date();
      this.state.riskStatus.issues = [];
      
      if (alerts.length === 0) {
        this.state.riskStatus.status = 'normal';
      } else {
        const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
        const highAlerts = alerts.filter(alert => alert.severity === 'high');
        
        if (criticalAlerts.length > 0) {
          this.state.riskStatus.status = 'critical';
        } else if (highAlerts.length > 0) {
          this.state.riskStatus.status = 'warning';
        } else {
          this.state.riskStatus.status = 'normal';
        }
        
        this.state.riskStatus.issues = alerts.map(alert => alert.message);
        
        // Emit risk alerts
        alerts.forEach(alert => {
          PaperTradingEventEmitter.emitRiskAlert(this.agentId, alert.account_id, alert);
        });
      }
      
    } catch (error) {
      console.error(`Error performing risk check for agent ${this.agentId}:`, error);
    }
  }

  // Performance Tracking
  private startPerformanceTracking(): void {
    if (!this.config.performanceTracking.enabled) return;

    this.performanceUpdateInterval = setInterval(
      this.updatePerformanceMetrics.bind(this),
      this.config.performanceTracking.updateInterval
    );
  }

  private stopPerformanceTracking(): void {
    if (this.performanceUpdateInterval) {
      clearInterval(this.performanceUpdateInterval);
      this.performanceUpdateInterval = undefined;
    }
  }

  private async updatePerformanceMetrics(): Promise<void> {
    try {
      const performance = await this.paperTradingManager.getPerformanceMetrics();
      
      if (performance) {
        this.state.performanceSnapshot = performance;
        
        // Emit performance update event
        const accounts = await this.paperTradingManager.getPaperTradingAccounts();
        if (accounts.length > 0) {
          PaperTradingEventEmitter.emitPerformanceUpdate(
            this.agentId,
            accounts[0].id,
            {
              totalReturn: performance.total_return_percent || 0,
              dailyPnl: performance.daily_pnl || 0,
              winRate: performance.win_rate || 0,
              sharpeRatio: performance.sharpe_ratio || 0
            }
          );
        }
      }
      
    } catch (error) {
      console.error(`Error updating performance metrics for agent ${this.agentId}:`, error);
    }
  }

  // Action Handlers
  private async evaluatePostFillActions(fillData: any): Promise<void> {
    // Check if we need to place follow-up orders (stop-loss, take-profit, etc.)
    try {
      const positions = await this.paperTradingManager.getPaperPositions();
      const updatedPosition = positions.find(pos => 
        pos.symbol === fillData.symbol // Assuming symbol is available in fill data
      );

      if (updatedPosition && updatedPosition.agent_metadata?.target_price) {
        // Consider placing a take-profit order
        console.log(`Considering take-profit order for position ${updatedPosition.id}`);
      }
      
    } catch (error) {
      console.error(`Error evaluating post-fill actions for agent ${this.agentId}:`, error);
    }
  }

  private async evaluatePositionRisk(positionData: any): Promise<void> {
    // Check if position size or P&L triggers risk management actions
    try {
      const accounts = await this.paperTradingManager.getPaperTradingAccounts();
      if (accounts.length === 0) return;

      const account = accounts[0];
      
      // Check position size limits
      if (positionData.changes?.market_value) {
        const positionPercent = (positionData.changes.market_value / account.total_equity) * 100;
        
        if (positionPercent > account.config.max_position_size_percent) {
          const alert: AgentPaperTradingAlert = {
            id: `alert-${Date.now()}`,
            agent_id: this.agentId,
            account_id: account.id,
            alert_type: 'position',
            severity: 'high',
            title: 'Position Size Limit Exceeded',
            message: `Position size of ${positionPercent.toFixed(1)}% exceeds limit of ${account.config.max_position_size_percent}%`,
            triggered_at: new Date(),
            acknowledged: false,
            related_position_id: positionData.positionId
          };
          
          PaperTradingEventEmitter.emitRiskAlert(this.agentId, account.id, alert);
        }
      }
      
    } catch (error) {
      console.error(`Error evaluating position risk for agent ${this.agentId}:`, error);
    }
  }

  private async handleRiskAlertAction(alert: AgentPaperTradingAlert): Promise<void> {
    if (alert.severity === 'critical') {
      // Stop all trading activity
      console.log(`Critical risk alert for agent ${this.agentId}: Stopping trading`);
      // Implementation would stop strategy execution
      
    } else if (alert.severity === 'high') {
      // Reduce position sizes or close risky positions
      if (alert.related_position_id) {
        console.log(`High risk alert for agent ${this.agentId}: Reducing position ${alert.related_position_id}`);
        // Implementation would reduce position size
      }
    }
  }

  // Decision Making Integration
  async makeRealTimeDecision(
    marketData: MarketData,
    context: any
  ): Promise<void> {
    try {
      // Get current portfolio state
      const portfolio = await this.paperTradingManager.getPaperPortfolio();
      
      // Create enhanced context with real-time state
      const enhancedContext = {
        ...context,
        marketData,
        portfolioValue: portfolio.total_equity,
        availableCash: portfolio.available_buying_power,
        currentPositions: await this.paperTradingManager.getPaperPositions(),
        riskMetrics: this.state.riskStatus,
        recentAlerts: this.state.activeAlerts.slice(-5) // Last 5 alerts
      };

      // Create decision record
      const decision: AgentPaperTradingDecision = {
        decision_id: `decision-${Date.now()}`,
        agent_id: this.agentId,
        strategy_id: 'realtime-strategy',
        decision_type: 'entry',
        symbol: marketData.symbol,
        reasoning: 'Real-time market analysis',
        market_context: {
          price: marketData.close,
          volume: marketData.volume,
          volatility: 0.15, // Would calculate from market data
          trend: 'neutral',
          sentiment: 'neutral'
        },
        decision_factors: {
          technical_signals: [],
          fundamental_factors: [],
          risk_considerations: this.state.riskStatus.issues,
          market_conditions: ['real-time analysis']
        },
        confidence_level: 0.7,
        expected_outcome: {
          expected_return: 0.05,
          risk_reward_ratio: 2
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      // Store decision
      this.state.recentDecisions.push(decision);
      if (this.state.recentDecisions.length > 10) {
        this.state.recentDecisions.shift(); // Keep only last 10 decisions
      }

      // Emit decision event
      const accounts = await this.paperTradingManager.getPaperTradingAccounts();
      if (accounts.length > 0) {
        PaperTradingEventEmitter.emitAgentDecision(this.agentId, accounts[0].id, decision);
      }

    } catch (error) {
      console.error(`Error making real-time decision for agent ${this.agentId}:`, error);
    }
  }

  // Custom Event Handlers (Override these in subclasses)
  protected async onOrderFilled(data: any): Promise<void> {
    // Override in subclass for custom order fill handling
    console.log(`Default order fill handler for agent ${this.agentId}`);
  }

  protected async onPositionUpdated(data: any): Promise<void> {
    // Override in subclass for custom position update handling
    console.log(`Default position update handler for agent ${this.agentId}`);
  }

  protected async onRiskAlert(data: any): Promise<void> {
    // Override in subclass for custom risk alert handling
    console.log(`Default risk alert handler for agent ${this.agentId}`);
  }

  protected async onPerformanceUpdate(data: any): Promise<void> {
    // Override in subclass for custom performance update handling
    console.log(`Default performance update handler for agent ${this.agentId}`);
  }

  protected async onAccountUpdated(data: any): Promise<void> {
    // Override in subclass for custom account update handling
    console.log(`Default account update handler for agent ${this.agentId}`);
  }

  // Utility Methods
  private emitAgentEvent(eventType: string, data: any): void {
    console.log(`Agent ${this.agentId} event: ${eventType}`, data);
    // Could emit to a general agent event system
  }

  // Public API
  getState(): RealTimeAgentState {
    return { ...this.state };
  }

  isConnected(): boolean {
    return this.state.connected;
  }

  getActiveAlerts(): AgentPaperTradingAlert[] {
    return [...this.state.activeAlerts];
  }

  getRecentDecisions(): AgentPaperTradingDecision[] {
    return [...this.state.recentDecisions];
  }

  getCurrentPerformance(): any {
    return this.state.performanceSnapshot;
  }

  getRiskStatus(): typeof this.state.riskStatus {
    return { ...this.state.riskStatus };
  }

  // Event handler registration
  setEventHandler(eventType: string, handler: Function): void {
    this.eventHandlers.set(eventType, handler);
  }

  removeEventHandler(eventType: string): boolean {
    return this.eventHandlers.delete(eventType);
  }
}

// Factory function
export function createRealTimePaperTradingAgent(
  agentId: string,
  config?: Partial<RealTimeAgentConfig>
): RealTimePaperTradingAgent {
  return new RealTimePaperTradingAgent(agentId, config);
}