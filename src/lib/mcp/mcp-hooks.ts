/**
 * MCP React Hooks - React hooks for MCP integration
 * Provides easy-to-use React hooks for all MCP functionality
 * Includes real-time updates, error handling, and loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { mcpClient, MCPResponse, MCPTool, MCPServerConfig } from './mcp-client';

// Hook types
export interface MCPHookState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface MCPHealthStatus {
  initialized: boolean;
  servers: {
    total: number;
    online: number;
    offline: number;
  };
  tools: {
    total: number;
    available: number;
    unavailable: number;
  };
  specializations: string[];
}

// ==================== CORE MCP HOOKS ====================

/**
 * Initialize MCP client and track connection status
 */
export function useMCPClient() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<MCPHealthStatus | null>(null);
  
  const initializeClient = useCallback(async () => {
    if (isInitialized || isInitializing) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      await mcpClient.initialize();
      setIsInitialized(true);
      setHealthStatus(mcpClient.getHealthSummary());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize MCP client');
    } finally {
      setIsInitializing(false);
    }
  }, [isInitialized, isInitializing]);

  useEffect(() => {
    // Auto-initialize on mount
    initializeClient();

    // Listen for health updates
    const handleHealthUpdate = (status: any) => {
      setHealthStatus(mcpClient.getHealthSummary());
    };

    const handleInitialized = () => {
      setIsInitialized(true);
      setHealthStatus(mcpClient.getHealthSummary());
    };

    mcpClient.on('initialized', handleInitialized);
    mcpClient.on('health_update', handleHealthUpdate);

    return () => {
      mcpClient.off('initialized', handleInitialized);
      mcpClient.off('health_update', handleHealthUpdate);
    };
  }, [initializeClient]);

  return {
    isInitialized,
    isInitializing,
    error,
    healthStatus,
    reinitialize: initializeClient
  };
}

/**
 * Get available MCP tools with real-time updates
 */
export function useMCPTools() {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTools = () => {
      setTools(mcpClient.getAvailableTools());
      setLoading(false);
    };

    // Initial load
    updateTools();

    // Listen for tool updates
    mcpClient.on('initialized', updateTools);
    mcpClient.on('health_update', updateTools);

    return () => {
      mcpClient.off('initialized', updateTools);
      mcpClient.off('health_update', updateTools);
    };
  }, []);

  const getToolsByServer = useCallback((serverName: string) => {
    return mcpClient.getToolsByServer(serverName);
  }, []);

  const isToolAvailable = useCallback((toolName: string) => {
    return mcpClient.isToolAvailable(toolName);
  }, []);

  return {
    tools,
    loading,
    getToolsByServer,
    isToolAvailable,
    totalTools: tools.length,
    availableTools: tools.filter(t => mcpClient.isToolAvailable(t.name)).length
  };
}

/**
 * Generic hook for calling MCP tools
 */
export function useMCPTool<T = any>(
  toolName: string,
  autoCall: boolean = false,
  dependencies: any[] = []
) {
  const [state, setState] = useState<MCPHookState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const call = useCallback(async (arguments_: Record<string, any> = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await mcpClient.callTool<T>({
        tool_name: toolName,
        arguments: arguments_
      });

      if (response.success) {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
        return response;
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Tool call failed'
        }));
        return response;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, [toolName]);

  useEffect(() => {
    if (autoCall && mcpClient.isToolAvailable(toolName)) {
      call();
    }
  }, [autoCall, toolName, call, ...dependencies]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
  }, []);

  return {
    ...state,
    call,
    reset,
    isAvailable: mcpClient.isToolAvailable(toolName)
  };
}

// ==================== ARBITRAGE HOOKS ====================

/**
 * Hook for detecting arbitrage opportunities
 */
