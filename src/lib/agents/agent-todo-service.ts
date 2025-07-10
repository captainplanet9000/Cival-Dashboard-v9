/**
 * Agent Todo Service
 * Comprehensive task management system for AI trading agents
 */

import { 
  AgentTodo, 
  AgentTodoList, 
  FarmTodoCoordination,
  TodoTemplate,
  TodoFilter,
  TodoUpdate,
  TodoNotification,
  TodoAnalytics,
  CreateTodoRequest,
  BulkTodoOperation,
  TodoApiResponse
} from '@/types/agent-todos'

class AgentTodoService {
  private todos: Map<string, AgentTodo> = new Map()
  private agentTodoLists: Map<string, AgentTodoList> = new Map()
  private farmCoordination: Map<string, FarmTodoCoordination> = new Map()
  private templates: TodoTemplate[] = []
  private notifications: TodoNotification[] = []
  
  constructor() {
    this.initializeTemplates()
    this.loadFromStorage()
  }

  // ===== CORE TODO OPERATIONS =====

  async createTodo(request: CreateTodoRequest): Promise<TodoApiResponse<AgentTodo>> {
    try {
      const todo: AgentTodo = {
        id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: request.agentId,
        farmId: request.farmId,
        goalId: request.goalId,
        title: request.title,
        description: request.description,
        status: 'pending',
        priority: request.priority,
        category: request.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: request.dueDate,
        dependsOn: request.dependencies || [],
        assignedBy: request.assignedBy || 'system',
        hierarchyLevel: request.hierarchyLevel || 'individual',
        context: request.context,
        progress: {
          percentage: 0,
          steps: []
        }
      }

      this.todos.set(todo.id, todo)
      await this.updateAgentTodoList(request.agentId)
      
      if (request.farmId) {
        await this.updateFarmCoordination(request.farmId)
      }

      await this.createNotification({
        todoId: todo.id,
        agentId: request.agentId,
        type: 'created',
        message: `New ${request.priority} priority task assigned: ${request.title}`
      })

      await this.saveToStorage()

      return {
        success: true,
        data: todo,
        message: 'Todo created successfully',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create todo',
        timestamp: new Date().toISOString()
      }
    }
  }

  async updateTodo(update: TodoUpdate): Promise<TodoApiResponse<AgentTodo>> {
    try {
      const todo = this.todos.get(update.id)
      if (!todo) {
        throw new Error('Todo not found')
      }

      const previousStatus = todo.status
      const updatedTodo: AgentTodo = {
        ...todo,
        ...update.updates,
        updatedAt: new Date().toISOString(),
        completedAt: update.updates.status === 'completed' ? new Date().toISOString() : todo.completedAt
      }

      this.todos.set(update.id, updatedTodo)
      await this.updateAgentTodoList(todo.agentId)
      
      if (todo.farmId) {
        await this.updateFarmCoordination(todo.farmId)
      }

      // Create notification for status changes
      if (previousStatus !== updatedTodo.status) {
        await this.createNotification({
          todoId: todo.id,
          agentId: todo.agentId,
          type: updatedTodo.status === 'completed' ? 'completed' : 'updated',
          message: `Task ${updatedTodo.status}: ${todo.title}`
        })
      }

      await this.saveToStorage()

      return {
        success: true,
        data: updatedTodo,
        message: 'Todo updated successfully',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update todo',
        timestamp: new Date().toISOString()
      }
    }
  }

  async deleteTodo(todoId: string): Promise<TodoApiResponse<boolean>> {
    try {
      const todo = this.todos.get(todoId)
      if (!todo) {
        throw new Error('Todo not found')
      }

      this.todos.delete(todoId)
      await this.updateAgentTodoList(todo.agentId)
      
      if (todo.farmId) {
        await this.updateFarmCoordination(todo.farmId)
      }

      await this.saveToStorage()

      return {
        success: true,
        data: true,
        message: 'Todo deleted successfully',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete todo',
        timestamp: new Date().toISOString()
      }
    }
  }

  // ===== AGENT TODO MANAGEMENT =====

