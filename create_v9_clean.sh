#!/bin/bash

# Create a clean v9 directory with only essential files
V9_DIR="../cival-dashboard-v9-clean"
echo "Creating clean v9 repository at $V9_DIR..."

# Create new directory
rm -rf "$V9_DIR"
mkdir -p "$V9_DIR"
cd "$V9_DIR"

# Initialize new git repository
git init
git config user.name "captainplanet9000"
git config user.email "captain@planet.com"

# Copy essential files from current directory
echo "Copying essential files..."

# Copy main application files
cp -r "/home/anthony/cival-dashboard/src" .
cp -r "/home/anthony/cival-dashboard/public" .
cp -r "/home/anthony/cival-dashboard/python-ai-services" .

# Copy configuration files
cp "/home/anthony/cival-dashboard/package.json" .
cp "/home/anthony/cival-dashboard/package-lock.json" .
cp "/home/anthony/cival-dashboard/next.config.js" .
cp "/home/anthony/cival-dashboard/tailwind.config.ts" .
cp "/home/anthony/cival-dashboard/tsconfig.json" .
cp "/home/anthony/cival-dashboard/postcss.config.js" .
cp "/home/anthony/cival-dashboard/components.json" .

# Copy documentation
cp "/home/anthony/cival-dashboard/README.md" .
cp "/home/anthony/cival-dashboard/IMPLEMENTATION_PLAN.md" .
cp "/home/anthony/cival-dashboard/V9_RELEASE_NOTES.md" .
cp "/home/anthony/cival-dashboard/DEPLOY_TO_V9.md" .

# Copy deployment files
cp "/home/anthony/cival-dashboard/Dockerfile" . 2>/dev/null || echo "Dockerfile not found"
cp "/home/anthony/cival-dashboard/docker-compose.yml" . 2>/dev/null || echo "docker-compose.yml not found"
cp "/home/anthony/cival-dashboard/.env.example" . 2>/dev/null || echo ".env.example not found"
cp "/home/anthony/cival-dashboard/.gitignore" .

# Create Railway deployment config
cat > railway.toml << 'EOF'
[build]
command = "npm install && npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
EOF

# Create optimized .gitignore
cat > .gitignore << 'EOF'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Production builds
/.next/
/out/
/dist/
/build/

# Runtime data
*.pid
*.seed
*.pid.lock

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
env/
ENV/

# Testing
.coverage
.pytest_cache/
.jest/

# Temporary files
*.tmp
*.temp
.cache/
EOF

# Add all files to git
git add .

# Create initial commit
git commit -m "🎉 Cival Dashboard v9 - Clean Release

Complete trading dashboard with:
✅ Advanced farm management system
✅ Real-time agent coordination  
✅ Enhanced AI assistant
✅ Comprehensive wallet integration
✅ Mobile-responsive design
✅ Production-ready architecture

Ready for Railway deployment!

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Add remote and push
git remote add origin https://github.com/captainplanet9000/Cival-Dashboard-v9.git
git branch -M main

echo "Clean v9 repository created at $V9_DIR"
echo "To push to GitHub, run:"
echo "cd $V9_DIR && git push -u origin main"

# Show size comparison
echo ""
echo "Size comparison:"
echo "Original: $(du -sh /home/anthony/cival-dashboard | cut -f1)"
echo "Clean v9: $(du -sh . | cut -f1)"
EOF