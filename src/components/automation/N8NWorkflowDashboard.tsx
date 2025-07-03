'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Activity, Play, Pause, Square, Plus, Settings, Zap,
  CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp,
  BarChart3, Workflow, Bot, RefreshCw, Download, Upload
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useN8NWorkflows, useWorkflowTemplates, useWorkflowMonitoring } from '@/hooks/useN8NWorkflows'
import type { TradingWorkflow, WorkflowTemplate, TradingSignal } from '@/lib/automation/n8n-client'

interface N8NWorkflowDashboardProps {
  isConnected?: boolean
}

export function N8NWorkflowDashboard({ isConnected = false }: N8NWorkflowDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    category: 'technical_analysis'
  })

  const {
    workflows,
    executions,
    status,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    executeWorkflow,
    createWorkflowFromTemplate,
    sendTradingSignal,
    getWorkflowStats,
    getRecentExecutions,
    refresh
  } = useN8NWorkflows()

  const { templates } = useWorkflowTemplates()
  const { alerts, clearAlert, clearAllAlerts } = useWorkflowMonitoring()

  const handleCreateWorkflow = async () => {
    if (selectedTemplate) {
      const success = await createWorkflowFromTemplate(selectedTemplate)
      if (success) {
        setIsCreateDialogOpen(false)
        setSelectedTemplate('')
      }
    } else {
      const success = await createWorkflow(newWorkflow)
      if (success) {
        setIsCreateDialogOpen(false)
        setNewWorkflow({ name: '', description: '', category: 'technical_analysis' })
      }
    }
  }

  const handleToggleWorkflow = async (workflow: TradingWorkflow) => {
    if (workflow.active) {
      await deactivateWorkflow(workflow.id)
    } else {
      await activateWorkflow(workflow.id)
    }
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    await executeWorkflow(workflowId)
  }

  const handleSendTestSignal = async () => {
    const testSignal: TradingSignal = {
      symbol: 'BTC/USD',
      action: 'buy',
      quantity: 0.1,
      price: 50000,
      confidence: 0.85,
      source: 'manual_test',
      timestamp: new Date().toISOString(),
      metadata: { test: true }
    }
    
    await sendTradingSignal(testSignal)
  }

  const recentExecutions = getRecentExecutions()
  const templateCategories = [...new Set(templates.map(t => t.category))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">N8N Workflow Automation</h2>
          <p className="text-muted-foreground">
            Automated trading strategies and workflow management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={status.connected ? 'default' : 'secondary'}>
            {status.connected ? 'Connected' : 'Offline'}
          </Badge>
          <Button onClick={refresh} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>
                  Create a workflow from scratch or use a template
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="template" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="template">From Template</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                <TabsContent value="template" className="space-y-4">
                  <div>
                    <Label>Select Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} - {template.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="custom" className="space-y-4">
                  <div>
                    <Label htmlFor="workflow-name">Name</Label>
                    <Input
                      id="workflow-name"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Trading Strategy"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workflow-description">Description</Label>
                    <Textarea
                      id="workflow-description"
                      value={newWorkflow.description}
                      onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your workflow..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={newWorkflow.category} 
                      onValueChange={(value) => setNewWorkflow(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkflow} disabled={!selectedTemplate && !newWorkflow.name}>
                  Create Workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Workflow Alerts ({alerts.length})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearAllAlerts}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-sm text-red-700">{alert.message}</span>
                  <Button variant="ghost" size="sm" onClick={() => clearAlert(alert.id)}>
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Workflows</p>
                  <p className="text-2xl font-bold">{status.totalWorkflows}</p>
                </div>
                <Workflow className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{status.activeWorkflows}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Executions</p>
                  <p className="text-2xl font-bold">{status.totalExecutions}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{status.successRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Workflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflows.filter(w => w.active).map((workflow) => {
                    const stats = getWorkflowStats(workflow.id)
                    return (
                      <div key={workflow.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{workflow.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.total} executions • {stats.successRate.toFixed(1)}% success
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Active</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExecuteWorkflow(workflow.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Executions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Executions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentExecutions.map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {execution.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : execution.status === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : execution.status === 'running' ? (
                          <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{execution.workflowId}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(execution.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          execution.status === 'success' ? 'default' :
                          execution.status === 'error' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {execution.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleSendTestSignal} variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Send Test Signal
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Workflows
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Workflows
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  N8N Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => {
              const stats = getWorkflowStats(workflow.id)
              return (
                <Card key={workflow.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <Badge variant={workflow.active ? 'default' : 'secondary'}>
                        {workflow.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Executions</p>
                          <p className="font-semibold">{stats.total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-semibold">{stats.successRate.toFixed(1)}%</p>
                        </div>
                      </div>
                      {workflow.lastExecution && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Last Run</p>
                          <p className="font-semibold">
                            {new Date(workflow.lastExecution.startedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleWorkflow(workflow)}
                          className="flex-1"
                        >
                          {workflow.active ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecuteWorkflow(workflow.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {execution.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : execution.status === 'error' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : execution.status === 'running' ? (
                          <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <Badge 
                          variant={
                            execution.status === 'success' ? 'default' :
                            execution.status === 'error' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {execution.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium">{execution.workflowId}</p>
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(execution.startedAt).toLocaleString()}
                        </p>
                        {execution.finishedAt && (
                          <p className="text-sm text-muted-foreground">
                            Duration: {Math.round((new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{execution.mode}</p>
                      {execution.status === 'running' && (
                        <Button variant="outline" size="sm">
                          <Square className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="outline" className="w-fit">
                    {template.category.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  <div className="text-sm mb-4">
                    <p className="text-muted-foreground">Nodes: {template.nodes.length}</p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedTemplate(template.id)
                      setIsCreateDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default N8NWorkflowDashboard