  async getAgentTodos(agentId: string, filter?: TodoFilter): Promise<TodoApiResponse<AgentTodoList>> {
    try {
      const agentTodos = Array.from(this.todos.values())
        .filter(todo => todo.agentId === agentId)
        .filter(todo => this.matchesFilter(todo, filter))
        .sort((a, b) => {
          // Sort by priority, then by creation date
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority]
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })

      const summary = this.calculateTodoSummary(agentTodos)
      
      const todoList: AgentTodoList = {
        agentId,
        farmId: agentTodos.find(t => t.farmId)?.farmId,
        todos: agentTodos,
        summary,
        lastUpdated: new Date().toISOString()
      }

      this.agentTodoLists.set(agentId, todoList)

      return {
        success: true,
        data: todoList,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get agent todos',
        timestamp: new Date().toISOString()
      }
    }
  }

  // ===== FARM COORDINATION =====

  async getFarmTodos(farmId: string): Promise<TodoApiResponse<FarmTodoCoordination>> {
    try {
      const farmTodos = Array.from(this.todos.values())
        .filter(todo => todo.farmId === farmId)

      const agentIds = [...new Set(farmTodos.map(todo => todo.agentId))]
      const agentTodoLists: Record<string, AgentTodoList> = {}

      for (const agentId of agentIds) {
        const response = await this.getAgentTodos(agentId, { farmId })
        if (response.success && response.data) {
          agentTodoLists[agentId] = response.data
        }
      }

      const sharedTodos = farmTodos.filter(todo => 
        todo.hierarchyLevel === 'farm' || todo.hierarchyLevel === 'group'
      )

      const farmCoordination: FarmTodoCoordination = {
        farmId,
        sharedTodos,
        agentTodoLists,
        farmGoals: [...new Set(farmTodos.map(todo => todo.goalId).filter(Boolean))],
        coordinationStrategy: 'coordinated', // Default, should be configurable
        priorities: this.categorizeFarmPriorities(farmTodos),
        farmProgress: this.calculateFarmProgress(agentTodoLists)
      }

      this.farmCoordination.set(farmId, farmCoordination)

      return {
        success: true,
        data: farmCoordination,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get farm todos',
        timestamp: new Date().toISOString()
      }
    }
  }

  // ===== GOAL INTEGRATION =====

  async createTodosFromGoal(goalId: string, goalData: any, assignToAgents: string[]): Promise<TodoApiResponse<AgentTodo[]>> {
    try {
      const createdTodos: AgentTodo[] = []

      for (const agentId of assignToAgents) {
        const todoRequest: CreateTodoRequest = {
          agentId,
          farmId: goalData.farmId,
          goalId,
          title: `Goal: ${goalData.name}`,
          description: `Work towards achieving goal: ${goalData.description}`,
          priority: this.mapGoalPriorityToTodoPriority(goalData.priority),
          category: 'goal',
          dueDate: goalData.targetDate,
          context: {
            targetValue: goalData.targetValue,
            strategy: goalData.strategy,
            customInstructions: goalData.customInstructions
          },
          assignedBy: 'system',
          hierarchyLevel: goalData.farmId ? 'farm' : 'individual'
        }

        const response = await this.createTodo(todoRequest)
        if (response.success && response.data) {
          createdTodos.push(response.data)
        }
      }

      return {
        success: true,
        data: createdTodos,
        message: `Created ${createdTodos.length} todos from goal`,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create todos from goal',
        timestamp: new Date().toISOString()
      }
    }
  }

  // ===== BULK OPERATIONS =====

  async bulkOperation(operation: BulkTodoOperation): Promise<TodoApiResponse<any>> {
    try {
      const results: any[] = []

      switch (operation.operation) {
        case 'create':
          if (operation.todos) {
            for (const todoRequest of operation.todos) {
              const response = await this.createTodo(todoRequest)
              results.push(response)
            }
          }
          break

        case 'update':
          if (operation.todoIds && operation.updates) {
            for (const todoId of operation.todoIds) {
              const response = await this.updateTodo({
                id: todoId,
                updates: operation.updates,
                updatedBy: 'bulk_operation'
              })
              results.push(response)
            }
          }
          break

        case 'delete':
          if (operation.todoIds) {
            for (const todoId of operation.todoIds) {
              const response = await this.deleteTodo(todoId)
              results.push(response)
            }
          }
          break

        case 'assign':
          if (operation.todoIds && operation.targetAgents) {
            for (const todoId of operation.todoIds) {
              for (const agentId of operation.targetAgents) {
                const response = await this.updateTodo({
                  id: todoId,
                  updates: { agentId },
                  updatedBy: 'bulk_assign'
                })
                results.push(response)
              }
            }
          }
          break
      }

      const successCount = results.filter(r => r.success).length
      
      return {
        success: successCount > 0,
        data: results,
        message: `Bulk operation completed: ${successCount}/${results.length} successful`,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk operation failed',
        timestamp: new Date().toISOString()
      }
    }
  }

  // ===== ANALYTICS =====

  async getTodoAnalytics(agentId?: string, farmId?: string): Promise<TodoApiResponse<TodoAnalytics>> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

      let filteredTodos = Array.from(this.todos.values())
      
      if (agentId) {
        filteredTodos = filteredTodos.filter(todo => todo.agentId === agentId)
      }
      
      if (farmId) {
        filteredTodos = filteredTodos.filter(todo => todo.farmId === farmId)
      }

      const analytics: TodoAnalytics = {
        agentId,
        farmId,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        metrics: this.calculateAnalyticsMetrics(filteredTodos),
        trends: this.calculateTrends(filteredTodos, startDate, endDate),
        performance: this.calculatePerformanceMetrics(filteredTodos)
      }

      return {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get todo analytics',
        timestamp: new Date().toISOString()
      }
    }
  }

  // ===== HELPER METHODS =====

  private async updateAgentTodoList(agentId: string): Promise<void> {
    await this.getAgentTodos(agentId)
  }

  private async updateFarmCoordination(farmId: string): Promise<void> {
    await this.getFarmTodos(farmId)
  }

  private async createNotification(notification: Omit<TodoNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    const newNotification: TodoNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    }
    
    this.notifications.push(newNotification)
  }

  private matchesFilter(todo: AgentTodo, filter?: TodoFilter): boolean {
    if (!filter) return true
    
    if (filter.status && !filter.status.includes(todo.status)) return false
    if (filter.priority && !filter.priority.includes(todo.priority)) return false
    if (filter.category && !filter.category.includes(todo.category)) return false
    if (filter.farmId && todo.farmId !== filter.farmId) return false
    if (filter.agentId && todo.agentId !== filter.agentId) return false
    if (filter.assignedBy && !filter.assignedBy.includes(todo.assignedBy || 'system')) return false
    if (filter.hierarchyLevel && !filter.hierarchyLevel.includes(todo.hierarchyLevel || 'individual')) return false
    if (filter.hasGoal !== undefined && (!!todo.goalId) !== filter.hasGoal) return false
    
    if (filter.dueDate) {
      if (filter.dueDate.before && todo.dueDate && new Date(todo.dueDate) > new Date(filter.dueDate.before)) return false
      if (filter.dueDate.after && todo.dueDate && new Date(todo.dueDate) < new Date(filter.dueDate.after)) return false
    }
    
    return true
  }

  private calculateTodoSummary(todos: AgentTodo[]) {
    const now = new Date()
    
    return {
      total: todos.length,
      pending: todos.filter(t => t.status === 'pending').length,
      inProgress: todos.filter(t => t.status === 'in_progress').length,
      completed: todos.filter(t => t.status === 'completed').length,
      blocked: todos.filter(t => t.status === 'blocked').length,
      highPriority: todos.filter(t => t.priority === 'high' || t.priority === 'critical').length,
      overdue: todos.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length
    }
  }

  private categorizeFarmPriorities(todos: AgentTodo[]) {
    const now = new Date()
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return {
      immediate: todos.filter(t => 
        t.priority === 'critical' || 
        (t.dueDate && new Date(t.dueDate) <= oneDayFromNow)
      ),
      planned: todos.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) > oneDayFromNow && 
        new Date(t.dueDate) <= oneWeekFromNow
      ),
      longTerm: todos.filter(t => 
        !t.dueDate || 
        new Date(t.dueDate) > oneWeekFromNow
      )
    }
  }

  private calculateFarmProgress(agentTodoLists: Record<string, AgentTodoList>) {
    const agentIds = Object.keys(agentTodoLists)
    const totalTodos = agentIds.reduce((sum, id) => sum + agentTodoLists[id].summary.total, 0)
    const completedTodos = agentIds.reduce((sum, id) => sum + agentTodoLists[id].summary.completed, 0)

    return {
      overallCompletion: totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0,
      agentPerformance: Object.fromEntries(
        agentIds.map(id => [
          id, 
          agentTodoLists[id].summary.total > 0 
            ? (agentTodoLists[id].summary.completed / agentTodoLists[id].summary.total) * 100 
            : 0
        ])
      ),
      goalProgress: {} // Would be calculated based on goal-related todos
    }
  }

  private calculateAnalyticsMetrics(todos: AgentTodo[]) {
    const completed = todos.filter(t => t.status === 'completed')
    const overdue = todos.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed')
    
    return {
      completionRate: todos.length > 0 ? (completed.length / todos.length) * 100 : 0,
      averageCompletionTime: this.calculateAverageCompletionTime(completed),
      priorityDistribution: this.calculateDistribution(todos, 'priority'),
      categoryDistribution: this.calculateDistribution(todos, 'category'),
      blockedTasksCount: todos.filter(t => t.status === 'blocked').length,
      overdueTasksCount: overdue.length
    }
  }

  private calculateTrends(todos: AgentTodo[], startDate: Date, endDate: Date) {
    // Simplified trend calculation
    return {
      completionTrend: [],
      priorityTrends: {
        low: [],
        medium: [],
        high: [],
        critical: []
      }
    }
  }

  private calculatePerformanceMetrics(todos: AgentTodo[]) {
    return {
      topPerformingAgents: [],
      farmComparison: {}
    }
  }

  private calculateDistribution<T extends keyof AgentTodo>(todos: AgentTodo[], field: T): Record<string, number> {
    const distribution: Record<string, number> = {}
    todos.forEach(todo => {
      const value = String(todo[field])
      distribution[value] = (distribution[value] || 0) + 1
    })
    return distribution
  }

  private calculateAverageCompletionTime(completedTodos: AgentTodo[]): number {
    if (completedTodos.length === 0) return 0
    
    const totalTime = completedTodos.reduce((sum, todo) => {
      if (todo.completedAt) {
        return sum + (new Date(todo.completedAt).getTime() - new Date(todo.createdAt).getTime())
      }
      return sum
    }, 0)
    
    return totalTime / completedTodos.length / (1000 * 60 * 60) // Convert to hours
  }

  private mapGoalPriorityToTodoPriority(goalPriority?: string): AgentTodo['priority'] {
    switch (goalPriority) {
      case 'urgent': return 'critical'
      case 'high': return 'high'
      case 'medium': return 'medium'
      case 'low': return 'low'
      default: return 'medium'
    }
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'trading_analysis',
        name: 'Market Analysis',
        description: 'Perform comprehensive market analysis',
        category: 'analysis',
        priority: 'high',
        steps: [
          { title: 'Gather market data', result: null },
          { title: 'Analyze trends', result: null },
          { title: 'Generate insights', result: null },
          { title: 'Update strategy', result: null }
        ],
        estimatedDuration: 60,
        requiredSkills: ['technical_analysis', 'market_data']
      },
      {
        id: 'trade_execution',
        name: 'Execute Trade',
        description: 'Execute trading decision based on strategy',
        category: 'trading',
        priority: 'high',
        steps: [
          { title: 'Validate trade signal', result: null },
          { title: 'Check risk limits', result: null },
          { title: 'Place order', result: null },
          { title: 'Monitor execution', result: null }
        ],
        estimatedDuration: 30,
        requiredSkills: ['trading', 'risk_management']
      }
    ]
  }

  private async loadFromStorage(): Promise<void> {
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return // Skip loading in server-side environment
      }
      
      const stored = localStorage.getItem('agent_todos')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.todos) {
          this.todos = new Map(data.todos)
        }
        if (data.notifications) {
          this.notifications = data.notifications
        }
      }
    } catch (error) {
      console.warn('Failed to load todos from storage:', error)
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = {
        todos: Array.from(this.todos.entries()),
        notifications: this.notifications
      }
      localStorage.setItem('agent_todos', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save todos to storage:', error)
    }
  }

  // ===== PUBLIC API METHODS =====

  // Get todos for specific contexts
  getTodosByGoal(goalId: string): AgentTodo[] {
    return Array.from(this.todos.values()).filter(todo => todo.goalId === goalId)
  }

  getTodosByFarm(farmId: string): AgentTodo[] {
    return Array.from(this.todos.values()).filter(todo => todo.farmId === farmId)
  }

  getNotifications(agentId: string): TodoNotification[] {
    return this.notifications.filter(notif => notif.agentId === agentId)
  }

  getTemplates(): TodoTemplate[] {
    return this.templates
  }

  // Mark notification as read
  async markNotificationRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      await this.saveToStorage()
    }
  }
}

// Export singleton instance
// Lazy initialization
let agentTodoServiceInstance: AgentTodoService | null = null

export function getAgentTodoService(): AgentTodoService {
  if (!agentTodoServiceInstance) {
    agentTodoServiceInstance = new AgentTodoService()
  }
  return agentTodoServiceInstance
}

// For backward compatibility
export const agentTodoService = {
  get instance() {
    return getAgentTodoService()
  }
}
export default agentTodoService