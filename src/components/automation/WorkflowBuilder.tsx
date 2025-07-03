'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Plus, Settings, Play, Save, Download, Upload,
  Zap, Clock, Database, Send, Filter, Calculator,
  ArrowRight, Trash2, Copy, Edit3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WorkflowNode, WorkflowConnection, TradingWorkflow } from '@/lib/automation/n8n-client'

interface WorkflowBuilderProps {
  workflow?: TradingWorkflow
  onSave?: (workflow: Partial<TradingWorkflow>) => void
  onExecute?: (workflow: TradingWorkflow) => void
}

interface NodeType {
  id: string
  name: string
  category: 'trigger' | 'action' | 'condition' | 'transform'
  icon: React.ReactNode
  description: string
  color: string
  parameters: Array<{
    name: string
    type: 'text' | 'number' | 'select' | 'boolean'
    label: string
    default?: any
    options?: Array<{ value: string; label: string }>
  }>
}

const nodeTypes: NodeType[] = [
  {
    id: 'interval_trigger',
    name: 'Interval Trigger',
    category: 'trigger',
    icon: <Clock className="h-4 w-4" />,
    description: 'Triggers workflow at regular intervals',
    color: 'bg-blue-500',
    parameters: [
      { name: 'interval', type: 'number', label: 'Interval (seconds)', default: 60 },
      { name: 'mode', type: 'select', label: 'Mode', default: 'interval', options: [
        { value: 'interval', label: 'Interval' },
        { value: 'cron', label: 'Cron Expression' }
      ]}
    ]
  },
  {
    id: 'webhook_trigger',
    name: 'Webhook Trigger',
    category: 'trigger',
    icon: <Zap className="h-4 w-4" />,
    description: 'Triggers when webhook receives data',
    color: 'bg-green-500',
    parameters: [
      { name: 'path', type: 'text', label: 'Webhook Path', default: '/webhook' },
      { name: 'method', type: 'select', label: 'HTTP Method', default: 'POST', options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' }
      ]}
    ]
  },
  {
    id: 'market_data',
    name: 'Market Data',
    category: 'action',
    icon: <Database className="h-4 w-4" />,
    description: 'Fetch market data from exchanges',
    color: 'bg-purple-500',
    parameters: [
      { name: 'symbol', type: 'text', label: 'Symbol', default: 'BTC/USDT' },
      { name: 'exchange', type: 'select', label: 'Exchange', default: 'binance', options: [
        { value: 'binance', label: 'Binance' },
        { value: 'coinbase', label: 'Coinbase' },
        { value: 'kraken', label: 'Kraken' }
      ]}
    ]
  },
  {
    id: 'technical_indicator',
    name: 'Technical Indicator',
    category: 'transform',
    icon: <Calculator className="h-4 w-4" />,
    description: 'Calculate technical indicators',
    color: 'bg-amber-500',
    parameters: [
      { name: 'indicator', type: 'select', label: 'Indicator', default: 'rsi', options: [
        { value: 'rsi', label: 'RSI' },
        { value: 'macd', label: 'MACD' },
        { value: 'sma', label: 'Simple Moving Average' },
        { value: 'ema', label: 'Exponential Moving Average' }
      ]},
      { name: 'period', type: 'number', label: 'Period', default: 14 }
    ]
  },
  {
    id: 'condition_check',
    name: 'Condition Check',
    category: 'condition',
    icon: <Filter className="h-4 w-4" />,
    description: 'Check conditions and route execution',
    color: 'bg-red-500',
    parameters: [
      { name: 'condition', type: 'text', label: 'Condition', default: '{{$json.rsi}} < 30' },
      { name: 'operation', type: 'select', label: 'Operation', default: 'smaller', options: [
        { value: 'equal', label: 'Equal' },
        { value: 'smaller', label: 'Smaller' },
        { value: 'larger', label: 'Larger' }
      ]}
    ]
  },
  {
    id: 'send_signal',
    name: 'Send Trading Signal',
    category: 'action',
    icon: <Send className="h-4 w-4" />,
    description: 'Send trading signal to exchange or bot',
    color: 'bg-emerald-500',
    parameters: [
      { name: 'action', type: 'select', label: 'Action', default: 'buy', options: [
        { value: 'buy', label: 'Buy' },
        { value: 'sell', label: 'Sell' },
        { value: 'hold', label: 'Hold' }
      ]},
      { name: 'quantity', type: 'number', label: 'Quantity', default: 1 },
      { name: 'price', type: 'number', label: 'Price (optional)' }
    ]
  }
]

