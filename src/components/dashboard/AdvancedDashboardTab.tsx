'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  Settings, 
  Search, 
  Brain, 
  Database, 
  BarChart3, 
  Shield, 
  Calendar, 
  FileText, 
  Zap, 
  Target, 
  TrendingUp, 
  Bot, 
  Wallet, 
  Activity,
  Layers,
  Code,
  MessageSquare,
  BarChart2,
  PieChart,
  LineChart,
  DollarSign,
  Globe,
  Lock,
  Cpu,
  Network,
  Server,
  Cloud,
  Home
} from 'lucide-react'
import { DynamicComponentLoader, ComponentKey } from '@/components/dashboard-library/DynamicComponentLoader'

interface FeatureCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  componentKey: ComponentKey
  category: string
  status: 'available' | 'pending' | 'experimental'
  tags: string[]
}

const dashboardFeatures: FeatureCard[] = [
  // Trading & Portfolio Features
  {
    id: 'live-trading',
    title: 'Live Trading Dashboard',
    description: 'Real-time autonomous trading interface with order management',
    icon: <Zap className="h-6 w-6" />,
    componentKey: 'live-trading',
    category: 'Trading',
    status: 'available',
    tags: ['trading', 'real-time', 'autonomous']
  },
  {
    id: 'portfolio-monitor',
    title: 'Portfolio Monitor',
    description: 'Real-time portfolio tracking and performance analysis',
    icon: <TrendingUp className="h-6 w-6" />,
    componentKey: 'portfolio-monitor',
    category: 'Trading',
    status: 'available',
    tags: ['portfolio', 'monitoring', 'performance']
  },
  {
    id: 'risk-dashboard',
    title: 'Risk Management',
    description: 'Comprehensive risk monitoring and management tools',
    icon: <Shield className="h-6 w-6" />,
    componentKey: 'risk-dashboard',
    category: 'Trading',
    status: 'available',
    tags: ['risk', 'management', 'monitoring']
  },
  {
    id: 'trading-interface',
    title: 'Trading Interface',
    description: 'Advanced order placement and execution interface',
    icon: <BarChart3 className="h-6 w-6" />,
    componentKey: 'trading-interface',
    category: 'Trading',
    status: 'available',
    tags: ['trading', 'orders', 'execution']
  },

  // AI Agent Features
  {
    id: 'agent-control-panel',
    title: 'Agent Control Panel',
    description: 'Central control for all AI trading agents',
    icon: <Bot className="h-6 w-6" />,
    componentKey: 'agent-control-panel',
    category: 'AI Agents',
    status: 'available',
    tags: ['agents', 'control', 'automation']
  },
  {
    id: 'agent-decision-log',
    title: 'Agent Decision Log',
    description: 'Detailed log of agent decisions and reasoning',
    icon: <Brain className="h-6 w-6" />,
    componentKey: 'agent-decision-log',
    category: 'AI Agents',
    status: 'available',
    tags: ['agents', 'decisions', 'logging']
  },
  {
    id: 'expert-agents-panel',
    title: 'Expert Agents Panel',
    description: 'Manage and monitor expert trading agents',
    icon: <Target className="h-6 w-6" />,
    componentKey: 'expert-agents-panel',
    category: 'AI Agents',
    status: 'available',
    tags: ['agents', 'experts', 'performance']
  },
  {
    id: 'agent-paper-trading',
    title: 'Agent Paper Trading',
    description: 'Simulation environment for testing agent strategies',
    icon: <FileText className="h-6 w-6" />,
    componentKey: 'agent-paper-trading',
    category: 'AI Agents',
    status: 'available',
    tags: ['agents', 'simulation', 'testing']
  },

  // Analytics & Charts
  {
    id: 'trading-charts',
    title: 'Trading Charts',
    description: 'Advanced charting with technical indicators',
    icon: <LineChart className="h-6 w-6" />,
    componentKey: 'trading-charts',
    category: 'Analytics',
    status: 'available',
    tags: ['charts', 'technical-analysis', 'indicators']
  },
  {
    id: 'advanced-analytics',
    title: 'Advanced Analytics',
    description: 'Comprehensive analytics dashboard with insights',
    icon: <BarChart2 className="h-6 w-6" />,
    componentKey: 'advanced-analytics',
    category: 'Analytics',
    status: 'pending',
    tags: ['analytics', 'insights', 'reporting']
  },
  {
    id: 'comprehensive-analytics',
    title: 'Comprehensive Analytics',
    description: 'Extended analytics with custom reports',
    icon: <PieChart className="h-6 w-6" />,
    componentKey: 'comprehensive-analytics',
    category: 'Analytics',
    status: 'available',
    tags: ['analytics', 'reports', 'comprehensive']
  },
  {
    id: 'portfolio-performance-chart',
    title: 'Portfolio Performance Chart',
    description: 'Visual portfolio performance tracking',
    icon: <TrendingUp className="h-6 w-6" />,
    componentKey: 'portfolio-performance-chart',
    category: 'Analytics',
    status: 'available',
    tags: ['portfolio', 'performance', 'visualization']
  },

  // Market Data & Real-time
  {
    id: 'live-market-ticker',
    title: 'Live Market Ticker',
    description: 'Real-time market price streaming',
    icon: <Activity className="h-6 w-6" />,
    componentKey: 'live-market-ticker',
    category: 'Market Data',
    status: 'available',
    tags: ['market-data', 'real-time', 'prices']
  },
  {
    id: 'live-market-data-panel',
    title: 'Live Market Data Panel',
    description: 'Comprehensive market data dashboard',
    icon: <Globe className="h-6 w-6" />,
    componentKey: 'live-market-data-panel',
    category: 'Market Data',
    status: 'pending',
    tags: ['market-data', 'dashboard', 'comprehensive']
  },

  // System Monitoring
  {
    id: 'system-monitoring',
    title: 'System Monitoring',
    description: 'Comprehensive system health and performance monitoring',
    icon: <Server className="h-6 w-6" />,
    componentKey: 'system-monitoring',
    category: 'Monitoring',
    status: 'available',
    tags: ['monitoring', 'system', 'health']
  },
  {
    id: 'performance-monitor',
    title: 'Performance Monitor',
    description: 'Real-time performance metrics and alerts',
    icon: <Cpu className="h-6 w-6" />,
    componentKey: 'performance-monitor',
    category: 'Monitoring',
    status: 'pending',
    tags: ['performance', 'metrics', 'alerts']
  },

  // Farm Management
  {
    id: 'enhanced-farm-dashboard',
    title: 'Enhanced Farm Dashboard',
    description: 'Multi-agent farm coordination and management',
    icon: <Layers className="h-6 w-6" />,
    componentKey: 'enhanced-farm-dashboard',
    category: 'Farm Management',
    status: 'available',
    tags: ['farms', 'agents', 'coordination']
  },

  // Financial Management & Wallets
  {
    id: 'comprehensive-wallet-dashboard',
    title: 'Comprehensive Wallet System',
    description: 'Complete multi-chain wallet management with master wallet coordination',
    icon: <Wallet className="h-6 w-6" />,
    componentKey: 'comprehensive-wallet-dashboard',
    category: 'Financial',
    status: 'available',
    tags: ['wallet', 'multi-chain', 'master-wallet', 'comprehensive']
  },
  {
    id: 'vault-banking-dashboard',
    title: 'Vault Banking System',
    description: 'Enterprise-grade banking with compliance and risk management',
    icon: <Home className="h-6 w-6" />,
    componentKey: 'vault-banking-dashboard',
    category: 'Financial',
    status: 'available',
    tags: ['vault', 'banking', 'enterprise', 'compliance']
  },
  {
    id: 'multi-chain-wallet-view',
    title: 'Multi-Chain Wallet View',
    description: 'Cross-chain wallet management for Ethereum, Solana, Sui, and Sonic',
    icon: <Globe className="h-6 w-6" />,
    componentKey: 'multi-chain-wallet-view',
    category: 'Financial',
    status: 'available',
    tags: ['wallet', 'multi-chain', 'ethereum', 'solana', 'sui', 'sonic']
  },
  {
    id: 'defi-integration-hub',
    title: 'DeFi Integration Hub',
    description: 'Advanced DeFi protocol integration with yield optimization',
    icon: <Zap className="h-6 w-6" />,
    componentKey: 'defi-integration-hub',
    category: 'Financial',
    status: 'available',
    tags: ['defi', 'yield-farming', 'staking', 'lending', 'protocols']
  },
  {
    id: 'defi-lending',
    title: 'DeFi Lending',
    description: 'Decentralized finance lending and borrowing',
    icon: <DollarSign className="h-6 w-6" />,
    componentKey: 'defi-lending',
    category: 'Financial',
    status: 'available',
    tags: ['defi', 'lending', 'borrowing']
  },
  {
    id: 'multi-chain-wallet',
    title: 'Multi-Chain Wallet',
    description: 'Cross-chain wallet management',
    icon: <Network className="h-6 w-6" />,
    componentKey: 'multi-chain-wallet',
    category: 'Financial',
    status: 'available',
    tags: ['wallet', 'multi-chain', 'cross-chain']
  },

  // AI & Language Models
  {
    id: 'llm-provider-manager',
    title: 'LLM Provider Manager',
    description: 'Manage multiple language model providers',
    icon: <Brain className="h-6 w-6" />,
    componentKey: 'llm-provider-manager',
    category: 'AI & LLM',
    status: 'available',
    tags: ['llm', 'providers', 'management']
  },
  {
    id: 'agui-chat',
    title: 'AG-UI Chat',
    description: 'Advanced AI chat with AG-UI Protocol v2',
    icon: <MessageSquare className="h-6 w-6" />,
    componentKey: 'agui-chat',
    category: 'AI & LLM',
    status: 'available',
    tags: ['chat', 'ai', 'agui']
  },

  // Knowledge & Data Management
  {
    id: 'knowledge-graph',
    title: 'Knowledge Graph',
    description: 'Visual knowledge base representation',
    icon: <Database className="h-6 w-6" />,
    componentKey: 'knowledge-graph',
    category: 'Knowledge',
    status: 'available',
    tags: ['knowledge', 'graph', 'visualization']
  },
  {
    id: 'agent-knowledge-interface',
    title: 'Agent Knowledge Interface',
    description: 'Interface for agent knowledge management',
    icon: <Brain className="h-6 w-6" />,
    componentKey: 'agent-knowledge-interface',
    category: 'Knowledge',
    status: 'pending',
    tags: ['knowledge', 'agents', 'interface']
  },
  {
    id: 'data-management',
    title: 'Data Management',
    description: 'File and data management tools',
    icon: <FileText className="h-6 w-6" />,
    componentKey: 'data-management',
    category: 'Data',
    status: 'available',
    tags: ['data', 'files', 'management']
  },
  {
    id: 'file-manager',
    title: 'File Manager',
    description: 'Advanced file management interface',
    icon: <FileText className="h-6 w-6" />,
    componentKey: 'file-manager',
    category: 'Data',
    status: 'pending',
    tags: ['files', 'management', 'interface']
  },

  // Calendar & Planning
  {
    id: 'calendar-view',
    title: 'Calendar View',
    description: 'Trading calendar with events and performance',
    icon: <Calendar className="h-6 w-6" />,
    componentKey: 'calendar-view',
    category: 'Planning',
    status: 'pending',
    tags: ['calendar', 'events', 'planning']
  },
  {
    id: 'goals-dashboard',
    title: 'Goals Dashboard',
    description: 'Goal creation and tracking system',
    icon: <Target className="h-6 w-6" />,
    componentKey: 'goals-dashboard',
    category: 'Planning',
    status: 'available',
    tags: ['goals', 'tracking', 'planning']
  },

  // Strategy & Risk Management
  {
    id: 'strategies-dashboard',
    title: 'Strategies Dashboard',
    description: 'Trading strategy management and backtesting',
    icon: <BarChart3 className="h-6 w-6" />,
    componentKey: 'strategies-dashboard',
    category: 'Strategy',
    status: 'available',
    tags: ['strategies', 'backtesting', 'management']
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    description: 'Advanced risk management tools',
    icon: <Shield className="h-6 w-6" />,
    componentKey: 'risk-management',
    category: 'Strategy',
    status: 'available',
    tags: ['risk', 'management', 'tools']
  },

  // Development & Analysis
  {
    id: 'python-analysis',
    title: 'Python Analysis',
    description: 'Python-based analytics and scripting',
    icon: <Code className="h-6 w-6" />,
    componentKey: 'python-analysis',
    category: 'Development',
    status: 'available',
    tags: ['python', 'analysis', 'scripting']
  },
  {
    id: 'mcp-server-manager',
    title: 'MCP Server Manager',
    description: 'Model Context Protocol server management',
    icon: <Server className="h-6 w-6" />,
    componentKey: 'mcp-server-manager',
    category: 'Development',
    status: 'pending',
    tags: ['mcp', 'server', 'protocol']
  },

  // System Configuration
  {
    id: 'advanced-settings',
    title: 'Advanced Settings',
    description: 'System configuration and preferences',
    icon: <Settings className="h-6 w-6" />,
    componentKey: 'advanced-settings',
    category: 'System',
    status: 'pending',
    tags: ['settings', 'configuration', 'system']
  },
  {
    id: 'persistence-dashboard',
    title: 'Persistence Dashboard',
    description: 'Data persistence and backup management',
    icon: <Database className="h-6 w-6" />,
    componentKey: 'persistence-dashboard',
    category: 'System',
    status: 'available',
    tags: ['persistence', 'backup', 'data']
  }
]

