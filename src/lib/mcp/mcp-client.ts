/**
 * MCP Client - Universal Model Context Protocol Client
 * Connects dashboard to all MCP servers with automatic discovery and routing
 * Provides unified interface for all 31+ MCP tools across 5 specialized servers
 */

import { EventEmitter } from 'events';

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  host: string;
  port: number;
  endpoint: string;
  capabilities: string[];
  tools_count: number;
  specialization: string;
  status: 'online' | 'offline' | 'error';
  latency_ms?: number;
}

// MCP Tool Definitions
export interface MCPTool {
  name: string;
  description: string;
  server: string;
  inputSchema: any;
  estimated_latency_ms?: number;
}

// MCP Request/Response Types
export interface MCPRequest {
  tool_name: string;
  arguments: Record<string, any>;
  agent_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout_ms?: number;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  execution_time_ms?: number;
  server_used?: string;
  agent_id?: string;
}

// Specialized response types
export interface ArbitrageOpportunity {
  opportunity_id: string;
  token_pair: string;
  profit_percentage: number;
  net_profit: number;
  execution_time_estimate: number;
  confidence_score: number;
  chains: string[];
}

export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume_24h: number;
  change_24h_percentage: number;
  timestamp: string;
  latency_ms: number;
}

export interface RiskAssessment {
  agent_id: string;
  portfolio_value: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_metrics: {
    value_at_risk: any;
    concentration_risk: any;
    market_risk: any;
  };
}

export interface AgentRegistration {
  agent_id: string;
  registration_status: 'success' | 'failed';
  mcp_access_granted: boolean;
  available_tools: number;
  capabilities: Record<string, boolean>;
}

export interface FundingRequest {
  request_id: string;
  agent_id: string;
  requested_amount: number;
  status: 'submitted' | 'approved' | 'rejected';
  approval_probability: number;
}

