'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Vault,
  Shield,
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Settings,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Banknote,
  Activity,
  PieChart,
  Target,
  Loader2,
  RefreshCw
} from "lucide-react";
import { formatPrice, formatPercentage } from "@/lib/utils";
import { backendApi } from '@/lib/api/backend-client';
import { toast } from 'react-hot-toast';

// Type definitions for vault data
interface VaultData {
  vault_id: string;
  vault_name: string;
  vault_type: string;
  status: string;
  total_balance: number;
  available_balance: number;
  reserved_balance: number;
  parent_vault_id?: string;
  hierarchy_level: number;
  created_at: string;
  metadata?: any;
}

interface VaultTransaction {
  transaction_id: string;
  vault_id: string;
  transaction_type: string;
  asset_symbol: string;
  amount: number;
  status: string;
  created_at: string;
  from_vault_id?: string;
  to_vault_id?: string;
  metadata?: any;
}

interface VaultAllocation {
  allocation_id: string;
  vault_id: string;
  target_type: string;
  target_id: string;
  target_name: string;
  asset_symbol: string;
  allocated_amount: number;
  allocated_percentage: number;
  status: string;
  performance?: any;
}

interface VaultPerformance {
  vault_id: string;
  total_balance_usd: number;
  daily_pnl: number;
  cumulative_pnl: number;
  daily_return_pct: number;
  cumulative_return_pct: number;
  date: string;
}




function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'text-status-online';
    case 'locked': return 'text-status-warning';
    case 'pending': return 'text-blue-500';
    case 'completed': return 'text-status-online';
    case 'failed': return 'text-status-error';
    default: return 'text-muted-foreground';
  }
}

function getRiskColor(level: string) {
  switch (level) {
    case 'Minimal': return 'text-green-600';
    case 'Low': return 'text-status-online';
    case 'Medium': return 'text-status-warning';
    case 'High': return 'text-status-error';
    default: return 'text-muted-foreground';
  }
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'transfer': return <ArrowLeftRight className="h-4 w-4" />;
    case 'deposit': return <ArrowDownLeft className="h-4 w-4 text-status-online" />;
    case 'withdrawal': return <ArrowUpRight className="h-4 w-4 text-status-error" />;
    case 'yield': return <TrendingUp className="h-4 w-4 text-trading-profit" />;
    default: return <DollarSign className="h-4 w-4" />;
  }
}

