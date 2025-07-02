'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Bot,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Activity,
  Target,
  Zap,
  Settings,
  Plus,
  Play,
  Pause,
  Square,
  BarChart3,
  PieChart,
  Users,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  GitBranch,
  Layers,
  Shield,
  Database,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Brain,
  Network,
  MessageSquare,
  Cpu,
  TestTube,
  Rocket,
  Radio,
  Workflow,
  Lightbulb
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  useAgentFarm,
  useActiveAgents,
  useFilteredAgents,
  usePendingGraduationAgents
} from '@/stores/useAgentFarm'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
)
import { usePaperTrading } from '@/stores/usePaperTrading'
import {
  PaperTradingAgent,
  AgentType,
  AgentStatus,
  AgentConfig,
  Priority,
  GoalType,
  DeFiProtocol
} from '@/types/paper-trading.types'

const agentTypeColors = {
  [AgentType.SCALPER]: 'bg-red-500',
  [AgentType.SWING_TRADER]: 'bg-blue-500',
  [AgentType.MOMENTUM]: 'bg-green-500',
  [AgentType.MEAN_REVERSION]: 'bg-purple-500',
  [AgentType.ARBITRAGE]: 'bg-yellow-500',
  [AgentType.MARKET_MAKER]: 'bg-pink-500',
  [AgentType.YIELD_FARMER]: 'bg-emerald-500',
  [AgentType.LIQUIDATION_BOT]: 'bg-orange-500',
  [AgentType.MEV_SEARCHER]: 'bg-cyan-500',
  [AgentType.PORTFOLIO_MANAGER]: 'bg-indigo-500'
}

const statusColors = {
  [AgentStatus.INITIALIZING]: 'bg-gray-500',
  [AgentStatus.TRAINING]: 'bg-blue-500',
  [AgentStatus.PAPER_TRADING]: 'bg-green-500',
  [AgentStatus.READY_FOR_GRADUATION]: 'bg-amber-500',
  [AgentStatus.GRADUATED]: 'bg-emerald-500',
  [AgentStatus.PAUSED]: 'bg-orange-500',
  [AgentStatus.ERROR]: 'bg-red-500',
  [AgentStatus.ARCHIVED]: 'bg-gray-400'
}

