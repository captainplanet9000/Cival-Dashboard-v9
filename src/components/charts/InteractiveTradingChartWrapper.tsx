'use client'

import dynamic from 'next/dynamic'

// Dynamic import with no SSR to avoid canvas dependency issue
const InteractiveTradingChart = dynamic(
  () => import('./InteractiveTradingChart'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading chart...</p>
      </div>
    )
  }
)

export default InteractiveTradingChart