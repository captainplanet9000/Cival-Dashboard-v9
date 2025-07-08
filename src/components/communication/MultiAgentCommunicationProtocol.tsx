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
  MessageSquare, Network, Radio, Send, Users, Bot, Brain,
  Activity, TrendingUp, Zap, Clock, AlertTriangle, CheckCircle2,
  Settings, RefreshCw, Eye, Play, Pause, StopCircle,
  Globe, Shield, Key, Lock, Layers, GitBranch, Server,
  ArrowRight, ArrowLeft, Repeat, Timer, Target, Award
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { AnimatedPrice, AnimatedCounter } from '@/components/ui/animated-components'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Multi-Agent Communication Protocol Component
 * Advanced communication system for coordinating multiple trading agents
 * Features message routing, consensus protocols, and distributed coordination
 */

interface CommunicationMessage {
  id: string
  senderId: string
  receiverId: string | 'broadcast'
  type: 'trade_signal' | 'market_data' | 'coordination' | 'heartbeat' | 'consensus' | 'alert'
  priority: 'low' | 'medium' | 'high' | 'critical'
  payload: any
  timestamp: Date
  status: 'pending' | 'sent' | 'delivered' | 'acknowledged' | 'failed'
  retryCount: number
  acknowledgments: string[]
  encryptionLevel: 'none' | 'basic' | 'advanced'
  routingPath: string[]
  latency: number
}

interface CommunicationChannel {
  id: string
  name: string
  type: 'direct' | 'broadcast' | 'multicast' | 'mesh'
  participants: string[]
  status: 'active' | 'idle' | 'congested' | 'error'
  messageCount: number
  throughput: number
  latency: number
  reliability: number
  encryption: boolean
  queueSize: number
  maxQueueSize: number
  createdAt: Date
  lastActivity: Date
}

interface ConsensusProtocol {
  id: string
  name: string
  type: 'raft' | 'pbft' | 'pos' | 'custom'
  participants: string[]
  status: 'active' | 'voting' | 'agreed' | 'failed'
  proposition: any
  votes: ConsensusVote[]
  threshold: number
  currentRound: number
  maxRounds: number
  startTime: Date
  endTime?: Date
  result?: any
}

interface ConsensusVote {
  agentId: string
  vote: 'yes' | 'no' | 'abstain'
  confidence: number
  reasoning: string
  timestamp: Date
}

interface NetworkTopology {
  nodes: NetworkNode[]
  connections: NetworkConnection[]
  clusters: NetworkCluster[]
  totalNodes: number
  totalConnections: number
  averageLatency: number
  networkHealth: number
  redundancyLevel: number
}

interface NetworkNode {
  id: string
  type: 'agent' | 'coordinator' | 'gateway' | 'monitor'
  status: 'online' | 'offline' | 'degraded'
  connections: string[]
  load: number
  capacity: number
  latency: number
  reliability: number
  position: { x: number; y: number }
}

interface NetworkConnection {
  id: string
  sourceId: string
  targetId: string
  status: 'active' | 'inactive' | 'congested'
  bandwidth: number
  utilization: number
  latency: number
  packetLoss: number
  lastUpdate: Date
}

interface NetworkCluster {
  id: string
  name: string
  nodeIds: string[]
  leader: string
  status: 'stable' | 'electing' | 'split'
  performance: number
}

interface CommunicationMetrics {
  totalMessages: number
  messagesPerSecond: number
  averageLatency: number
  deliveryRate: number
  errorRate: number
  bandwidth: number
  activeChannels: number
  activeConsensus: number
  networkHealth: number
  redundancyScore: number
}

