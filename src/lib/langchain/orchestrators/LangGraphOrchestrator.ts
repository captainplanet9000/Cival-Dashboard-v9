/**
 * LangGraph Orchestrator
 * Manages complex multi-agent workflows and decision coordination
 */

import { StateGraph, END } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'
import type { 
  WorkflowNode, 
  WorkflowState, 
  TradingWorkflow,
  AgentDecision 
} from '../types'

interface GraphState {
  messages: BaseMessage[]
  data: Record<string, any>
  decisions: AgentDecision[]
  currentStep: string
  metadata: Record<string, any>
}

export class LangGraphOrchestrator {
  private workflows: Map<string, TradingWorkflow> = new Map()
  private activeStates: Map<string, WorkflowState> = new Map()
  private graphs: Map<string, StateGraph<GraphState>> = new Map()

  constructor() {
    this.initializeDefaultWorkflows()
  }

  private initializeDefaultWorkflows() {
    // Trading Strategy Workflow
    const tradingWorkflow: TradingWorkflow = {
      id: 'trading-strategy',
      name: 'Multi-Agent Trading Strategy',
      description: 'Coordinates multiple agents for comprehensive trading decisions',
      nodes: [
        {
          id: 'market-analysis',
          name: 'Market Analysis',
          type: 'agent',
          config: { agentType: 'analysis' },
          edges: ['risk-assessment']
        },
        {
          id: 'risk-assessment', 
          name: 'Risk Assessment',
          type: 'agent',
          config: { agentType: 'risk' },
          edges: ['trading-decision']
        },
        {
          id: 'trading-decision',
          name: 'Trading Decision',
          type: 'condition',
          config: { 
            conditions: {
              high_confidence: 'execute-trade',
              medium_confidence: 'review-decision',
              low_confidence: 'hold-position'
            }
          },
          edges: ['execute-trade', 'review-decision', 'hold-position']
        },
        {
          id: 'execute-trade',
          name: 'Execute Trade',
          type: 'agent',
          config: { agentType: 'trading' },
          edges: []
        },
        {
          id: 'review-decision',
          name: 'Review Decision',
          type: 'agent',
          config: { agentType: 'coordination' },
          edges: ['trading-decision']
        },
        {
          id: 'hold-position',
          name: 'Hold Position',
          type: 'tool',
          config: { action: 'hold' },
          edges: []
        }
      ],
      triggers: ['market_update', 'price_alert', 'schedule'],
      schedule: {
        interval: 5,
        unit: 'minutes'
      }
    }

    this.workflows.set(tradingWorkflow.id, tradingWorkflow)
    this.createGraph(tradingWorkflow)
  }

  private createGraph(workflow: TradingWorkflow) {
    const graph = new StateGraph<GraphState>({
      channels: {
        messages: [],
        data: {},
        decisions: [],
        currentStep: '',
        metadata: {}
      }
    })

    // Add nodes to graph
    workflow.nodes.forEach(node => {
      graph.addNode(node.id, this.createNodeFunction(node))
    })

    // Add edges
    workflow.nodes.forEach(node => {
      if (node.edges.length === 0) {
        graph.addEdge(node.id, END)
      } else {
        node.edges.forEach(edge => {
          graph.addEdge(node.id, edge)
        })
      }
    })

    // Set entry point
    if (workflow.nodes.length > 0) {
      graph.addEdge('__start__', workflow.nodes[0].id)
    }

    this.graphs.set(workflow.id, graph)
  }

  private createNodeFunction(node: WorkflowNode) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
      console.log(`🔄 Executing workflow node: ${node.name}`)

