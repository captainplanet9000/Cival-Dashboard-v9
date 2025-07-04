"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  TrendingUp, 
  Target,
  BarChart3,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface CapitalFlow {
  flow_id: string
  source_type: string
  source_id: string
  target_type: string
  target_id: string
  amount: number
  flow_type: string
  timestamp: string
  status: string
}

interface FarmAllocation {
  farm_id: string
  farm_name: string
  allocation: number
  utilization: number
}

interface GoalAllocation {
  goal_id: string
  goal_name: string
  total_allocation: number
  farms: FarmAllocation[]
}

interface CapitalFlowData {
  flows: CapitalFlow[]
  allocations: GoalAllocation[]
}

interface CapitalFlowViewProps {
  data: CapitalFlowData | null
  isLoading: boolean
}

function FlowCard({ flow }: { flow: CapitalFlow }) {
  const getFlowIcon = (sourceType: string, targetType: string) => {
    if (sourceType === 'goal' && targetType === 'farm') {
      return <ArrowDownRight className="h-4 w-4 text-blue-600" />
    }
    if (sourceType === 'farm' && targetType === 'agent') {
      return <ArrowDownRight className="h-4 w-4 text-green-600" />
    }
    if (sourceType === 'agent' && targetType === 'farm') {
      return <ArrowUpRight className="h-4 w-4 text-orange-600" />
    }
    return <RefreshCw className="h-4 w-4 text-gray-600" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFlowTypeLabel = (flowType: string) => {
    switch (flowType) {
      case 'allocation': return 'Allocation'
      case 'assignment': return 'Assignment'
      case 'reallocation': return 'Reallocation'
      case 'withdrawal': return 'Withdrawal'
      default: return flowType
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getFlowIcon(flow.source_type, flow.target_type)}
            <span className="font-medium text-sm">
              {flow.source_type} → {flow.target_type}
            </span>
          </div>
          <Badge className={getStatusColor(flow.status)}>
            {flow.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-bold text-lg">${flow.amount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium">{getFlowTypeLabel(flow.flow_type)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">From</span>
            <span className="text-sm font-mono">{flow.source_id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">To</span>
            <span className="text-sm font-mono">{flow.target_id}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-muted-foreground">Time</span>
            <span className="text-xs">{formatTimestamp(flow.timestamp)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AllocationCard({ allocation }: { allocation: GoalAllocation }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const totalUtilization = allocation.farms.reduce((sum, farm) => sum + farm.utilization, 0) / allocation.farms.length
  const totalAllocated = allocation.farms.reduce((sum, farm) => sum + farm.allocation, 0)

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{allocation.goal_name}</CardTitle>
            <CardDescription>{allocation.goal_id}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${allocation.total_allocation.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Allocation</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-sm">Farms</span>
            </div>
            <div className="text-xl font-bold">{allocation.farms.length}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Deployed</span>
            </div>
            <div className="text-xl font-bold">${totalAllocated.toLocaleString()}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Utilization</span>
            </div>
            <div className="text-xl font-bold">{(totalUtilization * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* Overall Utilization */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Utilization</span>
            <span>{(totalUtilization * 100).toFixed(1)}%</span>
          </div>
          <Progress value={totalUtilization * 100} className="h-2" />
          {totalUtilization < 0.7 && (
            <div className="flex items-center space-x-1 text-yellow-600 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Low utilization - consider rebalancing</span>
            </div>
          )}
        </div>

        {/* Farm Breakdown Toggle */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {isExpanded ? 'Hide' : 'Show'} Farm Breakdown ({allocation.farms.length})
        </Button>

        {/* Farm Details (expandable) */}
        {isExpanded && (
          <div className="pt-4 border-t space-y-3">
            {allocation.farms.map((farm) => (
              <div key={farm.farm_id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{farm.farm_name}</span>
                    <p className="text-xs text-muted-foreground">{farm.farm_id}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">${farm.allocation.toLocaleString()}</span>
                    <p className="text-xs text-muted-foreground">
                      {((farm.allocation / allocation.total_allocation) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Utilization</span>
                    <span>{(farm.utilization * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={farm.utilization * 100} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CapitalFlowView({ data, isLoading }: CapitalFlowViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading skeleton for content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No Capital Flow Data</h3>
          <p className="text-muted-foreground">
            Capital flows will appear here once trading operations begin.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalFlows = data.flows?.length || 0
  const completedFlows = data.flows?.filter(f => f.status === 'completed').length || 0
  const totalVolume = data.flows?.reduce((sum, flow) => sum + flow.amount, 0) || 0
  const totalAllocations = data.allocations?.reduce((sum, alloc) => sum + alloc.total_allocation, 0) || 0

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Total Flows</span>
            </div>
            <div className="text-2xl font-bold mt-2">{totalFlows}</div>
            <p className="text-xs text-muted-foreground">
              {completedFlows} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Flow Volume</span>
            </div>
            <div className="text-2xl font-bold mt-2">${totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              24h total volume
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Total Allocated</span>
            </div>
            <div className="text-2xl font-bold mt-2">${totalAllocations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {data.allocations?.length || 0} goals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {totalFlows > 0 ? ((completedFlows / totalFlows) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Flow completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Capital Flows */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Flows</h3>
            <Badge variant="outline">{data.flows?.length || 0} total</Badge>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {data.flows?.length ? (
              data.flows.slice(0, 10).map((flow) => (
                <FlowCard key={flow.flow_id} flow={flow} />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent flows</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Goal Allocations */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Goal Allocations</h3>
            <Badge variant="outline">{data.allocations?.length || 0} goals</Badge>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {data.allocations?.length ? (
              data.allocations.map((allocation) => (
                <AllocationCard key={allocation.goal_id} allocation={allocation} />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No goal allocations</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}