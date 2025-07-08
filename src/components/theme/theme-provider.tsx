'use client'

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

// All available themes in the application
export type ThemeType = 'light' | 'dark' | 'trading-green' | 'trading-blue' | 'trading-modern' | 'brutalist' | 'high-contrast' | 'system'

// Theme metadata for UI display
export type ThemeOption = {
  value: ThemeType
  label: string
  description: string
  isDefault?: boolean
}

// Return type for our custom useTheme hook
export type UseThemeReturnType = {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  themes: ThemeOption[]
  resolvedTheme: string | undefined
  systemTheme: string | undefined
  isLoaded: boolean
  clearThemeCache: () => void
}

/**
 * Enhanced Theme Provider that properly applies theme classes
 * Based on shadcn/ui best practices for theme management
 */
export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const [isClientRendered, setIsClientRendered] = React.useState(false)
  
  // After hydration, mark as client rendered to prevent flashing
  React.useEffect(() => {
    setIsClientRendered(true)
  }, [])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      // Forcefully disable transitions during theme changes to prevent flickering
      disableTransitionOnChange
      // Explicitly list all available themes for proper class application
      themes={['light', 'dark', 'trading-green', 'trading-blue', 'trading-modern', 'brutalist']}
      // Extra settings to optimize theme application
      enableColorScheme={true}
      storageKey="cival-dashboard-theme"
      {...props}
    >
      {/* Apply a client-side-only class to help with CSS targeting */}
      <ClientThemeWatcher isClientRendered={isClientRendered}>
        {children}
      </ClientThemeWatcher>
    </NextThemesProvider>
  )
}

/**
 * Component that ensures theme is consistently applied and handles
 * transitions between client/server render
 */
function ClientThemeWatcher({
  children,
  isClientRendered
}: {
  children: React.ReactNode
  isClientRendered: boolean
}) {
  const { theme, resolvedTheme } = useNextTheme()
  
  // After client-side rendering, ensure theme class is applied to html element
  React.useEffect(() => {
    // Get theme to apply (actual theme or resolved from system preference)
    const themeToApply = theme === 'system' ? resolvedTheme : theme
    
    if (themeToApply) {
      // Ensure the theme class is properly set on the document element
      document.documentElement.classList.remove(
        'light', 'dark', 'trading-green', 'trading-blue', 'trading-modern', 'brutalist'
      )
      document.documentElement.classList.add(themeToApply)
      
      // Additional data attribute for easier CSS targeting
      document.documentElement.setAttribute('data-theme', themeToApply)
    }
  }, [theme, resolvedTheme])
  
  // Apply a CSS class when the client has fully rendered to enable transitions
  // This prevents theme transition flashing during page load
  return (
    <div className={isClientRendered ? 'theme-ready' : ''}>
      {children}
    </div>
  )
}

/**
 * Enhanced useTheme hook that provides additional functionality
 * and better type safety for theme switching
 */
export function useTheme(): UseThemeReturnType {
  const { theme, setTheme, resolvedTheme, systemTheme, themes: availableThemes } = useNextTheme()
  const [isLoaded, setIsLoaded] = React.useState(false)
  
  // Mark as loaded after initial mount
  React.useEffect(() => {
    setIsLoaded(true)
  }, [])
  
  // Define all available themes with metadata
  const themes: ThemeOption[] = [
    {
      value: 'light',
      label: 'Light',
      description: 'Clean, light appearance with OKLCH colors',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Professional dark interface with rich contrast',
      isDefault: true,
    },
    {
      value: 'trading-green',
      label: 'Trading Green',
      description: 'Classic green terminal style for focused trading',
    },
    {
      value: 'trading-blue',
      label: 'Trading Blue',
      description: 'Calm blue palette for extended sessions',
    },
    {
      value: 'trading-modern',
      label: 'Trading Modern',
      description: 'Modern emerald/purple theme with premium styling',
    },
    {
      value: 'brutalist',
      label: 'Brutalist',
      description: 'Bold, sharp design with clear hierarchy',
    },
    {
      value: 'high-contrast',
      label: 'High Contrast',
      description: 'Maximum contrast for accessibility',
    },
    {
      value: 'system',
      label: 'System',
      description: 'Match your system preferences automatically',
    },
  ]
  
  // Function to clear theme from localStorage and reset to default
  const clearThemeCache = React.useCallback(() => {
    try {
      localStorage.removeItem('cival-dashboard-theme')
      setTheme('dark') // Reset to default theme
    } catch (e) {
      console.error('Failed to clear theme cache:', e)
    }
  }, [setTheme])
  
  return {
    // Ensure we always have a valid theme value with fallback
    theme: (theme as ThemeType) || 'dark',
    setTheme: (theme: ThemeType) => setTheme(theme),
    themes,
    resolvedTheme,
    systemTheme,
    isLoaded,
    clearThemeCache,
  }
}