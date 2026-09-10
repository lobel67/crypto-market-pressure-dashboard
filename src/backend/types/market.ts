export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  timestamp: Date;
  openInterest?: number;
  fundingRate?: number;
  volatility?: number;
}

export interface FuturesData {
  symbol: string;
  longShortRatio: number;
  fundingRate: number;
  openInterest: number;
  liquidations: {
    longCount: number;
    shortCount: number;
    totalValue: number;
  };
  timestamp: Date;
}

export interface WhaleTransaction {
  symbol: string;
  amount: number;
  value: number;
  type: 'buy' | 'sell';
  exchange: string;
  timestamp: Date;
  transactionHash: string;
}

export interface CryptoNews {
  title: string;
  description: string;
  url: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevantCoins: string[];
  timestamp: Date;
  imageUrl?: string;
}

export interface PressureScore {
  symbol: string;
  score: number; // 0-100
  components: {
    priceVolumeScore: number;
    futuresScore: number;
    whaleActivityScore: number;
    sentimentScore: number;
    volatilityScore: number;
  };
  signals: string[];
  timestamp: Date;
  btcDominance?: number;
}

export interface LiquidationData {
  symbol: string;
  side: 'long' | 'short';
  amount: number;
  value: number;
  timestamp: Date;
}
