'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, 
  Network, 
  Search, 
  Filter, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  FileText,
  RefreshCw,
  Zap,
  Activity,
  Link,
  Trash2,
  Edit,
  Plus,
  Eye,
  Settings
} from 'lucide-react'
import { geminiService, MemoryEntry } from '@/lib/ai/GeminiService'

export interface KnowledgeNode {
  id: string
  type: 'concept' | 'decision' | 'observation' | 'strategy' | 'goal' | 'relationship'
  label: string
  content: string
  importance: number
  connections: string[]
  timestamp: number
  agentId: string
  metadata: {
    tags: string[]
    category: string
    confidence?: number
    source?: string
    outcome?: string
  }
}

export interface KnowledgeEdge {
  id: string
  from: string
  to: string
  type: 'causes' | 'relates_to' | 'depends_on' | 'conflicts_with' | 'reinforces'
  strength: number
  timestamp: number
  description?: string
}

export interface AgentMemoryGraphProps {
  agentId: string
  className?: string
  onNodeSelect?: (node: KnowledgeNode) => void
  onGraphUpdate?: (nodes: KnowledgeNode[], edges: KnowledgeEdge[]) => void
}

export function AgentMemoryGraph({
  agentId,
  className = '',
  onNodeSelect,
  onGraphUpdate
}: AgentMemoryGraphProps) {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([])
  const [edges, setEdges] = useState<KnowledgeEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [memoryStats, setMemoryStats] = useState({
    totalNodes: 0,
    concepts: 0,
    decisions: 0,
    strategies: 0,
    connections: 0
  })
  const svgRef = useRef<SVGSVGElement>(null)

  // Load agent memory and build knowledge graph
  useEffect(() => {
    loadAgentMemory()
  }, [agentId])

  const loadAgentMemory = useCallback(async () => {
    setIsLoading(true)
    try {
      const memories = geminiService.getAgentMemory(agentId)
      const graphData = buildKnowledgeGraph(memories)
      
      setNodes(graphData.nodes)
      setEdges(graphData.edges)
      updateMemoryStats(graphData.nodes, graphData.edges)
      
      onGraphUpdate?.(graphData.nodes, graphData.edges)
      
    } catch (error) {
      console.error('Failed to load agent memory:', error)
    } finally {
      setIsLoading(false)
    }
  }, [agentId, onGraphUpdate])

  // Build knowledge graph from memory entries
  const buildKnowledgeGraph = (memories: MemoryEntry[]): { nodes: KnowledgeNode[], edges: KnowledgeEdge[] } => {
    const nodes: KnowledgeNode[] = []
    const edges: KnowledgeEdge[] = []
    const conceptMap = new Map<string, string>() // concept -> nodeId mapping

    // Create nodes from memory entries
    memories.forEach((memory, index) => {
      const node: KnowledgeNode = {
        id: `node_${memory.id}`,
        type: memory.type === 'decision' ? 'decision' : 
              memory.type === 'learning' ? 'concept' :
              memory.type === 'strategy_update' ? 'strategy' : 'observation',
        label: extractMainConcept(memory.content),
        content: memory.content,
        importance: memory.importance,
        connections: [],
        timestamp: memory.timestamp,
        agentId: memory.agentId,
        metadata: {
          tags: memory.tags,
          category: memory.type,
          source: 'agent_memory'
        }
      }

      nodes.push(node)

      // Extract concepts for relationship building
      const concepts = extractConcepts(memory.content)
      concepts.forEach(concept => {
        conceptMap.set(concept.toLowerCase(), node.id)
      })
    })

    // Create edges based on concept relationships
    nodes.forEach(node => {
      const concepts = extractConcepts(node.content)
      
      concepts.forEach(concept => {
        const relatedNodeId = conceptMap.get(concept.toLowerCase())
        if (relatedNodeId && relatedNodeId !== node.id) {
          const existingEdge = edges.find(e => 
            (e.from === node.id && e.to === relatedNodeId) ||
            (e.from === relatedNodeId && e.to === node.id)
          )
          
          if (!existingEdge) {
            const relationshipType = determineRelationshipType(node, nodes.find(n => n.id === relatedNodeId)!)
            
            edges.push({
              id: `edge_${node.id}_${relatedNodeId}`,
              from: node.id,
              to: relatedNodeId,
              type: relationshipType,
              strength: calculateRelationshipStrength(node, nodes.find(n => n.id === relatedNodeId)!),
              timestamp: Math.max(node.timestamp, nodes.find(n => n.id === relatedNodeId)!.timestamp),
              description: `${relationshipType.replace('_', ' ')} relationship`
            })
          }
        }
      })
    })

    // Update node connections
    nodes.forEach(node => {
      node.connections = edges
        .filter(edge => edge.from === node.id || edge.to === node.id)
        .map(edge => edge.from === node.id ? edge.to : edge.from)
    })

    return { nodes, edges }
  }

  // Helper functions for graph building
  const extractMainConcept = (content: string): string => {
    const words = content.split(' ').slice(0, 5).join(' ')
    return words.length > 50 ? words.substring(0, 47) + '...' : words
  }

  const extractConcepts = (content: string): string[] => {
    // Simple concept extraction - in practice, you'd use NLP
    const tradingConcepts = [
      'buy', 'sell', 'hold', 'profit', 'loss', 'risk', 'strategy', 'momentum', 
      'reversal', 'breakout', 'support', 'resistance', 'trend', 'volume',
      'bullish', 'bearish', 'volatility', 'position', 'portfolio'
    ]
    
    return tradingConcepts.filter(concept => 
      content.toLowerCase().includes(concept)
    )
  }

  const determineRelationshipType = (node1: KnowledgeNode, node2: KnowledgeNode): KnowledgeEdge['type'] => {
    if (node1.type === 'decision' && node2.type === 'concept') return 'depends_on'
    if (node1.type === 'strategy' && node2.type === 'decision') return 'relates_to'
    if (node1.timestamp > node2.timestamp) return 'causes'
    if (Math.abs(node1.importance - node2.importance) > 0.3) return 'conflicts_with'
    return 'relates_to'
  }

  const calculateRelationshipStrength = (node1: KnowledgeNode, node2: KnowledgeNode): number => {
    const timeDiff = Math.abs(node1.timestamp - node2.timestamp)
    const importanceSim = 1 - Math.abs(node1.importance - node2.importance)
    const temporalDecay = Math.exp(-timeDiff / (7 * 24 * 60 * 60 * 1000)) // 7 days decay
    
    return Math.min(1, importanceSim * 0.7 + temporalDecay * 0.3)
  }

  const updateMemoryStats = (nodes: KnowledgeNode[], edges: KnowledgeEdge[]) => {
    setMemoryStats({
      totalNodes: nodes.length,
      concepts: nodes.filter(n => n.type === 'concept').length,
      decisions: nodes.filter(n => n.type === 'decision').length,
      strategies: nodes.filter(n => n.type === 'strategy').length,
      connections: edges.length
    })
  }

  // Filter and search functionality
  const filteredNodes = nodes.filter(node => {
    const matchesType = filterType === 'all' || node.type === filterType
    const matchesSearch = !searchQuery || 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesType && matchesSearch
  })

  // Graph visualization (simplified SVG representation)
  const renderGraph = () => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const width = rect.width || 400
    const height = rect.height || 300

    // Position nodes in a circle for simple layout
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.3

    const nodePositions = new Map<string, { x: number, y: number }>()
    
    filteredNodes.forEach((node, index) => {
      const angle = (index / filteredNodes.length) * 2 * Math.PI
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      nodePositions.set(node.id, { x, y })
    })

    return (
      <svg ref={svgRef} className="w-full h-full">
        {/* Render edges */}
        {edges
          .filter(edge => 
            nodePositions.has(edge.from) && nodePositions.has(edge.to)
          )
          .map(edge => {
            const fromPos = nodePositions.get(edge.from)!
            const toPos = nodePositions.get(edge.to)!
            
            return (
              <line
                key={edge.id}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={getEdgeColor(edge.type)}
                strokeWidth={edge.strength * 3}
                opacity={0.6}
              />
            )
          })}
        
        {/* Render nodes */}
        {filteredNodes.map(node => {
          const pos = nodePositions.get(node.id)!
          
          return (
            <g key={node.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={8 + node.importance * 12}
                fill={getNodeColor(node.type)}
                stroke={selectedNode?.id === node.id ? '#3b82f6' : '#e5e7eb'}
                strokeWidth={selectedNode?.id === node.id ? 3 : 1}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  setSelectedNode(node)
                  onNodeSelect?.(node)
                }}
              />
              <text
                x={pos.x}
                y={pos.y + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600 pointer-events-none"
              >
                {node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  const getNodeColor = (type: KnowledgeNode['type']): string => {
    switch (type) {
      case 'concept': return '#10b981'
      case 'decision': return '#3b82f6'
      case 'strategy': return '#8b5cf6'
      case 'goal': return '#f59e0b'
      case 'observation': return '#6b7280'
      default: return '#9ca3af'
    }
  }

  const getEdgeColor = (type: KnowledgeEdge['type']): string => {
    switch (type) {
      case 'causes': return '#ef4444'
      case 'depends_on': return '#3b82f6'
      case 'relates_to': return '#6b7280'
      case 'conflicts_with': return '#f59e0b'
      case 'reinforces': return '#10b981'
      default: return '#9ca3af'
    }
  }

  // Add new memory entry
  const addMemoryEntry = async (content: string, type: MemoryEntry['type'], tags: string[]) => {
    const newEntry: MemoryEntry = {
      id: `memory_${Date.now()}`,
      agentId,
      type,
      content,
      context: {},
      importance: 0.5,
      timestamp: Date.now(),
      tags
    }

    // Add to Gemini service
    geminiService['addToMemory'](agentId, newEntry)
    
    // Reload graph
    await loadAgentMemory()
  }

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  const getTypeIcon = (type: KnowledgeNode['type']) => {
    switch (type) {
      case 'concept': return <Lightbulb className="h-4 w-4" />
      case 'decision': return <Target className="h-4 w-4" />
      case 'strategy': return <TrendingUp className="h-4 w-4" />
      case 'goal': return <Zap className="h-4 w-4" />
      case 'observation': return <Eye className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6" />
            Agent Memory Graph
          </h2>
          <p className="text-muted-foreground">
            Visual representation of agent knowledge and decision relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAgentMemory}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Nodes</p>
                <p className="text-2xl font-bold">{memoryStats.totalNodes}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concepts</p>
                <p className="text-2xl font-bold">{memoryStats.concepts}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Decisions</p>
                <p className="text-2xl font-bold">{memoryStats.decisions}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Strategies</p>
                <p className="text-2xl font-bold">{memoryStats.strategies}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connections</p>
                <p className="text-2xl font-bold">{memoryStats.connections}</p>
              </div>
              <Link className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="graph" className="w-full">
        <TabsList>
          <TabsTrigger value="graph">Graph View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="graph">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graph Visualization */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Knowledge Graph</CardTitle>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search nodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-48"
                      />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="all">All Types</option>
                        <option value="concept">Concepts</option>
                        <option value="decision">Decisions</option>
                        <option value="strategy">Strategies</option>
                        <option value="observation">Observations</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-96 border rounded-lg bg-gray-50">
                    {renderGraph()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Node Details */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedNode ? 'Node Details' : 'Select a Node'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedNode ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(selectedNode.type)}
                        <Badge variant="outline">
                          {selectedNode.type}
                        </Badge>
                        <Badge variant="secondary">
                          {(selectedNode.importance * 100).toFixed(0)}% importance
                        </Badge>
                      </div>
                      
                      <div>
                        <Label className="font-semibold">Content</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedNode.content}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="font-semibold">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedNode.metadata.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="font-semibold">Created</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(selectedNode.timestamp)}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="font-semibold">Connections</Label>
                        <p className="text-sm text-muted-foreground">
                          Connected to {selectedNode.connections.length} other nodes
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click on a node in the graph to see details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Memory Entries</CardTitle>
              <CardDescription>
                All knowledge nodes in chronological order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredNodes
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map(node => (
                      <div
                        key={node.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedNode(node)
                          onNodeSelect?.(node)
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(node.type)}
                            <span className="font-medium">{node.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {node.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(node.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {node.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {node.connections.length} connections
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(node.importance * 100).toFixed(0)}% importance
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Memory Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries({
                    'Concepts': memoryStats.concepts,
                    'Decisions': memoryStats.decisions,
                    'Strategies': memoryStats.strategies,
                    'Observations': memoryStats.totalNodes - memoryStats.concepts - memoryStats.decisions - memoryStats.strategies
                  }).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ 
                              width: `${memoryStats.totalNodes > 0 ? (count / memoryStats.totalNodes) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Most Connected Node
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {nodes.length > 0 
                        ? nodes.reduce((max, node) => 
                            node.connections.length > max.connections.length ? node : max
                          ).label
                        : 'No nodes yet'
                      }
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Learning Trend
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {memoryStats.totalNodes > 5 ? 'Active learning' : 'Building knowledge base'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">
                        Knowledge Density
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 mt-1">
                      {memoryStats.totalNodes > 0 
                        ? `${(memoryStats.connections / memoryStats.totalNodes).toFixed(1)} connections per node`
                        : 'No connections yet'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AgentMemoryGraph