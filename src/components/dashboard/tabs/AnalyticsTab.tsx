'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart } from 'lucide-react'

const AnalyticsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Analytics Dashboard
        </CardTitle>
        <CardDescription>Advanced analytics and performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
          <p className="text-muted-foreground mb-4">Deep insights and performance analysis</p>
          <Badge variant="outline">Coming from existing components</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default AnalyticsTab