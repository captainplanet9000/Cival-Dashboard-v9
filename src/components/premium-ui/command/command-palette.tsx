'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Search,
  TrendingUp,
  DollarSign,
  BarChart3,
  Settings,
  FileText,
  Users,
  Shield,
  Zap,
  Clock,
  Calculator,
  Bot,
  LineChart,
  AlertCircle,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

export interface CommandAction {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string
  group: string
  action: () => void | Promise<void>
  keywords?: string[]
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export interface CommandPaletteProps {
  actions?: CommandAction[]
  placeholder?: string
  emptyMessage?: string
  hotkey?: string
  showRecent?: boolean
  recentLimit?: number
  onAction?: (action: CommandAction) => void
}

// Default trading actions
const defaultTradingActions: CommandAction[] = [
  // Quick Actions
  {
    id: 'quick-buy',
    label: 'Quick Buy Order',
    description: 'Place a market buy order',
    icon: <TrendingUp className="h-4 w-4" />,
    shortcut: '⌘B',
    group: 'Quick Actions',
    action: () => console.log('Quick buy'),
    keywords: ['buy', 'order', 'market', 'purchase']
  },
  {
    id: 'quick-sell',
    label: 'Quick Sell Order',
    description: 'Place a market sell order',
    icon: <DollarSign className="h-4 w-4" />,
    shortcut: '⌘S',
    group: 'Quick Actions',
    action: () => console.log('Quick sell'),
    keywords: ['sell', 'order', 'market', 'close']
  },
  {
    id: 'new-strategy',
    label: 'New Trading Strategy',
    description: 'Create a new automated strategy',
    icon: <Bot className="h-4 w-4" />,
    shortcut: '⌘N',
    group: 'Quick Actions',
    action: () => console.log('New strategy'),
    keywords: ['strategy', 'create', 'new', 'algorithm', 'bot']
  },
  {
    id: 'calculator',
    label: 'Position Size Calculator',
    description: 'Calculate optimal position size',
    icon: <Calculator className="h-4 w-4" />,
    group: 'Quick Actions',
    action: () => console.log('Calculator'),
    keywords: ['calculate', 'position', 'size', 'risk']
  },

  // Navigation
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    icon: <BarChart3 className="h-4 w-4" />,
    shortcut: '⌘1',
    group: 'Navigation',
    action: () => console.log('Navigate to dashboard'),
    keywords: ['home', 'overview', 'main']
  },
  {
    id: 'nav-trading',
    label: 'Trading',
    icon: <LineChart className="h-4 w-4" />,
    shortcut: '⌘2',
    group: 'Navigation',
    action: () => console.log('Navigate to trading'),
    keywords: ['trade', 'chart', 'market']
  },
  {
    id: 'nav-portfolio',
    label: 'Portfolio',
    icon: <FileText className="h-4 w-4" />,
    shortcut: '⌘3',
    group: 'Navigation',
    action: () => console.log('Navigate to portfolio'),
    keywords: ['holdings', 'positions', 'assets']
  },
  {
    id: 'nav-analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    shortcut: '⌘4',
    group: 'Navigation',
    action: () => console.log('Navigate to analytics'),
    keywords: ['reports', 'performance', 'analysis']
  },
  {
    id: 'nav-agents',
    label: 'AI Agents',
    icon: <Bot className="h-4 w-4" />,
    shortcut: '⌘5',
    group: 'Navigation',
    action: () => console.log('Navigate to agents'),
    keywords: ['bots', 'automation', 'ai']
  },

  // Settings
  {
    id: 'settings-general',
    label: 'General Settings',
    icon: <Settings className="h-4 w-4" />,
    group: 'Settings',
    action: () => console.log('Open settings'),
    keywords: ['preferences', 'configuration', 'options']
  },
  {
    id: 'settings-api',
    label: 'API Keys',
    icon: <Shield className="h-4 w-4" />,
    group: 'Settings',
    action: () => console.log('Open API settings'),
    keywords: ['keys', 'credentials', 'exchange']
  },
  {
    id: 'settings-alerts',
    label: 'Alert Settings',
    icon: <AlertCircle className="h-4 w-4" />,
    group: 'Settings',
    action: () => console.log('Open alert settings'),
    keywords: ['notifications', 'alarms', 'warnings']
  },

