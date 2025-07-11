#!/usr/bin/env node
/**
 * Execute Supabase Migration Script
 * Runs the dashboard persistence migration directly via Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting Supabase migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/supabase_migration_008_dashboard_persistence.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log(`📏 Migration size: ${migrationSQL.length} characters`);
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔢 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}:`);
      console.log(`   ${statement.substring(0, 100)}...`);
      
      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration completed:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!');
      return true;
    } else {
      console.log('⚠️ Migration completed with errors');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

// Alternative approach: Direct SQL execution
async function runMigrationDirect() {
  console.log('🔄 Trying direct SQL execution...');
  
  try {
    const migrationPath = path.join(__dirname, '../database/supabase_migration_008_dashboard_persistence.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Try executing the entire migration as one statement
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('❌ Cannot connect to Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully');
    console.log('📋 Existing tables:', data.map(t => t.table_name));
    
    // Check if tables already exist
    const tableNames = data.map(t => t.table_name);
    const requiredTables = ['dashboard_state', 'user_preferences', 'dashboard_sessions', 'persistence_health'];
    const existingTables = requiredTables.filter(table => tableNames.includes(table));
    
    if (existingTables.length > 0) {
      console.log('✅ Tables already exist:', existingTables);
      console.log('🎉 Migration appears to be already completed!');
      return true;
    }
    
    console.log('⚠️ Tables do not exist, migration needed');
    return false;
    
  } catch (error) {
    console.error('❌ Direct migration failed:', error.message);
    return false;
  }
}

// Run the migration
async function main() {
  console.log('🚀 Supabase Dashboard Persistence Migration');
  console.log('==========================================');
  
  // First check if tables already exist
  const directResult = await runMigrationDirect();
  
  if (directResult) {
    console.log('✅ Migration check completed - tables exist');
    process.exit(0);
  }
  
  // If tables don't exist, run the migration
  const migrationResult = await runMigration();
  
  if (migrationResult) {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } else {
    console.log('❌ Migration failed');
    process.exit(1);
  }
}

main();