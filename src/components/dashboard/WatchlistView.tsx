/**
 * Watchlist View Component
 * Real-time watchlist management with agent integration
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Star, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  Bell, 
  Settings, 
  Trash2,
  Edit3,
  Download,
  Upload,
  Target,
  DollarSign,
  Volume2,
  Activity
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { useAppStore, Watchlist, WatchlistItem, PriceAlert } from '@/lib/stores/app-store'
import { PriceData } from '@/lib/services/watchlist-service'

export function WatchlistView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>('')
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [isCreateWatchlistDialogOpen, setIsCreateWatchlistDialogOpen] = useState(false)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [newItemSymbol, setNewItemSymbol] = useState('')
  const [newWatchlistName, setNewWatchlistName] = useState('')
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null)
  const [priceData, setPriceData] = useState<Map<string, PriceData>>(new Map())

  // Store integration
  const {
    watchlists,
    addWatchlist,
    addWatchlistItem,
    updateWatchlistItem,
    removeWatchlistItem,
    addPriceAlert,
    addAgentWatchlistAssignment
  } = useAppStore()

  // Start watchlist service on mount
  useEffect(() => {
    const startService = async () => {
      const { watchlistService } = await import('@/lib/services/watchlist-service')
      watchlistService.start()
    }
    
    startService()
    
    return () => {
      const stopService = async () => {
        const { watchlistService } = await import('@/lib/services/watchlist-service')
        watchlistService.stop()
      }
      stopService()
    }
  }, [])

  // Subscribe to price updates for all watchlist items
  useEffect(() => {
    const subscriptions: Array<() => void> = []
    
    const setupSubscriptions = async () => {
      const { watchlistService } = await import('@/lib/services/watchlist-service')
      
      watchlists.forEach(watchlist => {
        watchlist.items.forEach(item => {
          const unsub = watchlistService.subscribeToPriceUpdates(item.symbol, (data) => {
            setPriceData(prev => new Map(prev.set(item.symbol, data)))
            
            // Update item in store
            updateWatchlistItem(watchlist.id, item.id, {
              currentPrice: data.price,
              change24h: data.change24h,
              volume24h: data.volume24h,
              updatedAt: new Date()
            })
          })
          subscriptions.push(unsub)
        })
      })
    }
    
    setupSubscriptions()

    return () => {
      subscriptions.forEach(unsub => unsub())
    }
  }, [watchlists, updateWatchlistItem])

  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) return

    const { watchlistService } = await import('@/lib/services/watchlist-service')
    const watchlist = await watchlistService.createWatchlist(newWatchlistName)
    addWatchlist(watchlist)
    setNewWatchlistName('')
    setIsCreateWatchlistDialogOpen(false)
    setSelectedWatchlist(watchlist.id)
  }

  const handleAddItem = async () => {
    if (!newItemSymbol.trim() || !selectedWatchlist) return

    const { watchlistService } = await import('@/lib/services/watchlist-service')
    const item = await watchlistService.addToWatchlist(selectedWatchlist, newItemSymbol)
    addWatchlistItem(selectedWatchlist, item)
    setNewItemSymbol('')
    setIsAddItemDialogOpen(false)
  }

  const handleRemoveItem = async (watchlistId: string, itemId: string) => {
    const { watchlistService } = await import('@/lib/services/watchlist-service')
    await watchlistService.removeFromWatchlist(watchlistId, itemId)
    removeWatchlistItem(watchlistId, itemId)
  }

  const handleCreateAlert = async (symbol: string, type: 'above' | 'below', targetPrice: number) => {
    const { watchlistService } = await import('@/lib/services/watchlist-service')
    const alert = await watchlistService.createPriceAlert(symbol, type, targetPrice)
    addPriceAlert(alert)
  }

  const handleAssignAgent = async (agentId: string, symbol: string, strategy: string) => {
    if (!selectedWatchlist) return
    
    const { watchlistService } = await import('@/lib/services/watchlist-service')
    const assignment = await watchlistService.assignAgentToSymbol(
      agentId, 
      selectedWatchlist, 
      symbol,
      { strategy }
    )
    addAgentWatchlistAssignment(assignment)
  }

  const filteredWatchlists = watchlists.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentWatchlist = watchlists.find(w => w.id === selectedWatchlist)
  const filteredItems = currentWatchlist?.items.filter(item =>
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const generateMockChart = (symbol: string) => {
    const data = []
    const basePrice = priceData.get(symbol)?.price || 100
    for (let i = 23; i >= 0; i--) {
      data.push({
        time: new Date(Date.now() - i * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit' }),
        price: basePrice + (Math.random() - 0.5) * basePrice * 0.1
      })
    }
    return data
  }

  const WatchlistCard = ({ watchlist }: { watchlist: Watchlist }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selectedWatchlist === watchlist.id ? 'ring-2 ring-emerald-500 shadow-lg' : ''
      }`}
      onClick={() => setSelectedWatchlist(watchlist.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{watchlist.name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {watchlist.items.length} items
          </Badge>
        </div>
        {watchlist.description && (
          <CardDescription className="text-xs">{watchlist.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Updated {watchlist.updatedAt.toLocaleDateString()}</span>
          {watchlist.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
        </div>
      </CardContent>
    </Card>
  )

  const WatchlistItemRow = ({ item, watchlistId }: { item: WatchlistItem; watchlistId: string }) => {
    const currentData = priceData.get(item.symbol)
    const isPositive = (currentData?.change24h || 0) >= 0

    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            {/* Symbol */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-violet-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {item.symbol.substring(0, 2)}
                </span>
              </div>
              <div>
                <div className="font-semibold">{item.symbol}</div>
                {item.exchange && (
                  <div className="text-xs text-gray-500">{item.exchange}</div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="text-right md:text-left">
              <div className="font-semibold">
                ${currentData?.price.toLocaleString() || item.currentPrice.toLocaleString()}
              </div>
              <div className={`text-xs flex items-center ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(currentData?.changePercent24h || 0).toFixed(2)}%
              </div>
            </div>

            {/* 24h Change */}
            <div className="text-right md:text-left">
              <div className={`font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                ${Math.abs(currentData?.change24h || 0).toFixed(4)}
              </div>
              <div className="text-xs text-gray-500">24h Change</div>
            </div>

            {/* Volume */}
            <div className="text-right md:text-left">
              <div className="font-semibold">
                ${(currentData?.volume24h || 0).toLocaleString(undefined, { notation: 'compact' })}
              </div>
              <div className="text-xs text-gray-500">Volume</div>
            </div>

            {/* Mini Chart */}
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateMockChart(item.symbol)}>
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isPositive ? "#10b981" : "#ef4444"} 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedItem(item)
                  setIsAlertDialogOpen(true)
                }}
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Open agent assignment dialog
                }}
              >
                <Bot className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveItem(watchlistId, item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Target Prices */}
          {(item.targetPrice || item.stopLoss || item.takeProfit) && (
            <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
              {item.targetPrice && (
                <Badge variant="outline" className="text-xs">
                  <Target className="w-3 h-3 mr-1" />
                  Target: ${item.targetPrice}
                </Badge>
              )}
              {item.stopLoss && (
                <Badge variant="outline" className="text-xs text-red-600">
                  Stop: ${item.stopLoss}
                </Badge>
              )}
              {item.takeProfit && (
                <Badge variant="outline" className="text-xs text-emerald-600">
                  Profit: ${item.takeProfit}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
            Watchlist Management
          </h1>
          <p className="text-gray-500">Monitor prices and assign agents to trading opportunities</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={isCreateWatchlistDialogOpen} onOpenChange={setIsCreateWatchlistDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Watchlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Watchlist</DialogTitle>
                <DialogDescription>
                  Create a new watchlist to organize your trading symbols
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="watchlist-name">Watchlist Name</Label>
                  <Input
                    id="watchlist-name"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    placeholder="Enter watchlist name"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateWatchlistDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWatchlist}>
                    Create Watchlist
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button>
            <Activity className="w-4 h-4 mr-2" />
            Live Data
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search watchlists or symbols..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="watchlists">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="watchlists">Watchlists</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="watchlists" className="space-y-4">
          {/* Watchlists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWatchlists.map(watchlist => (
              <WatchlistCard key={watchlist.id} watchlist={watchlist} />
            ))}
            
            {/* Create New Card */}
            <Card 
              className="border-2 border-dashed border-gray-300 cursor-pointer hover:border-emerald-500 transition-colors"
              onClick={() => setIsCreateWatchlistDialogOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Plus className="w-8 h-8 text-gray-400 mb-2" />
                <div className="text-sm font-medium text-gray-600">Create New Watchlist</div>
                <div className="text-xs text-gray-500">Organize your trading symbols</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {selectedWatchlist ? (
            <>
              {/* Add Item */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {currentWatchlist?.name} Items
                    </CardTitle>
                    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Symbol
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Symbol to Watchlist</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="symbol">Symbol</Label>
                            <Input
                              id="symbol"
                              value={newItemSymbol}
                              onChange={(e) => setNewItemSymbol(e.target.value.toUpperCase())}
                              placeholder="BTC, ETH, SOL..."
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddItem}>
                              Add Symbol
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
              </Card>

              {/* Items List */}
              <div className="space-y-3">
                {filteredItems.map(item => (
                  <WatchlistItemRow 
                    key={item.id} 
                    item={item} 
                    watchlistId={selectedWatchlist}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Star className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Watchlist</h3>
                <p className="text-gray-500">Choose a watchlist to view and manage its items</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Price Alerts</h3>
              <p className="text-gray-500">Set up price alerts to get notified when targets are hit</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Dialog */}
      {selectedItem && (
        <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Price Alert for {selectedItem.symbol}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Alert Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select alert type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Price Above</SelectItem>
                    <SelectItem value="below">Price Below</SelectItem>
                    <SelectItem value="change">Percentage Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Price</Label>
                <Input type="number" placeholder="Enter target price" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAlertDialogOpen(false)}>
                  Create Alert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}