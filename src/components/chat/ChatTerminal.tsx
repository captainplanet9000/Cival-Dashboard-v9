"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Terminal, Bot, User, Loader, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useWebSocket } from '@/lib/websocket/useWebSocket';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  agent_id?: string;
  agent_name?: string;
  type?: 'text' | 'command' | 'response' | 'error' | 'success';
  metadata?: {
    execution_time?: number;
    context?: string;
    parameters?: Record<string, any>;
  };
}

interface ChatCommand {
  command: string;
  description: string;
  parameters?: string[];
  example?: string;
}

const AVAILABLE_COMMANDS: ChatCommand[] = [
  {
    command: '/help',
    description: 'Show available commands',
    example: '/help'
  },
  {
    command: '/status',
    description: 'Get system status',
    example: '/status'
  },
  {
    command: '/agents',
    description: 'List all agents',
    example: '/agents'
  },
  {
    command: '/portfolio',
    description: 'Get portfolio summary',
    example: '/portfolio'
  },
  {
    command: '/trade',
    description: 'Execute a trade',
    parameters: ['symbol', 'side', 'amount'],
    example: '/trade BTCUSDT buy 0.01'
  },
  {
    command: '/goals',
    description: 'Manage goals',
    parameters: ['action', 'goal_name'],
    example: '/goals create "Monthly profit target"'
  },
  {
    command: '/risk',
    description: 'Get risk metrics',
    example: '/risk'
  },
  {
    command: '/ask',
    description: 'Ask an agent a question',
    parameters: ['agent_name', 'question'],
    example: '/ask Marcus "What is your current strategy?"'
  },
  {
    command: '/farms',
    description: 'Get farm status',
    example: '/farms'
  },
  {
    command: '/vault',
    description: 'Vault operations',
    parameters: ['action'],
    example: '/vault balance'
  }
];

