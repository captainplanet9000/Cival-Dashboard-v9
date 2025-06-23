'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  Filter,
  Search,
  Bell,
  BellOff,
  Activity,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Users,
  Building,
  Globe,
  Lock,
  Unlock,
  Zap,
  Database,
  RefreshCw,
  Calendar,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  CreditCard,
  Briefcase,
  Scale,
  Flag,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'

export interface RiskLimit {
  id: string
  name: string
  type: 'position_size' | 'daily_loss' | 'concentration' | 'leverage' | 'var' | 'drawdown'
  category: 'portfolio' | 'position' | 'sector' | 'counterparty' | 'operational'
  value: number
  unit: 'percentage' | 'absolute' | 'ratio'
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  breached: boolean
  lastBreach?: Date
  breachCount: number
}

export interface ComplianceRule {
  id: string
  name: string
  description: string
  type: 'regulatory' | 'internal' | 'risk' | 'operational'
  jurisdiction: string
  regulation: string
  status: 'active' | 'pending' | 'inactive'
  priority: 'low' | 'medium' | 'high' | 'critical'
  automatedCheck: boolean
  lastCheck?: Date
  violations: number
  actions: Array<{
    id: string
    type: 'alert' | 'block' | 'report' | 'escalate'
    description: string
    automated: boolean
  }>
}

export interface RiskAlert {
  id: string
  type: 'limit_breach' | 'compliance_violation' | 'market_risk' | 'operational_risk'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  details: Record<string, any>
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
  assignedTo?: string
  actions: Array<{
    id: string
    description: string
    completed: boolean
    completedAt?: Date
  }>
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'trader' | 'risk_manager' | 'compliance_officer' | 'admin'
  department: string
  permissions: string[]
  riskLimits: string[]
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired'
  amlStatus: 'clear' | 'flagged' | 'under_review'
  lastLogin: Date
  tradingEnabled: boolean
  accessLevel: 'basic' | 'standard' | 'advanced' | 'administrator'
}

export interface RiskManagementSuiteProps {
  riskLimits: RiskLimit[]
  complianceRules: ComplianceRule[]
  alerts: RiskAlert[]
  users: UserProfile[]
  portfolioMetrics: {
    totalValue: number
    var95: number
    var99: number
    maxDrawdown: number
    concentrationRisk: number
    leverageRatio: number
    liquidity: number
  }
  onUpdateRiskLimit: (id: string, updates: Partial<RiskLimit>) => void
  onUpdateComplianceRule: (id: string, updates: Partial<ComplianceRule>) => void
  onAcknowledgeAlert: (id: string) => void
  onResolveAlert: (id: string) => void
  onUpdateUserProfile: (id: string, updates: Partial<UserProfile>) => void
  className?: string
}

// Risk severity color mapping
const SEVERITY_COLORS = {
  low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
}

// Compliance regulations
const JURISDICTIONS = [
  'US - SEC', 'US - CFTC', 'UK - FCA', 'EU - ESMA', 'JP - JFSA', 
  'AU - ASIC', 'SG - MAS', 'HK - SFC', 'Global - FATF'
]

const REGULATIONS = [
  'MiFID II', 'Dodd-Frank', 'Basel III', 'EMIR', 'GDPR', 
  'KYC/AML', 'FATCA', 'CRS', 'Market Abuse Regulation'
]

