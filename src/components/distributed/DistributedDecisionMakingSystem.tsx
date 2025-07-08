'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Brain, Network, GitBranch, Users, Vote, Target, Zap,
  Activity, TrendingUp, Clock, AlertTriangle, CheckCircle2,
  Settings, RefreshCw, Eye, Play, Pause, StopCircle,
  Globe, Shield, Key, Lock, Layers, Server, Database,
  ArrowRight, ArrowLeft, Repeat, Timer, Award, Star,
  MessageSquare, Bot, Cpu, BarChart3, PieChart, LineChart
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ComposedChart,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Sankey, Flow, TreeMap
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Distributed Decision Making System Component
 * Advanced distributed consensus and decision-making for multi-agent trading
 * Features Byzantine fault tolerance, voting mechanisms, and conflict resolution
 */

interface DecisionNode {
  id: string
  name: string
  type: 'voter' | 'validator' | 'coordinator' | 'observer'
  status: 'active' | 'inactive' | 'faulty' | 'byzantine'
  weight: number
  reputation: number
  votingPower: number
  performance: NodePerformance
  capabilities: string[]
  region: string
  lastSeen: Date
  isLeader: boolean
}

interface NodePerformance {
  uptime: number
  reliability: number
  responseTime: number
  decisionAccuracy: number
  totalDecisions: number
  correctDecisions: number
  byzantineBehavior: number
  consensusParticipation: number
}

interface DistributedDecision {
  id: string
  title: string
  description: string
  type: 'trading' | 'risk' | 'allocation' | 'strategy' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'proposed' | 'voting' | 'consensus' | 'executed' | 'failed' | 'cancelled'
  proposer: string
  participants: string[]
  votes: DecisionVote[]
  requirements: DecisionRequirements
  timeline: DecisionTimeline
  outcome?: DecisionOutcome
  conflictResolution?: ConflictResolution
}

interface DecisionVote {
  nodeId: string
  vote: 'yes' | 'no' | 'abstain' | 'veto'
  weight: number
  confidence: number
  reasoning: string
  timestamp: Date
  signature: string
  evidence?: any
}

interface DecisionRequirements {
  minParticipants: number
  consensusThreshold: number
  timeoutMinutes: number
  requireUnanimity: boolean
  allowVeto: boolean
  weightedVoting: boolean
  byzantineTolerance: number
}

interface DecisionTimeline {
  proposed: Date
  votingStarted?: Date
  votingEnded?: Date
  consensusReached?: Date
  executed?: Date
  cancelled?: Date
}

interface DecisionOutcome {
  result: 'approved' | 'rejected' | 'timeout' | 'cancelled'
  finalScore: number
  participation: number
  consensusStrength: number
  executionDetails?: any
  impact?: DecisionImpact
}

interface DecisionImpact {
  financialImpact: number
  riskImpact: number
  performanceImpact: number
  systemImpact: number
  confidence: number
}

interface ConflictResolution {
  type: 'majority' | 'weighted' | 'mediation' | 'arbitration'
  mediator?: string
  arbitrator?: string
  resolution: string
  timestamp: Date
}

interface ConsensusAlgorithm {
  id: string
  name: string
  type: 'pbft' | 'raft' | 'tendermint' | 'avalanche' | 'custom'
  description: string
  byzantineTolerance: number
  scalability: number
  finality: 'probabilistic' | 'absolute'
  energyEfficiency: number
  isActive: boolean
  performance: AlgorithmPerformance
}

interface AlgorithmPerformance {
  averageConsensusTime: number
  throughput: number
  faultTolerance: number
  networkOverhead: number
  accuracy: number
  scalabilityScore: number
}

interface SystemMetrics {
  totalNodes: number
  activeNodes: number
  faultyNodes: number
  byzantineNodes: number
  totalDecisions: number
  consensusRate: number
  averageDecisionTime: number
  systemThroughput: number
  byzantineTolerance: number
  networkHealth: number
  consensusEfficiency: number
  conflictResolutionRate: number
}

