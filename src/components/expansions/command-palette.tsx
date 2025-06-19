'use client'

import React from 'react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Bot,
  Calculator,
  Calendar,
  CreditCard,
  Search,
  Settings,
  TrendingUp,
  User,
  PieChart,
  Target,
  BarChart3,
  Activity,
  Wallet,
  Zap,
  Shield,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const commands = [
    {
      group: 'Quick Actions',
      items: [
        {
          icon: <Plus className="h-4 w-4" />,
          title: 'Create New Strategy',
          description: 'Build a new automated trading strategy',
          action: () => console.log('Create strategy'),
          shortcut: '⌘N'
        },
        {
          icon: <Bot className="h-4 w-4" />,
          title: 'Deploy Agent',
          description: 'Launch a new trading agent',
          action: () => console.log('Deploy agent'),
          shortcut: '⌘D'
        },
        {
          icon: <TrendingUp className="h-4 w-4" />,
          title: 'Place Order',
          description: 'Create a new trading order',
          action: () => console.log('Place order'),
          shortcut: '⌘O'
        },
        {
          icon: <Target className="h-4 w-4" />,
          title: 'Create Farm',
          description: 'Set up a new yield farm',
          action: () => console.log('Create farm'),
          shortcut: '⌘F'
        }
      ]
    },
    {
      group: 'Navigation',
      items: [
        {
          icon: <BarChart3 className="h-4 w-4" />,
          title: 'Dashboard',
          description: 'Go to main dashboard',
          action: () => console.log('Go to dashboard')
        },
        {
          icon: <PieChart className="h-4 w-4" />,
          title: 'Analytics',
          description: 'View advanced analytics',
          action: () => console.log('Go to analytics')
        },
        {
          icon: <Wallet className="h-4 w-4" />,
          title: 'Portfolio',
          description: 'Check portfolio balance',
          action: () => console.log('Go to portfolio')
        },
        {
          icon: <Activity className="h-4 w-4" />,
          title: 'Trading Interface',
          description: 'Access live trading tools',
          action: () => console.log('Go to trading')
        },
        {
          icon: <Shield className="h-4 w-4" />,
          title: 'Risk Management',
          description: 'Monitor portfolio risk',
          action: () => console.log('Go to risk')
        }
      ]
    },
    {
      group: 'Agents',
      items: [
        {
          icon: <Bot className="h-4 w-4" />,
          title: 'Darvas Box Master',
          description: 'Breakout trading specialist',
          action: () => console.log('Select Darvas agent'),
          badge: 'Active'
        },
        {
          icon: <Bot className="h-4 w-4" />,
          title: 'Elliott Wave Analyst',
          description: 'Wave pattern recognition',
          action: () => console.log('Select Elliott agent'),
          badge: 'Active'
        },
        {
          icon: <Bot className="h-4 w-4" />,
          title: 'Momentum Trader',
          description: 'Trend following strategy',
          action: () => console.log('Select Momentum agent'),
          badge: 'Paused'
        },
        {
          icon: <Bot className="h-4 w-4" />,
          title: 'Arbitrage Hunter',
          description: 'Cross-exchange opportunities',
          action: () => console.log('Select Arbitrage agent'),
          badge: 'Active'
        }
      ]
    },
    {
      group: 'Tools',
      items: [
        {
          icon: <Calculator className="h-4 w-4" />,
          title: 'Position Calculator',
          description: 'Calculate position sizes and risk',
          action: () => console.log('Open calculator')
        },
        {
          icon: <Download className="h-4 w-4" />,
          title: 'Export Data',
          description: 'Download trading history',
          action: () => console.log('Export data')
        },
        {
          icon: <Upload className="h-4 w-4" />,
          title: 'Import Strategy',
          description: 'Load strategy from file',
          action: () => console.log('Import strategy')
        },
        {
          icon: <Settings className="h-4 w-4" />,
          title: 'Settings',
          description: 'Configure system preferences',
          action: () => console.log('Open settings')
        }
      ]
    },
    {
      group: 'Recent',
      items: [
        {
          icon: <Eye className="h-4 w-4" />,
          title: 'BTC/USD Chart Analysis',
          description: 'Viewed 5 minutes ago',
          action: () => console.log('View BTC chart')
        },
        {
          icon: <Edit className="h-4 w-4" />,
          title: 'Modified Momentum Strategy',
          description: 'Updated 1 hour ago',
          action: () => console.log('Edit strategy')
        },
        {
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Risk Alert Review',
          description: 'Checked 2 hours ago',
          action: () => console.log('View alert')
        }
      ]
    }
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput 
          placeholder="Type a command or search..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {commands.map((group) => (
            <React.Fragment key={group.group}>
              <CommandGroup heading={group.group}>
                {group.items.map((item, index) => (
                  <CommandItem
                    key={`${group.group}-${index}`}
                    onSelect={() => {
                      item.action()
                      onOpenChange(false)
                    }}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {item.icon}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          {item.badge && (
                            <Badge 
                              variant={item.badge === 'Active' ? 'default' : 'secondary'}
                              className={`text-xs ${item.badge === 'Active' ? 'bg-green-500' : ''}`}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {item.shortcut && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {item.shortcut}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

export default CommandPalette