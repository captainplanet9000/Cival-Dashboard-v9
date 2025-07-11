'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MessageCircle, Send, Users, Clock, AlertCircle, CheckCircle, 
  Bot, Brain, TrendingUp, Shield, Zap, Target, Volume2, VolumeX,
  Search, Filter, MoreHorizontal, Reply, Forward, Archive
} from 'lucide-react'

// Types matching the backend service
interface AgentMessage {
  message_id: string
  conversation_id: string
  from_agent_id: string
  to_agent_id?: string
  message_type: 'market_insight' | 'trading_opportunity' | 'risk_alert' | 'coordination_request' | 'decision_vote' | 'status_update' | 'resource_request' | 'performance_share'
  priority: 'low' | 'medium' | 'high' | 'critical'
  subject: string
  content: string
  metadata: any
  timestamp: string
  read: boolean
  processed: boolean
  response_required: boolean
  expires_at?: string
}

interface AgentConversation {
  conversation_id: string
  participants: string[]
  topic: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  created_at: string
  updated_at: string
  message_count: number
  last_message_id?: string
  metadata?: any
}

interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'paused' | 'stopped'
  lastSeen: string
  capabilities: string[]
}

export default function AgentCommunicationPanel() {
  const [activeTab, setActiveTab] = useState('conversations')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [conversations, setConversations] = useState<AgentConversation[]>([])
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [currentAgent, setCurrentAgent] = useState<string>('marcus_momentum')
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [messageSubject, setMessageSubject] = useState('')
  const [messageType, setMessageType] = useState<string>('status_update')
  const [recipientAgent, setRecipientAgent] = useState<string>('')
  const [priority, setPriority] = useState<string>('medium')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showNotifications, setShowNotifications] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock data initialization
  useEffect(() => {
    const mockAgents: Agent[] = [
      {
        id: 'marcus_momentum',
        name: 'Marcus Momentum',
        type: 'Trend Following',
        status: 'active',
        lastSeen: '2 minutes ago',
        capabilities: ['trend_analysis', 'momentum_trading', 'risk_assessment']
      },
      {
        id: 'alex_arbitrage',
        name: 'Alex Arbitrage',
        type: 'Cross-Exchange',
        status: 'active',
        lastSeen: '30 seconds ago',
        capabilities: ['arbitrage_detection', 'cross_exchange_trading', 'price_monitoring']
      },
      {
        id: 'sophia_reversion',
        name: 'Sophia Reversion',
        type: 'Mean Reversion',
        status: 'paused',
        lastSeen: '5 minutes ago',
        capabilities: ['mean_reversion', 'statistical_analysis', 'market_timing']
      },
      {
        id: 'riley_risk',
        name: 'Riley Risk',
        type: 'Risk Manager',
        status: 'active',
        lastSeen: '1 minute ago',
        capabilities: ['risk_monitoring', 'portfolio_analysis', 'alert_management']
      }
    ]

    const mockConversations: AgentConversation[] = [
      {
        conversation_id: 'conv-1',
        participants: ['marcus_momentum', 'alex_arbitrage'],
        topic: 'BTC/USD Trading Opportunity',
        status: 'active',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 120000).toISOString(),
        message_count: 8,
        last_message_id: 'msg-8'
      },
      {
        conversation_id: 'conv-2',
        participants: ['riley_risk', 'marcus_momentum', 'alex_arbitrage'],
        topic: 'Risk Assessment: High Volatility Alert',
        status: 'active',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 300000).toISOString(),
        message_count: 5,
        last_message_id: 'msg-5'
      },
      {
        conversation_id: 'conv-3',
        participants: ['sophia_reversion', 'alex_arbitrage'],
        topic: 'Consensus: Position Sizing Strategy',
        status: 'paused',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        message_count: 12,
        last_message_id: 'msg-12'
      }
    ]

    const mockMessages: AgentMessage[] = [
      {
        message_id: 'msg-1',
        conversation_id: 'conv-1',
        from_agent_id: 'marcus_momentum',
        to_agent_id: 'alex_arbitrage',
        message_type: 'market_insight',
        priority: 'high',
        subject: 'BTC/USD Breakout Pattern',
        content: 'I\'ve detected a strong bullish breakout pattern in BTC/USD. RSI shows momentum building, and volume is increasing. This could be an excellent arbitrage opportunity across exchanges.',
        metadata: { symbol: 'BTC/USD', confidence: 0.85 },
        timestamp: new Date(Date.now() - 120000).toISOString(),
        read: false,
        processed: false,
        response_required: true
      },
      {
        message_id: 'msg-2',
        conversation_id: 'conv-1',
        from_agent_id: 'alex_arbitrage',
        to_agent_id: 'marcus_momentum',
        message_type: 'trading_opportunity',
        priority: 'high',
        subject: 'Re: BTC/USD Breakout Pattern',
        content: 'Confirmed! I see a 0.12% spread between Binance and Coinbase. Current spread is $45 per BTC. Executing arbitrage now with 2 BTC position.',
        metadata: { spread: 0.0012, exchanges: ['binance', 'coinbase'] },
        timestamp: new Date(Date.now() - 60000).toISOString(),
        read: true,
        processed: false,
        response_required: false
      },
      {
        message_id: 'msg-3',
        conversation_id: 'conv-2',
        from_agent_id: 'riley_risk',
        to_agent_id: undefined,
        message_type: 'risk_alert',
        priority: 'critical',
        subject: 'Portfolio Risk Alert: High Volatility',
        content: 'ALERT: Portfolio VaR has exceeded 95% threshold. Current drawdown is 8.5%. Recommend reducing position sizes by 25% across all strategies.',
        metadata: { var_95: 0.089, current_drawdown: 0.085 },
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
        processed: false,
        response_required: true
      },
      {
        message_id: 'msg-4',
        conversation_id: 'conv-2',
        from_agent_id: 'marcus_momentum',
        to_agent_id: 'riley_risk',
        message_type: 'coordination_request',
        priority: 'medium',
        subject: 'Re: Portfolio Risk Alert',
        content: 'Acknowledged. Reducing trend-following positions by 30%. Will monitor closely for next 2 hours.',
        metadata: { action: 'position_reduction', percentage: 0.3 },
        timestamp: new Date(Date.now() - 240000).toISOString(),
        read: true,
        processed: true,
        response_required: false
      },
      {
        message_id: 'msg-5',
        conversation_id: 'conv-3',
        from_agent_id: 'sophia_reversion',
        to_agent_id: 'alex_arbitrage',
        message_type: 'decision_vote',
        priority: 'medium',
        subject: 'Consensus Vote: Kelly Criterion Implementation',
        content: 'I vote YES for implementing Kelly Criterion for position sizing. My analysis shows 15% improvement in risk-adjusted returns.',
        metadata: { vote: 'yes', confidence: 0.78 },
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: true,
        processed: true,
        response_required: false
      }
    ]

    setAgents(mockAgents)
    setConversations(mockConversations)
    setMessages(mockMessages)
    setIsLoading(false)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'market_insight': return <TrendingUp className="h-4 w-4" />
      case 'trading_opportunity': return <Target className="h-4 w-4" />
      case 'risk_alert': return <Shield className="h-4 w-4" />
      case 'coordination_request': return <Users className="h-4 w-4" />
      case 'decision_vote': return <CheckCircle className="h-4 w-4" />
      case 'status_update': return <Bot className="h-4 w-4" />
      case 'resource_request': return <Zap className="h-4 w-4" />
      case 'performance_share': return <Brain className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-blue-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'stopped': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? agent.name : agentId
  }

  const getConversationMessages = (conversationId: string) => {
    return messages.filter(m => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !messageSubject.trim()) return

    const message: AgentMessage = {
      message_id: `msg-${Date.now()}`,
      conversation_id: selectedConversation || 'new-conv',
      from_agent_id: currentAgent,
      to_agent_id: recipientAgent || undefined,
      message_type: messageType as any,
      priority: priority as any,
      subject: messageSubject,
      content: newMessage,
      metadata: {},
      timestamp: new Date().toISOString(),
      read: false,
      processed: false,
      response_required: false
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    setMessageSubject('')
    
    // In a real implementation, this would call the backend API
    console.log('Sending message:', message)
  }

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.message_id === messageId ? { ...m, read: true } : m
    ))
  }

  const filteredMessages = messages.filter(message => {
    if (filterType !== 'all' && message.message_type !== filterType) return false
    if (searchTerm && !message.subject.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !message.content.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const unreadCount = messages.filter(m => !m.read && m.to_agent_id === currentAgent).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading agent communication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Communication Panel</h2>
          <p className="text-muted-foreground">
            Real-time communication and coordination between autonomous agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {unreadCount} unread messages
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            {showNotifications ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Current Agent Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Current Agent:</span>
            </div>
            <Select value={currentAgent} onValueChange={setCurrentAgent}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getAgentStatusColor(agent.status)}`} />
                      <span>{agent.name}</span>
                      <span className="text-sm text-muted-foreground">({agent.type})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Communication Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversations.map(conversation => (
                <div
                  key={conversation.conversation_id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conversation.conversation_id ? 
                    'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(conversation.conversation_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        conversation.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <span className="font-medium text-sm">{conversation.topic}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {conversation.message_count}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {conversation.participants.map(p => getAgentName(p)).join(', ')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(conversation.updated_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-32"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="market_insight">Market Insights</SelectItem>
                    <SelectItem value="trading_opportunity">Trading Opportunities</SelectItem>
                    <SelectItem value="risk_alert">Risk Alerts</SelectItem>
                    <SelectItem value="coordination_request">Coordination</SelectItem>
                    <SelectItem value="decision_vote">Decision Votes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedConversation ? (
                <>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {getConversationMessages(selectedConversation).map(message => (
                        <div
                          key={message.message_id}
                          className={`p-3 border rounded-lg ${
                            message.from_agent_id === currentAgent ? 
                            'bg-blue-50 border-blue-200 ml-8' : 'bg-gray-50 mr-8'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getMessageTypeIcon(message.message_type)}
                              <span className="font-medium text-sm">
                                {getAgentName(message.from_agent_id)}
                              </span>
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(message.priority)}`}>
                                {message.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {!message.read && message.to_agent_id === currentAgent && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(message.message_id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="font-medium text-sm">{message.subject}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {message.content}
                            </div>
                          </div>
                          {message.response_required && (
                            <div className="mt-2">
                              <Badge variant="destructive" className="text-xs">
                                Response Required
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Composer */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Input
                        placeholder="Message subject..."
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Select value={messageType} onValueChange={setMessageType}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="market_insight">Market Insight</SelectItem>
                            <SelectItem value="trading_opportunity">Trading Opportunity</SelectItem>
                            <SelectItem value="risk_alert">Risk Alert</SelectItem>
                            <SelectItem value="coordination_request">Coordination</SelectItem>
                            <SelectItem value="decision_vote">Decision Vote</SelectItem>
                            <SelectItem value="status_update">Status Update</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={recipientAgent} onValueChange={setRecipientAgent}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select recipient..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Broadcast to All</SelectItem>
                            {agents.filter(a => a.id !== currentAgent).map(agent => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button onClick={handleSendMessage} className="w-fit">
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`h-3 w-3 rounded-full ${getAgentStatusColor(agent.status)}`} />
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground">{agent.type}</div>
                  <div className="text-xs text-muted-foreground">Last seen: {agent.lastSeen}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}