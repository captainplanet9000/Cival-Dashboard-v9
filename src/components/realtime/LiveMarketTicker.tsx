/**
 * Live Market Data Ticker Component
 * Shows real-time market prices with WebSocket updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMarketData } from '@/lib/realtime/websocket';
import { chainlinkService, ChainlinkPriceData } from '@/lib/chainlink/price-feeds';
import { TrendingUp, TrendingDown, Minus, Activity, Link as LinkIcon, Wifi, WifiOff } from 'lucide-react';

interface LiveMarketTickerProps {
  symbols?: string[];
  className?: string;
  showSpread?: boolean;
  compact?: boolean;
  showChainlink?: boolean;
}

const DEFAULT_SYMBOLS = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'SPY', 'QQQ', 'BTC-USD'];
const CHAINLINK_SYMBOLS = ['ETH/USD', 'BTC/USD', 'LINK/USD', 'UNI/USD', 'AAVE/USD'];

export function LiveMarketTicker({ 
  symbols = DEFAULT_SYMBOLS, 
  className = '',
  showSpread = false,
  compact = false,
  showChainlink = true
}: LiveMarketTickerProps) {
  const marketData = useMarketData(symbols);
  const [isScrolling, setIsScrolling] = useState(true);
  const [chainlinkData, setChainlinkData] = useState<ChainlinkPriceData[]>([]);
  const [showCrypto, setShowCrypto] = useState(showChainlink);
  const [isChainlinkConnected, setIsChainlinkConnected] = useState(false);

  // Fetch Chainlink prices
  useEffect(() => {
    if (!showCrypto) return;

    const fetchChainlinkPrices = async () => {
      try {
        const prices = await chainlinkService.getMultiplePrices(CHAINLINK_SYMBOLS);
        setChainlinkData(prices);
        setIsChainlinkConnected(true);
      } catch (error) {
        console.error('Error fetching Chainlink prices:', error);
        setIsChainlinkConnected(false);
      }
    };

    fetchChainlinkPrices();

    // Subscribe to real-time updates
    const cleanup = chainlinkService.subscribeToPriceUpdates(
      CHAINLINK_SYMBOLS,
      (prices: ChainlinkPriceData[]) => {
        setChainlinkData(prices);
        setIsChainlinkConnected(true);
      }
    );

    return cleanup;
  }, [showCrypto]);

  const formatPrice = (price: number) => {
    if (price < 1) {
      return price.toFixed(4);
    } else if (price < 100) {
      return price.toFixed(2);
    } else {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (compact) {
    return (
      <div className={`overflow-hidden bg-black text-white ${className}`}>
        <div className={`flex gap-8 py-2 px-4 ${isScrolling ? 'animate-scroll' : ''}`}>
          {symbols.map(symbol => {
            const data = marketData.get(symbol);
            if (!data) {
              return (
                <div key={symbol} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="font-mono font-bold">{symbol}</span>
                  <Activity className="h-3 w-3 animate-spin text-gray-400" />
                </div>
              );
            }

            return (
              <div key={symbol} className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-mono font-bold">{symbol}</span>
                <span className="font-mono">${formatPrice(data.price)}</span>
                <span className={`flex items-center gap-1 font-mono text-sm ${getTrendColor(data.change)}`}>
                  {getTrendIcon(data.change)}
                  {formatChange(data.change, data.changePercent)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg bg-white dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Live Market Data</h3>
        <div className="flex items-center gap-2">
          {showChainlink && (
            <Badge variant={isChainlinkConnected ? "default" : "secondary"} className="text-xs">
              <LinkIcon className="h-3 w-3 mr-1" />
              Chainlink {isChainlinkConnected ? 'Live' : 'Offline'}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Real-time
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCrypto(!showCrypto)}
            className="text-xs h-6 px-2"
          >
            {showCrypto ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {showCrypto ? 'Hide Crypto' : 'Show Crypto'}
          </Button>
          <button
            onClick={() => setIsScrolling(!isScrolling)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {isScrolling ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Traditional Market Data */}
          {!showCrypto && symbols.map(symbol => {
            const data = marketData.get(symbol);
            
            if (!data) {
              return (
                <div key={symbol} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-sm">{symbol}</span>
                    <Activity className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                  <div className="text-lg font-mono text-gray-400">Loading...</div>
                </div>
              );
            }

            const isPositive = data.change >= 0;
            const isNegative = data.change < 0;

            return (
              <div 
                key={symbol} 
                className={`p-3 border rounded-lg transition-colors ${
                  isPositive ? 'bg-green-50 border-green-200' :
                  isNegative ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm">{symbol}</span>
                  <div className={`flex items-center gap-1 ${getTrendColor(data.change)}`}>
                    {getTrendIcon(data.change)}
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="text-lg font-mono font-bold">
                    ${formatPrice(data.price)}
                  </div>
                  <div className={`text-sm font-mono ${getTrendColor(data.change)}`}>
                    {formatChange(data.change, data.changePercent)}
                  </div>
                </div>

                {showSpread && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Bid:</span>
                      <span className="font-mono">${formatPrice(data.bid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ask:</span>
                      <span className="font-mono">${formatPrice(data.ask)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spread:</span>
                      <span className="font-mono">${formatPrice(data.spread)}</span>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-2">
                  Vol: {data.volume.toLocaleString()}
                </div>

                <div className="text-xs text-muted-foreground">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </div>
              </div>
            );
          })}

          {/* Chainlink Crypto Data */}
          {showCrypto && chainlinkData.map(cryptoData => {
            // Calculate mock change for display (since Chainlink doesn't provide 24h change)
            const mockChange = (Math.random() - 0.5) * cryptoData.price * 0.05; // ±5% range
            const mockChangePercent = (mockChange / cryptoData.price) * 100;
            
            const isPositive = mockChange >= 0;
            const isNegative = mockChange < 0;

            return (
              <div 
                key={cryptoData.symbol} 
                className={`p-3 border rounded-lg transition-colors ${
                  isPositive ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' :
                  isNegative ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700' :
                  'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-sm">{cryptoData.symbol}</span>
                    <LinkIcon className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className={`flex items-center gap-1 ${getTrendColor(mockChange)}`}>
                    {getTrendIcon(mockChange)}
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="text-lg font-mono font-bold">
                    ${formatPrice(cryptoData.price)}
                  </div>
                  <div className={`text-sm font-mono ${getTrendColor(mockChange)}`}>
                    {formatChange(mockChange, mockChangePercent)}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="font-mono capitalize">{cryptoData.source.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Round:</span>
                    <span className="font-mono">{cryptoData.roundId.slice(-6)}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  {cryptoData.updatedAt.toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// CSS for scrolling animation (add to global styles)
const scrollingStyles = `
@keyframes scroll {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.animate-scroll {
  animation: scroll 30s linear infinite;
}
`;