'use client'

import React, { Suspense, lazy } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle } from 'lucide-react'

// Dynamic imports for all dashboard components
const components = {
  // Trading Components
  'live-trading': lazy(() => import('@/components/trading/LiveTradingDashboard')),
  'trading-interface': lazy(() => import('@/components/trading/TradingInterface')),
  'portfolio-monitor': lazy(() => import('@/components/trading/PortfolioMonitor')),
  'risk-dashboard': lazy(() => import('@/components/trading/RiskDashboard')),
  'agent-manager': lazy(() => import('@/components/trading/AgentManager')),

  // Agent Components
  'agent-control-panel': lazy(() => import('@/components/agent/AgentControlPanel')),
  'agent-decision-log': lazy(() => import('@/components/agent/AgentDecisionLog')),
  'expert-agents-panel': lazy(() => import('@/components/agent-trading/ExpertAgentsPanel')),

  // Analytics Components
  'trading-charts': lazy(() => import('@/components/charts/TradingCharts')),
  'portfolio-performance-chart': lazy(() => import('@/components/charts/PortfolioPerformanceChart')),
  'advanced-analytics': lazy(() => import('@/components/analytics/AdvancedAnalytics')),

  // Market Data Components
  'live-market-ticker': lazy(() => import('@/components/realtime/LiveMarketTicker')),
  'live-market-data-panel': lazy(() => import('@/components/market/LiveMarketDataPanel')),

  // Monitoring Components
  'system-monitoring': lazy(() => import('@/components/monitoring/SystemMonitoringDashboard')),
  'performance-monitor': lazy(() => import('@/components/monitoring/PerformanceMonitor')),

  // Farm Components
  'enhanced-farm-dashboard': lazy(() => import('@/components/farm/EnhancedFarmDashboard')),

  // AI & LLM Components
  'llm-provider-manager': lazy(() => import('@/components/llm/LLMProviderManager')),
  'agui-chat': lazy(() => import('@/components/ag-ui/fallback').then(module => ({ default: module.AGUIChat }))),

  // Vault & Financial Components
  'comprehensive-wallet-dashboard': lazy(() => import('@/components/wallet/ComprehensiveWalletDashboard')),
  'vault-banking-dashboard': lazy(() => import('@/components/vault/VaultBankingDashboard')),
  'multi-chain-wallet-view': lazy(() => import('@/components/dashboard/MultiChainWalletView')),
  'defi-integration-hub': lazy(() => import('@/components/defi/DeFiIntegrationHub')),
  'vault-banking': lazy(() => import('@/app/dashboard/vault/page')),
  'defi-lending': lazy(() => import('@/app/dashboard/defi-lending/page')),
  'multi-chain-wallet': lazy(() => import('@/components/wallet/MultiChainWalletView')),

  // Data Management Components
  'file-manager': lazy(() => import('@/components/data/FileManager')),
  'agent-data-browser': lazy(() => import('@/components/agent/AgentDataBrowser')),

  // Calendar & Analytics
  'calendar-view': lazy(() => import('@/components/calendar/CalendarView')),
  'comprehensive-analytics': lazy(() => import('@/app/dashboard/comprehensive-analytics/page')),

  // Knowledge & AI
  'knowledge-graph': lazy(() => import('@/app/dashboard/knowledge-graph/page')),
  'agent-knowledge-interface': lazy(() => import('@/components/knowledge/AgentKnowledgeInterface')),

  // Settings & Configuration
  'advanced-settings': lazy(() => import('@/components/settings/AdvancedSettings')),
  'mcp-server-manager': lazy(() => import('@/components/mcp/MCPServerManager')),

  // Paper Trading & Simulation
  'agent-paper-trading': lazy(() => import('@/components/agent/AgentPaperTradingDashboard')),
  'paper-trading-dashboard': lazy(() => import('@/components/paper-trading/PaperTradingDashboard')),
  'agent-farm-dashboard': lazy(() => import('@/components/paper-trading/AgentFarmDashboard')),
  'complete-paper-trading-system': lazy(() => import('@/components/paper-trading/CompletePaperTradingSystem')),

  // Python Analysis
  'python-analysis': lazy(() => import('@/app/dashboard/python-analysis/page')),

  // Goals Management
  'goals-dashboard': lazy(() => import('@/app/dashboard/goals/page')),
  'natural-language-goal-creator': lazy(() => import('@/components/goals/NaturalLanguageGoalCreator')),

  // Strategies Management
  'strategies-dashboard': lazy(() => import('@/app/dashboard/strategies/page')),

  // Risk Management
  'risk-management': lazy(() => import('@/app/dashboard/risk/page')),

  // Data Management & Persistence
  'data-management': lazy(() => import('@/app/dashboard/data-management/page')),
  'persistence-dashboard': lazy(() => import('@/app/dashboard/persistence/page'))
}

export type ComponentKey = keyof typeof components

interface DynamicComponentLoaderProps {
  componentKey: ComponentKey
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
}

const LoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </CardContent>
  </Card>
)

const ErrorFallback = ({ componentKey }: { componentKey: string }) => (
  <Card className="border-red-200 bg-red-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-700">
        <AlertTriangle className="h-5 w-5" />
        Component Load Error
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-red-600">
        Failed to load component: <code className="bg-red-100 px-2 py-1 rounded">{componentKey}</code>
      </p>
      <p className="text-sm text-red-500 mt-2">
        This component may not be available or needs to be implemented.
      </p>
    </CardContent>
  </Card>
)

export function DynamicComponentLoader({ 
  componentKey, 
  fallback = <LoadingSkeleton />,
  errorFallback
}: DynamicComponentLoaderProps) {
  const Component = components[componentKey]

  if (!Component) {
    return errorFallback || <ErrorFallback componentKey={componentKey} />
  }

  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  )
}

export default DynamicComponentLoader

// Export component registry for external use
export const ComponentRegistry = components
export type ComponentKey = keyof typeof components