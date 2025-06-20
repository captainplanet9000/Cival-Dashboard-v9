# Multi-stage Dockerfile for Cival Dashboard
# Supports both Next.js frontend and Python AI services

# Stage 1: Python base with system dependencies
FROM python:3.11-slim AS python-base

# Install system dependencies for Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libpq-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Node.js base  
FROM node:18-alpine AS node-base
RUN apk add --no-cache libc6-compat python3 py3-pip build-base

# Stage 3: Dependencies installation
FROM node-base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm ci --only=production

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Stage 4: Build Next.js application
FROM node-base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy source code
COPY . .

# Set build environment
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build Next.js application
RUN npm run build

# Stage 5: Production runtime
FROM python:3.11-slim AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libpq-dev \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PYTHONPATH /app/python-ai-services

# Create application user
RUN addgroup --system --gid 1001 appgroup
RUN adduser --system --uid 1001 appuser

# Copy Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy built Next.js application
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public

# Copy Python AI services
COPY --from=builder --chown=appuser:appgroup /app/python-ai-services ./python-ai-services

# Copy package.json for npm scripts
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

# Install concurrently for running multiple processes
RUN npm install -g concurrently

# Set permissions
RUN chown -R appuser:appgroup /app

USER appuser

# Expose ports
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start both services
CMD ["npx", "concurrently", "\"node server.js\"", "\"cd python-ai-services && python main_consolidated.py\""] 