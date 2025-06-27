/**
 * Test page to compare static vs dynamic imports
 * This will help identify if the circular dependency is caused by dynamic import pattern
 */

'use client'

import React from 'react'
// STATIC IMPORT - test if this causes the same circular dependency error
import TestStaticDashboard from '@/components/dashboard/TestStaticDashboard'

export default function TestStaticPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Static Import Test</h1>
        <p className="text-gray-600">
          Testing static import of dashboard component to isolate dynamic import issues
        </p>
      </div>
      
      <div className="border-2 border-dashed border-yellow-300 p-4 mb-6 bg-yellow-50">
        <p className="text-yellow-800 font-semibold">
          🧪 EXPERIMENT: Static import vs Dynamic import
        </p>
        <p className="text-yellow-700 text-sm mt-1">
          If this page loads without "Cannot access before initialization" error,
          then the issue is with dynamic imports, not the component itself.
        </p>
      </div>

      <TestStaticDashboard />
    </div>
  )
}