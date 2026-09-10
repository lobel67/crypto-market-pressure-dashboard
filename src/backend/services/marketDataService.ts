import axios from 'axios';
import logger from '../utils/logger';

class MarketDataService {
  private cryptoCompareKey = process.env.CRYPTO_COMPARE_KEY;

  async getBTCDominance(): Promise<number> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/global', {
        params: { vs_currency: 'usd' }
      });
      return response.data.data.btc_market_cap_percentage.btc || 0;
    } catch (error) {
      logger.error('Error fetching BTC dominance:', error);
      return 0;
    }
  }

  async getTopCoins(limit: number = 20): Promise<any[]> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          sparkline: false
        }
      });

      return response.data.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        priceChange24h: coin.price_change_percentage_24h
      }));
    } catch (error) {
      logger.error('Error fetching top coins:', error);
      return [];
    }
  }
}

export default MarketDataService;
