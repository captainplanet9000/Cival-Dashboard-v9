import { NextRequest, NextResponse } from 'next/server';
import { backendApi } from '@/lib/api/backend-client';

// Fallback market data for when backend is unavailable
const getFallbackMarketData = () => {
  const symbols = [
    { symbol: 'BTC/USD', name: 'Bitcoin', basePrice: 43250.75 },
    { symbol: 'ETH/USD', name: 'Ethereum', basePrice: 2587.90 },
    { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 189.75 },
    { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 265.40 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', basePrice: 355.25 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', basePrice: 445.20 },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', basePrice: 425.80 }
  ];

  return symbols.map(stock => {
    const changePercent = (Math.random() - 0.5) * 6; // ±3% daily change
    const currentPrice = stock.basePrice * (1 + changePercent / 100);
    const change = currentPrice - stock.basePrice;
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    return {
      symbol: stock.symbol,
      name: stock.name,
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      change_pct: Math.round(changePercent * 100) / 100,
      volume,
      market_cap: Math.floor(Math.random() * 1000000000000) + 100000000000,
      last_updated: new Date().toISOString(),
    };
  });
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') || 'stocks';
    
    // Try to get real market data from backend
    let marketData;
    try {
      const marketResponse = await backendApi.getMarketOverview();
      if (marketResponse.data && marketResponse.data.market_data) {
        marketData = marketResponse.data.market_data.map((item: any) => ({
          symbol: item.symbol,
          name: item.symbol, // Backend might not have name, use symbol
          price: item.price,
          change: item.price * (item.change_pct / 100), // Calculate absolute change
          change_pct: item.change_pct,
          volume: item.volume,
          market_cap: item.market_cap,
          last_updated: item.last_updated || new Date().toISOString(),
        }));
        console.log('Using real market data from backend');
      } else {
        throw new Error('No market data in response');
      }
    } catch (error) {
      console.warn('Backend market data unavailable, using fallback:', error);
      marketData = getFallbackMarketData();
    }
    
    if (symbol) {
      const symbolData = marketData.find((s: any) => s.symbol === symbol.toUpperCase());
      if (!symbolData) {
        return NextResponse.json(
          { success: false, error: 'Symbol not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: symbolData,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Filter by type if needed
    let filteredData = marketData;
    if (type === 'crypto') {
      filteredData = marketData.filter((s: any) => s.symbol.includes('/USD') || s.symbol.includes('-USD'));
    } else if (type === 'stocks') {
      filteredData = marketData.filter((s: any) => !s.symbol.includes('/USD') && !s.symbol.includes('-USD'));
    }
    
    return NextResponse.json({
      success: true,
      data: filteredData,
      timestamp: new Date().toISOString(),
      marketStatus: {
        isOpen: new Date().getHours() >= 9 && new Date().getHours() < 16,
        nextOpen: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timezone: 'EST',
      },
    });
    
  } catch (error) {
    console.error('Market API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}