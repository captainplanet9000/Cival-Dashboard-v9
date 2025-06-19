'use client'

import React, { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Fallback AG-UI Provider
export function AGUIProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Fallback AG-UI Chat
export function AGUIChat() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AG-UI Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          AG-UI Chat component is temporarily disabled for debugging.
        </p>
      </CardContent>
    </Card>
  )
}