export function useArbitrageOpportunities(
  params: {
    min_profit_usd?: number;
    max_execution_time_s?: number;
    min_confidence_score?: number;
    chains?: string[];
    token_pairs?: string[];
  } = {},
  autoRefresh: boolean = true,
  refreshInterval: number = 5000
) {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const detectOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await mcpClient.detectArbitrageOpportunities(params);
      
      if (response.success && response.data) {
        setOpportunities(response.data.opportunities || []);
      } else {
        setError(response.error || 'Failed to detect opportunities');
        setOpportunities([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    // Initial call
    detectOpportunities();

    // Set up auto-refresh
    if (autoRefresh) {
      intervalRef.current = setInterval(detectOpportunities, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [detectOpportunities, autoRefresh, refreshInterval]);

  const executeOpportunity = useCallback(async (opportunityId: string, executionAmount?: number) => {
    return mcpClient.executeArbitrage({
      opportunity_id: opportunityId,
      execution_amount: executionAmount
    });
  }, []);

  return {
    opportunities,
    loading,
    error,
    refresh: detectOpportunities,
    executeOpportunity,
    totalOpportunities: opportunities.length,
    highProfitOpportunities: opportunities.filter(opp => opp.profit_percentage > 2).length
  };
}

/**
 * Hook for arbitrage performance metrics
 */
export function useArbitragePerformance(timeRangeHours: number = 24) {
  return useMCPTool(
    'get_arbitrage_performance',
    true,
    [timeRangeHours]
  );
}

// ==================== TRADING HOOKS ====================

/**
 * Hook for registering trading agents
 */
export function useAgentRegistration() {
  const [registrations, setRegistrations] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(false);

  const registerAgent = useCallback(async (params: {
    agent_id: string;
    agent_name: string;
    supported_chains: string[];
    risk_tolerance?: number;
    initial_funding?: number;
  }) => {
    setLoading(true);
    
    try {
      const response = await mcpClient.registerAgentForTrading(params);
      
      if (response.success) {
        setRegistrations(prev => new Map(prev.set(params.agent_id, response.data)));
      }
      
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRegistration = useCallback((agentId: string) => {
    return registrations.get(agentId);
  }, [registrations]);

  return {
    registrations: Array.from(registrations.values()),
    loading,
    registerAgent,
    getRegistration,
    totalRegistrations: registrations.size
  };
}

/**
 * Hook for agent portfolio management
 */
export function useAgentPortfolio(agentId: string, includePending: boolean = true) {
  const { data: portfolio, loading, error, call } = useMCPTool(
    'get_agent_portfolio',
    !!agentId,
    [agentId, includePending]
  );

  const refreshPortfolio = useCallback(() => {
    if (agentId) {
      return call({ agent_id: agentId, include_pending: includePending });
    }
  }, [agentId, includePending, call]);

  return {
    portfolio,
    loading,
    error,
    refresh: refreshPortfolio,
    totalValue: portfolio?.total_value_usd || 0,
    pnl: portfolio?.performance?.total_pnl || 0,
    pnlPercentage: portfolio?.performance?.total_pnl_percentage || 0
  };
}

/**
 * Hook for trading opportunities
 */
export function useTradingOpportunities(
  agentId: string,
  filters: {
    min_profit_percentage?: number;
    max_risk_score?: number;
    preferred_chains?: string[];
  } = {}
) {
  return useMCPTool(
    'get_trading_opportunities',
    !!agentId,
    [agentId, filters]
  );
}

// ==================== FUNDING HOOKS ====================

/**
 * Hook for funding management
 */
export function useFunding() {
  const [fundingRequests, setFundingRequests] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(false);

  const requestFunding = useCallback(async (params: {
    agent_id: string;
    amount: number;
    reason: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    strategy_type?: string;
    expected_return?: number;
    risk_level?: number;
  }) => {
    setLoading(true);
    
    try {
      const response = await mcpClient.requestFunding(params);
      
      if (response.success) {
        setFundingRequests(prev => new Map(prev.set(params.agent_id, response.data)));
      }
      
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFundingStatus = useCallback(async (agentId: string, includeHistory: boolean = false) => {
    return mcpClient.getFundingStatus({ agent_id: agentId, include_history: includeHistory });
  }, []);

  return {
    fundingRequests: Array.from(fundingRequests.values()),
    loading,
    requestFunding,
    getFundingStatus
  };
}

// ==================== PRICE HOOKS ====================

/**
 * Hook for real-time market data
 */
export function useMarketData(
  symbols: string[],
  includeAnalytics: boolean = false,
  autoRefresh: boolean = true,
  refreshInterval: number = 1000
) {
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchMarketData = useCallback(async () => {
    if (symbols.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await mcpClient.getLiveMarketData({
        symbols,
        include_analytics: includeAnalytics
      });
      
      if (response.success && response.data) {
        setMarketData(response.data.market_data || {});
      } else {
        setError(response.error || 'Failed to fetch market data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [symbols, includeAnalytics]);

  useEffect(() => {
    // Initial fetch
    fetchMarketData();

    // Set up auto-refresh
    if (autoRefresh && symbols.length > 0) {
      intervalRef.current = setInterval(fetchMarketData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchMarketData, autoRefresh, refreshInterval]);

  const subscribeToUpdates = useCallback(async (agentId: string, callbackUrl?: string) => {
    return mcpClient.subscribeRealTimePrices({
      agent_id: agentId,
      symbols,
      callback_url: callbackUrl,
      update_frequency_ms: 50
    });
  }, [symbols]);

  return {
    marketData,
    loading,
    error,
    refresh: fetchMarketData,
    subscribeToUpdates,
    symbols,
    dataAge: Object.values(marketData).length > 0 ? 
      Math.max(...Object.values(marketData).map((data: any) => 
        Date.now() - new Date(data.timestamp).getTime()
      )) : 0
  };
}

/**
 * Hook for price spread monitoring
 */
export function usePriceSpreads(
  tokenPairs: string[],
  thresholdPercentage: number = 0.5,
  chains?: string[]
) {
  return useMCPTool(
    'monitor_cross_exchange_spreads',
    tokenPairs.length > 0,
    [tokenPairs, thresholdPercentage, chains]
  );
}

// ==================== RISK MANAGEMENT HOOKS ====================

/**
 * Hook for portfolio risk assessment
 */
export function usePortfolioRisk(
  agentId: string,
  portfolioData?: any,
  includeStressTest: boolean = false
) {
  const { data: riskAssessment, loading, error, call } = useMCPTool(
    'assess_portfolio_risk',
    !!agentId,
    [agentId, portfolioData, includeStressTest]
  );

  const assessRisk = useCallback((customPortfolioData?: any) => {
    if (agentId) {
      return call({
        agent_id: agentId,
        portfolio_data: customPortfolioData || portfolioData,
        include_stress_test: includeStressTest
      });
    }
  }, [agentId, portfolioData, includeStressTest, call]);

  return {
    riskAssessment,
    loading,
    error,
    assessRisk,
    riskScore: riskAssessment?.risk_score || 0,
    riskLevel: riskAssessment?.risk_level || 'unknown',
    recommendations: riskAssessment?.overall_assessment?.recommendations || []
  };
}

/**
 * Hook for position sizing calculations
 */
export function usePositionSizing() {
  const [calculations, setCalculations] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateSizing = useCallback(async (params: {
    agent_id: string;
    trade_setups: any[];
    risk_per_trade?: number;
    portfolio_value?: number;
  }) => {
    setLoading(true);
    
    try {
      const response = await mcpClient.calculatePositionSizing(params);
      
      if (response.success) {
        setCalculations(response.data);
      }
      
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    calculations,
    loading,
    calculateSizing,
    recommendations: calculations?.position_recommendations || [],
    portfolioAnalysis: calculations?.portfolio_analysis || null
  };
}

/**
 * Hook for emergency controls
 */
export function useEmergencyControls() {
  const [emergencyStops, setEmergencyStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const executeEmergencyStop = useCallback(async (params: {
    agent_id?: string;
    stop_type: 'full_stop' | 'trading_halt' | 'position_close' | 'funding_freeze';
    reason: string;
    scope?: string[];
  }) => {
    setLoading(true);
    
    try {
      const response = await mcpClient.executeEmergencyStop(params);
      
      if (response.success) {
        setEmergencyStops(prev => [...prev, response.data]);
      }
      
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    emergencyStops,
    loading,
    executeEmergencyStop,
    totalStops: emergencyStops.length
  };
}

// ==================== MONITORING HOOKS ====================

/**
 * Hook for real-time MCP events
 */
export function useMCPEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [toolCalls, setToolCalls] = useState<any[]>([]);

  useEffect(() => {
    const handleToolSuccess = (event: any) => {
      setEvents(prev => [...prev.slice(-99), { ...event, type: 'success', timestamp: new Date() }]);
      setToolCalls(prev => [...prev.slice(-49), event]);
    };

    const handleToolError = (event: any) => {
      setEvents(prev => [...prev.slice(-99), { ...event, type: 'error', timestamp: new Date() }]);
    };

    mcpClient.on('tool_call_success', handleToolSuccess);
    mcpClient.on('tool_call_error', handleToolError);

    return () => {
      mcpClient.off('tool_call_success', handleToolSuccess);
      mcpClient.off('tool_call_error', handleToolError);
    };
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setToolCalls([]);
  }, []);

  return {
    events: events.slice(-20), // Last 20 events
    toolCalls: toolCalls.slice(-10), // Last 10 tool calls
    clearEvents,
    totalEvents: events.length,
    successfulCalls: toolCalls.filter(call => call.type !== 'error').length,
    averageLatency: toolCalls.length > 0 
      ? toolCalls.reduce((sum, call) => sum + (call.execution_time_ms || 0), 0) / toolCalls.length 
      : 0
  };
}

/**
 * Hook for MCP server health monitoring
 */
export function useMCPHealth() {
  const [serverStatus, setServerStatus] = useState<Record<string, MCPServerConfig>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const updateServerStatus = () => {
      setServerStatus(mcpClient.getServerStatus());
      setLastUpdate(new Date());
    };

    // Initial update
    updateServerStatus();

    // Listen for health updates
    mcpClient.on('health_update', updateServerStatus);
    mcpClient.on('initialized', updateServerStatus);

    return () => {
      mcpClient.off('health_update', updateServerStatus);
      mcpClient.off('initialized', updateServerStatus);
    };
  }, []);

  const servers = Object.values(serverStatus);
  const onlineServers = servers.filter(s => s.status === 'online');
  const offlineServers = servers.filter(s => s.status === 'offline');

  return {
    servers,
    onlineServers,
    offlineServers,
    lastUpdate,
    healthScore: servers.length > 0 ? (onlineServers.length / servers.length) * 100 : 0,
    totalServers: servers.length,
    isHealthy: onlineServers.length === servers.length
  };
}