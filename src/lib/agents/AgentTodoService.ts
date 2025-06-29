/**
 * Agent Todo Service
 * Manages hierarchical task system for agents with persistence and coordination
 */

import { EventEmitter } from 'events'
import { AgentTodo, TodoSystemStats } from '@/components/agents/AgentTodoSystem'
import GeminiService from '@/lib/ai/GeminiService'

// Create local instance to avoid circular dependency
const geminiService = new GeminiService()
geminiService.init()

export interface TodoTemplate {
  id: string
  name: string
  category: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedDuration: number
  dependencies: string[]
  subtodoTemplates: TodoTemplate[]
  metadata: {
    agentTypes?: string[]
    tradingStrategies?: string[]
    marketConditions?: string[]
  }
}

export interface AgentHierarchy {
  parentAgentId?: string
  childAgents: string[]
  role: 'coordinator' | 'trader' | 'analyst' | 'risk_manager' | 'specialist'
  permissions: string[]
}

export interface TodoCoordination {
  coordinatorId: string
  participantIds: string[]
  sharedTodos: string[]
  dependencyGraph: Record<string, string[]>
  lastSync: number
}

class AgentTodoService extends EventEmitter {
  private agentTodos: Map<string, AgentTodo[]> = new Map()
  private agentHierarchies: Map<string, AgentHierarchy> = new Map()
  private todoTemplates: TodoTemplate[] = []
  private coordinations: Map<string, TodoCoordination> = new Map()
  private autoAssignmentRules: Array<{
    condition: (agentId: string, agentType: string) => boolean
    todoTemplate: string
    priority: 'low' | 'medium' | 'high' | 'critical'
  }> = []

  constructor() {
    super()
    this.initializeDefaultTemplates()
    this.loadPersistedData()
    this.setupAutoAssignmentRules()
  }

  // Agent todo management
  async createTodo(agentId: string, todoData: Partial<AgentTodo>): Promise<AgentTodo> {
    const newTodo: AgentTodo = {
      id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      title: todoData.title || 'New Task',
      description: todoData.description,
      status: 'pending',
      priority: todoData.priority || 'medium',
      category: todoData.category || 'trading',
      parentTodoId: todoData.parentTodoId,
      subtodos: [],
      assignedBy: todoData.assignedBy,
      assignedTo: todoData.assignedTo || agentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dueDate: todoData.dueDate,
      estimatedDuration: todoData.estimatedDuration,
      dependencies: todoData.dependencies || [],
      tags: todoData.tags || [],
      metadata: todoData.metadata || {}
    }

    // Add to agent's todo list
    if (!this.agentTodos.has(agentId)) {
      this.agentTodos.set(agentId, [])
    }
    this.agentTodos.get(agentId)!.push(newTodo)

    // Handle parent-child relationships
    if (newTodo.parentTodoId) {
      const parentTodo = this.findTodoById(newTodo.parentTodoId)
      if (parentTodo) {
        parentTodo.subtodos.push(newTodo.id)
        parentTodo.updatedAt = Date.now()
      }
    }

    // Auto-assign to subordinate agents if applicable
    await this.checkAutoAssignment(agentId, newTodo)

    // Sync with hierarchical agents
    await this.syncHierarchicalTodos(agentId, newTodo)

    this.persistData()
    this.emit('todoCreated', { agentId, todo: newTodo })

    return newTodo
  }

  async updateTodo(agentId: string, todoId: string, updates: Partial<AgentTodo>): Promise<void> {
    const agentTodos = this.agentTodos.get(agentId) || []
    const todoIndex = agentTodos.findIndex(t => t.id === todoId)
    
    if (todoIndex === -1) return

    const oldTodo = agentTodos[todoIndex]
    const updatedTodo = {
      ...oldTodo,
      ...updates,
      updatedAt: Date.now()
    }

    // Track completion time
    if (updates.status === 'completed' && oldTodo.status !== 'completed') {
      updatedTodo.actualDuration = Date.now() - oldTodo.createdAt
      
      // Auto-complete dependent todos if all dependencies are met
      await this.checkDependencyCompletion(updatedTodo)
    }

    agentTodos[todoIndex] = updatedTodo

    // Sync changes with coordinator/subordinates
    await this.syncTodoUpdate(agentId, updatedTodo)

    this.persistData()
    this.emit('todoUpdated', { agentId, todo: updatedTodo, previousTodo: oldTodo })
  }

