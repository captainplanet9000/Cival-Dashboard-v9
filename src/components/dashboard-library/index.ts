/**
 * Dashboard Component Library - Centralized Component Registry
 * 
 * This file serves as the central registry for all dashboard components,
 * organizing them by category for easy access and reuse.
 */

// =============================================
// CORE UI COMPONENTS (shadcn/ui)
// =============================================
export * from '@/components/ui/alert'
export * from '@/components/ui/avatar'
export * from '@/components/ui/badge'
export * from '@/components/ui/button'
export * from '@/components/ui/calendar'
export * from '@/components/ui/card'
export * from '@/components/ui/command'
export * from '@/components/ui/dialog'
export * from '@/components/ui/dropdown-menu'
export * from '@/components/ui/form'
export * from '@/components/ui/input'
export * from '@/components/ui/label'
export * from '@/components/ui/popover'
export * from '@/components/ui/progress'
export * from '@/components/ui/scroll-area'
export * from '@/components/ui/select'
export * from '@/components/ui/separator'
export * from '@/components/ui/sheet'
export * from '@/components/ui/sidebar'
export * from '@/components/ui/slider'
export * from '@/components/ui/switch'
export * from '@/components/ui/table'
export * from '@/components/ui/tabs'
export * from '@/components/ui/textarea'
export * from '@/components/ui/toast'
export * from '@/components/ui/tooltip'

// =============================================
// TRADING COMPONENTS
// =============================================
export { LiveTradingDashboard } from '@/components/trading/LiveTradingDashboard'
export { TradingInterface } from '@/components/trading/TradingInterface'
export { PortfolioMonitor } from '@/components/trading/PortfolioMonitor'
export { AgentManager } from '@/components/trading/AgentManager'
export { RiskDashboard } from '@/components/trading/RiskDashboard'

// =============================================
// AGENT COMPONENTS
// =============================================
export { AgentControlPanel } from '@/components/agent/AgentControlPanel'
export { AgentDecisionLog } from '@/components/agent/AgentDecisionLog'
export { ExpertAgentsPanel } from '@/components/agent-trading/ExpertAgentsPanel'

// =============================================
// ANALYTICS & CHARTS
// =============================================
export { TradingCharts } from '@/components/charts/TradingCharts'
export { PortfolioPerformanceChart } from '@/components/charts/PortfolioPerformanceChart'

// =============================================
// REAL-TIME COMPONENTS
// =============================================
// NOTE: LiveMarketTicker removed from static exports to prevent circular dependencies
// Use dynamic imports instead via ComponentRegistry

// =============================================
// MONITORING COMPONENTS
// =============================================
export { SystemMonitoringDashboard } from '@/components/monitoring/SystemMonitoringDashboard'

// =============================================
// FARM COMPONENTS
// =============================================
export { default as EnhancedFarmDashboard } from '@/components/farm/EnhancedFarmDashboard'

// =============================================
// LLM & AI COMPONENTS
// =============================================
export { LLMProviderManager } from '@/components/llm/LLMProviderManager'

// =============================================
// AG-UI COMPONENTS
// =============================================
export { AGUIProvider, AGUIChat } from '@/components/ag-ui/fallback'

// =============================================
// THEME & UTILITY COMPONENTS
// =============================================
export { ThemeToggle } from '@/components/theme-toggle'

// =============================================
// COMPONENT CATEGORIES FOR ORGANIZATION
// =============================================
export const ComponentCategories = {
  CORE_UI: 'Core UI Components (shadcn/ui)',
  TRADING: 'Trading & Portfolio Management',
  AGENTS: 'AI Agents & Automation',
  ANALYTICS: 'Analytics & Charts',
  REALTIME: 'Real-time Data & Updates',
  MONITORING: 'System Monitoring & Health',
  FARM: 'Agent Farm Management',
  AI_LLM: 'AI & Language Models',
  AGUI: 'AG-UI Protocol',
  THEME: 'Theme & Utilities'
} as const

// =============================================
// COMPONENT REGISTRY FOR DYNAMIC LOADING
// =============================================
export const ComponentRegistry = {
  // Trading Components
  'live-trading-dashboard': () => import('@/components/trading/LiveTradingDashboard'),
  'trading-interface': () => import('@/components/trading/TradingInterface'),
  'portfolio-monitor': () => import('@/components/trading/PortfolioMonitor'),
  
  // Agent Components
  'agent-control-panel': () => import('@/components/agent/AgentControlPanel'),
  'agent-decision-log': () => import('@/components/agent/AgentDecisionLog'),
  'expert-agents-panel': () => import('@/components/agent-trading/ExpertAgentsPanel'),
  
  // Analytics Components
  'trading-charts': () => import('@/components/charts/TradingCharts'),
  'portfolio-performance-chart': () => import('@/components/charts/PortfolioPerformanceChart'),
  
  // Farm Components
  'enhanced-farm-dashboard': () => import('@/components/farm/EnhancedFarmDashboard'),
  
  // Monitoring Components
  'system-monitoring-dashboard': () => import('@/components/monitoring/SystemMonitoringDashboard'),
  
  // Real-time Components
  'live-market-ticker': () => import('@/components/realtime/LiveMarketTicker'),
  
  // AI & LLM Components
  'llm-provider-manager': () => import('@/components/llm/LLMProviderManager'),
  'agui-chat': () => import('@/components/ag-ui/fallback'),
} as const

// =============================================
// TYPES FOR COMPONENT LIBRARY
// =============================================
export type ComponentCategory = keyof typeof ComponentCategories
export type ComponentName = keyof typeof ComponentRegistry

// =============================================
// UTILITY FUNCTIONS
// =============================================
export const getComponentsByCategory = (category: ComponentCategory) => {
  // Implementation would filter components by category
  return []
}

export const loadComponent = async (componentName: ComponentName) => {
  const loader = ComponentRegistry[componentName]
  if (!loader) {
    throw new Error(`Component '${componentName}' not found in registry`)
  }
  return await loader()
}