'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle2,
  Clock,
  Plus,
  Filter,
  MoreVertical,
  Target,
  Bot,
  Calendar,
  Flag,
  Users,
  Brain,
  TrendingUp,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Edit,
  Trash2,
  Copy,
  ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Import our todo service and types
import agentTodoService from '@/lib/agents/agent-todo-service'
import { 
  AgentTodo, 
  AgentTodoList, 
  CreateTodoRequest, 
  TodoFilter,
  TodoTemplate
} from '@/types/agent-todos'

interface AgentTodoManagerProps {
  agentId: string
  farmId?: string
  className?: string
  showFarmCoordination?: boolean
}

export function AgentTodoManager({ 
  agentId, 
  farmId, 
  className = '',
  showFarmCoordination = false 
}: AgentTodoManagerProps) {
  const [todoList, setTodoList] = useState<AgentTodoList | null>(null)
  const [filter, setFilter] = useState<TodoFilter>({})
  const [selectedTodo, setSelectedTodo] = useState<AgentTodo | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [templates, setTemplates] = useState<TodoTemplate[]>([])

  // Form state for creating new todos
  const [newTodo, setNewTodo] = useState<Partial<CreateTodoRequest>>({
    agentId,
    farmId,
    title: '',
    description: '',
    priority: 'medium',
    category: 'trading',
    assignedBy: 'user'
  })

  // Load todo data
  useEffect(() => {
    loadTodoData()
    loadTemplates()
  }, [agentId, farmId, filter])

  const loadTodoData = async () => {
    try {
      setLoading(true)
      const response = await agentTodoService.getAgentTodos(agentId, filter)
      if (response.success && response.data) {
        setTodoList(response.data)
      } else {
        toast.error(response.error || 'Failed to load todos')
      }
    } catch (error) {
      console.error('Error loading todos:', error)
      toast.error('Failed to load todo data')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const todoTemplates = agentTodoService.getTemplates()
      setTemplates(todoTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  // Create new todo
  const handleCreateTodo = async () => {
    if (!newTodo.title?.trim()) {
      toast.error('Todo title is required')
      return
    }

    try {
      setLoading(true)
      const response = await agentTodoService.createTodo(newTodo as CreateTodoRequest)
      if (response.success) {
        toast.success('Todo created successfully!')
        setShowCreateDialog(false)
        setNewTodo({
          agentId,
          farmId,
          title: '',
          description: '',
          priority: 'medium',
          category: 'trading',
          assignedBy: 'user'
        })
        await loadTodoData()
      } else {
        toast.error(response.error || 'Failed to create todo')
      }
    } catch (error) {
      console.error('Error creating todo:', error)
      toast.error('Failed to create todo')
    } finally {
      setLoading(false)
    }
  }

  // Update todo status
  const handleUpdateTodoStatus = async (todoId: string, status: AgentTodo['status']) => {
    try {
      const response = await agentTodoService.updateTodo({
        id: todoId,
        updates: { status },
        updatedBy: agentId
      })
      if (response.success) {
        toast.success(`Todo ${status}`)
        await loadTodoData()
      } else {
        toast.error(response.error || 'Failed to update todo')
      }
    } catch (error) {
      console.error('Error updating todo:', error)
      toast.error('Failed to update todo')
    }
  }

  // Update todo priority
  const handleUpdateTodoPriority = async (todoId: string, priority: AgentTodo['priority']) => {
    try {
      const response = await agentTodoService.updateTodo({
        id: todoId,
        updates: { priority },
        updatedBy: agentId
      })
      if (response.success) {
        toast.success(`Priority updated to ${priority}`)
        await loadTodoData()
      } else {
        toast.error(response.error || 'Failed to update priority')
      }
    } catch (error) {
      console.error('Error updating priority:', error)
      toast.error('Failed to update priority')
    }
  }

  // Delete todo
  const handleDeleteTodo = async (todoId: string) => {
    try {
      const response = await agentTodoService.deleteTodo(todoId)
      if (response.success) {
        toast.success('Todo deleted')
        await loadTodoData()
      } else {
        toast.error(response.error || 'Failed to delete todo')
      }
    } catch (error) {
      console.error('Error deleting todo:', error)
      toast.error('Failed to delete todo')
    }
  }

  // Create todo from template
  const handleCreateFromTemplate = async (template: TodoTemplate) => {
    const todoRequest: CreateTodoRequest = {
      agentId,
      farmId,
      title: template.name,
      description: template.description,
      priority: template.priority,
      category: template.category,
      assignedBy: 'system',
      context: template.defaultContext
    }

    try {
      const response = await agentTodoService.createTodo(todoRequest)
      if (response.success) {
        toast.success(`Todo created from ${template.name} template`)
        await loadTodoData()
      } else {
        toast.error(response.error || 'Failed to create todo from template')
      }
    } catch (error) {
      console.error('Error creating todo from template:', error)
      toast.error('Failed to create todo from template')
    }
  }

  // Get priority icon and color
  const getPriorityDisplay = (priority: AgentTodo['priority']) => {
    switch (priority) {
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' }
      case 'high':
        return { icon: Flag, color: 'text-orange-500', bg: 'bg-orange-50' }
      case 'medium':
        return { icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-50' }
      case 'low':
        return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' }
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50' }
    }
  }

  // Get status display
  const getStatusDisplay = (status: AgentTodo['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' }
      case 'in_progress':
        return { icon: PlayCircle, color: 'text-blue-500', label: 'In Progress' }
      case 'blocked':
        return { icon: PauseCircle, color: 'text-red-500', label: 'Blocked' }
      case 'cancelled':
        return { icon: XCircle, color: 'text-gray-500', label: 'Cancelled' }
      default:
        return { icon: Clock, color: 'text-gray-500', label: 'Pending' }
    }
  }

  // Get category icon
  const getCategoryIcon = (category: AgentTodo['category']) => {
    switch (category) {
      case 'trading': return Bot
      case 'analysis': return TrendingUp
      case 'coordination': return Users
      case 'goal': return Target
      case 'system': return Brain
      default: return Clock
    }
  }

  // Filter todos by tab
  const getFilteredTodos = (tab: string) => {
    if (!todoList) return []
    
    switch (tab) {
      case 'active':
        return todoList.todos.filter(todo => 
          todo.status === 'pending' || todo.status === 'in_progress'
        )
      case 'completed':
        return todoList.todos.filter(todo => todo.status === 'completed')
      case 'blocked':
        return todoList.todos.filter(todo => 
          todo.status === 'blocked' || todo.status === 'cancelled'
        )
      case 'all':
        return todoList.todos
      default:
        return todoList.todos
    }
  }

  if (!todoList) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Loading todos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Agent Todo Manager
          </h3>
          <p className="text-sm text-muted-foreground">
            Task management for Agent {agentId}
            {farmId && ` (Farm: ${farmId})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDialog(true)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Todo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{todoList.summary.total}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {todoList.summary.pending + todoList.summary.inProgress}
                </p>
              </div>
              <PlayCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{todoList.summary.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{todoList.summary.highPriority}</p>
              </div>
              <Flag className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Todo Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">
            Active ({todoList.summary.pending + todoList.summary.inProgress})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({todoList.summary.completed})
          </TabsTrigger>
          <TabsTrigger value="blocked">
            Blocked ({todoList.summary.blocked})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({todoList.summary.total})
          </TabsTrigger>
        </TabsList>

        {['active', 'completed', 'blocked', 'all'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <AnimatePresence>
              {getFilteredTodos(tab).map((todo, index) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TodoCard 
                    todo={todo} 
                    onStatusUpdate={handleUpdateTodoStatus}
                    onPriorityUpdate={handleUpdateTodoPriority}
                    onDelete={handleDeleteTodo}
                    onEdit={setSelectedTodo}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {getFilteredTodos(tab).length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No todos in this category</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Todo Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Todo</DialogTitle>
            <DialogDescription>
              Add a new task for this agent to work on
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTodo.title || ''}
                onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter todo title..."
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTodo.description || ''}
                onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter todo description..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={newTodo.priority}
                  onValueChange={(value: AgentTodo['priority']) => 
                    setNewTodo(prev => ({ ...prev, priority: value }))
                  }
                >
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
                <Label>Category</Label>
                <Select
                  value={newTodo.category}
                  onValueChange={(value: AgentTodo['category']) => 
                    setNewTodo(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="coordination">Coordination</SelectItem>
                    <SelectItem value="goal">Goal</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={newTodo.dueDate || ''}
                onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTodo}
              disabled={loading || !newTodo.title?.trim()}
            >
              {loading ? 'Creating...' : 'Create Todo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Section */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {templates.map(template => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateFromTemplate(template)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium text-xs">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Individual Todo Card Component
function TodoCard({ 
  todo, 
  onStatusUpdate, 
  onPriorityUpdate, 
  onDelete, 
  onEdit 
}: {
  todo: AgentTodo
  onStatusUpdate: (id: string, status: AgentTodo['status']) => void
  onPriorityUpdate: (id: string, priority: AgentTodo['priority']) => void
  onDelete: (id: string) => void
  onEdit: (todo: AgentTodo) => void
}) {
  const priorityDisplay = getPriorityDisplay(todo.priority)
  const statusDisplay = getStatusDisplay(todo.status)
  const CategoryIcon = getCategoryIcon(todo.category)
  const PriorityIcon = priorityDisplay.icon
  const StatusIcon = statusDisplay.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CategoryIcon className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-sm">{todo.title}</h4>
              {todo.goalId && (
                <Badge variant="outline" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  Goal
                </Badge>
              )}
            </div>
            
            {todo.description && (
              <p className="text-xs text-muted-foreground mb-2">
                {todo.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className={`${priorityDisplay.color}`}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {todo.priority}
              </Badge>
              
              <Badge variant="outline" className={`${statusDisplay.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusDisplay.label}
              </Badge>
              
              <Badge variant="secondary">
                {todo.category}
              </Badge>
              
              {todo.dueDate && (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(todo.dueDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {todo.status !== 'completed' && (
                <DropdownMenuItem 
                  onClick={() => onStatusUpdate(todo.id, 'completed')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              
              {todo.status === 'pending' && (
                <DropdownMenuItem 
                  onClick={() => onStatusUpdate(todo.id, 'in_progress')}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Progress
                </DropdownMenuItem>
              )}
              
              {todo.status === 'in_progress' && (
                <DropdownMenuItem 
                  onClick={() => onStatusUpdate(todo.id, 'pending')}
                >
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => onEdit(todo)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => onDelete(todo.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {todo.progress && todo.progress.percentage > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{todo.progress.percentage}%</span>
            </div>
            <Progress value={todo.progress.percentage} className="h-1" />
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Helper function (moved outside component to avoid recreation)
function getPriorityDisplay(priority: AgentTodo['priority']) {
  switch (priority) {
    case 'critical':
      return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' }
    case 'high':
      return { icon: Flag, color: 'text-orange-500', bg: 'bg-orange-50' }
    case 'medium':
      return { icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-50' }
    case 'low':
      return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' }
    default:
      return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50' }
  }
}

function getStatusDisplay(status: AgentTodo['status']) {
  switch (status) {
    case 'completed':
      return { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' }
    case 'in_progress':
      return { icon: PlayCircle, color: 'text-blue-500', label: 'In Progress' }
    case 'blocked':
      return { icon: PauseCircle, color: 'text-red-500', label: 'Blocked' }
    case 'cancelled':
      return { icon: XCircle, color: 'text-gray-500', label: 'Cancelled' }
    default:
      return { icon: Clock, color: 'text-gray-500', label: 'Pending' }
  }
}

function getCategoryIcon(category: AgentTodo['category']) {
  switch (category) {
    case 'trading': return Bot
    case 'analysis': return TrendingUp
    case 'coordination': return Users
    case 'goal': return Target
    case 'system': return Brain
    default: return Clock
  }
}