export function RiskManagementSuite({
  riskLimits,
  complianceRules,
  alerts,
  users,
  portfolioMetrics,
  onUpdateRiskLimit,
  onUpdateComplianceRule,
  onAcknowledgeAlert,
  onResolveAlert,
  onUpdateUserProfile,
  className
}: RiskManagementSuiteProps) {
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [alertFilter, setAlertFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(true)
  const [selectedRiskLimit, setSelectedRiskLimit] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)

  // Calculate risk dashboard metrics
  const riskMetrics = useMemo(() => {
    const activeAlerts = alerts.filter(a => !a.acknowledged)
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')
    const breachedLimits = riskLimits.filter(l => l.breached && l.enabled)
    const activeRules = complianceRules.filter(r => r.status === 'active')
    const violationsToday = complianceRules.reduce((sum, rule) => sum + rule.violations, 0)
    
    const riskScore = calculateOverallRiskScore(riskLimits, portfolioMetrics)
    const complianceScore = calculateComplianceScore(complianceRules)
    
    return {
      totalAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      breachedLimits: breachedLimits.length,
      totalLimits: riskLimits.filter(l => l.enabled).length,
      activeRules: activeRules.length,
      violationsToday,
      riskScore,
      complianceScore,
      systemHealth: calculateSystemHealth(riskScore, complianceScore, activeAlerts.length)
    }
  }, [riskLimits, complianceRules, alerts, portfolioMetrics])

  // Calculate overall risk score
  function calculateOverallRiskScore(limits: RiskLimit[], metrics: any) {
    const weights = {
      var95: 0.3,
      maxDrawdown: 0.25,
      concentrationRisk: 0.2,
      leverageRatio: 0.15,
      liquidity: 0.1
    }
    
    const normalizedScores = {
      var95: Math.min(metrics.var95 * 100, 100),
      maxDrawdown: Math.min(metrics.maxDrawdown * 100, 100),
      concentrationRisk: Math.min(metrics.concentrationRisk * 100, 100),
      leverageRatio: Math.min((metrics.leverageRatio - 1) * 20, 100),
      liquidity: Math.max(0, 100 - metrics.liquidity * 100)
    }
    
    return Object.entries(weights).reduce((score, [key, weight]) => 
      score + normalizedScores[key as keyof typeof normalizedScores] * weight, 0
    )
  }

  // Calculate compliance score
  function calculateComplianceScore(rules: ComplianceRule[]) {
    if (rules.length === 0) return 100
    
    const violationWeights = { low: 1, medium: 2, high: 4, critical: 8 }
    const totalViolations = rules.reduce((sum, rule) => 
      sum + rule.violations * violationWeights[rule.priority], 0
    )
    
    return Math.max(0, 100 - (totalViolations / rules.length) * 5)
  }

  // Calculate system health
  function calculateSystemHealth(riskScore: number, complianceScore: number, alertCount: number) {
    const riskWeight = 0.4
    const complianceWeight = 0.4
    const alertWeight = 0.2
    
    const riskComponent = Math.max(0, 100 - riskScore)
    const complianceComponent = complianceScore
    const alertComponent = Math.max(0, 100 - alertCount * 5)
    
    return riskWeight * riskComponent + complianceWeight * complianceComponent + alertWeight * alertComponent
  }

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (alertFilter !== 'all' && alert.severity !== alertFilter) return false
      if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
  }, [alerts, alertFilter, searchTerm])

  // Risk Dashboard Component
  const RiskDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">Risk Score</span>
          </div>
          <div className="text-2xl font-bold text-red-700">
            {riskMetrics.riskScore.toFixed(1)}%
          </div>
          <div className="text-sm text-red-600">
            {riskMetrics.breachedLimits} limits breached
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border"
        >
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Compliance</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {riskMetrics.complianceScore.toFixed(1)}%
          </div>
          <div className="text-sm text-blue-600">
            {riskMetrics.violationsToday} violations today
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border"
        >
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Active Alerts</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700">
            {riskMetrics.totalAlerts}
          </div>
          <div className="text-sm text-yellow-600">
            {riskMetrics.criticalAlerts} critical
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border"
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">System Health</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {riskMetrics.systemHealth.toFixed(1)}%
          </div>
          <div className="text-sm text-green-600">
            All systems operational
          </div>
        </motion.div>
      </div>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Exposure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Value at Risk (95%)</span>
                  <span className="font-mono">{(portfolioMetrics.var95 * 100).toFixed(2)}%</span>
                </div>
                <Progress value={portfolioMetrics.var95 * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Max Drawdown</span>
                  <span className="font-mono">{(portfolioMetrics.maxDrawdown * 100).toFixed(2)}%</span>
                </div>
                <Progress value={portfolioMetrics.maxDrawdown * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Concentration Risk</span>
                  <span className="font-mono">{(portfolioMetrics.concentrationRisk * 100).toFixed(1)}%</span>
                </div>
                <Progress value={portfolioMetrics.concentrationRisk * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Leverage Ratio</span>
                  <span className="font-mono">{portfolioMetrics.leverageRatio.toFixed(2)}x</span>
                </div>
                <Progress value={Math.min((portfolioMetrics.leverageRatio - 1) * 20, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    SEVERITY_COLORS[alert.severity].bg,
                    SEVERITY_COLORS[alert.severity].border,
                    "hover:opacity-80"
                  )}
                  onClick={() => setSelectedAlert(alert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                    </div>
                    <Badge className={cn(SEVERITY_COLORS[alert.severity].text, "text-xs")}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {alert.timestamp.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Risk Limits Management
  const RiskLimitsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Risk Limits</h2>
        <div className="flex items-center gap-2">
          <Switch
            checked={showOnlyActive}
            onCheckedChange={setShowOnlyActive}
          />
          <Label>Show only active</Label>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Limit
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {riskLimits
          .filter(limit => !showOnlyActive || limit.enabled)
          .map(limit => (
            <Card key={limit.id} className={cn(
              "transition-all cursor-pointer",
              limit.breached && "border-red-300 bg-red-50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      limit.breached ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {limit.breached ? <AlertTriangle className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">{limit.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {limit.category} • {limit.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-mono">
                        {limit.value.toFixed(2)}{limit.unit === 'percentage' ? '%' : ''}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Limit: {limit.threshold.toFixed(2)}{limit.unit === 'percentage' ? '%' : ''}
                      </div>
                    </div>

                    <div className="w-32">
                      <Progress 
                        value={Math.min((limit.value / limit.threshold) * 100, 100)} 
                        className={cn(
                          "h-2",
                          limit.breached && "bg-red-100"
                        )}
                      />
                    </div>

                    <Badge className={cn(
                      SEVERITY_COLORS[limit.severity].bg,
                      SEVERITY_COLORS[limit.severity].text
                    )}>
                      {limit.severity}
                    </Badge>

                    <Switch
                      checked={limit.enabled}
                      onCheckedChange={(enabled) => onUpdateRiskLimit(limit.id, { enabled })}
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Edit Limit</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete Limit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {limit.breached && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Limit Breached</AlertTitle>
                    <AlertDescription>
                      This limit was breached {limit.breachCount} times. 
                      Last breach: {limit.lastBreach?.toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )

  // Compliance Rules Management
  const ComplianceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Compliance Rules</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {complianceRules.map(rule => (
          <Card key={rule.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                      {rule.status}
                    </Badge>
                    <Badge className={cn(SEVERITY_COLORS[rule.priority].text)}>
                      {rule.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {rule.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <strong>Jurisdiction:</strong> {rule.jurisdiction}
                    </span>
                    <span>
                      <strong>Regulation:</strong> {rule.regulation}
                    </span>
                    <span>
                      <strong>Violations:</strong> {rule.violations}
                    </span>
                  </div>
                  
                  {rule.lastCheck && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Last checked: {rule.lastCheck.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {rule.automatedCheck ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-xs">
                      {rule.automatedCheck ? 'Automated' : 'Manual'}
                    </span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit Rule</DropdownMenuItem>
                      <DropdownMenuItem>Run Check</DropdownMenuItem>
                      <DropdownMenuItem>View Reports</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onUpdateComplianceRule(rule.id, { 
                          status: rule.status === 'active' ? 'inactive' : 'active' 
                        })}
                      >
                        {rule.status === 'active' ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {rule.actions.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Automated Actions</h4>
                  <div className="space-y-1">
                    {rule.actions.map(action => (
                      <div key={action.id} className="flex items-center justify-between text-sm">
                        <span>{action.description}</span>
                        <Badge variant={action.automated ? 'default' : 'outline'}>
                          {action.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Alerts Management
  const AlertsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Risk Alerts</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={alertFilter} onValueChange={setAlertFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn(
                "transition-all cursor-pointer",
                !alert.acknowledged && SEVERITY_COLORS[alert.severity].bg,
                alert.acknowledged && "opacity-60"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge className={cn(SEVERITY_COLORS[alert.severity].text)}>
                          {alert.severity}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="outline">Acknowledged</Badge>
                        )}
                        {alert.resolvedAt && (
                          <Badge variant="default">Resolved</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {alert.message}
                      </p>
                      
                      <div className="text-xs text-muted-foreground">
                        {alert.timestamp.toLocaleString()}
                        {alert.assignedTo && (
                          <span> • Assigned to {alert.assignedTo}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAcknowledgeAlert(alert.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>
                      )}
                      
                      {alert.acknowledged && !alert.resolvedAt && (
                        <Button
                          size="sm"
                          onClick={() => onResolveAlert(alert.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {alert.actions.length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Required Actions</h4>
                      <div className="space-y-1">
                        {alert.actions.map(action => (
                          <div key={action.id} className="flex items-center justify-between text-sm">
                            <span className={action.completed ? "line-through text-muted-foreground" : ""}>
                              {action.description}
                            </span>
                            {action.completed ? (
                              <Badge variant="default">Completed</Badge>
                            ) : (
                              <Button variant="outline" size="sm">
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )

  // User Management & KYC
  const UserManagementTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map(user => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{user.role.replace('_', ' ')}</Badge>
                      <Badge variant={user.tradingEnabled ? 'default' : 'destructive'}>
                        {user.tradingEnabled ? 'Trading Enabled' : 'Trading Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-2">
                      <span>KYC:</span>
                      <Badge variant={
                        user.kycStatus === 'approved' ? 'default' :
                        user.kycStatus === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {user.kycStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span>AML:</span>
                      <Badge variant={
                        user.amlStatus === 'clear' ? 'default' :
                        user.amlStatus === 'flagged' ? 'destructive' : 'secondary'
                      }>
                        {user.amlStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last login:<br />
                    {user.lastLogin.toLocaleDateString()}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                      <DropdownMenuItem>Risk Limits</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onUpdateUserProfile(user.id, { 
                          tradingEnabled: !user.tradingEnabled 
                        })}
                      >
                        {user.tradingEnabled ? 'Disable Trading' : 'Enable Trading'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Suspend User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <TooltipProvider>
      <div className={cn("w-full space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Risk Management & Compliance
            </h1>
            <p className="text-muted-foreground">
              Comprehensive risk controls and regulatory compliance
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="limits">Risk Limits</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <RiskDashboard />
          </TabsContent>

          <TabsContent value="limits">
            <RiskLimitsTab />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceTab />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsTab />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}