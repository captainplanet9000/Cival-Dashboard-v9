const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kgxrctqagkyownskhimq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtneHJjdHFhZ2t5b3duc2toaW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNzQxMjgsImV4cCI6MjA1MDk1MDEyOH0.4qO9cQOJ8cJ5cUDiGp51UjGGbK4zCUTTQuwZAo9XJKw';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function testFarmsTable() {
  console.log('Testing Supabase farms table...');
  
  try {
    // First try to query existing farms
    console.log('1. Querying existing farms...');
    const { data: existingFarms, error: queryError } = await supabase
      .from('farms')
      .select('*')
      .limit(5);
    
    if (queryError) {
      console.error('Query error:', queryError);
    } else {
      console.log('Existing farms:', existingFarms?.length || 0);
      if (existingFarms?.length > 0) {
        console.log('Sample farm:', existingFarms[0]);
      }
    }
    
    // Try to insert a test farm
    console.log('2. Creating test farm...');
    const testFarm = {
      name: 'Test Darvas Farm',
      description: 'Test farm for dashboard validation',
      farm_type: 'darvas_box',
      total_allocated_usd: 10000,
      agent_count: 2,
      performance_metrics: {
        totalPnL: 0,
        winRate: 0,
        tradeCount: 0
      },
      risk_metrics: {
        maxDrawdown: 0,
        sharpeRatio: 0
      },
      is_active: true
    };
    
    const { data: newFarm, error: insertError } = await supabase
      .from('farms')
      .insert(testFarm)
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Successfully created farm:', newFarm.farm_id);
    }
    
    // Query again to see total farms
    const { data: allFarms, error: finalError } = await supabase
      .from('farms')
      .select('*');
    
    if (finalError) {
      console.error('Final query error:', finalError);
    } else {
      console.log('Total farms in database:', allFarms?.length || 0);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFarmsTable();