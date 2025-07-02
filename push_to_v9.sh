#!/bin/bash

# Configure git
git config user.name "captainplanet9000"
git config user.email "captain@planet.com"

# First push current changes to v8
echo "Pushing latest changes to v8..."
git push origin main

# Add the new v9 remote
echo "Adding v9 remote..."
git remote add v9 https://github.com/captainplanet9000/Cival-Dashboard-v9.git 2>/dev/null || git remote set-url v9 https://github.com/captainplanet9000/Cival-Dashboard-v9.git

# Push to the new v9 repository
echo "Pushing to Cival-Dashboard-v9..."
git push v9 main --force

echo "✅ Successfully pushed to https://github.com/captainplanet9000/Cival-Dashboard-v9"
echo "All v8 upgrades including:"
echo "- Complete farms system integration"
echo "- AI Assistant improvements"
echo "- Navigation reordering"
echo "- Comprehensive implementation plan"
echo "- Full system documentation"