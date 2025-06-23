'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Play,
  Pause,
  Square,
  Settings,
  Download,
  Upload,
  Save,
  Copy,
  Trash2,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Shield,
  Zap,
  GitBranch,
  Layers,
  Code,
  Database,
  Calculator,
  Clock,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  MousePointer,
  Move,
  RotateCcw,
  Undo,
  Redo
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Line, Bar } from 'react-chartjs-2'

export interface StrategyNode {
  id: string
  type: 'indicator' | 'condition' | 'action' | 'trigger' | 'filter' | 'signal'
  category: 'technical' | 'fundamental' | 'risk' | 'execution' | 'timing'
  name: string
  label: string
  description: string
  icon: React.ReactNode
  position: { x: number; y: number }
  inputs: Array<{
    id: string
    name: string
    type: 'number' | 'string' | 'boolean' | 'signal'
    value?: any
    required?: boolean
  }>
  outputs: Array<{
    id: string
    name: string
    type: 'number' | 'string' | 'boolean' | 'signal'
  }>
  config: Record<string, any>
  connections: Array<{
    outputId: string
    targetNodeId: string
    targetInputId: string
  }>
}

export interface StrategyConnection {
  id: string
  fromNodeId: string
  fromOutputId: string
  toNodeId: string
  toInputId: string
  color: string
}

export interface BacktestResult {
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  profitFactor: number
  avgTrade: number
  equity: Array<{ date: Date; value: number }>
  trades: Array<{
    date: Date
    side: 'buy' | 'sell'
    price: number
    quantity: number
    pnl: number
  }>
  metrics: {
    volatility: number
    beta: number
    alpha: number
    informationRatio: number
    calmarRatio: number
  }
}

export interface VisualStrategyBuilderProps {
  onSaveStrategy: (strategy: { nodes: StrategyNode[]; connections: StrategyConnection[] }) => void
  onBacktest: (strategy: any) => Promise<BacktestResult>
  onDeploy: (strategy: any) => Promise<void>
  className?: string
  defaultStrategy?: { nodes: StrategyNode[]; connections: StrategyConnection[] }
}

