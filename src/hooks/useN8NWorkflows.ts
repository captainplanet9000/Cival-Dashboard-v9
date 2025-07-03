'use client'

import { useState, useEffect, useCallback } from 'react'
import { n8nClient, type TradingWorkflow, type WorkflowExecution, type TradingSignal, type WorkflowTemplate } from '@/lib/automation/n8n-client'

export interface N8NStatus {
  connected: boolean
  lastError: string | null
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions: number
  successRate: number
}

export function useN8NWorkflows() {
  const [workflows, setWorkflows] = useState<TradingWorkflow[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [status, setStatus] = useState<N8NStatus>({
    connected: false,
    lastError: null,
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
    successRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Initialize N8N connection and load data
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        const connected = await n8nClient.connect()
        await loadWorkflows()
        await loadExecutions()
        await loadTemplates()
        updateStatus()
      } catch (error) {
        console.error('Error initializing N8N:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()

    // Periodic refresh
    const interval = setInterval(() => {
      loadWorkflows()
      loadExecutions()
      updateStatus()
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadWorkflows = useCallback(async () => {
    try {
      const workflowData = await n8nClient.getWorkflows()
      setWorkflows(workflowData)
    } catch (error) {
      console.error('Error loading workflows:', error)
    }
  }, [])

  const loadExecutions = useCallback(async () => {
    try {
      const executionData = await n8nClient.getExecutions()
      setExecutions(executionData)
    } catch (error) {
      console.error('Error loading executions:', error)
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    try {
      const templateData = await n8nClient.getWorkflowTemplates()
      setTemplates(templateData)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }, [])

  const updateStatus = useCallback(() => {
    const activeWorkflows = workflows.filter(w => w.active).length
    const successfulExecutions = executions.filter(e => e.status === 'success').length
    const successRate = executions.length > 0 ? (successfulExecutions / executions.length) * 100 : 0

    setStatus({
      connected: n8nClient.connected,
      lastError: n8nClient.lastErrorMessage,
      totalWorkflows: workflows.length,
      activeWorkflows,
      totalExecutions: executions.length,
      successRate
    })
  }, [workflows, executions])

  // Workflow Management
  const createWorkflow = useCallback(async (workflow: Partial<TradingWorkflow>): Promise<boolean> => {
    try {
      const created = await n8nClient.createWorkflow(workflow)
      if (created) {
        await loadWorkflows()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating workflow:', error)
      return false
    }
  }, [loadWorkflows])

  const updateWorkflow = useCallback(async (id: string, updates: Partial<TradingWorkflow>): Promise<boolean> => {
    try {
      const success = await n8nClient.updateWorkflow(id, updates)
      if (success) {
        await loadWorkflows()
      }
      return success
    } catch (error) {
      console.error('Error updating workflow:', error)
      return false
    }
  }, [loadWorkflows])

  const deleteWorkflow = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await n8nClient.deleteWorkflow(id)
      if (success) {
        await loadWorkflows()
      }
      return success
    } catch (error) {
      console.error('Error deleting workflow:', error)
      return false
    }
  }, [loadWorkflows])

  const activateWorkflow = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await n8nClient.activateWorkflow(id)
      if (success) {
        await loadWorkflows()
      }
      return success
    } catch (error) {
      console.error('Error activating workflow:', error)
      return false
    }
  }, [loadWorkflows])

  const deactivateWorkflow = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await n8nClient.deactivateWorkflow(id)
      if (success) {
        await loadWorkflows()
      }
      return success
    } catch (error) {
      console.error('Error deactivating workflow:', error)
      return false
    }
  }, [loadWorkflows])

  // Workflow Execution
  const executeWorkflow = useCallback(async (id: string, data?: any): Promise<WorkflowExecution | null> => {
    try {
      const execution = await n8nClient.executeWorkflow(id, data)
      if (execution) {
        await loadExecutions()
      }
      return execution
    } catch (error) {
      console.error('Error executing workflow:', error)
      return null
    }
  }, [loadExecutions])

  const stopExecution = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await n8nClient.stopExecution(id)
      if (success) {
        await loadExecutions()
      }
      return success
    } catch (error) {
      console.error('Error stopping execution:', error)
      return false
    }
  }, [loadExecutions])

  // Template Management
  const createWorkflowFromTemplate = useCallback(async (templateId: string, parameters?: any): Promise<boolean> => {
    try {
      const workflow = await n8nClient.createWorkflowFromTemplate(templateId, parameters)
      if (workflow) {
        await loadWorkflows()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating workflow from template:', error)
      return false
    }
  }, [loadWorkflows])

  // Trading Signal Processing
  const sendTradingSignal = useCallback(async (signal: TradingSignal): Promise<boolean> => {
    try {
      return await n8nClient.sendTradingSignal(signal)
    } catch (error) {
      console.error('Error sending trading signal:', error)
      return false
    }
  }, [])

  const processTradingSignals = useCallback(async (signals: TradingSignal[]): Promise<{ success: number; failed: number }> => {
    try {
      return await n8nClient.processTradingSignals(signals)
    } catch (error) {
      console.error('Error processing trading signals:', error)
      return { success: 0, failed: signals.length }
    }
  }, [])

  // Utility functions
  const getWorkflowById = useCallback((id: string): TradingWorkflow | undefined => {
    return workflows.find(w => w.id === id)
  }, [workflows])

  const getExecutionsByWorkflow = useCallback((workflowId: string): WorkflowExecution[] => {
    return executions.filter(e => e.workflowId === workflowId)
  }, [executions])

  const getActiveWorkflows = useCallback((): TradingWorkflow[] => {
    return workflows.filter(w => w.active)
  }, [workflows])

  const getRecentExecutions = useCallback((): WorkflowExecution[] => {
    return executions
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 10)
  }, [executions])

  const getWorkflowStats = useCallback((workflowId: string) => {
    const workflowExecutions = getExecutionsByWorkflow(workflowId)
    const successful = workflowExecutions.filter(e => e.status === 'success').length
    const failed = workflowExecutions.filter(e => e.status === 'error').length
    const running = workflowExecutions.filter(e => e.status === 'running').length

    return {
      total: workflowExecutions.length,
      successful,
      failed,
      running,
      successRate: workflowExecutions.length > 0 ? (successful / workflowExecutions.length) * 100 : 0
    }
  }, [getExecutionsByWorkflow])

  return {
    // Data
    workflows,
    executions,
    templates,
    status,
    isLoading,

    // Actions
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    executeWorkflow,
    stopExecution,
    createWorkflowFromTemplate,
    sendTradingSignal,
    processTradingSignals,

    // Utilities
    getWorkflowById,
    getExecutionsByWorkflow,
    getActiveWorkflows,
    getRecentExecutions,
    getWorkflowStats,
    
    // Refresh
    refresh: loadWorkflows
  }
}

