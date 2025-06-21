const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Import autonomous agent scheduler
const startAutonomousServices = async () => {
  try {
    console.log('🚀 Starting Autonomous Trading Services...');
    
    // Skip autonomous services in production for now to fix deployment
    console.log('⚠️ Autonomous services disabled in production for stability');
    
    console.log('✅ Autonomous services skipped successfully');
  } catch (error) {
    console.error('❌ Failed to start autonomous services:', error);
  }
};

// Initialize persistence layer
const initializePersistence = async () => {
  try {
    console.log('🔄 Initializing persistence layer...');
    
    // Check Supabase connection
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('✅ Supabase configured');
    } else {
      console.warn('⚠️ Supabase credentials not found in environment');
    }
    
    // Check Redis connection
    if (process.env.REDIS_URL) {
      console.log('✅ Redis configured');
    } else {
      console.warn('⚠️ Redis URL not found in environment');
    }
    
  } catch (error) {
    console.error('❌ Persistence initialization error:', error);
  }
};

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO for real-time updates
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST']
    }
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Handle autonomous agent status updates
    socket.on('agent:status', (data) => {
      io.emit('agent:status:update', data);
    });

    // Handle trading signals
    socket.on('trading:signal', (data) => {
      io.emit('trading:signal:broadcast', data);
    });

    // Handle portfolio updates
    socket.on('portfolio:update', (data) => {
      io.emit('portfolio:update:broadcast', data);
    });

    // Handle risk alerts
    socket.on('risk:alert', (data) => {
      io.emit('risk:alert:broadcast', data);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  // Start the server
  server.listen(port, async (err) => {
    if (err) throw err;
    
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`> Railway Deployment: ${new Date().toISOString()}`);
    
    // Initialize persistence layer
    await initializePersistence();
    
    // Start autonomous services in production
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AUTONOMOUS_TRADING === 'true') {
      await startAutonomousServices();
    }
    
    // Set up periodic health checks
    setInterval(() => {
      const memUsage = process.memoryUsage();
      console.log('💓 Health Check:', {
        uptime: Math.floor(process.uptime() / 60) + ' minutes',
        memory: Math.floor(memUsage.heapUsed / 1024 / 1024) + ' MB',
        connections: io.engine.clientsCount
      });
    }, 300000); // Every 5 minutes
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    
    // Stop autonomous services
    try {
      console.log('Gracefully shutting down services...');
    } catch (error) {
      console.error('Error stopping autonomous services:', error);
    }
    
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});