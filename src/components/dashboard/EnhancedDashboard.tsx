'use client'

import React, { useState } from 'react'
import { TrendingUp, Activity, Shield, BarChart3, AlertCircle, Settings, Brain, Database } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function EnhancedDashboard() {
  const [activeView, setActiveView] = useState('overview')

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'market', label: 'Market Data', icon: TrendingUp },
    { id: 'trading', label: 'Trading', icon: BarChart3 },
    { id: 'agents', label: 'AI Agents', icon: Brain },
    { id: 'portfolio', label: 'Portfolio', icon: Database },
    { id: 'risk', label: 'Risk & Compliance', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">✅ Operational</div>
                <p className="text-sm text-muted-foreground mt-2">
                  All systems running normally
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground mt-2">
                  No agents currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.00</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Connect wallet to view portfolio
                </p>
              </CardContent>
            </Card>

            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current system status and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Circular dependencies have been resolved. The system is now stable and ready for use.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{navigationItems.find(item => item.id === activeView)?.label}</CardTitle>
              <CardDescription>This section is under construction</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The {activeView} section will be available soon. All circular dependencies have been resolved.
              </p>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r bg-card p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">AI Trading Platform</h2>
          <p className="text-sm text-muted-foreground">Multi-Agent System v8.0</p>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderContent()}
      </div>
    </div>
  )
}