/**
 * Knowledge Graph Dashboard
 * Phase 4: Advanced analytics with knowledge graph relationships and search
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { backendApi } from '@/lib/api/backend-client'
import { 
  Search, 
  Brain, 
  Network, 
  TrendingUp, 
  Bot, 
  Target, 
  Clock, 
  BarChart3,
  Zap,
  Eye,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface KnowledgeGraphStats {
  total_nodes: number
  total_edges: number
  node_types: Record<string, number>
  relationship_types: Record<string, number>
  connected_components: number
  average_degree: number
}

interface SearchResult {
  node_id: string
  type: string
  similarity_score: number
  [key: string]: any
}

interface StrategyPattern {
  strategy_id: string
  strategy_name: string
  strategy_type: string
  win_rate: number
  total_trades: number
  total_pnl: number
  avg_pnl: number
}

interface AgentSpecialization {
  preferred_symbol: string
  symbol_performance: Record<string, any>
  preferred_trading_hour: number
  total_pnl: number
  trade_count: number
}

interface DecisionCorrelation {
  confidence_level: number
  win_rate: number
  total_trades: number
  avg_pnl: number
}

export default function KnowledgeGraphPage() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [stats, setStats] = useState<KnowledgeGraphStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchEntityType, setSearchEntityType] = useState<string>('')
  const [isSearching, setIsSearching] = useState(false)
  const [strategyPatterns, setStrategyPatterns] = useState<StrategyPattern[]>([])
  const [agentSpecializations, setAgentSpecializations] = useState<Record<string, AgentSpecialization>>({})
  const [decisionCorrelations, setDecisionCorrelations] = useState<DecisionCorrelation[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [entityTimeline, setEntityTimeline] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Initialize knowledge graph on page load
  useEffect(() => {
    initializeGraph()
  }, [])

  const initializeGraph = async () => {
    setIsInitializing(true)
    setError(null)
    
    try {
      const response = await backendApi.initializeKnowledgeGraph()
      if (response.error) {
        throw new Error(response.error)
      }
      
      setIsInitialized(true)
      await loadAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize knowledge graph')
    } finally {
      setIsInitializing(false)
    }
  }

  const loadAllData = async () => {
    try {
      // Load all analytics data in parallel
      const [statsRes, patternsRes, specializationsRes, correlationsRes] = await Promise.all([
        backendApi.getKnowledgeGraphStats(),
        backendApi.getStrategyPatterns(),
        backendApi.getAgentSpecializations(),
        backendApi.getDecisionCorrelations()
      ])

      if (statsRes.data) setStats(statsRes.data.statistics)
      if (patternsRes.data) setStrategyPatterns(patternsRes.data.patterns)
      if (specializationsRes.data) setAgentSpecializations(specializationsRes.data.specializations)
      if (correlationsRes.data) setDecisionCorrelations(correlationsRes.data.correlations)
    } catch (err) {
      console.error('Failed to load analytics data:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await backendApi.searchKnowledgeGraph(
        searchQuery, 
        searchEntityType || undefined, 
        20
      )
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setSearchResults(response.data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const loadEntityTimeline = async (entityId: string) => {
    try {
      const response = await backendApi.getEntityTimeline(entityId, 30)
      if (response.data) {
        setEntityTimeline(response.data.timeline)
        setSelectedEntity(entityId)
      }
    } catch (err) {
      console.error('Failed to load entity timeline:', err)
    }
  }

  const formatEntityType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strategy': return <TrendingUp className="h-4 w-4" />
      case 'agent': return <Bot className="h-4 w-4" />
      case 'trade': return <Target className="h-4 w-4" />
      case 'decision': return <Brain className="h-4 w-4" />
      default: return <Network className="h-4 w-4" />
    }
  }

  if (!isInitialized && !isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Knowledge Graph
            </CardTitle>
            <CardDescription>
              Initialize the knowledge graph to discover relationships in your trading data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={initializeGraph} className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Initialize Knowledge Graph
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Graph Analytics</h1>
          <p className="text-muted-foreground">
            Discover relationships and patterns in your trading data
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isInitializing ? (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Initializing...
            </Badge>
          ) : isInitialized ? (
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isInitializing && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <div>
                <p className="font-medium">Building Knowledge Graph...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing strategies, trades, decisions, and agent patterns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isInitialized && stats && (
        <>
          {/* Knowledge Graph Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_nodes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Entities in graph
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relationships</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_edges.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Connected relationships
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Components</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.connected_components}</div>
                <p className="text-xs text-muted-foreground">
                  Connected groups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Degree</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.average_degree.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Connections per node
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Knowledge Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Knowledge Search
              </CardTitle>
              <CardDescription>
                Search for entities and discover relationships using AI similarity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search for strategies, agents, trades, or decisions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <select
                  value={searchEntityType}
                  onChange={(e) => setSearchEntityType(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Types</option>
                  <option value="strategy">Strategies</option>
                  <option value="agent">Agents</option>
                  <option value="trade">Trades</option>
                  <option value="decision">Decisions</option>
                </select>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Search Results ({searchResults.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => loadEntityTimeline(result.node_id)}
                      >
                        <div className="flex items-center gap-2">
                          {getTypeIcon(result.type)}
                          <div>
                            <div className="font-medium text-sm">{result.node_id}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatEntityType(result.type)}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {(result.similarity_score * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="patterns" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="patterns">Strategy Patterns</TabsTrigger>
              <TabsTrigger value="specializations">Agent Specializations</TabsTrigger>
              <TabsTrigger value="correlations">Decision Analysis</TabsTrigger>
              <TabsTrigger value="timeline">Entity Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="patterns" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Successful Strategy Patterns</CardTitle>
                  <CardDescription>
                    Strategies with high win rates and consistent performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {strategyPatterns.slice(0, 10).map((pattern, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{pattern.strategy_name}</div>
                          <div className="text-sm text-muted-foreground">{pattern.strategy_type}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {pattern.total_trades} trades • ${pattern.total_pnl.toFixed(2)} total P&L
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {(pattern.win_rate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">win rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specializations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Specializations</CardTitle>
                  <CardDescription>
                    What each agent excels at and their trading preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(agentSpecializations).map(([agentId, spec]) => (
                      <div key={agentId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium">{agentId}</div>
                          <Badge variant="outline">{spec.trade_count} trades</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Preferred Symbol:</span>
                            <div className="font-medium">{spec.preferred_symbol}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Best Trading Hour:</span>
                            <div className="font-medium">{spec.preferred_trading_hour}:00</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total P&L:</span>
                            <div className={`font-medium ${spec.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${spec.total_pnl.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="correlations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Decision Confidence Analysis</CardTitle>
                  <CardDescription>
                    Correlation between agent confidence and trade outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {decisionCorrelations.map((corr, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            Confidence: {(corr.confidence_level * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {corr.total_trades} trades • Avg P&L: ${corr.avg_pnl.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">
                            {(corr.win_rate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">success rate</div>
                        </div>
                        <div className="w-32 ml-4">
                          <Progress value={corr.win_rate * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Entity Timeline
                  </CardTitle>
                  <CardDescription>
                    {selectedEntity ? `Activity timeline for ${selectedEntity}` : 'Select an entity from search results to view its timeline'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {entityTimeline.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {entityTimeline.map((event, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border-l-2 border-muted-foreground/20 pl-4">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(event.entity_type)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{event.entity_id}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatEntityType(event.entity_type)} • {new Date(event.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm mt-1">
                              {JSON.stringify(event.details, null, 2).slice(0, 100)}...
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No timeline data available</p>
                      <p className="text-sm">Search for an entity to view its activity timeline</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}