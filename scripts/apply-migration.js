#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔍 Checking current database schema...');
    
    // Check if agent_trading_permissions table exists
    const { data: existingTables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'agent_%');

    if (tableError) {
      console.log('ℹ️  Cannot check existing tables (expected for new schema)');
    } else {
      console.log('📋 Existing agent tables:', existingTables?.map(t => t.table_name) || []);
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250526105300_consolidated_agent_trading_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded, size:', migrationSQL.length, 'characters');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('🔧 Found', statements.length, 'SQL statements to execute');

    // Execute statements one by one
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length === 0) continue;

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_statement: statement + ';' 
        });

        if (error) {
          console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
          if (error.message.includes('already exists')) {
            console.log('   ↳ Table/function already exists, continuing...');
          } else {
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Error in statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log('✅ Successful statements:', successCount);
    console.log('⚠️  Errors/warnings:', errorCount);

    // Verify tables were created
    console.log('\n🔍 Verifying agent tables...');
    const { data: newTables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'agent_%');

    if (verifyError) {
      console.log('❌ Could not verify tables:', verifyError.message);
    } else {
      console.log('✅ Agent tables found:', newTables?.map(t => t.table_name) || []);
    }

    console.log('\n🎉 Migration application complete!');

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Create a helper RPC function for executing SQL if it doesn't exist
async function createSqlExecutor() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_statement TEXT)
    RETURNS TEXT AS $$
    BEGIN
      EXECUTE sql_statement;
      RETURN 'OK';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    // We can't directly execute this with the anon key, so let's try a different approach
    console.log('ℹ️  Note: Direct SQL execution may be limited with anonymous key');
  } catch (err) {
    console.log('ℹ️  SQL executor function may not be available');
  }
}

applyMigration();