export default function VaultPage() {
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [masterVault, setMasterVault] = useState<VaultData | null>(null);
  const [transactions, setTransactions] = useState<VaultTransaction[]>([]);
  const [allocations, setAllocations] = useState<VaultAllocation[]>([]);
  const [performance, setPerformance] = useState<Record<string, VaultPerformance>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load vault data on component mount
  useEffect(() => {
    loadVaultData();
  }, []);

  const loadVaultData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all vaults
      const vaultsResponse = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/vaults`
      );
      
      if (vaultsResponse.ok) {
        const vaultsData = await vaultsResponse.json();
        setVaults(vaultsData.vaults || []);
        
        // Find master vault (hierarchy_level = 0)
        const master = vaultsData.vaults?.find((v: VaultData) => v.hierarchy_level === 0);
        setMasterVault(master || null);
      } else {
        // Use fallback mock data
        const mockVaults = generateMockVaults();
        setVaults(mockVaults);
        setMasterVault(mockVaults.find(v => v.vault_type === 'master') || null);
      }

      // Load recent transactions
      const txResponse = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/vaults/transactions?limit=10`
      );
      
      if (txResponse.ok) {
        const txData = await txResponse.json();
        setTransactions(txData.transactions || []);
      } else {
        setTransactions(generateMockTransactions());
      }

      // Load allocations  
      const allocResponse = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/vaults/allocations`
      );
      
      if (allocResponse.ok) {
        const allocData = await allocResponse.json();
        setAllocations(allocData.allocations || []);
      } else {
        setAllocations([]);
      }

      // Load performance data
      const perfResponse = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/vaults/performance`
      );
      
      if (perfResponse.ok) {
        const perfData = await perfResponse.json();
        const perfMap: Record<string, VaultPerformance> = {};
        perfData.performance?.forEach((p: VaultPerformance) => {
          perfMap[p.vault_id] = p;
        });
        setPerformance(perfMap);
      }

    } catch (err) {
      console.error('Error loading vault data:', err);
      setError('Failed to load vault data');
      // Set fallback data
      const mockVaults = generateMockVaults();
      setVaults(mockVaults);
      setMasterVault(mockVaults.find(v => v.vault_type === 'master') || null);
      setTransactions(generateMockTransactions());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockVaults = (): VaultData[] => [
    {
      vault_id: "vault-master",
      vault_name: "Master Trading Vault",
      vault_type: "master",
      status: "active",
      total_balance: 1258473.25,
      available_balance: 270818.93,
      reserved_balance: 987654.32,
      hierarchy_level: 0,
      created_at: new Date().toISOString(),
      metadata: { complianceScore: 98, riskLevel: "Low" }
    },
    {
      vault_id: "vault-algo",
      vault_name: "Algorithmic Trading",
      vault_type: "strategy",
      status: "active",
      total_balance: 425847.50,
      available_balance: 27596.75,
      reserved_balance: 398250.75,
      parent_vault_id: "vault-master",
      hierarchy_level: 1,
      created_at: new Date().toISOString(),
      metadata: { riskLevel: "Medium", performance: 8.45, strategies: ["Darvas Box", "Elliott Wave"] }
    },
    {
      vault_id: "vault-defi",
      vault_name: "DeFi Operations",
      vault_type: "lending",
      status: "active",
      total_balance: 287954.12,
      available_balance: 12273.67,
      reserved_balance: 275680.45,
      parent_vault_id: "vault-master",
      hierarchy_level: 1,
      created_at: new Date().toISOString(),
      metadata: { riskLevel: "High", performance: 12.34, protocols: ["Uniswap V3", "Aave"] }
    }
  ];

  const generateMockTransactions = (): VaultTransaction[] => [
    {
      transaction_id: "tx1",
      vault_id: "vault-master",
      transaction_type: "transfer",
      asset_symbol: "USD",
      amount: 50000,
      status: "completed",
      created_at: new Date().toISOString(),
      from_vault_id: "vault-master",
      to_vault_id: "vault-algo",
      metadata: { purpose: "Strategy rebalancing" }
    },
    {
      transaction_id: "tx2",
      vault_id: "vault-defi",
      transaction_type: "deposit",
      asset_symbol: "USD",
      amount: 1234.56,
      status: "completed",
      created_at: new Date(Date.now() - 60000).toISOString(),
      metadata: { purpose: "Yield farming rewards" }
    }
  ];

  const createVault = async (vaultData: any) => {
    try {
      const response = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/vaults`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vaultData)
        }
      );
      
      if (response.ok) {
        const newVault = await response.json();
        setVaults([...vaults, newVault]);
        toast.success('Vault created successfully');
      } else {
        toast.error('Failed to create vault');
      }
    } catch (error) {
      console.error('Error creating vault:', error);
      toast.error('Failed to create vault');
    }
  };

  const transferFunds = async (fromVaultId: string, toVaultId: string, amount: number) => {
    try {
      const response = await backendApi.fetchWithTimeout(
        `${backendApi.getBackendUrl()}/api/v1/vaults/transfer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from_vault_id: fromVaultId,
            to_vault_id: toVaultId,
            asset_symbol: 'USD',
            amount: amount
          })
        }
      );
      
      if (response.ok) {
        toast.success('Transfer completed successfully');
        loadVaultData(); // Reload data
      } else {
        toast.error('Transfer failed');
      }
    } catch (error) {
      console.error('Error transferring funds:', error);
      toast.error('Transfer failed');
    }
  };

  // Get sub-vaults (hierarchy_level > 0)
  const subVaults = vaults.filter(v => v.hierarchy_level > 0);
  const totalAllocated = subVaults.reduce((sum, vault) => sum + vault.reserved_balance, 0);
  const totalBalance = masterVault?.total_balance || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading vault data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vault Banking</h1>
          <p className="text-muted-foreground">
            Multi-account management with hierarchical structure and DeFi integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Audit Trail
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Vault Settings
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Vault
          </Button>
        </div>
      </div>

                  {/* Master Vault Overview */}      <Card className="border-primary/20 bg-primary/5">        <CardHeader>          <div className="flex items-center justify-between">            <div className="flex items-center space-x-3">              <Vault className="h-6 w-6 text-primary" />              <CardTitle className="text-xl">{vaultHierarchy.masterVault.name}</CardTitle>              <Badge variant="default">{vaultHierarchy.masterVault.status.toUpperCase()}</Badge>            </div>            <div className="flex items-center space-x-3">              <Badge variant="secondary" className="flex items-center gap-1">                <Shield className="h-3 w-3" />                {vaultHierarchy.masterVault.complianceScore}% Compliant              </Badge>            </div>          </div>        </CardHeader>        <CardContent>          <div className="grid gap-4 md:grid-cols-4">            <StatCard              title="Total Balance"              value={formatPrice(vaultHierarchy.masterVault.balance)}              icon={<DollarSign className="h-4 w-4" />}              variant="info"            />            <StatCard              title="Allocated"              value={formatPrice(vaultHierarchy.masterVault.totalAllocated)}              description={`${formatPercentage((vaultHierarchy.masterVault.totalAllocated / vaultHierarchy.masterVault.balance))} of total`}              icon={<Target className="h-4 w-4" />}              variant="warning"            />            <StatCard              title="Available"              value={formatPrice(vaultHierarchy.masterVault.available)}              description="Ready to allocate"              icon={<Wallet className="h-4 w-4" />}              variant="profit"            />            <StatCard              title="Sub-Vaults"              value={vaultHierarchy.masterVault.subVaults}              description="Active portfolios"              icon={<PieChart className="h-4 w-4" />}              variant="default"            />          </div>                    {/* Allocation Progress */}          <div className="mt-6 space-y-2">            <div className="flex justify-between text-sm">              <span className="text-muted-foreground">Capital Allocation</span>              <span className="font-medium">                {formatPercentage((vaultHierarchy.masterVault.totalAllocated / vaultHierarchy.masterVault.balance))}              </span>            </div>            <Progress               value={(vaultHierarchy.masterVault.totalAllocated / vaultHierarchy.masterVault.balance) * 100}              className="h-3"            />          </div>        </CardContent>      </Card>

                  {/* Important Alerts */}      {complianceMetrics.pendingActions > 0 && (        <Alert variant="destructive">          <AlertCircle className="h-4 w-4" />          <AlertTitle>Compliance Action Required</AlertTitle>          <AlertDescription>            {complianceMetrics.pendingActions} compliance actions require immediate attention.             Review your vault settings and ensure all requirements are met.          </AlertDescription>        </Alert>      )}      {/* Sub-Vaults Grid */}      <div>        <div className="flex items-center justify-between mb-4">          <h2 className="text-xl font-semibold">Sub-Vault Portfolio</h2>          <Badge variant="secondary" className="flex items-center gap-1">            <Activity className="h-3 w-3" />            {vaultHierarchy.subVaults.filter(v => v.status === 'active').length} Active          </Badge>        </div>        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vaultHierarchy.subVaults.map((vault) => (
            <Card key={vault.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{vault.name}</CardTitle>
                  </div>
                                                      <div className="flex items-center space-x-2">                    {vault.status === 'locked' ?                       <Lock className="h-4 w-4 text-status-warning" /> :                       <Unlock className="h-4 w-4 text-status-online" />                    }                    <Badge variant={vault.status === 'active' ? 'default' : vault.status === 'locked' ? 'destructive' : 'secondary'}>                      {vault.type}                    </Badge>                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="font-semibold">{formatPrice(vault.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <span className="text-status-online">{formatPrice(vault.available)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Allocation</span>
                    <span>{formatPercentage(vault.allocation / 100)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Performance</span>
                    <span className={`font-semibold ${vault.performance > 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                      {vault.performance > 0 ? '+' : ''}{formatPercentage(vault.performance / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Risk Level</span>
                    <span className={`text-sm font-medium ${getRiskColor(vault.riskLevel)}`}>
                      {vault.riskLevel}
                    </span>
                  </div>
                </div>

                {vault.strategies && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">Active Strategies:</p>
                    <div className="flex flex-wrap gap-1">
                      {vault.strategies.slice(0, 2).map((strategy, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-muted rounded">
                          {strategy}
                        </span>
                      ))}
                      {vault.strategies.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-muted rounded">
                          +{vault.strategies.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {vault.protocols && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">DeFi Protocols:</p>
                    <div className="flex flex-wrap gap-1">
                      {vault.protocols.map((protocol, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {protocol}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {vault.purpose && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">Purpose:</p>
                    <p className="text-xs">{vault.purpose}</p>
                  </div>
                )}

                {vault.focus && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">Focus:</p>
                    <p className="text-xs">{vault.focus}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Transactions */}        <Card>          <CardHeader>            <CardTitle>Recent Transactions</CardTitle>            <CardDescription>              Cross-vault transfers and operations            </CardDescription>          </CardHeader>          <CardContent className="p-0">            <Table>              <TableHeader>                <TableRow>                  <TableHead>Type</TableHead>                  <TableHead>From/To</TableHead>                  <TableHead>Amount</TableHead>                  <TableHead>Status</TableHead>                  <TableHead>Time</TableHead>                </TableRow>              </TableHeader>              <TableBody>                {recentTransactions.map((tx) => (                  <TableRow key={tx.id}>                    <TableCell>                      <div className="flex items-center space-x-2">                        {getTransactionIcon(tx.type)}                        <span className="font-medium capitalize">{tx.type}</span>                      </div>                    </TableCell>                    <TableCell>                      <div className="space-y-1">                        <div className="text-sm font-medium">{tx.from} → {tx.to}</div>                        <div className="text-xs text-muted-foreground">{tx.purpose}</div>                      </div>                    </TableCell>                    <TableCell>                      <div className="font-semibold">{formatPrice(tx.amount)}</div>                    </TableCell>                    <TableCell>                      <Badge variant={                        tx.status === 'completed' ? 'success' :                         tx.status === 'pending' ? 'outline' :                         tx.status === 'failed' ? 'destructive' : 'secondary'                      }>                        {tx.status}                      </Badge>                    </TableCell>                    <TableCell>                      <div className="text-sm">                        {new Date(tx.timestamp).toLocaleTimeString()}                      </div>                      <div className="text-xs text-muted-foreground">                        {tx.reference}                      </div>                    </TableCell>                  </TableRow>                ))}              </TableBody>            </Table>          </CardContent>        </Card>

        {/* DeFi Protocol Integration */}
        <Card>
          <CardHeader>
            <CardTitle>DeFi Protocol Status</CardTitle>
            <CardDescription>
              Active DeFi integrations and yields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defiProtocols.map((protocol, index) => (
                <div key={index} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{protocol.name}</span>
                      <span className={`h-2 w-2 rounded-full ${getStatusColor(protocol.status)}`}></span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatPrice(protocol.tvl)} TVL</div>
                      <div className="text-xs text-trading-profit">{formatPercentage(protocol.apy / 100)} APY</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{protocol.positions} positions</span>
                    <span className="text-trading-profit">Last yield: {formatPrice(protocol.lastYield)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-muted-foreground">Risk Score: {protocol.riskScore}/10</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${
                          protocol.riskScore >= 8 ? 'bg-status-error' :
                          protocol.riskScore >= 6 ? 'bg-status-warning' : 'bg-status-online'
                        }`}
                        style={{ width: `${(protocol.riskScore / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance & Security */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance & Security</CardTitle>
          <CardDescription>
            Regulatory compliance and security monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Compliance Score</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-status-online">
                    {complianceMetrics.overallScore}%
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-status-online" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">KYC Compliance</span>
                  <span className="font-medium text-status-online">{complianceMetrics.kycCompliance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">AML Compliance</span>
                  <span className="font-medium text-status-online">{complianceMetrics.amlCompliance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Regulatory Compliance</span>
                  <span className="font-medium text-status-online">{complianceMetrics.regulatoryCompliance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Risk Assessment</span>
                  <span className="font-medium text-status-warning">{complianceMetrics.riskAssessment}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Last Audit</span>
                  <span className="text-sm text-muted-foreground">{complianceMetrics.lastAudit}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-status-online">{complianceMetrics.auditScore}%</span>
                  <span className="text-sm text-muted-foreground">Audit Score</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Next Audit</span>
                </div>
                <p className="text-sm text-blue-700">{complianceMetrics.nextAudit}</p>
              </div>

              {complianceMetrics.pendingActions > 0 && (
                <div className="p-3 rounded-lg border-l-4 border-l-status-warning bg-yellow-50">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-status-warning" />
                    <span className="font-medium">Pending Actions</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    {complianceMetrics.pendingActions} compliance actions require attention
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <ArrowLeftRight className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Transfer Funds</h3>
                <p className="text-sm text-muted-foreground">Move between vaults</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-status-online/20 rounded-lg">
                <ArrowDownLeft className="h-6 w-6 text-status-online" />
              </div>
              <div>
                <h3 className="font-semibold">Deposit</h3>
                <p className="text-sm text-muted-foreground">Add funds to vault</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">DeFi Yield</h3>
                <p className="text-sm text-muted-foreground">Manage DeFi positions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-status-warning/20 rounded-lg">
                <Shield className="h-6 w-6 text-status-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Security</h3>
                <p className="text-sm text-muted-foreground">Access controls</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}