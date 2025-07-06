'use client'

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

type ThemeType = 'default' | 'dark' | 'trading-green' | 'trading-blue' | 'high-contrast' | 'brutalist'

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
      value: 'default',
      label: 'Light',
      description: 'Clean, light appearance for daytime trading',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Low-light friendly interface for night sessions',
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
      value: 'high-contrast',
      label: 'High Contrast',
      description: 'Maximum readability for critical data',
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