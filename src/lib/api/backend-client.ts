/**
 * Backend API Client
 * Comprehensive client for connecting to the FastAPI backend
 */

export interface APIResponse<T = any> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export interface PortfolioSummary {
  total_equity: number
  cash_balance: number
  total_position_value: number
  total_unrealized_pnl: number
  total_realized_pnl: number
  total_pnl: number
  daily_pnl: number
  total_return_percent: number
  number_of_positions: number
  long_positions: number
  short_positions: number
  last_updated: string
}

export interface Position {
  symbol: string
  quantity: number
  avg_cost: number
  current_price: number
  market_value: number
  unrealized_pnl: number
  realized_pnl: number
  pnl_percent: number
  last_updated: string
}

export interface AgentStatus {
  id: string
  name: string
  strategy: string
  status: 'active' | 'paused' | 'stopped'
  performance: {
    total_pnl: number
    win_rate: number
    total_trades: number
    active_positions: number
  }
}

export interface AgentOverview {
  total_agents: number
  active_agents: number
  paused_agents: number
  agents: AgentStatus[]
}

export interface MarketData {
  symbol: string
  price: number
  change_24h: number
  change_percent_24h: number
  volume_24h: number
  market_cap?: number
  last_updated: string
}

export interface TradingOrder {
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price?: number
  order_type: 'market' | 'limit'
  strategy?: string
}

export interface OrderResponse {
  order_id: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  status: string
  timestamp: string
}

export interface TradingSignal {
  signal_id: string
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  strength: number
  confidence: number
  reasoning: string
  indicators: Record<string, number>
  timestamp: string
}

export interface RiskMetrics {
  portfolio_var: number
  sharpe_ratio: number
  max_drawdown: number
  beta: number
  alpha: number
  correlation_matrix: Record<string, Record<string, number>>
  position_sizes: Record<string, number>
  concentration_risk: number
  liquidity_risk: number
  last_updated: string
}

export interface MonitoringHealth {
  overall_status: 'healthy' | 'warning' | 'critical' | 'down'
  services: Record<string, any>
  system_metrics: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
    memory_available_gb: number
    disk_free_gb: number
  }
  critical_services: string[]
  warning_services: string[]
  active_alerts: number
  monitoring_enabled: boolean
  last_check: string
}

export interface SystemMetrics {
  cpu_percent: number
  cpu_avg_1m: number
  memory_percent: number
  memory_available_gb: number
  memory_avg_1m: number
  disk_percent: number
  disk_free_gb: number
  disk_avg_1m: number
  network_bytes_sent: number
  network_bytes_recv: number
  timestamp: string
}

export interface Alert {
  alert_id: string
  service: string
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  message: string
  metric: string
  threshold: number
  current_value: number
  timestamp: string
  acknowledged: boolean
  resolved: boolean
}

export interface LLMRequest {
  prompt: string
  context?: Record<string, any>
  model?: string
  max_tokens?: number
  temperature?: number
}

export interface LLMResponse {
  content: string
  model: string
  tokens_used: number
  cost_estimate: number
  timestamp: string
  success: boolean
  error?: string
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  score: number
  keywords: string[]
  summary: string
}

export interface TradingDecision {
  action: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  risk_level: 'low' | 'medium' | 'high'
  suggested_position_size: number
  stop_loss?: number
  take_profit?: number
}

export interface CalendarData {
  [date: string]: {
    trading_date: string
    total_pnl: number
    total_trades: number
    winning_trades: number
    active_agents: number
    net_profit: number
  }
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  type: 'trade' | 'analysis' | 'rebalance' | 'meeting' | 'market' | 'automated'
  date?: string
  time?: string
  cron_expression?: string
  priority: 'low' | 'medium' | 'high'
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed'
  recurring: boolean
  notifications: boolean
  agent_id?: string
  task_id?: string
}

export interface SchedulerStatus {
  service: string
  initialized: boolean
  running: boolean
  scheduled_tasks: number
  active_executions: number
  worker_count: number
  queue_size: number
  metrics: {
    tasks_executed_today: number
    successful_executions: number
    failed_executions: number
    average_execution_time: number
  }
}

