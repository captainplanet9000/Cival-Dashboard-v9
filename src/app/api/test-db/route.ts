import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials' 
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)

    if (connectionError) {
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: connectionError.message 
      }, { status: 500 })
    }

    // Check if dashboard tables exist
    const requiredTables = ['dashboard_state', 'user_preferences', 'dashboard_sessions', 'persistence_health']
    const existingTables = connectionTest
      ?.map(t => t.table_name)
      .filter(name => requiredTables.includes(name)) || []

    return NextResponse.json({
      status: 'success',
      connection: 'active',
      existingTables,
      missingTables: requiredTables.filter(table => !existingTables.includes(table)),
      totalTables: connectionTest?.length || 0
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}