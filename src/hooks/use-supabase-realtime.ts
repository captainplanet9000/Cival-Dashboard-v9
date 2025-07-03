'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/utils/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface SupabaseRealtimeData {
  [key: string]: any
}

interface UseSupabaseRealtimeReturn {
  data: SupabaseRealtimeData | null
  connected: boolean
  error: string | null
  subscribe: (table: string) => void
  unsubscribe: () => void
}

/**
 * Custom hook for Supabase real-time data
 * Provides live database updates with fallback mock data
 */
export function useSupabaseRealtime(table: string = 'dashboard'): UseSupabaseRealtimeReturn {
  const [data, setData] = useState<SupabaseRealtimeData | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [currentTable, setCurrentTable] = useState(table)

  // Mock data generator for development
  const generateMockData = useCallback((tableName: string) => {
    const mockData: SupabaseRealtimeData = {}
    
    switch (tableName) {
      case 'dashboard':
        mockData.metrics = {
          totalUsers: Math.floor(Math.random() * 100) + 50,
          activeStrategies: Math.floor(Math.random() * 20) + 10,
          totalVolume: Math.random() * 1000000 + 500000,
          uptime: '99.9%',
          lastUpdate: new Date().toISOString()
        }
        break
      case 'trading':
        mockData.trades = Array.from({ length: 5 }, (_, i) => ({
          id: `trade-${Date.now()}-${i}`,
          symbol: ['BTCUSD', 'ETHUSD', 'ADAUSD'][Math.floor(Math.random() * 3)],
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          quantity: Math.random() * 10 + 1,
          price: Math.random() * 50000 + 30000,
          timestamp: new Date().toISOString()
        }))
        break
      case 'portfolio':
        mockData.positions = [
          {
            symbol: 'BTCUSD',
            quantity: 2.5,
            entry_price: 45000,
            current_price: 47500 + Math.random() * 2000,
            pnl: Math.random() * 5000 - 1000
          },
          {
            symbol: 'ETHUSD', 
            quantity: 10.0,
            entry_price: 3200,
            current_price: 3350 + Math.random() * 200,
            pnl: Math.random() * 2000 - 500
          }
        ]
        break
      default:
        mockData[tableName] = {
          records: Math.floor(Math.random() * 100),
          lastSync: new Date().toISOString()
        }
    }
    
    return mockData
  }, [])

  // Check Supabase connection
  const checkSupabaseConnection = useCallback(async () => {
    try {
      const supabase = createBrowserClient()
      
      if (!supabase) {
        setConnected(false)
        setError('Supabase client not available (using placeholder credentials)')
        return
      }

      // Test connection with a simple query
      const { error: testError } = await supabase
        .from('portfolios')
        .select('count')
        .limit(1)
        .single()

      if (testError && testError.code !== 'PGRST116') {
        // PGRST116 is "not found" which means connection works but table doesn't exist
        setConnected(false)
        setError(`Supabase connection failed: ${testError.message}`)
      } else {
        setConnected(true)
        setError(null)
      }
    } catch (err) {
      setConnected(false)
      setError(err instanceof Error ? err.message : 'Supabase connection failed')
    }
  }, [])

  // Subscribe to table changes
  const subscribe = useCallback((tableName: string) => {
    setCurrentTable(tableName)
    
    const supabase = createBrowserClient()
    if (!supabase) {
      // Use mock data if no real connection
      setData(generateMockData(tableName))
      return
    }

    try {
      // Unsubscribe from previous channel
      if (channel) {
        supabase.removeChannel(channel)
      }

      // Create new channel for real-time updates
      const newChannel = supabase
        .channel(`public:${tableName}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: tableName 
          },
          (payload) => {
            console.log('Real-time update:', payload)
            // Update data based on the change
            setData(prev => ({
              ...prev,
              [tableName]: payload.new || payload.old,
              lastUpdate: new Date().toISOString()
            }))
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true)
            setError(null)
          } else if (status === 'CHANNEL_ERROR') {
            setConnected(false)
            setError('Failed to subscribe to real-time updates')
          }
        })

      setChannel(newChannel)
    } catch (err) {
      setConnected(false)
      setError(err instanceof Error ? err.message : 'Subscription failed')
    }
  }, [channel, generateMockData])

  // Unsubscribe from all channels
  const unsubscribe = useCallback(() => {
    const supabase = createBrowserClient()
    if (supabase && channel) {
      supabase.removeChannel(channel)
      setChannel(null)
    }
  }, [channel])

  // Initialize connection and subscription
  useEffect(() => {
    checkSupabaseConnection()

    // TEMPORARILY DISABLED to stop Supabase request flood
    // Set up mock data polling for development (reduced frequency to prevent DB overload)
    // const interval = setInterval(() => {
    //   if (!connected) {
    //     const mockData = generateMockData(currentTable)
    //     setData(mockData)
    //   }
    // }, 60000) // Update every 60 seconds (reduced from 3 seconds)

    // Initial data load only
    const initialData = generateMockData(currentTable)
    setData(initialData)

    // TEMPORARILY DISABLED - Subscribe to real-time updates
    // subscribe(currentTable)

    return () => {
      // clearInterval(interval)
      unsubscribe()
    }
  }, [currentTable, connected, generateMockData, subscribe, unsubscribe, checkSupabaseConnection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return {
    data,
    connected,
    error,
    subscribe,
    unsubscribe
  }
}