export default function ChatTerminal() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'AG-UI Chat Terminal initialized. Type /help for available commands.',
      sender: 'system',
      timestamp: new Date(),
      type: 'success'
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // WebSocket integration for real-time agent communication
  const webSocket = useWebSocket(['agent_communication', 'agent_response'], {
    autoConnect: true
  });

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle WebSocket messages
  useEffect(() => {
    const unsubscribe = webSocket.subscribe('agent_communication', (message) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message.data.content,
        sender: 'agent',
        timestamp: new Date(),
        agent_id: message.data.agent_id,
        agent_name: message.data.agent_name,
        type: 'response'
      };
      setMessages(prev => [...prev, newMessage]);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [webSocket]);

  // Send message to backend
  const sendToBackend = async (content: string, type: 'command' | 'message' = 'message') => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/v1/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending to backend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Command processors
  const processCommand = async (command: string, args: string[]): Promise<ChatMessage> => {
    const startTime = Date.now();
    
    try {
      switch (command) {
        case '/help':
          return {
            id: Date.now().toString(),
            content: `Available Commands:\n\n${AVAILABLE_COMMANDS.map(cmd => 
              `${cmd.command} - ${cmd.description}${cmd.example ? `\nExample: ${cmd.example}` : ''}`
            ).join('\n\n')}`,
            sender: 'system',
            timestamp: new Date(),
            type: 'text',
            metadata: { execution_time: Date.now() - startTime }
          };

        case '/status':
          const statusResponse = await sendToBackend('/status', 'command');
          return {
            id: Date.now().toString(),
            content: statusResponse.success 
              ? `System Status: ${JSON.stringify(statusResponse.data, null, 2)}`
              : `Error: ${statusResponse.error}`,
            sender: 'system',
            timestamp: new Date(),
            type: statusResponse.success ? 'success' : 'error',
            metadata: { execution_time: Date.now() - startTime }
          };

        case '/agents':
          const agentsResponse = await sendToBackend('/agents', 'command');
          return {
            id: Date.now().toString(),
            content: agentsResponse.success 
              ? `Active Agents:\n${JSON.stringify(agentsResponse.data, null, 2)}`
              : `Error: ${agentsResponse.error}`,
            sender: 'system',
            timestamp: new Date(),
            type: agentsResponse.success ? 'success' : 'error',
            metadata: { execution_time: Date.now() - startTime }
          };

        case '/portfolio':
          const portfolioResponse = await sendToBackend('/portfolio', 'command');
          return {
            id: Date.now().toString(),
            content: portfolioResponse.success 
              ? `Portfolio Summary:\n${JSON.stringify(portfolioResponse.data, null, 2)}`
              : `Error: ${portfolioResponse.error}`,
            sender: 'system',
            timestamp: new Date(),
            type: portfolioResponse.success ? 'success' : 'error',
            metadata: { execution_time: Date.now() - startTime }
          };

        case '/trade':
          if (args.length < 3) {
            return {
              id: Date.now().toString(),
              content: 'Error: /trade requires symbol, side, and amount. Example: /trade BTCUSDT buy 0.01',
              sender: 'system',
              timestamp: new Date(),
              type: 'error',
              metadata: { execution_time: Date.now() - startTime }
            };
          }
          
          const tradeResponse = await sendToBackend(`/trade ${args.join(' ')}`, 'command');
          return {
            id: Date.now().toString(),
            content: tradeResponse.success 
              ? `Trade executed: ${JSON.stringify(tradeResponse.data, null, 2)}`
              : `Trade failed: ${tradeResponse.error}`,
            sender: 'system',
            timestamp: new Date(),
            type: tradeResponse.success ? 'success' : 'error',
            metadata: { execution_time: Date.now() - startTime }
          };

        case '/goals':
          const goalsResponse = await sendToBackend(`/goals ${args.join(' ')}`, 'command');
          return {
            id: Date.now().toString(),
            content: goalsResponse.success 
              ? `Goals: ${JSON.stringify(goalsResponse.data, null, 2)}`
              : `Error: ${goalsResponse.error}`,
            sender: 'system',
            timestamp: new Date(),
            type: goalsResponse.success ? 'success' : 'error',
            metadata: { execution_time: Date.now() - startTime }
          };

        case '/risk':
          const riskResponse = await sendToBackend('/risk', 'command');
          return {
            id: Date.now().toString(),
            content: riskResponse.success 
              ? `Risk Metrics:\n${JSON.stringify(riskResponse.data, null, 2)}`
              : `Error: ${riskResponse.error}`,
            sender: 'system',
            timestamp: new Date(),
            type: riskResponse.success ? 'success' : 'error',
            metadata: { execution_time: Date.now() - startTime }
          };

        case '/ask':
          if (args.length < 2) {
            return {
              id: Date.now().toString(),
              content: 'Error: /ask requires agent name and question. Example: /ask Marcus "What is your strategy?"',
              sender: 'system',
              timestamp: new Date(),
              type: 'error',
              metadata: { execution_time: Date.now() - startTime }
            };
          }
          
          const agentName = args[0];
          const question = args.slice(1).join(' ').replace(/"/g, '');
          
          // Send via WebSocket for real-time agent communication
          webSocket.sendMessage('agent_communication', {
            agent_name: agentName,
            question: question,
            type: 'question'
          });
          
          return {
            id: Date.now().toString(),
            content: `Asking ${agentName}: "${question}"...`,
            sender: 'system',
            timestamp: new Date(),
            type: 'text',
            metadata: { execution_time: Date.now() - startTime }
          };

        case '/farms':
          const farmsResponse = await sendToBackend('/farms', 'command');
          return {
            id: Date.now().toString(),
            content: farmsResponse.success 
              ? `Farm Status:\n${JSON.stringify(farmsResponse.data, null, 2)}`
              : `Error: ${farmsResponse.error}`,
            sender: 'system',
            timestamp: new Date(),
            type: farmsResponse.success ? 'success' : 'error',
            metadata: { execution_time: Date.now() - startTime }
          };

        case '/vault':
          const vaultResponse = await sendToBackend(`/vault ${args.join(' ')}`, 'command');
          return {
            id: Date.now().toString(),
            content: vaultResponse.success 
              ? `Vault Info:\n${JSON.stringify(vaultResponse.data, null, 2)}`
              : `Error: ${vaultResponse.error}`,
            sender: 'system',
            timestamp: new Date(),
            type: vaultResponse.success ? 'success' : 'error',
            metadata: { execution_time: Date.now() - startTime }
          };

        default:
          return {
            id: Date.now().toString(),
            content: `Unknown command: ${command}. Type /help for available commands.`,
            sender: 'system',
            timestamp: new Date(),
            type: 'error',
            metadata: { execution_time: Date.now() - startTime }
          };
      }
    } catch (error) {
      return {
        id: Date.now().toString(),
        content: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'error',
        metadata: { execution_time: Date.now() - startTime }
      };
    }
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const content = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setShowSuggestions(false);

    // Add command to history
    setCommandHistory(prev => [content, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: content.startsWith('/') ? 'command' : 'text'
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (content.startsWith('/')) {
        // Handle command
        const parts = content.slice(1).split(' ');
        const command = '/' + parts[0];
        const args = parts.slice(1);
        
        const response = await processCommand(command, args);
        setMessages(prev => [...prev, response]);
      } else {
        // Handle regular message - send to LLM
        const response = await sendToBackend(content, 'message');
        
        const responseMessage: ChatMessage = {
          id: Date.now().toString(),
          content: response.success 
            ? response.data.response || 'No response from agent'
            : `Error: ${response.error}`,
          sender: 'agent',
          timestamp: new Date(),
          type: response.success ? 'response' : 'error',
          agent_name: response.data?.agent_name || 'Assistant'
        };
        setMessages(prev => [...prev, responseMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(newIndex === -1 ? '' : commandHistory[newIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setShowSuggestions(!showSuggestions);
    }
  };

  // Get suggestions based on input
  const getSuggestions = () => {
    if (!inputValue.startsWith('/')) return [];
    
    const partial = inputValue.toLowerCase();
    return AVAILABLE_COMMANDS.filter(cmd => 
      cmd.command.toLowerCase().startsWith(partial)
    );
  };

  // Message type icons and styling
  const getMessageIcon = (message: ChatMessage) => {
    switch (message.sender) {
      case 'user': return <User className="w-4 h-4" />;
      case 'agent': return <Bot className="w-4 h-4" />;
      case 'system': 
        if (message.type === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
        if (message.type === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
        return <Terminal className="w-4 h-4" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };

  const getMessageStyling = (message: ChatMessage) => {
    const base = "p-3 rounded-lg max-w-[80%] break-words";
    
    switch (message.sender) {
      case 'user':
        return `${base} bg-blue-600 text-white ml-auto`;
      case 'agent':
        return `${base} bg-gray-100 text-gray-900 mr-auto`;
      case 'system':
        if (message.type === 'error') return `${base} bg-red-50 text-red-900 border border-red-200 mr-auto`;
        if (message.type === 'success') return `${base} bg-green-50 text-green-900 border border-green-200 mr-auto`;
        return `${base} bg-gray-50 text-gray-700 border border-gray-200 mr-auto`;
      default:
        return `${base} bg-gray-100 text-gray-900 mr-auto`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">AG-UI Chat Terminal</h3>
          <div className={`w-2 h-2 rounded-full ${webSocket.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="text-xs text-gray-500">
          {webSocket.isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-1">
              {getMessageIcon(message)}
            </div>
            <div className="flex-1">
              <div className={getMessageStyling(message)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium opacity-75">
                    {message.agent_name || message.sender}
                  </span>
                  <span className="text-xs opacity-50">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {message.content}
                </div>
                {message.metadata?.execution_time && (
                  <div className="text-xs opacity-50 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {message.metadata.execution_time}ms
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2">
            <Loader className="w-4 h-4 animate-spin" />
            <div className="text-sm text-gray-500">Processing...</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && inputValue.startsWith('/') && (
        <div className="border-t border-gray-200 bg-gray-50 p-2 max-h-32 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-600 mb-2">Command Suggestions:</div>
          {getSuggestions().map((cmd, index) => (
            <div
              key={index}
              className="text-xs p-1 hover:bg-gray-100 cursor-pointer rounded"
              onClick={() => {
                setInputValue(cmd.command + ' ');
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
            >
              <span className="font-mono text-blue-600">{cmd.command}</span>
              <span className="text-gray-600 ml-2">{cmd.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or /help for commands..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Press Tab for suggestions, ↑/↓ for history
        </div>
      </form>
    </div>
  );
}