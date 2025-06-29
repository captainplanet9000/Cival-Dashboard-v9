'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Leaf,
  Square,
  Zap,
  Eye,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Check
} from 'lucide-react'

interface ThemeManagerProps {
  className?: string
}

interface ThemePreset {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  badge: string
  colors: {
    primary: string
    secondary: string
    background: string
    card: string
  }
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme for professional trading',
    icon: Sun,
    badge: 'Default',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      card: '#f8fafc'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme for extended trading sessions',
    icon: Moon,
    badge: 'Popular',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#020817',
      card: '#0f172a'
    }
  },
  {
    id: 'trading-green',
    name: 'Trading Green',
    description: 'Green-focused theme for profit tracking',
    icon: Leaf,
    badge: 'Pro',
    colors: {
      primary: '#22c55e',
      secondary: '#16a34a',
      background: '#f0fdf4',
      card: '#dcfce7'
    }
  },
  {
    id: 'trading-blue',
    name: 'Trading Blue',
    description: 'Blue-focused theme for analytical work',
    icon: Square,
    badge: 'Pro',
    colors: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      background: '#eff6ff',
      card: '#dbeafe'
    }
  },
  {
    id: 'trading-modern',
    name: 'Trading Modern',
    description: 'Modern emerald/purple theme with premium styling',
    icon: Zap,
    badge: 'Premium',
    colors: {
      primary: '#10b981',
      secondary: '#8b5cf6',
      background: '#fefefe',
      card: '#ffffff'
    }
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum contrast for accessibility',
    icon: Eye,
    badge: 'A11y',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#ffffff',
      card: '#f5f5f5'
    }
  }
]

export function ThemeManager({ className }: ThemeManagerProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<string | null>(null)
  const [customSettings, setCustomSettings] = useState({
    animations: true,
    reducedMotion: false,
    autoSave: true,
    systemSync: true
  })

  useEffect(() => {
    setMounted(true)
    
    // Load custom settings from localStorage
    const savedSettings = localStorage.getItem('theme-settings')
    if (savedSettings) {
      try {
        setCustomSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to parse theme settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Save settings when they change
    if (mounted && customSettings.autoSave) {
      localStorage.setItem('theme-settings', JSON.stringify(customSettings))
    }
  }, [customSettings, mounted])

  const handleThemePreview = (themeId: string) => {
    setPreviewTheme(themeId)
    setTheme(themeId)
  }

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId)
    setPreviewTheme(null)
    if (customSettings.autoSave) {
      localStorage.setItem('selected-theme', themeId)
    }
  }

  const handleResetToDefault = () => {
    setTheme('dark')
    setPreviewTheme(null)
    localStorage.removeItem('selected-theme')
  }

  const exportThemeSettings = () => {
    const settings = {
      theme: theme,
      customSettings: customSettings,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cival-theme-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importThemeSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string)
        if (settings.theme) {
          setTheme(settings.theme)
        }
        if (settings.customSettings) {
          setCustomSettings(settings.customSettings)
        }
      } catch (error) {
        console.error('Failed to import theme settings:', error)
      }
    }
    reader.readAsText(file)
  }

  if (!mounted) {
    return null
  }

  const currentPreset = THEME_PRESETS.find(preset => preset.id === (previewTheme || theme))

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Palette className="h-4 w-4 mr-2" />
          Theme Manager
          {currentPreset && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {currentPreset.badge}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Theme Manager</span>
          </DialogTitle>
          <DialogDescription>
            Customize your trading dashboard appearance and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Theme Status */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-sm">Current Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentPreset && (
                    <>
                      <currentPreset.icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{currentPreset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {currentPreset.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{currentPreset?.badge}</Badge>
                  {resolvedTheme && resolvedTheme !== theme && (
                    <Badge variant="secondary" className="text-xs">
                      Auto: {resolvedTheme}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Presets */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-sm">Theme Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {THEME_PRESETS.map((preset) => {
                  const Icon = preset.icon
                  const isActive = theme === preset.id
                  const isPreview = previewTheme === preset.id
                  
                  return (
                    <motion.div
                      key={preset.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all border-2 bg-card ${
                          isActive ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleThemeSelect(preset.id)}
                        onMouseEnter={() => handleThemePreview(preset.id)}
                        onMouseLeave={() => setPreviewTheme(null)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Icon className="h-5 w-5" />
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {preset.badge}
                              </Badge>
                              {isActive && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>
                          
                          <h4 className="font-medium mb-1">{preset.name}</h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            {preset.description}
                          </p>
                          
                          {/* Color Preview */}
                          <div className="flex space-x-1">
                            {Object.values(preset.colors).map((color, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded-full border border-border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-sm">Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations" className="text-sm">
                    Enable Animations
                  </Label>
                  <Switch
                    id="animations"
                    checked={customSettings.animations}
                    onCheckedChange={(checked) =>
                      setCustomSettings(prev => ({ ...prev, animations: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="reduced-motion" className="text-sm">
                    Reduced Motion
                  </Label>
                  <Switch
                    id="reduced-motion"
                    checked={customSettings.reducedMotion}
                    onCheckedChange={(checked) =>
                      setCustomSettings(prev => ({ ...prev, reducedMotion: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save" className="text-sm">
                    Auto-save Settings
                  </Label>
                  <Switch
                    id="auto-save"
                    checked={customSettings.autoSave}
                    onCheckedChange={(checked) =>
                      setCustomSettings(prev => ({ ...prev, autoSave: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-sync" className="text-sm">
                    Sync with System
                  </Label>
                  <Switch
                    id="system-sync"
                    checked={customSettings.systemSync}
                    onCheckedChange={(checked) => {
                      setCustomSettings(prev => ({ ...prev, systemSync: checked }))
                      if (checked) {
                        setTheme('system')
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import/Export Actions */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-sm">Theme Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportThemeSettings}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importThemeSettings}
                  />
                </label>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefault}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ThemeManager