// Predefined node types
const NODE_TYPES = {
  // Technical Indicators
  sma: {
    type: 'indicator',
    category: 'technical',
    name: 'SMA',
    label: 'Simple Moving Average',
    description: 'Calculate simple moving average',
    icon: <TrendingUp className="h-4 w-4" />,
    inputs: [
      { id: 'price', name: 'Price', type: 'number', required: true },
      { id: 'period', name: 'Period', type: 'number', value: 20, required: true }
    ],
    outputs: [
      { id: 'value', name: 'SMA Value', type: 'number' }
    ],
    config: { period: 20, source: 'close' }
  },
  rsi: {
    type: 'indicator',
    category: 'technical',
    name: 'RSI',
    label: 'Relative Strength Index',
    description: 'Calculate RSI momentum indicator',
    icon: <BarChart3 className="h-4 w-4" />,
    inputs: [
      { id: 'price', name: 'Price', type: 'number', required: true },
      { id: 'period', name: 'Period', type: 'number', value: 14, required: true }
    ],
    outputs: [
      { id: 'value', name: 'RSI Value', type: 'number' }
    ],
    config: { period: 14 }
  },
  macd: {
    type: 'indicator',
    category: 'technical',
    name: 'MACD',
    label: 'MACD',
    description: 'Moving Average Convergence Divergence',
    icon: <TrendingUp className="h-4 w-4" />,
    inputs: [
      { id: 'price', name: 'Price', type: 'number', required: true }
    ],
    outputs: [
      { id: 'macd', name: 'MACD', type: 'number' },
      { id: 'signal', name: 'Signal', type: 'number' },
      { id: 'histogram', name: 'Histogram', type: 'number' }
    ],
    config: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
  },

  // Conditions
  greater_than: {
    type: 'condition',
    category: 'technical',
    name: 'GT',
    label: 'Greater Than',
    description: 'Check if value A > value B',
    icon: <Calculator className="h-4 w-4" />,
    inputs: [
      { id: 'a', name: 'Value A', type: 'number', required: true },
      { id: 'b', name: 'Value B', type: 'number', required: true }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'boolean' }
    ],
    config: {}
  },
  crossover: {
    type: 'condition',
    category: 'technical',
    name: 'CROSS',
    label: 'Crossover',
    description: 'Detect when line A crosses above line B',
    icon: <GitBranch className="h-4 w-4" />,
    inputs: [
      { id: 'fast', name: 'Fast Line', type: 'number', required: true },
      { id: 'slow', name: 'Slow Line', type: 'number', required: true }
    ],
    outputs: [
      { id: 'bullish', name: 'Bullish Cross', type: 'boolean' },
      { id: 'bearish', name: 'Bearish Cross', type: 'boolean' }
    ],
    config: {}
  },

  // Actions
  buy_market: {
    type: 'action',
    category: 'execution',
    name: 'BUY',
    label: 'Buy Market',
    description: 'Execute market buy order',
    icon: <TrendingUp className="h-4 w-4" />,
    inputs: [
      { id: 'signal', name: 'Signal', type: 'boolean', required: true },
      { id: 'quantity', name: 'Quantity', type: 'number', value: 100 }
    ],
    outputs: [
      { id: 'executed', name: 'Executed', type: 'boolean' }
    ],
    config: { orderType: 'market', quantity: 100 }
  },
  sell_market: {
    type: 'action',
    category: 'execution',
    name: 'SELL',
    label: 'Sell Market',
    description: 'Execute market sell order',
    icon: <TrendingDown className="h-4 w-4" />,
    inputs: [
      { id: 'signal', name: 'Signal', type: 'boolean', required: true },
      { id: 'quantity', name: 'Quantity', type: 'number', value: 100 }
    ],
    outputs: [
      { id: 'executed', name: 'Executed', type: 'boolean' }
    ],
    config: { orderType: 'market', quantity: 100 }
  },

  // Risk Management
  stop_loss: {
    type: 'action',
    category: 'risk',
    name: 'STOP',
    label: 'Stop Loss',
    description: 'Set stop loss order',
    icon: <Shield className="h-4 w-4" />,
    inputs: [
      { id: 'trigger', name: 'Trigger', type: 'boolean', required: true },
      { id: 'percentage', name: 'Stop %', type: 'number', value: 2 }
    ],
    outputs: [
      { id: 'executed', name: 'Executed', type: 'boolean' }
    ],
    config: { percentage: 2, trailing: false }
  },
  take_profit: {
    type: 'action',
    category: 'risk',
    name: 'PROFIT',
    label: 'Take Profit',
    description: 'Set take profit order',
    icon: <Target className="h-4 w-4" />,
    inputs: [
      { id: 'trigger', name: 'Trigger', type: 'boolean', required: true },
      { id: 'percentage', name: 'Profit %', type: 'number', value: 5 }
    ],
    outputs: [
      { id: 'executed', name: 'Executed', type: 'boolean' }
    ],
    config: { percentage: 5 }
  }
}

export function VisualStrategyBuilder({
  onSaveStrategy,
  onBacktest,
  onDeploy,
  className,
  defaultStrategy
}: VisualStrategyBuilderProps) {
  const [nodes, setNodes] = useState<StrategyNode[]>(defaultStrategy?.nodes || [])
  const [connections, setConnections] = useState<StrategyConnection[]>(defaultStrategy?.connections || [])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [mode, setMode] = useState<'select' | 'connect' | 'pan'>('select')
  const [zoom, setZoom] = useState(100)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null)
  const [strategyName, setStrategyName] = useState('Untitled Strategy')
  const [showNodeLibrary, setShowNodeLibrary] = useState(true)
  const [history, setHistory] = useState<Array<{ nodes: StrategyNode[]; connections: StrategyConnection[] }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  // Add node to canvas
  const addNode = useCallback((nodeType: string, position: { x: number; y: number }) => {
    const template = NODE_TYPES[nodeType as keyof typeof NODE_TYPES]
    if (!template) return

    const newNode: StrategyNode = {
      id: `${nodeType}_${Date.now()}`,
      ...template,
      position,
      connections: []
    }

    setNodes(prev => [...prev, newNode])
    saveToHistory([...nodes, newNode], connections)
  }, [nodes, connections])

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setConnections(prev => prev.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId))
    if (selectedNode === nodeId) setSelectedNode(null)
  }, [selectedNode])

  // Update node configuration
  const updateNode = useCallback((nodeId: string, updates: Partial<StrategyNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ))
  }, [])

  // Save to history for undo/redo
  const saveToHistory = useCallback((newNodes: StrategyNode[], newConnections: StrategyConnection[]) => {
    const newState = { nodes: newNodes, connections: newConnections }
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newState])
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setNodes(prevState.nodes)
      setConnections(prevState.connections)
      setHistoryIndex(prev => prev - 1)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setNodes(nextState.nodes)
      setConnections(nextState.connections)
      setHistoryIndex(prev => prev + 1)
    }
  }, [history, historyIndex])

  // Run backtest
  const runBacktest = async () => {
    setIsBacktesting(true)
    try {
      const strategy = { nodes, connections }
      const result = await onBacktest(strategy)
      setBacktestResult(result)
    } catch (error) {
      console.error('Backtest failed:', error)
    } finally {
      setIsBacktesting(false)
    }
  }

  // Deploy strategy
  const deployStrategy = async () => {
    try {
      const strategy = { nodes, connections, name: strategyName }
      await onDeploy(strategy)
    } catch (error) {
      console.error('Deploy failed:', error)
    }
  }

  // Node Library Component
  const NodeLibrary = () => (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Node Library
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(
          Object.entries(NODE_TYPES).reduce((acc, [key, node]) => {
            if (!acc[node.category]) acc[node.category] = []
            acc[node.category].push({ key, ...node })
            return acc
          }, {} as Record<string, any[]>)
        ).map(([category, categoryNodes]) => (
          <div key={category} className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase">
              {category}
            </h3>
            <div className="space-y-1">
              {categoryNodes.map(({ key, ...node }) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('nodeType', key)
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {node.icon}
                    <span className="font-medium text-sm">{node.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{node.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  // Strategy Node Component
  const StrategyNodeComponent = ({ node }: { node: StrategyNode }) => {
    const isSelected = selectedNode === node.id
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        drag
        dragControls={dragControls}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const newPosition = {
            x: node.position.x + info.offset.x,
            y: node.position.y + info.offset.y
          }
          updateNode(node.id, { position: newPosition })
        }}
        className={cn(
          "absolute bg-card border-2 rounded-lg shadow-lg cursor-pointer transition-all",
          isSelected ? "border-blue-500 shadow-blue-200" : "border-border hover:border-accent-foreground"
        )}
        style={{
          left: node.position.x,
          top: node.position.y,
          width: 200,
          minHeight: 120
        }}
        onClick={() => setSelectedNode(isSelected ? null : node.id)}
      >
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-accent">
                {node.icon}
              </div>
              <div>
                <h3 className="font-medium text-sm">{node.label}</h3>
                <p className="text-xs text-muted-foreground">{node.name}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Settings className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedNode(node.id)}>
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => deleteNode(node.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Inputs */}
          <div className="space-y-1 mb-2">
            {node.inputs.map(input => (
              <div key={input.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{input.name}</span>
                <div className="w-2 h-2 rounded-full bg-blue-500 border border-blue-300" />
              </div>
            ))}
          </div>

          {/* Outputs */}
          <div className="space-y-1">
            {node.outputs.map(output => (
              <div key={output.id} className="flex items-center justify-between text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 border border-green-300" />
                <span className="text-muted-foreground">{output.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  // Node Configuration Panel
  const NodeConfigPanel = () => {
    const node = nodes.find(n => n.id === selectedNode)
    if (!node) return null

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Node
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Node Name</Label>
            <Input
              value={node.label}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
            />
          </div>

          {/* Input Configuration */}
          <div className="space-y-2">
            <Label>Inputs</Label>
            {node.inputs.map(input => (
              <div key={input.id} className="flex items-center gap-2">
                <Label className="text-xs flex-1">{input.name}</Label>
                {input.type === 'number' && (
                  <Input
                    type="number"
                    value={input.value || ''}
                    onChange={(e) => {
                      const newInputs = node.inputs.map(inp =>
                        inp.id === input.id ? { ...inp, value: Number(e.target.value) } : inp
                      )
                      updateNode(node.id, { inputs: newInputs })
                    }}
                    className="w-20 h-8"
                  />
                )}
                {input.type === 'boolean' && (
                  <Switch
                    checked={input.value || false}
                    onCheckedChange={(checked) => {
                      const newInputs = node.inputs.map(inp =>
                        inp.id === input.id ? { ...inp, value: checked } : inp
                      )
                      updateNode(node.id, { inputs: newInputs })
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Advanced Configuration */}
          <div className="space-y-2">
            <Label>Advanced Settings</Label>
            {Object.entries(node.config).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-xs capitalize">{key}</Label>
                <Input
                  value={value}
                  onChange={(e) => {
                    const newConfig = { ...node.config, [key]: e.target.value }
                    updateNode(node.id, { config: newConfig })
                  }}
                  className="w-20 h-8"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Backtest Results Panel
  const BacktestResults = () => {
    if (!backtestResult) return null

    const equityData = {
      labels: backtestResult.equity.map(d => d.date.toLocaleDateString()),
      datasets: [{
        label: 'Portfolio Value',
        data: backtestResult.equity.map(d => d.value),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        fill: true,
        tension: 0.1
      }]
    }

    const tradeData = {
      labels: backtestResult.trades.map((_, i) => `Trade ${i + 1}`),
      datasets: [{
        label: 'P&L per Trade',
        data: backtestResult.trades.map(t => t.pnl),
        backgroundColor: backtestResult.trades.map(t => t.pnl > 0 ? '#22c55e' : '#ef4444'),
        borderColor: backtestResult.trades.map(t => t.pnl > 0 ? '#16a34a' : '#dc2626'),
        borderWidth: 1
      }]
    }

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Backtest Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="equity">Equity Curve</TabsTrigger>
              <TabsTrigger value="trades">Trade Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Return</div>
                  <div className={cn(
                    "text-2xl font-bold",
                    backtestResult.totalReturn >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {backtestResult.totalReturn >= 0 ? '+' : ''}{backtestResult.totalReturn.toFixed(2)}%
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                  <div className="text-2xl font-bold">{backtestResult.sharpeRatio.toFixed(2)}</div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Max Drawdown</div>
                  <div className="text-2xl font-bold text-red-600">
                    {backtestResult.maxDrawdown.toFixed(2)}%
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="text-2xl font-bold">{backtestResult.winRate.toFixed(1)}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Total Trades</span>
                  <span className="font-mono">{backtestResult.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Factor</span>
                  <span className="font-mono">{backtestResult.profitFactor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Trade</span>
                  <span className="font-mono">${backtestResult.avgTrade.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volatility</span>
                  <span className="font-mono">{(backtestResult.metrics.volatility * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Beta</span>
                  <span className="font-mono">{backtestResult.metrics.beta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alpha</span>
                  <span className="font-mono">{(backtestResult.metrics.alpha * 100).toFixed(1)}%</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="equity">
              <div style={{ height: '300px' }}>
                <Line 
                  data={equityData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                  }} 
                />
              </div>
            </TabsContent>

            <TabsContent value="trades">
              <div style={{ height: '300px' }}>
                <Bar 
                  data={tradeData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                  }} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("w-full h-screen flex flex-col", className)}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Input
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                className="font-semibold bg-transparent border-none focus:bg-background"
              />
              <Badge variant="outline">v1.0</Badge>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'select' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setMode('select')}
                  >
                    <MousePointer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Select Mode</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'connect' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setMode('connect')}
                  >
                    <GitBranch className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Connect Mode</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'pan' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setMode('pan')}
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pan Mode</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNodeLibrary(!showNodeLibrary)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showNodeLibrary ? 'Hide' : 'Show'} Library
            </Button>

            <Button
              variant="outline"
              onClick={runBacktest}
              disabled={isBacktesting || nodes.length === 0}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {isBacktesting ? 'Running...' : 'Backtest'}
            </Button>

            <Button
              onClick={deployStrategy}
              disabled={nodes.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Deploy
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSaveStrategy({ nodes, connections })}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Strategy
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Strategy
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Strategy
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Strategy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Node Library */}
          <AnimatePresence>
            {showNodeLibrary && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-r"
              >
                <NodeLibrary />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="flex-1 relative bg-gradient-to-br from-muted/20 to-muted/40 overflow-hidden"
            onDrop={(e) => {
              e.preventDefault()
              const nodeType = e.dataTransfer.getData('nodeType')
              if (nodeType && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect()
                const position = {
                  x: e.clientX - rect.left - 100, // Center the node
                  y: e.clientY - rect.top - 60
                }
                addNode(nodeType, position)
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />

            {/* Nodes */}
            <AnimatePresence>
              {nodes.map(node => (
                <StrategyNodeComponent key={node.id} node={node} />
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl opacity-20">
                    <Code className="mx-auto" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Start Building Your Strategy</h3>
                    <p className="text-muted-foreground mb-4">
                      Drag nodes from the library to create your trading strategy
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setShowNodeLibrary(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Open Node Library
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l"
              >
                <NodeConfigPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Backtest Results */}
        <AnimatePresence>
          {backtestResult && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 400, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t overflow-hidden"
            >
              <BacktestResults />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}