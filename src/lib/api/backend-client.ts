/**
 * Backend API Client
 * Centralized client for connecting to the Python AI Services backend
 * Enhanced with JWT authentication and session management
 */

// Solo operator mode - no authentication required
// import { authService } from '@/lib/auth/auth-service'

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface PortfolioSummary {
  total_equity: number;
  cash_balance: number;
  total_position_value: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  total_pnl: number;
  daily_pnl: number;
  total_return_percent: number;
  number_of_positions: number;
  long_positions: number;
  short_positions: number;
  last_updated: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  pnl_percent: number;
  last_updated: string;
}

export interface TradingSignal {
  symbol: string;
  signal: 'buy' | 'sell' | 'hold';
  strength: number;
  confidence: number;
  predicted_change_pct: number;
  reasoning: string;
  generated_at: string;
  source: string;
}

export interface AgentStatus {
  agent_id: string;
  name: string;
  status: 'active' | 'monitoring' | 'paused' | 'error';
  strategy: string;
  current_allocation: number;
  pnl: number;
  trades_today: number;
  win_rate: number;
  last_action: string;
  last_updated: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change_pct: number;
  volatility: number;
  volume: number;
  market_cap: number;
  last_updated: string;
}

export interface MarketOverview {
  market_data: MarketData[];
  market_sentiment: {
    overall: string;
    score: number;
    fear_greed_index: number;
    vix: number;
  };
  timestamp: string;
}

export interface PerformanceMetrics {
  total_return_percent: number;
  total_pnl: number;
  daily_pnl: number;
  win_rate: number;
  sharpe_ratio: number;
  volatility: number;
  max_drawdown: number;
  total_trades: number;
  total_equity: number;
  initial_equity: number;
  best_trade: number;
  worst_trade: number;
  avg_trade: number;
  last_updated: string;
}

export interface ServiceStatus {
  service: string;
  status: string;
  last_health_check: string;
  [key: string]: any;
}

export interface HealthCheck {
  status: string;
  services: Record<string, ServiceStatus>;
  timestamp: string;
}

class BackendApiClient {
  private baseUrl: string;
  private timeout: number;
  constructor() {
    // Auto-detect backend URL based on environment
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                   process.env.BACKEND_URL || 
                   'http://localhost:8000';
    this.timeout = 10000; // 10 second timeout
  }

  // Authentication is now handled by the auth service

