'use client'

export interface N8NConfig {
  baseUrl: string
  apiKey?: string
  webhookUrl?: string
  timeout?: number
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  mode: 'manual' | 'webhook' | 'trigger'
  status: 'running' | 'success' | 'error' | 'waiting'
  startedAt: string
  finishedAt?: string
  data?: any
  error?: string
}

export interface TradingWorkflow {
  id: string
  name: string
  description: string
  active: boolean
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  settings: WorkflowSettings
  lastExecution?: WorkflowExecution
}

export interface WorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action' | 'condition' | 'transform'
  nodeType: string
  position: [number, number]
  parameters: { [key: string]: any }
}

export interface WorkflowConnection {
  node: string
  type: string
  index: number
}

export interface WorkflowSettings {
  timezone: string
  saveExecutionProgress: boolean
  saveManualExecutions: boolean
  callerPolicy: string
  errorWorkflow?: string
}

export interface TradingSignal {
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  quantity: number
  price?: number
  confidence: number
  source: string
  timestamp: string
  metadata?: { [key: string]: any }
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'technical_analysis' | 'fundamental_analysis' | 'risk_management' | 'portfolio_rebalancing' | 'arbitrage'
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  parameters: { [key: string]: any }
}

export class N8NClient {
  private config: N8NConfig
  private isConnected: boolean = false
  private lastError: string | null = null

  constructor(config: N8NConfig) {
    this.config = {
      timeout: 30000,
      ...config
    }
  }

