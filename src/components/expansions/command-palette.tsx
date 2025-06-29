'use client'

import React, { useState } from 'react'
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
  Search, 
  TrendingUp, 
  Bot, 
  Wallet, 
  Settings,
  BarChart3,
  Target,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react'

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({ open = false, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('')

  const commands = [
    {
      group: 'Navigation',
      items: [
        { icon: <BarChart3 className="h-4 w-4" />, label: 'Dashboard', action: () => console.log('Navigate to Dashboard') },
        { icon: <TrendingUp className="h-4 w-4" />, label: 'Trading', action: () => console.log('Navigate to Trading') },
        { icon: <Bot className="h-4 w-4" />, label: 'Agents', action: () => console.log('Navigate to Agents') },
        { icon: <Target className="h-4 w-4" />, label: 'Farms', action: () => console.log('Navigate to Farms') },
        { icon: <Wallet className="h-4 w-4" />, label: 'Vault', action: () => console.log('Navigate to Vault') },
      ]
    },
    {
      group: 'Actions',
      items: [
        { icon: <DollarSign className="h-4 w-4" />, label: 'Place Order', action: () => console.log('Place Order') },
        { icon: <Bot className="h-4 w-4" />, label: 'Create Agent', action: () => console.log('Create Agent') },
        { icon: <Activity className="h-4 w-4" />, label: 'View Analytics', action: () => console.log('View Analytics') },
        { icon: <Settings className="h-4 w-4" />, label: 'Settings', action: () => console.log('Open Settings') },
      ]
    }
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {commands.map((group, index) => (
          <React.Fragment key={group.group}>
            <CommandGroup heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={() => {
                    item.action()
                    onOpenChange?.(false)
                  }}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {index < commands.length - 1 && <CommandSeparator />}
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export default CommandPalette