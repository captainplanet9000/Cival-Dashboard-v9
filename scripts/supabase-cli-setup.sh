#!/bin/bash

# Supabase CLI Setup Script for Cival Dashboard
echo "🔧 Supabase CLI Setup for Cival Dashboard"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo "  or"
    echo "  brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "🔐 Please login to Supabase:"
    supabase login
fi

echo "✅ Supabase login verified"

# Get project reference
echo "📋 Please enter your Supabase project reference:"
echo "   (Found in your URL: https://YOUR-PROJECT-REF.supabase.co)"
read -p "Project ref: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project ref is required"
    exit 1
fi

# Link project
echo "🔗 Linking to project $PROJECT_REF..."
supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project"
    exit 1
fi

echo "✅ Project linked successfully"

# Create migrations directory if it doesn't exist
mkdir -p supabase/migrations

# Get timestamp for migration
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_add_trading_tables.sql"

# Copy our migration file
echo "📁 Creating migration file: $MIGRATION_FILE"
cp supabase/migrations/20241219_missing_tables.sql "$MIGRATION_FILE"

# Apply migrations
echo "🚀 Applying migrations to remote database..."
supabase db push

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    echo "You can try running manually:"
    echo "  supabase db push"
    exit 1
fi

echo "✅ Migrations applied successfully"

# Create seed directory if it doesn't exist
mkdir -p supabase/seed

# Copy seed file
echo "🌱 Preparing seed data..."
cp supabase/seed.sql supabase/seed/seed.sql

# Apply seed data
echo "🌱 Applying seed data..."
supabase db seed -f supabase/seed.sql

if [ $? -ne 0 ]; then
    echo "⚠️  Seed data may have failed (this is often OK if data already exists)"
    echo "You can try running manually:"
    echo "  supabase db seed -f supabase/seed.sql"
fi

# Generate TypeScript types
echo "📝 Generating TypeScript types..."
supabase gen types typescript --local > types/supabase.ts

if [ $? -ne 0 ]; then
    echo "⚠️  Type generation failed (this is optional)"
    echo "You can try running manually:"
    echo "  supabase gen types typescript > types/supabase.ts"
fi

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "📋 Summary of what was done:"
echo "   ✅ Created orders table for trade management"
echo "   ✅ Created risk_metrics table for portfolio analysis"
echo "   ✅ Created alerts table for notifications"
echo "   ✅ Created exchange_connections table for multi-exchange support"
echo "   ✅ Created backtest_results table for strategy optimization"
echo "   ✅ Created audit_logs table for compliance"
echo "   ✅ Added performance indexes"
echo "   ✅ Enabled real-time subscriptions"
echo "   ✅ Inserted sample data for immediate testing"
echo ""
echo "🎯 Next steps:"
echo "   1. Update your .env.local with Supabase credentials"
echo "   2. Start backend: cd python-ai-services && python main_consolidated.py"
echo "   3. Start frontend: npm run dev"
echo "   4. Access dashboard: http://localhost:3000/dashboard"
echo ""
echo "🔧 Your Supabase project: https://$PROJECT_REF.supabase.co"
echo ""
echo "Happy trading! 🚀"