const MOCK_MESSAGES: CommunicationMessage[] = [
  {
    id: 'msg-001',
    senderId: 'agent-001',
    receiverId: 'agent-002',
    type: 'trade_signal',
    priority: 'high',
    payload: {
      symbol: 'BTC/USD',
      action: 'BUY',
      confidence: 85,
      price: 45250,
      reason: 'Technical breakout pattern detected'
    },
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    status: 'acknowledged',
    retryCount: 0,
    acknowledgments: ['agent-002'],
    encryptionLevel: 'advanced',
    routingPath: ['agent-001', 'coordinator-01', 'agent-002'],
    latency: 12
  },
  {
    id: 'msg-002',
    senderId: 'coordinator-01',
    receiverId: 'broadcast',
    type: 'market_data',
    priority: 'medium',
    payload: {
      timestamp: new Date(),
      data: {
        'BTC/USD': { price: 45250, volume: 1250000, change: 2.3 },
        'ETH/USD': { price: 2845, volume: 850000, change: 1.8 }
      }
    },
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    status: 'delivered',
    retryCount: 0,
    acknowledgments: ['agent-001', 'agent-002', 'agent-003'],
    encryptionLevel: 'basic',
    routingPath: ['coordinator-01'],
    latency: 8
  },
  {
    id: 'msg-003',
    senderId: 'agent-003',
    receiverId: 'coordinator-01',
    type: 'coordination',
    priority: 'critical',
    payload: {
      type: 'risk_alert',
      message: 'Portfolio exposure exceeding risk limits',
      currentExposure: 0.85,
      maxExposure: 0.8,
      recommendations: ['Reduce position sizes', 'Hedge exposure']
    },
    timestamp: new Date(Date.now() - 30 * 1000),
    status: 'sent',
    retryCount: 1,
    acknowledgments: [],
    encryptionLevel: 'advanced',
    routingPath: ['agent-003', 'coordinator-01'],
    latency: 15
  }
]

const MOCK_CHANNELS: CommunicationChannel[] = [
  {
    id: 'channel-001',
    name: 'Trading Signals',
    type: 'multicast',
    participants: ['agent-001', 'agent-002', 'agent-003'],
    status: 'active',
    messageCount: 1247,
    throughput: 25.3,
    latency: 8.5,
    reliability: 99.2,
    encryption: true,
    queueSize: 12,
    maxQueueSize: 1000,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 30 * 1000)
  },
  {
    id: 'channel-002',
    name: 'Market Data Feed',
    type: 'broadcast',
    participants: ['coordinator-01', 'agent-001', 'agent-002', 'agent-003', 'agent-004'],
    status: 'active',
    messageCount: 8642,
    throughput: 45.8,
    latency: 5.2,
    reliability: 99.8,
    encryption: false,
    queueSize: 5,
    maxQueueSize: 500,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 10 * 1000)
  },
  {
    id: 'channel-003',
    name: 'Risk Management',
    type: 'direct',
    participants: ['coordinator-01', 'risk-manager-01'],
    status: 'active',
    messageCount: 342,
    throughput: 8.7,
    latency: 12.1,
    reliability: 98.5,
    encryption: true,
    queueSize: 3,
    maxQueueSize: 100,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 2 * 60 * 1000)
  }
]

