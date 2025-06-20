"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, Brain, Bot, TrendingUp, BarChart3, 
  Send, RefreshCw, Settings, User, Lightbulb, AlertCircle
} from 'lucide-react';
import { backendApi } from '@/lib/api/backend-client';

interface ConversationMessage {
  message_id: string;
  message_type: string;
  content: string;
  timestamp: string;
  confidence_score?: number;
}

interface ConversationSession {
  session_id: string;
  mode: string;
  personality: string;
  created_at: string;
  is_active: boolean;
}

interface AIInsight {
  insight_id: string;
  category: string;
  title: string;
  content: string;
  confidence: number;
  risk_level: string;
  recommended_actions: string[];
  created_at: string;
}

export default function ElizaAIHub() {
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState('trading_assistant');
  const [selectedPersonality, setSelectedPersonality] = useState('professional');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationModes = [
    { value: 'trading_assistant', label: 'Trading Assistant' },
    { value: 'market_analysis', label: 'Market Analysis' },
    { value: 'strategy_advisor', label: 'Strategy Advisor' },
    { value: 'risk_counselor', label: 'Risk Counselor' },
    { value: 'education_tutor', label: 'Education Tutor' },
    { value: 'general_chat', label: 'General Chat' }
  ];

  const personalities = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'analytical', label: 'Analytical' },
    { value: 'cautious', label: 'Cautious' },
    { value: 'aggressive', label: 'Aggressive' },
    { value: 'educational', label: 'Educational' }
  ];

  useEffect(() => {
    fetchAIData();
    const interval = setInterval(fetchAIData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAIData = async () => {
    try {
      const [insightsRes, analyticsRes] = await Promise.all([
        backendApi.get('/api/v1/ai/insights').catch(() => ({ data: mockInsights })),
        backendApi.get('/api/v1/ai/analytics').catch(() => ({ data: mockAnalytics }))
      ]);

      setInsights(insightsRes.data?.insights || mockInsights);
      setAnalytics(analyticsRes.data || mockAnalytics);
    } catch (error) {
      console.error('Error fetching AI data:', error);
      setInsights(mockInsights);
      setAnalytics(mockAnalytics);
    }
  };

  const startConversation = async () => {
    try {
      setIsLoading(true);
      const response = await backendApi.post('/api/v1/ai/conversations', {
        user_id: 'user_1',
        mode: selectedMode,
        personality: selectedPersonality
      }).catch(() => ({
        data: {
          session_id: 'mock_session_' + Date.now(),
          mode: selectedMode,
          personality: selectedPersonality,
          created_at: new Date().toISOString(),
          is_active: true
        }
      }));

      setCurrentSession(response.data);
      setMessages([]);
      
      // Add welcome message
      const welcomeMessage: ConversationMessage = {
        message_id: 'welcome_' + Date.now(),
        message_type: 'ai_response',
        content: getWelcomeMessage(selectedMode),
        timestamp: new Date().toISOString(),
        confidence_score: 1.0
      };
      setMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    const userMessage: ConversationMessage = {
      message_id: 'user_' + Date.now(),
      message_type: 'user_query',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await backendApi.post(`/api/v1/ai/conversations/${currentSession.session_id}/messages`, {
        message: inputMessage,
        user_id: 'user_1'
      }).catch(() => ({
        data: {
          message_id: 'ai_' + Date.now(),
          content: generateMockResponse(inputMessage, selectedMode),
          timestamp: new Date().toISOString(),
          confidence_score: 0.85
        }
      }));

      const aiMessage: ConversationMessage = {
        message_id: response.data.message_id,
        message_type: 'ai_response',
        content: response.data.content,
        timestamp: response.data.timestamp,
        confidence_score: response.data.confidence_score
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWelcomeMessage = (mode: string) => {
    const welcomeMessages = {
      trading_assistant: "Hello! I'm your AI trading assistant. I'm here to help you analyze markets, review your portfolio, and make informed trading decisions. How can I assist you today?",
      market_analysis: "Welcome to market analysis mode! I'll help you stay on top of market trends, identify opportunities, and understand what's driving price movements. What would you like to explore?",
      strategy_advisor: "I'm your strategy advisor, ready to help optimize your trading approach. Whether you want to refine existing strategies or explore new ones, I can provide data-driven recommendations. What's your current focus?",
      risk_counselor: "As your risk counselor, I'm here to help you understand and manage portfolio risk. I can analyze your exposure, identify potential risks, and suggest protective measures. How can I assist?",
      education_tutor: "Welcome to your personal trading education session! I'm here to explain concepts, answer questions, and help you build stronger trading knowledge. What would you like to learn about?",
      general_chat: "Hello! I'm here to chat about markets, trading, and investing. Feel free to ask me anything. What's on your mind?"
    };
    return welcomeMessages[mode as keyof typeof welcomeMessages] || welcomeMessages.general_chat;
  };

  const generateMockResponse = (input: string, mode: string) => {
    const responses = {
      trading_assistant: `Based on your question about "${input}", I can see you're interested in trading analysis. The current market conditions suggest a cautious but optimistic approach. Consider diversifying your portfolio and monitoring key resistance levels.`,
      market_analysis: `Analyzing the market in relation to "${input}" - I'm seeing mixed signals with strong volume patterns. The technical indicators suggest potential upward momentum, but watch for any sudden reversals.`,
      strategy_advisor: `Regarding "${input}", I recommend implementing a balanced approach with proper risk management. Consider using position sizing rules and stop-losses to protect your capital.`,
      risk_counselor: `Your question about "${input}" touches on important risk considerations. I'd recommend reviewing your portfolio allocation and ensuring you're not overexposed to any single asset or sector.`,
      education_tutor: `Great question about "${input}"! Let me explain this concept step by step. This is fundamental to understanding how markets work and will help you make better trading decisions.`,
      general_chat: `That's an interesting point about "${input}". In the context of trading and investing, this relates to broader market dynamics and investor psychology.`
    };
    return responses[mode as keyof typeof responses] || responses.general_chat;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const mockInsights: AIInsight[] = [
    {
      insight_id: "insight_1",
      category: "market_analysis",
      title: "Bitcoin Bullish Momentum Continuation",
      content: "Technical analysis indicates Bitcoin is forming a bull flag pattern on the 4-hour chart. The pattern suggests potential upside to $72,000 level.",
      confidence: 0.84,
      risk_level: "medium",
      recommended_actions: ["Consider long position with tight stop-loss", "Monitor volume confirmation on breakout"],
      created_at: new Date().toISOString()
    },
    {
      insight_id: "insight_2",
      category: "portfolio_optimization",
      title: "Rebalancing Opportunity Detected",
      content: "Your portfolio allocation has drifted from target weights due to crypto outperformance. Consider rebalancing to lock in gains.",
      confidence: 0.91,
      risk_level: "low",
      recommended_actions: ["Sell 5% of crypto positions", "Increase stock allocation by 5%"],
      created_at: new Date().toISOString()
    }
  ];

  const mockAnalytics = {
    conversation_metrics: {
      total_sessions: 15,
      active_sessions: 3,
      total_messages: 245,
      average_confidence: 0.87
    },
    ai_performance: {
      response_accuracy: 0.89,
      user_feedback_positive: 0.86,
      knowledge_coverage: 0.92
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Eliza AI Assistant</h3>
          <p className="text-muted-foreground">Phase 16: Advanced AI conversation and insights</p>
        </div>
        <Button onClick={fetchAIData} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      AI Conversation
                    </CardTitle>
                    {currentSession && (
                      <Badge variant="outline">
                        {personalities.find(p => p.value === currentSession.personality)?.label} • 
                        {conversationModes.find(m => m.value === currentSession.mode)?.label}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messages.map((message) => (
                      <div
                        key={message.message_id}
                        className={`flex ${message.message_type === 'user_query' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.message_type === 'user_query'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.message_type === 'ai_response' && (
                              <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                            )}
                            {message.message_type === 'user_query' && (
                              <User className="h-4 w-4 mt-1 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm">{message.content}</p>
                              {message.confidence_score && (
                                <p className="text-xs opacity-70 mt-1">
                                  Confidence: {(message.confidence_score * 100).toFixed(0)}%
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={!currentSession || isLoading}
                    />
                    <Button onClick={sendMessage} disabled={!currentSession || isLoading || !inputMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Start New Conversation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Mode</label>
                    <Select value={selectedMode} onValueChange={setSelectedMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conversationModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Personality</label>
                    <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {personalities.map((personality) => (
                          <SelectItem key={personality.value} value={personality.value}>
                            {personality.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={startConversation} className="w-full" disabled={isLoading}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Conversation
                  </Button>
                </CardContent>
              </Card>

              {analytics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Session Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Sessions</span>
                      <span className="font-medium">{analytics.conversation_metrics?.total_sessions || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Sessions</span>
                      <span className="font-medium">{analytics.conversation_metrics?.active_sessions || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Confidence</span>
                      <span className="font-medium">{((analytics.conversation_metrics?.average_confidence || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <Card key={insight.insight_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={insight.risk_level === 'low' ? 'default' : insight.risk_level === 'medium' ? 'secondary' : 'destructive'}>
                        {insight.risk_level}
                      </Badge>
                      <Badge variant="outline">
                        {(insight.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="capitalize">{insight.category.replace('_', ' ')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{insight.content}</p>
                  
                  <div>
                    <h5 className="font-medium text-sm mb-2">Recommended Actions:</h5>
                    <ul className="space-y-1">
                      {insight.recommended_actions.map((action, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 mt-1 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Sessions</span>
                  <span className="font-bold">{analytics?.conversation_metrics?.total_sessions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Messages</span>
                  <span className="font-bold">{analytics?.conversation_metrics?.total_messages || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Confidence</span>
                  <span className="font-bold">{((analytics?.conversation_metrics?.average_confidence || 0) * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Response Accuracy</span>
                  <span className="font-bold">{((analytics?.ai_performance?.response_accuracy || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Positive Feedback</span>
                  <span className="font-bold">{((analytics?.ai_performance?.user_feedback_positive || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Knowledge Coverage</span>
                  <span className="font-bold">{((analytics?.ai_performance?.knowledge_coverage || 0) * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}