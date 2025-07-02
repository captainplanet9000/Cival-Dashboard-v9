#!/usr/bin/env node

/**
 * Database Setup Script
 * Initializes the database schema for the AI Trading Dashboard
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗄️  Setting up database for AI Trading Dashboard...\n');

// Check environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!DATABASE_URL && (!SUPABASE_URL || !SUPABASE_KEY)) {
  console.log('⚠️  No database credentials found.');
  console.log('\n📝 To set up a database, you have two options:\n');
  
  console.log('Option 1: Use Supabase (Recommended for production)');
  console.log('1. Create a free account at https://supabase.com');
  console.log('2. Create a new project');
  console.log('3. Add these to your .env.local:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.log('   DATABASE_URL=your-database-url\n');
  
  console.log('Option 2: Use local PostgreSQL');
  console.log('1. Install PostgreSQL locally');
  console.log('2. Create a database: createdb tradingdb');
  console.log('3. Add to .env.local:');
  console.log('   DATABASE_URL=postgresql://user:pass@localhost:5432/tradingdb\n');
  
  console.log('💡 For now, the app will work with mock data!\n');
  process.exit(0);
}

// If we have credentials, show next steps
console.log('✅ Database credentials found!\n');

if (SUPABASE_URL && SUPABASE_KEY) {
  console.log('🚀 Using Supabase database');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Key: ${SUPABASE_KEY.substring(0, 10)}...`);
  console.log('\n📋 Next steps:');
  console.log('1. Run database migrations:');
  console.log('   cd python-ai-services');
  console.log('   python database/run_migration.py');
  console.log('\n2. The app will automatically use Supabase for:');
  console.log('   - Real-time data synchronization');
  console.log('   - File storage');
  console.log('   - Authentication (if enabled)');
} else if (DATABASE_URL) {
  console.log('🐘 Using PostgreSQL database');
  console.log(`   URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log('\n📋 Next steps:');
  console.log('1. Run database migrations:');
  console.log('   cd python-ai-services');
  console.log('   python database/run_migration.py');
}

console.log('\n✨ Database setup information complete!');
console.log('   The app is configured to work with or without a database.');
console.log('   Mock data will be used if database is unavailable.\n');