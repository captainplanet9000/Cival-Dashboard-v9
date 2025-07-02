'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChart } from 'lucide-react'

const PortfolioTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Portfolio Management
        </CardTitle>
        <CardDescription>Portfolio tracking with live updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Portfolio Analytics</h3>
          <p className="text-muted-foreground mb-4">Real-time portfolio tracking and analytics</p>
          <Badge variant="outline">Coming from existing components</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default PortfolioTab