  async deleteTodo(agentId: string, todoId: string): Promise<void> {
    const agentTodos = this.agentTodos.get(agentId) || []
    const todoToDelete = agentTodos.find(t => t.id === todoId)
    
    if (!todoToDelete) return

    // Remove from parent's subtodos
    if (todoToDelete.parentTodoId) {
      const parentTodo = this.findTodoById(todoToDelete.parentTodoId)
      if (parentTodo) {
        parentTodo.subtodos = parentTodo.subtodos.filter(id => id !== todoId)
        parentTodo.updatedAt = Date.now()
      }
    }

    // Recursively delete subtodos
    const deleteSubtodos = (parentId: string) => {
      const subtodoIds = agentTodos.find(t => t.id === parentId)?.subtodos || []
      subtodoIds.forEach(subtodoId => {
        deleteSubtodos(subtodoId)
        const index = agentTodos.findIndex(t => t.id === subtodoId)
        if (index !== -1) {
          agentTodos.splice(index, 1)
        }
      })
    }
    deleteSubtodos(todoId)

    // Remove main todo
    const mainIndex = agentTodos.findIndex(t => t.id === todoId)
    if (mainIndex !== -1) {
      agentTodos.splice(mainIndex, 1)
    }

    this.persistData()
    this.emit('todoDeleted', { agentId, todoId })
  }

