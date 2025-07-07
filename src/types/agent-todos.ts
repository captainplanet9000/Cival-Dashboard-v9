/**
 * Agent Todo System Types
 * Comprehensive task management system for AI trading agents
 */

export interface AgentTodo {
  id: string
  agentId: string
  farmId?: string
  goalId?: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'trading' | 'analysis' | 'coordination' | 'goal' | 'system' | 'learning'
  
  // Task scheduling and timing
  createdAt: string
  updatedAt: string
  dueDate?: string
  completedAt?: string
  
  // Task dependencies and relationships
  parentTodoId?: string
  dependsOn?: string[]
  blockedBy?: string[]
  
  // Farm hierarchy and coordination
  assignedBy?: 'system' | 'farm_coordinator' | 'agent' | 'user'
  hierarchyLevel?: 'individual' | 'group' | 'farm' | 'global'
  
  // Task context and metadata
  context?: {
    marketConditions?: string
    strategy?: string
    riskLevel?: string
    targetValue?: number
    customInstructions?: string
  }
  
  // Progress tracking
  progress?: {
    percentage: number
    steps: TodoStep[]
    metrics?: Record<string, any>
  }
  
  // Farm coordination
  farmRole?: 'individual' | 'coordinator' | 'supervisor' | 'specialist'
  teamSize?: number
  collaborators?: string[]
  
  // Results and outcomes
  result?: {
    status: 'success' | 'failure' | 'partial'
    data?: any
    notes?: string
    learnings?: string[]
  }
}

export interface TodoStep {
  id: string
  title: string
  completed: boolean
  timestamp?: string
  result?: any
}

export interface AgentTodoList {
  agentId: string
  farmId?: string
  todos: AgentTodo[]
  summary: {
    total: number
    pending: number
    inProgress: number
    completed: number
    blocked: number
    highPriority: number
    overdue: number
  }
  lastUpdated: string
}

export interface FarmTodoCoordination {
  farmId: string
  coordinatorAgentId?: string
  sharedTodos: AgentTodo[]
  agentTodoLists: Record<string, AgentTodoList>
  farmGoals: string[]
  coordinationStrategy: 'independent' | 'coordinated' | 'hierarchical'
  
  // Farm-level task management
  priorities: {
    immediate: AgentTodo[]
    planned: AgentTodo[]
    longTerm: AgentTodo[]
  }
  
  // Progress tracking
  farmProgress: {
    overallCompletion: number
    agentPerformance: Record<string, number>
    goalProgress: Record<string, number>
  }
}

export interface TodoTemplate {
  id: string
  name: string
  description: string
  category: AgentTodo['category']
  priority: AgentTodo['priority']
  steps: Omit<TodoStep, 'id' | 'completed' | 'timestamp'>[]
  defaultContext?: AgentTodo['context']
  estimatedDuration?: number
  requiredSkills?: string[]
}

export interface TodoFilter {
  status?: AgentTodo['status'][]
  priority?: AgentTodo['priority'][]
  category?: AgentTodo['category'][]
  farmId?: string
  agentId?: string
  assignedBy?: AgentTodo['assignedBy'][]
  dueDate?: {
    before?: string
    after?: string
  }
  hasGoal?: boolean
  hierarchyLevel?: AgentTodo['hierarchyLevel'][]
}

export interface TodoUpdate {
  id: string
  updates: Partial<Pick<AgentTodo, 
    'status' | 'priority' | 'description' | 'progress' | 'result' | 'dueDate'
  >>
  updateReason?: string
  updatedBy: string
}

export interface TodoNotification {
  id: string
  todoId: string
  agentId: string
  type: 'created' | 'updated' | 'completed' | 'overdue' | 'blocked' | 'assigned'
  message: string
  timestamp: string
  read: boolean
  actionRequired?: boolean
}

// Todo system analytics
export interface TodoAnalytics {
  agentId?: string
  farmId?: string
  timeRange: {
    start: string
    end: string
  }
  
  metrics: {
    completionRate: number
    averageCompletionTime: number
    priorityDistribution: Record<AgentTodo['priority'], number>
    categoryDistribution: Record<AgentTodo['category'], number>
    blockedTasksCount: number
    overdueTasksCount: number
  }
  
  trends: {
    completionTrend: Array<{
      date: string
      completed: number
      created: number
    }>
    priorityTrends: Record<AgentTodo['priority'], number[]>
  }
  
  performance: {
    topPerformingAgents?: Array<{
      agentId: string
      completionRate: number
      avgTime: number
    }>
    farmComparison?: Record<string, {
      completionRate: number
      efficiency: number
    }>
  }
}

// API response types
export interface TodoApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface CreateTodoRequest {
  agentId: string
  farmId?: string
  goalId?: string
  title: string
  description: string
  priority: AgentTodo['priority']
  category: AgentTodo['category']
  dueDate?: string
  context?: AgentTodo['context']
  assignedBy?: AgentTodo['assignedBy']
  hierarchyLevel?: AgentTodo['hierarchyLevel']
  dependencies?: string[]
}

export interface BulkTodoOperation {
  operation: 'create' | 'update' | 'delete' | 'assign'
  todoIds?: string[]
  todos?: CreateTodoRequest[]
  updates?: Partial<AgentTodo>
  targetAgents?: string[]
  farmId?: string
}