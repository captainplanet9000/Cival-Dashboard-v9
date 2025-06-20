"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { getDefaultWebSocketClient, WebSocketMessage } from './websocket-client';

export interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  autoConnect?: boolean;
}

export interface WebSocketState {
  isConnected: boolean;
  connectionState: string;
  lastMessage: WebSocketMessage | null;
  error: string | null;
}

export function useWebSocket(
  eventTypes: string[] = [],
  options: UseWebSocketOptions = {}
) {
  const {
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionState: 'disconnected',
    lastMessage: null,
    error: null
  });

  const clientRef = useRef(getDefaultWebSocketClient());
  const subscribedEventsRef = useRef<Set<string>>(new Set());
  const messageHandlersRef = useRef<Map<string, ((message: WebSocketMessage) => void)[]>>(new Map());

  // Subscribe to specific event types
  const subscribe = useCallback((eventType: string, handler: (message: WebSocketMessage) => void) => {
    if (!messageHandlersRef.current.has(eventType)) {
      messageHandlersRef.current.set(eventType, []);
    }
    messageHandlersRef.current.get(eventType)!.push(handler);

    // Send subscription message to server
    if (clientRef.current.isConnected && !subscribedEventsRef.current.has(eventType)) {
      clientRef.current.send('subscribe', { events: [eventType] });
      subscribedEventsRef.current.add(eventType);
    }

    return () => {
      const handlers = messageHandlersRef.current.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }, []);

  // Unsubscribe from event types
  const unsubscribe = useCallback((eventType: string) => {
    messageHandlersRef.current.delete(eventType);
    if (subscribedEventsRef.current.has(eventType)) {
      clientRef.current.send('unsubscribe', { events: [eventType] });
      subscribedEventsRef.current.delete(eventType);
    }
  }, []);

  // Send message to server
  const sendMessage = useCallback((type: string, data: any = {}) => {
    return clientRef.current.send(type, data);
  }, []);

  // Connect manually
  const connect = useCallback(async () => {
    try {
      await clientRef.current.connect();
      
      // Subscribe to initial event types
      if (eventTypes.length > 0) {
        clientRef.current.send('subscribe', { events: eventTypes });
        eventTypes.forEach(eventType => subscribedEventsRef.current.add(eventType));
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [eventTypes]);

  // Disconnect manually
  const disconnect = useCallback(() => {
    clientRef.current.disconnect();
    subscribedEventsRef.current.clear();
  }, []);

  // Setup event handlers
  useEffect(() => {
    const client = clientRef.current;

    // Connection handlers
    const handleConnect = () => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionState: 'connected',
        error: null
      }));

      // Subscribe to initial event types
      if (eventTypes.length > 0) {
        client.send('subscribe', { events: eventTypes });
        eventTypes.forEach(eventType => subscribedEventsRef.current.add(eventType));
      }
    };

    const handleDisconnect = () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionState: 'disconnected'
      }));
      subscribedEventsRef.current.clear();
    };

    const handleError = (error: Event) => {
      setState(prev => ({
        ...prev,
        error: error.toString()
      }));
    };

    // Message handler
    const handleMessage = (message: WebSocketMessage) => {
      setState(prev => ({
        ...prev,
        lastMessage: message
      }));

      // Call specific handlers
      const handlers = messageHandlersRef.current.get(message.type) || [];
      const allHandlers = messageHandlersRef.current.get('*') || [];
      
      [...handlers, ...allHandlers].forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    };

    // Register handlers
    const unsubscribeConnect = client.onConnect(handleConnect);
    const unsubscribeDisconnect = client.onDisconnect(handleDisconnect);
    const unsubscribeError = client.onError(handleError);
    const unsubscribeMessage = client.on('*', handleMessage);

    // Auto-connect if enabled
    if (autoConnect && !client.isConnected) {
      connect();
    }

    // Update connection state
    setState(prev => ({
      ...prev,
      isConnected: client.isConnected,
      connectionState: client.connectionState
    }));

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
      unsubscribeMessage();
    };
  }, [eventTypes, autoConnect, connect]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendMessage,
    connect,
    disconnect
  };
}

// Hook for specific event types with type safety
export function useWebSocketEvent<T = any>(
  eventType: string,
  handler: (data: T) => void,
  options: UseWebSocketOptions = {}
) {
  const [lastData, setLastData] = useState<T | null>(null);
  
  const webSocket = useWebSocket([eventType], options);

  useEffect(() => {
    const unsubscribe = webSocket.subscribe(eventType, (message: WebSocketMessage) => {
      setLastData(message.data);
      handler(message.data);
    });

    return unsubscribe;
  }, [eventType, handler, webSocket]);

  return {
    ...webSocket,
    lastData
  };
}

// Specific hooks for different data types
export function usePriceUpdates(symbols: string[] = []) {
  const [prices, setPrices] = useState<Record<string, any>>({});
  
  useWebSocketEvent('price_update', (data: { prices: Record<string, any> }) => {
    setPrices(prev => ({ ...prev, ...data.prices }));
  });

  return prices;
}

export function usePortfolioUpdates() {
  const [portfolio, setPortfolio] = useState<any>(null);
  
  useWebSocketEvent('portfolio_update', setPortfolio);

  return portfolio;
}

export function useAgentStatus() {
  const [agents, setAgents] = useState<any[]>([]);
  
  useWebSocketEvent('agent_status', (data: { agents: any[] }) => {
    setAgents(data.agents);
  });

  return agents;
}

export function useGoalProgress() {
  const [goals, setGoals] = useState<any[]>([]);
  
  useWebSocketEvent('goal_progress', (data: { goals: any[] }) => {
    setGoals(data.goals);
  });

  return goals;
}

export function useFarmStatus() {
  const [farms, setFarms] = useState<any[]>([]);
  
  useWebSocketEvent('farm_status', (data: { farms: any[] }) => {
    setFarms(data.farms);
  });

  return farms;
}

export function useVaultBalances() {
  const [vaults, setVaults] = useState<any[]>([]);
  
  useWebSocketEvent('vault_balance', (data: { vaults: any[] }) => {
    setVaults(data.vaults);
  });

  return vaults;
}

export function useRiskMetrics() {
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  
  useWebSocketEvent('risk_metrics', setRiskMetrics);

  return riskMetrics;
}

export function useMarketSummary() {
  const [marketSummary, setMarketSummary] = useState<any>(null);
  
  useWebSocketEvent('market_summary', setMarketSummary);

  return marketSummary;
}