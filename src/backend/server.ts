import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/database';
import logger from './utils/logger';
import { initializeDataCollectors } from './services/dataCollectorManager';
import marketDataRoutes from './routes/marketData';
import tradeAnalyticsRoutes from './routes/tradeAnalytics';
import alertRoutes from './routes/alerts';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/trade-analytics', tradeAnalyticsRoutes);
app.use('/api/alerts', alertRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
  
  socket.on('subscribe_coin', (coin: string) => {
    socket.join(`coin:${coin}`);
    logger.info(`Client ${socket.id} subscribed to ${coin}`);
  });
  
  socket.on('unsubscribe_coin', (coin: string) => {
    socket.leave(`coin:${coin}`);
  });
});

// Export io for use in other modules
export { io };

// Initialize database and start server
const startServer = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');
    
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
    
    // Initialize data collectors
    await initializeDataCollectors(io);
    logger.info('✅ Data collectors initialized');
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
