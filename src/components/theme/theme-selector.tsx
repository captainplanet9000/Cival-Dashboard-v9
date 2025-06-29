'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown'
import { Badge } from '@/components/ui/badge'
import { Palette, Monitor, Moon, Sun, Target, BarChart3, Eye } from 'lucide-react'
import { useTheme } from './theme-provider'

const themeIcons = {
  default: Sun,
  dark: Moon,
  'trading-green': Target,
  'trading-blue': BarChart3,
  'high-contrast': Eye
}

const themeColors = {
  default: 'bg-white border-gray-200',
  dark: 'bg-gray-900 border-gray-700',
  'trading-green': 'bg-green-900 border-green-700',
  'trading-blue': 'bg-blue-900 border-blue-700',
  'high-contrast': 'bg-black border-white'
}

export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Settings
        </CardTitle>
        <CardDescription>
          Choose your preferred theme for the trading dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Theme</label>
          <EnhancedDropdown
            options={themes.map((themeOption): DropdownOption => {
              const Icon = themeIcons[themeOption.value]
              return {
                value: themeOption.value,
                label: themeOption.label,
                description: themeOption.description,
                icon: <Icon className="h-4 w-4" />
              }
            })}
            value={theme}
            onValueChange={setTheme}
            placeholder="Choose a theme"
            searchable
          />
        </div>

        {/* Theme Preview Grid */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Theme Preview</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {themes.map((themeOption) => {
              const Icon = themeIcons[themeOption.value]
              const isSelected = theme === themeOption.value
              
              return (
                <div
                  key={themeOption.value}
                  className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md ${
                    isSelected 
                      ? 'border-primary shadow-md ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setTheme(themeOption.value)}
                >
                  {/* Theme Preview Box */}
                  <div className={`h-16 w-full rounded-md border-2 mb-2 ${themeColors[themeOption.value]}`}>
                    <div className="p-2 h-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-current" />
                    </div>
                  </div>
                  
                  {/* Theme Info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{themeOption.label}</span>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {themeOption.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'default' : 'dark')}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Toggle Light/Dark
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default'
              setTheme(systemPreference)
            }}
          >
            <Monitor className="h-4 w-4 mr-2" />
            System Default
          </Button>
        </div>

        {/* Current Theme Info */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            {React.createElement(themeIcons[theme], { className: "h-4 w-4" })}
            <span className="font-medium text-sm">
              Current: {themes.find(t => t.value === theme)?.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {themes.find(t => t.value === theme)?.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}