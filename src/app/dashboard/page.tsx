/**
 * Main Dashboard Page
 * Testing with Shadcn/UI components restored
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Trading Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">✅ Online</div>
            <p className="text-sm text-muted-foreground">
              Dashboard loading successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-sm text-muted-foreground">
              No active positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">
              No agents running
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Component Restoration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Testing incremental restoration of components to identify module 98189 error source.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ ThemeProvider restored - No errors</li>
            <li>✅ ErrorBoundary restored - No errors</li>
            <li>✅ Shadcn/UI Card components restored - Testing...</li>
            <li>⏳ Dynamic imports - Pending</li>
            <li>⏳ Complex components - Pending</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}