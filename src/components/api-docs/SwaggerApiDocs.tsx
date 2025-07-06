'use client'

import React from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Code, Server, Shield } from 'lucide-react'

// Define the OpenAPI specification for the trading dashboard
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AI Trading Dashboard API',
    version: '1.0.0',
    description: 'Comprehensive API for the Advanced Multi-Agent Trading Platform with real-time data, AI agents, and portfolio management.',
    contact: {
      name: 'Trading Dashboard Team',
      email: 'support@civaldashboard.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://cival-dashboard.vercel.app',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'System', description: 'System health and service management' },
    { name: 'Market Data', description: 'Real-time market data and analysis' },
    { name: 'Trading', description: 'Order management and execution' },
    { name: 'Agents', description: 'AI trading agent coordination' },
    { name: 'Portfolio', description: 'Portfolio and balance management' },
    { name: 'Farms', description: 'Multi-strategy farm coordination' },
    { name: 'Goals', description: 'Trading goals and objectives' },
    { name: 'Analytics', description: 'Performance metrics and insights' },
    { name: 'AI Services', description: 'AI analysis and recommendations' }
  ],
  paths: {
    // System Health APIs
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'System health check',
        description: 'Check overall system health and service status',
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    services: {
                      type: 'object',
                      properties: {
                        database: { type: 'boolean' },
                        redis: { type: 'boolean' },
                        websocket: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/system/services': {
      get: {
        tags: ['System'],
        summary: 'Service registry status',
        description: 'Get status of all registered services',
        responses: {
          '200': {
            description: 'Service status information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    services: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          status: { type: 'string', enum: ['active', 'inactive', 'error'] },
                          uptime: { type: 'number' },
                          lastCheck: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Market Data APIs
    '/api/market/overview': {
      get: {
        tags: ['Market Data'],
        summary: 'Market overview',
        description: 'Get comprehensive market overview with top cryptocurrencies',
        responses: {
          '200': {
            description: 'Market overview data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalMarketCap: { type: 'number' },
                    totalVolume24h: { type: 'number' },
                    marketCapChange24h: { type: 'number' },
                    prices: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          symbol: { type: 'string' },
                          price: { type: 'number' },
                          changePercent24h: { type: 'number' },
                          volume24h: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/market/data/{symbol}': {
      get: {
        tags: ['Market Data'],
        summary: 'Get market data for specific symbol',
        parameters: [
          {
            name: 'symbol',
            in: 'path',
            required: true,
            description: 'Trading symbol (e.g., BTCUSD)',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Market data for the symbol',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    symbol: { type: 'string' },
                    price: { type: 'number' },
                    change24h: { type: 'number' },
                    volume24h: { type: 'number' },
                    high24h: { type: 'number' },
                    low24h: { type: 'number' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Trading APIs
    '/api/trading/paper/portfolio': {
      get: {
        tags: ['Trading'],
        summary: 'Get paper trading portfolio',
        description: 'Retrieve current paper trading portfolio status',
        responses: {
          '200': {
            description: 'Portfolio information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalValue: { type: 'number' },
                    cash: { type: 'number' },
                    positions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          symbol: { type: 'string' },
                          quantity: { type: 'number' },
                          averagePrice: { type: 'number' },
                          currentValue: { type: 'number' },
                          pnl: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/trading/paper/simulate': {
      post: {
        tags: ['Trading'],
        summary: 'Simulate paper trade',
        description: 'Execute a simulated trade in the paper trading environment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['symbol', 'side', 'quantity'],
                properties: {
                  symbol: { type: 'string', example: 'BTCUSD' },
                  side: { type: 'string', enum: ['buy', 'sell'] },
                  quantity: { type: 'number', example: 0.1 },
                  orderType: { type: 'string', enum: ['market', 'limit'], default: 'market' },
                  price: { type: 'number', description: 'Required for limit orders' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Trade executed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orderId: { type: 'string' },
                    status: { type: 'string' },
                    executedPrice: { type: 'number' },
                    executedQuantity: { type: 'number' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // AI Agents APIs
    '/api/agents': {
      get: {
        tags: ['Agents'],
        summary: 'List all AI agents',
        description: 'Get list of all trading agents with their status',
        responses: {
          '200': {
            description: 'List of agents',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      status: { type: 'string', enum: ['active', 'inactive', 'paused'] },
                      strategy: { type: 'string' },
                      performance: {
                        type: 'object',
                        properties: {
                          totalPnL: { type: 'number' },
                          winRate: { type: 'number' },
                          totalTrades: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/agent-coordination/consensus': {
      post: {
        tags: ['Agents'],
        summary: 'Multi-agent consensus decision',
        description: 'Get consensus decision from multiple AI agents',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  symbol: { type: 'string' },
                  agents: { type: 'array', items: { type: 'string' } },
                  marketData: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Consensus decision',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recommendation: { type: 'string', enum: ['BUY', 'SELL', 'HOLD'] },
                    confidence: { type: 'number', minimum: 0, maximum: 100 },
                    consensus: { type: 'number', minimum: 0, maximum: 1 },
                    agentDecisions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          agentId: { type: 'string' },
                          recommendation: { type: 'string' },
                          confidence: { type: 'number' },
                          reasoning: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Portfolio APIs
    '/api/portfolio': {
      get: {
        tags: ['Portfolio'],
        summary: 'Get portfolio summary',
        description: 'Retrieve comprehensive portfolio information',
        responses: {
          '200': {
            description: 'Portfolio summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalValue: { type: 'number' },
                    dayChange: { type: 'number' },
                    dayChangePercent: { type: 'number' },
                    positions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          symbol: { type: 'string' },
                          quantity: { type: 'number' },
                          value: { type: 'number' },
                          allocation: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Farms APIs
    '/api/farms': {
      get: {
        tags: ['Farms'],
        summary: 'List all farms',
        description: 'Get list of all trading farms with performance metrics',
        responses: {
          '200': {
            description: 'List of farms',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      agentCount: { type: 'integer' },
                      totalAllocated: { type: 'number' },
                      performance: {
                        type: 'object',
                        properties: {
                          totalReturn: { type: 'number' },
                          annualizedReturn: { type: 'number' },
                          maxDrawdown: { type: 'number' }
                        }
                      },
                      isActive: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Farms'],
        summary: 'Create new farm',
        description: 'Create a new trading farm with specified configuration',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type', 'agentCount', 'allocation'],
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  agentCount: { type: 'integer', minimum: 1 },
                  allocation: { type: 'number', minimum: 0 },
                  strategy: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Farm created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    status: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Goals APIs
    '/api/goals': {
      get: {
        tags: ['Goals'],
        summary: 'List all goals',
        description: 'Get list of all trading goals and their progress',
        responses: {
          '200': {
            description: 'List of goals',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      targetValue: { type: 'number' },
                      currentValue: { type: 'number' },
                      progress: { type: 'number', minimum: 0, maximum: 100 },
                      targetDate: { type: 'string', format: 'date' },
                      isActive: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Goals'],
        summary: 'Create new goal',
        description: 'Create a new trading goal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'type', 'targetValue', 'targetDate'],
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  targetValue: { type: 'number' },
                  targetDate: { type: 'string', format: 'date' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Goal created successfully'
          }
        }
      }
    },

    // Analytics APIs
    '/api/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics overview',
        description: 'Retrieve comprehensive analytics and performance metrics',
        responses: {
          '200': {
            description: 'Analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    performance: {
                      type: 'object',
                      properties: {
                        totalReturn: { type: 'number' },
                        sharpeRatio: { type: 'number' },
                        maxDrawdown: { type: 'number' },
                        winRate: { type: 'number' }
                      }
                    },
                    timeSeriesData: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          timestamp: { type: 'string', format: 'date-time' },
                          value: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // AI Services APIs
    '/api/ai/recommendations': {
      get: {
        tags: ['AI Services'],
        summary: 'Get AI recommendations',
        description: 'Get trading recommendations from AI analysis',
        parameters: [
          {
            name: 'symbol',
            in: 'query',
            description: 'Trading symbol to analyze',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'AI recommendations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recommendations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          action: { type: 'string', enum: ['BUY', 'SELL', 'HOLD'] },
                          confidence: { type: 'number' },
                          reasoning: { type: 'string' },
                          timeframe: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/ai/risk-assessment': {
      post: {
        tags: ['AI Services'],
        summary: 'AI risk assessment',
        description: 'Get AI-powered risk assessment for portfolio or positions',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  portfolio: { type: 'object' },
                  timeframe: { type: 'string' },
                  riskTolerance: { type: 'string', enum: ['conservative', 'moderate', 'aggressive'] }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Risk assessment results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    riskScore: { type: 'number', minimum: 0, maximum: 100 },
                    riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                    recommendations: { type: 'array', items: { type: 'string' } },
                    varMetrics: {
                      type: 'object',
                      properties: {
                        var95: { type: 'number' },
                        var99: { type: 'number' },
                        expectedShortfall: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFoundError: {
        description: 'The specified resource was not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  }
}

interface SwaggerApiDocsProps {
  className?: string
}

export function SwaggerApiDocs({ className }: SwaggerApiDocsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                AI Trading Dashboard API Documentation
                <Badge variant="default" className="text-xs">
                  OpenAPI 3.0
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                Comprehensive documentation for all 25+ API endpoints in the Advanced Multi-Agent Trading Platform.
                Interactive documentation with real-time testing capabilities.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Server className="h-3 w-3 mr-1" />
                Production Ready
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Secure APIs
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">25+</div>
              <div className="text-xs text-muted-foreground">API Endpoints</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">9</div>
              <div className="text-xs text-muted-foreground">Service Categories</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">RESTful</div>
              <div className="text-xs text-muted-foreground">API Design</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">JSON</div>
              <div className="text-xs text-muted-foreground">Data Format</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1 mb-2">
              <Code className="h-4 w-4" />
              <span className="font-medium">API Categories:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <span>• System Health & Services</span>
              <span>• Real-time Market Data</span>
              <span>• Trading & Portfolio</span>
              <span>• AI Agent Coordination</span>
              <span>• Farm Management</span>
              <span>• Goal Tracking</span>
              <span>• Performance Analytics</span>
              <span>• AI Services & ML</span>
              <span>• Risk Management</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swagger UI Component */}
      <Card>
        <CardContent className="p-0">
          <div className="swagger-wrapper" style={{ minHeight: '800px' }}>
            <SwaggerUI 
              spec={swaggerSpec}
              docExpansion="list"
              defaultModelsExpandDepth={1}
              defaultModelExpandDepth={1}
              displayOperationId={false}
              displayRequestDuration={true}
              filter={true}
              showExtensions={false}
              showCommonExtensions={false}
              tryItOutEnabled={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SwaggerApiDocs