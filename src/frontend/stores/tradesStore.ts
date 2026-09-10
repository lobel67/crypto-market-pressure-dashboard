import create from 'zustand';
import axios from 'axios';

interface UserTrade {
  _id: string;
  userId: string;
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  side: 'long' | 'short';
  leverage?: number;
  entryTime: Date;
  exitTime?: Date;
  profitLoss?: number;
  profitLossPercent?: number;
  status: 'open' | 'closed';
  riskRewardRatio?: number;
}

interface TradesState {
  trades: UserTrade[];
  loading: boolean;
  error: string | null;
  fetchUserTrades: (userId: string) => Promise<void>;
  createTrade: (trade: Omit<UserTrade, '_id'>) => Promise<void>;
  closeTrade: (tradeId: string, exitPrice: number, exitTime: Date) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useTradesStore = create<TradesState>((set) => ({
  trades: [],
  loading: false,
  error: null,

  fetchUserTrades: async (userId: string) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/trade-analytics/trades/${userId}`);
      set({ trades: response.data.data });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to fetch trades' });
    } finally {
      set({ loading: false });
    }
  },

  createTrade: async (trade: Omit<UserTrade, '_id'>) => {
    try {
      const response = await axios.post(`${API_URL}/trade-analytics/trades`, trade);
      set((state) => ({ trades: [...state.trades, response.data.data] }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create trade' });
    }
  },

  closeTrade: async (tradeId: string, exitPrice: number, exitTime: Date) => {
    try {
      const response = await axios.put(`${API_URL}/trade-analytics/trades/${tradeId}/close`, {
        exitPrice,
        exitTime
      });
      set((state) => ({
        trades: state.trades.map((t) => (t._id === tradeId ? response.data.data : t))
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to close trade' });
    }
  }
}));
