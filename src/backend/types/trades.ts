export interface UserTrade {
  _id?: string;
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
  tags?: string[];
  notes?: string;
}

export interface TradeAnalytics {
  userId: string;
  totalTrades: number;
  winRate: number;
  averageRR: number;
  bestTradingHours: { hour: number; winRate: number }[];
  mostProfitableCoins: { symbol: string; profit: number; trades: number }[];
  longVsShortStats: {
    longWinRate: number;
    shortWinRate: number;
    longProfit: number;
    shortProfit: number;
  };
  averageHoldingTime: number;
  losingStreaks: { count: number; maxConsecutive: number };
  ruleViolations: string[];
  timestamp: Date;
}

export interface TradeInsight {
  userId: string;
  type: 'warning' | 'recommendation' | 'pattern';
  message: string;
  relatedCoins?: string[];
  confidence: number;
  timestamp: Date;
}
