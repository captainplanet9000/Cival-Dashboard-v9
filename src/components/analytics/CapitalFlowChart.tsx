"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Repeat, 
  TrendingUp, Target, Users, BarChart3 
} from 'lucide-react'

interface CapitalFlowData {
  flows: Array<{
    flow_id: string
    source_type: string
    source_id: string
    target_type: string
    target_id: string
    amount: number
    flow_type: string
    timestamp: string
    status: string
  }>
  allocations: Array<{
    goal_id: string
    goal_name: string
    total_allocation: number
    farms: Array<{
      farm_id: string
      farm_name: string
      allocation: number
      utilization: number
    }>
  }>
}

interface CapitalFlowChartProps {
  data: CapitalFlowData | null
  timeRange: string
}

export function CapitalFlowChart({ data, timeRange }: CapitalFlowChartProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Capital Flow Analysis</h3>
            <p className="text-muted-foreground">No capital flow data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate summary metrics
  const totalFlowVolume = data.flows.reduce((sum, flow) => sum + flow.amount, 0)
  const totalAllocated = data.allocations.reduce((sum, alloc) => sum + alloc.total_allocation, 0)
  const avgUtilization = data.allocations.reduce((sum, alloc) => {
    const farmAvg = alloc.farms.reduce((fSum, farm) => fSum + farm.utilization, 0) / Math.max(alloc.farms.length, 1)
    return sum + farmAvg
  }, 0) / Math.max(data.allocations.length, 1)

  // Group flows by type
  const flowsByType = data.flows.reduce((acc, flow) => {
    acc[flow.flow_type] = (acc[flow.flow_type] || 0) + flow.amount
    return acc
  }, {} as Record<string, number>)

  // Recent flows (last 24 hours)
  const recentFlows = data.flows.filter(flow => {
    const flowTime = new Date(flow.timestamp)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return flowTime > oneDayAgo
  })

  return (
    <div className="space-y-6">
      {/* Capital Flow Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Capital Flow Analysis
          </CardTitle>
          <CardDescription>
            Capital allocation and flow patterns for {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${totalFlowVolume.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Flow Volume</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+8.7% vs previous</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                ${totalAllocated.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Allocated</p>
              <div className="text-xs text-muted-foreground mt-1">
                Across {data.allocations.length} goals
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {(avgUtilization * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Avg Utilization</p>
              <Progress value={avgUtilization * 100} className="mt-2 h-2" />
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {recentFlows.length}
              </div>
              <p className="text-sm text-muted-foreground">Recent Flows</p>
              <div className="text-xs text-muted-foreground mt-1">
                Last 24 hours
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-blue-600" />
              Flow Types Breakdown
            </CardTitle>
            <CardDescription>
              Capital flow distribution by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(flowsByType).map(([type, amount], i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-bold">${Number(amount).toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(Number(amount) / totalFlowVolume) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{((Number(amount) / totalFlowVolume) * 100).toFixed(1)}% of total</span>
                    <span>{data.flows.filter(f => f.flow_type === type).length} transactions</span>
                  </div>
                </div>
              ))}

              {Object.keys(flowsByType).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Repeat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No flow type data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Capital Flows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              Recent Capital Flows
            </CardTitle>
            <CardDescription>
              Latest capital movement transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentFlows.slice(0, 10).map((flow, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      flow.flow_type === 'allocation' ? 'bg-green-100' :
                      flow.flow_type === 'rebalance' ? 'bg-blue-100' :
                      flow.flow_type === 'assignment' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {flow.source_type === 'goal' && flow.target_type === 'farm' ? (
                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                      ) : flow.source_type === 'farm' && flow.target_type === 'agent' ? (
                        <ArrowDownRight className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Repeat className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {flow.source_id} → {flow.target_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {flow.source_type} to {flow.target_type} • {new Date(flow.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      ${flow.amount.toLocaleString()}
                    </div>
                    <Badge variant={
                      flow.status === 'completed' ? 'default' :
                      flow.status === 'pending' ? 'secondary' : 'destructive'
                    } className="text-xs">
                      {flow.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {recentFlows.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent flows</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal Allocation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Goal Allocation Details
          </CardTitle>
          <CardDescription>
            Detailed breakdown of capital allocation by goals and farms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.allocations.map((allocation, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{allocation.goal_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Goal ID: {allocation.goal_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${allocation.total_allocation.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Across {allocation.farms.length} farms
                    </p>
                  </div>
                </div>

                {/* Farm Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                  {allocation.farms.map((farm, j) => (
                    <div key={j} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{farm.farm_name}</h5>
                        <Badge variant="outline" className="text-xs">
                          {farm.farm_id}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Allocated:</span>
                          <span className="font-medium">${farm.allocation.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Utilization:</span>
                          <span className={`font-medium ${
                            farm.utilization >= 0.8 ? 'text-green-600' :
                            farm.utilization >= 0.6 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {(farm.utilization * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Efficiency</span>
                            <span>{(farm.utilization * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={farm.utilization * 100} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Available:</span>
                          <span className="font-medium">
                            ${(farm.allocation * (1 - farm.utilization)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Goal Summary */}
                <div className="ml-4 p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {allocation.farms.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Active Farms</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {((allocation.farms.reduce((sum, f) => sum + f.utilization, 0) / allocation.farms.length) * 100).toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Avg Utilization</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        ${allocation.farms.reduce((sum, f) => sum + (f.allocation * (1 - f.utilization)), 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Available Capital</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {data.allocations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No allocation data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CapitalFlowChart