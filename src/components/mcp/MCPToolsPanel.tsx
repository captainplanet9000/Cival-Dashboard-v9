'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Zap, 
  TrendingUp, 
  Database, 
  BarChart3, 
  MessageSquare, 
  HardDrive,
  Play,
  Pause,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  Eye
} from 'lucide-react'

// Lazy load MCP service to prevent circular dependencies

interface MCPTool {
  id: string
  name: string
  category: string
  description: string
  permissions: string[]
  enabled: boolean
  usage: {
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    averageResponseTime: number
    lastUsed?: number
  }
}

interface MCPStats {
  totalTools: number
  activeTools: number
  totalCalls: number
  successRate: number
  averageResponseTime: number
  toolsByCategory: Record<string, number>
  recentActivity: Array<{
    agentId: string
    toolId: string
    timestamp: number
    success: boolean
    responseTime: number
  }>
}

const categoryIcons = {
  trading: TrendingUp,
  defi: Database,
  analysis: BarChart3,
  system: Settings,
  communication: MessageSquare,
  data: HardDrive
}

const categoryColors = {
  trading: 'bg-green-500',
  defi: 'bg-blue-500',
  analysis: 'bg-purple-500',
  system: 'bg-orange-500',
  communication: 'bg-pink-500',
  data: 'bg-cyan-500'
}

export function MCPToolsPanel() {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [stats, setStats] = useState<MCPStats>({
    totalTools: 0,
    activeTools: 0,
    totalCalls: 0,
    successRate: 0,
    averageResponseTime: 0,
    toolsByCategory: {},
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const updateMCPData = async () => {
      try {
        // Lazy load the service to prevent circular dependencies
        const { mcpIntegrationService } = await import('@/lib/mcp/MCPIntegrationService')
        
        // Get available tools
        const availableTools = mcpIntegrationService.getAvailableTools('system')
        setTools(availableTools)
        
        // Get MCP statistics
        const mcpStats = mcpIntegrationService.getStats()
        setStats(mcpStats)
      } catch (error) {
        console.error('Failed to fetch MCP data:', error)
      } finally {
        setLoading(false)
      }
    }

    updateMCPData()
    const interval = setInterval(updateMCPData, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const filteredTools = selectedCategory === 'all' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory)

  const categories = Array.from(new Set(tools.map(tool => tool.category)))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            MCP Tools Panel
          </CardTitle>
          <CardDescription>Loading MCP integration status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* MCP Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            MCP Integration Overview
          </CardTitle>
          <CardDescription>
            Model Context Protocol tools and execution statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.totalTools}</div>
              <div className="text-sm text-muted-foreground">Total Tools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.activeTools}</div>
              <div className="text-sm text-muted-foreground">Active Tools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{stats.totalCalls}</div>
              <div className="text-sm text-muted-foreground">Total Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{(stats.successRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-500">{stats.averageResponseTime}ms</div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
          </div>

          {/* Success Rate Progress */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tool Success Rate</span>
                <span>{(stats.successRate * 100).toFixed(1)}%</span>
              </div>
              <Progress value={stats.successRate * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools by Category */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
          <TabsTrigger value="all">All Tools</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => {
              const CategoryIcon = categoryIcons[tool.category as keyof typeof categoryIcons] || Zap
              const categoryColor = categoryColors[tool.category as keyof typeof categoryColors] || 'bg-gray-500'
              
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${categoryColor}`}>
                            <CategoryIcon className="h-3 w-3 text-white" />
                          </div>
                          {tool.name}
                        </div>
                        <Badge variant={tool.enabled ? 'default' : 'secondary'}>
                          {tool.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Calls</span>
                          <span>{tool.usage.totalCalls}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span>
                            {tool.usage.totalCalls > 0 
                              ? ((tool.usage.successfulCalls / tool.usage.totalCalls) * 100).toFixed(1)
                              : 0
                            }%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Response</span>
                          <span>{tool.usage.averageResponseTime}ms</span>
                        </div>
                        {tool.usage.lastUsed && (
                          <div className="flex justify-between text-sm">
                            <span>Last Used</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(tool.usage.lastUsed).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                        
                        {/* Permissions */}
                        <div className="mt-3">
                          <div className="text-xs text-muted-foreground mb-1">Permissions:</div>
                          <div className="flex flex-wrap gap-1">
                            {tool.permissions.map(permission => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent MCP Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent MCP Activity
          </CardTitle>
          <CardDescription>
            Latest tool executions and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent MCP activity
              </div>
            ) : (
              stats.recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded ${activity.success ? 'bg-green-500' : 'bg-red-500'}`}>
                      {activity.success ? (
                        <CheckCircle className="h-3 w-3 text-white" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{activity.toolId}</div>
                      <div className="text-xs text-muted-foreground">Agent: {activity.agentId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{activity.responseTime}ms</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}