'use client'

import React from 'react'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart3, 
  Zap, 
  Bot, 
  Activity, 
  Target, 
  Star, 
  Wallet, 
  Settings,
  TrendingUp,
  Shield,
  Brain,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Database,
  Globe,
  Layers,
  MessageSquare
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  systemStatus: {
    trading_enabled: boolean
    system_health: number
  }
}

const navigationItems = [
  {
    id: 'overview',
    label: 'Trading Overview',
    icon: BarChart3,
    color: 'text-blue-600',
    description: 'Main dashboard overview'
  },
  {
    id: 'live-trading',
    label: 'Live Trading',
    icon: Zap,
    color: 'text-orange-600',
    description: 'Real-time trading interface',
    badge: 'Live'
  },
  {
    id: 'agents',
    label: 'AI Agents',
    icon: Bot,
    color: 'text-purple-600',
    description: 'AI agent management'
  },
  {
    id: 'monitoring',
    label: 'System Monitor',
    icon: Activity,
    color: 'text-green-600',
    description: 'System health monitoring'
  },
  {
    id: 'farms',
    label: 'Agent Farms',
    icon: Target,
    color: 'text-emerald-600',
    description: 'Multi-agent coordination',
    badge: 'Enhanced'
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: Star,
    color: 'text-yellow-600',
    description: 'Goal management'
  },
  {
    id: 'vault',
    label: 'Vault',
    icon: Wallet,
    color: 'text-indigo-600',
    description: 'Multi-vault banking'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Settings,
    color: 'text-gray-600',
    description: 'Advanced features & library',
    badge: 'New'
  }
]

const quickStats = [
  { label: 'Portfolio', value: '$250K', icon: TrendingUp, color: 'text-green-600' },
  { label: 'Active Agents', value: '12', icon: Bot, color: 'text-purple-600' },
  { label: 'Daily P&L', value: '+$1.2K', icon: DollarSign, color: 'text-emerald-600' }
]

export function ModernSidebar({ activeTab, onTabChange, systemStatus }: SidebarProps) {
  return (
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">
              Cival Trading
            </h2>
            <p className="text-xs text-sidebar-foreground/60">
              AI Trading Platform
            </p>
          </div>
        </div>
        
        {/* System Status */}
        <div className="mt-3 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            systemStatus.trading_enabled ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-sidebar-foreground/70">
            {systemStatus.trading_enabled ? 'Trading Active' : 'Trading Paused'}
          </span>
          <Badge variant="outline" className="ml-auto text-xs">
            {systemStatus.system_health}%
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Navigation Menu */}
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onTabChange(item.id)}
                isActive={activeTab === item.id}
                className="w-full justify-start gap-3 py-2.5"
              >
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-sidebar-foreground/60 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <Separator className="my-4" />

        {/* Quick Stats */}
        <div className="px-2">
          <h3 className="text-xs font-semibold text-sidebar-foreground/70 mb-3 uppercase tracking-wider">
            Quick Stats
          </h3>
          <div className="space-y-2">
            {quickStats.map((stat) => (
              <Card key={stat.label} className="bg-sidebar-accent/50 border-sidebar-border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-sidebar-foreground/60">{stat.label}</p>
                      <p className="text-sm font-semibold text-sidebar-foreground">
                        {stat.value}
                      </p>
                    </div>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="px-2">
          <h3 className="text-xs font-semibold text-sidebar-foreground/70 mb-3 uppercase tracking-wider">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <SidebarMenuButton
              onClick={() => onTabChange('live-trading')}
              className="h-auto flex-col gap-1 p-3"
            >
              <Zap className="h-4 w-4" />
              <span className="text-xs">Trade</span>
            </SidebarMenuButton>
            <SidebarMenuButton
              onClick={() => onTabChange('agents')}
              className="h-auto flex-col gap-1 p-3"
            >
              <Bot className="h-4 w-4" />
              <span className="text-xs">Agents</span>
            </SidebarMenuButton>
            <SidebarMenuButton
              onClick={() => onTabChange('farms')}
              className="h-auto flex-col gap-1 p-3"
            >
              <Target className="h-4 w-4" />
              <span className="text-xs">Farms</span>
            </SidebarMenuButton>
            <SidebarMenuButton
              onClick={() => onTabChange('vault')}
              className="h-auto flex-col gap-1 p-3"
            >
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Vault</span>
            </SidebarMenuButton>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">Solo Operator</p>
            <p className="text-xs text-sidebar-foreground/60">Full Access</p>
          </div>
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default ModernSidebar