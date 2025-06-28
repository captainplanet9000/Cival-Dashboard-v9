/**
 * Enhanced V7 Dashboard - Restored Design
 * Advanced trading platform with AI memory integration
 */

'use client'

import React from 'react'
import AdvancedConsolidatedTab from '@/components/dashboard/AdvancedConsolidatedTab'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Cival Trading Dashboard</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Advanced AI-powered algorithmic trading platform with memory integration
              </p>
            </div>
          </div>

          {/* Advanced Consolidated Dashboard */}
          <AdvancedConsolidatedTab />
        </div>
      </div>
    </div>
  )
}