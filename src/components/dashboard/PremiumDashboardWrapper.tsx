'use client'

import React, { useState, useEffect } from 'react'
import { CommandPalette } from '@/components/premium-ui/command/command-palette'
import { NotificationSystem } from '@/components/premium-ui/notifications/notification-system'
import { motion, AnimatePresence } from 'framer-motion'
import { Kbd } from '@/components/ui/kbd'
import { Badge } from '@/components/ui/badge'
import { Zap, Command } from 'lucide-react'

interface PremiumDashboardWrapperProps {
  children: React.ReactNode
}

export function PremiumDashboardWrapper({ children }: PremiumDashboardWrapperProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [showKeyboardHint, setShowKeyboardHint] = useState(true)

  // Command palette keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Hide keyboard hint after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowKeyboardHint(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-screen">
      {/* Premium Features Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <AnimatePresence>
          {showKeyboardHint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-amber-200 rounded-lg p-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Premium Features Active
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-amber-700">
                <span>Press</span>
                <Kbd>
                  <Command className="h-3 w-3" />
                  K
                </Kbd>
                <span>for command palette</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Dashboard Content */}
      <div className="w-full">
        {children}
      </div>

      {/* Premium Features Overlay */}
      <CommandPalette 
        open={commandOpen} 
        onOpenChange={setCommandOpen}
      />
      
      <NotificationSystem />

      {/* Premium Status Bar */}
      <div className="fixed bottom-4 left-4 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-400 text-white border-0">
              <Zap className="h-3 w-3 mr-1" />
              Premium
            </Badge>
            <span className="text-xs text-gray-600">
              Enhanced features active
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PremiumDashboardWrapper