'use client'

import { useEffect } from 'react'
import { runMigrations } from '@/lib/database/migration-runner'

export function MigrationInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Run migrations on app startup
    runMigrations().catch(error => {
      console.error('Migration initialization error:', error)
    })
  }, [])

  // Always render children - migrations run in background
  return <>{children}</>
}

export default MigrationInitializer