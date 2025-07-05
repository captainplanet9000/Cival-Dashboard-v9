/**
 * React hook for WebSocket real-time data updates
 * Provides real-time portfolio, agent, and market data
 */

import { useEffect, useState, useCallback } from 'react';
import { getDefaultWebSocketClient, WebSocketMessage } from '@/lib/websocket/websocket-client';

export interface RealTimePortfolioData {
  total_equity: number;
  daily_pnl: number;
  unrealized_pnl: number;
  last_updated: string;
}

export interface RealTimeAgentData {
  active_agents: number;
  total_trades: number;
  agents: Array<{
    name: string;
    status: string;
    last_action: string;
  }>;
}

export interface WebSocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastUpdate: string | null;
}

export function useWebSocketData() {
  const [portfolioData, setPortfolioData] = useState<RealTimePortfolioData | null>(null);
  const [agentData, setAgentData] = useState<RealTimeAgentData | null>(null);
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastUpdate: null
  });

  const updateConnectionState = useCallback((updates: Partial<WebSocketConnectionState>) => {
    setConnectionState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const wsClient = getDefaultWebSocketClient();
    
    // Update connection state
    updateConnectionState({ connecting: true, error: null });

    // Set up message handlers
    const unsubscribePortfolio = wsClient.on('portfolio_update', (message: WebSocketMessage) => {
      setPortfolioData(message.data);
      updateConnectionState({ lastUpdate: new Date().toISOString() });
    });

    const unsubscribeAgent = wsClient.on('agent_status_update', (message: WebSocketMessage) => {
      setAgentData(message.data);
      updateConnectionState({ lastUpdate: new Date().toISOString() });
    });

    const unsubscribePong = wsClient.on('pong', (message: WebSocketMessage) => {
      updateConnectionState({ lastUpdate: message.timestamp });
    });

    // Set up connection handlers
    const unsubscribeConnect = wsClient.onConnect(() => {
      updateConnectionState({ connected: true, connecting: false, error: null });
      console.log('WebSocket connected for real-time updates');
    });

    const unsubscribeDisconnect = wsClient.onDisconnect(() => {
      updateConnectionState({ connected: false, connecting: false });
      console.log('WebSocket disconnected');
    });

    const unsubscribeError = wsClient.onError((error: Event) => {
      updateConnectionState({ 
        connected: false, 
        connecting: false,
        error: 'WebSocket connection error'
      });
      console.error('WebSocket error:', error);
    });

    // Connect to WebSocket
    wsClient.connect()
      .then(() => {
        console.log('WebSocket connection established');
        // Subscribe to updates
        wsClient.send('subscribe', { subscription: 'portfolio' });
        wsClient.send('subscribe', { subscription: 'agents' });
      })
      .catch(error => {
        console.error('Failed to connect WebSocket:', error);
        updateConnectionState({ 
          connected: false, 
          connecting: false,
          error: 'Failed to connect to real-time data'
        });
      });

    // Cleanup on unmount
    return () => {
      unsubscribePortfolio();
      unsubscribeAgent();
      unsubscribePong();
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
    };
  }, [updateConnectionState]);

  // Manual reconnection
  const reconnect = useCallback(() => {
    const wsClient = getDefaultWebSocketClient();
    updateConnectionState({ connecting: true, error: null });
    wsClient.connect()
      .then(() => {
        wsClient.send('subscribe', { subscription: 'portfolio' });
        wsClient.send('subscribe', { subscription: 'agents' });
      })
      .catch(error => {
        console.error('Reconnection failed:', error);
        updateConnectionState({ 
          connected: false, 
          connecting: false,
          error: 'Reconnection failed'
        });
      });
  }, [updateConnectionState]);

  return {
    portfolioData,
    agentData,
    connectionState,
    reconnect
  };
}

// Hook specifically for portfolio updates
export function useRealTimePortfolio() {
  const { portfolioData, connectionState } = useWebSocketData();
  return { portfolioData, connectionState };
}

// Hook specifically for agent updates
export function useRealTimeAgents() {
  const { agentData, connectionState } = useWebSocketData();
  return { agentData, connectionState };
}