      try {
        switch (node.type) {
          case 'agent':
            return await this.executeAgentNode(node, state)
          case 'tool':
            return await this.executeToolNode(node, state)
          case 'condition':
            return await this.executeConditionNode(node, state)
          case 'parallel':
            return await this.executeParallelNode(node, state)
          default:
            throw new Error(`Unknown node type: ${node.type}`)
        }
      } catch (error) {
        console.error(`❌ Workflow node error: ${node.name}`, error)
        return {
          metadata: {
            ...state.metadata,
            error: error instanceof Error ? error.message : 'Unknown error',
            failedNode: node.id
          }
        }
      }
    }
  }

  private async executeAgentNode(node: WorkflowNode, state: GraphState): Promise<Partial<GraphState>> {
    // Lazy load LangChain service to avoid circular dependencies
    const { getLangChainService } = await import('../index')
    const langChainService = await getLangChainService()

    const agentType = node.config.agentType || 'analysis'
    const input = this.prepareAgentInput(state, agentType)
    
    // Create temporary agent for this workflow step
    const agentConfig = {
      id: `workflow-agent-${node.id}`,
      name: `${node.name} Agent`,
      type: agentType as any,
      model: null as any, // Will be set by service
      systemPrompt: this.getSystemPrompt(agentType),
      tools: this.getAgentTools(agentType),
      memory: true,
      maxHistory: 10
    }

    const agentId = await langChainService.createAgent(agentConfig)
    const decision = await langChainService.makeDecision(agentId, input, state.data)

    return {
      decisions: [...state.decisions, decision],
      data: {
        ...state.data,
        [node.id]: decision
      },
      currentStep: node.id,
      metadata: {
        ...state.metadata,
        lastExecution: new Date().toISOString(),
        executedBy: agentId
      }
    }
  }

  private async executeToolNode(node: WorkflowNode, state: GraphState): Promise<Partial<GraphState>> {
    const action = node.config.action
    
    switch (action) {
      case 'hold':
        return {
          currentStep: node.id,
          data: {
            ...state.data,
            action: 'hold',
            reason: 'Workflow determined to hold position'
          }
        }
      case 'log':
        console.log(`📝 Workflow Log: ${JSON.stringify(state.data, null, 2)}`)
        return { currentStep: node.id }
      default:
        return { currentStep: node.id }
    }
  }

  private async executeConditionNode(node: WorkflowNode, state: GraphState): Promise<Partial<GraphState>> {
    const conditions = node.config.conditions || {}
    const latestDecision = state.decisions[state.decisions.length - 1]
    
    if (!latestDecision) {
      return { currentStep: 'hold-position' }
    }

    // Determine next step based on confidence
    const confidence = latestDecision.confidence
    let nextStep = 'hold-position'

    if (confidence >= 0.8) {
      nextStep = conditions.high_confidence || 'execute-trade'
    } else if (confidence >= 0.5) {
      nextStep = conditions.medium_confidence || 'review-decision'
    } else {
      nextStep = conditions.low_confidence || 'hold-position'
    }

    return {
      currentStep: nextStep,
      data: {
        ...state.data,
        conditionResult: nextStep,
        evaluatedConfidence: confidence
      }
    }
  }

  private async executeParallelNode(node: WorkflowNode, state: GraphState): Promise<Partial<GraphState>> {
    // Execute multiple sub-nodes in parallel
    const parallelTasks = node.config.tasks || []
    const results = await Promise.all(
      parallelTasks.map(async (task: any) => {
        // Simulate parallel task execution
        return {
          taskId: task.id,
          result: `Parallel task ${task.id} completed`,
          timestamp: new Date().toISOString()
        }
      })
    )

    return {
      currentStep: node.id,
      data: {
        ...state.data,
        parallelResults: results
      }
    }
  }

  private prepareAgentInput(state: GraphState, agentType: string): string {
    const baseInput = `Current workflow state: ${state.currentStep}\n`
    const dataContext = `Available data: ${JSON.stringify(state.data, null, 2)}\n`
    const decisionHistory = state.decisions.length > 0 
      ? `Previous decisions: ${state.decisions.map(d => `${d.action} (${d.confidence})`).join(', ')}\n`
      : ''

    switch (agentType) {
      case 'analysis':
        return `${baseInput}${dataContext}Perform market analysis and provide insights.`
      case 'risk':
        return `${baseInput}${dataContext}${decisionHistory}Assess risk levels and provide recommendations.`
      case 'trading':
        return `${baseInput}${dataContext}${decisionHistory}Execute the trading decision based on analysis.`
      case 'coordination':
        return `${baseInput}${dataContext}${decisionHistory}Coordinate and review the overall trading strategy.`
      default:
        return `${baseInput}${dataContext}Analyze the current situation and provide recommendations.`
    }
  }

  private getSystemPrompt(agentType: string): string {
    const prompts = {
      analysis: `You are a market analysis expert. Analyze market data, identify trends, and provide actionable insights for trading decisions.`,
      risk: `You are a risk assessment specialist. Evaluate potential risks, calculate position sizes, and ensure trades align with risk management principles.`,
      trading: `You are a trading execution expert. Execute trades based on analysis and risk assessment, ensuring optimal timing and execution.`,
      coordination: `You are a trading coordinator. Review and coordinate decisions from multiple agents to ensure coherent trading strategies.`
    }

    return prompts[agentType as keyof typeof prompts] || prompts.analysis
  }

  private getAgentTools(agentType: string): string[] {
    const toolSets = {
      analysis: ['market_data', 'technical_indicators', 'sentiment_analysis'],
      risk: ['position_calculator', 'var_calculator', 'correlation_analysis'],
      trading: ['order_placement', 'execution_tracker', 'slippage_monitor'],
      coordination: ['decision_aggregator', 'strategy_validator', 'performance_tracker']
    }

    return toolSets[agentType as keyof typeof toolSets] || []
  }

  // Public API methods
  async executeWorkflow(workflowId: string, initialData: any = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    const graph = this.graphs.get(workflowId)
    if (!graph) {
      throw new Error(`Graph for workflow ${workflowId} not found`)
    }

    const stateId = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const initialState: WorkflowState = {
      id: stateId,
      currentNode: workflow.nodes[0]?.id || '',
      data: initialData,
      history: [],
      status: 'running'
    }

    this.activeStates.set(stateId, initialState)

    try {
      const result = await graph.invoke({
        messages: [],
        data: initialData,
        decisions: [],
        currentStep: '',
        metadata: { workflowId, stateId }
      })

      // Update final state
      const finalState = this.activeStates.get(stateId)
      if (finalState) {
        finalState.status = 'completed'
        finalState.data = { ...finalState.data, ...result.data }
      }

      console.log(`✅ Workflow ${workflowId} completed successfully`)
      return stateId

    } catch (error) {
      const failedState = this.activeStates.get(stateId)
      if (failedState) {
        failedState.status = 'failed'
      }
      
      console.error(`❌ Workflow ${workflowId} failed:`, error)
      throw error
    }
  }

  createWorkflow(workflow: TradingWorkflow): void {
    this.workflows.set(workflow.id, workflow)
    this.createGraph(workflow)
    console.log(`📊 Created workflow: ${workflow.name}`)
  }

  getWorkflow(workflowId: string): TradingWorkflow | undefined {
    return this.workflows.get(workflowId)
  }

  getActiveStates(): WorkflowState[] {
    return Array.from(this.activeStates.values())
  }

  getWorkflowState(stateId: string): WorkflowState | undefined {
    return this.activeStates.get(stateId)
  }

  pauseWorkflow(stateId: string): boolean {
    const state = this.activeStates.get(stateId)
    if (state && state.status === 'running') {
      state.status = 'paused'
      return true
    }
    return false
  }

  resumeWorkflow(stateId: string): boolean {
    const state = this.activeStates.get(stateId)
    if (state && state.status === 'paused') {
      state.status = 'running'
      return true
    }
    return false
  }

  getAvailableWorkflows(): TradingWorkflow[] {
    return Array.from(this.workflows.values())
  }

  clearCompletedStates(): number {
    let cleared = 0
    for (const [stateId, state] of this.activeStates.entries()) {
      if (state.status === 'completed' || state.status === 'failed') {
        this.activeStates.delete(stateId)
        cleared++
      }
    }
    return cleared
  }
}