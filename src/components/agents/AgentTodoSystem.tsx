'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  User, 
  Users, 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Calendar,
  Timer,
  TrendingUp,
  Activity,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react'

export interface AgentTodo {
  id: string
  agentId: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'trading' | 'analysis' | 'learning' | 'maintenance' | 'communication' | 'strategy'
  parentTodoId?: string
  subtodos: string[]
  assignedBy?: string
  assignedTo?: string
  createdAt: number
  updatedAt: number
  dueDate?: number
  estimatedDuration?: number // in minutes
  actualDuration?: number
  dependencies: string[]
  tags: string[]
  metadata: {
    tradingSymbol?: string
    strategyType?: string
    riskLevel?: number
    expectedROI?: number
    marketConditions?: string
    notes?: string
  }
}

export interface AgentTodoSystemProps {
  agentId: string
  agentHierarchy?: string[]
  className?: string
  onTodoUpdate?: (todo: AgentTodo) => void
  onSystemUpdate?: (stats: TodoSystemStats) => void
}

export interface TodoSystemStats {
  totalTodos: number
  completedTodos: number
  inProgressTodos: number
  blockedTodos: number
  completionRate: number
  averageCompletionTime: number
  priorityDistribution: Record<string, number>
  categoryDistribution: Record<string, number>
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600'
}

const CATEGORY_ICONS = {
  trading: Target,
  analysis: TrendingUp,
  learning: Activity,
  maintenance: Timer,
  communication: Users,
  strategy: Flag
}

