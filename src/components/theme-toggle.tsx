"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Leaf, Square, Zap, Eye, Palette } from "lucide-react"
import { useTheme } from "@/components/theme/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const THEME_CONFIG = {
  light: {
    label: "Light",
    icon: Sun,
    description: "Clean light theme for professional trading",
    badge: "Default"
  },
  dark: {
    label: "Dark", 
    icon: Moon,
    description: "Dark theme for extended trading sessions",
    badge: "Popular"
  },
  system: {
    label: "System",
    icon: Monitor,
    description: "Follow your system preference",
    badge: "Auto"
  },
  "trading-green": {
    label: "Trading Green",
    icon: Leaf,
    description: "Green-focused theme for profit tracking",
    badge: "Pro"
  },
  "trading-blue": {
    label: "Trading Blue", 
    icon: Square,
    description: "Blue-focused theme for analytical work",
    badge: "Pro"
  },
  "trading-modern": {
    label: "Trading Modern",
    icon: Zap,
    description: "Modern emerald/purple theme with premium styling",
    badge: "Premium"
  },
  "high-contrast": {
    label: "High Contrast",
    icon: Eye,
    description: "Maximum contrast for accessibility",
    badge: "A11y"
  }
}

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="w-9 px-0">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const currentTheme = theme || 'system'
  const CurrentIcon = THEME_CONFIG[currentTheme as keyof typeof THEME_CONFIG]?.icon || Palette

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-9 px-0">
          <CurrentIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <div className="px-2 py-1.5">
          <h4 className="font-medium text-sm">Choose Theme</h4>
          <p className="text-xs text-muted-foreground">
            Select your preferred color theme
          </p>
        </div>
        <DropdownMenuSeparator />
        
        {/* System Themes */}
        <div className="space-y-1">
          {(['light', 'dark', 'system'] as const).map((themeOption) => {
            const config = THEME_CONFIG[themeOption]
            const Icon = config.icon
            const isActive = theme === themeOption
            
            return (
              <DropdownMenuItem
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`flex items-center justify-between cursor-pointer p-2 rounded-md ${
                  isActive ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium text-sm">{config.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {config.description}
                    </div>
                  </div>
                </div>
                <Badge variant={isActive ? "secondary" : "outline"} className="text-xs">
                  {config.badge}
                </Badge>
              </DropdownMenuItem>
            )
          })}
        </div>

        <DropdownMenuSeparator />
        
        {/* Trading Themes */}
        <div className="px-2 py-1">
          <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
            Trading Themes
          </h5>
        </div>
        <div className="space-y-1">
          {(['trading-green', 'trading-blue', 'trading-modern', 'high-contrast'] as const).map((themeOption) => {
            const config = THEME_CONFIG[themeOption]
            const Icon = config.icon
            const isActive = theme === themeOption
            
            return (
              <DropdownMenuItem
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`flex items-center justify-between cursor-pointer p-2 rounded-md ${
                  isActive ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium text-sm">{config.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {config.description}
                    </div>
                  </div>
                </div>
                <Badge variant={isActive ? "secondary" : "outline"} className="text-xs">
                  {config.badge}
                </Badge>
              </DropdownMenuItem>
            )
          })}
        </div>
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <p className="text-xs text-muted-foreground">
            Current: <span className="font-medium">{THEME_CONFIG[currentTheme as keyof typeof THEME_CONFIG]?.label || 'Unknown'}</span>
            {resolvedTheme && resolvedTheme !== currentTheme && (
              <span> (Resolved: {resolvedTheme})</span>
            )}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 px-0">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-9 px-0"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}