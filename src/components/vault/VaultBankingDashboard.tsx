'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  Building, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Eye, 
  FileText, 
  Bell, 
  Settings, 
  Lock, 
  RefreshCw,
  CreditCard,
  Banknote,
  PiggyBank,
  Target,
  BarChart3,
  Activity,
  Globe,
  Zap
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface VaultAccount {
  id: string
  name: string
  type: 'checking' | 'savings' | 'investment' | 'trading'
  balance: number
  currency: string
  status: 'active' | 'frozen' | 'pending'
  lastActivity: Date
  monthlyGrowth: number
}

interface ComplianceStatus {
  kycStatus: 'verified' | 'pending' | 'rejected'
  amlStatus: 'compliant' | 'review' | 'alert'
  riskScore: number
  lastAssessment: Date
}

interface TransactionFlow {
  id: string
  type: 'deposit' | 'withdrawal' | 'transfer' | 'investment'
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  timestamp: Date
  description: string
  approvalRequired: boolean
}

export function VaultBankingDashboard() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isNewAccountDialogOpen, setIsNewAccountDialogOpen] = useState(false)
  const [transferForm, setTransferForm] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
    scheduledDate: ''
  })

  // Mock data - would be replaced with real vault banking API
  const [accounts] = useState<VaultAccount[]>([
    {
      id: 'acc-1',
      name: 'Primary Trading Account',
      type: 'trading',
      balance: 485000,
      currency: 'USD',
      status: 'active',
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      monthlyGrowth: 12.5
    },
    {
      id: 'acc-2',
      name: 'Yield Optimization Vault',
      type: 'investment',
      balance: 750000,
      currency: 'USD',
      status: 'active',
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
      monthlyGrowth: 8.7
    },
    {
      id: 'acc-3',
      name: 'Emergency Reserves',
      type: 'savings',
      balance: 150000,
      currency: 'USD',
      status: 'active',
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      monthlyGrowth: 2.1
    }
  ])

  const [complianceStatus] = useState<ComplianceStatus>({
    kycStatus: 'verified',
    amlStatus: 'compliant',
    riskScore: 25,
    lastAssessment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  })

  const [transactions] = useState<TransactionFlow[]>([
    {
      id: 'tx-1',
      type: 'deposit',
      amount: 50000,
      currency: 'USD',
      status: 'completed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      description: 'Wire transfer from JP Morgan',
      approvalRequired: false
    },
    {
      id: 'tx-2',
      type: 'investment',
      amount: 100000,
      currency: 'USD',
      status: 'pending',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      description: 'DeFi yield farming allocation',
      approvalRequired: true
    },
    {
      id: 'tx-3',
      type: 'transfer',
      amount: 25000,
      currency: 'USD',
      status: 'processing',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      description: 'Agent fund allocation',
      approvalRequired: false
    }
  ])

  // Portfolio performance data
  const performanceData = [
    { date: '2024-01', value: 1200000 },
    { date: '2024-02', value: 1250000 },
    { date: '2024-03', value: 1180000 },
    { date: '2024-04', value: 1320000 },
    { date: '2024-05', value: 1385000 },
    { date: '2024-06', value: 1385000 }
  ]

  const getTotalBalance = () => accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const getActiveAccounts = () => accounts.filter(acc => acc.status === 'active').length
  const getPendingTransactions = () => transactions.filter(tx => tx.status === 'pending').length

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'trading': return <TrendingUp className="h-5 w-5" />
      case 'investment': return <Target className="h-5 w-5" />
      case 'savings': return <PiggyBank className="h-5 w-5" />
      case 'checking': return <CreditCard className="h-5 w-5" />
      default: return <Banknote className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'frozen': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Vault Banking System
          </h1>
          <p className="text-muted-foreground">Enterprise-grade banking with compliance and risk management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Statements
          </Button>
          <Button onClick={() => setIsNewAccountDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Balance</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  ${getTotalBalance().toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                  <span className="text-sm text-emerald-600">+7.8% this month</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-500 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Accounts</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {getActiveAccounts()}
                </p>
                <p className="text-sm text-blue-600 mt-1">All verified</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Pending Transactions</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {getPendingTransactions()}
                </p>
                <p className="text-sm text-purple-600 mt-1">Awaiting approval</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Risk Score</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {complianceStatus.riskScore}
                </p>
                <p className="text-sm text-emerald-600 mt-1">Low risk</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            Compliance & Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">KYC Verification</span>
                  <Badge className={complianceStatus.kycStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}>
                    {complianceStatus.kycStatus}
                  </Badge>
                </div>
                <Progress value={complianceStatus.kycStatus === 'verified' ? 100 : 50} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">AML Compliance</span>
                  <Badge className={complianceStatus.amlStatus === 'compliant' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                    {complianceStatus.amlStatus}
                  </Badge>
                </div>
                <Progress value={complianceStatus.amlStatus === 'compliant' ? 100 : 25} className="h-2" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Risk Assessment</span>
                  <span className="text-sm text-muted-foreground">Score: {complianceStatus.riskScore}/100</span>
                </div>
                <Progress value={100 - complianceStatus.riskScore} className="h-2" />
              </div>
              
              <div>
                <span className="text-sm font-medium">Last Assessment</span>
                <p className="text-sm text-muted-foreground">
                  {complianceStatus.lastAssessment.toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                Compliance Report
              </Button>
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Assessment
              </Button>
              <Button variant="outline" className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                Security Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {getAccountIcon(account.type)}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{account.name}</CardTitle>
                        <CardDescription className="text-xs capitalize">{account.type}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(account.status)}>
                      {account.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold">
                        ${account.balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{account.currency}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Growth</span>
                      <span className={`flex items-center ${account.monthlyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {account.monthlyGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs(account.monthlyGrowth)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Activity</span>
                      <span className="text-xs">{account.lastActivity.toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsTransferDialogOpen(true)}
                      >
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest banking operations and transfers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' :
                        tx.type === 'withdrawal' ? 'bg-red-100 text-red-600' :
                        tx.type === 'transfer' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {tx.type === 'deposit' && <ArrowDownLeft className="h-4 w-4" />}
                        {tx.type === 'withdrawal' && <ArrowUpRight className="h-4 w-4" />}
                        {tx.type === 'transfer' && <RefreshCw className="h-4 w-4" />}
                        {tx.type === 'investment' && <Target className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-sm text-muted-foreground">
                          ${tx.amount.toLocaleString()} {tx.currency}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        tx.status === 'completed' ? 'default' :
                        tx.status === 'pending' ? 'secondary' :
                        tx.status === 'processing' ? 'outline' : 'destructive'
                      }>
                        {tx.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tx.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>6-month portfolio value trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']} />
                    <Area type="monotone" dataKey="value" stroke="#059669" fill="#059669" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Regulatory Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">FDIC Insured</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SOX Compliant</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PCI DSS Level 1</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ISO 27001</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Security Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Multi-Factor Auth</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Biometric Verification</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">End-to-End Encryption</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Monitoring</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Funds</DialogTitle>
            <DialogDescription>Transfer funds between vault accounts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>From Account</Label>
              <Select value={transferForm.fromAccount} onValueChange={(value) => setTransferForm(prev => ({ ...prev, fromAccount: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} (${account.balance.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Account</Label>
              <Select value={transferForm.toAccount} onValueChange={(value) => setTransferForm(prev => ({ ...prev, toAccount: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={transferForm.amount}
                onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Transfer description"
                value={transferForm.description}
                onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button>
                Transfer Funds
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Account Dialog */}
      <Dialog open={isNewAccountDialogOpen} onOpenChange={setIsNewAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>Set up a new vault banking account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account Name</Label>
              <Input placeholder="Enter account name" />
            </div>
            <div>
              <Label>Account Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="trading">Trading</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Initial Deposit</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewAccountDialogOpen(false)}>
                Cancel
              </Button>
              <Button>
                Create Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VaultBankingDashboard