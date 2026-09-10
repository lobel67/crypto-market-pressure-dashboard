export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  timestamp: Date;
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

export interface LiquidationData {
  symbol: string;
  side: 'long' | 'short';
  amount: number;
  value: number;
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