  // Help
  {
    id: 'help-docs',
    label: 'Documentation',
    icon: <FileText className="h-4 w-4" />,
    shortcut: '⌘/',
    group: 'Help',
    action: () => console.log('Open docs'),
    keywords: ['docs', 'guide', 'manual', 'help']
  },
  {
    id: 'help-support',
    label: 'Contact Support',
    icon: <HelpCircle className="h-4 w-4" />,
    group: 'Help',
    action: () => console.log('Contact support'),
    keywords: ['support', 'contact', 'help', 'issue']
  }
]

export function CommandPalette({
  actions = defaultTradingActions,
  placeholder = 'Type a command or search...',
  emptyMessage = 'No results found.',
  hotkey = 'k',
  showRecent = true,
  recentLimit = 3,
  onAction
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recentActions, setRecentActions] = useState<string[]>([])
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  // Load recent actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('command-palette-recent')
    if (stored) {
      setRecentActions(JSON.parse(stored))
    }
  }, [])

  // Set up hotkey
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === hotkey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [hotkey])

  const handleAction = useCallback(async (action: CommandAction) => {
    // Update recent actions
    const newRecent = [
      action.id,
      ...recentActions.filter(id => id !== action.id)
    ].slice(0, recentLimit)
    
    setRecentActions(newRecent)
    localStorage.setItem('command-palette-recent', JSON.stringify(newRecent))

    // Execute action
    try {
      await action.action()
      onAction?.(action)
    } catch (error) {
      console.error('Command action failed:', error)
    }

    // Close palette
    setOpen(false)
    setSearch('')
  }, [recentActions, recentLimit, onAction])

  // Filter actions based on search
  const filteredActions = actions.filter(action => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    return (
      action.label.toLowerCase().includes(searchLower) ||
      action.description?.toLowerCase().includes(searchLower) ||
      action.keywords?.some(k => k.toLowerCase().includes(searchLower))
    )
  })

  // Group actions
  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.group]) acc[action.group] = []
    acc[action.group].push(action)
    return acc
  }, {} as Record<string, CommandAction[]>)

  // Get recent actions objects
  const recentActionObjects = showRecent && !search
    ? recentActions
        .map(id => actions.find(a => a.id === id))
        .filter(Boolean) as CommandAction[]
    : []

  // Add theme actions
  const themeActions: CommandAction[] = [
    {
      id: 'theme-light',
      label: 'Light Mode',
      icon: <Sun className="h-4 w-4" />,
      group: 'Theme',
      action: () => setTheme('light'),
      keywords: ['theme', 'light', 'bright']
    },
    {
      id: 'theme-dark',
      label: 'Dark Mode',
      icon: <Moon className="h-4 w-4" />,
      group: 'Theme',
      action: () => setTheme('dark'),
      keywords: ['theme', 'dark', 'night']
    },
    {
      id: 'theme-system',
      label: 'System Theme',
      icon: <Monitor className="h-4 w-4" />,
      group: 'Theme',
      action: () => setTheme('system'),
      keywords: ['theme', 'system', 'auto']
    }
  ]

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 md:h-10 md:w-60 md:justify-start md:px-3 md:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={placeholder}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>{emptyMessage}</CommandEmpty>

          {/* Recent Actions */}
          {recentActionObjects.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentActionObjects.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    onSelect={() => handleAction(action)}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                    {action.badge && (
                      <Badge
                        variant={action.badgeVariant}
                        className="ml-auto"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Grouped Actions */}
          {Object.entries(groupedActions).map(([group, groupActions], index) => (
            <React.Fragment key={group}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {groupActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    onSelect={() => handleAction(action)}
                  >
                    {action.icon}
                    <div className="ml-2 flex-1">
                      <div>{action.label}</div>
                      {action.description && (
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      )}
                    </div>
                    {action.badge && (
                      <Badge
                        variant={action.badgeVariant}
                        className="ml-2"
                      >
                        {action.badge}
                      </Badge>
                    )}
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}

          {/* Theme Actions */}
          {!search && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Theme">
                {themeActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    onSelect={() => handleAction(action)}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                    {theme === action.id.replace('theme-', '') && (
                      <Badge variant="secondary" className="ml-auto">
                        Active
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}