const MOCK_NODES: DecisionNode[] = [
  {
    id: 'node-001',
    name: 'Alpha Validator',
    type: 'validator',
    status: 'active',
    weight: 0.15,
    reputation: 92.5,
    votingPower: 150,
    performance: {
      uptime: 99.8,
      reliability: 96.2,
      responseTime: 145,
      decisionAccuracy: 87.3,
      totalDecisions: 1247,
      correctDecisions: 1089,
      byzantineBehavior: 0.2,
      consensusParticipation: 98.5
    },
    capabilities: ['Trading Analysis', 'Risk Assessment', 'Market Prediction'],
    region: 'us-east',
    lastSeen: new Date(Date.now() - 30 * 1000),
    isLeader: true
  },
  {
    id: 'node-002',
    name: 'Beta Coordinator',
    type: 'coordinator',
    status: 'active',
    weight: 0.12,
    reputation: 89.1,
    votingPower: 120,
    performance: {
      uptime: 98.9,
      reliability: 94.8,
      responseTime: 167,
      decisionAccuracy: 85.7,
      totalDecisions: 956,
      correctDecisions: 820,
      byzantineBehavior: 0.1,
      consensusParticipation: 97.2
    },
    capabilities: ['Coordination', 'Conflict Resolution', 'System Optimization'],
    region: 'eu-west',
    lastSeen: new Date(Date.now() - 45 * 1000),
    isLeader: false
  },
  {
    id: 'node-003',
    name: 'Gamma Voter',
    type: 'voter',
    status: 'active',
    weight: 0.08,
    reputation: 91.7,
    votingPower: 80,
    performance: {
      uptime: 99.2,
      reliability: 95.1,
      responseTime: 123,
      decisionAccuracy: 89.2,
      totalDecisions: 834,
      correctDecisions: 744,
      byzantineBehavior: 0.0,
      consensusParticipation: 96.8
    },
    capabilities: ['Technical Analysis', 'Pattern Recognition'],
    region: 'ap-southeast',
    lastSeen: new Date(Date.now() - 15 * 1000),
    isLeader: false
  }
]

const MOCK_DECISIONS: DistributedDecision[] = [
  {
    id: 'decision-001',
    title: 'Emergency Portfolio Rebalancing',
    description: 'Immediate rebalancing required due to sudden market volatility spike',
    type: 'emergency',
    priority: 'critical',
    status: 'voting',
    proposer: 'node-001',
    participants: ['node-001', 'node-002', 'node-003'],
    votes: [
      {
        nodeId: 'node-001',
        vote: 'yes',
        weight: 0.15,
        confidence: 95,
        reasoning: 'Risk metrics exceed safety thresholds',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        signature: '0x1a2b3c...',
        evidence: { riskScore: 0.85, volatility: 0.35 }
      },
      {
        nodeId: 'node-002',
        vote: 'yes',
        weight: 0.12,
        confidence: 88,
        reasoning: 'Market correlation suggests systemic risk',
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        signature: '0x4d5e6f...'
      }
    ],
    requirements: {
      minParticipants: 3,
      consensusThreshold: 0.67,
      timeoutMinutes: 15,
      requireUnanimity: false,
      allowVeto: true,
      weightedVoting: true,
      byzantineTolerance: 1
    },
    timeline: {
      proposed: new Date(Date.now() - 5 * 60 * 1000),
      votingStarted: new Date(Date.now() - 3 * 60 * 1000)
    }
  },
  {
    id: 'decision-002',
    title: 'Strategy Algorithm Update',
    description: 'Deploy updated momentum trading algorithm with enhanced risk controls',
    type: 'strategy',
    priority: 'medium',
    status: 'consensus',
    proposer: 'node-002',
    participants: ['node-001', 'node-002', 'node-003'],
    votes: [
      {
        nodeId: 'node-001',
        vote: 'yes',
        weight: 0.15,
        confidence: 82,
        reasoning: 'Backtesting shows improved performance',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        signature: '0x7g8h9i...'
      },
      {
        nodeId: 'node-002',
        vote: 'yes',
        weight: 0.12,
        confidence: 91,
        reasoning: 'Algorithm optimization is necessary',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        signature: '0xjk1l2m...'
      },
      {
        nodeId: 'node-003',
        vote: 'yes',
        weight: 0.08,
        confidence: 79,
        reasoning: 'Risk controls are adequate',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        signature: '0xn3o4p5...'
      }
    ],
    requirements: {
      minParticipants: 3,
      consensusThreshold: 0.75,
      timeoutMinutes: 60,
      requireUnanimity: false,
      allowVeto: false,
      weightedVoting: true,
      byzantineTolerance: 1
    },
    timeline: {
      proposed: new Date(Date.now() - 30 * 60 * 1000),
      votingStarted: new Date(Date.now() - 20 * 60 * 1000),
      votingEnded: new Date(Date.now() - 5 * 60 * 1000),
      consensusReached: new Date(Date.now() - 3 * 60 * 1000)
    },
    outcome: {
      result: 'approved',
      finalScore: 0.87,
      participation: 100,
      consensusStrength: 0.92,
      impact: {
        financialImpact: 15000,
        riskImpact: -0.05,
        performanceImpact: 0.08,
        systemImpact: 0.03,
        confidence: 85
      }
    }
  }
]

