'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'default' | 'dark' | 'trading-green' | 'trading-blue' | 'trading-modern' | 'high-contrast'

interface ThemeProviderContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: { value: Theme; label: string; description: string }[]
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined)

export function ThemeProvider({ children, ...props }: React.ComponentProps<'div'>) {
  const [theme, setTheme] = useState<Theme>('default')

  const themes = [
    { 
      value: 'default' as Theme, 
      label: 'Light', 
      description: 'Clean light theme for professional trading' 
    },
    { 
      value: 'dark' as Theme, 
      label: 'Dark', 
      description: 'Dark theme for extended trading sessions' 
    },
    { 
      value: 'trading-green' as Theme, 
      label: 'Trading Green', 
      description: 'Green-focused theme for profit tracking' 
    },
    { 
      value: 'trading-blue' as Theme, 
      label: 'Trading Blue', 
      description: 'Blue-focused theme for analytical work' 
    },
    { 
      value: 'trading-modern' as Theme, 
      label: 'Trading Modern', 
      description: 'Modern emerald/purple theme with premium styling' 
    },
    { 
      value: 'high-contrast' as Theme, 
      label: 'High Contrast', 
      description: 'Maximum contrast for accessibility' 
    }
  ]

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return
    
    const root = window.document.documentElement
    const savedTheme = (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null) as Theme || 'default'
    setTheme(savedTheme)
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'trading-green', 'trading-blue', 'trading-modern', 'high-contrast')
    
    // Apply the saved theme
    if (savedTheme === 'default') {
      root.classList.add('light')
    } else {
      root.classList.add(savedTheme)
    }
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    const root = window.document.documentElement
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'trading-green', 'trading-blue', 'trading-modern', 'high-contrast')
    
    // Apply new theme
    if (newTheme === 'default') {
      root.classList.add('light')
    } else {
      root.classList.add(newTheme)
    }
    
    setTheme(newTheme)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }

  const value = {
    theme,
    setTheme: handleThemeChange,
    themes
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      <div {...props}>
        {children}
      </div>
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}