export function AgentTodoSystem({
  agentId,
  agentHierarchy = [],
  className = '',
  onTodoUpdate,
  onSystemUpdate
}: AgentTodoSystemProps) {
  const [todos, setTodos] = useState<AgentTodo[]>([])
  const [filteredTodos, setFilteredTodos] = useState<AgentTodo[]>([])
  const [selectedTodo, setSelectedTodo] = useState<AgentTodo | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy' | 'kanban'>('list')
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<TodoSystemStats>({
    totalTodos: 0,
    completedTodos: 0,
    inProgressTodos: 0,
    blockedTodos: 0,
    completionRate: 0,
    averageCompletionTime: 0,
    priorityDistribution: {},
    categoryDistribution: {}
  })

  // Load todos on mount
  useEffect(() => {
    loadAgentTodos()
  }, [agentId])

  // Update filtered todos when filters change
  useEffect(() => {
    applyFilters()
  }, [todos, searchQuery, statusFilter, priorityFilter, categoryFilter])

  // Update stats when todos change
  useEffect(() => {
    calculateStats()
  }, [todos])

  const loadAgentTodos = useCallback(async () => {
    try {
      const stored = localStorage.getItem(`agent_todos_${agentId}`)
      if (stored) {
        const agentTodos = JSON.parse(stored)
        setTodos(agentTodos)
      }
    } catch (error) {
      console.error('Failed to load agent todos:', error)
    }
  }, [agentId])

  const persistTodos = useCallback((updatedTodos: AgentTodo[]) => {
    try {
      localStorage.setItem(`agent_todos_${agentId}`, JSON.stringify(updatedTodos))
    } catch (error) {
      console.error('Failed to persist todos:', error)
    }
  }, [agentId])

  const createTodo = async (todoData: Partial<AgentTodo>): Promise<AgentTodo> => {
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

    const updatedTodos = [...todos, newTodo]
    
    // If this is a subtodo, add it to the parent
    if (newTodo.parentTodoId) {
      const parentIndex = updatedTodos.findIndex(t => t.id === newTodo.parentTodoId)
      if (parentIndex !== -1) {
        updatedTodos[parentIndex].subtodos.push(newTodo.id)
        updatedTodos[parentIndex].updatedAt = Date.now()
      }
    }

    setTodos(updatedTodos)
    persistTodos(updatedTodos)
    onTodoUpdate?.(newTodo)
    
    return newTodo
  }

  const updateTodo = async (todoId: string, updates: Partial<AgentTodo>): Promise<void> => {
    const updatedTodos = todos.map(todo => {
      if (todo.id === todoId) {
        const updatedTodo = {
          ...todo,
          ...updates,
          updatedAt: Date.now()
        }
        
        // Track completion time
        if (updates.status === 'completed' && todo.status !== 'completed') {
          updatedTodo.actualDuration = Date.now() - todo.createdAt
        }
        
        onTodoUpdate?.(updatedTodo)
        return updatedTodo
      }
      return todo
    })

    setTodos(updatedTodos)
    persistTodos(updatedTodos)
  }

  const deleteTodo = async (todoId: string): Promise<void> => {
    const todoToDelete = todos.find(t => t.id === todoId)
    if (!todoToDelete) return

    // Remove from parent's subtodos if it's a subtodo
    let updatedTodos = todos.filter(t => t.id !== todoId)
    
    if (todoToDelete.parentTodoId) {
      updatedTodos = updatedTodos.map(todo => {
        if (todo.id === todoToDelete.parentTodoId) {
          return {
            ...todo,
            subtodos: todo.subtodos.filter(id => id !== todoId),
            updatedAt: Date.now()
          }
        }
        return todo
      })
    }

    // Delete all subtodos recursively
    const deleteSubtodos = (parentId: string) => {
      const subtodoIds = todos.find(t => t.id === parentId)?.subtodos || []
      subtodoIds.forEach(subtodoId => {
        deleteSubtodos(subtodoId)
        updatedTodos = updatedTodos.filter(t => t.id !== subtodoId)
      })
    }
    deleteSubtodos(todoId)

    setTodos(updatedTodos)
    persistTodos(updatedTodos)
  }

  const toggleExpanded = (todoId: string) => {
    const newExpanded = new Set(expandedTodos)
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId)
    } else {
      newExpanded.add(todoId)
    }
    setExpandedTodos(newExpanded)
  }

  const applyFilters = () => {
    let filtered = todos.filter(todo => {
      const matchesSearch = !searchQuery || 
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || todo.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter
      const matchesCategory = categoryFilter === 'all' || todo.category === categoryFilter
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory
    })

    setFilteredTodos(filtered)
  }

  const calculateStats = () => {
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

    const newStats = {
      totalTodos,
      completedTodos,
      inProgressTodos,
      blockedTodos,
      completionRate,
      averageCompletionTime,
      priorityDistribution,
      categoryDistribution
    }

    setStats(newStats)
    onSystemUpdate?.(newStats)
  }

  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDueDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = (timestamp - now.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 0) {
      return 'Overdue'
    } else if (diffHours < 24) {
      return `Due in ${Math.floor(diffHours)}h`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high': return <ArrowUp className="h-4 w-4 text-orange-500" />
      case 'medium': return <MoreHorizontal className="h-4 w-4 text-blue-500" />
      case 'low': return <ArrowDown className="h-4 w-4 text-gray-500" />
      default: return <Circle className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress': return <Play className="h-4 w-4 text-blue-500" />
      case 'blocked': return <Pause className="h-4 w-4 text-red-500" />
      case 'cancelled': return <RotateCcw className="h-4 w-4 text-gray-500" />
      default: return <Circle className="h-4 w-4 text-gray-500" />
    }
  }

  const renderTodoItem = (todo: AgentTodo, level: number = 0) => {
    const hasSubtodos = todo.subtodos.length > 0
    const isExpanded = expandedTodos.has(todo.id)
    const CategoryIcon = CATEGORY_ICONS[todo.category]

    return (
      <div key={todo.id} className={`border rounded-lg p-4 mb-2 ${level > 0 ? 'ml-6 border-l-4 border-l-blue-200' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {hasSubtodos && (
              <button
                onClick={() => toggleExpanded(todo.id)}
                className="mt-1 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(todo.status)}
              <CategoryIcon className="h-4 w-4 text-gray-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className={`font-medium ${todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {todo.title}
                </h4>
                {getPriorityIcon(todo.priority)}
              </div>
              
              {todo.description && (
                <p className="text-sm text-gray-600 mb-2">{todo.description}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={STATUS_COLORS[todo.status]}>
                  {todo.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={PRIORITY_COLORS[todo.priority]}>
                  {todo.priority}
                </Badge>
                <Badge variant="outline">
                  {todo.category}
                </Badge>
                
                {todo.dueDate && (
                  <div className={`text-xs flex items-center space-x-1 ${
                    todo.dueDate < Date.now() ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <Calendar className="h-3 w-3" />
                    <span>{formatDueDate(todo.dueDate)}</span>
                  </div>
                )}
                
                {todo.estimatedDuration && (
                  <div className="text-xs flex items-center space-x-1 text-gray-600">
                    <Timer className="h-3 w-3" />
                    <span>{formatDuration(todo.estimatedDuration)}</span>
                  </div>
                )}
                
                {todo.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTodo(todo)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTodo(todo.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Render subtodos */}
        {hasSubtodos && isExpanded && (
          <div className="mt-4">
            {todo.subtodos.map(subtodoId => {
              const subtodo = todos.find(t => t.id === subtodoId)
              return subtodo ? renderTodoItem(subtodo, level + 1) : null
            })}
          </div>
        )}
      </div>
    )
  }

  const renderCreateTodoModal = () => (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to the agent's todo list
          </DialogDescription>
        </DialogHeader>
        <CreateTodoForm
          onCreateTodo={createTodo}
          onClose={() => setIsCreateModalOpen(false)}
          availableParents={todos.filter(t => !t.parentTodoId)}
        />
      </DialogContent>
    </Dialog>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            Agent Todo System
          </h2>
          <p className="text-muted-foreground">
            Task management and goal tracking for {agentId}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.totalTodos}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedTodos}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgressTodos}</p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="trading">Trading</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="learning">Learning</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="strategy">Strategy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Todo List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            {filteredTodos.length} of {todos.length} tasks shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredTodos
                .filter(todo => !todo.parentTodoId) // Only show top-level todos
                .map(todo => renderTodoItem(todo))}
              {filteredTodos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks match the current filters
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Todo Modal */}
      {renderCreateTodoModal()}

      {/* Edit Todo Modal */}
      {selectedTodo && (
        <EditTodoModal
          todo={selectedTodo}
          onUpdateTodo={updateTodo}
          onClose={() => setSelectedTodo(null)}
          availableParents={todos.filter(t => t.id !== selectedTodo.id && !t.parentTodoId)}
        />
      )}
    </div>
  )
}

// Create Todo Form Component
interface CreateTodoFormProps {
  onCreateTodo: (todoData: Partial<AgentTodo>) => Promise<AgentTodo>
  onClose: () => void
  availableParents: AgentTodo[]
}

function CreateTodoForm({ onCreateTodo, onClose, availableParents }: CreateTodoFormProps) {
  const [formData, setFormData] = useState<Partial<AgentTodo>>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'trading',
    tags: [],
    metadata: {}
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onCreateTodo(formData)
      onClose()
    } catch (error) {
      console.error('Failed to create todo:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trading">Trading</SelectItem>
              <SelectItem value="analysis">Analysis</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="communication">Communication</SelectItem>
              <SelectItem value="strategy">Strategy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Create Task
        </Button>
      </div>
    </form>
  )
}

// Edit Todo Modal Component  
interface EditTodoModalProps {
  todo: AgentTodo
  onUpdateTodo: (todoId: string, updates: Partial<AgentTodo>) => Promise<void>
  onClose: () => void
  availableParents: AgentTodo[]
}

function EditTodoModal({ todo, onUpdateTodo, onClose, availableParents }: EditTodoModalProps) {
  const [formData, setFormData] = useState<Partial<AgentTodo>>(todo)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onUpdateTodo(todo.id, formData)
      onClose()
    } catch (error) {
      console.error('Failed to update todo:', error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details and status
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trading">Trading</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="strategy">Strategy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgentTodoSystem