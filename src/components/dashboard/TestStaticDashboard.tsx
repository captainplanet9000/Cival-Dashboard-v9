'use client'

import React, { useState } from 'react'

/**
 * Test component identical to EnhancedDashboard but with static import
 * This will help determine if the circular dependency is caused by dynamic imports
 */
export default function TestStaticDashboard() {
  const [activeView, setActiveView] = useState('overview')

  const navigationItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'market', label: 'Market Data' },
    { id: 'trading', label: 'Trading' },
    { id: 'agents', label: 'AI Agents' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'risk', label: 'Risk & Compliance' },
    { id: 'settings', label: 'Settings' }
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">System Status</h3>
              <div className="text-2xl font-bold text-green-600">✅ Operational</div>
              <p className="text-sm text-gray-600 mt-2">
                All systems running normally
              </p>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Active Agents</h3>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-gray-600 mt-2">
                No agents currently active
              </p>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Portfolio Value</h3>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-sm text-gray-600 mt-2">
                Connect wallet to view portfolio
              </p>
            </div>

            <div className="border rounded-lg p-6 md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold mb-2">System Health</h3>
              <p className="text-sm text-gray-600">Current system status and alerts</p>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">
                  🧪 Testing STATIC IMPORT version to isolate dynamic import issues.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">{navigationItems.find(item => item.id === activeView)?.label}</h3>
            <p className="text-gray-600">This section is under construction</p>
            <p className="text-sm text-gray-500 mt-2">
              The {activeView} section will be available soon. Testing static imports.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-full min-h-[600px]">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Static Import Test</h2>
          <p className="text-sm text-gray-600">Testing Static vs Dynamic</p>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`w-full text-left px-3 py-2 rounded transition-colors ${
                activeView === item.id 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderContent()}
      </div>
    </div>
  )
}