// Specialized hook for workflow templates
export function useWorkflowTemplates() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true)
      try {
        const templateData = await n8nClient.getWorkflowTemplates()
        setTemplates(templateData)
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [])

  const getTemplatesByCategory = useCallback((category: string): WorkflowTemplate[] => {
    return templates.filter(t => t.category === category)
  }, [templates])

  return {
    templates,
    isLoading,
    getTemplatesByCategory
  }
}

// Hook for monitoring workflow executions
export function useWorkflowMonitoring() {
  const [realtimeExecutions, setRealtimeExecutions] = useState<WorkflowExecution[]>([])
  const [alerts, setAlerts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' }>>([])

  useEffect(() => {
    // Simulate real-time execution monitoring
    const interval = setInterval(async () => {
      try {
        const executions = await n8nClient.getExecutions()
        setRealtimeExecutions(executions)

        // Check for new failures and create alerts
        const recentFailures = executions.filter(e => 
          e.status === 'error' && 
          new Date(e.startedAt).getTime() > Date.now() - 300000 // Last 5 minutes
        )

        if (recentFailures.length > 0) {
          const newAlerts = recentFailures.map(e => ({
            id: e.id,
            message: `Workflow execution failed: ${e.workflowId}`,
            type: 'error' as const
          }))
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 10))
        }
      } catch (error) {
        console.error('Error monitoring executions:', error)
      }
    }, 60000) // Every 60 seconds (reduced from 10 seconds)

    return () => clearInterval(interval)
  }, [])

  const clearAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }, [])

  const clearAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  return {
    realtimeExecutions,
    alerts,
    clearAlert,
    clearAllAlerts
  }
}