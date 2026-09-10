import axios from 'axios';
import logger from '../utils/logger';
import { WhaleTransaction } from '../types/market';

class WhaleTracker {
  private minTransactionValue = parseInt(process.env.LARGE_TRANSACTION_THRESHOLD || '500000');

  async getWhaleTransactions(symbol: string): Promise<WhaleTransaction[]> {
    try {
      // Using Whale Alert API
      const response = await axios.get('https://api.whale-alert.io/v1/transactions', {
        params: {
          currency: symbol,
          min_value: this.minTransactionValue,
          limit: 100
        }
      });

      if (!response.data.result) return [];

      return response.data.result.transactions.map((tx: any) => ({
        symbol,
        amount: parseFloat(tx.amount),
        value: parseFloat(tx.amount_usd),
        type: tx.from?.owner_type === 'exchange' ? 'sell' : 'buy',
        exchange: tx.from?.owner || tx.to?.owner || 'unknown',
        timestamp: new Date(tx.timestamp * 1000),
        transactionHash: tx.hash
      }));
    } catch (error) {
      logger.error(`Error fetching whale transactions for ${symbol}:`, error);
      return [];
    }
  }

  async analyzeWhaleActivity(symbol: string, hours: number = 24): Promise<any> {
    const transactions = await this.getWhaleTransactions(symbol);
    
    const recentTxs = transactions.filter(tx => {
      const txHours = (Date.now() - tx.timestamp.getTime()) / (1000 * 60 * 60);
      return txHours <= hours;
    });

    const buyVolume = recentTxs
      .filter(tx => tx.type === 'buy')
      .reduce((sum, tx) => sum + tx.value, 0);

    const sellVolume = recentTxs
      .filter(tx => tx.type === 'sell')
      .reduce((sum, tx) => sum + tx.value, 0);

    return {
      symbol,
      totalTransactions: recentTxs.length,
      buyVolume,
      sellVolume,
      netVolume: buyVolume - sellVolume,
      buyPressure: buyVolume / (buyVolume + sellVolume) || 0.5,
      timestamp: new Date()
    };
  }
}

export default WhaleTracker;
