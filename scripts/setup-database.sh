#!/bin/bash

# Database Setup Script for Cival Dashboard
# This script sets up the database with missing tables and seed data

echo "🚀 Setting up Cival Dashboard Database..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found!"
    echo "Please copy .env.example to .env.local and fill in your Supabase credentials."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if required variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env.local"
    exit 1
fi

echo "📊 Running database migrations..."

# Run migrations
if [ -f supabase/migrations/20241219_missing_tables.sql ]; then
    echo "Creating missing tables..."
    psql "$DATABASE_URL" -f supabase/migrations/20241219_missing_tables.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Tables created successfully!"
    else
        echo "❌ Error creating tables"
        exit 1
    fi
else
    echo "⚠️  Migration file not found"
fi

echo "🌱 Seeding initial data..."

# Run seed data
if [ -f supabase/seed.sql ]; then
    echo "Inserting seed data..."
    psql "$DATABASE_URL" -f supabase/seed.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Seed data inserted successfully!"
    else
        echo "⚠️  Some seed data may have failed (could be duplicates)"
    fi
else
    echo "⚠️  Seed file not found"
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend API: cd python-ai-services && python main_consolidated.py"
echo "2. Start the frontend: npm run dev"
echo "3. Access the dashboard at http://localhost:3000/dashboard"
echo ""
echo "📝 Default credentials:"
echo "   Email: admin@cival.trading"
echo "   Mode: Solo operator (no login required)"
echo ""
echo "Happy trading! 🚀"