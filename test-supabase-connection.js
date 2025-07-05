const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  const supabaseUrl = 'https://kgxrctqagkyownskhimq.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtneHJjdHFhZ2t5b3duc2toaW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNzQxMjgsImV4cCI6MjA1MDk1MDEyOH0.4qO9cQOJ8cJ5cUDiGp51UjGGbK4zCUTTQuwZAo9XJKw';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('agents').select('count').limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('✅ Connected to Supabase but agents table does not exist');
      console.log('This is expected - we need to create the database schema');
      return true;
    } else if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    } else {
      console.log('✅ Connected to Supabase successfully');
      console.log('📊 Agents table data:', data);
      return true;
    }
  } catch (err) {
    console.error('❌ Connection failed:', err);
    return false;
  }
}

testSupabaseConnection().then(success => {
  if (success) {
    console.log('🚀 Ready to proceed with database setup');
  } else {
    console.log('❌ Need to fix Supabase connection first');
  }
  process.exit(success ? 0 : 1);
});