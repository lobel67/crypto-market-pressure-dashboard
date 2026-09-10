import express, { Express } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { initializeDataCollectors } from './services/dataCollectorManager';

// Routes
import tradeAnalyticsRoutes from './routes/tradeAnalytics';
import marketDataRoutes from './routes/marketData';
import alertsRoutes from './routes/alerts';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-dashboard';
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/trade-analytics', tradeAnalyticsRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// WebSocket Events
io.on('connection', (socket) => {
  logger.info(`📱 Client connected: ${socket.id}`);

  socket.on('subscribe-coin', (symbol: string) => {
    socket.join(`coin:${symbol}`);
    logger.info(`✅ Client subscribed to ${symbol}`);
  });

  socket.on('unsubscribe-coin', (symbol: string) => {
    socket.leave(`coin:${symbol}`);
    logger.info(`❌ Client unsubscribed from ${symbol}`);
  });

  socket.on('disconnect', () => {
    logger.info(`📴 Client disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await initializeDataCollectors(io);

  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📊 Dashboard: http://localhost:3000`);
    logger.info(`🔗 API: http://localhost:${PORT}/api`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export { app, io };
