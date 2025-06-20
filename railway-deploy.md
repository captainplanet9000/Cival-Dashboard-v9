# Railway Deployment Guide for Cival Dashboard

## Overview
This guide walks you through deploying the Cival Dashboard to Railway, including both the Next.js frontend and Python AI services backend.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code must be in a GitHub repository
3. **Environment Variables**: Collect all required API keys and database URLs

## Step 1: Database Setup

### Option A: Railway PostgreSQL (Recommended)
1. Create a new Railway project
2. Add PostgreSQL service: `+ New` → `Database` → `PostgreSQL`
3. Note the connection details from the PostgreSQL service

### Option B: Supabase (Alternative)
1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys
3. Run the schema migrations in the Supabase SQL editor

## Step 2: Redis Setup

### Railway Redis
1. In your Railway project: `+ New` → `Database` → `Redis`
2. Note the Redis URL from the service details

### Alternative: Upstash Redis
1. Create a Redis database at [upstash.com](https://upstash.com)
2. Get the Redis URL

## Step 3: Deploy to Railway

### Method 1: GitHub Integration (Recommended)
1. Connect your GitHub repository to Railway
2. Select your repository and branch
3. Railway will auto-detect the monorepo structure

### Method 2: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Step 4: Environment Variables

Copy the variables from `.env.railway` and set them in your Railway project:

### Required Environment Variables
```bash
# Core Settings
NODE_ENV=production
DATABASE_URL=${{DATABASE_URL}}  # From Railway PostgreSQL
REDIS_URL=${{REDIS_URL}}        # From Railway Redis

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Trading APIs (Optional for demo)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
POLYGON_API_KEY=your_polygon_key
```

### Setting Environment Variables in Railway
1. Go to your Railway project dashboard
2. Select your service
3. Go to "Variables" tab
4. Add each environment variable

## Step 5: Verify Deployment

### Check Services
1. **Frontend**: Should be available at your Railway domain
2. **Backend API**: Should respond at `your-domain.railway.app/health`
3. **WebSocket**: Real-time features should work

### Health Checks
- Frontend: `GET /api/health`
- Backend: `GET /health`
- Database: Connection should be established automatically
- Redis: Cache should be operational

## Step 6: Post-Deployment Configuration

### Database Migrations
If using PostgreSQL, run migrations:
```bash
railway connect postgresql
# Then run your SQL migrations
```

### Initialize Memory System
The Letta memory system will initialize automatically on first startup.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in requirements.txt
   - Verify Python version compatibility (3.11+)
   - Ensure Next.js build completes successfully

2. **Database Connection Issues**
   - Verify DATABASE_URL is set correctly
   - Check PostgreSQL service is running
   - Ensure database schema is migrated

3. **Memory/Resource Issues**
   - Railway provides 512MB RAM by default
   - Upgrade plan if needed for production workloads
   - Monitor resource usage in Railway dashboard

4. **API Connection Issues**
   - Verify NEXT_PUBLIC_API_URL points to backend
   - Check CORS settings
   - Ensure both services are running

### Logs and Debugging
```bash
# View logs
railway logs

# Connect to service
railway shell

# View environment variables
railway variables
```

## Production Optimization

### Performance
- Enable Redis caching
- Configure CDN for static assets
- Set up monitoring and alerts

### Security
- Use Railway's built-in SSL/TLS
- Configure proper CORS origins
- Store sensitive data in environment variables

### Scaling
- Monitor resource usage
- Configure auto-scaling if needed
- Consider separating frontend/backend into different services

## Cost Optimization

### Railway Pricing Tiers
- **Hobby**: $5/month per service (suitable for development)
- **Pro**: $20/month per service (recommended for production)

### Resource Management
- Monitor memory and CPU usage
- Optimize Python service startup time
- Use efficient database queries

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: Community support
- GitHub Issues: For application-specific problems

## Additional Resources

- [Railway Templates](https://railway.app/templates)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [FastAPI Production Guide](https://fastapi.tiangolo.com/deployment/)