  private async fetchWithTimeout(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(options.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers) 
            ? options.headers as Record<string, string> 
            : {}),
        };

        // Solo operator mode - no authentication headers needed
        // const authHeader = authService.getAuthHeader();
        // Object.assign(headers, authHeader);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers,
        });
        
        clearTimeout(timeoutId);
        
        // If response is successful or client error (4xx), don't retry
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }
        
        // Server error (5xx) - retry if not last attempt
        if (attempt < retries) {
          console.warn(`Attempt ${attempt} failed with status ${response.status}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (attempt < retries && (error instanceof Error && error.name !== 'AbortError')) {
          console.warn(`Attempt ${attempt} failed with error: ${error.message}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        
        throw error;
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to get more detailed error from response body
        try {
          const errorBody = await response.text();
          if (errorBody) {
            const parsedError = JSON.parse(errorBody);
            errorMessage = parsedError.detail || parsedError.message || errorMessage;
          }
        } catch {
          // If parsing fails, use the default error message
        }
        
        return {
          error: errorMessage,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('API Response Error:', errorMessage);
      return {
        error: `Response parsing error: ${errorMessage}`,
        status: response.status,
      };
    }
  }

  // Health and System
  async getHealth(): Promise<ApiResponse<HealthCheck>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`);
      return this.handleResponse<HealthCheck>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  async getSystemInfo(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  async getServices(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/services`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  // Portfolio Management
  async getPortfolioSummary(): Promise<ApiResponse<PortfolioSummary>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/portfolio/summary`);
      return this.handleResponse<PortfolioSummary>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  async getPortfolioPositions(): Promise<ApiResponse<Position[]>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/portfolio/positions`);
      return this.handleResponse<Position[]>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  // Market Data
  async getMarketData(symbol: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/market-data/${symbol}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  async getMarketOverview(): Promise<ApiResponse<MarketOverview>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/market/overview`);
      return this.handleResponse<MarketOverview>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  // Trading
  async getTradingSignals(): Promise<ApiResponse<TradingSignal[]>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/trading/signals`);
      return this.handleResponse<TradingSignal[]>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  // Agents
  async getAgentsStatus(): Promise<ApiResponse<AgentStatus[]>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/status`);
      return this.handleResponse<AgentStatus[]>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  // Enhanced Agent Management
  async executeAgentDecision(agentId: string, decisionParams: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/execute-decision`, {
        method: 'POST',
        body: JSON.stringify(decisionParams)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to execute agent decision',
        status: 0,
      };
    }
  }

  async startAgent(agentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/start`, {
        method: 'POST'
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to start agent',
        status: 0,
      };
    }
  }

  async stopAgent(agentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/stop`, {
        method: 'POST'
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to stop agent',
        status: 0,
      };
    }
  }

  async getAgentDecisions(agentId: string, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/decisions?limit=${limit}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get agent decisions',
        status: 0,
      };
    }
  }

  async coordinateAgentDecision(coordinationParams: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/coordinate-decision`, {
        method: 'POST',
        body: JSON.stringify(coordinationParams)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to coordinate agent decision',
        status: 0,
      };
    }
  }

  // Performance
  async getPerformanceMetrics(): Promise<ApiResponse<PerformanceMetrics>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/performance/metrics`);
      return this.handleResponse<PerformanceMetrics>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Connection failed',
        status: 0,
      };
    }
  }

  // Utility method to test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.getHealth();
      return response.status === 200 && !response.error;
    } catch {
      return false;
    }
  }

  // Method to get backend URL for debugging
  getBackendUrl(): string {
    return this.baseUrl;
  }

  // Method to update backend URL dynamically
  setBackendUrl(url: string): void {
    this.baseUrl = url;
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{token: string, user: any}>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      const result = await this.handleResponse<{token: string, user: any}>(response);
      
      // Authentication is handled by the auth service
      // Token management is no longer needed in the API client
      
      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Login failed',
        status: 0,
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Solo operator mode - no logout needed
      // if (authService.isAuthenticated()) {
      //   await this.fetchWithTimeout(`${this.baseUrl}/api/v1/auth/logout`, {
      //     method: 'POST'
      //   });
      // }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async refreshToken(): Promise<ApiResponse<{token: string}>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST'
      });
      
      const result = await this.handleResponse<{token: string}>(response);
      
      // Token refresh is handled by the auth service
      
      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Token refresh failed',
        status: 0,
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/auth/me`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get user info',
        status: 0,
      };
    }
  }

  // Strategy Management
  async getStrategies(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/strategies`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get strategies',
        status: 0,
      };
    }
  }

  async getStrategy(strategyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/strategies/${strategyId}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get strategy',
        status: 0,
      };
    }
  }

  async createStrategy(strategyData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/strategies`, {
        method: 'POST',
        body: JSON.stringify(strategyData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create strategy',
        status: 0,
      };
    }
  }

  async updateStrategy(strategyId: string, strategyData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/strategies/${strategyId}`, {
        method: 'PUT',
        body: JSON.stringify(strategyData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to update strategy',
        status: 0,
      };
    }
  }

  async deleteStrategy(strategyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/strategies/${strategyId}`, {
        method: 'DELETE'
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to delete strategy',
        status: 0,
      };
    }
  }

  async backtestStrategy(strategyId: string, backtestParams: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/strategies/${strategyId}/backtest`, {
        method: 'POST',
        body: JSON.stringify(backtestParams)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to run backtest',
        status: 0,
      };
    }
  }

  // Multi-Chain Wallet Management
  async getWallets(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/wallets`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get wallets',
        status: 0,
      };
    }
  }

  async getWalletBalance(walletId: string, chain: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/wallets/${walletId}/balance?chain=${chain}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get wallet balance',
        status: 0,
      };
    }
  }

  async createWallet(walletData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/wallets`, {
        method: 'POST',
        body: JSON.stringify(walletData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create wallet',
        status: 0,
      };
    }
  }

  async transferFunds(transferData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/wallets/transfer`, {
        method: 'POST',
        body: JSON.stringify(transferData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to transfer funds',
        status: 0,
      };
    }
  }

  // Flash Loan Operations
  async getFlashLoanOpportunities(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/flashloans/opportunities`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get flash loan opportunities',
        status: 0,
      };
    }
  }

  async executeFlashLoan(loanData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/flashloans/execute`, {
        method: 'POST',
        body: JSON.stringify(loanData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to execute flash loan',
        status: 0,
      };
    }
  }

  // HyperLend Integration
  async getHyperLendPositions(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/hyperlend/positions`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get HyperLend positions',
        status: 0,
      };
    }
  }

  async createHyperLendPosition(positionData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/hyperlend/positions`, {
        method: 'POST',
        body: JSON.stringify(positionData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create HyperLend position',
        status: 0,
      };
    }
  }

  // Advanced Analytics
  async getAnalytics(type?: string, timeframe?: string, symbol?: string): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (timeframe) params.append('timeframe', timeframe);
      if (symbol) params.append('symbol', symbol);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/analytics?${params.toString()}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get analytics',
        status: 0,
      };
    }
  }

  async getUSDTDominance(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/analytics/usdt-dominance`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get USDT dominance',
        status: 0,
      };
    }
  }

  async getCorrelationMatrix(assets: string[], timeframe?: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/analytics/correlations`, {
        method: 'POST',
        body: JSON.stringify({ assets, timeframe })
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get correlation matrix',
        status: 0,
      };
    }
  }

  async getMarketSentiment(): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/analytics/sentiment`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get market sentiment',
        status: 0,
      };
    }
  }

  // Profit Tracking
  async getProfitTracking(type?: string, timeframe?: string): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (timeframe) params.append('timeframe', timeframe);
      
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/profit-tracking?${params.toString()}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get profit tracking data',
        status: 0,
      };
    }
  }

  async createProfitGoal(goalData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/profit-tracking/goals`, {
        method: 'POST',
        body: JSON.stringify(goalData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create profit goal',
        status: 0,
      };
    }
  }

  async calculateTaxLiability(taxData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/profit-tracking/tax`, {
        method: 'POST',
        body: JSON.stringify(taxData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to calculate tax liability',
        status: 0,
      };
    }
  }

  // Trading Orders
  async createOrder(orderData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/trading/orders`, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create order',
        status: 0,
      };
    }
  }

  async getOrders(status?: string): Promise<ApiResponse<any>> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/trading/orders${params}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get orders',
        status: 0,
      };
    }
  }

  // Paper Trading Agent Integration
  async createAgentPaperAccount(agentId: string, accountData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/accounts`, {
        method: 'POST',
        body: JSON.stringify(accountData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create agent paper trading account',
        status: 0,
      };
    }
  }

  async getAgentPaperAccounts(agentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/accounts`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get agent paper trading accounts',
        status: 0,
      };
    }
  }

  async getAgentPaperAccount(agentId: string, accountId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/accounts/${accountId}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get agent paper trading account',
        status: 0,
      };
    }
  }

  async resetAgentPaperAccount(agentId: string, accountId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/accounts/${accountId}/reset`, {
        method: 'POST'
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to reset agent paper trading account',
        status: 0,
      };
    }
  }

  async executeAgentPaperOrder(agentId: string, orderData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/orders`, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to execute agent paper order',
        status: 0,
      };
    }
  }

  async getAgentPaperOrders(agentId: string, filters?: any): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.symbol) params.append('symbol', filters.symbol);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/orders${queryString}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get agent paper orders',
        status: 0,
      };
    }
  }

  async getAgentPaperPortfolio(agentId: string, accountId?: string): Promise<ApiResponse<any>> {
    try {
      const params = accountId ? `?account_id=${accountId}` : '';
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/portfolio${params}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get agent paper portfolio',
        status: 0,
      };
    }
  }

  async getAgentPaperPositions(agentId: string, accountId?: string): Promise<ApiResponse<any>> {
    try {
      const params = accountId ? `?account_id=${accountId}` : '';
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/positions${params}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get agent paper positions',
        status: 0,
      };
    }
  }

  async getAgentPaperPerformance(agentId: string, timeRange?: any): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (timeRange?.start) params.append('start_date', timeRange.start);
      if (timeRange?.end) params.append('end_date', timeRange.end);
      if (timeRange?.period) params.append('period', timeRange.period);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/performance${queryString}`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get agent paper performance',
        status: 0,
      };
    }
  }

  async closeAgentPaperPosition(agentId: string, positionId: string, quantity?: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/agents/${agentId}/paper-trading/positions/${positionId}/close`, {
        method: 'POST',
        body: JSON.stringify({ quantity })
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to close agent paper position',
        status: 0,
      };
    }
  }
}

// Export singleton instance
export const backendApi = new BackendApiClient();

// Export class for testing
export { BackendApiClient };