const MOCK_CONSENSUS: ConsensusProtocol[] = [
  {
    id: 'consensus-001',
    name: 'Portfolio Rebalancing Decision',
    type: 'raft',
    participants: ['agent-001', 'agent-002', 'agent-003', 'coordinator-01'],
    status: 'voting',
    proposition: {
      type: 'rebalance',
      target: {
        'BTC': 0.4,
        'ETH': 0.3,
        'USDC': 0.3
      },
      reason: 'Market volatility increased, reducing risk exposure'
    },
    votes: [
      {
        agentId: 'agent-001',
        vote: 'yes',
        confidence: 85,
        reasoning: 'Agree with volatility assessment',
        timestamp: new Date(Date.now() - 2 * 60 * 1000)
      },
      {
        agentId: 'agent-002',
        vote: 'yes',
        confidence: 78,
        reasoning: 'Conservative approach is prudent',
        timestamp: new Date(Date.now() - 1 * 60 * 1000)
      }
    ],
    threshold: 0.75,
    currentRound: 1,
    maxRounds: 3,
    startTime: new Date(Date.now() - 5 * 60 * 1000)
  }
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

interface MultiAgentCommunicationProtocolProps {
  onMessageSend?: (message: CommunicationMessage) => void
  onChannelCreate?: (channel: CommunicationChannel) => void
  onConsensusStart?: (consensus: ConsensusProtocol) => void
  className?: string
}

export function MultiAgentCommunicationProtocol({
  onMessageSend,
  onChannelCreate,
  onConsensusStart,
  className = ''
}: MultiAgentCommunicationProtocolProps) {
  const [messages, setMessages] = useState<CommunicationMessage[]>(MOCK_MESSAGES)
  const [channels, setChannels] = useState<CommunicationChannel[]>(MOCK_CHANNELS)
  const [consensusProtocols, setConsensusProtocols] = useState<ConsensusProtocol[]>(MOCK_CONSENSUS)
  const [selectedChannel, setSelectedChannel] = useState<string>('channel-001')
  const [newMessage, setNewMessage] = useState('')
  const [selectedMessageType, setSelectedMessageType] = useState<string>('trade_signal')
  const [selectedPriority, setSelectedPriority] = useState<string>('medium')
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)

  // Calculate communication metrics
  const metrics = useMemo<CommunicationMetrics>(() => {
    const totalMessages = messages.length
    const messagesPerSecond = 12.5 // Mock calculation
    const averageLatency = messages.reduce((sum, msg) => sum + msg.latency, 0) / messages.length
    const deliveredMessages = messages.filter(msg => msg.status === 'delivered' || msg.status === 'acknowledged').length
    const deliveryRate = (deliveredMessages / totalMessages) * 100
    const errorRate = (messages.filter(msg => msg.status === 'failed').length / totalMessages) * 100
    const activeChannels = channels.filter(ch => ch.status === 'active').length
    const activeConsensus = consensusProtocols.filter(cp => cp.status === 'voting' || cp.status === 'active').length

    return {
      totalMessages,
      messagesPerSecond,
      averageLatency,
      deliveryRate,
      errorRate,
      bandwidth: 1250.5,
      activeChannels,
      activeConsensus,
      networkHealth: 94.5,
      redundancyScore: 87.2
    }
  }, [messages, channels, consensusProtocols])

  // Message flow data for visualization
  const messageFlowData = useMemo(() => {
    const data = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      data.push({
        time: timestamp.toISOString().slice(11, 16),
        messages: Math.floor(Math.random() * 50) + 20,
        latency: Math.random() * 20 + 5,
        throughput: Math.random() * 100 + 50,
        errors: Math.floor(Math.random() * 5)
      })
    }
    
    return data
  }, [])

  // Channel performance data
  const channelPerformanceData = useMemo(() => {
    return channels.map(channel => ({
      name: channel.name,
      throughput: channel.throughput,
      latency: channel.latency,
      reliability: channel.reliability,
      messageCount: channel.messageCount,
      queueUtilization: (channel.queueSize / channel.maxQueueSize) * 100
    }))
  }, [channels])

  // Network topology data (simplified)
  const networkTopologyData = useMemo(() => {
    return [
      { name: 'Agents', value: 8, type: 'agent' },
      { name: 'Coordinators', value: 2, type: 'coordinator' },
      { name: 'Gateways', value: 1, type: 'gateway' },
      { name: 'Monitors', value: 1, type: 'monitor' }
    ]
  }, [])

  // Message type distribution
  const messageTypeDistribution = useMemo(() => {
    const distribution = messages.reduce((acc, message) => {
      acc[message.type] = (acc[message.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(distribution).map(([type, count], index) => ({
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: COLORS[index % COLORS.length]
    }))
  }, [messages])

  // Send message function
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) return

    const message: CommunicationMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'user-console',
      receiverId: selectedChannel === 'broadcast' ? 'broadcast' : 'agent-001',
      type: selectedMessageType as any,
      priority: selectedPriority as any,
      payload: {
        content: newMessage,
        timestamp: new Date()
      },
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0,
      acknowledgments: [],
      encryptionLevel: encryptionEnabled ? 'advanced' : 'none',
      routingPath: ['user-console'],
      latency: 0
    }

    setMessages(prev => [message, ...prev])
    setNewMessage('')

    // Simulate message processing
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, status: 'sent', latency: Math.random() * 20 + 5 }
          : msg
      ))
    }, 1000)

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, status: 'delivered', acknowledgments: ['agent-001'] }
          : msg
      ))
    }, 2000)

    if (onMessageSend) {
      onMessageSend(message)
    }
  }, [newMessage, selectedChannel, selectedMessageType, selectedPriority, encryptionEnabled, onMessageSend])

  // Start consensus protocol
  const startConsensus = useCallback((proposition: any) => {
    const consensus: ConsensusProtocol = {
      id: `consensus-${Date.now()}`,
      name: 'Manual Consensus Request',
      type: 'raft',
      participants: ['agent-001', 'agent-002', 'agent-003'],
      status: 'voting',
      proposition,
      votes: [],
      threshold: 0.67,
      currentRound: 1,
      maxRounds: 3,
      startTime: new Date()
    }

    setConsensusProtocols(prev => [consensus, ...prev])

    if (onConsensusStart) {
      onConsensusStart(consensus)
    }
  }, [onConsensusStart])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'online': case 'delivered': case 'acknowledged': 
        return 'text-green-600 bg-green-100'
      case 'pending': case 'sent': case 'voting': case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed': case 'error': case 'offline':
        return 'text-red-600 bg-red-100'
      case 'idle': case 'congested':
        return 'text-blue-600 bg-blue-100'
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
                <MessageSquare className="h-6 w-6 text-blue-600" />
                Multi-Agent Communication Protocol
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {metrics.activeChannels} Active Channels
                </Badge>
              </CardTitle>
              <CardDescription>
                Secure, distributed communication network for agent coordination
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="encryption" className="text-sm">Encryption</Label>
                <Switch
                  id="encryption"
                  checked={encryptionEnabled}
                  onCheckedChange={setEncryptionEnabled}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={metrics.totalMessages} />
            </div>
            <div className="text-sm text-muted-foreground">Total Messages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={metrics.messagesPerSecond} precision={1} />
            </div>
            <div className="text-sm text-muted-foreground">Msgs/Second</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              <AnimatedCounter value={metrics.averageLatency} precision={1} suffix="ms" />
            </div>
            <div className="text-sm text-muted-foreground">Avg Latency</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedCounter value={metrics.deliveryRate} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Delivery Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">
              <AnimatedCounter value={metrics.networkHealth} precision={1} suffix="%" />
            </div>
            <div className="text-sm text-muted-foreground">Network Health</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="consensus">Consensus</TabsTrigger>
          <TabsTrigger value="topology">Network</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>
                Send a message through the communication network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="messageType">Message Type</Label>
                    <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trade_signal">Trade Signal</SelectItem>
                        <SelectItem value="market_data">Market Data</SelectItem>
                        <SelectItem value="coordination">Coordination</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="heartbeat">Heartbeat</SelectItem>
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
                  <div className="space-y-2">
                    <Label htmlFor="channel">Target Channel</Label>
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broadcast">Broadcast</SelectItem>
                        {channels.map(channel => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message Content</Label>
                  <Textarea
                    id="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter your message..."
                    rows={3}
                  />
                </div>
                
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>
                Recent communication messages across the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map(message => (
                  <div key={message.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {message.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(message.priority)}>
                          {message.priority}
                        </Badge>
                        <span className="text-sm font-medium">
                          {message.senderId} → {message.receiverId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(message.status)}>
                          {message.status}
                        </Badge>
                        {message.encryptionLevel !== 'none' && (
                          <Lock className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      {typeof message.payload === 'object' 
                        ? JSON.stringify(message.payload, null, 2)
                        : message.payload
                      }
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      <div className="flex items-center gap-4">
                        <span>Latency: {message.latency}ms</span>
                        <span>Retries: {message.retryCount}</span>
                        <span>Acks: {message.acknowledgments.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(channel => (
              <Card key={channel.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">{channel.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(channel.status)}>
                      {channel.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Type</div>
                        <div className="font-medium capitalize">{channel.type}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Participants</div>
                        <div className="font-medium">{channel.participants.length}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Messages</div>
                        <div className="font-medium">{channel.messageCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Throughput</div>
                        <div className="font-medium">{channel.throughput.toFixed(1)}/s</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Latency</div>
                        <div className="font-medium">{channel.latency.toFixed(1)}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Reliability</div>
                        <div className="font-medium">{channel.reliability.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Queue Usage</div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{channel.queueSize}</span>
                        <span>{channel.maxQueueSize}</span>
                      </div>
                      <Progress 
                        value={(channel.queueSize / channel.maxQueueSize) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {channel.encryption && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Encrypted
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {channel.participants.length} participants
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={channelPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="throughput" fill="#3B82F6" name="Throughput" />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Latency (ms)"
                    />
                    <Line
                      type="monotone"
                      dataKey="reliability"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Reliability (%)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consensus Tab */}
        <TabsContent value="consensus" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Consensus Protocols</CardTitle>
                  <CardDescription>
                    Distributed decision-making processes
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => startConsensus({
                    type: 'manual_decision',
                    question: 'Should we increase position sizes?',
                    options: ['yes', 'no']
                  })}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Consensus
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consensusProtocols.map(consensus => (
                  <div key={consensus.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-medium">{consensus.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Round {consensus.currentRound}/{consensus.maxRounds}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(consensus.status)}>
                        {consensus.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-1">Proposition:</div>
                        <div className="text-sm text-muted-foreground p-2 bg-gray-50 rounded">
                          {JSON.stringify(consensus.proposition, null, 2)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Votes ({consensus.votes.length}/{consensus.participants.length}):</div>
                        <div className="space-y-2">
                          {consensus.votes.map((vote, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{vote.agentId}</span>
                              <div className="flex items-center gap-2">
                                <Badge className={vote.vote === 'yes' ? 'bg-green-100 text-green-800' : vote.vote === 'no' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                                  {vote.vote}
                                </Badge>
                                <span className="text-muted-foreground">{vote.confidence}%</span>
                              </div>
                            </div>
                          ))}
                          {consensus.participants.filter(p => !consensus.votes.find(v => v.agentId === p)).map(participant => (
                            <div key={participant} className="flex items-center justify-between text-sm">
                              <span>{participant}</span>
                              <Badge variant="outline">Pending</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Threshold: {(consensus.threshold * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Started: {consensus.startTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Topology Tab */}
        <TabsContent value="topology" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Network Topology</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={networkTopologyData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {networkTopologyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Health</span>
                      <span>{metrics.networkHealth.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.networkHealth} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Redundancy Score</span>
                      <span>{metrics.redundancyScore.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.redundancyScore} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Bandwidth Utilization</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Connection Stability</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Node Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'agent-001', type: 'agent', status: 'online', load: 65 },
                  { id: 'agent-002', type: 'agent', status: 'online', load: 45 },
                  { id: 'agent-003', type: 'agent', status: 'online', load: 78 },
                  { id: 'coordinator-01', type: 'coordinator', status: 'online', load: 32 },
                  { id: 'gateway-01', type: 'gateway', status: 'online', load: 25 },
                  { id: 'monitor-01', type: 'monitor', status: 'online', load: 18 }
                ].map(node => (
                  <div key={node.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          node.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-sm">{node.id}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {node.type}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Load</span>
                        <span>{node.load}%</span>
                      </div>
                      <Progress value={node.load} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Flow Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={messageFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      stroke="#3B82F6"
                      name="Messages"
                    />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Latency (ms)"
                    />
                    <Bar dataKey="errors" fill="#EF4444" name="Errors" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Message Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={messageTypeDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {messageTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold">{metrics.bandwidth.toFixed(1)} KB/s</div>
                      <div className="text-sm text-muted-foreground">Bandwidth</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold">{metrics.errorRate.toFixed(2)}%</div>
                      <div className="text-sm text-muted-foreground">Error Rate</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold">{metrics.activeConsensus}</div>
                      <div className="text-sm text-muted-foreground">Active Consensus</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-semibold">{metrics.redundancyScore.toFixed(0)}%</div>
                      <div className="text-sm text-muted-foreground">Redundancy</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="encryptionToggle">Default Encryption</Label>
                  <Switch
                    id="encryptionToggle"
                    checked={encryptionEnabled}
                    onCheckedChange={setEncryptionEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="messageRetry">Message Retry</Label>
                  <Switch id="messageRetry" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="heartbeat">Heartbeat Monitoring</Label>
                  <Switch id="heartbeat" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="loadBalancing">Load Balancing</Label>
                  <Switch id="loadBalancing" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="redundancy">Redundant Routing</Label>
                  <Switch id="redundancy" defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRetries">Max Retry Attempts</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  defaultValue="3"
                  placeholder="Maximum retry attempts"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Message Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  defaultValue="5000"
                  placeholder="Message timeout"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="queueSize">Max Queue Size</Label>
                <Input
                  id="queueSize"
                  type="number"
                  defaultValue="1000"
                  placeholder="Maximum queue size"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MultiAgentCommunicationProtocol