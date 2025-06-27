/**
 * Test page for minimal useState pattern
 */

'use client'

import React from 'react'
import MinimalStateTest from '@/components/ui/MinimalStateTest'

export default function TestMinimalPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Minimal useState Pattern Test</h1>
        <p className="text-gray-600">
          Testing if the specific useState + array + switch pattern triggers the circular dependency
        </p>
      </div>
      
      <div className="border-2 border-dashed border-red-300 p-4 mb-6 bg-red-50">
        <p className="text-red-800 font-semibold">
          🧪 FINAL TEST: Minimal useState Pattern
        </p>
        <p className="text-red-700 text-sm mt-1">
          If this fails → useState + array + switch pattern is the root cause
        </p>
        <p className="text-red-700 text-sm">
          If this passes → Something else in the larger component structure
        </p>
      </div>

      <MinimalStateTest />
    </div>
  )
}