const MOCK_ALGORITHMS: ConsensusAlgorithm[] = [
  {
    id: 'pbft-001',
    name: 'Practical Byzantine Fault Tolerance',
    type: 'pbft',
    description: 'Classic PBFT with optimizations for trading decisions',
    byzantineTolerance: 33.3,
    scalability: 7,
    finality: 'absolute',
    energyEfficiency: 8,
    isActive: true,
    performance: {
      averageConsensusTime: 2.4,
      throughput: 125,
      faultTolerance: 9,
      networkOverhead: 6,
      accuracy: 96.8,
      scalabilityScore: 7.2
    }
  },
  {
    id: 'avalanche-001',
    name: 'Avalanche Consensus',
    type: 'avalanche',
    description: 'Probabilistic consensus with sub-second finality',
    byzantineTolerance: 20.0,
    scalability: 9,
    finality: 'probabilistic',
    energyEfficiency: 9,
    isActive: false,
    performance: {
      averageConsensusTime: 0.8,
      throughput: 450,
      faultTolerance: 7,
      networkOverhead: 4,
      accuracy: 94.2,
      scalabilityScore: 9.1
    }
  }
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

interface DistributedDecisionMakingSystemProps {
  onDecisionPropose?: (decision: DistributedDecision) => void
  onVoteCast?: (decisionId: string, vote: DecisionVote) => void
  onAlgorithmSwitch?: (algorithmId: string) => void
  className?: string
}

export function DistributedDecisionMakingSystem({
  onDecisionPropose,
  onVoteCast,
  onAlgorithmSwitch,
  className = ''
}: DistributedDecisionMakingSystemProps) {
  const [nodes, setNodes] = useState<DecisionNode[]>(MOCK_NODES)
  const [decisions, setDecisions] = useState<DistributedDecision[]>(MOCK_DECISIONS)
  const [algorithms, setAlgorithms] = useState<ConsensusAlgorithm[]>(MOCK_ALGORITHMS)
  const [selectedDecision, setSelectedDecision] = useState<string>('')
  const [newDecisionTitle, setNewDecisionTitle] = useState('')
  const [newDecisionDescription, setNewDecisionDescription] = useState('')
  const [selectedDecisionType, setSelectedDecisionType] = useState<string>('trading')
  const [selectedPriority, setSelectedPriority] = useState<string>('medium')
  const [isCreatingDecision, setIsCreatingDecision] = useState(false)

  // Calculate system metrics
  const metrics = useMemo<SystemMetrics>(() => {
    const totalNodes = nodes.length
    const activeNodes = nodes.filter(n => n.status === 'active').length
    const faultyNodes = nodes.filter(n => n.status === 'faulty').length
    const byzantineNodes = nodes.filter(n => n.status === 'byzantine').length
    const totalDecisions = decisions.length
    const consensusDecisions = decisions.filter(d => d.status === 'consensus' || d.status === 'executed').length
    const consensusRate = totalDecisions > 0 ? (consensusDecisions / totalDecisions) * 100 : 0
    
    const avgDecisionTime = decisions
      .filter(d => d.timeline.consensusReached)
      .reduce((sum, d) => {
        const start = d.timeline.votingStarted || d.timeline.proposed
        const end = d.timeline.consensusReached!
        return sum + (end.getTime() - start.getTime()) / (1000 * 60) // minutes
      }, 0) / Math.max(1, consensusDecisions)

    const avgNodeReliability = nodes.reduce((sum, n) => sum + n.performance.reliability, 0) / nodes.length
    const byzantineTolerance = Math.floor((activeNodes - 1) / 3) * 100 / activeNodes

    return {
      totalNodes,
      activeNodes,
      faultyNodes,
      byzantineNodes,
      totalDecisions,
      consensusRate,
      averageDecisionTime: avgDecisionTime || 0,
      systemThroughput: 45.2,
      byzantineTolerance,
      networkHealth: avgNodeReliability,
      consensusEfficiency: 87.5,
      conflictResolutionRate: 92.3
    }
  }, [nodes, decisions])

  // Node performance data for visualization
  const nodePerformanceData = useMemo(() => {
    return nodes.map(node => ({
      name: node.name,
      reputation: node.reputation,
      reliability: node.performance.reliability,
      accuracy: node.performance.decisionAccuracy,
      participation: node.performance.consensusParticipation,
      responseTime: node.performance.responseTime,
      weight: node.weight * 100
    }))
  }, [nodes])

  // Decision timeline data
  const decisionTimelineData = useMemo(() => {
    const data = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      data.push({
        time: timestamp.toISOString().slice(11, 16),
        decisions: Math.floor(Math.random() * 8) + 2,
        consensus: Math.floor(Math.random() * 6) + 1,
        conflicts: Math.floor(Math.random() * 2),
        avgTime: Math.random() * 10 + 2
      })
    }
    
    return data
  }, [])

  // Algorithm comparison data
  const algorithmComparisonData = useMemo(() => {
    return algorithms.map(algo => ({
      name: algo.name,
      consensusTime: algo.performance.averageConsensusTime,
      throughput: algo.performance.throughput,
      faultTolerance: algo.performance.faultTolerance,
      accuracy: algo.performance.accuracy,
      scalability: algo.performance.scalabilityScore,
      energyEfficiency: algo.energyEfficiency
    }))
  }, [algorithms])

  // Create new decision
  const createDecision = useCallback(async () => {
    if (!newDecisionTitle.trim() || !newDecisionDescription.trim()) return

    setIsCreatingDecision(true)

    try {
      const newDecision: DistributedDecision = {
        id: `decision-${Date.now()}`,
        title: newDecisionTitle,
        description: newDecisionDescription,
        type: selectedDecisionType as any,
        priority: selectedPriority as any,
        status: 'proposed',
        proposer: 'user-console',
        participants: nodes.filter(n => n.status === 'active').map(n => n.id),
        votes: [],
        requirements: {
          minParticipants: Math.max(3, Math.floor(nodes.length * 0.6)),
          consensusThreshold: 0.67,
          timeoutMinutes: selectedPriority === 'critical' ? 15 : selectedPriority === 'high' ? 30 : 60,
          requireUnanimity: false,
          allowVeto: true,
          weightedVoting: true,
          byzantineTolerance: Math.floor((nodes.length - 1) / 3)
        },
        timeline: {
          proposed: new Date()
        }
      }

      setDecisions(prev => [newDecision, ...prev])
      setNewDecisionTitle('')
      setNewDecisionDescription('')

      // Simulate decision progression
      setTimeout(() => {
        setDecisions(prev => prev.map(d => 
          d.id === newDecision.id 
            ? { ...d, status: 'voting', timeline: { ...d.timeline, votingStarted: new Date() } }
            : d
        ))
      }, 2000)

      if (onDecisionPropose) {
        onDecisionPropose(newDecision)
      }
    } catch (error) {
      console.error('Decision creation failed:', error)
    } finally {
      setIsCreatingDecision(false)
    }
  }, [newDecisionTitle, newDecisionDescription, selectedDecisionType, selectedPriority, nodes, onDecisionPropose])

  // Cast vote
  const castVote = useCallback((decisionId: string, voteValue: 'yes' | 'no' | 'abstain') => {
    const vote: DecisionVote = {
      nodeId: 'user-console',
      vote: voteValue,
      weight: 0.1,
      confidence: 85,
      reasoning: 'Manual vote from console',
      timestamp: new Date(),
      signature: `0x${Math.random().toString(16).substr(2, 8)}...`
    }

    setDecisions(prev => prev.map(decision => 
      decision.id === decisionId 
        ? { 
            ...decision, 
            votes: [...decision.votes.filter(v => v.nodeId !== 'user-console'), vote]
          }
        : decision
    ))

    if (onVoteCast) {
      onVoteCast(decisionId, vote)
    }
  }, [onVoteCast])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'consensus': case 'executed': case 'approved':
        return 'text-green-600 bg-green-100'
      case 'voting': case 'proposed':
        return 'text-blue-600 bg-blue-100'
      case 'faulty': case 'failed': case 'rejected':
        return 'text-red-600 bg-red-100'
      case 'byzantine': case 'cancelled':
        return 'text-orange-600 bg-orange-100'
      case 'inactive': case 'timeout':
        return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-6 w-6 text-green-600" />
                Distributed Decision Making System
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {metrics.activeNodes}/{metrics.totalNodes} Nodes Active
                </Badge>
              </CardTitle>
              <CardDescription>
                Byzantine fault-tolerant consensus for autonomous trading decisions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                PBFT Active
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={metrics.totalDecisions} />
            </div>
            <div className="text-sm text-muted-foreground">Total Decisions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={metrics.consensusRate} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Consensus Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              <AnimatedCounter value={metrics.averageDecisionTime} precision={1} suffix="m" />
            </div>
            <div className="text-sm text-muted-foreground">Avg Decision Time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedCounter value={metrics.byzantineTolerance} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Byzantine Tolerance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              <AnimatedCounter value={metrics.networkHealth} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Network Health</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">
              <AnimatedCounter value={metrics.consensusEfficiency} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Efficiency</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="decisions" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="consensus">Consensus</TabsTrigger>
          <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Decisions Tab */}
        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Propose New Decision</CardTitle>
              <CardDescription>
                Submit a new decision for distributed consensus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="decisionType">Decision Type</Label>
                    <Select value={selectedDecisionType} onValueChange={setSelectedDecisionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="risk">Risk Management</SelectItem>
                        <SelectItem value="allocation">Portfolio Allocation</SelectItem>
                        <SelectItem value="strategy">Strategy Update</SelectItem>
                        <SelectItem value="emergency">Emergency Action</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Decision Title</Label>
                  <Input
                    id="title"
                    value={newDecisionTitle}
                    onChange={(e) => setNewDecisionTitle(e.target.value)}
                    placeholder="Enter decision title..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newDecisionDescription}
                    onChange={(e) => setNewDecisionDescription(e.target.value)}
                    placeholder="Describe the decision and its implications..."
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={createDecision} 
                  disabled={!newDecisionTitle.trim() || !newDecisionDescription.trim() || isCreatingDecision}
                >
                  {isCreatingDecision ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Vote className="h-4 w-4 mr-2" />
                      Propose Decision
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Decisions</CardTitle>
              <CardDescription>
                Decisions currently in voting or consensus phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {decisions.map(decision => (
                  <div key={decision.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {decision.type}
                        </Badge>
                        <Badge className={getPriorityColor(decision.priority)}>
                          {decision.priority}
                        </Badge>
                        <span className="font-medium">{decision.title}</span>
                      </div>
                      <Badge className={getStatusColor(decision.status)}>
                        {decision.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {decision.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm text-muted-foreground">Proposer</div>
                        <div className="font-medium text-xs">{decision.proposer}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm text-muted-foreground">Participants</div>
                        <div className="font-medium">{decision.participants.length}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm text-muted-foreground">Votes</div>
                        <div className="font-medium">{decision.votes.length}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm text-muted-foreground">Threshold</div>
                        <div className="font-medium">{(decision.requirements.consensusThreshold * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    {decision.status === 'voting' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => castVote(decision.id, 'yes')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => castVote(decision.id, 'no')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => castVote(decision.id, 'abstain')}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Abstain
                        </Button>
                      </div>
                    )}

                    {decision.votes.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium mb-2">Votes Cast:</div>
                        <div className="space-y-1">
                          {decision.votes.map((vote, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{vote.nodeId}</span>
                              <div className="flex items-center gap-2">
                                <Badge className={vote.vote === 'yes' ? 'bg-green-100 text-green-800' : vote.vote === 'no' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                                  {vote.vote}
                                </Badge>
                                <span className="text-muted-foreground">{vote.confidence}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {decision.outcome && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium mb-2">Outcome:</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Result: <span className="font-medium">{decision.outcome.result}</span></div>
                          <div>Final Score: <span className="font-medium">{(decision.outcome.finalScore * 100).toFixed(1)}%</span></div>
                          <div>Participation: <span className="font-medium">{decision.outcome.participation}%</span></div>
                          <div>Consensus Strength: <span className="font-medium">{(decision.outcome.consensusStrength * 100).toFixed(1)}%</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nodes Tab */}
        <TabsContent value="nodes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map(node => (
              <Card key={node.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">{node.name}</CardTitle>
                      {node.isLeader && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <Badge className={getStatusColor(node.status)}>
                      {node.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Type</div>
                        <div className="font-medium capitalize">{node.type}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Region</div>
                        <div className="font-medium">{node.region}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Weight</div>
                        <div className="font-medium">{(node.weight * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Voting Power</div>
                        <div className="font-medium">{node.votingPower}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Reputation</div>
                        <div className="font-medium">{node.reputation.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Uptime</div>
                        <div className="font-medium">{node.performance.uptime.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Performance</div>
                      <div className="space-y-1">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Reliability</span>
                            <span>{node.performance.reliability.toFixed(1)}%</span>
                          </div>
                          <Progress value={node.performance.reliability} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Accuracy</span>
                            <span>{node.performance.decisionAccuracy.toFixed(1)}%</span>
                          </div>
                          <Progress value={node.performance.decisionAccuracy} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Participation</span>
                            <span>{node.performance.consensusParticipation.toFixed(1)}%</span>
                          </div>
                          <Progress value={node.performance.consensusParticipation} className="h-1" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Capabilities</div>
                      <div className="flex flex-wrap gap-1">
                        {node.capabilities.slice(0, 2).map(capability => (
                          <Badge key={capability} variant="secondary" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                        {node.capabilities.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{node.capabilities.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Node Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={nodePerformanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Reputation"
                      dataKey="reputation"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Reliability"
                      dataKey="reliability"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Accuracy"
                      dataKey="accuracy"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consensus Tab */}
        <TabsContent value="consensus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consensus Process Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {decisions.filter(d => d.status === 'voting').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Voting</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {decisions.filter(d => d.status === 'consensus').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Reached Consensus</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {decisions.filter(d => d.status === 'executed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Executed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Decision Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={decisionTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="decisions"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      stroke="#3B82F6"
                      name="Total Decisions"
                    />
                    <Bar dataKey="consensus" fill="#10B981" name="Consensus Reached" />
                    <Line
                      type="monotone"
                      dataKey="avgTime"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Avg Time (min)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Byzantine Fault Tolerance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Current Tolerance</span>
                    <span>{metrics.byzantineTolerance.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.byzantineTolerance} className="h-3" />
                </div>
                <div className="text-sm text-muted-foreground">
                  System can tolerate up to {Math.floor((metrics.activeNodes - 1) / 3)} Byzantine nodes 
                  out of {metrics.activeNodes} active nodes.
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Faulty Nodes</div>
                    <div className="font-medium">{metrics.faultyNodes}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Byzantine Nodes</div>
                    <div className="font-medium">{metrics.byzantineNodes}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Algorithms Tab */}
        <TabsContent value="algorithms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {algorithms.map(algorithm => (
              <Card key={algorithm.id} className={algorithm.isActive ? 'border-green-200 bg-green-50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-purple-600" />
                      {algorithm.name}
                    </CardTitle>
                    <Badge className={algorithm.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {algorithm.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {algorithm.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Byzantine Tolerance</div>
                        <div className="font-medium">{algorithm.byzantineTolerance.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Scalability</div>
                        <div className="font-medium">{algorithm.scalability}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Energy Efficiency</div>
                        <div className="font-medium">{algorithm.energyEfficiency}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Finality</div>
                        <div className="font-medium capitalize">{algorithm.finality}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Performance Metrics</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Consensus Time: {algorithm.performance.averageConsensusTime.toFixed(1)}s</span>
                          <span>Throughput: {algorithm.performance.throughput} ops/s</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Accuracy: {algorithm.performance.accuracy.toFixed(1)}%</span>
                          <span>Fault Tolerance: {algorithm.performance.faultTolerance}/10</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={algorithm.isActive ? "outline" : "default"}
                      className="w-full"
                      onClick={() => {
                        if (!algorithm.isActive && onAlgorithmSwitch) {
                          onAlgorithmSwitch(algorithm.id)
                        }
                      }}
                      disabled={algorithm.isActive}
                    >
                      {algorithm.isActive ? 'Currently Active' : 'Switch to This Algorithm'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Algorithm Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={algorithmComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="throughput" fill="#3B82F6" name="Throughput" />
                    <Bar dataKey="accuracy" fill="#10B981" name="Accuracy" />
                    <Bar dataKey="faultTolerance" fill="#F59E0B" name="Fault Tolerance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold">{metrics.systemThroughput.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Decisions/Hour</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold">{metrics.conflictResolutionRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Conflict Resolution</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Consensus Efficiency</span>
                      <span>{metrics.consensusEfficiency.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.consensusEfficiency} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Network Health</span>
                      <span>{metrics.networkHealth.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.networkHealth} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Decision Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Trading', value: decisions.filter(d => d.type === 'trading').length },
                          { name: 'Risk', value: decisions.filter(d => d.type === 'risk').length },
                          { name: 'Strategy', value: decisions.filter(d => d.type === 'strategy').length },
                          { name: 'Emergency', value: decisions.filter(d => d.type === 'emergency').length }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consensus Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="byzantineDetection">Byzantine Detection</Label>
                  <Switch id="byzantineDetection" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoFailover">Auto Failover</Label>
                  <Switch id="autoFailover" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weightedVoting">Weighted Voting</Label>
                  <Switch id="weightedVoting" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="conflictResolution">Conflict Resolution</Label>
                  <Switch id="conflictResolution" defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consensusThreshold">Default Consensus Threshold (%)</Label>
                <Input
                  id="consensusThreshold"
                  type="number"
                  step="1"
                  min="51"
                  max="100"
                  defaultValue="67"
                  placeholder="Consensus threshold percentage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="decisionTimeout">Decision Timeout (minutes)</Label>
                <Input
                  id="decisionTimeout"
                  type="number"
                  min="5"
                  max="1440"
                  defaultValue="60"
                  placeholder="Maximum decision time"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="byzantineTolerance">Byzantine Tolerance Threshold (%)</Label>
                <Input
                  id="byzantineTolerance"
                  type="number"
                  step="0.1"
                  min="0"
                  max="33.3"
                  defaultValue="33.3"
                  placeholder="Maximum Byzantine node percentage"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DistributedDecisionMakingSystem