#!/usr/bin/env node
/**
 * Check if agent trading tables exist in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
    try {
        // Get Supabase credentials
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('❌ Missing Supabase credentials');
            return false;
        }
        
        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        console.log('🔌 Connected to Supabase');
        console.log('🔍 Checking which agent trading tables exist...\n');
        
        const tablesToCheck = [
            'agent_trading_permissions',
            'agent_trades', 
            'agent_positions',
            'agent_performance',
            'agent_status',
            'agent_market_data_subscriptions',
            'agent_state',
            'agent_checkpoints',
            'agent_decisions',
            'agents',  // Check existing agents table too
            'farms'    // Check existing farms table too
        ];
        
        let existingTables = [];
        let missingTables = [];
        
        for (const table of tablesToCheck) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    if (error.message.includes('relation') && error.message.includes('does not exist')) {
                        console.log(`❌ Table '${table}' does not exist`);
                        missingTables.push(table);
                    } else {
                        console.log(`⚠️  Table '${table}' exists but error accessing: ${error.message}`);
                        existingTables.push(table);
                    }
                } else {
                    console.log(`✅ Table '${table}' exists and is accessible`);
                    existingTables.push(table);
                }
            } catch (err) {
                console.log(`❌ Error checking table '${table}': ${err.message}`);
                missingTables.push(table);
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`✅ Existing tables: ${existingTables.length}`);
        console.log(`❌ Missing tables: ${missingTables.length}`);
        
        if (existingTables.length > 0) {
            console.log(`\n✅ Existing tables: ${existingTables.join(', ')}`);
        }
        
        if (missingTables.length > 0) {
            console.log(`\n❌ Missing tables: ${missingTables.join(', ')}`);
            console.log(`\n💡 These tables need to be created through the migration.`);
        }
        
        return missingTables.length === 0;
        
    } catch (error) {
        console.error('❌ Error checking tables:', error);
        return false;
    }
}

// Run the check
checkTables().then(allExist => {
    if (allExist) {
        console.log('\n🎉 All agent trading tables exist!');
    } else {
        console.log('\n⚠️  Some agent trading tables are missing and need to be created.');
    }
    process.exit(0);
});