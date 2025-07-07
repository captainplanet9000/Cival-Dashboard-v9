'use client'

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

type ThemeType = 'light' | 'dark' | 'trading-green' | 'trading-blue' | 'trading-modern' | 'brutalist'

type ThemeOption = {
  value: ThemeType
  label: string
  description: string
}

type UseThemeReturnType = {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  themes: ThemeOption[]
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function useTheme(): UseThemeReturnType {
  const { theme, setTheme } = useNextTheme()
  
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
  ]
  
  return {
    theme: (theme as ThemeType) || 'dark',
    setTheme: (theme: ThemeType) => setTheme(theme),
    themes,
  }
}