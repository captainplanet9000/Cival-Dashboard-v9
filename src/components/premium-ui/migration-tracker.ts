// Migration Tracker - Comprehensive component migration management
// Tracks the systematic migration of 60+ existing components to premium library

import type { ComponentMigrationStatus, MigrationProgress } from './types'

// ===== EXISTING COMPONENT INVENTORY =====

export const EXISTING_COMPONENTS: ComponentMigrationStatus[] = [
  // ===== TRADING COMPONENTS =====
  {
    componentName: 'TradingInterface',
    status: 'pending',
    originalPath: 'src/components/trading/TradingInterface.tsx',
    premiumPath: 'src/components/premium-ui/trading/enhanced-trading-interface.tsx',
    features: [
      'Multi-exchange routing (Binance, Coinbase, Hyperliquid)',
      'Order types: Market, Limit, Stop, Stop-Limit',
      'Real-time order book and market data',
      'Paper trading P&L integration',
      'AG-UI Protocol v2 event handling'
    ],
    enhancements: [
      'AutoForm validation for order entry',
      'PriceRangeSlider for stop-loss/take-profit',
      'Enhanced order book with advanced filtering',
      'Real-time P&L visualization'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts']
  },
  {
    componentName: 'PortfolioMonitor',
    status: 'pending',
    originalPath: 'src/components/trading/PortfolioMonitor.tsx',
    premiumPath: 'src/components/premium-ui/portfolio/enhanced-portfolio-monitor.tsx',
    features: [
      'Real-time portfolio tracking',
      'Multi-asset position management',
      'Performance analytics'
    ],
    enhancements: [
      'PortfolioSortable for position management',
      'Advanced analytics with premium charts',
      'Risk indicators and alerts'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts']
  },
  {
    componentName: 'AgentManager',
    status: 'pending',
    originalPath: 'src/components/trading/AgentManager.tsx',
    premiumPath: 'src/components/premium-ui/agents/premium-agent-manager.tsx',
    features: [
      'AI agent coordination',
      'Agent status monitoring',
      'Performance tracking'
    ],
    enhancements: [
      'StrategySortable for agent priority',
      'Enhanced performance visualization',
      'Advanced agent communication tools'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts']
  },
  {
    componentName: 'LiveTradingDashboard',
    status: 'pending',
    originalPath: 'src/components/trading/LiveTradingDashboard.tsx',
    premiumPath: 'src/components/premium-ui/trading/premium-live-trading.tsx',
    features: [
      'Live trading execution',
      'Real-time market data',
      'Order management'
    ],
    enhancements: [
      'Enhanced real-time visualization',
      'Advanced order management',
      'Premium trading interface'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts']
  },
  {
    componentName: 'RiskDashboard',
    status: 'pending',
    originalPath: 'src/components/trading/RiskDashboard.tsx',
    premiumPath: 'src/components/premium-ui/risk/premium-risk-dashboard.tsx',
    features: [
      'Risk management tools',
      'VaR calculations',
      'Alert systems'
    ],
    enhancements: [
      'Advanced risk visualization',
      'Enhanced alert management',
      'Compliance reporting tools'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts']
  },

  // ===== AGENT TRADING COMPONENTS =====
  {
    componentName: 'ExpertAgentsPanel',
    status: 'pending',
    originalPath: 'src/components/agent-trading/ExpertAgentsPanel.tsx',
    premiumPath: 'src/components/premium-ui/agents/enhanced-expert-agents.tsx',
    features: [
      '5 specialized agent types (Darvas, Elliott, Alligator, ADX, Renko)',
      'Real-time symbol analysis and coordination',
      'Agent creation, optimization, and goal assignment',
      'Performance analytics with charts',
      'Multi-agent coordination system'
    ],
    enhancements: [
      'StrategySortable for agent execution priority',
      'Advanced agent performance analytics',
      'Enhanced agent communication system',
      'Premium agent visualization'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts', 'agent APIs']
  },
  {
    componentName: 'AgentTradingList',
    status: 'pending',
    originalPath: 'src/components/agent-trading/AgentTradingList.tsx',
    premiumPath: 'src/components/premium-ui/agents/premium-agent-list.tsx',
    features: [
      'Agent management interface',
      'Agent status monitoring',
      'Performance tracking'
    ],
    enhancements: [
      'Advanced filtering and sorting',
      'Enhanced performance visualization',
      'Premium list interface'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts']
  },
  {
    componentName: 'AgentPaperTradingDashboard',
    status: 'pending',
    originalPath: 'src/components/agent-trading/AgentPaperTradingDashboard.tsx',
    premiumPath: 'src/components/premium-ui/agents/premium-paper-trading.tsx',
    features: [
      'Paper trading simulation',
      'Agent performance tracking',
      'Risk management'
    ],
    enhancements: [
      'Enhanced simulation capabilities',
      'Advanced performance analytics',
      'Premium trading interface'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts']
  },

  // ===== CHARTS COMPONENTS =====
  {
    componentName: 'TradingCharts',
    status: 'pending',
    originalPath: 'src/components/charts/TradingCharts.tsx',
    premiumPath: 'src/components/premium-ui/charts/premium-trading-charts.tsx',
    features: [
      'Technical analysis charts',
      'Multiple chart types and indicators',
      'Real-time data integration'
    ],
    enhancements: [
      'Advanced chart annotations and drawing tools',
      'Multiple timeframe synchronization',
      'Enhanced performance with Chart.js optimization'
    ],
    dependencies: ['Chart.js', 'websocket-client.ts']
  },
  {
    componentName: 'PortfolioPerformanceChart',
    status: 'pending',
    originalPath: 'src/components/charts/PortfolioPerformanceChart.tsx',
    premiumPath: 'src/components/premium-ui/charts/premium-portfolio-chart.tsx',
    features: [
      'Portfolio visualization',
      'Performance tracking',
      'Historical data display'
    ],
    enhancements: [
      'Interactive portfolio visualization',
      'Advanced performance metrics',
      'Premium chart styling'
    ],
    dependencies: ['Chart.js', 'backend-client.ts']
  },
  {
    componentName: 'CandlestickChart',
    status: 'pending',
    originalPath: 'src/components/charts/candlestick-chart.tsx',
    premiumPath: 'src/components/premium-ui/charts/premium-candlestick.tsx',
    features: [
      'OHLC visualization',
      'Volume indicators',
      'Technical overlays'
    ],
    enhancements: [
      'Enhanced candlestick patterns',
      'Advanced technical indicators',
      'Premium chart interactions'
    ],
    dependencies: ['Chart.js', 'technical-indicators']
  },
  {
    componentName: 'StrategyComparisonChart',
    status: 'pending',
    originalPath: 'src/components/charts/strategy-comparison-chart.tsx',
    premiumPath: 'src/components/premium-ui/charts/premium-strategy-comparison.tsx',
    features: [
      'Strategy performance comparison',
      'Multiple strategy overlay',
      'Performance metrics'
    ],
    enhancements: [
      'Advanced comparison tools',
      'Enhanced visualization',
      'Premium comparison interface'
    ],
    dependencies: ['Chart.js', 'backend-client.ts']
  },
  {
    componentName: 'BaseChart',
    status: 'pending',
    originalPath: 'src/components/charts/base-chart.tsx',
    premiumPath: 'src/components/premium-ui/charts/premium-base-chart.tsx',
    features: [
      'Chart foundation',
      'Common chart utilities',
      'Basic chart configuration'
    ],
    enhancements: [
      'Enhanced chart foundation',
      'Premium chart utilities',
      'Advanced configuration options'
    ],
    dependencies: ['Chart.js']
  },

  // ===== ANALYTICS COMPONENTS =====
  {
    componentName: 'AdvancedAnalytics',
    status: 'pending',
    originalPath: 'src/components/analytics/AdvancedAnalytics.tsx',
    premiumPath: 'src/components/premium-ui/analytics/premium-analytics.tsx',
    features: [
      'Comprehensive analytics dashboard',
      'Performance metrics',
      'Data visualization'
    ],
    enhancements: [
      'AdvancedDataTable for analytics data',
      'TradingDateTimeRange for period analysis',
      'Enhanced visualization with premium charts'
    ],
    dependencies: ['backend-client.ts', 'Chart.js']
  },

  // ===== PERFORMANCE COMPONENTS =====
  {
    componentName: 'PerformanceMonitor',
    status: 'pending',
    originalPath: 'src/components/performance/PerformanceMonitor.tsx',
    premiumPath: 'src/components/premium-ui/performance/premium-performance-monitor.tsx',
    features: [
      'System performance monitoring',
      'Trading performance metrics',
      'Resource usage tracking'
    ],
    enhancements: [
      'Real-time performance alerts',
      'Advanced performance analytics',
      'System health dashboards'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts']
  },

  // ===== DASHBOARD COMPONENTS =====
  {
    componentName: 'EnhancedDashboard',
    status: 'pending',
    originalPath: 'src/components/dashboard/EnhancedDashboard.tsx',
    premiumPath: 'src/components/premium-ui/dashboard/premium-enhanced-dashboard.tsx',
    features: [
      'Main dashboard with 9 tabs',
      'Trading metrics and portfolio summary',
      'Agent management interface',
      'Farm dashboard integration',
      'Goal management and tracking',
      'Vault banking operations',
      'DeFi integration',
      'Calendar view',
      'Advanced features tab'
    ],
    enhancements: [
      'Sortable dashboard widgets',
      'Customizable layout with premium components',
      'Enhanced navigation with premium UI',
      'Mobile-responsive design improvements'
    ],
    dependencies: ['All trading components', 'backend-client.ts', 'websocket-client.ts']
  },

  // ===== REAL-TIME DASHBOARD COMPONENTS =====
  {
    componentName: 'LiveMarketData',
    status: 'pending',
    originalPath: 'src/components/real-time-dashboard/LiveMarketData.tsx',
    premiumPath: 'src/components/premium-ui/real-time/premium-live-market-data.tsx',
    features: [
      'Real-time price feeds',
      'Market data streaming',
      'Symbol monitoring'
    ],
    enhancements: [
      'Enhanced real-time visualization',
      'Advanced market data display',
      'Premium live data interface'
    ],
    dependencies: ['websocket-client.ts', 'market-data APIs']
  },
  {
    componentName: 'LiveTradingWithMarketData',
    status: 'pending',
    originalPath: 'src/components/real-time-dashboard/LiveTradingWithMarketData.tsx',
    premiumPath: 'src/components/premium-ui/real-time/premium-live-trading-with-data.tsx',
    features: [
      'Live trading with market data',
      'Real-time order execution',
      'Market data integration'
    ],
    enhancements: [
      'Enhanced live trading interface',
      'Advanced market data integration',
      'Premium real-time features'
    ],
    dependencies: ['websocket-client.ts', 'backend-client.ts']
  },

  // ===== FARM COMPONENTS =====
  {
    componentName: 'EnhancedFarmDashboard',
    status: 'pending',
    originalPath: 'src/components/farm/EnhancedFarmDashboard.tsx',
    premiumPath: 'src/components/premium-ui/farm/premium-farm-dashboard.tsx',
    features: [
      'Farm CRUD operations',
      'Agent assignment and coordination',
      'Performance and risk metrics',
      'Real-time monitoring'
    ],
    enhancements: [
      'Advanced farm management interface',
      'Enhanced performance tracking',
      'Improved resource allocation tools'
    ],
    dependencies: ['backend-client.ts', 'websocket-client.ts']
  },

  // ===== VAULT COMPONENTS =====
  {
    componentName: 'VaultBankingWithMultiChain',
    status: 'pending',
    originalPath: 'src/components/vault/VaultBankingWithMultiChain.tsx',
    premiumPath: 'src/components/premium-ui/vault/premium-vault-banking.tsx',
    features: [
      'Multi-chain wallet operations',
      'Flash loan integration',
      'HyperLend functionality',
      'DeFi operations'
    ],
    enhancements: [
      'Advanced multi-chain interface',
      'Enhanced transaction management',
      'Improved DeFi integration tools'
    ],
    dependencies: ['blockchain APIs', 'backend-client.ts']
  },

  // ===== DEFI COMPONENTS =====
  {
    componentName: 'DeFiIntegrationHub',
    status: 'pending',
    originalPath: 'src/components/defi/DeFiIntegrationHub.tsx',
    premiumPath: 'src/components/premium-ui/defi/premium-defi-hub.tsx',
    features: [
      'DeFi protocol integration',
      'Yield farming',
      'Liquidity management',
      'Protocol monitoring'
    ],
    enhancements: [
      'Advanced DeFi interface',
      'Enhanced yield optimization',
      'Premium protocol integration'
    ],
    dependencies: ['DeFi protocols', 'backend-client.ts']
  },

  // ===== CALENDAR COMPONENTS =====
  {
    componentName: 'CalendarView',
    status: 'pending',
    originalPath: 'src/components/calendar/CalendarView.tsx',
    premiumPath: 'src/components/premium-ui/calendar/premium-calendar.tsx',
    features: [
      'Calendar interface',
      'Event scheduling',
      'Performance tracking',
      'Goal management'
    ],
    enhancements: [
      'Enhanced calendar interface',
      'Advanced event management',
      'Premium calendar features'
    ],
    dependencies: ['backend-client.ts']
  }
]

// ===== MIGRATION PROGRESS CALCULATION =====

export const calculateMigrationProgress = (): MigrationProgress => {
  const totalComponents = EXISTING_COMPONENTS.length
  const completedCount = EXISTING_COMPONENTS.filter(c => c.status === 'completed').length
  const inProgressCount = EXISTING_COMPONENTS.filter(c => c.status === 'in-progress').length
  const pendingCount = EXISTING_COMPONENTS.filter(c => c.status === 'pending').length
  const completionPercentage = (completedCount / totalComponents) * 100

  return {
    totalComponents,
    completedCount,
    inProgressCount,
    pendingCount,
    completionPercentage,
    estimatedCompletion: new Date(Date.now() + (pendingCount * 2 * 24 * 60 * 60 * 1000)) // 2 days per component
  }
}

// ===== MIGRATION UTILITIES =====

export const getComponentsByStatus = (status: 'completed' | 'in-progress' | 'pending') => {
  return EXISTING_COMPONENTS.filter(c => c.status === status)
}

export const getComponentByName = (name: string): ComponentMigrationStatus | undefined => {
  return EXISTING_COMPONENTS.find(c => c.componentName === name)
}

export const updateComponentStatus = (name: string, status: 'completed' | 'in-progress' | 'pending', migrationDate?: Date) => {
  const component = getComponentByName(name)
  if (component) {
    component.status = status
    if (migrationDate) {
      component.migrationDate = migrationDate
    }
  }
}

export const getMigrationReport = () => {
  const progress = calculateMigrationProgress()
  const byCategory = {
    trading: EXISTING_COMPONENTS.filter(c => c.originalPath.includes('/trading/')),
    agents: EXISTING_COMPONENTS.filter(c => c.originalPath.includes('/agent')),
    charts: EXISTING_COMPONENTS.filter(c => c.originalPath.includes('/charts/')),
    analytics: EXISTING_COMPONENTS.filter(c => c.originalPath.includes('/analytics/')),
    dashboard: EXISTING_COMPONENTS.filter(c => c.originalPath.includes('/dashboard/')),
    realTime: EXISTING_COMPONENTS.filter(c => c.originalPath.includes('/real-time')),
    other: EXISTING_COMPONENTS.filter(c => 
      !c.originalPath.includes('/trading/') &&
      !c.originalPath.includes('/agent') &&
      !c.originalPath.includes('/charts/') &&
      !c.originalPath.includes('/analytics/') &&
      !c.originalPath.includes('/dashboard/') &&
      !c.originalPath.includes('/real-time')
    )
  }

  return {
    progress,
    byCategory,
    criticalComponents: EXISTING_COMPONENTS.filter(c => 
      c.componentName === 'TradingInterface' ||
      c.componentName === 'ExpertAgentsPanel' ||
      c.componentName === 'EnhancedDashboard'
    ),
    dependencies: Array.from(new Set(EXISTING_COMPONENTS.flatMap(c => c.dependencies)))
  }
}

// ===== PRIORITY MIGRATION ORDER =====

export const MIGRATION_PRIORITY = [
  // Phase 1: Core Infrastructure (Already started)
  'backend-client.ts',
  'websocket-client.ts',
  
  // Phase 2: Critical Trading Components
  'TradingInterface',
  'PortfolioMonitor',
  'LiveTradingDashboard',
  
  // Phase 3: Agent Systems
  'ExpertAgentsPanel',
  'AgentManager',
  'AgentTradingList',
  
  // Phase 4: Charts & Analytics
  'TradingCharts',
  'AdvancedAnalytics',
  'PortfolioPerformanceChart',
  
  // Phase 5: Dashboard & Layout
  'EnhancedDashboard',
  'LiveMarketData',
  'LiveTradingWithMarketData',
  
  // Phase 6: Advanced Features
  'RiskDashboard',
  'EnhancedFarmDashboard',
  'VaultBankingWithMultiChain',
  'DeFiIntegrationHub',
  
  // Phase 7: Performance & Monitoring
  'PerformanceMonitor',
  'CalendarView',
  
  // Phase 8: Final Components
  'BaseChart',
  'CandlestickChart',
  'StrategyComparisonChart'
] as const