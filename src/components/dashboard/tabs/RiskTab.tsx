'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

const RiskTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Management
        </CardTitle>
        <CardDescription>Risk monitoring and alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Risk Management</h3>
          <p className="text-muted-foreground mb-4">Comprehensive risk monitoring and controls</p>
          <Badge variant="outline">Coming from existing components</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default RiskTab