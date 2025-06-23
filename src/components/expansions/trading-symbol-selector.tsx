"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import { MultipleSelector, Option } from "./multiple-selector";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TradingSymbol extends Option {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  exchange?: string;
  sector?: string;
  type?: "stock" | "crypto" | "forex" | "commodity" | "etf";
}

interface TradingSymbolSelectorProps {
  value?: TradingSymbol[];
  onChange?: (symbols: TradingSymbol[]) => void;
  placeholder?: string;
  maxSelected?: number;
  disabled?: boolean;
  watchlistMode?: boolean;
  onSearch?: (query: string) => Promise<TradingSymbol[]>;
  className?: string;
}

const TradingSymbolSelector = ({
  value,
  onChange,
  placeholder = "Search symbols...",
  maxSelected = 50,
  disabled,
  watchlistMode = false,
  onSearch,
  className,
}: TradingSymbolSelectorProps) => {
  const [symbols, setSymbols] = React.useState<TradingSymbol[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Mock data for demo purposes
  const mockSymbols: TradingSymbol[] = [
    {
      value: "AAPL",
      label: "AAPL",
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 185.25,
      change: 2.15,
      changePercent: 1.17,
      volume: 45230000,
      marketCap: 2850000000000,
      exchange: "NASDAQ",
      sector: "Technology",
      type: "stock",
      group: "Tech Stocks"
    },
    {
      value: "GOOGL",
      label: "GOOGL",
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: 141.80,
      change: -1.25,
      changePercent: -0.87,
      volume: 28450000,
      marketCap: 1780000000000,
      exchange: "NASDAQ",
      sector: "Technology",
      type: "stock",
      group: "Tech Stocks"
    },
    {
      value: "BTC-USD",
      label: "BTC-USD",
      symbol: "BTC-USD",
      name: "Bitcoin",
      price: 43250.75,
      change: 1250.30,
      changePercent: 2.98,
      volume: 125000000,
      exchange: "Crypto",
      type: "crypto",
      group: "Cryptocurrency"
    },
    {
      value: "ETH-USD",
      label: "ETH-USD",
      symbol: "ETH-USD",
      name: "Ethereum",
      price: 2680.45,
      change: -85.20,
      changePercent: -3.08,
      volume: 85000000,
      exchange: "Crypto",
      type: "crypto",
      group: "Cryptocurrency"
    },
    {
      value: "EUR/USD",
      label: "EUR/USD",
      symbol: "EUR/USD",
      name: "Euro / US Dollar",
      price: 1.0875,
      change: 0.0025,
      changePercent: 0.23,
      exchange: "Forex",
      type: "forex",
      group: "Major Currencies"
    },
    {
      value: "GLD",
      label: "GLD",
      symbol: "GLD",
      name: "SPDR Gold Trust",
      price: 192.50,
      change: 0.75,
      changePercent: 0.39,
      volume: 8500000,
      exchange: "NYSE",
      type: "etf",
      group: "Commodities"
    }
  ];

  const handleSearch = async (query: string): Promise<TradingSymbol[]> => {
    if (onSearch) {
      setIsLoading(true);
      try {
        const results = await onSearch(query);
        return results;
      } finally {
        setIsLoading(false);
      }
    }

    // Mock search implementation
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = mockSymbols.filter(
          (symbol) =>
            symbol.symbol.toLowerCase().includes(query.toLowerCase()) ||
            symbol.name.toLowerCase().includes(query.toLowerCase())
        );
        setIsLoading(false);
        resolve(filtered);
      }, 500);
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(price < 1 ? 6 : 2)}`;
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const isNeutral = change === 0;
    
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs",
        isPositive ? "text-green-600" : isNeutral ? "text-gray-500" : "text-red-600"
      )}>
        {isNeutral ? (
          <Minus className="h-3 w-3" />
        ) : isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>{isPositive ? '+' : ''}{change.toFixed(2)}</span>
        <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
      </div>
    );
  };

  const CustomOption = ({ symbol }: { symbol: TradingSymbol }) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium">{symbol.symbol}</span>
          <Badge variant="outline" className="text-xs">
            {symbol.type?.toUpperCase()}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground truncate">
          {symbol.name}
        </span>
      </div>
      {symbol.price && (
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">
            {formatPrice(symbol.price)}
          </span>
          {symbol.change !== undefined && symbol.changePercent !== undefined && (
            formatChange(symbol.change, symbol.changePercent)
          )}
        </div>
      )}
    </div>
  );

  const LoadingIndicator = () => (
    <div className="flex items-center justify-center p-4">
      <Search className="h-4 w-4 animate-spin mr-2" />
      <span className="text-sm text-muted-foreground">Searching symbols...</span>
    </div>
  );

  const EmptyIndicator = () => (
    <div className="flex items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">No symbols found</span>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      <MultipleSelector
        value={value}
        onChange={onChange}
        onSearch={handleSearch}
        placeholder={placeholder}
        maxSelected={maxSelected}
        disabled={disabled}
        groupBy="group"
        loadingIndicator={LoadingIndicator}
        emptyIndicator={EmptyIndicator}
        delay={300}
        triggerSearchOnFocus={true}
        badgeClassName="bg-blue-100 text-blue-800 hover:bg-blue-200"
        className="min-h-[40px]"
        commandProps={{
          className: "max-h-[300px]"
        }}
      />
      
      {watchlistMode && value && value.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Watchlist Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {value.map((symbol) => (
              <div key={symbol.value} className="p-3 border rounded-lg bg-card">
                <CustomOption symbol={symbol} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { TradingSymbolSelector, type TradingSymbol };