export function AgentFarmDashboard() {
  const {
    farmPerformance,
    leaderboard,
    selectedAgent,
    agentFilter,
    graduationCriteria,
    isLoading,
    error,
    createAgent,
    startAgent,
    stopAgent,
    updateFilter,
    setSelectedAgent,
    refreshData
  } = useAgentFarm()

  const activeAgents = useActiveAgents()
  const filteredAgents = useFilteredAgents()
  const pendingGraduation = usePendingGraduationAgents()

  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [refreshData])

  const filteredAgentsList = useMemo(() => {
    return filteredAgents.filter(agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [filteredAgents, searchQuery])

  const performanceChartData = {
    labels: ['1D', '7D', '30D', '90D'],
    datasets: [
      {
        label: 'Average Performance (%)',
        data: [2.5, 8.2, 15.7, 32.1],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  }

  const agentTypeDistribution = {
    labels: Object.values(AgentType),
    datasets: [
      {
        data: Object.values(AgentType).map(type => 
          filteredAgents.filter(agent => agent.type === type).length
        ),
        backgroundColor: Object.values(agentTypeColors),
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Agent Farm Dashboard
                </h1>
              </div>
              <Badge variant="outline" className="text-xs">
                {farmPerformance.totalAgents} Agents Active
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <BarChart3 className="h-4 w-4" /> : <PieChart className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshData()}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </div>
              
              <Button onClick={() => setShowCreateAgent(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Overview Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Agents
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {farmPerformance.totalAgents}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  +{farmPerformance.activeAgents} active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Performance
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {farmPerformance.averagePerformance.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-600">
                  Annual return
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Virtual Capital
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${farmPerformance.totalVirtualCapital.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Paper trading funds
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Graduation Rate
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {farmPerformance.graduationRate.toFixed(1)}%
                  </p>
                </div>
                <Award className="h-8 w-8 text-amber-600" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-amber-600">
                  {pendingGraduation.length} pending
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Brain className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Multi-Agent Coordination
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    CrewAI + AutoGen Active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Radio className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Real-Time Trading Loop
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    5s Scan Intervals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Lightbulb className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    LLM Integration
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    GPT-4 + Claude Active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    Advanced Risk Mgmt
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    VaR + Stress Testing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Database className="h-8 w-8 text-cyan-600" />
                <div>
                  <p className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                    Database Schema
                  </p>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    40+ Tables Deployed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List/Grid */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="agents" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="agents" className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <span>Agents</span>
                </TabsTrigger>
                <TabsTrigger value="coordination" className="flex items-center space-x-2">
                  <Network className="h-4 w-4" />
                  <span>Coordination</span>
                </TabsTrigger>
                <TabsTrigger value="trading" className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Trading Loop</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span>System</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="agents">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>Active Agents</span>
                      </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Agent Status</DropdownMenuLabel>
                        {Object.values(AgentStatus).map(status => (
                          <DropdownMenuItem key={status}>
                            {status.replace('_', ' ')}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Agent Type</DropdownMenuLabel>
                        {Object.values(AgentType).map(type => (
                          <DropdownMenuItem key={type}>
                            {type.replace('_', ' ')}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {filteredAgentsList.map((agent) => (
                        <AgentCard 
                          key={agent.id} 
                          agent={agent}
                          onSelect={() => setSelectedAgent(agent.id)}
                          isSelected={selectedAgent === agent.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <AgentTable agents={filteredAgentsList} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coordination">
            <MultiAgentCoordinationPanel />
          </TabsContent>

          <TabsContent value="trading">
            <RealTimeTradingLoopPanel />
          </TabsContent>

          <TabsContent value="system">
            <SystemStatusPanel />
          </TabsContent>
        </Tabs>
      </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Farm Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line 
                    data={performanceChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return value + '%'
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agent Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Agent Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut 
                    data={agentTypeDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            font: {
                              size: 10
                            },
                            usePointStyle: true
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pending Graduations */}
            {pendingGraduation.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    <span>Pending Graduation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingGraduation.slice(0, 3).map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{agent.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {agent.paperTrading.performanceMetrics.annualizedReturn.toFixed(1)}% return
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Agent Dialog */}
      <CreateAgentDialog 
        open={showCreateAgent}
        onOpenChange={setShowCreateAgent}
        onCreateAgent={createAgent}
      />
    </div>
  )
}

function AgentCard({ 
  agent, 
  onSelect, 
  isSelected 
}: { 
  agent: PaperTradingAgent
  onSelect: () => void
  isSelected: boolean 
}) {
  const { startAgent, stopAgent } = useAgentFarm()
  const [isExpanded, setIsExpanded] = useState(false)

  const performance = agent.paperTrading.performanceMetrics
  const graduationStatus = agent.paperTrading.graduationStatus

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "p-4 border rounded-lg cursor-pointer transition-all duration-200",
        isSelected 
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-3 h-3 rounded-full",
            agent.status === AgentStatus.PAPER_TRADING ? "bg-green-500" :
            agent.status === AgentStatus.PAUSED ? "bg-orange-500" :
            agent.status === AgentStatus.ERROR ? "bg-red-500" : "bg-gray-500"
          )} />
          <div>
            <h3 className="font-medium text-sm">{agent.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {agent.type.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {agent.status === AgentStatus.PAPER_TRADING ? (
              <DropdownMenuItem onClick={() => stopAgent(agent.id)}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => startAgent(agent.id)}>
                <Play className="h-4 w-4 mr-2" />
                Start
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Performance</span>
          <span className={cn(
            "font-medium",
            performance.annualizedReturn >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {performance.annualizedReturn >= 0 ? '+' : ''}{performance.annualizedReturn.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
          <span className="font-medium">{performance.sharpeRatio.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Win Rate</span>
          <span className="font-medium">{performance.winRate.toFixed(1)}%</span>
        </div>

        {graduationStatus.eligible && (
          <div className="flex items-center space-x-2 mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
            <Trophy className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-700 dark:text-amber-300">
              Ready for graduation
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {agent.paperTrading.goals.length} goals
        </Badge>
        <Badge 
          variant="secondary" 
          className={cn("text-xs", statusColors[agent.status])}
        >
          {agent.status.replace('_', ' ')}
        </Badge>
      </div>
    </motion.div>
  )
}

function AgentTable({ agents }: { agents: PaperTradingAgent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Performance</TableHead>
          <TableHead>Sharpe</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell>
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  agent.status === AgentStatus.PAPER_TRADING ? "bg-green-500" : "bg-gray-500"
                )} />
                <span className="font-medium">{agent.name}</span>
              </div>
            </TableCell>
            <TableCell>{agent.type.replace('_', ' ')}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {agent.status.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell>
              <span className={cn(
                "font-medium",
                agent.paperTrading.performanceMetrics.annualizedReturn >= 0 
                  ? "text-green-600" 
                  : "text-red-600"
              )}>
                {agent.paperTrading.performanceMetrics.annualizedReturn >= 0 ? '+' : ''}
                {agent.paperTrading.performanceMetrics.annualizedReturn.toFixed(1)}%
              </span>
            </TableCell>
            <TableCell>
              {agent.paperTrading.performanceMetrics.sharpeRatio.toFixed(2)}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function CreateAgentDialog({ 
  open, 
  onOpenChange, 
  onCreateAgent 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAgent: (config: AgentConfig) => Promise<string>
}) {
  const [config, setConfig] = useState<Partial<AgentConfig>>({
    name: '',
    type: AgentType.SWING_TRADER,
    description: '',
    initialCapital: 10000,
    maxDrawdown: 10,
    riskTolerance: 5,
    timeHorizon: 90,
    preferredAssets: ['ETH', 'BTC'],
    excludedAssets: [],
    strategies: [],
    defiProtocols: [DeFiProtocol.UNISWAP_V3],
    autoRebalance: true,
    compoundReturns: true
  })

  const handleCreate = async () => {
    if (config.name && config.type) {
      await onCreateAgent(config as AgentConfig)
      onOpenChange(false)
      setConfig({
        name: '',
        type: AgentType.SWING_TRADER,
        description: '',
        initialCapital: 10000,
        maxDrawdown: 10,
        riskTolerance: 5,
        timeHorizon: 90,
        preferredAssets: ['ETH', 'BTC'],
        excludedAssets: [],
        strategies: [],
        defiProtocols: [DeFiProtocol.UNISWAP_V3],
        autoRebalance: true,
        compoundReturns: true
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Configure a new paper trading agent for your farm
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="My Trading Agent"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Agent Type</Label>
              <Select 
                value={config.type} 
                onValueChange={(value) => setConfig({ ...config, type: value as AgentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AgentType).map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Brief description of the agent's strategy"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="capital">Initial Capital ($)</Label>
              <Input
                id="capital"
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="drawdown">Max Drawdown (%)</Label>
              <Input
                id="drawdown"
                type="number"
                value={config.maxDrawdown}
                onChange={(e) => setConfig({ ...config, maxDrawdown: parseFloat(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="risk">Risk Tolerance (1-10)</Label>
              <Input
                id="risk"
                type="number"
                min="1"
                max="10"
                value={config.riskTolerance}
                onChange={(e) => setConfig({ ...config, riskTolerance: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!config.name || !config.type}>
              Create Agent
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Multi-Agent Coordination Panel
function MultiAgentCoordinationPanel() {
  const [coordinationStatus, setCoordinationStatus] = useState<any>(null)
  const [consensusTasks, setConsensusTasks] = useState<any[]>([])
  const [frameworkStatus, setFrameworkStatus] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchCoordinationData()
    const interval = setInterval(fetchCoordinationData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchCoordinationData = async () => {
    try {
      setIsLoading(true)
      // Fetch from real backend API
      const response = await fetch('/api/agent-coordination/status')
      if (response.ok) {
        const data = await response.json()
        setCoordinationStatus(data)
        setFrameworkStatus(data.framework_status || {})
      }
    } catch (error) {
      console.error('Failed to fetch coordination data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runConsensusAnalysis = async (symbol: string) => {
    try {
      const response = await fetch('/api/agent-coordination/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, frameworks: ['crewai', 'autogen'] })
      })
      if (response.ok) {
        const result = await response.json()
        setConsensusTasks(prev => [result, ...prev.slice(0, 9)]) // Keep last 10
      }
    } catch (error) {
      console.error('Failed to run consensus analysis:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Framework Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Framework Status</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCoordinationData}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(frameworkStatus).map(([framework, status]: [string, any]) => (
              <div key={framework} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{framework}</h4>
                  <Badge variant={status?.status === 'online' ? 'default' : 'destructive'}>
                    {status?.status || 'unknown'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Last Check: {status?.last_check ? new Date(status.last_check).toLocaleTimeString() : 'Never'}</p>
                  {status?.details && (
                    <p>Details: {JSON.stringify(status.details).slice(0, 50)}...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consensus Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Consensus Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input placeholder="Enter symbol (e.g., BTC/USD)" id="consensus-symbol" />
              <Button onClick={() => {
                const input = document.getElementById('consensus-symbol') as HTMLInputElement
                if (input?.value) runConsensusAnalysis(input.value)
              }}>
                <Brain className="h-4 w-4 mr-2" />
                Run Analysis
              </Button>
            </div>

            <div className="space-y-3">
              {consensusTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No consensus tasks yet</p>
              ) : (
                consensusTasks.map((task, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{task.symbol}</span>
                      <Badge variant={task.consensus_reached ? 'default' : 'secondary'}>
                        {task.consensus_reached ? 'Consensus' : 'No Consensus'}
                      </Badge>
                    </div>
                    {task.final_recommendation && (
                      <div className="text-sm">
                        <p><strong>Action:</strong> {task.final_recommendation.action}</p>
                        <p><strong>Confidence:</strong> {(task.final_recommendation.confidence * 100).toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coordination Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Coordination Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coordinationStatus ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{coordinationStatus.active_tasks || 0}</p>
                <p className="text-sm text-gray-600">Active Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{coordinationStatus.completed_tasks || 0}</p>
                <p className="text-sm text-gray-600">Completed Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{coordinationStatus.cached_analyses || 0}</p>
                <p className="text-sm text-gray-600">Cached Analyses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{coordinationStatus.configuration?.consensus_threshold || 0.7}</p>
                <p className="text-sm text-gray-600">Consensus Threshold</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Loading coordination metrics...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Real-Time Trading Loop Panel
function RealTimeTradingLoopPanel() {
  const [loopStatus, setLoopStatus] = useState<any>(null)
  const [activeSignals, setActiveSignals] = useState<any[]>([])
  const [recentScans, setRecentScans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTradingLoopData()
    const interval = setInterval(fetchTradingLoopData, 2000) // Update every 2s
    return () => clearInterval(interval)
  }, [])

  const fetchTradingLoopData = async () => {
    try {
      // Fetch trading loop status
      const statusResponse = await fetch('/api/trading-loop/status')
      if (statusResponse.ok) {
        const status = await statusResponse.json()
        setLoopStatus(status)
      }

      // Fetch active signals
      const signalsResponse = await fetch('/api/trading-loop/signals')
      if (signalsResponse.ok) {
        const signals = await signalsResponse.json()
        setActiveSignals(signals)
      }

      // Fetch recent scans
      const scansResponse = await fetch('/api/trading-loop/scans')
      if (scansResponse.ok) {
        const scans = await scansResponse.json()
        setRecentScans(scans)
      }
    } catch (error) {
      console.error('Failed to fetch trading loop data:', error)
    }
  }

  const controlTradingLoop = async (action: 'start' | 'stop' | 'pause' | 'resume') => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/trading-loop/${action}`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchTradingLoopData()
      }
    } catch (error) {
      console.error(`Failed to ${action} trading loop:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Trading Loop Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Radio className="h-5 w-5" />
            <span>Trading Loop Control</span>
            <Badge variant={loopStatus?.status === 'running' ? 'default' : 'secondary'}>
              {loopStatus?.status || 'unknown'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button
              onClick={() => controlTradingLoop('start')}
              disabled={isLoading || loopStatus?.status === 'running'}
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
            <Button
              onClick={() => controlTradingLoop('stop')}
              disabled={isLoading || loopStatus?.status === 'stopped'}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <Button
              onClick={() => controlTradingLoop('pause')}
              disabled={isLoading || loopStatus?.status !== 'running'}
              variant="outline"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button
              onClick={() => controlTradingLoop('resume')}
              disabled={isLoading || loopStatus?.status !== 'paused'}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          </div>

          {loopStatus && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold">{loopStatus.metrics?.loop_count || 0}</p>
                <p className="text-xs text-gray-600">Loop Cycles</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{loopStatus.metrics?.signals_generated || 0}</p>
                <p className="text-xs text-gray-600">Signals Generated</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{loopStatus.metrics?.trades_executed || 0}</p>
                <p className="text-xs text-gray-600">Trades Executed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{(loopStatus.metrics?.win_rate * 100 || 0).toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Win Rate</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Active Signals</span>
            <Badge variant="outline">{activeSignals.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeSignals.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No active signals</p>
            ) : (
              activeSignals.map((signal) => (
                <div key={signal.signal_id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{signal.symbol}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={signal.action === 'buy' ? 'default' : 'destructive'}>
                        {signal.action.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        Priority {signal.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-gray-600">Quantity:</span> {signal.quantity}
                    </div>
                    <div>
                      <span className="text-gray-600">Confidence:</span> {(signal.confidence * 100).toFixed(1)}%
                    </div>
                    <div>
                      <span className="text-gray-600">Strategy:</span> {signal.strategy}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Market Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Recent Market Scans</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentScans.slice(0, 5).map((scan, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {scan.symbols_analyzed?.length || 0} symbols analyzed
                  </span>
                  <Badge variant="outline">
                    {scan.opportunities_found || 0} opportunities
                  </Badge>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Market Condition: {scan.market_condition}</p>
                  <p>Duration: {(scan.scan_duration_ms || 0).toFixed(0)}ms</p>
                  <p>Time: {new Date(scan.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// System Status Panel
function SystemStatusPanel() {
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [serviceHealth, setServiceHealth] = useState<any[]>([])
  const [databaseStatus, setDatabaseStatus] = useState<any>(null)

  useEffect(() => {
    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 10000) // Update every 10s
    return () => clearInterval(interval)
  }, [])

  const fetchSystemStatus = async () => {
    try {
      // Fetch overall system health
      const healthResponse = await fetch('/api/system/health')
      if (healthResponse.ok) {
        const health = await healthResponse.json()
        setSystemStatus(health)
      }

      // Fetch service health
      const servicesResponse = await fetch('/api/system/services')
      if (servicesResponse.ok) {
        const services = await servicesResponse.json()
        setServiceHealth(services)
      }

      // Fetch database status
      const dbResponse = await fetch('/api/system/database')
      if (dbResponse.ok) {
        const db = await dbResponse.json()
        setDatabaseStatus(db)
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cpu className="h-5 w-5" />
            <span>System Overview</span>
            <Badge variant={systemStatus?.status === 'healthy' ? 'default' : 'destructive'}>
              {systemStatus?.status || 'unknown'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold">{systemStatus.uptime_hours || 0}h</p>
                <p className="text-xs text-gray-600">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{systemStatus.memory_usage || 0}%</p>
                <p className="text-xs text-gray-600">Memory Usage</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{systemStatus.cpu_usage || 0}%</p>
                <p className="text-xs text-gray-600">CPU Usage</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{systemStatus.active_connections || 0}</p>
                <p className="text-xs text-gray-600">Active Connections</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Loading system status...</p>
          )}
        </CardContent>
      </Card>

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5" />
            <span>Service Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {serviceHealth.length === 0 ? (
              <p className="text-center text-gray-500">Loading service health...</p>
            ) : (
              serviceHealth.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                      {service.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {service.response_time}ms
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Database Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {databaseStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{databaseStatus.total_tables || 0}</p>
                  <p className="text-xs text-gray-600">Total Tables</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{databaseStatus.active_connections || 0}</p>
                  <p className="text-xs text-gray-600">Active Connections</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recent Tables</h4>
                <div className="space-y-1">
                  {(databaseStatus.recent_tables || []).map((table: string) => (
                    <div key={table} className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{table}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Loading database status...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AgentFarmDashboard