class BackendClient {
  private baseURL: string
  private timeout: number = 10000

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Enhanced error handling with specific HTTP status codes
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorBody = await response.json()
          if (errorBody.detail) {
            errorMessage = errorBody.detail
          } else if (errorBody.message) {
            errorMessage = errorBody.message
          }
        } catch {
          // Use default status text if response body is not JSON
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Backend API Error [${endpoint}]:`, error)
      
      // Enhanced error response with no hardcoded fallback data
      const errorResponse: APIResponse<T> = {
        success: false,
        message: `Backend API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null as T,
        timestamp: new Date().toISOString(),
        // Add additional context for better error handling
        endpoint,
        baseURL: this.baseURL,
        errorType: error instanceof Error ? error.name : 'UnknownError',
        retryable: this.isRetryableError(error)
      }
      
      return errorResponse
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors and timeouts are retryable
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return true
      }
      
      // 5xx server errors are retryable
      if (error.message.includes('HTTP 5')) {
        return true
      }
      
      // Connection refused, network unreachable
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return true
      }
    }
    
    return false
  }

  // Portfolio endpoints
  async getPortfolioSummary(): Promise<APIResponse<PortfolioSummary>> {
    return this.request<PortfolioSummary>('/api/v1/portfolio/summary')
  }

  async getPositions(): Promise<APIResponse<Position[]>> {
    return this.request<Position[]>('/api/v1/portfolio/positions')
  }

  // Agent endpoints
  async getAgentsStatus(): Promise<APIResponse<AgentOverview>> {
    return this.request<AgentOverview>('/api/v1/agents/status')
  }

  async startAgent(agentId: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/agents/${agentId}/start`, { method: 'POST' })
  }

  async stopAgent(agentId: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/agents/${agentId}/stop`, { method: 'POST' })
  }

  async executeAgentDecision(agentId: string, context: any): Promise<APIResponse<any>> {
    return this.request(`/api/v1/agents/${agentId}/execute-decision`, {
      method: 'POST',
      body: JSON.stringify(context)
    })
  }

  async getAgentDecisions(agentId: string): Promise<APIResponse<any[]>> {
    return this.request<any[]>(`/api/v1/agents/${agentId}/decisions`)
  }

  async coordinateAgentDecision(participants: string[], context: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/agents/coordinate-decision', {
      method: 'POST',
      body: JSON.stringify({ participants, context })
    })
  }

  // Market data endpoints
  async getLiveMarketData(symbol: string): Promise<APIResponse<MarketData>> {
    return this.request<MarketData>(`/api/v1/market/live-data/${symbol}`)
  }

  async getWatchlist(): Promise<APIResponse<MarketData[]>> {
    return this.request<MarketData[]>('/api/v1/market/watchlist')
  }

  // Trading endpoints
  async createPaperOrder(order: TradingOrder): Promise<APIResponse<OrderResponse>> {
    return this.request<OrderResponse>('/api/v1/trading/paper/order', {
      method: 'POST',
      body: JSON.stringify(order)
    })
  }

  async getPaperPortfolio(): Promise<APIResponse<any>> {
    return this.request('/api/v1/trading/paper/portfolio')
  }

  async createOrder(order: TradingOrder): Promise<APIResponse<OrderResponse>> {
    return this.request<OrderResponse>('/api/v1/trading/order/create', {
      method: 'POST',
      body: JSON.stringify(order)
    })
  }

  async cancelOrder(orderId: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/trading/order/${orderId}`, { method: 'DELETE' })
  }

  async generateTradingSignals(symbols: string[]): Promise<APIResponse<TradingSignal[]>> {
    return this.request<TradingSignal[]>('/api/v1/trading/signals/generate', {
      method: 'POST',
      body: JSON.stringify({ symbols })
    })
  }

  async executeStrategy(strategy: string, context: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/trading/strategy/execute', {
      method: 'POST',
      body: JSON.stringify({ strategy, ...context })
    })
  }

  async optimizePortfolio(portfolio: any, targetAllocation: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/trading/portfolio/optimize', {
      method: 'POST',
      body: JSON.stringify({ portfolio, target_allocation: targetAllocation })
    })
  }

  async manageRisk(portfolio: any, marketData: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/trading/risk/manage', {
      method: 'POST',
      body: JSON.stringify({ portfolio, market_data: marketData })
    })
  }

  async getStrategyPerformance(strategy: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/trading/performance/${strategy}`)
  }

  async getTradingStatus(): Promise<APIResponse<any>> {
    return this.request('/api/v1/trading/status')
  }

  // Risk endpoints
  async getRiskMetrics(): Promise<APIResponse<RiskMetrics>> {
    return this.request<RiskMetrics>('/api/v1/risk/metrics')
  }

  // Autonomous Coordinator endpoints
  async getCoordinatorStatus(): Promise<APIResponse<any>> {
    return this.request('/api/v1/autonomous/coordinator/status')
  }

  async updateCoordinatorSettings(settings: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/autonomous/coordinator/update-settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  }

  async getSystemConnections(): Promise<APIResponse<any>> {
    return this.request('/api/v1/autonomous/system/connections')
  }

  // Agent Management endpoints
  async createAgent(agentData: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/agents/create', {
      method: 'POST',
      body: JSON.stringify(agentData)
    })
  }

  async updateAgent(agentId: string, agentData: any): Promise<APIResponse<any>> {
    return this.request(`/api/v1/agents/${agentId}/update`, {
      method: 'PUT',
      body: JSON.stringify(agentData)
    })
  }

  async deleteAgent(agentId: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/agents/${agentId}`, {
      method: 'DELETE'
    })
  }

  async startAgent(agentId: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/agents/${agentId}/start`, {
      method: 'POST'
    })
  }

  async stopAgent(agentId: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/agents/${agentId}/stop`, {
      method: 'POST'
    })
  }

  async getAgentPerformance(agentId: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/agents/${agentId}/performance`)
  }

  // Trading Operations endpoints
  async createTradingOrder(orderData: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/trading/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
  }

  async getTradingPositions(): Promise<APIResponse<any>> {
    return this.request('/api/v1/trading/positions')
  }

  async createTradingStrategy(strategyData: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/trading/strategies', {
      method: 'POST',
      body: JSON.stringify(strategyData)
    })
  }

  // Analytics endpoints
  async getPerformanceAnalytics(dateRange?: { start: string; end: string }): Promise<APIResponse<any>> {
    const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : ''
    return this.request(`/api/v1/analytics/performance${params}`)
  }

  async generateReport(reportType: string, parameters: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/analytics/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ report_type: reportType, parameters })
    })
  }

  // Farm Management endpoints
  async createFarm(farmData: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/farms/create', {
      method: 'POST',
      body: JSON.stringify(farmData)
    })
  }

  async updateFarm(farmId: string, farmData: any): Promise<APIResponse<any>> {
    return this.request(`/api/v1/farms/${farmId}/update`, {
      method: 'PUT',
      body: JSON.stringify(farmData)
    })
  }

  async getFarmPerformance(farmId: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/farms/${farmId}/performance`)
  }

  // Goals Management endpoints
  async createGoal(goalData: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/goals/create', {
      method: 'POST',
      body: JSON.stringify(goalData)
    })
  }

  async updateGoalProgress(goalId: string, progressData: any): Promise<APIResponse<any>> {
    return this.request(`/api/v1/goals/${goalId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(progressData)
    })
  }

  async getGoalAnalytics(): Promise<APIResponse<any>> {
    return this.request('/api/v1/goals/analytics')
  }

  // Utility method for storing agent configuration
  async storeAgentConfig(agentId: string, config: any): Promise<APIResponse<any>> {
    return this.request(`/api/v1/agents/${agentId}/config`, {
      method: 'POST',
      body: JSON.stringify(config)
    })
  }

  async runStressTest(scenarios: any): Promise<APIResponse<any>> {
    return this.request('/api/v1/risk/stress-test', {
      method: 'POST',
      body: JSON.stringify({ scenarios })
    })
  }

  // AI Services endpoints
  async generateLLMResponse(request: LLMRequest): Promise<APIResponse<LLMResponse>> {
    return this.request<LLMResponse>('/api/v1/ai/llm/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  async analyzeSentiment(text: string, context?: any): Promise<APIResponse<SentimentAnalysis>> {
    return this.request<SentimentAnalysis>('/api/v1/ai/sentiment/analyze', {
      method: 'POST',
      body: JSON.stringify({ text, context })
    })
  }

  async assessRisk(portfolio: any, scenarios?: string[]): Promise<APIResponse<any>> {
    return this.request('/api/v1/ai/risk/assess', {
      method: 'POST',
      body: JSON.stringify({ portfolio, scenarios })
    })
  }

  async getTradingDecision(symbol: string, marketData: any, portfolio: any): Promise<APIResponse<TradingDecision>> {
    return this.request<TradingDecision>('/api/v1/ai/trading/decision', {
      method: 'POST',
      body: JSON.stringify({ symbol, market_data: marketData, portfolio_context: portfolio })
    })
  }

  async getAIStatus(): Promise<APIResponse<any>> {
    return this.request('/api/v1/ai/status')
  }

  // Monitoring endpoints
  async getOverallHealth(): Promise<APIResponse<MonitoringHealth>> {
    return this.request<MonitoringHealth>('/api/v1/monitoring/health')
  }

  async getServiceHealth(serviceName: string): Promise<APIResponse<any>> {
    return this.request(`/api/v1/monitoring/service/${serviceName}`)
  }

  async getActiveAlerts(): Promise<APIResponse<{ total_alerts: number; alerts: Alert[] }>> {
    return this.request('/api/v1/monitoring/alerts')
  }

  async acknowledgeAlert(alertId: string): Promise<APIResponse<{ acknowledged: boolean }>> {
    return this.request(`/api/v1/monitoring/alerts/${alertId}/acknowledge`, { method: 'POST' })
  }

  async resolveAlert(alertId: string): Promise<APIResponse<{ resolved: boolean }>> {
    return this.request(`/api/v1/monitoring/alerts/${alertId}/resolve`, { method: 'POST' })
  }

  async getCircuitBreakers(): Promise<APIResponse<any>> {
    return this.request('/api/v1/monitoring/circuit-breakers')
  }

  async getSystemMetrics(): Promise<APIResponse<SystemMetrics>> {
    return this.request<SystemMetrics>('/api/v1/monitoring/system-metrics')
  }

  async getMonitoringStatus(): Promise<APIResponse<any>> {
    return this.request('/api/v1/monitoring/status')
  }

  // Performance endpoints
  async getCacheStats(): Promise<APIResponse<any>> {
    return this.request('/api/v1/performance/cache/stats')
  }

  async clearCache(): Promise<APIResponse<any>> {
    return this.request('/api/v1/performance/cache/clear', { method: 'POST' })
  }

  async getPerformanceMetrics(endpoint?: string): Promise<APIResponse<any>> {
    const url = endpoint ? `/api/v1/performance/metrics?endpoint=${endpoint}` : '/api/v1/performance/metrics'
    return this.request(url)
  }

  async getPerformanceReport(): Promise<APIResponse<any>> {
    return this.request('/api/v1/performance/report')
  }

  async optimizeConfiguration(): Promise<APIResponse<any>> {
    return this.request('/api/v1/performance/optimize', { method: 'POST' })
  }

  async optimizeMemory(): Promise<APIResponse<any>> {
    return this.request('/api/v1/performance/memory/optimize', { method: 'POST' })
  }

  async getPerformanceStatus(): Promise<APIResponse<any>> {
    return this.request('/api/v1/performance/status')
  }

  // Flash Loan endpoints
  async getFlashLoanOpportunities(filters?: {
    chain?: string
    riskLevel?: string
    minProfit?: number
  }): Promise<APIResponse<any>> {
    const params = new URLSearchParams()
    if (filters?.chain) params.append('chain', filters.chain)
    if (filters?.riskLevel) params.append('risk', filters.riskLevel)
    if (filters?.minProfit) params.append('min_profit', filters.minProfit.toString())
    
    return this.request(`/api/v1/flashloans/opportunities${params.toString() ? `?${params}` : ''}`)
  }

  async executeFlashLoan(data: {
    opportunity_id: string
    agent_id?: string
    strategy_id: string
    simulation_only?: boolean
  }): Promise<APIResponse<any>> {
    return this.request('/api/v1/flashloans/execute', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getFlashLoanProtocols(): Promise<APIResponse<any>> {
    return this.request('/api/v1/flashloans/protocols')
  }

  async getFlashLoanHistory(filters?: {
    agent_id?: string
    status?: string
    limit?: number
  }): Promise<APIResponse<any>> {
    const params = new URLSearchParams()
    if (filters?.agent_id) params.append('agent_id', filters.agent_id)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    return this.request(`/api/v1/flashloans/history${params.toString() ? `?${params}` : ''}`)
  }

  async getFlashLoanProfitRules(): Promise<APIResponse<any>> {
    return this.request('/api/v1/flashloans/profit-rules')
  }

  async createFlashLoanProfitRule(rule: {
    rule_name: string
    trigger_type: 'profit_amount' | 'profit_percentage' | 'opportunity_score'
    trigger_value: number
    secure_percentage: number
    reinvest_percentage: number
    reserve_percentage: number
    min_profit_usd: number
    max_loan_usd: number
  }): Promise<APIResponse<any>> {
    return this.request('/api/v1/flashloans/profit-rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    })
  }

  async getFlashLoanProfitHistory(filters?: {
    start_date?: string
    end_date?: string
    agent_id?: string
  }): Promise<APIResponse<any>> {
    const params = new URLSearchParams()
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)
    if (filters?.agent_id) params.append('agent_id', filters.agent_id)
    
    return this.request(`/api/v1/flashloans/profit-history${params.toString() ? `?${params}` : ''}`)
  }

  async distributeFlashLoanProfits(txId: string, distribution: {
    secured_amount: number
    reinvested_amount: number
    reserved_amount: number
    goal_contribution: number
  }): Promise<APIResponse<any>> {
    return this.request(`/api/v1/flashloans/transactions/${txId}/distribute-profits`, {
      method: 'POST',
      body: JSON.stringify(distribution)
    })
  }

  async getFlashLoanStats(): Promise<APIResponse<any>> {
    return this.request('/api/v1/flashloans/stats')
  }

  // HyperLend endpoints
  async getHyperLendPositions(): Promise<APIResponse<any>> {
    return this.request('/api/v1/hyperlend/positions')
  }

  async createHyperLendPosition(position: {
    asset: string
    amount: number
    leverage: number
    collateral: number
  }): Promise<APIResponse<any>> {
    return this.request('/api/v1/hyperlend/positions', {
      method: 'POST',
      body: JSON.stringify(position)
    })
  }

  // Market overview
  async getMarketOverview(): Promise<APIResponse<any>> {
    return this.request('/api/v1/market/overview')
  }

  // Profit tracking
  async getProfitTracking(filters?: {
    period?: string
    agent_id?: string
  }): Promise<APIResponse<any>> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.agent_id) params.append('agent_id', filters.agent_id)
    
    return this.request(`/api/v1/profit-tracking${params.toString() ? `?${params}` : ''}`)
  }

  // Calendar endpoints
  async getCalendarData(year: number, month: number): Promise<APIResponse<any>> {
    return this.request(`/api/v1/calendar/data/${year}/${month}`)
  }

  async getCalendarEvents(startDate?: string, endDate?: string): Promise<APIResponse<any>> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    return this.request(`/api/v1/calendar/events${params.toString() ? `?${params}` : ''}`)
  }

  async createCalendarEvent(eventData: {
    title: string
    description?: string
    type: string
    date: string
    time: string
    priority?: string
    agent_id?: string
    recurring?: boolean
    notifications?: boolean
  }): Promise<APIResponse<any>> {
    return this.request('/api/v1/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    })
  }

  async getSchedulerStatus(): Promise<APIResponse<any>> {
    return this.request('/api/v1/calendar/scheduler/status')
  }

  // Service registry
  async getServicesStatus(): Promise<APIResponse<any>> {
    return this.request('/api/v1/services')
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string; version: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`)
      return await response.json()
    } catch (error) {
      return {
        status: 'disconnected',
        service: 'cival-backend-api',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Utility methods
  setBaseURL(url: string) {
    this.baseURL = url
  }

  setBackendUrl(url: string) {
    this.baseURL = url
  }

  getBackendUrl(): string {
    return this.baseURL
  }

  setTimeout(timeout: number) {
    this.timeout = timeout
  }

  async testConnection(): Promise<boolean> {
    try {
      const health = await this.healthCheck()
      return health.status === 'healthy'
    } catch {
      return false
    }
  }

  // Additional methods needed by the hooks
  async getHealth(): Promise<APIResponse<any>> {
    return this.request('/health')
  }

  async getPortfolioPositions(): Promise<APIResponse<Position[]>> {
    return this.getPositions()
  }

  async getMarketData(symbol: string): Promise<APIResponse<MarketData>> {
    return this.getLiveMarketData(symbol)
  }

  async getTradingSignals(): Promise<APIResponse<any[]>> {
    return this.generateTradingSignals(['BTCUSD', 'ETHUSD', 'SOLUSD'])
  }

  async getPerformanceMetrics(): Promise<APIResponse<any>> {
    return this.getPerformanceReport()
  }
}

// Export singleton instance
export const backendClient = new BackendClient()

// Remove duplicate export - using the new implementation below

// Export for custom instances
export { BackendClient }

// Export all types
export type {
  PortfolioSummary,
  Position,
  AgentStatus,
  AgentOverview,
  MarketData,
  TradingOrder,
  OrderResponse,
  TradingSignal,
  RiskMetrics,
  MonitoringHealth,
  SystemMetrics,
  Alert,
  LLMRequest,
  LLMResponse,
  SentimentAnalysis,
  TradingDecision,
  CalendarData,
  CalendarEvent,
  SchedulerStatus
}

// Simple Backend API Client implementation
class BackendAPIClient {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  async getFlashLoanOpportunities(filters?: any): Promise<APIResponse<any>> {
    try {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${this.baseURL}/api/v1/flashloan/opportunities?${params}`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Flash loan opportunities unavailable',
        data: [],
        timestamp: new Date().toISOString()
      }
    }
  }

  async executeFlashLoan(data: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/flashloan/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Flash loan execution failed',
        data: null,
        timestamp: new Date().toISOString()
      }
    }
  }

  async getFlashLoanProtocols(): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/flashloan/protocols`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Flash loan protocols unavailable',
        data: [],
        timestamp: new Date().toISOString()
      }
    }
  }

  // Core Trading Methods
  async getPortfolioSummary(): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/portfolio/summary`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Portfolio unavailable',
        data: { totalValue: 0, dailyPnL: 0, positions: [] },
        timestamp: new Date().toISOString()
      }
    }
  }

  async getAgentStatus(): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/agents/status`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Agent status unavailable',
        data: { activeAgents: 0, totalAgents: 0 },
        timestamp: new Date().toISOString()
      }
    }
  }

  async getMarketData(symbols: string[] = ['BTC', 'ETH']): Promise<APIResponse<any>> {
    try {
      const params = new URLSearchParams({ symbols: symbols.join(',') })
      const response = await fetch(`${this.baseURL}/api/v1/market/live-data?${params}`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Market data unavailable',
        data: [],
        timestamp: new Date().toISOString()
      }
    }
  }

  async executeOrder(order: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/trading/paper/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      })
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Order execution failed',
        data: null,
        timestamp: new Date().toISOString()
      }
    }
  }

  async getRiskMetrics(): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/risk/metrics`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Risk metrics unavailable',
        data: { var: 0, sharpeRatio: 0, maxDrawdown: 0 },
        timestamp: new Date().toISOString()
      }
    }
  }

  async getStrategyPerformance(): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/strategies/performance`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Strategy performance unavailable',
        data: [],
        timestamp: new Date().toISOString()
      }
    }
  }

  async createStrategy(strategy: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy)
      })
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Strategy creation failed',
        data: null,
        timestamp: new Date().toISOString()
      }
    }
  }

  async startAgent(agentId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/agents/${agentId}/start`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Agent start failed',
        data: null,
        timestamp: new Date().toISOString()
      }
    }
  }

  async stopAgent(agentId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/agents/${agentId}/stop`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Agent stop failed',
        data: null,
        timestamp: new Date().toISOString()
      }
    }
  }

  async getSystemHealth(): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/health`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'System health check failed',
        data: { status: 'offline' },
        timestamp: new Date().toISOString()
      }
    }
  }

  // Add missing methods for LiveMarketDataPanel
  async fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
    const { timeout = 10000, ...fetchOptions } = options
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  getBackendUrl(): string {
    return this.baseURL
  }
}

export const backendApi = new BackendAPIClient()