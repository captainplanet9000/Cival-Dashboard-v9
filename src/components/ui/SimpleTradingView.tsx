'use client'

import React, { useState } from 'react'

/**
 * RENAMED COMPONENT TEST: 
 * Testing if the issue is with component naming or file structure
 * Identical logic to EnhancedDashboard but different name and location
 */
export default function SimpleTradingView() {
  const [currentSection, setCurrentSection] = useState('home')

  const menuOptions = [
    { id: 'home', text: 'Home' },
    { id: 'data', text: 'Data' },
    { id: 'trades', text: 'Trades' },
    { id: 'bots', text: 'Bots' },
    { id: 'wallet', text: 'Wallet' },
    { id: 'security', text: 'Security' },
    { id: 'config', text: 'Config' }
  ]

  const getContent = () => {
    switch (currentSection) {
      case 'home':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Status</h3>
              <div className="text-2xl font-bold text-green-600">✅ Running</div>
              <p className="text-sm text-gray-600 mt-2">
                System operational
              </p>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Bots</h3>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-gray-600 mt-2">
                No active bots
              </p>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Balance</h3>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-sm text-gray-600 mt-2">
                Connect wallet
              </p>
            </div>

            <div className="border rounded-lg p-6 md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold mb-2">Health Check</h3>
              <p className="text-sm text-gray-600">System status monitoring</p>
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
                <p className="text-purple-800">
                  🧪 Testing RENAMED component (SimpleTradingView) in different directory (/components/ui/)
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">{menuOptions.find(opt => opt.id === currentSection)?.text}</h3>
            <p className="text-gray-600">Section under development</p>
            <p className="text-sm text-gray-500 mt-2">
              The {currentSection} section is coming soon.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-full min-h-[600px]">
      {/* Left Menu */}
      <div className="w-64 border-r bg-purple-50 p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Trading App</h2>
          <p className="text-sm text-gray-600">Renamed Component Test</p>
        </div>

        <nav className="space-y-2">
          {menuOptions.map((option) => (
            <button
              key={option.id}
              className={`w-full text-left px-3 py-2 rounded transition-colors ${
                currentSection === option.id 
                  ? 'bg-purple-100 text-purple-900' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setCurrentSection(option.id)}
            >
              {option.text}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-auto p-6">
        {getContent()}
      </div>
    </div>
  )
}