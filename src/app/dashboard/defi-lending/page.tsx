'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface LendingProtocol {
  id: string;
  name: string;
  logo: string;
  tvl: number;
  apy: number;
  collateralRatio: number;
  status: 'active' | 'paused' | 'deprecated';
  riskLevel: 'low' | 'medium' | 'high';
}

interface LendingPosition {
  id: string;
  protocol: string;
  asset: string;
  type: 'supply' | 'borrow';
  amount: number;
  valueUsd: number;
  apy: number;
  earned: number;
  healthFactor?: number;
}

const mockProtocols: LendingProtocol[] = [
  {
    id: 'aave',
    name: 'Aave V3',
    logo: '/protocols/aave.png',
    tvl: 12500000000,
    apy: 3.45,
    collateralRatio: 0.75,
    status: 'active',
    riskLevel: 'low'
  },
  {
    id: 'compound',
    name: 'Compound V3',
    logo: '/protocols/compound.png',
    tvl: 8200000000,
    apy: 2.89,
    collateralRatio: 0.80,
    status: 'active',
    riskLevel: 'low'
  },
  {
    id: 'makerdao',
    name: 'MakerDAO',
    logo: '/protocols/maker.png',
    tvl: 6800000000,
    apy: 4.12,
    collateralRatio: 0.70,
    status: 'active',
    riskLevel: 'medium'
  }
];

const mockPositions: LendingPosition[] = [
  {
    id: 'pos-1',
    protocol: 'Aave V3',
    asset: 'USDC',
    type: 'supply',
    amount: 50000,
    valueUsd: 50000,
    apy: 3.45,
    earned: 1247.50
  },
  {
    id: 'pos-2',
    protocol: 'Compound V3',
    asset: 'ETH',
    type: 'supply',
    amount: 25,
    valueUsd: 62500,
    apy: 2.89,
    earned: 892.30
  },
  {
    id: 'pos-3',
    protocol: 'MakerDAO',
    asset: 'DAI',
    type: 'borrow',
    amount: 30000,
    valueUsd: 30000,
    apy: 4.12,
    earned: -567.80,
    healthFactor: 2.45
  }
];

export default function DeFiLendingPage() {
  const [protocols] = useState<LendingProtocol[]>(mockProtocols);
  const [positions] = useState<LendingPosition[]>(mockPositions);

  const totalSupplied = positions
    .filter(p => p.type === 'supply')
    .reduce((sum, p) => sum + p.valueUsd, 0);
    
  const totalBorrowed = positions
    .filter(p => p.type === 'borrow')
    .reduce((sum, p) => sum + p.valueUsd, 0);
    
  const netEarnings = positions.reduce((sum, p) => sum + p.earned, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatLarge = (value: number) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return formatCurrency(value);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DeFi Lending</h1>
          <p className="text-muted-foreground">
            Optimize yield through decentralized lending and borrowing protocols
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Rates
          </Button>
          <Button>
            <Zap className="mr-2 h-4 w-4" />
            Quick Lend
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supplied</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalSupplied)}
            </div>
            <p className="text-xs text-muted-foreground">
              Earning yield
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalBorrowed)}
            </div>
            <p className="text-xs text-muted-foreground">
              Paying interest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            {netEarnings >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total P&L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Factor</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2.45</div>
            <p className="text-xs text-muted-foreground">
              Liquidation risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="positions">My Positions</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Lending Positions</CardTitle>
              <CardDescription>
                Your current DeFi lending and borrowing positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {positions.map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        position.type === 'supply' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {position.type === 'supply' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {position.type === 'supply' ? 'Supplying' : 'Borrowing'} {position.asset}
                        </div>
                        <div className="text-sm text-muted-foreground">{position.protocol}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-8 text-right">
                      <div>
                        <div className="text-sm text-muted-foreground">Amount</div>
                        <div className="font-medium">
                          {position.amount.toLocaleString()} {position.asset}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Value</div>
                        <div className="font-medium">{formatCurrency(position.valueUsd)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">APY</div>
                        <div className="font-medium">{position.apy}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Earned</div>
                        <div className={`font-medium ${position.earned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(position.earned)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protocols.map((protocol) => (
              <Card key={protocol.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      {protocol.name}
                    </CardTitle>
                    <Badge className={getRiskColor(protocol.riskLevel)}>
                      {protocol.riskLevel} risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">TVL</div>
                      <div className="font-medium">{formatLarge(protocol.tvl)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Best APY</div>
                      <div className="font-medium text-green-600">{protocol.apy}%</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Max LTV</div>
                    <div className="font-medium">{(protocol.collateralRatio * 100).toFixed(0)}%</div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" size="sm">
                      Supply
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      Borrow
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Yield Opportunities
              </CardTitle>
              <CardDescription>
                Optimized lending strategies based on current market conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-green-800">High Yield USDC Strategy</div>
                    <Badge className="bg-green-600 text-white">4.2% APY</Badge>
                  </div>
                  <div className="text-sm text-green-700 mb-3">
                    Supply USDC to Aave V3, borrow USDT at lower rate, re-supply for yield amplification
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-green-600">
                      Risk Level: Low • Est. Returns: $2,100/month
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Execute Strategy
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-blue-800">ETH Leverage Strategy</div>
                    <Badge className="bg-blue-600 text-white">6.8% APY</Badge>
                  </div>
                  <div className="text-sm text-blue-700 mb-3">
                    Supply ETH, borrow stable coins, purchase more ETH for leveraged exposure
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-blue-600">
                      Risk Level: Medium • Est. Returns: $3,400/month
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Execute Strategy
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-yellow-800">Arbitrage Opportunity</div>
                    <Badge className="bg-yellow-600 text-white">2.3% Spread</Badge>
                  </div>
                  <div className="text-sm text-yellow-700 mb-3">
                    Rate difference between Compound and Aave creates arbitrage opportunity
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-yellow-600">
                      Risk Level: Low • Est. Profit: $1,150 (one-time)
                    </div>
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      Execute Arbitrage
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Warning */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-medium text-orange-800 mb-1">Risk Disclaimer</div>
                  <div className="text-sm text-orange-700">
                    DeFi lending involves smart contract risks, liquidation risks, and potential impermanent loss. 
                    Always monitor your health factor and understand the risks before participating in lending protocols.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}