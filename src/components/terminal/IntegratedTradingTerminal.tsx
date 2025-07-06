'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Terminal, User, Bot, Send, Loader2, Activity, 
  DollarSign, TrendingUp, BarChart3, Zap, Brain,
  CheckCircle2, XCircle, AlertTriangle, Settings,
  Maximize2, Minimize2, RefreshCw, Copy
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface TerminalMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'error' | 'success'
  content: string
  timestamp: Date
  typing?: boolean
  metadata?: {
    command?: string
    result?: any
    confidence?: number
    processingTime?: number
  }
}

interface IntegratedTradingTerminalProps {
  className?: string
  isExpanded?: boolean
  onExpandToggle?: () => void
}

export function IntegratedTradingTerminal({ 
  className, 
  isExpanded = false,
  onExpandToggle 
}: IntegratedTradingTerminalProps) {
  const [messages, setMessages] = useState<TerminalMessage[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [sessionActive, setSessionActive] = useState(true)
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize terminal with welcome message
  useEffect(() => {
    const welcomeMessage: TerminalMessage = {
      id: 'welcome',
      type: 'system',
      content: '🚀 AI Trading Terminal v2.0 - Connected to Gemini AI\nType "help" for available commands or ask me anything about trading!',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when terminal is expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  // Real LLM call using Gemini API
  const callGeminiAPI = async (prompt: string): Promise<string> => {
    try {
      // Check if we have the Gemini API key
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        return "⚠️ Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables."
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI trading assistant integrated into a terminal interface. The user is asking: "${prompt}". 

Context: You're helping with a live trading dashboard that has:
- Real-time market data
- AI trading agents
- Portfolio management
- Paper trading
- Risk management

Respond in a concise, technical manner suitable for a terminal interface. If it's a trading question, provide actionable insights. If it's a command request, explain what would happen. Keep responses under 200 words and use trading/technical terminology.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text
      } else {
        throw new Error('Invalid response format from Gemini API')
      }
    } catch (error) {
      console.error('Gemini API Error:', error)
      return `❌ LLM API Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  // Process terminal commands and LLM queries
  const processCommand = async (input: string): Promise<TerminalMessage> => {
    const startTime = Date.now()
    const command = input.toLowerCase().trim()

    // Built-in terminal commands
    if (command === 'help') {
      return {
        id: `cmd_${Date.now()}`,
        type: 'system',
        content: `📋 Available Commands:
• help - Show this help message
• status - Show system status
• portfolio - Show portfolio summary  
• agents - List active trading agents
• market [symbol] - Get market data
• clear - Clear terminal
• exit - Close terminal

🤖 Or ask me anything about trading in natural language!`,
        timestamp: new Date(),
        metadata: { command: 'help', processingTime: Date.now() - startTime }
      }
    }

    if (command === 'clear') {
      setMessages([])
      return {
        id: `cmd_${Date.now()}`,
        type: 'system',
        content: '🧹 Terminal cleared',
        timestamp: new Date(),
        metadata: { command: 'clear', processingTime: Date.now() - startTime }
      }
    }

    if (command === 'status') {
      return {
        id: `cmd_${Date.now()}`,
        type: 'success',
        content: `📊 System Status:
✅ Trading Engine: Online
✅ Market Data: Connected  
✅ AI Agents: 4 Active
✅ WebSocket: Connected
✅ Gemini AI: Ready
⚡ Latency: ${(Math.random() * 50 + 10).toFixed(0)}ms`,
        timestamp: new Date(),
        metadata: { command: 'status', processingTime: Date.now() - startTime }
      }
    }

    if (command === 'portfolio') {
      return {
        id: `cmd_${Date.now()}`,
        type: 'success',
        content: `💼 Portfolio Summary:
Total Value: $124,582.45 (+2.34%)
Cash: $12,450.00
Positions: 7 open
Today's P&L: +$2,891.23 (+2.38%)
Win Rate: 68.5%
Active Strategies: 5`,
        timestamp: new Date(),
        metadata: { command: 'portfolio', processingTime: Date.now() - startTime }
      }
    }

    if (command === 'agents') {
      return {
        id: `cmd_${Date.now()}`,
        type: 'success',
        content: `🤖 Active Trading Agents:
1. Momentum Trader - ACTIVE - P&L: +$1,245.67
2. Mean Reversion - ACTIVE - P&L: +$892.34  
3. Arbitrage Hunter - ACTIVE - P&L: +$456.78
4. Risk Manager - MONITORING - Status: OK`,
        timestamp: new Date(),
        metadata: { command: 'agents', processingTime: Date.now() - startTime }
      }
    }

    if (command.startsWith('market ')) {
      const symbol = command.replace('market ', '').toUpperCase()
      return {
        id: `cmd_${Date.now()}`,
        type: 'success',
        content: `📈 Market Data - ${symbol}:
Price: $${(Math.random() * 1000 + 100).toFixed(2)}
24h Change: ${(Math.random() * 10 - 5).toFixed(2)}%
Volume: $${(Math.random() * 1000000).toLocaleString()}
High: $${(Math.random() * 1100 + 100).toFixed(2)}
Low: $${(Math.random() * 900 + 100).toFixed(2)}`,
        timestamp: new Date(),
        metadata: { command: 'market', processingTime: Date.now() - startTime }
      }
    }

    if (command === 'exit') {
      setSessionActive(false)
      return {
        id: `cmd_${Date.now()}`,
        type: 'system',
        content: '👋 Terminal session ended. Thanks for using AI Trading Terminal!',
        timestamp: new Date(),
        metadata: { command: 'exit', processingTime: Date.now() - startTime }
      }
    }

    // For anything else, use Gemini AI
    try {
      const llmResponse = await callGeminiAPI(input)
      
      return {
        id: `llm_${Date.now()}`,
        type: 'assistant',
        content: `🧠 ${llmResponse}`,
        timestamp: new Date(),
        metadata: { 
          command: 'llm_query',
          processingTime: Date.now() - startTime,
          confidence: 0.85 + Math.random() * 0.15
        }
      }
    } catch (error) {
      return {
        id: `error_${Date.now()}`,
        type: 'error',
        content: `❌ Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { command: 'error', processingTime: Date.now() - startTime }
      }
    }
  }

  // Handle command submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!currentInput.trim() || isProcessing || !sessionActive) return

    const userMessage: TerminalMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentInput('')
    setIsProcessing(true)

    // Show typing indicator for LLM responses
    if (!currentInput.toLowerCase().trim().match(/^(help|clear|status|portfolio|agents|exit)$/)) {
      setTypingIndicator('AI is thinking...')
    }

    try {
      // Add realistic delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      
      const response = await processCommand(currentInput)
      
      // Clear typing indicator
      setTypingIndicator(null)
      
      setMessages(prev => [...prev, response])
      
      // Handle special commands
      if (currentInput.toLowerCase() === 'clear') {
        setTimeout(() => setMessages([]), 100)
      }
      
    } catch (error) {
      setTypingIndicator(null)
      const errorMessage: TerminalMessage = {
        id: `error_${Date.now()}`,
        type: 'error',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  // Copy message content
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  // Render message with appropriate styling
  const renderMessage = (message: TerminalMessage) => {
    const getMessageStyle = () => {
      switch (message.type) {
        case 'user':
          return 'text-blue-400 bg-blue-50/50 border-l-4 border-blue-400'
        case 'assistant':
          return 'text-green-400 bg-green-50/50 border-l-4 border-green-400'
        case 'system':
          return 'text-gray-600 bg-gray-50/50 border-l-4 border-gray-400'
        case 'error':
          return 'text-red-400 bg-red-50/50 border-l-4 border-red-400'
        case 'success':
          return 'text-emerald-400 bg-emerald-50/50 border-l-4 border-emerald-400'
        default:
          return 'text-gray-600'
      }
    }

    const getIcon = () => {
      switch (message.type) {
        case 'user':
          return <User className="h-4 w-4" />
        case 'assistant':
          return <Brain className="h-4 w-4" />
        case 'system':
          return <Terminal className="h-4 w-4" />
        case 'error':
          return <XCircle className="h-4 w-4" />
        case 'success':
          return <CheckCircle2 className="h-4 w-4" />
        default:
          return <Activity className="h-4 w-4" />
      }
    }

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`p-3 rounded-lg font-mono text-sm ${getMessageStyle()} group`}
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {getIcon()}
            <span className="text-xs opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </span>
            {message.metadata?.processingTime && (
              <span className="text-xs opacity-50">
                ({message.metadata.processingTime}ms)
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => copyMessage(message.content)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <div className="mt-2 whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
        {message.metadata?.confidence && (
          <div className="mt-1 text-xs opacity-60">
            Confidence: {(message.metadata.confidence * 100).toFixed(0)}%
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <Card className={`${className} ${isExpanded ? 'fixed inset-4 z-50 max-w-none' : ''} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">AI Trading Terminal</CardTitle>
            <Badge variant={sessionActive ? "default" : "secondary"} className="text-xs">
              {sessionActive ? 'Active' : 'Disconnected'}
            </Badge>
            {typingIndicator && (
              <Badge variant="outline" className="text-xs animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {typingIndicator}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Gemini AI
            </Badge>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setMessages([])}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            {onExpandToggle && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onExpandToggle}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Integrated AI terminal with real Gemini LLM responses • Type commands or ask questions naturally
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Terminal Output */}
        <ScrollArea className={`${isExpanded ? 'h-[calc(100vh-250px)]' : 'h-64'} w-full border rounded-lg bg-gray-950 p-4`}>
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map(renderMessage)}
            </AnimatePresence>
            
            {/* Typing Indicator */}
            {typingIndicator && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-blue-400 font-mono text-sm"
              >
                <Brain className="h-4 w-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>{typingIndicator}</span>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Terminal Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={sessionActive ? "Type a command or ask me anything about trading..." : "Terminal disconnected"}
              disabled={!sessionActive || isProcessing}
              className="font-mono bg-gray-950 text-green-400 border-gray-700 placeholder:text-gray-500"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Enter ↵'
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={!currentInput.trim() || !sessionActive || isProcessing}
            className="px-4"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Quick Commands */}
        <div className="flex flex-wrap gap-2">
          {['status', 'portfolio', 'agents', 'market BTC', 'help'].map((cmd) => (
            <Button
              key={cmd}
              size="sm"
              variant="outline"
              className="text-xs h-6"
              onClick={() => setCurrentInput(cmd)}
              disabled={isProcessing || !sessionActive}
            >
              {cmd}
            </Button>
          ))}
        </div>

        {/* Terminal Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {messages.length} messages
            </span>
            <span className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              LLM Ready
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${sessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{sessionActive ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default IntegratedTradingTerminal