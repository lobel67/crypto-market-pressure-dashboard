import axios from 'axios';
import logger from '../utils/logger';
import { MarketData, FuturesData, LiquidationData } from '../types/market';

class BinanceDataCollector {
  private baseUrl = 'https://api.binance.com/api';
  private apiKey = process.env.BINANCE_API_KEY;
  private secretKey = process.env.BINANCE_SECRET_KEY;

  async getMarketData(symbol: string): Promise<MarketData | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/v3/ticker/24hr`, {
        params: { symbol: `${symbol}USDT` }
      });

      return {
        symbol,
        price: parseFloat(response.data.lastPrice),
        volume24h: parseFloat(response.data.quoteAssetVolume),
        priceChange24h: parseFloat(response.data.priceChangePercent),
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error fetching market data for ${symbol}:`, error);
      return null;
    }
  }

  async getFuturesData(symbol: string): Promise<FuturesData | null> {
    try {
      const [fundingResponse, openInterestResponse, liquidationResponse] = await Promise.all([
        axios.get(`https://fapi.binance.com/fapi/v1/fundingRate`, {
          params: { symbol: `${symbol}USDT`, limit: 1 }
        }),
        axios.get(`https://fapi.binance.com/fapi/v1/openInterest`, {
          params: { symbol: `${symbol}USDT` }
        }),
        axios.get(`https://fapi.binance.com/fapi/v1/allForceOrders`, {
          params: { symbol: `${symbol}USDT`, limit: 100 }
        })
      ]);

      const fundingRate = parseFloat(fundingResponse.data[0]?.fundingRate || '0');
      const openInterest = parseFloat(openInterestResponse.data?.openInterest || '0');
      
      const liquidations = liquidationResponse.data.reduce(
        (acc: any, item: any) => {
          if (item.side === 'SELL') acc.shortCount++;
          else acc.longCount++;
          acc.totalValue += parseFloat(item.executedQty) * parseFloat(item.price);
          return acc;
        },
        { longCount: 0, shortCount: 0, totalValue: 0 }
      );

      // Fetch long/short ratio from alternative source
      const longShortRatio = await this.getLongShortRatio(symbol);

      return {
        symbol,
        longShortRatio,
        fundingRate,
        openInterest,
        liquidations,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error fetching futures data for ${symbol}:`, error);
      return null;
    }
  }

  private async getLongShortRatio(symbol: string): Promise<number> {
    try {
      // Using Binance long/short ratio endpoint
      const response = await axios.get(
        `https://fapi.binance.com/fapi/v1/lvtKlines`,
        { params: { symbol: `${symbol}USDT`, interval: '5m', limit: 1 } }
      );
      
      if (response.data && response.data.length > 0) {
        const ratio = parseFloat(response.data[0][7]); // long/short ratio from response
        return ratio;
      }
      return 1.0;
    } catch (error) {
      logger.warn(`Could not fetch long/short ratio for ${symbol}`);
      return 1.0;
    }
  }

  async getLiquidations(symbol: string, hours: number = 24): Promise<LiquidationData[]> {
    try {
      const response = await axios.get(`https://fapi.binance.com/fapi/v1/allForceOrders`, {
        params: {
          symbol: `${symbol}USDT`,
          limit: 1000,
          startTime: Date.now() - hours * 60 * 60 * 1000
        }
      });

      return response.data.map((item: any) => ({
        symbol,
        side: item.side === 'SELL' ? 'short' : 'long',
        amount: parseFloat(item.executedQty),
        value: parseFloat(item.executedQty) * parseFloat(item.price),
        timestamp: new Date(item.time)
      }));
    } catch (error) {
      logger.error(`Error fetching liquidations for ${symbol}:`, error);
      return [];
    }
  }

  async getVolatility(symbol: string, period: number = 20): Promise<number> {
    try {
      const response = await axios.get(`https://fapi.binance.com/fapi/v1/klines`, {
        params: {
          symbol: `${symbol}USDT`,
          interval: '1h',
          limit: period
        }
      });

      const closes = response.data.map((candle: any[]) => parseFloat(candle[4]));
      const returns = closes.slice(1).map((close, i) => 
        Math.log(close / closes[i])
      );

      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * 100;

      return parseFloat(volatility.toFixed(2));
    } catch (error) {
      logger.error(`Error calculating volatility for ${symbol}:`, error);
      return 0;
    }
  }
}

export default BinanceDataCollector;
