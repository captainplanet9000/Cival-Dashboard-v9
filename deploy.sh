#!/bin/bash

# Cival Dashboard Production Deployment Script
# Complete deployment with leverage engine and profit securing integration

set -e  # Exit on any error

echo "🚀 Starting Cival Dashboard Production Deployment..."
echo "📅 $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Environment Validation
echo "🔍 Step 1: Environment Validation"
echo "=================================="

# Check for required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Required environment variable $var is not set"
        exit 1
    else
        log_info "✅ $var is configured"
    fi
done

# Step 2: Database Migration
echo ""
echo "🗄️ Step 2: Database Migration"
echo "=============================="

if [ "${AUTO_RUN_LEVERAGE_MIGRATION:-false}" = "true" ]; then
    log_info "Running leverage and profit securing database migration..."
    
    # Check if Python environment is available
    if command -v python3 &> /dev/null; then
        cd database
        python3 run_leverage_migration.py
        if [ $? -eq 0 ]; then
            log_info "✅ Database migration completed successfully"
        else
            log_error "❌ Database migration failed"
            exit 1
        fi
        cd ..
    else
        log_warning "Python3 not available, skipping automatic migration"
        log_info "Please run database migration manually:"
        log_info "  cd database && python3 run_leverage_migration.py"
    fi
else
    log_info "Automatic database migration disabled (AUTO_RUN_LEVERAGE_MIGRATION=false)"
    log_info "To run migration manually:"
    log_info "  cd database && python3 run_leverage_migration.py"
fi

# Step 3: Dependency Installation
echo ""
echo "📦 Step 3: Dependency Installation"
echo "=================================="

log_info "Installing Node.js dependencies..."
npm ci --production
if [ $? -eq 0 ]; then
    log_info "✅ Dependencies installed successfully"
else
    log_error "❌ Failed to install dependencies"
    exit 1
fi

# Step 4: Build Application
echo ""
echo "🔨 Step 4: Build Application"
echo "============================"

log_info "Building Next.js application..."
npm run build
if [ $? -eq 0 ]; then
    log_info "✅ Application built successfully"
else
    log_error "❌ Build failed"
    exit 1
fi

# Step 5: Health Checks
echo ""
echo "🩺 Step 5: Health Checks"
echo "========================"

# Check if database is accessible
if [ "${ENABLE_DATABASE_HEALTH_CHECKS:-true}" = "true" ]; then
    log_info "Checking database connectivity..."
    
    # Simple database connectivity check
    if command -v psql &> /dev/null; then
        psql "${DATABASE_URL}" -c "SELECT 1;" &> /dev/null
        if [ $? -eq 0 ]; then
            log_info "✅ Database connectivity confirmed"
        else
            log_warning "⚠️ Database connectivity check failed (may be expected if using Supabase)"
        fi
    else
        log_info "psql not available, skipping database connectivity check"
    fi
fi

# Check Redis connectivity if configured
if [ -n "${REDIS_URL}" ]; then
    log_info "Checking Redis connectivity..."
    if command -v redis-cli &> /dev/null; then
        redis-cli -u "${REDIS_URL}" ping &> /dev/null
        if [ $? -eq 0 ]; then
            log_info "✅ Redis connectivity confirmed"
        else
            log_warning "⚠️ Redis connectivity check failed"
        fi
    else
        log_info "redis-cli not available, skipping Redis connectivity check"
    fi
fi

# Step 6: Configuration Summary
echo ""
echo "⚙️ Step 6: Configuration Summary"
echo "================================"

log_info "Deployment Configuration:"
echo "  • Node Environment: ${NODE_ENV:-development}"
echo "  • Leverage Engine: ${ENABLE_LEVERAGE_ENGINE:-false}"
echo "  • Profit Securing: ${ENABLE_PROFIT_SECURING:-false}"
echo "  • DeFi Protocols: ${ENABLE_DEFI_PROTOCOLS:-false}"
echo "  • Autonomous Coordination: ${ENABLE_AUTONOMOUS_COORDINATION:-false}"
echo "  • Enhanced Agent Creation: ${ENABLE_ENHANCED_AGENT_CREATION:-false}"
echo "  • Max Leverage Ratio: ${MAX_LEVERAGE_RATIO:-10}x"
echo "  • Profit Securing %: ${PROFIT_SECURING_DEFAULT_PERCENTAGE:-0.70}"
echo "  • DeFi Borrow %: ${DEFI_BORROW_PERCENTAGE:-0.20}"

# Step 7: Service Startup Instructions
echo ""
echo "🚀 Step 7: Service Startup"
echo "=========================="

log_info "Deployment completed successfully!"
echo ""
echo "To start the application:"
echo ""
echo "  Development mode:"
echo "    npm run dev"
echo ""
echo "  Production mode:"
echo "    npm start"
echo ""
echo "  Docker Compose:"
echo "    docker-compose up -d"
echo ""
echo "  Railway deployment:"
echo "    railway up"
echo ""

# Step 8: Post-Deployment Verification
echo "🔍 Step 8: Post-Deployment Verification"
echo "======================================="

echo "After starting the application, verify the following:"
echo ""
echo "1. Dashboard loads successfully at your configured URL"
echo "2. All tabs are accessible (Overview, Agents, Trading, etc.)"
echo "3. Enhanced Agent Creation Wizard works properly"
echo "4. Leverage and Profit Securing panels display correctly"
echo "5. Database connections are established"
echo "6. Redis caching is operational (if configured)"
echo ""

if [ "${ENABLE_LEVERAGE_ENGINE:-false}" = "true" ]; then
    echo "📊 Leverage Engine Features:"
    echo "  • Navigate to Leverage Monitoring Dashboard"
    echo "  • Verify agent leverage settings are loaded"
    echo "  • Check risk metrics display properly"
    echo "  • Test leverage position creation (in demo mode)"
    echo ""
fi

if [ "${ENABLE_PROFIT_SECURING:-false}" = "true" ]; then
    echo "💰 Profit Securing Features:"
    echo "  • Open Profit Securing Panel"
    echo "  • Verify milestone configuration loads"
    echo "  • Check DeFi protocol integration status"
    echo "  • Test profit milestone triggers (in demo mode)"
    echo ""
fi

echo "🎉 Deployment completed successfully!"
echo "📚 For troubleshooting, check the README.md and CLAUDE.md files"
echo ""