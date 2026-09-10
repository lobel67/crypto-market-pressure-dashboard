import logger from '../utils/logger';
import { PressureScore, MarketData, FuturesData, CryptoNews } from '../types/market';
import BinanceDataCollector from './collectors/binanceCollector';
import NewsCollector from './collectors/newsCollector';
import WhaleTracker from './collectors/whaleTracker';
import MarketDataService from './marketDataService';

class PressureScoreEngine {
  private binance = new BinanceDataCollector();
  private news = new NewsCollector();
  private whales = new WhaleTracker();
  private market = new MarketDataService();

  async calculatePressureScore(symbol: string): Promise<PressureScore | null> {
    try {
      const [marketData, futuresData, whaleActivity, btcDominance] = await Promise.all([
        this.binance.getMarketData(symbol),
        this.binance.getFuturesData(symbol),
        this.whales.analyzeWhaleActivity(symbol),
        this.market.getBTCDominance()
      ]);

      if (!marketData || !futuresData) {
        logger.warn(`Insufficient data for ${symbol}`);
        return null;
      }

      // Calculate individual component scores
      const priceVolumeScore = this.calculatePriceVolumeScore(marketData);
      const futuresScore = this.calculateFuturesScore(futuresData);
      const whaleActivityScore = this.calculateWhaleScore(whaleActivity);
      const sentimentScore = await this.calculateSentimentScore(symbol);
      const volatilityScore = await this.calculateVolatilityScore(symbol, marketData);

      // Weighted average of all components
      const score = (
        priceVolumeScore * 0.20 +
        futuresScore * 0.30 +
        whaleActivityScore * 0.20 +
        sentimentScore * 0.15 +
        volatilityScore * 0.15
      );

      // Generate signals based on score components
      const signals = this.generateSignals(
        symbol,
        {
          priceVolumeScore,
          futuresScore,
          whaleActivityScore,
          sentimentScore,
          volatilityScore
        },
        marketData,
        futuresData,
        whaleActivity
      );

      return {
        symbol,
        score: parseFloat(score.toFixed(2)),
        components: {
          priceVolumeScore: parseFloat(priceVolumeScore.toFixed(2)),
          futuresScore: parseFloat(futuresScore.toFixed(2)),
          whaleActivityScore: parseFloat(whaleActivityScore.toFixed(2)),
          sentimentScore: parseFloat(sentimentScore.toFixed(2)),
          volatilityScore: parseFloat(volatilityScore.toFixed(2))
        },
        signals,
        timestamp: new Date(),
        btcDominance: parseFloat(btcDominance.toFixed(2))
      };
    } catch (error) {
      logger.error(`Error calculating pressure score for ${symbol}:`, error);
      return null;
    }
  }

  private calculatePriceVolumeScore(data: MarketData): number {
    // Score based on price movement and volume
    const priceChange = data.priceChange24h; // Can be negative
    const volume = data.volume24h;

    // Normalize price change to 0-100 scale
    const priceScore = Math.min(100, Math.max(0, 50 + priceChange * 2));

    // Volume component (relative to average)
    const volumeScore = Math.min(100, (volume / 1000000000) * 10);

    return (priceScore * 0.6 + volumeScore * 0.4);
  }

