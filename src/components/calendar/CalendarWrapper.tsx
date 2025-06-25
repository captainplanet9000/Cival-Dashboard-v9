/**
 * Calendar Wrapper Component
 * Provides a complete calendar interface for the dashboard
 */

'use client'

import React from 'react'
import { CalendarView } from './CalendarView'

export default function CalendarWrapper() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Trading Calendar</h2>
        <p className="text-muted-foreground">
          Track important trading events, earnings, and market schedules
        </p>
      </div>
      
      <CalendarView />
    </div>
  )
}

export { CalendarWrapper }