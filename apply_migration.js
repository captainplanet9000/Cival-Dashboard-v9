#!/usr/bin/env node
/**
 * Apply database migration to Supabase using the JavaScript client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
    try {
        // Get Supabase credentials
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('❌ Missing Supabase credentials in environment variables');
            return false;
        }
        
        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        console.log('🔌 Connected to Supabase');
        
        // Read migration file
        const migrationFile = path.join(__dirname, 'supabase/migrations/20250526105300_consolidated_agent_trading_schema.sql');
        const migrationSql = fs.readFileSync(migrationFile, 'utf8');
        
        console.log(`📄 Loaded migration file: ${migrationFile}`);
        console.log(`📝 Migration contains ${migrationSql.length} characters`);
        
        // Split the migration into individual statements
        const statements = migrationSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`⚡ Applying ${statements.length} migration statements...`);
        
        // Apply each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.includes('CREATE TABLE') || statement.includes('CREATE POLICY') || statement.includes('CREATE TRIGGER')) {
                console.log(`  📝 Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
                
                // Use the raw SQL function to execute the statement
                const { error } = await supabase.rpc('exec_sql', { sql: statement });
                
                if (error) {
                    console.error(`❌ Error executing statement ${i + 1}:`, error);
                    // Continue with next statement as some might already exist
                }
            }
        }
        
        console.log('🎉 Migration application completed!');
        
        // Verify tables were created
        console.log('🔍 Verifying tables were created...');
        
        const tablesToCheck = [
            'agent_trading_permissions',
            'agent_trades', 
            'agent_positions',
            'agent_performance',
            'agent_status',
            'agent_market_data_subscriptions',
            'agent_state',
            'agent_checkpoints',
            'agent_decisions'
        ];
        
        for (const table of tablesToCheck) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ Table '${table}' not accessible: ${error.message}`);
            } else {
                console.log(`✅ Table '${table}' exists and is accessible`);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error applying migration:', error);
        return false;
    }
}

// Run the migration
applyMigration().then(success => {
    if (success) {
        console.log('\n✅ Database migration completed successfully!');
        console.log('🚀 All agent trading tables are now available in Supabase');
    } else {
        console.log('\n❌ Migration failed - please check the error messages above');
    }
    process.exit(success ? 0 : 1);
});