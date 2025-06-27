/**
 * Test page for renamed component
 * Testing if the issue is with component naming or file structure
 */

'use client'

import React from 'react'
// Test completely different name and location
import SimpleTradingView from '@/components/ui/SimpleTradingView'

export default function TestRenamePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Component Rename Test</h1>
        <p className="text-gray-600">
          Testing if the circular dependency is caused by component naming or file structure
        </p>
      </div>
      
      <div className="border-2 border-dashed border-purple-300 p-4 mb-6 bg-purple-50">
        <p className="text-purple-800 font-semibold">
          🧪 EXPERIMENT: Component Naming & File Structure
        </p>
        <p className="text-purple-700 text-sm mt-1">
          <strong>Changes:</strong> EnhancedDashboard → SimpleTradingView | /components/dashboard/ → /components/ui/
        </p>
        <p className="text-purple-700 text-sm">
          <strong>Logic:</strong> Identical component structure and useState patterns
        </p>
      </div>

      <SimpleTradingView />
    </div>
  )
}