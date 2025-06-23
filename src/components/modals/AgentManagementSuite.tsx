'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Bot,
  Brain,
  Wallet,
  Database,
  Settings,
  Zap,
  Shield,
  Monitor,
  MessageSquare,
  Code,
  Cpu,
  Network,
  Key,
  Lock,
  Eye,
  Edit,
  Trash2,
  Play,
  CheckCircle2,
  Target,
  Pause,
  Square,
  RotateCcw,
  Copy,
  Download,
  Upload,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  TrendingUp,
  DollarSign,
  BarChart3,
  Target,
  Globe,
  Coins,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Minus,
  Search,
  Filter
} from 'lucide-react'

// Import backend API
import { backendApi } from '@/lib/api/backend-client'

// Import Todo System
import { AgentTodoSystem } from '@/components/agents/AgentTodoSystem'
import { agentTodoService } from '@/lib/agents/AgentTodoService'

interface AgentWallet {
  id: string
  address: string
  type: 'hot' | 'cold' | 'multisig'
  balance: number
  currency: string
  network: string
  isActive: boolean
  permissions: string[]
  created_at: Date
  last_used: Date
}

interface AgentMemory {
  id: string
  type: 'short_term' | 'long_term' | 'knowledge_base'
  content: any
  tags: string[]
  importance: number
  created_at: Date
  accessed_count: number
  last_accessed: Date
}

interface AgentLLMConfig {
  id: string
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  model: string
  api_key: string
  max_tokens: number
  temperature: number
  top_p: number
  frequency_penalty: number
  presence_penalty: number
  system_prompt: string
  functions_enabled: boolean
  tools_enabled: boolean
}

interface MCPTool {
  id: string
  name: string
  description: string
  category: string
  parameters: any
  permissions: string[]
  enabled: boolean
  usage_count: number
  last_used: Date
}

interface AgentConfig {
  // Basic Info
  id?: string
  name: string
  description: string
  type: string
  status: 'initializing' | 'training' | 'active' | 'paused' | 'error'
  
  // Trading Configuration
  trading: {
    initialCapital: number
    maxDrawdown: number
    riskTolerance: number
    timeHorizon: string
    tradingPairs: string[]
    strategies: string[]
    indicators: string[]
    autoRebalance: boolean
    compoundReturns: boolean
  }
  
  // Wallets & Finances
  wallets: AgentWallet[]
  
  // Memory System
  memory: {
    enabled: boolean
    maxSize: number
    retentionPeriod: number
    compressionEnabled: boolean
    memories: AgentMemory[]
  }
  
  // LLM Configuration
  llm: AgentLLMConfig
  
  // MCP Tools
  mcpTools: MCPTool[]
  
  // Advanced Settings
  advanced: {
    notifications: boolean
    logging: boolean
    monitoring: boolean
    errorHandling: string
    backupEnabled: boolean
    encryptionEnabled: boolean
  }
}

interface AgentManagementSuiteProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'view'
  agentId?: string
  onSave?: (config: AgentConfig) => Promise<void>
  onDelete?: (agentId: string) => Promise<void>
}

const LLM_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-sonnet', 'claude-3-haiku'] },
  { id: 'google', name: 'Google', models: ['gemini-pro', 'gemini-pro-vision'] },
  { id: 'local', name: 'Local LLM', models: ['llama-2', 'mistral-7b', 'code-llama'] }
]

const MCP_TOOL_CATEGORIES = [
  'Trading', 'Analysis', 'Communication', 'Data', 'Security', 'Monitoring', 'Utilities'
]

const WALLET_TYPES = [
  { id: 'hot', name: 'Hot Wallet', description: 'Online wallet for active trading' },
  { id: 'cold', name: 'Cold Wallet', description: 'Offline wallet for secure storage' },
  { id: 'multisig', name: 'Multi-Signature', description: 'Requires multiple signatures' }
]