export class MCPClient extends EventEmitter {
  private servers: Map<string, MCPServerConfig> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private serverHealth: Map<string, boolean> = new Map();
  private isInitialized = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeServers();
  }

  /**
   * Initialize MCP server configurations
   */
  private initializeServers() {
    const serverConfigs: MCPServerConfig[] = [
      {
        name: 'hft_arbitrage_mcp',
        host: 'localhost',
        port: 8001,
        endpoint: 'http://localhost:8001',
        capabilities: ['arbitrage_detection', 'execution', 'performance_monitoring'],
        tools_count: 6,
        specialization: 'High-frequency arbitrage with sub-100ms execution',
        status: 'offline'
      },
      {
        name: 'multichain_trading_mcp',
        host: 'localhost',
        port: 8002,
        endpoint: 'http://localhost:8002',
        capabilities: ['cross_chain_trading', 'bridging', 'portfolio_management', 'agent_registration'],
        tools_count: 8,
        specialization: 'Multi-chain trading across 6 blockchains',
        status: 'offline'
      },
      {
        name: 'agent_funding_mcp',
        host: 'localhost',
        port: 8003,
        endpoint: 'http://localhost:8003',
        capabilities: ['funding_requests', 'performance_allocation', 'analytics'],
        tools_count: 6,
        specialization: 'Autonomous capital allocation and funding',
        status: 'offline'
      },
      {
        name: 'realtime_price_mcp',
        host: 'localhost',
        port: 8004,
        endpoint: 'http://localhost:8004',
        capabilities: ['price_feeds', 'spread_monitoring', 'market_data'],
        tools_count: 5,
        specialization: 'Sub-50ms price feeds and market analysis',
        status: 'offline'
      },
      {
        name: 'risk_management_mcp',
        host: 'localhost',
        port: 8005,
        endpoint: 'http://localhost:8005',
        capabilities: ['risk_assessment', 'exposure_monitoring', 'emergency_controls'],
        tools_count: 6,
        specialization: 'Portfolio risk and emergency controls',
        status: 'offline'
      }
    ];

    serverConfigs.forEach(config => {
      this.servers.set(config.name, config);
      this.serverHealth.set(config.name, false);
    });
  }

  /**
   * Initialize MCP client and discover available tools
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[MCP Client] Initializing connection to MCP servers...');
      
      // Check server health and discover tools
      await this.discoverServers();
      await this.discoverTools();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.isInitialized = true;
      this.emit('initialized', {
        servers: Array.from(this.servers.values()),
        tools: Array.from(this.tools.values()),
        total_tools: this.tools.size
      });

      console.log(`[MCP Client] Initialized with ${this.servers.size} servers and ${this.tools.size} tools`);
      
    } catch (error) {
      console.error('[MCP Client] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Discover available MCP servers
   */
  private async discoverServers(): Promise<void> {
    const healthChecks = Array.from(this.servers.entries()).map(async ([name, config]) => {
      try {
        const response = await fetch(`${config.endpoint}/health`, {
          method: 'GET',
          timeout: 5000
        });

        if (response.ok) {
          const healthData = await response.json();
          config.status = 'online';
          this.serverHealth.set(name, true);
          
          // Get detailed status
          const statusResponse = await fetch(`${config.endpoint}/status`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            config.latency_ms = Date.now() - performance.now();
          }
          
          console.log(`[MCP Client] Server ${name} is online`);
        } else {
          config.status = 'error';
          this.serverHealth.set(name, false);
        }
      } catch (error) {
        config.status = 'offline';
        this.serverHealth.set(name, false);
        console.warn(`[MCP Client] Server ${name} is offline:`, error);
      }
    });

    await Promise.allSettled(healthChecks);
  }

  /**
   * Discover available tools from all servers
   */
  private async discoverTools(): Promise<void> {
    const toolDiscovery = Array.from(this.servers.entries()).map(async ([serverName, config]) => {
      if (config.status !== 'online') return;

      try {
        const response = await fetch(`${config.endpoint}/mcp/tools`, {
          method: 'GET',
          timeout: 5000
        });

        if (response.ok) {
          const toolsData = await response.json();
          const tools: MCPTool[] = toolsData.tools || [];
          
          tools.forEach((tool: any) => {
            const mcpTool: MCPTool = {
              name: tool.name,
              description: tool.description,
              server: serverName,
              inputSchema: tool.inputSchema,
              estimated_latency_ms: this.estimateToolLatency(serverName, tool.name)
            };
            
            this.tools.set(tool.name, mcpTool);
          });

          console.log(`[MCP Client] Discovered ${tools.length} tools from ${serverName}`);
        }
      } catch (error) {
        console.error(`[MCP Client] Failed to discover tools from ${serverName}:`, error);
      }
    });

    await Promise.allSettled(toolDiscovery);
  }

  /**
   * Estimate tool execution latency based on server and tool type
   */
  private estimateToolLatency(serverName: string, toolName: string): number {
    const baseLatencies: Record<string, number> = {
      'hft_arbitrage_mcp': 50,     // Sub-100ms guarantee
      'multichain_trading_mcp': 200, // Cross-chain operations
      'agent_funding_mcp': 100,     // Database operations
      'realtime_price_mcp': 25,     // Sub-50ms guarantee
      'risk_management_mcp': 150    // Complex calculations
    };

    const toolMultipliers: Record<string, number> = {
      'detect_arbitrage_opportunities': 0.5,
      'execute_arbitrage': 2.0,
      'subscribe_real_time_prices': 0.3,
      'assess_portfolio_risk': 3.0,
      'execute_emergency_stop': 0.8,
      'register_agent_for_trading': 1.5
    };

    const baseLatency = baseLatencies[serverName] || 100;
    const multiplier = toolMultipliers[toolName] || 1.0;
    
    return Math.round(baseLatency * multiplier);
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.discoverServers();
      
      // Emit health status
      const healthStatus = {
        total_servers: this.servers.size,
        online_servers: Array.from(this.serverHealth.values()).filter(Boolean).length,
        server_status: Object.fromEntries(
          Array.from(this.servers.entries()).map(([name, config]) => [
            name, 
            { status: config.status, latency_ms: config.latency_ms }
          ])
        )
      };
      
      this.emit('health_update', healthStatus);
    }, 30000); // Check every 30 seconds
  }

  /**
   * Execute MCP tool call with automatic server routing
   */
  async callTool<T = any>(request: MCPRequest): Promise<MCPResponse<T>> {
    const tool = this.tools.get(request.tool_name);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${request.tool_name}' not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`
      };
    }

    const server = this.servers.get(tool.server);
    if (!server || server.status !== 'online') {
      return {
        success: false,
        error: `Server '${tool.server}' is not available for tool '${request.tool_name}'`
      };
    }

    const startTime = performance.now();

    try {
      const requestBody = {
        name: request.tool_name,
        arguments: request.arguments,
        agent_id: request.agent_id
      };

      const response = await fetch(`${server.endpoint}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(request.timeout_ms || 30000)
      });

      const responseData = await response.json();
      const executionTime = performance.now() - startTime;

      if (response.ok && responseData.success) {
        // Emit successful tool call
        this.emit('tool_call_success', {
          tool_name: request.tool_name,
          server: tool.server,
          execution_time_ms: executionTime,
          agent_id: request.agent_id
        });

        return {
          success: true,
          data: responseData.data,
          execution_time_ms: executionTime,
          server_used: tool.server,
          agent_id: request.agent_id
        };
      } else {
        // Emit failed tool call
        this.emit('tool_call_error', {
          tool_name: request.tool_name,
          server: tool.server,
          error: responseData.error || 'Unknown error',
          agent_id: request.agent_id
        });

        return {
          success: false,
          error: responseData.error || 'Tool execution failed',
          execution_time_ms: executionTime,
          server_used: tool.server
        };
      }
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      this.emit('tool_call_error', {
        tool_name: request.tool_name,
        server: tool.server,
        error: error instanceof Error ? error.message : 'Network error',
        agent_id: request.agent_id
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        execution_time_ms: executionTime,
        server_used: tool.server
      };
    }
  }

  // ==================== ARBITRAGE TOOLS ====================

  /**
   * Detect arbitrage opportunities
   */
  async detectArbitrageOpportunities(params: {
    min_profit_usd?: number;
    max_execution_time_s?: number;
    min_confidence_score?: number;
    chains?: string[];
    token_pairs?: string[];
  }): Promise<MCPResponse<{ opportunities: ArbitrageOpportunity[] }>> {
    return this.callTool({
      tool_name: 'detect_arbitrage_opportunities',
      arguments: params,
      priority: 'high'
    });
  }

  /**
   * Execute arbitrage opportunity
   */
  async executeArbitrage(params: {
    opportunity_id: string;
    execution_amount?: number;
    max_slippage?: number;
    gas_price_gwei?: number;
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'execute_arbitrage',
      arguments: params,
      priority: 'critical',
      timeout_ms: 60000
    });
  }

  /**
   * Get arbitrage performance metrics
   */
  async getArbitragePerformance(params: {
    time_range_hours?: number;
    include_failed?: boolean;
  } = {}): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'get_arbitrage_performance',
      arguments: params
    });
  }

  // ==================== TRADING TOOLS ====================

  /**
   * Register agent for trading with automatic MCP access
   */
  async registerAgentForTrading(params: {
    agent_id: string;
    agent_name: string;
    supported_chains: string[];
    risk_tolerance?: number;
    initial_funding?: number;
  }): Promise<MCPResponse<AgentRegistration>> {
    return this.callTool({
      tool_name: 'register_agent_for_trading',
      arguments: params,
      priority: 'high',
      agent_id: params.agent_id
    });
  }

  /**
   * Execute multi-chain trade
   */
  async executeMultichainTrade(params: {
    agent_id: string;
    source_chain: string;
    target_chain: string;
    token_in: string;
    token_out: string;
    amount_in: number;
    max_slippage?: number;
    deadline_minutes?: number;
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'execute_multichain_trade',
      arguments: params,
      priority: 'high',
      agent_id: params.agent_id,
      timeout_ms: 120000
    });
  }

  /**
   * Get agent portfolio across all chains
   */
  async getAgentPortfolio(params: {
    agent_id: string;
    include_pending?: boolean;
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'get_agent_portfolio',
      arguments: params,
      agent_id: params.agent_id
    });
  }

  /**
   * Get trading opportunities for agent
   */
  async getTradingOpportunities(params: {
    agent_id: string;
    min_profit_percentage?: number;
    max_risk_score?: number;
    preferred_chains?: string[];
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'get_trading_opportunities',
      arguments: params,
      agent_id: params.agent_id
    });
  }

  // ==================== FUNDING TOOLS ====================

  /**
   * Request funding for agent
   */
  async requestFunding(params: {
    agent_id: string;
    amount: number;
    reason: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    strategy_type?: string;
    expected_return?: number;
    risk_level?: number;
  }): Promise<MCPResponse<FundingRequest>> {
    return this.callTool({
      tool_name: 'request_funding',
      arguments: params,
      priority: params.urgency || 'medium',
      agent_id: params.agent_id
    });
  }

  /**
   * Get funding status for agent
   */
  async getFundingStatus(params: {
    agent_id: string;
    include_history?: boolean;
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'get_funding_status',
      arguments: params,
      agent_id: params.agent_id
    });
  }

  /**
   * Update agent performance metrics
   */
  async updatePerformanceMetrics(params: {
    agent_id: string;
    total_return: number;
    daily_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    trade_count: number;
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'update_performance_metrics',
      arguments: params,
      agent_id: params.agent_id
    });
  }

  // ==================== PRICE TOOLS ====================

  /**
   * Subscribe to real-time price feeds
   */
  async subscribeRealTimePrices(params: {
    agent_id: string;
    symbols: string[];
    callback_url?: string;
    update_frequency_ms?: number;
    include_order_book?: boolean;
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'subscribe_real_time_prices',
      arguments: params,
      agent_id: params.agent_id
    });
  }

  /**
   * Get live market data
   */
  async getLiveMarketData(params: {
    symbols: string[];
    timeframe?: string;
    depth?: number;
    include_analytics?: boolean;
  }): Promise<MCPResponse<{ market_data: Record<string, MarketData> }>> {
    return this.callTool({
      tool_name: 'get_live_market_data',
      arguments: params,
      priority: 'high'
    });
  }

  /**
   * Monitor cross-exchange spreads
   */
  async monitorCrossExchangeSpreads(params: {
    token_pairs: string[];
    threshold_percentage?: number;
    chains?: string[];
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'monitor_cross_exchange_spreads',
      arguments: params
    });
  }

  // ==================== RISK MANAGEMENT TOOLS ====================

  /**
   * Assess portfolio risk
   */
  async assessPortfolioRisk(params: {
    agent_id: string;
    portfolio_data?: any;
    include_stress_test?: boolean;
    risk_horizon_days?: number;
  }): Promise<MCPResponse<RiskAssessment>> {
    return this.callTool({
      tool_name: 'assess_portfolio_risk',
      arguments: params,
      agent_id: params.agent_id
    });
  }

  /**
   * Monitor real-time risk
   */
  async monitorRealTimeRisk(params: {
    agent_id: string;
    monitoring_rules: any;
    alert_thresholds: Record<string, number>;
    auto_actions?: Record<string, string>;
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'monitor_real_time_risk',
      arguments: params,
      agent_id: params.agent_id
    });
  }

  /**
   * Calculate optimal position sizing
   */
  async calculatePositionSizing(params: {
    agent_id: string;
    trade_setups: any[];
    risk_per_trade?: number;
    portfolio_value?: number;
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'calculate_position_sizing',
      arguments: params,
      agent_id: params.agent_id
    });
  }

  /**
   * Execute emergency stop
   */
  async executeEmergencyStop(params: {
    agent_id?: string;
    stop_type: 'full_stop' | 'trading_halt' | 'position_close' | 'funding_freeze';
    reason: string;
    scope?: string[];
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'execute_emergency_stop',
      arguments: params,
      priority: 'critical',
      agent_id: params.agent_id,
      timeout_ms: 10000
    });
  }

  /**
   * Validate trading limits
   */
  async validateTradingLimits(params: {
    agent_id: string;
    proposed_trades: any[];
    check_correlations?: boolean;
    check_liquidity?: boolean;
  }): Promise<MCPResponse<any>> {
    return this.callTool({
      tool_name: 'validate_trading_limits',
      arguments: params,
      agent_id: params.agent_id
    });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get all available tools
   */
  getAvailableTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by server
   */
  getToolsByServer(serverName: string): MCPTool[] {
    return Array.from(this.tools.values()).filter(tool => tool.server === serverName);
  }

  /**
   * Get server status
   */
  getServerStatus(): Record<string, MCPServerConfig> {
    return Object.fromEntries(this.servers.entries());
  }

  /**
   * Check if specific tool is available
   */
  isToolAvailable(toolName: string): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) return false;
    
    const server = this.servers.get(tool.server);
    return server?.status === 'online' || false;
  }

  /**
   * Get health summary
   */
  getHealthSummary() {
    const onlineServers = Array.from(this.servers.values()).filter(s => s.status === 'online');
    const availableTools = Array.from(this.tools.values()).filter(t => this.isToolAvailable(t.name));
    
    return {
      initialized: this.isInitialized,
      servers: {
        total: this.servers.size,
        online: onlineServers.length,
        offline: this.servers.size - onlineServers.length
      },
      tools: {
        total: this.tools.size,
        available: availableTools.length,
        unavailable: this.tools.size - availableTools.length
      },
      specializations: onlineServers.map(s => s.specialization)
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.removeAllListeners();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();