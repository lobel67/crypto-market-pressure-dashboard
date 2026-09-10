import cron from 'node-cron';
import logger from '../utils/logger';
import PressureScoreEngine from './pressureScoreEngine';
import { Server as SocketIOServer } from 'socket.io';
import MarketDataService from './marketDataService';
import BinanceDataCollector from './collectors/binanceCollector';

class DataCollectorManager {
  private pressureEngine = new PressureScoreEngine();
  private marketDataService = new MarketDataService();
  private binanceCollector = new BinanceDataCollector();
  private coins: string[] = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'LINK', 'BNB', 'AVAX'];
  private io: SocketIOServer | null = null;

  async initialize(io: SocketIOServer) {
    this.io = io;
    this.startDataCollectionSchedules();
    logger.info('🚀 Data Collector Manager initialized');
  }

  private startDataCollectionSchedules() {
    // Market data collection every 1 minute
    cron.schedule('*/1 * * * *', async () => {
      logger.debug('📊 Collecting market data...');
      await this.collectMarketData();
    });

    // Pressure score calculation every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
      logger.debug('⚙️ Calculating pressure scores...');
      await this.calculatePressureScores();
    });

    // Liquidation data every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      logger.debug('💥 Collecting liquidation data...');
      await this.collectLiquidationData();
    });

    // News sentiment analysis every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      logger.debug('📰 Fetching news and sentiment...');
      await this.fetchNewsAndSentiment();
    });

    // BTC dominance update every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      logger.debug('📊 Updating BTC dominance...');
      await this.updateBTCDominance();
    });
  }

  private async collectMarketData() {
    try {
      for (const coin of this.coins) {
        const data = await this.binanceCollector.getMarketData(coin);
        if (data && this.io) {
          this.io.to(`coin:${coin}`).emit('market-data-update', {
            symbol: coin,
            price: data.price,
            volume24h: data.volume24h,
            priceChange24h: data.priceChange24h,
            timestamp: data.timestamp
          });
        }
      }
    } catch (error) {
      logger.error('Error collecting market data:', error);
    }
  }

  private async calculatePressureScores() {
    try {
      const scores = await this.pressureEngine.getPressureScoresForMultipleCoins(this.coins);
      
      scores.forEach(score => {
        if (this.io) {
          this.io.to(`coin:${score.symbol}`).emit('pressure-score-update', score);
          
          // Emit alert if score exceeds threshold
          const threshold = parseInt(process.env.PRESSURE_SCORE_THRESHOLD || '70');
          if (score.score >= threshold) {
            this.io.emit('pressure-alert', {
              symbol: score.symbol,
              score: score.score,
              signals: score.signals,
              severity: score.score >= 85 ? 'critical' : 'high',
              timestamp: new Date()
            });
          }
        }
      });
    } catch (error) {
      logger.error('Error calculating pressure scores:', error);
    }
  }

  private async collectLiquidationData() {
    try {
      for (const coin of this.coins) {
        const liquidations = await this.binanceCollector.getLiquidations(coin);
        if (liquidations.length > 0 && this.io) {
          this.io.to(`coin:${coin}`).emit('liquidation-update', {
            symbol: coin,
            count: liquidations.length,
            data: liquidations,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      logger.error('Error collecting liquidation data:', error);
    }
  }

  private async fetchNewsAndSentiment() {
    try {
      // News collection happens within pressure score calculation
      // This is a placeholder for additional sentiment analysis if needed
      logger.info('📰 News and sentiment check completed');
    } catch (error) {
      logger.error('Error fetching news and sentiment:', error);
    }
  }

  private async updateBTCDominance() {
    try {
      const dominance = await this.marketDataService.getBTCDominance();
      if (this.io) {
        this.io.emit('btc-dominance-update', {
          dominance,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('Error updating BTC dominance:', error);
    }
  }
}

const manager = new DataCollectorManager();

export const initializeDataCollectors = async (io: SocketIOServer) => {
  await manager.initialize(io);
};

export default manager;