export function AgentManagementSuite({
  open,
  onClose,
  mode,
  agentId,
  onSave,
  onDelete
}: AgentManagementSuiteProps) {
  const [currentTab, setCurrentTab] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    type: '',
    status: 'initializing',
    trading: {
      initialCapital: 10000,
      maxDrawdown: 10,
      riskTolerance: 50,
      timeHorizon: '30',
      tradingPairs: ['ETH/USD', 'BTC/USD'],
      strategies: [],
      indicators: ['SMA', 'RSI', 'MACD'],
      autoRebalance: true,
      compoundReturns: true
    },
    wallets: [],
    memory: {
      enabled: true,
      maxSize: 1000,
      retentionPeriod: 30,
      compressionEnabled: true,
      memories: []
    },
    llm: {
      id: '',
      provider: 'openai',
      model: 'gpt-4o-mini',
      api_key: '',
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0,
      presence_penalty: 0,
      system_prompt: 'You are an AI trading agent. Analyze market data and make informed trading decisions based on your configuration and risk parameters.',
      functions_enabled: true,
      tools_enabled: true
    },
    mcpTools: [],
    advanced: {
      notifications: true,
      logging: true,
      monitoring: true,
      errorHandling: 'retry',
      backupEnabled: true,
      encryptionEnabled: true
    }
  })

  const [availableMCPTools, setAvailableMCPTools] = useState<MCPTool[]>([])

  // Load agent data if editing
  useEffect(() => {
    if (mode === 'edit' && agentId) {
      loadAgentConfig(agentId)
    }
    loadAvailableMCPTools()
  }, [mode, agentId])

  const loadAgentConfig = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await backendApi.get(`/api/v1/agents/${id}`)
      if (response.data) {
        setConfig(response.data)
      }
    } catch (error) {
      console.error('Error loading agent config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableMCPTools = async () => {
    try {
      const response = await backendApi.get('/api/v1/mcp/tools')
      if (response.data) {
        setAvailableMCPTools(response.data.tools || [])
      }
    } catch (error) {
      console.error('Error loading MCP tools:', error)
    }
  }

  const updateConfig = (updates: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateTradingConfig = (updates: Partial<AgentConfig['trading']>) => {
    setConfig(prev => ({
      ...prev,
      trading: { ...prev.trading, ...updates }
    }))
  }

  const updateMemoryConfig = (updates: Partial<AgentConfig['memory']>) => {
    setConfig(prev => ({
      ...prev,
      memory: { ...prev.memory, ...updates }
    }))
  }

  const updateLLMConfig = (updates: Partial<AgentLLMConfig>) => {
    setConfig(prev => ({
      ...prev,
      llm: { ...prev.llm, ...updates }
    }))
  }

  const updateAdvancedConfig = (updates: Partial<AgentConfig['advanced']>) => {
    setConfig(prev => ({
      ...prev,
      advanced: { ...prev.advanced, ...updates }
    }))
  }

  const addWallet = async () => {
    try {
      const response = await backendApi.post('/api/v1/agents/wallets', {
        agentId: config.id,
        type: 'hot',
        network: 'ethereum'
      })
      
      if (response.data) {
        const newWallet = response.data.wallet
        setConfig(prev => ({
          ...prev,
          wallets: [...prev.wallets, newWallet]
        }))
      }
    } catch (error) {
      console.error('Error creating wallet:', error)
    }
  }

  const removeWallet = async (walletId: string) => {
    try {
      await backendApi.delete(`/api/v1/agents/wallets/${walletId}`)
      setConfig(prev => ({
        ...prev,
        wallets: prev.wallets.filter(w => w.id !== walletId)
      }))
    } catch (error) {
      console.error('Error removing wallet:', error)
    }
  }

  const toggleMCPTool = (toolId: string) => {
    const tool = availableMCPTools.find(t => t.id === toolId)
    if (!tool) return

    const isEnabled = config.mcpTools.some(t => t.id === toolId)
    
    if (isEnabled) {
      setConfig(prev => ({
        ...prev,
        mcpTools: prev.mcpTools.filter(t => t.id !== toolId)
      }))
    } else {
      setConfig(prev => ({
        ...prev,
        mcpTools: [...prev.mcpTools, tool]
      }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (mode === 'create') {
        const response = await backendApi.post('/api/v1/agents', config)
        if (response.data && onSave) {
          await onSave(response.data.agent)
        }
      } else if (mode === 'edit' && agentId) {
        const response = await backendApi.put(`/api/v1/agents/${agentId}`, config)
        if (response.data && onSave) {
          await onSave(response.data.agent)
        }
      }
      onClose()
    } catch (error) {
      console.error('Error saving agent:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!agentId || !onDelete) return
    
    try {
      await backendApi.delete(`/api/v1/agents/${agentId}`)
      await onDelete(agentId)
      onClose()
    } catch (error) {
      console.error('Error deleting agent:', error)
    }
  }

  const testLLMConnection = async () => {
    try {
      const response = await backendApi.post('/api/v1/llm/test', {
        provider: config.llm.provider,
        model: config.llm.model,
        api_key: config.llm.api_key
      })
      
      if (response.data?.success) {
        alert('LLM connection successful!')
      } else {
        alert('LLM connection failed!')
      }
    } catch (error) {
      console.error('Error testing LLM connection:', error)
      alert('LLM connection failed!')
    }
  }

  const renderBasicTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              placeholder="e.g., Alpha Trader, Market Hunter"
              className="mt-2"
              disabled={mode === 'view'}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="Describe your agent's purpose and strategy..."
              className="mt-2"
              rows={3}
              disabled={mode === 'view'}
            />
          </div>

          <div>
            <Label htmlFor="type">Agent Type</Label>
            <Select
              value={config.type}
              onValueChange={(value) => updateConfig({ type: value })}
              disabled={mode === 'view'}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scalper">Scalper</SelectItem>
                <SelectItem value="swing_trader">Swing Trader</SelectItem>
                <SelectItem value="momentum">Momentum</SelectItem>
                <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                <SelectItem value="arbitrage">Arbitrage</SelectItem>
                <SelectItem value="yield_farmer">Yield Farmer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {mode !== 'create' && (
            <>
              <div>
                <Label>Status</Label>
                <div className="mt-2">
                  <Badge 
                    variant={config.status === 'active' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {config.status.charAt(0).toUpperCase() + config.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Agent ID</Label>
                <div className="mt-2 p-2 bg-muted rounded border font-mono text-sm">
                  {config.id || 'Not assigned'}
                </div>
              </div>
            </>
          )}

          <div>
            <Label>Initial Capital</Label>
            <div className="mt-2 space-y-2">
              <Slider
                value={[config.trading.initialCapital]}
                onValueChange={([value]) => updateTradingConfig({ initialCapital: value })}
                max={100000}
                min={1000}
                step={1000}
                className="w-full"
                disabled={mode === 'view'}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>$1,000</span>
                <span className="font-medium">${config.trading.initialCapital.toLocaleString()}</span>
                <span>$100,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderWalletsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Agent Wallets</h3>
          <p className="text-sm text-muted-foreground">Manage cryptocurrency wallets for this agent</p>
        </div>
        {mode !== 'view' && (
          <Button onClick={addWallet} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Wallet
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.wallets.map((wallet) => (
          <Card key={wallet.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{wallet.type.toUpperCase()} Wallet</CardTitle>
                <Badge variant={wallet.isActive ? 'default' : 'secondary'} className="text-xs">
                  {wallet.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Address</Label>
                <div className="mt-1 p-2 bg-muted rounded border font-mono text-xs break-all">
                  {wallet.address}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Balance</Label>
                  <div className="text-sm font-medium">
                    {wallet.balance} {wallet.currency}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Network</Label>
                  <div className="text-sm font-medium capitalize">
                    {wallet.network}
                  </div>
                </div>
              </div>

              {mode !== 'view' && (
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeWallet(wallet.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {config.wallets.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Wallets Configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add cryptocurrency wallets to enable trading functionality
              </p>
              {mode !== 'view' && (
                <Button onClick={addWallet}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Wallet
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderMemoryTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Memory System</h3>
        <p className="text-sm text-muted-foreground">Configure how the agent stores and retrieves information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Memory</Label>
                <p className="text-xs text-muted-foreground">Allow agent to store memories</p>
              </div>
              <Switch
                checked={config.memory.enabled}
                onCheckedChange={(checked) => updateMemoryConfig({ enabled: checked })}
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <Label>Max Memory Size</Label>
              <div className="mt-2 space-y-2">
                <Slider
                  value={[config.memory.maxSize]}
                  onValueChange={([value]) => updateMemoryConfig({ maxSize: value })}
                  max={10000}
                  min={100}
                  step={100}
                  className="w-full"
                  disabled={mode === 'view'}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>100</span>
                  <span className="font-medium">{config.memory.maxSize} memories</span>
                  <span>10,000</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Retention Period (days)</Label>
              <Input
                type="number"
                value={config.memory.retentionPeriod}
                onChange={(e) => updateMemoryConfig({ retentionPeriod: parseInt(e.target.value) || 30 })}
                className="mt-2"
                min="1"
                max="365"
                disabled={mode === 'view'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Memory Compression</Label>
                <p className="text-xs text-muted-foreground">Compress old memories to save space</p>
              </div>
              <Switch
                checked={config.memory.compressionEnabled}
                onCheckedChange={(checked) => updateMemoryConfig({ compressionEnabled: checked })}
                disabled={mode === 'view'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Memory Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{config.memory.memories.length}</div>
                <div className="text-xs text-muted-foreground">Total Memories</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round((config.memory.memories.length / config.memory.maxSize) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Usage</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Memory Usage</span>
                <span>{config.memory.memories.length}/{config.memory.maxSize}</span>
              </div>
              <Progress 
                value={(config.memory.memories.length / config.memory.maxSize) * 100} 
                className="w-full" 
              />
            </div>

            {mode !== 'view' && (
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Memories
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Memories
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {config.memory.memories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {config.memory.memories.slice(0, 10).map((memory) => (
                <div key={memory.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {memory.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {memory.created_at.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Accessed {memory.accessed_count} times
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderLLMTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">LLM Configuration</h3>
        <p className="text-sm text-muted-foreground">Configure the language model for this agent</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provider & Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Provider</Label>
              <Select
                value={config.llm.provider}
                onValueChange={(value: any) => updateLLMConfig({ provider: value })}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Model</Label>
              <Select
                value={config.llm.model}
                onValueChange={(value) => updateLLMConfig({ model: value })}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDERS
                    .find(p => p.id === config.llm.provider)
                    ?.models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>API Key</Label>
              <div className="mt-2 flex space-x-2">
                <Input
                  type="password"
                  value={config.llm.api_key}
                  onChange={(e) => updateLLMConfig({ api_key: e.target.value })}
                  placeholder="Enter API key"
                  className="flex-1"
                  disabled={mode === 'view'}
                />
                {mode !== 'view' && (
                  <Button variant="outline" onClick={testLLMConnection} size="sm">
                    <Zap className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={config.llm.max_tokens}
                onChange={(e) => updateLLMConfig({ max_tokens: parseInt(e.target.value) || 2048 })}
                className="mt-2"
                min="1"
                max="8192"
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <Label>Temperature</Label>
              <div className="mt-2 space-y-2">
                <Slider
                  value={[config.llm.temperature]}
                  onValueChange={([value]) => updateLLMConfig({ temperature: value })}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                  disabled={mode === 'view'}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Conservative</span>
                  <span className="font-medium">{config.llm.temperature}</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Top P</Label>
              <div className="mt-2 space-y-2">
                <Slider
                  value={[config.llm.top_p]}
                  onValueChange={([value]) => updateLLMConfig({ top_p: value })}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                  disabled={mode === 'view'}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0</span>
                  <span className="font-medium">{config.llm.top_p}</span>
                  <span>1</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Functions</Label>
                  <p className="text-xs text-muted-foreground">Enable function calling</p>
                </div>
                <Switch
                  checked={config.llm.functions_enabled}
                  onCheckedChange={(checked) => updateLLMConfig({ functions_enabled: checked })}
                  disabled={mode === 'view'}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Tools</Label>
                  <p className="text-xs text-muted-foreground">Enable tool usage</p>
                </div>
                <Switch
                  checked={config.llm.tools_enabled}
                  onCheckedChange={(checked) => updateLLMConfig({ tools_enabled: checked })}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={config.llm.system_prompt}
            onChange={(e) => updateLLMConfig({ system_prompt: e.target.value })}
            placeholder="Enter system prompt for the agent..."
            className="min-h-32"
            disabled={mode === 'view'}
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderMCPTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">MCP Tools</h3>
        <p className="text-sm text-muted-foreground">Configure Model Context Protocol tools for this agent</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Tools</CardTitle>
            <CardDescription>Select tools to enable for this agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {MCP_TOOL_CATEGORIES.map((category) => {
                const categoryTools = availableMCPTools.filter(tool => tool.category === category)
                if (categoryTools.length === 0) return null

                return (
                  <div key={category}>
                    <h4 className="font-medium text-sm mb-2">{category}</h4>
                    <div className="space-y-2 ml-4">
                      {categoryTools.map((tool) => (
                        <div key={tool.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{tool.name}</div>
                            <div className="text-xs text-muted-foreground">{tool.description}</div>
                          </div>
                          {mode !== 'view' && (
                            <Switch
                              checked={config.mcpTools.some(t => t.id === tool.id)}
                              onCheckedChange={() => toggleMCPTool(tool.id)}
                              size="sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enabled Tools</CardTitle>
            <CardDescription>Tools currently enabled for this agent</CardDescription>
          </CardHeader>
          <CardContent>
            {config.mcpTools.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {config.mcpTools.map((tool) => (
                  <div key={tool.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{tool.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {tool.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Used {tool.usage_count} times</span>
                      <span>Last: {tool.last_used?.toLocaleDateString() || 'Never'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Tools Enabled</h3>
                <p className="text-sm text-muted-foreground">
                  Enable tools from the available list to enhance agent capabilities
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Advanced Settings</h3>
        <p className="text-sm text-muted-foreground">Configure advanced agent behavior and security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monitoring & Logging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive agent status updates</p>
              </div>
              <Switch
                checked={config.advanced.notifications}
                onCheckedChange={(checked) => updateAdvancedConfig({ notifications: checked })}
                disabled={mode === 'view'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Logging</Label>
                <p className="text-xs text-muted-foreground">Log agent activities</p>
              </div>
              <Switch
                checked={config.advanced.logging}
                onCheckedChange={(checked) => updateAdvancedConfig({ logging: checked })}
                disabled={mode === 'view'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Monitoring</Label>
                <p className="text-xs text-muted-foreground">Monitor performance metrics</p>
              </div>
              <Switch
                checked={config.advanced.monitoring}
                onCheckedChange={(checked) => updateAdvancedConfig({ monitoring: checked })}
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <Label>Error Handling</Label>
              <Select
                value={config.advanced.errorHandling}
                onValueChange={(value) => updateAdvancedConfig({ errorHandling: value })}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retry">Retry on Error</SelectItem>
                  <SelectItem value="fallback">Use Fallback</SelectItem>
                  <SelectItem value="stop">Stop on Error</SelectItem>
                  <SelectItem value="ignore">Ignore Errors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security & Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Backups</Label>
                <p className="text-xs text-muted-foreground">Automatic configuration backups</p>
              </div>
              <Switch
                checked={config.advanced.backupEnabled}
                onCheckedChange={(checked) => updateAdvancedConfig({ backupEnabled: checked })}
                disabled={mode === 'view'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Encryption</Label>
                <p className="text-xs text-muted-foreground">Encrypt sensitive data</p>
              </div>
              <Switch
                checked={config.advanced.encryptionEnabled}
                onCheckedChange={(checked) => updateAdvancedConfig({ encryptionEnabled: checked })}
                disabled={mode === 'view'}
              />
            </div>

            {mode !== 'view' && (
              <div className="space-y-2 pt-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Configuration
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Clone Agent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const tabs = [
    { id: 'basic', label: 'Basic', icon: <Bot className="h-4 w-4" /> },
    { id: 'wallets', label: 'Wallets', icon: <Wallet className="h-4 w-4" /> },
    { id: 'memory', label: 'Memory', icon: <Database className="h-4 w-4" /> },
    { id: 'llm', label: 'LLM', icon: <Brain className="h-4 w-4" /> },
    { id: 'mcp', label: 'MCP Tools', icon: <Code className="h-4 w-4" /> },
    { id: 'advanced', label: 'Advanced', icon: <Settings className="h-4 w-4" /> }
  ]

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading agent configuration...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden bg-background border-border">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>
              {mode === 'create' ? 'Create Agent' : mode === 'edit' ? 'Edit Agent' : 'View Agent'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Configure a new AI trading agent with comprehensive settings'
              : mode === 'edit'
              ? 'Modify agent configuration and settings'
              : 'View agent configuration and current status'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-1">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto py-6">
            <TabsContent value="basic" className="mt-0">
              {renderBasicTab()}
            </TabsContent>
            <TabsContent value="wallets" className="mt-0">
              {renderWalletsTab()}
            </TabsContent>
            <TabsContent value="memory" className="mt-0">
              {renderMemoryTab()}
            </TabsContent>
            <TabsContent value="llm" className="mt-0">
              {renderLLMTab()}
            </TabsContent>
            <TabsContent value="mcp" className="mt-0">
              {renderMCPTab()}
            </TabsContent>
            <TabsContent value="advanced" className="mt-0">
              {renderAdvancedTab()}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex justify-between pt-4 border-t border-border">
          <div className="flex space-x-2">
            {mode === 'edit' && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Agent
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            
            {mode !== 'view' && (
              <Button
                onClick={handleSave}
                disabled={!config.name.trim() || isSaving}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Create Agent' : 'Save Changes'}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AgentManagementSuite