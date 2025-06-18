'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Send, 
  Mic, 
  MicOff,
  Settings,
  Download,
  Upload,
  Zap,
  MessageSquare,
  Bot,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'eliza' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    confidence?: number;
    processingTime?: number;
    suggestions?: string[];
  };
}

interface ElizaPersonality {
  id: string;
  name: string;
  description: string;
  expertise: string[];
  active: boolean;
}

const personalities: ElizaPersonality[] = [
  {
    id: 'trading-expert',
    name: 'Trading Expert',
    description: 'Specialized in technical analysis and trading strategies',
    expertise: ['Technical Analysis', 'Risk Management', 'Strategy Development'],
    active: true
  },
  {
    id: 'quant-analyst',
    name: 'Quantitative Analyst',
    description: 'Advanced mathematical modeling and statistical analysis',
    expertise: ['Statistical Models', 'Backtesting', 'Optimization'],
    active: false
  },
  {
    id: 'market-psychologist',
    name: 'Market Psychologist',
    description: 'Behavioral analysis and sentiment interpretation',
    expertise: ['Market Sentiment', 'Behavioral Finance', 'Psychology'],
    active: false
  }
];

const mockConversation: Message[] = [
  {
    id: '1',
    type: 'system',
    content: 'Eliza AI Trading Assistant initialized. How can I help you optimize your trading today?',
    timestamp: '2024-01-15 14:30:00'
  },
  {
    id: '2',
    type: 'user',
    content: 'What do you think about the current performance of my Darvas Box strategy?',
    timestamp: '2024-01-15 14:31:15'
  },
  {
    id: '3',
    type: 'eliza',
    content: 'Based on the recent data from your Darvas Box agents, I notice some interesting patterns. Your strategy is showing a 74% win rate with an average return of $127 per trade. However, I\'ve detected that performance drops by 15% during high volatility periods (VIX > 25). Would you like me to suggest some optimizations for volatile market conditions?',
    timestamp: '2024-01-15 14:31:32',
    metadata: {
      confidence: 87,
      processingTime: 1.2,
      suggestions: [
        'Adjust position sizing during high volatility',
        'Implement volatility filters',
        'Add correlation analysis with VIX'
      ]
    }
  },
  {
    id: '4',
    type: 'user',
    content: 'Yes, please suggest optimizations for high volatility periods',
    timestamp: '2024-01-15 14:32:45'
  },
  {
    id: '5',
    type: 'eliza',
    content: 'Excellent! Here are three specific optimizations I recommend:\n\n1. **Dynamic Position Sizing**: Reduce position size by 25-40% when VIX exceeds 25. This will help preserve capital during uncertain periods.\n\n2. **Volatility Breakout Filter**: Only enter Darvas Box breakouts when the 14-day ATR is below the 50-day moving average of ATR. This filters out false breakouts in choppy markets.\n\n3. **Time-Based Exits**: Implement faster profit-taking (75% of normal target) during high volatility to lock in gains before reversals.\n\nShall I help you implement these changes in your agent configurations?',
    timestamp: '2024-01-15 14:32:58',
    metadata: {
      confidence: 92,
      processingTime: 2.1,
      suggestions: [
        'Implement position sizing rules',
        'Add ATR volatility filter',
        'Configure dynamic exit targets'
      ]
    }
  }
];

export default function ElizaPage() {
  const [messages, setMessages] = useState<Message[]>(mockConversation);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activePersonality, setActivePersonality] = useState(personalities[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate Eliza processing
    setTimeout(() => {
      const elizaResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'eliza',
        content: generateElizaResponse(inputMessage),
        timestamp: new Date().toLocaleString(),
        metadata: {
          confidence: Math.floor(Math.random() * 20) + 80,
          processingTime: Math.random() * 3 + 0.5,
          suggestions: [
            'Analyze recent performance data',
            'Review market conditions',
            'Optimize strategy parameters'
          ]
        }
      };
      setMessages(prev => [...prev, elizaResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateElizaResponse = (input: string): string => {
    // Simple response generation based on keywords
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('performance') || lowerInput.includes('strategy')) {
      return "I've analyzed your recent trading performance. Your strategies are showing strong momentum with consistent returns. Would you like me to dive deeper into any specific metrics or suggest areas for improvement?";
    } else if (lowerInput.includes('market') || lowerInput.includes('analysis')) {
      return "Current market conditions show increased volatility with mixed signals across different timeframes. I recommend maintaining cautious position sizing and focusing on high-probability setups. Shall I provide a detailed market analysis?";
    } else if (lowerInput.includes('risk') || lowerInput.includes('drawdown')) {
      return "Risk management is crucial right now. I notice your portfolio exposure is within acceptable limits, but I'd suggest reviewing your correlation matrix. Some of your strategies might be too correlated during stress periods.";
    } else {
      return "That's an interesting question about your trading setup. Let me analyze the relevant data and provide you with actionable insights. Could you be more specific about what aspect you'd like me to focus on?";
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Implement voice recognition here
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6 h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eliza AI Assistant</h1>
          <p className="text-muted-foreground">
            Advanced AI trading assistant with natural language processing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Chat
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* AI Status & Personality */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Status</CardTitle>
            <Brain className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              Ready to assist
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Personality</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{activePersonality.name}</div>
            <p className="text-xs text-muted-foreground">
              {activePersonality.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              Total interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.8s</div>
            <p className="text-xs text-muted-foreground">
              Processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Personality Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">AI Personalities</CardTitle>
            <CardDescription>Choose an AI personality for specialized assistance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {personalities.map((personality) => (
              <div
                key={personality.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  activePersonality.id === personality.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setActivePersonality(personality)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{personality.name}</div>
                  {personality.active && (
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {personality.description}
                </div>
                <div className="flex flex-wrap gap-1">
                  {personality.expertise.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
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
                <CardDescription>
                  Get personalized trading insights and analysis
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Active
                </Badge>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.type === 'eliza'
                        ? 'bg-muted border'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 mt-0.5" />
                      ) : message.type === 'eliza' ? (
                        <Brain className="h-4 w-4 mt-0.5 text-blue-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs opacity-70">
                            {formatTimestamp(message.timestamp)}
                          </div>
                          {message.metadata && (
                            <div className="flex items-center gap-2 text-xs">
                              <span>Confidence: {message.metadata.confidence}%</span>
                              <span>•</span>
                              <span>{message.metadata.processingTime?.toFixed(1)}s</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {message.metadata?.suggestions && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <div className="text-xs opacity-70 mb-1">Suggestions:</div>
                        <div className="space-y-1">
                          {message.metadata.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-xs justify-start"
                              onClick={() => setInputMessage(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted border rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">Eliza is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={`Ask ${activePersonality.name} about your trading...`}
                  className="w-full p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isTyping}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1"
                  onClick={toggleVoice}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4 text-red-600" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button onClick={sendMessage} disabled={!inputMessage.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}