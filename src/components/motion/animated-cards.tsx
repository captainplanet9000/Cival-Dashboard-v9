'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

interface AnimatedCardsProps {
  className?: string
}

export function AnimatedCards({ className }: AnimatedCardsProps) {
  const positions = [
    {
      id: 1,
      symbol: 'BTC/USD',
      position: 'Long',
      size: 0.5,
      entry: 44250,
      current: 45123,
      pnl: 436.50,
      pnlPercent: 0.98,
      status: 'active'
    },
    {
      id: 2,
      symbol: 'ETH/USD',
      position: 'Long',
      size: 2.3,
      entry: 2234,
      current: 2289,
      pnl: 126.50,
      pnlPercent: 2.46,
      status: 'active'
    },
    {
      id: 3,
      symbol: 'SOL/USD',
      position: 'Short',
      size: 10,
      entry: 98.50,
      current: 96.20,
      pnl: 23.00,
      pnlPercent: 2.34,
      status: 'active'
    },
    {
      id: 4,
      symbol: 'MATIC/USD',
      position: 'Long',
      size: 500,
      entry: 0.8920,
      current: 0.8750,
      pnl: -85.00,
      pnlPercent: -1.91,
      status: 'warning'
    }
  ]

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Active Positions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {positions.map((position, index) => (
          <motion.div
            key={position.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card
              className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{position.symbol}</CardTitle>
                <Badge
                  variant={position.position === 'Long' ? 'default' : 'destructive'}
                  className={position.position === 'Long' ? 'bg-green-500' : ''}
                >
                  {position.position}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">{position.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entry:</span>
                  <span className="font-medium">${position.entry.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">${position.current.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">P&L:</span>
                    <div className="flex items-center gap-1">
                      {position.pnl >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-bold ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${Math.abs(position.pnl).toFixed(2)}
                      </span>
                      <span className={`text-sm ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Animated background effect */}
              <div 
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${position.pnl >= 0 ? '#10b981' : '#ef4444'} 0%, transparent 100%)`,
                }}
              />
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Total Positions: {positions.length}
        </div>
        <Button variant="outline" size="sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          View All Positions
        </Button>
      </div>
    </div>
  )
}

export default AnimatedCards