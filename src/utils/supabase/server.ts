import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Mock server client that uses the same client-side implementation
// This removes the dependency on next/headers for solo operator usage
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  // Return null client during build/SSG if no real credentials
  if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
    console.warn('Supabase server client: Using placeholder credentials during build')
    return null as any
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Disable session persistence for server-side usage
      autoRefreshToken: false, // Disable auto refresh for server-side usage
    },
  })
}