const categories = Array.from(new Set(dashboardFeatures.map(f => f.category)))

export function AdvancedDashboardTab() {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)

  const filteredFeatures = dashboardFeatures.filter(feature => {
    const matchesCategory = activeCategory === 'All' || feature.category === activeCategory
    const matchesSearch = searchQuery === '' || 
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'experimental': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Dashboard Features</h2>
          <p className="text-gray-600 mt-1">
            Complete feature library with {dashboardFeatures.length} components across {categories.length} categories
          </p>
        </div>
        <Button onClick={() => setSelectedComponent(null)} variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Component Library
        </Button>
      </div>

      {/* Component Detail View */}
      {selectedComponent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Component Preview</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedComponent(null)}
                >
                  Close Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DynamicComponentLoader 
                componentKey={selectedComponent as ComponentKey}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Component Library Browser
          </CardTitle>
          <CardDescription>
            Browse and preview all available dashboard components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search components by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
              <TabsTrigger value="All" className="text-xs">All</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="text-xs truncate"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredFeatures.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 h-full"
                onClick={() => setSelectedComponent(feature.componentKey)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit">
                      {feature.icon}
                    </div>
                    <Badge className={getStatusColor(feature.status)}>
                      {feature.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {feature.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Category: {feature.category}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No Results */}
      {filteredFeatures.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No components found</h3>
            <p className="text-gray-600">
              Try adjusting your search query or category filter
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Library Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardFeatures.length}
              </div>
              <div className="text-sm text-gray-600">Total Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardFeatures.filter(f => f.status === 'available').length}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {dashboardFeatures.filter(f => f.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {categories.length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdvancedDashboardTab