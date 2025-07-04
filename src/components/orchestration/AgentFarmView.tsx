"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Play, 
  Pause, 
  Settings,
  ArrowUpDown,
  Eye
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

interface Agent {
  agent_id: string
  name: string
  status: string
  performance: number
  capital_assigned: number
  last_activity: string
}

interface Farm {
  farm_id: string
  name: string
  strategy_type: string
  agent_count: number
  capital_allocated: number
  performance: number
  status: string
  agents: Agent[]
}

interface AgentFarmData {
  farms: Farm[]
}

interface AgentFarmViewProps {
  data: AgentFarmData | null
  isLoading: boolean
}

function AgentCard({ agent }: { agent: Agent }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{agent.name}</CardTitle>
            <CardDescription className="text-sm">{agent.agent_id}</CardDescription>
          </div>
          <Badge className={getStatusColor(agent.status)}>
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Performance</span>
          <span className={`font-medium ${agent.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {agent.performance > 0 ? '+' : ''}{agent.performance.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Capital</span>
          <span className="font-medium">${agent.capital_assigned.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Last Activity</span>
          <span className="text-sm">{formatLastActivity(agent.last_activity)}</span>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline">
            {agent.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FarmCard({ farm }: { farm: Farm }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'momentum': return 'bg-blue-100 text-blue-800'
      case 'arbitrage': return 'bg-purple-100 text-purple-800'
      case 'mean_reversion': return 'bg-orange-100 text-orange-800'
      case 'market_making': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const capitalUtilization = farm.agents.reduce((sum, agent) => sum + agent.capital_assigned, 0) / farm.capital_allocated * 100

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{farm.name}</CardTitle>
            <CardDescription>{farm.farm_id}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Badge className={getStrategyColor(farm.strategy_type)}>
              {farm.strategy_type}
            </Badge>
            <Badge className={getStatusColor(farm.status)}>
              {farm.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Farm Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Agents</span>
            </div>
            <div className="text-2xl font-bold">{farm.agent_count}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Capital</span>
            </div>
            <div className="text-2xl font-bold">${(farm.capital_allocated / 1000).toFixed(0)}k</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Performance</span>
            </div>
            <div className={`text-2xl font-bold ${farm.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {farm.performance > 0 ? '+' : ''}{farm.performance.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Utilization</span>
            </div>
            <div className="text-2xl font-bold">{capitalUtilization.toFixed(0)}%</div>
          </div>
        </div>

        {/* Capital Utilization Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Capital Utilization</span>
            <span>{capitalUtilization.toFixed(1)}%</span>
          </div>
          <Progress value={capitalUtilization} className="h-2" />
        </div>

        {/* Farm Actions */}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Users className="h-4 w-4 mr-2" />
            {isExpanded ? 'Hide' : 'Show'} Agents ({farm.agents.length})
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Rebalance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rebalance Farm: {farm.name}</DialogTitle>
                <DialogDescription>
                  Adjust capital allocation and agent assignments for optimal performance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Rebalancing functionality would be implemented here.
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Agents Grid (expandable) */}
        {isExpanded && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farm.agents.map((agent) => (
                <AgentCard key={agent.agent_id} agent={agent} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AgentFarmView({ data, isLoading }: AgentFarmViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="text-center space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data || !data.farms?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No Farms Available</h3>
          <p className="text-muted-foreground">
            Create farms and assign agents to start orchestrated trading.
          </p>
          <Button className="mt-4">
            Create Farm
          </Button>
        </CardContent>
      </Card>
    )
  }

  const totalAgents = data.farms.reduce((sum, farm) => sum + farm.agent_count, 0)
  const totalCapital = data.farms.reduce((sum, farm) => sum + farm.capital_allocated, 0)
  const avgPerformance = data.farms.reduce((sum, farm) => sum + farm.performance, 0) / data.farms.length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Total Agents</span>
            </div>
            <div className="text-2xl font-bold mt-2">{totalAgents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Total Capital</span>
            </div>
            <div className="text-2xl font-bold mt-2">${totalCapital.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Avg Performance</span>
            </div>
            <div className={`text-2xl font-bold mt-2 ${avgPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {avgPerformance > 0 ? '+' : ''}{avgPerformance.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farms Grid */}
      <div className="space-y-6">
        {data.farms.map((farm) => (
          <FarmCard key={farm.farm_id} farm={farm} />
        ))}
      </div>
    </div>
  )
}