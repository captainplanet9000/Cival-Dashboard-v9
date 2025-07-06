'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, Code2, Database, Zap, ChevronDown, ChevronRight, 
  Play, Copy, Server, Shield, Activity, Users, Target, BarChart3, 
  Settings, AlertTriangle, CheckCircle2, TrendingUp
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// API Documentation data structure
interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  summary: string
  description: string
  parameters?: { name: string; type: string; required: boolean; description: string }[]
  requestBody?: { type: string; example: any }
  responses: { status: number; description: string; example?: any }[]
  tags: string[]
}

interface ApiCategory {
  name: string
  description: string
  icon: React.ReactNode
  endpoints: ApiEndpoint[]
}

// Comprehensive API documentation data
const apiCategories: ApiCategory[] = [
  {
    name: 'System Health',
    description: 'Core system monitoring and health checks',
    icon: <Activity className="h-4 w-4" />,
    endpoints: [
      {
        method: 'GET',
        path: '/api/health',
        summary: 'System Health Check',
        description: 'Returns overall system health status and component availability',
        responses: [
          {
            status: 200,
            description: 'System is healthy',
            example: {
              status: 'healthy',
              timestamp: '2025-01-06T08:30:00Z',
              services: {
                database: 'connected',
                redis: 'connected',
                ai_agents: 'active'
              }
            }
          }
        ],
        tags: ['Health']
      },
      {
        method: 'GET',
        path: '/api/v1/services',
        summary: 'Service Registry Status',
        description: 'Get status of all registered microservices',
        responses: [
          {
            status: 200,
            description: 'Service registry information',
            example: {
              total_services: 15,
              active_services: 14,
              services: ['trading-engine', 'risk-manager', 'portfolio-tracker']
            }
          }
        ],
        tags: ['Health']
      }
    ]
  },
  {
    name: 'Portfolio Management',
    description: 'Portfolio tracking and management endpoints',
    icon: <BarChart3 className="h-4 w-4" />,
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/portfolio/summary',
        summary: 'Portfolio Overview',
        description: 'Get comprehensive portfolio summary with current positions and performance',
        responses: [
          {
            status: 200,
            description: 'Portfolio summary data',
            example: {
              total_value: 124582.45,
              daily_pnl: 2891.23,
              positions_count: 7,
              cash_balance: 12450.00,
              performance: {
                win_rate: 68.5,
                sharpe_ratio: 1.24
              }
            }
          }
        ],
        tags: ['Portfolio']
      },
      {
        method: 'GET',
        path: '/api/v1/portfolio/positions',
        summary: 'Current Positions',
        description: 'List all current portfolio positions with real-time P&L',
        responses: [
          {
            status: 200,
            description: 'Array of current positions',
            example: [
              {
                symbol: 'BTC/USD',
                side: 'long',
                size: 0.5,
                entry_price: 45000,
                current_price: 46200,
                unrealized_pnl: 600,
                timestamp: '2025-01-06T08:00:00Z'
              }
            ]
          }
        ],
        tags: ['Portfolio']
      }
    ]
  },
  {
    name: 'Trading Operations',
    description: 'Order management and execution',
    icon: <TrendingUp className="h-4 w-4" />,
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/trading/paper/order',
        summary: 'Create Paper Trade',
        description: 'Execute a paper trading order for simulation',
        parameters: [
          { name: 'symbol', type: 'string', required: true, description: 'Trading pair symbol' },
          { name: 'side', type: 'string', required: true, description: 'Order side: buy or sell' },
          { name: 'quantity', type: 'number', required: true, description: 'Order quantity' },
          { name: 'type', type: 'string', required: true, description: 'Order type: market or limit' }
        ],
        requestBody: {
          type: 'application/json',
          example: {
            symbol: 'BTC/USD',
            side: 'buy',
            quantity: 0.1,
            type: 'market',
            agent_id: 'momentum-trader-001'
          }
        },
        responses: [
          {
            status: 201,
            description: 'Order created successfully',
            example: {
              order_id: 'ord_12345',
              status: 'filled',
              fill_price: 46150,
              timestamp: '2025-01-06T08:30:00Z'
            }
          }
        ],
        tags: ['Trading']
      },
      {
        method: 'GET',
        path: '/api/v1/trading/paper/portfolio',
        summary: 'Paper Portfolio Status',
        description: 'Get current paper trading portfolio status',
        responses: [
          {
            status: 200,
            description: 'Paper portfolio data',
            example: {
              balance: 100000,
              equity: 105250,
              positions: 3,
              open_orders: 1,
              total_pnl: 5250
            }
          }
        ],
        tags: ['Trading']
      }
    ]
  },
  {
    name: 'AI Agent Management',
    description: 'AI trading agent coordination and monitoring',
    icon: <Users className="h-4 w-4" />,
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/agents/status',
        summary: 'Agent Status Overview',
        description: 'Get comprehensive status of all AI trading agents',
        responses: [
          {
            status: 200,
            description: 'Agent status information',
            example: {
              total_agents: 4,
              active_agents: 4,
              agents: [
                {
                  id: 'momentum-trader',
                  name: 'Momentum Trader',
                  status: 'active',
                  performance: { pnl: 1245.67, win_rate: 72.5 }
                }
              ]
            }
          }
        ],
        tags: ['Agents']
      },
      {
        method: 'POST',
        path: '/api/v1/agents/{id}/execute-decision',
        summary: 'Execute Agent Decision',
        description: 'Execute a trading decision made by an AI agent',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Agent ID' }
        ],
        requestBody: {
          type: 'application/json',
          example: {
            decision: 'buy',
            symbol: 'ETH/USD',
            confidence: 0.85,
            reasoning: 'Strong momentum signals detected'
          }
        },
        responses: [
          {
            status: 200,
            description: 'Decision executed successfully',
            example: {
              execution_id: 'exec_789',
              status: 'executed',
              order_id: 'ord_456'
            }
          }
        ],
        tags: ['Agents']
      }
    ]
  },
  {
    name: 'Market Data',
    description: 'Real-time and historical market data',
    icon: <Database className="h-4 w-4" />,
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/market/live-data/{symbol}',
        summary: 'Real-time Market Data',
        description: 'Get live market data for a specific trading symbol',
        parameters: [
          { name: 'symbol', type: 'string', required: true, description: 'Trading symbol (e.g., BTC/USD)' }
        ],
        responses: [
          {
            status: 200,
            description: 'Live market data',
            example: {
              symbol: 'BTC/USD',
              price: 46150.25,
              change_24h: 2.34,
              volume_24h: 28500000000,
              high_24h: 46800,
              low_24h: 44200,
              timestamp: '2025-01-06T08:30:15Z'
            }
          }
        ],
        tags: ['Market']
      },
      {
        method: 'GET',
        path: '/api/v1/market/watchlist',
        summary: 'Market Watchlist',
        description: 'Get current market watchlist with key metrics',
        responses: [
          {
            status: 200,
            description: 'Watchlist data',
            example: [
              {
                symbol: 'BTC/USD',
                price: 46150.25,
                change_24h: 2.34
              },
              {
                symbol: 'ETH/USD',
                price: 2850.50,
                change_24h: 1.87
              }
            ]
          }
        ],
        tags: ['Market']
      }
    ]
  },
  {
    name: 'Risk Management',
    description: 'Risk assessment and management tools',
    icon: <Shield className="h-4 w-4" />,
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/risk/metrics',
        summary: 'Risk Metrics',
        description: 'Get comprehensive risk metrics for the portfolio',
        responses: [
          {
            status: 200,
            description: 'Risk assessment data',
            example: {
              var_95: 0.025,
              sharpe_ratio: 1.24,
              max_drawdown: 0.08,
              concentration_risk: 0.15,
              leverage_ratio: 1.5,
              risk_score: 'medium'
            }
          }
        ],
        tags: ['Risk']
      },
      {
        method: 'POST',
        path: '/api/v1/risk/stress-test',
        summary: 'Stress Test',
        description: 'Run stress test scenarios on the portfolio',
        requestBody: {
          type: 'application/json',
          example: {
            scenario: 'market_crash',
            severity: 'high',
            duration_days: 30
          }
        },
        responses: [
          {
            status: 200,
            description: 'Stress test results',
            example: {
              scenario_id: 'stress_123',
              projected_loss: 0.18,
              recovery_time_days: 45,
              risk_measures: {
                var_impact: 0.035,
                liquidity_impact: 'high'
              }
            }
          }
        ],
        tags: ['Risk']
      }
    ]
  }
]

function ApiEndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200'
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <Card className="mb-4">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`font-mono text-xs ${getMethodColor(endpoint.method)}`}>
              {endpoint.method}
            </Badge>
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {endpoint.path}
            </code>
            <CardTitle className="text-sm">{endpoint.summary}</CardTitle>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
            
            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Parameters</h4>
                <div className="space-y-2">
                  {endpoint.parameters.map((param, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {param.name}
                      </code>
                      <Badge variant={param.required ? "default" : "secondary"} className="text-xs">
                        {param.type}
                      </Badge>
                      {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      <span className="text-muted-foreground">{param.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {endpoint.requestBody && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-sm">Request Body</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(JSON.stringify(endpoint.requestBody.example, null, 2))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(endpoint.requestBody.example, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-sm mb-2">Responses</h4>
              <div className="space-y-3">
                {endpoint.responses.map((response, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={response.status === 200 ? "default" : "secondary"}>
                        {response.status}
                      </Badge>
                      <span className="text-sm">{response.description}</span>
                      {response.example && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {response.example && (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(response.example, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Badge variant="outline" className="text-xs">
                Tags: {endpoint.tags.join(', ')}
              </Badge>
              <Button size="sm" variant="outline" className="ml-auto">
                <Play className="h-3 w-3 mr-1" />
                Try It Out
              </Button>
            </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function SwaggerApiDocs() {
  const [selectedCategory, setSelectedCategory] = useState<string>(apiCategories[0].name)

  const currentCategory = apiCategories.find(cat => cat.name === selectedCategory) || apiCategories[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                AI Trading Dashboard API Documentation
                <Badge variant="secondary" className="text-xs">
                  Interactive API Explorer
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                Comprehensive API documentation for the Advanced Multi-Agent Trading Platform with real-time data, 
                AI agents, and portfolio management. All endpoints are production-ready with full authentication support.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">API Version</div>
              <div className="font-semibold">v1.0.0</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {apiCategories.reduce((sum, cat) => sum + cat.endpoints.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Endpoints</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{apiCategories.length}</div>
              <div className="text-xs text-muted-foreground">API Categories</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">REST</div>
              <div className="text-xs text-muted-foreground">API Type</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">JSON</div>
              <div className="text-xs text-muted-foreground">Response Format</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">API Categories</CardTitle>
            <CardDescription>Browse endpoints by functional category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {apiCategories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => setSelectedCategory(category.name)}
              >
                <div className="flex items-center gap-2">
                  {category.icon}
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {category.endpoints.length} endpoints
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Endpoint Details */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentCategory.icon}
                {currentCategory.name}
                <Badge variant="outline" className="text-xs">
                  {currentCategory.endpoints.length} endpoints
                </Badge>
              </CardTitle>
              <CardDescription>{currentCategory.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentCategory.endpoints.map((endpoint, index) => (
                  <ApiEndpointCard key={index} endpoint={endpoint} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Quick Reference
          </CardTitle>
          <CardDescription>Essential information for API integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Base URLs</h4>
              <div className="space-y-1 text-sm">
                <div><strong>Production:</strong> <code>https://api.civaldashboard.com</code></div>
                <div><strong>Development:</strong> <code>http://localhost:8000</code></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Authentication</h4>
              <div className="space-y-1 text-sm">
                <div>Bearer Token: <code>Authorization: Bearer &lt;token&gt;</code></div>
                <div>API Key: <code>X-API-Key: &lt;your-api-key&gt;</code></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rate Limits</h4>
              <div className="space-y-1 text-sm">
                <div>Standard: 1000 requests/hour</div>
                <div>Premium: 10000 requests/hour</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response Format</h4>
              <div className="space-y-1 text-sm">
                <div>Content-Type: <code>application/json</code></div>
                <div>Timezone: UTC</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}