import create from 'zustand';
import axios from 'axios';

interface PressureScore {
  symbol: string;
  score: number;
  components: {
    priceVolumeScore: number;
    futuresScore: number;
    whaleActivityScore: number;
    sentimentScore: number;
    volatilityScore: number;
  };
  signals: string[];
  btcDominance?: number;
  timestamp: Date;
}

interface MarketState {
  scores: PressureScore[];
  topCoins: PressureScore[];
  btcDominance: number;
  loading: boolean;
  error: string | null;
  fetchPressureScores: (symbols: string[]) => Promise<void>;
  fetchTopCoins: () => Promise<void>;
  updateBTCDominance: (dominance: number) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useMarketStore = create<MarketState>((set) => ({
  scores: [],
  topCoins: [],
  btcDominance: 0,
  loading: false,
  error: null,

  fetchPressureScores: async (symbols: string[]) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/market-data/scores`, { symbols });
      set({ scores: response.data.data });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to fetch pressure scores' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTopCoins: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/market-data/top-pressure`);
      set({ topCoins: response.data.data });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to fetch top coins' });
    } finally {
      set({ loading: false });
    }
  },

  updateBTCDominance: (dominance: number) => {
    set({ btcDominance: dominance });
  }
}));
