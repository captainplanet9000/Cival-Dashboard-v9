'use client'

import React, { useState } from 'react'

/**
 * MINIMAL COMPONENT TEST - Testing exact useState pattern that might cause webpack bug
 */
export default function MinimalStateTest() {
  const [active, setActive] = useState('test')

  const items = [
    { id: 'test', name: 'Test' },
    { id: 'demo', name: 'Demo' }
  ]

  const getContent = () => {
    switch (active) {
      case 'test':
        return <div>Test content</div>
      default:
        return <div>Default content</div>
    }
  }

  return (
    <div>
      <h1>Minimal State Test</h1>
      
      {items.map((item) => (
        <button 
          key={item.id}
          onClick={() => setActive(item.id)}
        >
          {item.name}
        </button>
      ))}
      
      {getContent()}
    </div>
  )
}