  private calculateFuturesScore(data: FuturesData): number {
    let score = 50; // Neutral baseline

    // Funding rate impact (positive funding = bullish, negative = bearish)
    const fundingImpact = Math.min(50, Math.max(-50, data.fundingRate * 1000));
    score += fundingImpact * 0.3;

    // Long/short ratio impact
    const lsRatioScore = (data.longShortRatio - 0.5) * 200; // Convert to -100 to 100
    score += Math.min(50, Math.max(-50, lsRatioScore)) * 0.4;

    // Open interest spike
    if (data.openInterest > 1000000) {
      score += 20;
    }

    // Liquidation pressure
    const liquidationRatio = data.liquidations.shortCount / Math.max(1, data.liquidations.longCount);
    if (liquidationRatio > 1.5) {
      score += 15; // More shorts being liquidated = bullish
    } else if (liquidationRatio < 0.7) {
      score -= 15; // More longs being liquidated = bearish
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateWhaleScore(whaleActivity: any): number {
    let score = 50;

    const netVolume = whaleActivity.netVolume;
    const buyPressure = whaleActivity.buyPressure;

    // Net volume impact
    if (netVolume > 0) {
      score += Math.min(50, (buyPressure - 0.5) * 200);
    } else {
      score += Math.min(50, (buyPressure - 0.5) * 200);
    }

    // Transaction count impact
    const txCount = whaleActivity.totalTransactions;
    if (txCount > 50) {
      score += 20; // High activity
    } else if (txCount < 5) {
      score -= 10; // Low activity
    }

    return Math.min(100, Math.max(0, score));
  }

  private async calculateSentimentScore(symbol: string): Promise<number> {
    try {
      const news = await this.news.fetchCryptoNews();
      const relevantNews = news.filter(n => n.relevantCoins.includes(symbol)).slice(0, 20);

      if (relevantNews.length === 0) return 50; // Neutral

      const sentiments = {
        positive: 0,
        negative: 0,
        neutral: 0
      };

      relevantNews.forEach(article => {
        sentiments[article.sentiment]++;
      });

      const totalSentiments = relevantNews.length;
      const sentimentScore = (
        (sentiments.positive / totalSentiments) * 100 * 0.7 +
        (sentiments.neutral / totalSentiments) * 50 +
        (sentiments.negative / totalSentiments) * 0
      );

      return sentimentScore;
    } catch (error) {
      logger.warn(`Error calculating sentiment score for ${symbol}:`, error);
      return 50;
    }
  }

  private async calculateVolatilityScore(symbol: string, data: MarketData): Promise<number> {
    try {
      const volatility = await this.binance.getVolatility(symbol);

      // Normalize volatility to 0-100 scale
      // High volatility (>5%) = higher opportunity = higher score
      let score = Math.min(100, volatility * 20);

      // Combine with price change intensity
      score = score * 0.7 + Math.abs(data.priceChange24h) * 2;

      return Math.min(100, score);
    } catch (error) {
      logger.warn(`Error calculating volatility score for ${symbol}:`, error);
      return 50;
    }
  }

  private generateSignals(
    symbol: string,
    scores: any,
    marketData: MarketData,
    futuresData: FuturesData,
    whaleActivity: any
  ): string[] {
    const signals: string[] = [];

    // Strong pressure signals
    if (scores.futuresScore > 75 && scores.whaleActivityScore > 75) {
      signals.push('🚀 Strong bullish pressure from whales + positive funding');
    }
    if (scores.futuresScore < 25 && scores.whaleActivityScore < 25) {
      signals.push('🔴 Strong bearish pressure from whales + negative funding');
    }

    // Funding rate signals
    if (futuresData.fundingRate > 0.001) {
      signals.push('💰 Very high positive funding rate - longs paying shorts');
    }
    if (futuresData.fundingRate < -0.001) {
      signals.push('📉 Negative funding rate - shorts paying longs (bearish)');
    }

    // Long/short ratio signals
    if (futuresData.longShortRatio > 2.0) {
      signals.push('⚠️ Extremely long-biased positions - potential squeeze');
    }
    if (futuresData.longShortRatio < 0.5) {
      signals.push('⚠️ Extremely short-biased positions - potential rally');
    }

    // Liquidation signals
    const totalLiquidations = futuresData.liquidations.longCount + futuresData.liquidations.shortCount;
    if (totalLiquidations > 100) {
      signals.push('💥 High liquidation activity detected');
    }

    if (futuresData.liquidations.longCount > futuresData.liquidations.shortCount * 1.5) {
      signals.push('📊 More longs being liquidated - bearish indicator');
    }
    if (futuresData.liquidations.shortCount > futuresData.liquidations.longCount * 1.5) {
      signals.push('📊 More shorts being liquidated - bullish indicator');
    }

    // Whale activity signals
    if (whaleActivity.buyPressure > 0.65) {
      signals.push('🐋 Whale buying pressure detected');
    }
    if (whaleActivity.buyPressure < 0.35) {
      signals.push('🐋 Whale selling pressure detected');
    }

    // Volume spike signals
    if (marketData.volume24h > 1000000000) {
      signals.push('📈 Exceptional 24h volume spike');
    }

    // Price action signals
    if (marketData.priceChange24h > 10) {
      signals.push('🟢 Strong 24h price rally');
    } else if (marketData.priceChange24h < -10) {
      signals.push('🔴 Strong 24h price decline');
    }

    // Sentiment signals
    if (scores.sentimentScore > 75) {
      signals.push('📰 Very positive news sentiment');
    } else if (scores.sentimentScore < 25) {
      signals.push('📰 Very negative news sentiment');
    }

    return signals.length > 0 ? signals : ['⚪ Neutral market conditions'];
  }

  async getPressureScoresForMultipleCoins(symbols: string[]): Promise<PressureScore[]> {
    const scores = await Promise.all(
      symbols.map(symbol => this.calculatePressureScore(symbol))
    );

    return scores.filter((score): score is PressureScore => score !== null);
  }
}

export default PressureScoreEngine;
