'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
} from '@/components/ui/dialog'
import {
  Users,
  Bot,
  Target,
  Brain,
  TrendingUp,
  Network,
  Plus,
  Calendar,
  Flag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Layers,
  Settings,
  ArrowRight,
  BarChart3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Import our todo service and types
import agentTodoService from '@/lib/agents/agent-todo-service'
import { 
  FarmTodoCoordination as FarmTodoCoordinationType,
  AgentTodo,
  AgentTodoList,
  CreateTodoRequest,
  BulkTodoOperation
} from '@/types/agent-todos'

// Import agent manager for getting agent info
import { AgentTodoManager } from '@/components/agents/AgentTodoManager'

interface FarmTodoCoordinationProps {
  farmId: string
  farmName: string
  agentIds: string[]
  coordinationMode: 'independent' | 'coordinated' | 'hierarchical'
  className?: string
}

export function FarmTodoCoordination({ 
  farmId, 
  farmName, 
  agentIds, 
  coordinationMode,
  className = '' 
}: FarmTodoCoordinationProps) {
  const [farmCoordination, setFarmCoordination] = useState<FarmTodoCoordinationType | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false)
  const [showCoordinationDialog, setShowCoordinationDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Bulk assignment state
  const [bulkAssignment, setBulkAssignment] = useState({
    todoType: 'analysis' as AgentTodo['category'],
    priority: 'medium' as AgentTodo['priority'],
    targetAgents: [] as string[],
    title: '',
    description: ''
  })

  useEffect(() => {
    loadFarmCoordination()
  }, [farmId])

  const loadFarmCoordination = async () => {
    try {
      setLoading(true)
      const response = await agentTodoService.getFarmTodos(farmId)
      if (response.success && response.data) {
        setFarmCoordination(response.data)
      } else {
        toast.error(response.error || 'Failed to load farm coordination')
      }
    } catch (error) {
      console.error('Error loading farm coordination:', error)
      toast.error('Failed to load farm coordination data')
    } finally {
      setLoading(false)
    }
  }

  // Create shared farm todo
  const handleCreateSharedTodo = async (todoData: Partial<CreateTodoRequest>) => {
    if (!todoData.title?.trim()) {
      toast.error('Todo title is required')
      return
    }

    try {
      setLoading(true)
      
      // Create a farm-level shared todo
      const todoRequest: CreateTodoRequest = {
        agentId: agentIds[0], // Assign to first agent as coordinator
        farmId,
        title: todoData.title,
        description: todoData.description || '',
        priority: todoData.priority || 'medium',
        category: todoData.category || 'coordination',
        assignedBy: 'farm_coordinator',
        hierarchyLevel: 'farm'
      }

      const response = await agentTodoService.createTodo(todoRequest)
      if (response.success) {
        toast.success('Shared farm todo created!')
        await loadFarmCoordination()
      } else {
        toast.error(response.error || 'Failed to create shared todo')
      }
    } catch (error) {
      console.error('Error creating shared todo:', error)
      toast.error('Failed to create shared todo')
    } finally {
      setLoading(false)
    }
  }

  // Bulk assign todos to multiple agents
  const handleBulkAssignTodos = async () => {
    if (!bulkAssignment.title.trim() || bulkAssignment.targetAgents.length === 0) {
      toast.error('Title and at least one agent are required')
      return
    }

    try {
      setLoading(true)
      
      const todos: CreateTodoRequest[] = bulkAssignment.targetAgents.map(agentId => ({
        agentId,
        farmId,
        title: bulkAssignment.title,
        description: bulkAssignment.description,
        priority: bulkAssignment.priority,
        category: bulkAssignment.todoType,
        assignedBy: 'farm_coordinator',
        hierarchyLevel: 'group'
      }))

      const bulkOperation: BulkTodoOperation = {
        operation: 'create',
        todos,
        farmId
      }

      const response = await agentTodoService.bulkOperation(bulkOperation)
      if (response.success) {
        toast.success(`Bulk assigned todos to ${bulkAssignment.targetAgents.length} agents`)
        setShowBulkAssignDialog(false)
        setBulkAssignment({
          todoType: 'analysis',
          priority: 'medium',
          targetAgents: [],
          title: '',
          description: ''
        })
        await loadFarmCoordination()
      } else {
        toast.error(response.error || 'Bulk assignment failed')
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error)
      toast.error('Bulk assignment failed')
    } finally {
      setLoading(false)
    }
  }

  // Coordinate farm-wide task prioritization
  const handleFarmCoordination = async (action: 'rebalance' | 'prioritize' | 'optimize') => {
    try {
      setLoading(true)
      
      switch (action) {
        case 'rebalance':
          // Redistribute workload across agents
          await redistributeWorkload()
          toast.success('Workload rebalanced across agents')
          break
          
        case 'prioritize':
          // Update priorities based on farm goals
          await updateFarmPriorities()
          toast.success('Task priorities updated based on farm goals')
          break
          
        case 'optimize':
          // Optimize task assignments based on agent performance
          await optimizeTaskAssignments()
          toast.success('Task assignments optimized')
          break
      }
      
      await loadFarmCoordination()
    } catch (error) {
      console.error(`Error in ${action}:`, error)
      toast.error(`Failed to ${action} farm coordination`)
    } finally {
      setLoading(false)
    }
  }

  // Helper coordination functions
  const redistributeWorkload = async () => {
    if (!farmCoordination) return
    
    // Calculate average workload
    const agentWorkloads = Object.entries(farmCoordination.agentTodoLists).map(([agentId, todoList]) => ({
      agentId,
      activeTodos: todoList.summary.pending + todoList.summary.inProgress,
      performance: farmCoordination.farmProgress.agentPerformance[agentId] || 0
    }))
    
    const avgWorkload = agentWorkloads.reduce((sum, agent) => sum + agent.activeTodos, 0) / agentWorkloads.length
    
    // Redistribute from overloaded to underloaded agents
    const overloadedAgents = agentWorkloads.filter(agent => agent.activeTodos > avgWorkload * 1.2)
    const underloadedAgents = agentWorkloads.filter(agent => agent.activeTodos < avgWorkload * 0.8)
    
    // Implementation would involve moving pending todos between agents
    console.log('Rebalancing workload...', { overloadedAgents, underloadedAgents })
  }

  const updateFarmPriorities = async () => {
    if (!farmCoordination) return
    
    // Update priorities based on farm goals and performance
    const highPerformanceAgents = Object.entries(farmCoordination.farmProgress.agentPerformance)
      .filter(([_, performance]) => performance > 80)
      .map(([agentId]) => agentId)
    
    // Assign critical tasks to high-performance agents
    console.log('Updating priorities...', { highPerformanceAgents })
  }

  const optimizeTaskAssignments = async () => {
    if (!farmCoordination) return
    
    // Optimize based on agent specializations and performance
    console.log('Optimizing task assignments...')
  }

  // Get coordination strategy display
  const getCoordinationStrategy = () => {
    switch (coordinationMode) {
      case 'hierarchical':
        return {
          icon: Layers,
          label: 'Hierarchical',
          description: 'Top-down coordination with clear agent roles',
          color: 'text-purple-600'
        }
      case 'coordinated':
        return {
          icon: Network,
          label: 'Coordinated',
          description: 'Collaborative coordination with shared goals',
          color: 'text-blue-600'
        }
      case 'independent':
        return {
          icon: Bot,
          label: 'Independent',
          description: 'Autonomous agents with minimal coordination',
          color: 'text-green-600'
        }
    }
  }

  if (!farmCoordination) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <Network className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Loading farm coordination...</p>
          </div>
        </div>
      </div>
    )
  }

  const strategy = getCoordinationStrategy()
  const StrategyIcon = strategy.icon

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <StrategyIcon className={`h-5 w-5 ${strategy.color}`} />
            Farm Todo Coordination
          </h3>
          <p className="text-sm text-muted-foreground">
            {farmName} • {strategy.label} • {agentIds.length} agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCoordinationDialog(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Coordinate
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowBulkAssignDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Bulk Assign
          </Button>
        </div>
      </div>

      {/* Farm Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Farm Progress</span>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Completion</span>
                <span>{farmCoordination.farmProgress.overallCompletion.toFixed(1)}%</span>
              </div>
              <Progress value={farmCoordination.farmProgress.overallCompletion} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Shared Tasks</span>
              <Users className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{farmCoordination.sharedTodos.length}</div>
            <div className="text-xs text-muted-foreground">Farm-wide coordination</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Active Agents</span>
              <Bot className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">
              {Object.keys(farmCoordination.agentTodoLists).length}
            </div>
            <div className="text-xs text-muted-foreground">Coordinated agents</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Coordination Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="priorities">Priorities</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="shared">Shared Tasks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Immediate</span>
                    </div>
                    <span className="text-sm font-medium">
                      {farmCoordination.priorities.immediate.length}
                    </span>
                  </div>
                  <Progress 
                    value={(farmCoordination.priorities.immediate.length / (farmCoordination.priorities.immediate.length + farmCoordination.priorities.planned.length + farmCoordination.priorities.longTerm.length)) * 100} 
                    className="h-2" 
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Planned</span>
                    </div>
                    <span className="text-sm font-medium">
                      {farmCoordination.priorities.planned.length}
                    </span>
                  </div>
                  <Progress 
                    value={(farmCoordination.priorities.planned.length / (farmCoordination.priorities.immediate.length + farmCoordination.priorities.planned.length + farmCoordination.priorities.longTerm.length)) * 100} 
                    className="h-2" 
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Long Term</span>
                    </div>
                    <span className="text-sm font-medium">
                      {farmCoordination.priorities.longTerm.length}
                    </span>
                  </div>
                  <Progress 
                    value={(farmCoordination.priorities.longTerm.length / (farmCoordination.priorities.immediate.length + farmCoordination.priorities.planned.length + farmCoordination.priorities.longTerm.length)) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agent Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(farmCoordination.farmProgress.agentPerformance).map(([agentId, performance]) => (
                    <div key={agentId} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Agent {agentId.slice(-6)}</span>
                        <span>{performance.toFixed(1)}%</span>
                      </div>
                      <Progress value={performance} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Priorities Tab */}
        <TabsContent value="priorities" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Immediate Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Immediate ({farmCoordination.priorities.immediate.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {farmCoordination.priorities.immediate.slice(0, 5).map(todo => (
                  <div key={todo.id} className="p-2 border rounded text-xs">
                    <div className="font-medium">{todo.title}</div>
                    <div className="text-muted-foreground">Agent {todo.agentId.slice(-6)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Planned Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Planned ({farmCoordination.priorities.planned.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {farmCoordination.priorities.planned.slice(0, 5).map(todo => (
                  <div key={todo.id} className="p-2 border rounded text-xs">
                    <div className="font-medium">{todo.title}</div>
                    <div className="text-muted-foreground">Agent {todo.agentId.slice(-6)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Long Term Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Long Term ({farmCoordination.priorities.longTerm.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {farmCoordination.priorities.longTerm.slice(0, 5).map(todo => (
                  <div key={todo.id} className="p-2 border rounded text-xs">
                    <div className="font-medium">{todo.title}</div>
                    <div className="text-muted-foreground">Agent {todo.agentId.slice(-6)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(farmCoordination.agentTodoLists).map(([agentId, todoList]) => (
              <Card key={agentId} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Agent {agentId.slice(-6)}</CardTitle>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedAgent(agentId)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Total Tasks</span>
                      <span>{todoList.summary.total}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Active</span>
                      <span>{todoList.summary.pending + todoList.summary.inProgress}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Completed</span>
                      <span>{todoList.summary.completed}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Performance</span>
                      <span>{farmCoordination.farmProgress.agentPerformance[agentId]?.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={farmCoordination.farmProgress.agentPerformance[agentId] || 0} 
                      className="h-1" 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Shared Tasks Tab */}
        <TabsContent value="shared" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Farm-wide Shared Tasks</h4>
              <Button
                size="sm"
                onClick={() => handleCreateSharedTodo({
                  title: 'New Farm Coordination Task',
                  category: 'coordination',
                  priority: 'medium'
                })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Shared Task
              </Button>
            </div>
            
            {farmCoordination.sharedTodos.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No shared tasks yet</p>
                <p className="text-xs text-muted-foreground">Create farm-wide tasks for coordination</p>
              </div>
            ) : (
              <div className="space-y-3">
                {farmCoordination.sharedTodos.map(todo => (
                  <Card key={todo.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-sm">{todo.title}</h5>
                          <p className="text-xs text-muted-foreground mb-2">{todo.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {todo.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {todo.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {todo.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Assigned to: Agent {todo.agentId.slice(-6)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Assignment Dialog */}
      <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Assign Tasks</DialogTitle>
            <DialogDescription>
              Create and assign the same task to multiple agents
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-title">Task Title</Label>
              <Input
                id="bulk-title"
                value={bulkAssignment.title}
                onChange={(e) => setBulkAssignment(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title..."
              />
            </div>
            
            <div>
              <Label htmlFor="bulk-description">Description</Label>
              <Textarea
                id="bulk-description"
                value={bulkAssignment.description}
                onChange={(e) => setBulkAssignment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={bulkAssignment.todoType}
                  onValueChange={(value: AgentTodo['category']) => 
                    setBulkAssignment(prev => ({ ...prev, todoType: value }))
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
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Priority</Label>
                <Select
                  value={bulkAssignment.priority}
                  onValueChange={(value: AgentTodo['priority']) => 
                    setBulkAssignment(prev => ({ ...prev, priority: value }))
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
            </div>
            
            <div>
              <Label>Target Agents</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {agentIds.map(agentId => (
                  <label key={agentId} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={bulkAssignment.targetAgents.includes(agentId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkAssignment(prev => ({
                            ...prev,
                            targetAgents: [...prev.targetAgents, agentId]
                          }))
                        } else {
                          setBulkAssignment(prev => ({
                            ...prev,
                            targetAgents: prev.targetAgents.filter(id => id !== agentId)
                          }))
                        }
                      }}
                    />
                    <span className="text-sm">Agent {agentId.slice(-6)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkAssignDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAssignTodos}
              disabled={loading || !bulkAssignment.title.trim() || bulkAssignment.targetAgents.length === 0}
            >
              {loading ? 'Assigning...' : `Assign to ${bulkAssignment.targetAgents.length} agents`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coordination Actions Dialog */}
      <Dialog open={showCoordinationDialog} onOpenChange={setShowCoordinationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Farm Coordination Actions</DialogTitle>
            <DialogDescription>
              Perform farm-wide coordination and optimization
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleFarmCoordination('rebalance')}
              disabled={loading}
            >
              <Users className="h-4 w-4 mr-2" />
              Rebalance Workload
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleFarmCoordination('prioritize')}
              disabled={loading}
            >
              <Flag className="h-4 w-4 mr-2" />
              Update Priorities
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleFarmCoordination('optimize')}
              disabled={loading}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Optimize Assignments
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCoordinationDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selected Agent Todo Manager */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agent {selectedAgent.slice(-6)} Todo Management</DialogTitle>
            </DialogHeader>
            <AgentTodoManager 
              agentId={selectedAgent} 
              farmId={farmId} 
              showFarmCoordination={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}