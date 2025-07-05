/**
 * Supabase Client Configuration
 * Central configuration for Supabase database connection
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // For solo operator mode
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for real-time events
    },
  },
})

// Helper function to check if Supabase is available
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { error } = await supabase.from('system_configuration').select('config_key').limit(1)
    return !error
  } catch (error) {
    console.warn('Supabase not available:', error)
    return false
  }
}

// Helper function to safely query Supabase with fallbacks
export async function safeSupabaseQuery<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  fallback: T
): Promise<T> {
  try {
    const { data, error } = await query()
    if (error) {
      console.warn('Supabase query error:', error)
      return fallback
    }
    return data || fallback
  } catch (error) {
    console.warn('Supabase connection error:', error)
    return fallback
  }
}