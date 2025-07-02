# Railway Deployment Guide

## 🚀 Quick Deploy

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected
- Environment variables ready

### One-Click Deploy

1. **Connect GitHub Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app/new
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Next.js app

3. **Configure Environment Variables**
   
   Add these in Railway dashboard:
   ```env
   # Required
   NODE_ENV=production
   
   # Optional - Add if you have them
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   
   # API Keys (if using)
   OPENAI_API_KEY=your-key
   NEXT_PUBLIC_GEMINI_API_KEY=your-key
   ```

## 📋 Deployment Checklist

### Before Deploying
- [x] Build passes locally: `npm run build`
- [x] TypeScript errors resolved (or ignored)
- [x] Environment variables documented
- [x] Health check endpoint working (/api/health)
- [x] No authentication required (solo operator)
- [x] Mock data fallbacks implemented

### Railway Configuration Files
- [x] `railway.toml` - Main configuration
- [x] `nixpacks.toml` - Build configuration  
- [x] `server.js` - Production server
- [x] `package.json` - Scripts configured

### Services on Railway (Optional)
```bash
# Add PostgreSQL
railway add postgresql

# Add Redis  
railway add redis

# These will automatically set:
# - DATABASE_URL
# - REDIS_URL
```

## 🔧 Configuration Details

### railway.toml
```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start:production"
healthcheckPath = "/api/health"
restartPolicyType = "always"
```

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ['nodejs-18_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm start'
```

## 🏗️ What Gets Deployed

### Frontend (Next.js)
- Main dashboard application
- All React components
- API routes
- Static assets
- Real-time WebSocket support

### Not Included (Deploy Separately)
- Python backend (optional)
- Database (use Railway add-ons)
- Redis (use Railway add-ons)

## 🚨 Troubleshooting

### Build Fails
```bash
# Check logs in Railway dashboard
# Common fixes:

# 1. Clear cache
railway up --no-cache

# 2. Check Node version
# Ensure nixpacks.toml specifies Node 18

# 3. Environment variables
# Add any missing vars in Railway dashboard
```

### App Crashes After Deploy
```bash
# Check production logs
railway logs

# Common issues:
# - Missing environment variables
# - Port binding (use process.env.PORT)
# - Memory limits (optimize build)
```

### Health Check Fails
```bash
# Verify endpoint works locally
curl http://localhost:3000/api/health

# Check server.js handles /api/health
# Increase healthcheckTimeout in railway.toml
```

## 🎯 Post-Deployment

### 1. Verify Deployment
- Visit your-app.railway.app
- Check /api/health endpoint
- Test main dashboard features
- Monitor logs for errors

### 2. Custom Domain (Optional)
- Add custom domain in Railway settings
- Update DNS records
- Enable HTTPS (automatic)

### 3. Monitoring
- Set up alerts in Railway
- Monitor performance metrics
- Check error logs regularly

### 4. Scaling (If Needed)
- Increase memory/CPU in Railway
- Enable horizontal scaling
- Add caching layers

## 💡 Tips for Solo Operators

1. **Start Simple**
   - Deploy frontend first
   - Add services as needed
   - Use mock data initially

2. **Cost Optimization**
   - Use Railway's free tier
   - Enable sleep mode for dev
   - Monitor usage metrics

3. **Security**
   - Keep API keys in env vars
   - Use Railway's private networking
   - Regular dependency updates

## 📊 Expected Resources

- **Memory**: 512MB - 1GB
- **CPU**: 0.5 - 1 vCPU  
- **Build Time**: 2-5 minutes
- **Cold Start**: 10-30 seconds

## 🔄 Updating Deployment

```bash
# Push changes to GitHub
git add .
git commit -m "Update dashboard"
git push

# Railway auto-deploys from main branch
# Or manually trigger:
railway up
```

## ✅ Success Indicators

- Health check returns 200
- Dashboard loads without errors
- WebSocket connects properly
- No memory/CPU warnings
- Logs show normal operation

## 🆘 Support

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- GitHub Issues: Report bugs
- Logs: `railway logs --tail`

---

**Ready to Deploy!** 🚀

Your AI Trading Dashboard is configured for Railway deployment. The app will work with or without external services, using mock data when databases are unavailable.