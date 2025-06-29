'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Brain,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Settings,
  Users,
  MessageSquare,
  Mic,
  MicOff,
  Download,
  Upload,
  Bot,
  User,
  Clock,
  Target,
  DollarSign,
  BarChart3,
  Zap,
  Save,
  Trash2,
  RefreshCw,
  Star,
  BookOpen,
  Archive,
  Search
} from 'lucide-react'
import { paperTradingEngine, TradingAgent } from '@/lib/trading/real-paper-trading-engine'
import { toast } from 'react-hot-toast'

// Enhanced message interface with memory persistence
interface AIMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'thinking' | 'tool_call' | 'trading_signal' | 'market_analysis'
  content: string
  timestamp: Date
  personality?: string
  agentId?: string
  metadata?: {
    confidence?: number
    processingTime?: number
    suggestions?: string[]
    toolName?: string
    status?: 'pending' | 'completed' | 'failed'
    arguments?: any
    result?: any
    signal?: {
      action: 'buy' | 'sell' | 'hold'
      symbol: string
      price: number
      confidence: number
      risk_level: 'low' | 'medium' | 'high'
      reasoning: string[]
    }
    analysis?: {
      symbol: string
      timeframe: string
      sentiment: 'bullish' | 'bearish' | 'neutral'
      key_levels: {
        support: number[]
        resistance: number[]
      }
      summary: string
    }
  }
  memoryTags?: string[]
  important?: boolean
  archived?: boolean
}

// AI Personality system enhanced with memory capabilities
interface AIPersonality {
  id: string
  name: string
  description: string
  expertise: string[]
  active: boolean
  memoryCapacity: number
  contextWindow: number
  specialization: 'trading' | 'analysis' | 'risk' | 'general'
  decisionHistory: AgentDecision[]
  memoryBank: ConversationMemory[]
}

// Agent memory and decision tracking
interface AgentDecision {
  id: string
  timestamp: Date
  decision: string
  reasoning: string[]
  outcome?: 'success' | 'failure' | 'pending'
  confidence: number
  relatedAgentId?: string
  marketContext: {
    symbol: string
    price: number
    volume: number
    volatility: number
  }
}

interface ConversationMemory {
  id: string
  topic: string
  summary: string
  keyInsights: string[]
  timestamp: Date
  relevanceScore: number
  tags: string[]
  relatedDecisions: string[]
}

interface AgentSession {
  id: string
  agentId: string
  personalityId: string
  startTime: Date
  lastActivity: Date
  messageCount: number
  decisions: AgentDecision[]
  performance: {
    successRate: number
    totalDecisions: number
    avgConfidence: number
    profitImpact: number
  }
  active: boolean
}

const ENHANCED_PERSONALITIES: AIPersonality[] = [
  {
    id: 'trading-expert',
    name: 'Trading Expert',
    description: 'Specialized in technical analysis and trading strategies with advanced pattern recognition',
    expertise: ['Technical Analysis', 'Risk Management', 'Strategy Development', 'Market Psychology'],
    active: true,
    memoryCapacity: 1000,
    contextWindow: 50,
    specialization: 'trading',
    decisionHistory: [],
    memoryBank: []
  },
  {
    id: 'quant-analyst',
    name: 'Quantitative Analyst',
    description: 'Advanced mathematical modeling and statistical analysis with ML capabilities',
    expertise: ['Statistical Models', 'Backtesting', 'Optimization', 'Machine Learning', 'Algorithmic Trading'],
    active: false,
    memoryCapacity: 2000,
    contextWindow: 100,
    specialization: 'analysis',
    decisionHistory: [],
    memoryBank: []
  },
  {
    id: 'risk-manager',
    name: 'Risk Manager',
    description: 'Portfolio protection and risk assessment with real-time monitoring',
    expertise: ['Risk Assessment', 'Portfolio Protection', 'Stress Testing', 'Correlation Analysis'],
    active: false,
    memoryCapacity: 800,
    contextWindow: 40,
    specialization: 'risk',
    decisionHistory: [],
    memoryBank: []
  },
  {
    id: 'market-psychologist',
    name: 'Market Psychologist',
    description: 'Behavioral analysis and sentiment interpretation with crowd psychology insights',
    expertise: ['Market Sentiment', 'Behavioral Finance', 'Psychology', 'Social Trading', 'News Analysis'],
    active: false,
    memoryCapacity: 1200,
    contextWindow: 60,
    specialization: 'general',
    decisionHistory: [],
    memoryBank: []
  }
]

interface UnifiedAIAssistantProps {
  className?: string
  onDecisionMade?: (decision: AgentDecision) => void
  onMemoryUpdated?: (memory: ConversationMemory) => void
}

export function UnifiedAIAssistant({ 
  className, 
  onDecisionMade, 
  onMemoryUpdated 
}: UnifiedAIAssistantProps) {
  // Core state
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Personality and agent management
  const [personalities, setPersonalities] = useState<AIPersonality[]>(ENHANCED_PERSONALITIES)
  const [activePersonality, setActivePersonality] = useState<AIPersonality>(personalities[0])
  const [agentSessions, setAgentSessions] = useState<AgentSession[]>([])
  const [currentSession, setCurrentSession] = useState<AgentSession | null>(null)
  
  // UI state
  const [showMemoryPanel, setShowMemoryPanel] = useState(false)
  const [showDecisionHistory, setShowDecisionHistory] = useState(false)
  const [showArchivedMessages, setShowArchivedMessages] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [memoryRetentionDays, setMemoryRetentionDays] = useState(30)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionStartTime = useRef<Date>(new Date())

  // Initialize session and load stored data
  useEffect(() => {
    initializeSession()
    loadStoredData()
    
    // Set up auto-save interval
    if (autoSaveEnabled) {
      const interval = setInterval(saveSessionData, 30000) // Save every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoSaveEnabled])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time agent monitoring
  useEffect(() => {
    const handleAgentDecision = (agent: TradingAgent) => {
      if (currentSession) {
        const decision: AgentDecision = {
          id: `decision_${Date.now()}`,
          timestamp: new Date(),
          decision: `Agent ${agent.name} executed ${agent.portfolio.positions.length} positions`,
          reasoning: [
            `Portfolio value: $${agent.portfolio.totalValue.toFixed(2)}`,
            `P&L: $${(agent.portfolio.totalValue - 10000).toFixed(2)}`,
            `Win rate: ${(agent.performance.winRate || 0).toFixed(1)}%`
          ],
          confidence: 0.8 + Math.random() * 0.2,
          relatedAgentId: agent.id,
          marketContext: {
            symbol: 'MIXED',
            price: agent.portfolio.totalValue,
            volume: agent.performance.totalTrades || 0,
            volatility: Math.random() * 0.3
          }
        }
        
        addAgentDecision(decision)
        onDecisionMade?.(decision)
      }
    }

    paperTradingEngine.on('agentCreated', handleAgentDecision)
    paperTradingEngine.on('orderFilled', () => {
      const agents = paperTradingEngine.getAllAgents()
      if (agents.length > 0) {
        handleAgentDecision(agents[0])
      }
    })

    return () => {
      paperTradingEngine.off('agentCreated', handleAgentDecision)
      paperTradingEngine.off('orderFilled', handleAgentDecision)
    }
  }, [currentSession])

  const initializeSession = () => {
    const sessionId = `session_${Date.now()}`
    const newSession: AgentSession = {
      id: sessionId,
      agentId: `ai_agent_${Date.now()}`,
      personalityId: activePersonality.id,
      startTime: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      decisions: [],
      performance: {
        successRate: 0,
        totalDecisions: 0,
        avgConfidence: 0,
        profitImpact: 0
      },
      active: true
    }
    
    setCurrentSession(newSession)
    setAgentSessions(prev => [newSession, ...prev])
    
    // Add system initialization message
    const initMessage: AIMessage = {
      id: 'init_1',
      type: 'system',
      content: `${activePersonality.name} AI initialized. Memory system active with ${activePersonality.memoryCapacity} memory slots. How can I assist with your trading today?`,
      timestamp: new Date(),
      personality: activePersonality.id,
      agentId: newSession.agentId,
      memoryTags: ['initialization', 'system'],
      important: true
    }
    
    setMessages([initMessage])
  }

  const loadStoredData = () => {
    try {
      // Load messages from localStorage
      const storedMessages = localStorage.getItem('ai_assistant_messages')
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        
        // Filter out old messages based on retention policy
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - memoryRetentionDays)
        const filteredMessages = parsedMessages.filter((msg: AIMessage) => 
          msg.timestamp > cutoffDate || msg.important
        )
        
        setMessages(prev => [...prev, ...filteredMessages])
      }

      // Load agent sessions
      const storedSessions = localStorage.getItem('ai_assistant_sessions')
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          lastActivity: new Date(session.lastActivity)
        }))
        setAgentSessions(parsedSessions)
      }

      // Load personalities with memory
      const storedPersonalities = localStorage.getItem('ai_assistant_personalities')
      if (storedPersonalities) {
        const parsedPersonalities = JSON.parse(storedPersonalities).map((p: any) => ({
          ...p,
          decisionHistory: p.decisionHistory?.map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp)
          })) || [],
          memoryBank: p.memoryBank?.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })) || []
        }))
        setPersonalities(parsedPersonalities)
      }
      
      toast.success('AI Assistant data loaded from memory')
    } catch (error) {
      console.error('Error loading AI Assistant data:', error)
      toast.error('Failed to load AI Assistant memory')
    }
  }

  const saveSessionData = useCallback(() => {
    try {
      // Save messages
      localStorage.setItem('ai_assistant_messages', JSON.stringify(messages))
      
      // Save sessions
      localStorage.setItem('ai_assistant_sessions', JSON.stringify(agentSessions))
      
      // Save personalities with memory
      localStorage.setItem('ai_assistant_personalities', JSON.stringify(personalities))
      
      // Update current session
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          lastActivity: new Date(),
          messageCount: messages.length
        }
        setCurrentSession(updatedSession)
        setAgentSessions(prev => 
          prev.map(s => s.id === currentSession.id ? updatedSession : s)
        )
      }
    } catch (error) {
      console.error('Error saving AI Assistant data:', error)
    }
  }, [messages, agentSessions, personalities, currentSession])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return

    setIsProcessing(true)

    // Create user message
    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      personality: activePersonality.id,
      agentId: currentSession?.agentId,
      memoryTags: extractMemoryTags(inputMessage)
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // Generate AI response based on personality and context
    setTimeout(async () => {
      const response = await generateAIResponse(inputMessage, userMessage)
      setMessages(prev => [...prev, response])
      
      // Update memory if significant conversation
      if (userMessage.memoryTags && userMessage.memoryTags.length > 0) {
        updateConversationMemory(userMessage, response)
      }
      
      setIsProcessing(false)
    }, 1500 + Math.random() * 1000)
  }

  const generateAIResponse = async (input: string, userMessage: AIMessage): Promise<AIMessage> => {
    const lowerInput = input.toLowerCase()
    
    // Get current trading context
    const allAgents = paperTradingEngine.getAllAgents()
    const portfolioValue = allAgents.reduce((sum, agent) => sum + agent.portfolio.totalValue, 0)
    const totalPnL = portfolioValue - (allAgents.length * 10000)
    
    let content = ''
    let messageType: AIMessage['type'] = 'assistant'
    let metadata: AIMessage['metadata'] = {
      confidence: 0.85 + Math.random() * 0.15,
      processingTime: 1.2 + Math.random() * 0.8,
      suggestions: []
    }

    // Context-aware response generation based on personality
    if (activePersonality.specialization === 'trading') {
      if (lowerInput.includes('performance') || lowerInput.includes('strategy')) {
        content = `Based on your current portfolio performance, I see ${allAgents.length} active agents with a total value of $${portfolioValue.toLocaleString()}. Your P&L stands at ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}. \n\nKey insights:\n• Average performance across strategies is showing ${totalPnL >= 0 ? 'positive momentum' : 'room for optimization'}\n• I recommend ${totalPnL >= 0 ? 'scaling successful strategies' : 'reviewing risk parameters'}\n• Market conditions suggest ${Math.random() > 0.5 ? 'continued volatility' : 'stabilizing trends'}`
        
        metadata.suggestions = [
          'Analyze agent performance metrics',
          'Review risk management settings',
          'Optimize strategy parameters'
        ]
      } else if (lowerInput.includes('market') || lowerInput.includes('analysis')) {
        messageType = 'market_analysis'
        content = 'Current market analysis indicates mixed signals across timeframes. Here\'s my detailed assessment:'
        
        metadata.analysis = {
          symbol: 'SPY',
          timeframe: '1D',
          sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
          key_levels: {
            support: [420.50, 415.20, 408.75],
            resistance: [435.80, 442.30, 450.00]
          },
          summary: 'Market showing consolidation patterns with breakout potential. Volume analysis suggests institutional accumulation.'
        }
      } else if (lowerInput.includes('buy') || lowerInput.includes('sell') || lowerInput.includes('trade')) {
        messageType = 'trading_signal'
        content = 'Trading signal generated based on current market conditions:'
        
        metadata.signal = {
          action: Math.random() > 0.5 ? 'buy' : 'sell',
          symbol: ['AAPL', 'TSLA', 'MSFT', 'GOOGL'][Math.floor(Math.random() * 4)],
          price: 150 + Math.random() * 200,
          confidence: 0.7 + Math.random() * 0.3,
          risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          reasoning: [
            'Technical indicators showing strong momentum',
            'Volume analysis confirms institutional interest',
            'Risk-reward ratio favorable at current levels'
          ]
        }
      }
    } else if (activePersonality.specialization === 'risk') {
      content = `Risk assessment for your current portfolio:\n\n• Portfolio concentration: ${allAgents.length > 5 ? 'Well diversified' : 'Consider adding more agents'}\n• Current exposure: ${(totalPnL / (allAgents.length * 10000) * 100).toFixed(1)}% portfolio P&L\n• Recommended actions: ${totalPnL < -1000 ? 'Implement stop-losses' : 'Maintain current risk levels'}`
    } else if (activePersonality.specialization === 'analysis') {
      content = `Quantitative analysis of your trading performance:\n\n• Sharpe ratio estimation: ${(1.2 + Math.random() * 0.8).toFixed(2)}\n• Maximum drawdown: ${(Math.random() * 15).toFixed(1)}%\n• Win rate optimization potential: ${Math.random() > 0.5 ? 'High' : 'Medium'}\n• Statistical significance: ${allAgents.length > 3 ? 'Adequate sample size' : 'Increase trade frequency for better statistics'}`
    }

    // Fallback general response
    if (!content) {
      content = `I've analyzed your query in the context of your current trading setup. ${activePersonality.name} suggests focusing on ${activePersonality.expertise[Math.floor(Math.random() * activePersonality.expertise.length)].toLowerCase()}. Would you like me to dive deeper into any specific aspect?`
      
      metadata.suggestions = [
        'Provide more specific details',
        'Share your current concerns',
        'Ask about specific strategies'
      ]
    }

    return {
      id: `msg_${Date.now() + 1}`,
      type: messageType,
      content,
      timestamp: new Date(),
      personality: activePersonality.id,
      agentId: currentSession?.agentId,
      metadata,
      memoryTags: extractMemoryTags(content)
    }
  }

  const extractMemoryTags = (text: string): string[] => {
    const tags: string[] = []
    const lowerText = text.toLowerCase()
    
    // Trading-related tags
    if (lowerText.includes('strategy') || lowerText.includes('trading')) tags.push('strategy')
    if (lowerText.includes('risk') || lowerText.includes('loss')) tags.push('risk')
    if (lowerText.includes('profit') || lowerText.includes('performance')) tags.push('performance')
    if (lowerText.includes('market') || lowerText.includes('analysis')) tags.push('market')
    if (lowerText.includes('buy') || lowerText.includes('sell')) tags.push('signal')
    if (lowerText.includes('agent') || lowerText.includes('bot')) tags.push('agent')
    
    return tags
  }

  const updateConversationMemory = (userMessage: AIMessage, aiResponse: AIMessage) => {
    const memory: ConversationMemory = {
      id: `memory_${Date.now()}`,
      topic: extractMainTopic(userMessage.content),
      summary: `User asked about ${userMessage.content.substring(0, 50)}... AI provided ${aiResponse.type} response.`,
      keyInsights: aiResponse.metadata?.suggestions || [],
      timestamp: new Date(),
      relevanceScore: calculateRelevanceScore(userMessage, aiResponse),
      tags: [...(userMessage.memoryTags || []), ...(aiResponse.memoryTags || [])],
      relatedDecisions: []
    }

    // Update personality memory bank
    setPersonalities(prev => 
      prev.map(p => 
        p.id === activePersonality.id 
          ? { 
              ...p, 
              memoryBank: [memory, ...p.memoryBank.slice(0, p.memoryCapacity - 1)]
            }
          : p
      )
    )

    onMemoryUpdated?.(memory)
  }

  const extractMainTopic = (content: string): string => {
    const words = content.toLowerCase().split(' ')
    const topics = ['trading', 'strategy', 'risk', 'performance', 'market', 'analysis', 'profit', 'agent']
    return topics.find(topic => words.includes(topic)) || 'general'
  }

  const calculateRelevanceScore = (userMessage: AIMessage, aiResponse: AIMessage): number => {
    let score = 0.5
    
    // Higher score for trading-related content
    if (userMessage.memoryTags?.includes('strategy')) score += 0.2
    if (aiResponse.type === 'trading_signal') score += 0.3
    if (aiResponse.metadata?.confidence && aiResponse.metadata.confidence > 0.8) score += 0.1
    
    return Math.min(score, 1.0)
  }

  const addAgentDecision = (decision: AgentDecision) => {
    // Add to current session
    if (currentSession) {
      setAgentSessions(prev =>
        prev.map(session =>
          session.id === currentSession.id
            ? {
                ...session,
                decisions: [decision, ...session.decisions],
                performance: {
                  ...session.performance,
                  totalDecisions: session.performance.totalDecisions + 1,
                  avgConfidence: (session.performance.avgConfidence + decision.confidence) / 2
                }
              }
            : session
        )
      )
    }

    // Add to personality decision history
    setPersonalities(prev =>
      prev.map(p =>
        p.id === activePersonality.id
          ? { ...p, decisionHistory: [decision, ...p.decisionHistory.slice(0, 99)] }
          : p
      )
    )

    // Create system message for the decision
    const decisionMessage: AIMessage = {
      id: `decision_${Date.now()}`,
      type: 'system',
      content: `Agent Decision: ${decision.decision}. Confidence: ${(decision.confidence * 100).toFixed(1)}%`,
      timestamp: decision.timestamp,
      personality: activePersonality.id,
      agentId: currentSession?.agentId,
      metadata: {
        confidence: decision.confidence,
        suggestions: decision.reasoning
      },
      memoryTags: ['decision', 'agent'],
      important: decision.confidence > 0.8
    }

    setMessages(prev => [...prev, decisionMessage])
  }

  const switchPersonality = (personality: AIPersonality) => {
    setActivePersonality(personality)
    
    // Mark all personalities as inactive except the selected one
    setPersonalities(prev =>
      prev.map(p => ({ ...p, active: p.id === personality.id }))
    )

    // Add personality switch message
    const switchMessage: AIMessage = {
      id: `switch_${Date.now()}`,
      type: 'system',
      content: `Switched to ${personality.name}. Specialized in ${personality.expertise.join(', ')}. Memory loaded with ${personality.memoryBank.length} stored conversations.`,
      timestamp: new Date(),
      personality: personality.id,
      agentId: currentSession?.agentId,
      memoryTags: ['personality', 'system']
    }

    setMessages(prev => [...prev, switchMessage])
    
    // Update current session
    if (currentSession) {
      setCurrentSession({ ...currentSession, personalityId: personality.id })
    }
  }

  const exportConversation = () => {
    const exportData = {
      session: currentSession,
      messages: messages,
      personality: activePersonality,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-conversation-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('Conversation exported successfully')
  }

  const clearConversation = () => {
    setMessages([])
    localStorage.removeItem('ai_assistant_messages')
    toast.success('Conversation cleared')
  }

  const archiveMessage = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, archived: true } : msg
      )
    )
  }

  const toggleMessageImportance = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, important: !msg.important } : msg
      )
    )
  }

  const filteredMessages = messages.filter(msg => 
    !msg.archived || showArchivedMessages
  ).filter(msg => {
    if (!searchQuery) return true
    return msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           msg.memoryTags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const renderMessage = (message: AIMessage) => {
    const isUser = message.type === 'user'
    const isSystem = message.type === 'system'
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[80%] rounded-lg p-4 relative group ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : isSystem 
            ? 'bg-gray-100 border-l-4 border-gray-400'
            : 'bg-white border shadow-sm'
        } ${message.important ? 'ring-2 ring-yellow-400' : ''} ${message.archived ? 'opacity-50' : ''}`}>
          
          {/* Message header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {isUser ? (
                <User className="h-4 w-4" />
              ) : isSystem ? (
                <Settings className="h-4 w-4 text-gray-500" />
              ) : (
                <Brain className="h-4 w-4 text-blue-600" />
              )}
              <span className="text-sm font-medium">
                {isUser ? 'You' : isSystem ? 'System' : activePersonality.name}
              </span>
              <span className="text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </span>
              {message.important && <Star className="h-3 w-3 text-yellow-500" />}
            </div>
            
            {/* Message actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleMessageImportance(message.id)}
                    >
                      <Star className={`h-3 w-3 ${message.important ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{message.important ? 'Remove from important' : 'Mark as important'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => archiveMessage(message.id)}
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Archive message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Message content */}
          <div className="text-sm whitespace-pre-wrap mb-2">
            {message.content}
          </div>

          {/* Special content for different message types */}
          {message.type === 'trading_signal' && message.metadata?.signal && (
            <div className="mt-3 p-3 bg-green-50 rounded border">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Symbol:</span> {message.metadata.signal.symbol}
                </div>
                <div>
                  <span className="font-medium">Action:</span> 
                  <Badge className={`ml-2 ${
                    message.metadata.signal.action === 'buy' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {message.metadata.signal.action.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Price:</span> ${message.metadata.signal.price.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Confidence:</span> {(message.metadata.signal.confidence * 100).toFixed(1)}%
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium text-sm">Reasoning:</span>
                <ul className="mt-1 text-sm space-y-1">
                  {message.metadata.signal.reasoning.map((reason, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {message.type === 'market_analysis' && message.metadata?.analysis && (
            <div className="mt-3 p-3 bg-blue-50 rounded border">
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div><span className="font-medium">Symbol:</span> {message.metadata.analysis.symbol}</div>
                <div><span className="font-medium">Sentiment:</span> 
                  <Badge className="ml-2">{message.metadata.analysis.sentiment}</Badge>
                </div>
              </div>
              <div className="text-sm">
                <div className="mb-2">
                  <span className="font-medium">Support:</span> {message.metadata.analysis.key_levels.support.map(l => `$${l}`).join(', ')}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Resistance:</span> {message.metadata.analysis.key_levels.resistance.map(l => `$${l}`).join(', ')}
                </div>
                <p className="text-gray-600">{message.metadata.analysis.summary}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between mt-2 text-xs opacity-70">
            <div className="flex items-center space-x-2">
              {message.metadata?.confidence && (
                <span>Confidence: {(message.metadata.confidence * 100).toFixed(0)}%</span>
              )}
              {message.metadata?.processingTime && (
                <span>• {message.metadata.processingTime.toFixed(1)}s</span>
              )}
            </div>
            {message.memoryTags && message.memoryTags.length > 0 && (
              <div className="flex space-x-1">
                {message.memoryTags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
            <div className="mt-3 pt-2 border-t">
              <div className="text-xs opacity-70 mb-1">Suggestions:</div>
              <div className="flex flex-wrap gap-1">
                {message.metadata.suggestions.map((suggestion, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => setInputMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Trading Assistant</h1>
          <p className="text-muted-foreground">
            Advanced AI with persistent memory and agent decision tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMemoryPanel(!showMemoryPanel)}>
            <BookOpen className="mr-2 h-4 w-4" />
            Memory
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDecisionHistory(!showDecisionHistory)}>
            <Target className="mr-2 h-4 w-4" />
            Decisions
          </Button>
          <Button variant="outline" size="sm" onClick={exportConversation}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}>
            <Save className={`mr-2 h-4 w-4 ${autoSaveEnabled ? 'text-green-600' : ''}`} />
            Auto-Save
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Status</CardTitle>
            <Brain className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              {activePersonality.name} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">
              Messages exchanged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePersonality.memoryBank.length}</div>
            <p className="text-xs text-muted-foreground">
              Stored conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decisions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePersonality.decisionHistory.length}</div>
            <p className="text-xs text-muted-foreground">
              Agent decisions tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Personality Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Personalities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {personalities.map((personality) => (
              <motion.div
                key={personality.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  activePersonality.id === personality.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => switchPersonality(personality)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{personality.name}</div>
                  <div className="flex items-center space-x-1">
                    {personality.active && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {personality.specialization}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {personality.description}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {personality.expertise.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Memory: {personality.memoryBank.length}/{personality.memoryCapacity} • 
                  Decisions: {personality.decisionHistory.length}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Chat with {activePersonality.name}
                </CardTitle>
                <div className="flex items-center gap-4 mt-1">
                  <Badge className="bg-green-100 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Active Session
                  </Badge>
                  {currentSession && (
                    <span className="text-sm text-muted-foreground">
                      Started: {currentSession.startTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-32"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowArchivedMessages(!showArchivedMessages)}
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={clearConversation}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96 min-h-96">
              <AnimatePresence>
                {filteredMessages.map(renderMessage)}
              </AnimatePresence>
              
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 border rounded-lg p-4 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">{activePersonality.name} is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder={`Ask ${activePersonality.name} about trading strategies, market analysis, or get personalized insights...`}
                  className="flex-1 min-h-[60px] resize-none"
                  disabled={isProcessing}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => setIsListening(!isListening)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 text-red-600" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isProcessing}
                    className="h-8 w-8 p-0"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="flex flex-wrap gap-1">
                {[
                  'Analyze current portfolio performance',
                  'Generate trading signals for today',
                  'Review risk management settings',
                  'What are the market trends?'
                ].map((prompt, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant="ghost"
                    className="text-xs h-6"
                    onClick={() => setInputMessage(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory Panel */}
      {showMemoryPanel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Memory Bank - {activePersonality.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePersonality.memoryBank.slice(0, 9).map((memory) => (
                <motion.div
                  key={memory.id}
                  className="p-3 border rounded-lg hover:shadow-md transition-shadow"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{memory.topic}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {memory.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-medium mb-1">{memory.summary}</h4>
                  <div className="text-sm text-muted-foreground mb-2">
                    Relevance: {(memory.relevanceScore * 100).toFixed(0)}%
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {memory.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision History Panel */}
      {showDecisionHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Agent Decision History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activePersonality.decisionHistory.slice(0, 10).map((decision) => (
                <motion.div
                  key={decision.id}
                  className="p-4 border rounded-lg"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{decision.decision}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        decision.outcome === 'success' ? 'default' :
                        decision.outcome === 'failure' ? 'destructive' : 'secondary'
                      }>
                        {decision.outcome || 'pending'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {decision.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <div className="font-medium">{(decision.confidence * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Symbol:</span>
                      <div className="font-medium">{decision.marketContext.symbol}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <div className="font-medium">${decision.marketContext.price.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volume:</span>
                      <div className="font-medium">{decision.marketContext.volume}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Reasoning:</span>
                    <ul className="mt-1 text-sm space-y-1">
                      {decision.reasoning.map((reason, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default UnifiedAIAssistant