  // Template management
  createTodoFromTemplate(agentId: string, templateId: string, customizations?: Partial<AgentTodo>): Promise<AgentTodo> {
    const template = this.todoTemplates.find(t => t.id === templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    const todoData: Partial<AgentTodo> = {
      title: template.name,
      description: template.description,
      category: template.category as any,
      priority: template.priority,
      estimatedDuration: template.estimatedDuration,
      dependencies: template.dependencies,
      tags: [template.category, 'template'],
      metadata: { ...template.metadata, templateId },
      ...customizations
    }

    return this.createTodo(agentId, todoData)
  }

  async createBulkTodosFromTemplate(agentId: string, templateId: string): Promise<AgentTodo[]> {
    const template = this.todoTemplates.find(t => t.id === templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    const todos: AgentTodo[] = []
    
    // Create main todo
    const mainTodo = await this.createTodoFromTemplate(agentId, templateId)
    todos.push(mainTodo)

    // Create subtodos
    for (const subtodoTemplate of template.subtodoTemplates) {
      const subtodo = await this.createTodoFromTemplate(agentId, subtodoTemplate.id, {
        parentTodoId: mainTodo.id
      })
      todos.push(subtodo)
    }

    return todos
  }

  // Hierarchical coordination
  async assignTodoToSubordinate(
    coordinatorId: string, 
    subordinateId: string, 
    todoData: Partial<AgentTodo>
  ): Promise<AgentTodo> {
    const hierarchy = this.agentHierarchies.get(coordinatorId)
    if (!hierarchy || !hierarchy.childAgents.includes(subordinateId)) {
      throw new Error('Agent not authorized to assign to this subordinate')
    }

    const todo = await this.createTodo(subordinateId, {
      ...todoData,
      assignedBy: coordinatorId,
      tags: [...(todoData.tags || []), 'assigned', 'hierarchical']
    })

    // Create coordination record
    const coordinationId = `coord_${coordinatorId}_${subordinateId}`
    if (!this.coordinations.has(coordinationId)) {
      this.coordinations.set(coordinationId, {
        coordinatorId,
        participantIds: [subordinateId],
        sharedTodos: [],
        dependencyGraph: {},
        lastSync: Date.now()
      })
    }

    const coordination = this.coordinations.get(coordinationId)!
    coordination.sharedTodos.push(todo.id)
    coordination.lastSync = Date.now()

    this.persistData()
    return todo
  }

  async delegateToTeam(
    coordinatorId: string, 
    todoData: Partial<AgentTodo>, 
    teamMemberIds: string[]
  ): Promise<AgentTodo[]> {
    const todos: AgentTodo[] = []
    
    for (const memberId of teamMemberIds) {
      const todo = await this.assignTodoToSubordinate(coordinatorId, memberId, {
        ...todoData,
        title: `${todoData.title} (${memberId})`,
        tags: [...(todoData.tags || []), 'team', 'delegated']
      })
      todos.push(todo)
    }

    return todos
  }

  // Smart todo assignment and recommendations
  async generateSmartTodos(agentId: string, context: {
    agentType: string
    currentStrategy?: string
    marketConditions?: string
    portfolioStatus?: any
    recentPerformance?: any
  }): Promise<AgentTodo[]> {
    try {
      const recommendations = await this.getAITodoRecommendations(agentId, context)
      const todos: AgentTodo[] = []

      for (const rec of recommendations) {
        const todo = await this.createTodo(agentId, {
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          category: rec.category,
          estimatedDuration: rec.estimatedDuration,
          tags: [...rec.tags, 'ai-generated', 'smart'],
          metadata: {
            ...rec.metadata,
            aiConfidence: rec.confidence,
            generatedReason: rec.reason
          }
        })
        todos.push(todo)
      }

      return todos
    } catch (error) {
      console.error('Failed to generate smart todos:', error)
      return this.generateFallbackTodos(agentId, context)
    }
  }

  // Analytics and reporting
  getAgentTodoStats(agentId: string): TodoSystemStats {
    const todos = this.agentTodos.get(agentId) || []
    
    const totalTodos = todos.length
    const completedTodos = todos.filter(t => t.status === 'completed').length
    const inProgressTodos = todos.filter(t => t.status === 'in_progress').length
    const blockedTodos = todos.filter(t => t.status === 'blocked').length
    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0
    
    const completedWithDuration = todos.filter(t => t.status === 'completed' && t.actualDuration)
    const averageCompletionTime = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / completedWithDuration.length
      : 0

    const priorityDistribution = todos.reduce((acc, todo) => {
      acc[todo.priority] = (acc[todo.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const categoryDistribution = todos.reduce((acc, todo) => {
      acc[todo.category] = (acc[todo.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalTodos,
      completedTodos,
      inProgressTodos,
      blockedTodos,
      completionRate,
      averageCompletionTime,
      priorityDistribution,
      categoryDistribution
    }
  }

  getTeamTodoOverview(coordinatorId: string): Record<string, TodoSystemStats> {
    const hierarchy = this.agentHierarchies.get(coordinatorId)
    if (!hierarchy) return {}

    const overview: Record<string, TodoSystemStats> = {}
    
    for (const subordinateId of hierarchy.childAgents) {
      overview[subordinateId] = this.getAgentTodoStats(subordinateId)
    }

    return overview
  }

  // Data access methods
  getAgentTodos(agentId: string): AgentTodo[] {
    return this.agentTodos.get(agentId) || []
  }

  findTodoById(todoId: string): AgentTodo | null {
    for (const agentTodos of this.agentTodos.values()) {
      const todo = agentTodos.find(t => t.id === todoId)
      if (todo) return todo
    }
    return null
  }

  getAvailableTemplates(agentType?: string): TodoTemplate[] {
    if (!agentType) return this.todoTemplates
    
    return this.todoTemplates.filter(template => 
      !template.metadata.agentTypes || 
      template.metadata.agentTypes.includes(agentType)
    )
  }

  // Private helper methods
  private async getAITodoRecommendations(agentId: string, context: any): Promise<any[]> {
    if (!geminiService.isConfigured()) {
      return []
    }

    const prompt = `As an AI agent coordinator, recommend todos for agent ${agentId} based on:
    
Agent Type: ${context.agentType}
Current Strategy: ${context.currentStrategy || 'none'}
Market Conditions: ${context.marketConditions || 'normal'}
Portfolio Status: ${JSON.stringify(context.portfolioStatus || {})}

Generate 3-5 specific, actionable todos. Respond in JSON format:
[
  {
    "title": "Todo title",
    "description": "Detailed description",
    "priority": "high|medium|low",
    "category": "trading|analysis|learning|maintenance|communication|strategy",
    "estimatedDuration": 1800000,
    "tags": ["tag1", "tag2"],
    "confidence": 0.8,
    "reason": "Why this todo is recommended",
    "metadata": {}
  }
]`

    try {
      const response = await geminiService['callGeminiAPI'](prompt)
      const jsonMatch = response.match(/\[[^\]]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('AI todo recommendation failed:', error)
    }

    return []
  }

  private generateFallbackTodos(agentId: string, context: any): AgentTodo[] {
    const fallbackTodos = [
      {
        title: 'Review current positions',
        description: 'Analyze all open positions for risk and opportunity',
        priority: 'medium' as const,
        category: 'trading' as const,
        estimatedDuration: 600000 // 10 minutes
      },
      {
        title: 'Update trading strategy',
        description: 'Review and update trading strategy based on recent performance',
        priority: 'high' as const,
        category: 'strategy' as const,
        estimatedDuration: 1800000 // 30 minutes
      },
      {
        title: 'Risk assessment',
        description: 'Perform comprehensive risk assessment of portfolio',
        priority: 'high' as const,
        category: 'analysis' as const,
        estimatedDuration: 900000 // 15 minutes
      }
    ]

    return fallbackTodos.map(todo => ({
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      ...todo,
      status: 'pending' as const,
      parentTodoId: undefined,
      subtodos: [],
      assignedBy: undefined,
      assignedTo: agentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dependencies: [],
      tags: ['fallback', 'auto-generated'],
      metadata: { generatedReason: 'Fallback when AI recommendations unavailable' }
    }))
  }

  private async checkAutoAssignment(agentId: string, todo: AgentTodo): Promise<void> {
    // Implementation for auto-assignment rules
    // This would check if the todo should be automatically assigned to subordinates
  }

  private async syncHierarchicalTodos(agentId: string, todo: AgentTodo): Promise<void> {
    // Implementation for syncing todos across hierarchical agents
    const hierarchy = this.agentHierarchies.get(agentId)
    if (hierarchy && hierarchy.parentAgentId) {
      // Notify parent agent of new todo
      this.emit('hierarchicalTodoSync', { 
        parentId: hierarchy.parentAgentId, 
        childId: agentId, 
        todo 
      })
    }
  }

  private async syncTodoUpdate(agentId: string, todo: AgentTodo): Promise<void> {
    // Implementation for syncing todo updates across the hierarchy
  }

  private async checkDependencyCompletion(todo: AgentTodo): Promise<void> {
    // Implementation for checking if dependent todos can now be started
  }

  private initializeDefaultTemplates(): void {
    this.todoTemplates = [
      {
        id: 'daily_portfolio_review',
        name: 'Daily Portfolio Review',
        category: 'analysis',
        description: 'Review portfolio performance and positions',
        priority: 'medium',
        estimatedDuration: 900000, // 15 minutes
        dependencies: [],
        subtodoTemplates: [],
        metadata: { agentTypes: ['momentum', 'mean_reversion', 'arbitrage'] }
      },
      {
        id: 'risk_assessment',
        name: 'Risk Assessment',
        category: 'analysis',
        description: 'Comprehensive risk analysis of current positions',
        priority: 'high',
        estimatedDuration: 1200000, // 20 minutes
        dependencies: [],
        subtodoTemplates: [],
        metadata: { agentTypes: ['risk_manager', 'momentum', 'mean_reversion'] }
      },
      {
        id: 'strategy_optimization',
        name: 'Strategy Optimization',
        category: 'strategy',
        description: 'Optimize trading strategy based on recent performance',
        priority: 'high',
        estimatedDuration: 2400000, // 40 minutes
        dependencies: ['daily_portfolio_review'],
        subtodoTemplates: [],
        metadata: { agentTypes: ['momentum', 'mean_reversion', 'arbitrage'] }
      }
    ]
  }

  private setupAutoAssignmentRules(): void {
    this.autoAssignmentRules = [
      {
        condition: (agentId: string, agentType: string) => agentType === 'coordinator',
        todoTemplate: 'daily_portfolio_review',
        priority: 'medium'
      },
      {
        condition: (agentId: string, agentType: string) => agentType.includes('risk'),
        todoTemplate: 'risk_assessment',
        priority: 'high'
      }
    ]
  }

  private persistData(): void {
    try {
      const data = {
        agentTodos: Object.fromEntries(this.agentTodos),
        agentHierarchies: Object.fromEntries(this.agentHierarchies),
        coordinations: Object.fromEntries(this.coordinations),
        todoTemplates: this.todoTemplates
      }
      localStorage.setItem('agent_todo_service', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist todo data:', error)
    }
  }

  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('agent_todo_service')
      if (stored) {
        const data = JSON.parse(stored)
        
        if (data.agentTodos) {
          this.agentTodos = new Map(Object.entries(data.agentTodos))
        }
        
        if (data.agentHierarchies) {
          this.agentHierarchies = new Map(Object.entries(data.agentHierarchies))
        }
        
        if (data.coordinations) {
          this.coordinations = new Map(Object.entries(data.coordinations))
        }
        
        if (data.todoTemplates) {
          this.todoTemplates = data.todoTemplates
        }
        
        console.log('Loaded agent todo service data')
      }
    } catch (error) {
      console.error('Failed to load todo service data:', error)
    }
  }
}

// Singleton instance - lazy initialization to avoid circular dependencies
let _agentTodoService: AgentTodoService | null = null

export const agentTodoService = (() => {
  if (!_agentTodoService) {
    _agentTodoService = new AgentTodoService()
  }
  return _agentTodoService
})()

export default AgentTodoService