import axios from 'axios';
import logger from '../utils/logger';
import { CryptoNews } from '../types/market';

class NewsCollector {
  private newsApiKey = process.env.NEWS_API_KEY;
  private cryptoCompareKey = process.env.CRYPTO_COMPARE_KEY;

  async fetchCryptoNews(): Promise<CryptoNews[]> {
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'cryptocurrency OR bitcoin OR ethereum',
          sortBy: 'publishedAt',
          language: 'en',
          apiKey: this.newsApiKey,
          pageSize: 50
        }
      });

      return response.data.articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
        relevantCoins: this.extractCoinReferences(article.title + ' ' + (article.description || '')),
        timestamp: new Date(article.publishedAt),
        imageUrl: article.urlToImage
      }));
    } catch (error) {
      logger.error('Error fetching crypto news:', error);
      return [];
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveKeywords = ['surge', 'rally', 'pump', 'bullish', 'moon', 'gains', 'bull', 'rise', 'up', 'profit', 'recovery'];
    const negativeKeywords = ['crash', 'dump', 'bearish', 'drop', 'loss', 'bear', 'down', 'liquidation', 'collapse', 'fall'];

    const lowerText = text.toLowerCase();
    const positiveScore = positiveKeywords.filter(kw => lowerText.includes(kw)).length;
    const negativeScore = negativeKeywords.filter(kw => lowerText.includes(kw)).length;

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private extractCoinReferences(text: string): string[] {
    const coinPatterns: { [key: string]: string[] } = {
      'BTC': ['bitcoin', 'btc'],
      'ETH': ['ethereum', 'eth'],
      'SOL': ['solana', 'sol'],
      'XRP': ['ripple', 'xrp'],
      'ADA': ['cardano', 'ada'],
      'DOGE': ['dogecoin', 'doge'],
      'MATIC': ['polygon', 'matic'],
      'LINK': ['chainlink', 'link'],
      'BNB': ['binance', 'bnb'],
      'AVAX': ['avalanche', 'avax']
    };

    const lowerText = text.toLowerCase();
    const coins: Set<string> = new Set();

    Object.entries(coinPatterns).forEach(([symbol, patterns]) => {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        coins.add(symbol);
      }
    });

    return Array.from(coins);
  }
}

export default NewsCollector;