  // Connection Management
  async connect(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/healthz')
      this.isConnected = response.ok
      this.clearError()
      return this.isConnected
    } catch (error) {
      this.setError(`Connection failed: ${error.message}`)
      return false
    }
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/healthz')
      return response.ok
    } catch (error) {
      return false
    }
  }

  // Workflow Management
  async getWorkflows(): Promise<TradingWorkflow[]> {
    try {
      const response = await this.makeRequest('GET', '/workflows')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      return this.mockWorkflows() // Use mock data for demo
    } catch (error) {
      this.setError(`Failed to get workflows: ${error.message}`)
      return this.mockWorkflows()
    }
  }

  async createWorkflow(workflow: Partial<TradingWorkflow>): Promise<TradingWorkflow | null> {
    try {
      const response = await this.makeRequest('POST', '/workflows', workflow)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      
      // For demo, return mock workflow
      return {
        id: this.generateId(),
        name: workflow.name || 'New Workflow',
        description: workflow.description || '',
        active: false,
        nodes: workflow.nodes || [],
        connections: workflow.connections || [],
        settings: workflow.settings || this.getDefaultSettings()
      }
    } catch (error) {
      this.setError(`Failed to create workflow: ${error.message}`)
      return null
    }
  }

  async updateWorkflow(id: string, workflow: Partial<TradingWorkflow>): Promise<boolean> {
    try {
      const response = await this.makeRequest('PATCH', `/workflows/${id}`, workflow)
      return response.ok
    } catch (error) {
      this.setError(`Failed to update workflow: ${error.message}`)
      return false
    }
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('DELETE', `/workflows/${id}`)
      return response.ok
    } catch (error) {
      this.setError(`Failed to delete workflow: ${error.message}`)
      return false
    }
  }

  async activateWorkflow(id: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', `/workflows/${id}/activate`)
      return response.ok
    } catch (error) {
      this.setError(`Failed to activate workflow: ${error.message}`)
      return false
    }
  }

  async deactivateWorkflow(id: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', `/workflows/${id}/deactivate`)
      return response.ok
    } catch (error) {
      this.setError(`Failed to deactivate workflow: ${error.message}`)
      return false
    }
  }

  // Workflow Execution
  async executeWorkflow(id: string, data?: any): Promise<WorkflowExecution | null> {
    try {
      const response = await this.makeRequest('POST', `/workflows/${id}/execute`, data)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const executionData = await response.json()
      
      // Return mock execution for demo
      return {
        id: this.generateId(),
        workflowId: id,
        mode: 'manual',
        status: 'success',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        data: executionData
      }
    } catch (error) {
      this.setError(`Failed to execute workflow: ${error.message}`)
      return null
    }
  }

  async getExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    try {
      const url = workflowId ? `/executions?workflowId=${workflowId}` : '/executions'
      const response = await this.makeRequest('GET', url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      return this.mockExecutions() // Use mock data for demo
    } catch (error) {
      this.setError(`Failed to get executions: ${error.message}`)
      return this.mockExecutions()
    }
  }

  async stopExecution(id: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', `/executions/${id}/stop`)
      return response.ok
    } catch (error) {
      this.setError(`Failed to stop execution: ${error.message}`)
      return false
    }
  }

  // Trading Signal Processing
  async sendTradingSignal(signal: TradingSignal): Promise<boolean> {
    try {
      const webhookUrl = this.config.webhookUrl || `${this.config.baseUrl}/webhook/trading-signal`
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(signal)
      })
      
      return response.ok
    } catch (error) {
      this.setError(`Failed to send trading signal: ${error.message}`)
      return false
    }
  }

  async processTradingSignals(signals: TradingSignal[]): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const signal of signals) {
      const result = await this.sendTradingSignal(signal)
      if (result) {
        success++
      } else {
        failed++
      }
    }

    return { success, failed }
  }

  // Workflow Templates
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return [
      {
        id: 'rsi_strategy',
        name: 'RSI Trading Strategy',
        description: 'Buy when RSI < 30, sell when RSI > 70',
        category: 'technical_analysis',
        nodes: [
          {
            id: 'trigger',
            name: 'Market Data Trigger',
            type: 'trigger',
            nodeType: 'n8n-nodes-base.interval',
            position: [250, 300],
            parameters: { interval: 60 }
          },
          {
            id: 'fetch_price',
            name: 'Fetch Price Data',
            type: 'action',
            nodeType: 'n8n-nodes-base.httpRequest',
            position: [450, 300],
            parameters: { url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT' }
          },
          {
            id: 'calculate_rsi',
            name: 'Calculate RSI',
            type: 'transform',
            nodeType: 'n8n-nodes-base.function',
            position: [650, 300],
            parameters: { functionCode: 'return [{json: {rsi: Math.random() * 100}}];' }
          },
          {
            id: 'check_buy_condition',
            name: 'Check Buy Condition',
            type: 'condition',
            nodeType: 'n8n-nodes-base.if',
            position: [850, 200],
            parameters: { conditions: { number: [{ value1: '={{$json.rsi}}', operation: 'smaller', value2: 30 }] } }
          },
          {
            id: 'check_sell_condition',
            name: 'Check Sell Condition',
            type: 'condition',
            nodeType: 'n8n-nodes-base.if',
            position: [850, 400],
            parameters: { conditions: { number: [{ value1: '={{$json.rsi}}', operation: 'larger', value2: 70 }] } }
          },
          {
            id: 'send_buy_signal',
            name: 'Send Buy Signal',
            type: 'action',
            nodeType: 'n8n-nodes-base.webhook',
            position: [1050, 200],
            parameters: { httpMethod: 'POST', path: 'buy-signal' }
          },
          {
            id: 'send_sell_signal',
            name: 'Send Sell Signal',
            type: 'action',
            nodeType: 'n8n-nodes-base.webhook',
            position: [1050, 400],
            parameters: { httpMethod: 'POST', path: 'sell-signal' }
          }
        ],
        connections: [],
        parameters: {
          symbol: 'BTC/USDT',
          rsi_period: 14,
          buy_threshold: 30,
          sell_threshold: 70
        }
      },
      {
        id: 'portfolio_rebalancing',
        name: 'Portfolio Rebalancing',
        description: 'Automatically rebalance portfolio based on target allocations',
        category: 'portfolio_rebalancing',
        nodes: [
          {
            id: 'schedule_trigger',
            name: 'Daily Schedule',
            type: 'trigger',
            nodeType: 'n8n-nodes-base.cron',
            position: [250, 300],
            parameters: { expression: '0 0 * * *' }
          },
          {
            id: 'get_portfolio',
            name: 'Get Portfolio',
            type: 'action',
            nodeType: 'n8n-nodes-base.httpRequest',
            position: [450, 300],
            parameters: { url: '/api/portfolio' }
          },
          {
            id: 'calculate_allocation',
            name: 'Calculate Required Allocation',
            type: 'transform',
            nodeType: 'n8n-nodes-base.function',
            position: [650, 300],
            parameters: { functionCode: 'return [{json: {trades: []}}];' }
          },
          {
            id: 'execute_trades',
            name: 'Execute Rebalancing Trades',
            type: 'action',
            nodeType: 'n8n-nodes-base.httpRequest',
            position: [850, 300],
            parameters: { url: '/api/trades', method: 'POST' }
          }
        ],
        connections: [],
        parameters: {
          target_allocation: {
            'BTC': 50,
            'ETH': 30,
            'SOL': 20
          },
          rebalance_threshold: 5
        }
      }
    ]
  }

  async createWorkflowFromTemplate(templateId: string, parameters?: any): Promise<TradingWorkflow | null> {
    const templates = await this.getWorkflowTemplates()
    const template = templates.find(t => t.id === templateId)
    
    if (!template) {
      this.setError(`Template ${templateId} not found`)
      return null
    }

    return await this.createWorkflow({
      name: template.name,
      description: template.description,
      nodes: template.nodes,
      connections: template.connections,
      settings: this.getDefaultSettings()
    })
  }

  // Utility Methods
  private async makeRequest(method: string, path: string, body?: any): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      ...(body && { body: JSON.stringify(body) })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private generateId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getDefaultSettings(): WorkflowSettings {
    return {
      timezone: 'UTC',
      saveExecutionProgress: true,
      saveManualExecutions: true,
      callerPolicy: 'workflowsFromSameOwner'
    }
  }

  private setError(error: string): void {
    this.lastError = error
    console.error(`[N8N Client] ${error}`)
  }

  private clearError(): void {
    this.lastError = null
  }

  // Mock Data for Demo
  private mockWorkflows(): TradingWorkflow[] {
    return [
      {
        id: 'wf_001',
        name: 'BTC RSI Strategy',
        description: 'RSI-based trading strategy for Bitcoin',
        active: true,
        nodes: [],
        connections: [],
        settings: this.getDefaultSettings(),
        lastExecution: {
          id: 'exec_001',
          workflowId: 'wf_001',
          mode: 'trigger',
          status: 'success',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          finishedAt: new Date(Date.now() - 3500000).toISOString(),
          data: { signal: 'buy', price: 50000 }
        }
      },
      {
        id: 'wf_002',
        name: 'Portfolio Rebalancer',
        description: 'Daily portfolio rebalancing workflow',
        active: true,
        nodes: [],
        connections: [],
        settings: this.getDefaultSettings(),
        lastExecution: {
          id: 'exec_002',
          workflowId: 'wf_002',
          mode: 'trigger',
          status: 'success',
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          finishedAt: new Date(Date.now() - 7100000).toISOString(),
          data: { trades_executed: 3, total_volume: 10000 }
        }
      },
      {
        id: 'wf_003',
        name: 'Risk Monitor',
        description: 'Continuous risk monitoring and alerts',
        active: false,
        nodes: [],
        connections: [],
        settings: this.getDefaultSettings()
      }
    ]
  }

  private mockExecutions(): WorkflowExecution[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `exec_${i + 1}`,
      workflowId: `wf_${(i % 3) + 1}`,
      mode: Math.random() > 0.5 ? 'trigger' : 'manual',
      status: Math.random() > 0.8 ? 'error' : 'success',
      startedAt: new Date(Date.now() - (i * 3600000)).toISOString(),
      finishedAt: new Date(Date.now() - (i * 3600000) + 60000).toISOString(),
      data: { result: `Execution ${i + 1} data` }
    }))
  }

  // Getters
  get connected(): boolean {
    return this.isConnected
  }

  get lastErrorMessage(): string | null {
    return this.lastError
  }

  get configuration(): N8NConfig {
    return this.config
  }
}

// Export singleton instance
export const n8nClient = new N8NClient({
  baseUrl: process.env.NEXT_PUBLIC_N8N_URL || 'http://localhost:5678',
  apiKey: process.env.NEXT_PUBLIC_N8N_API_KEY,
  webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
})

export default n8nClient