export function WorkflowBuilder({ workflow, onSave, onExecute }: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow?.nodes || [])
  const [connections, setConnections] = useState<WorkflowConnection[]>(workflow?.connections || [])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow')
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '')

  const addNode = useCallback((nodeType: NodeType, x: number = 300, y: number = 200) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: nodeType.name,
      type: nodeType.category,
      nodeType: nodeType.id,
      position: [x, y],
      parameters: nodeType.parameters.reduce((acc, param) => {
        acc[param.name] = param.default
        return acc
      }, {} as { [key: string]: any })
    }

    setNodes(prev => [...prev, newNode])
  }, [])

  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ))
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    setConnections(prev => prev.filter(conn => 
      conn.node !== nodeId
    ))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }, [selectedNode])

  const duplicateNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      const newNode: WorkflowNode = {
        ...node,
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: [node.position[0] + 50, node.position[1] + 50]
      }
      setNodes(prev => [...prev, newNode])
    }
  }, [nodes])

  const connectNodes = useCallback((fromNodeId: string, toNodeId: string) => {
    const newConnection: WorkflowConnection = {
      node: fromNodeId,
      type: 'main',
      index: 0
    }
    setConnections(prev => [...prev, newConnection])
  }, [])

  const handleSave = useCallback(() => {
    const workflowData: Partial<TradingWorkflow> = {
      name: workflowName,
      description: workflowDescription,
      nodes,
      connections,
      active: false
    }
    onSave?.(workflowData)
  }, [workflowName, workflowDescription, nodes, connections, onSave])

  const handleExecute = useCallback(() => {
    const workflowData: TradingWorkflow = {
      id: workflow?.id || 'temp',
      name: workflowName,
      description: workflowDescription,
      nodes,
      connections,
      active: true,
      settings: workflow?.settings || {
        timezone: 'UTC',
        saveExecutionProgress: true,
        saveManualExecutions: true,
        callerPolicy: 'workflowsFromSameOwner'
      }
    }
    onExecute?.(workflowData)
  }, [workflow, workflowName, workflowDescription, nodes, connections, onExecute])

  const getNodeType = (nodeTypeId: string) => {
    return nodeTypes.find(nt => nt.id === nodeTypeId)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b p-4 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-4">
          <div>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="font-semibold text-lg border-none p-0 h-auto"
              placeholder="Workflow Name"
            />
            <Input
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="text-sm text-muted-foreground border-none p-0 h-auto mt-1"
              placeholder="Description"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button onClick={handleExecute}>
            <Play className="h-4 w-4 mr-2" />
            Execute
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Node Palette */}
        <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Node Library</h3>
          <div className="space-y-6">
            {['trigger', 'action', 'condition', 'transform'].map(category => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 mb-2 uppercase">
                  {category}s
                </h4>
                <div className="space-y-2">
                  {nodeTypes.filter(nt => nt.category === category).map(nodeType => (
                    <Card
                      key={nodeType.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addNode(nodeType)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-md ${nodeType.color} flex items-center justify-center text-white`}>
                            {nodeType.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{nodeType.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {nodeType.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-gray-100 overflow-hidden">
          <div className="absolute inset-0 p-4">
            {/* Grid Background */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Nodes */}
            <AnimatePresence>
              {nodes.map((node) => {
                const nodeType = getNodeType(node.nodeType)
                if (!nodeType) return null

                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                      position: 'absolute',
                      left: node.position[0],
                      top: node.position[1],
                      zIndex: selectedNode?.id === node.id ? 10 : 1
                    }}
                    className={`w-48 ${selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow bg-white"
                      onClick={() => setSelectedNode(node)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-md ${nodeType.color} flex items-center justify-center text-white`}>
                              {nodeType.icon}
                            </div>
                            <CardTitle className="text-sm">{node.name}</CardTitle>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {nodeType.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-500 mb-2">{nodeType.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                duplicateNode(node.id)
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNode(node.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map((connection, index) => {
                const fromNode = nodes.find(n => n.id === connection.node)
                if (!fromNode) return null

                const toNode = nodes[nodes.findIndex(n => n.id === fromNode.id) + 1]
                if (!toNode) return null

                const x1 = fromNode.position[0] + 192 // Node width
                const y1 = fromNode.position[1] + 40  // Node center
                const x2 = toNode.position[0]
                const y2 = toNode.position[1] + 40

                return (
                  <g key={index}>
                    <path
                      d={`M ${x1} ${y1} C ${x1 + 50} ${y1} ${x2 - 50} ${y2} ${x2} ${y2}`}
                      stroke="#6b7280"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                )
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#6b7280"
                  />
                </marker>
              </defs>
            </svg>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Node Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="node-name">Node Name</Label>
                <Input
                  id="node-name"
                  value={selectedNode.name}
                  onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                />
              </div>

              {getNodeType(selectedNode.nodeType)?.parameters.map((param) => (
                <div key={param.name}>
                  <Label htmlFor={param.name}>{param.label}</Label>
                  {param.type === 'text' && (
                    <Input
                      id={param.name}
                      value={selectedNode.parameters[param.name] || ''}
                      onChange={(e) => updateNode(selectedNode.id, {
                        parameters: {
                          ...selectedNode.parameters,
                          [param.name]: e.target.value
                        }
                      })}
                    />
                  )}
                  {param.type === 'number' && (
                    <Input
                      id={param.name}
                      type="number"
                      value={selectedNode.parameters[param.name] || ''}
                      onChange={(e) => updateNode(selectedNode.id, {
                        parameters: {
                          ...selectedNode.parameters,
                          [param.name]: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  )}
                  {param.type === 'select' && param.options && (
                    <Select
                      value={selectedNode.parameters[param.name] || param.default}
                      onValueChange={(value) => updateNode(selectedNode.id, {
                        parameters: {
                          ...selectedNode.parameters,
                          [param.name]: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkflowBuilder