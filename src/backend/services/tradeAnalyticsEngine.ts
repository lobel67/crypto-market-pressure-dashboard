import { UserTrade, TradeAnalytics, TradeInsight } from '../types/trades';
import logger from '../utils/logger';

class TradeAnalyticsEngine {
  analyzeTrades(trades: UserTrade[]): TradeAnalytics {
    if (trades.length === 0) {
      return this.getEmptyAnalytics(trades[0]?.userId || '');
    }

    const closedTrades = trades.filter(t => t.status === 'closed');
    
    return {
      userId: trades[0].userId,
      totalTrades: closedTrades.length,
      winRate: this.calculateWinRate(closedTrades),
      averageRR: this.calculateAverageRR(closedTrades),
      bestTradingHours: this.findBestTradingHours(closedTrades),
      mostProfitableCoins: this.findMostProfitableCoins(closedTrades),
      longVsShortStats: this.analyzeLongVsShort(closedTrades),
      averageHoldingTime: this.calculateAverageHoldingTime(closedTrades),
      losingStreaks: this.analyzeLosingStreaks(closedTrades),
      ruleViolations: this.detectRuleViolations(closedTrades),
      timestamp: new Date()
    };
  }

  private calculateWinRate(trades: UserTrade[]): number {
    if (trades.length === 0) return 0;
    const winners = trades.filter(t => (t.profitLoss || 0) > 0).length;
    return (winners / trades.length) * 100;
  }

  private calculateAverageRR(trades: UserTrade[]): number {
    if (trades.length === 0) return 0;
    
    const rrs = trades
      .filter(t => (t.riskRewardRatio || 0) > 0)
      .map(t => t.riskRewardRatio || 0);
    
    if (rrs.length === 0) return 0;
    return rrs.reduce((a, b) => a + b, 0) / rrs.length;
  }

  private findBestTradingHours(
    trades: UserTrade[]
  ): { hour: number; winRate: number }[] {
    const hourStats: { [key: number]: { wins: number; total: number } } = {};

    trades.forEach(trade => {
      const hour = new Date(trade.entryTime).getHours();
      if (!hourStats[hour]) {
        hourStats[hour] = { wins: 0, total: 0 };
      }
      hourStats[hour].total++;
      if ((trade.profitLoss || 0) > 0) {
        hourStats[hour].wins++;
      }
    });

    return Object.entries(hourStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        winRate: (stats.wins / stats.total) * 100
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);
  }

  private findMostProfitableCoins(
    trades: UserTrade[]
  ): { symbol: string; profit: number; trades: number }[] {
    const coinStats: { [key: string]: { profit: number; trades: number } } = {};

    trades.forEach(trade => {
      if (!coinStats[trade.symbol]) {
        coinStats[trade.symbol] = { profit: 0, trades: 0 };
      }
      coinStats[trade.symbol].profit += trade.profitLoss || 0;
      coinStats[trade.symbol].trades++;
    });

    return Object.entries(coinStats)
      .map(([symbol, stats]) => ({
        symbol,
        profit: stats.profit,
        trades: stats.trades
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  }

  private analyzeLongVsShort(
    trades: UserTrade[]
  ): {
    longWinRate: number;
    shortWinRate: number;
    longProfit: number;
    shortProfit: number;
  } {
    const longTrades = trades.filter(t => t.side === 'long');
    const shortTrades = trades.filter(t => t.side === 'short');

    const longProfit = longTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const shortProfit = shortTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);

    return {
      longWinRate: this.calculateWinRate(longTrades),
      shortWinRate: this.calculateWinRate(shortTrades),
      longProfit,
      shortProfit
    };
  }

  private calculateAverageHoldingTime(trades: UserTrade[]): number {
    if (trades.length === 0) return 0;
    
    const totalTime = trades.reduce((sum, trade) => {
      const exitTime = trade.exitTime || new Date();
      const holdingTime = (exitTime.getTime() - trade.entryTime.getTime()) / (1000 * 60);
      return sum + holdingTime;
    }, 0);

    return totalTime / trades.length;
  }

  private analyzeLosingStreaks(
    trades: UserTrade[]
  ): { count: number; maxConsecutive: number } {
    if (trades.length === 0) return { count: 0, maxConsecutive: 0 };

    let currentStreak = 0;
    let maxStreak = 0;
    let totalLosingStreaks = 0;

    trades.forEach(trade => {
      if ((trade.profitLoss || 0) < 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        if (currentStreak > 0) {
          totalLosingStreaks++;
        }
        currentStreak = 0;
      }
    });

    return {
      count: totalLosingStreaks,
      maxConsecutive: maxStreak
    };
  }

  private detectRuleViolations(trades: UserTrade[]): string[] {
    const violations: string[] = [];

    // Check for excessive leverage
    const highLeverageTrades = trades.filter(t => (t.leverage || 1) > 10);
    if (highLeverageTrades.length > trades.length * 0.2) {
      violations.push('High leverage usage (>10x) in more than 20% of trades');
    }

    // Check for holding through major news events
    const trades24hHoldTime = trades.filter(
      t => ((t.exitTime?.getTime() || Date.now()) - t.entryTime.getTime()) / (1000 * 60 * 60) < 24
    );
    if (trades24hHoldTime.length < trades.length * 0.3) {
      violations.push('Most trades held longer than 24 hours - possible overnight risk exposure');
    }

    // Check for inconsistent position sizing
    const quantities = trades.map(t => t.quantity);
    const avgQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - avgQuantity, 2), 0) / quantities.length;
    if (Math.sqrt(variance) > avgQuantity * 0.5) {
      violations.push('Inconsistent position sizing detected');
    }

    // Check for revenge trading patterns
    const losingStreaks = this.analyzeLosingStreaks(trades);
    if (losingStreaks.maxConsecutive > 3) {
      violations.push(`Long losing streak detected (${losingStreaks.maxConsecutive} consecutive losses)`);
    }

    return violations;
  }

  private getEmptyAnalytics(userId: string): TradeAnalytics {
    return {
      userId,
      totalTrades: 0,
      winRate: 0,
      averageRR: 0,
      bestTradingHours: [],
      mostProfitableCoins: [],
      longVsShortStats: {
        longWinRate: 0,
        shortWinRate: 0,
        longProfit: 0,
        shortProfit: 0
      },
      averageHoldingTime: 0,
      losingStreaks: { count: 0, maxConsecutive: 0 },
      ruleViolations: [],
      timestamp: new Date()
    };
  }

  generateInsights(analytics: TradeAnalytics): TradeInsight[] {
    const insights: TradeInsight[] = [];

    // Win rate insights
    if (analytics.winRate < 40) {
      insights.push({
        userId: analytics.userId,
        type: 'warning',
        message: `Low win rate of ${analytics.winRate.toFixed(1)}% - review entry strategy`,
        confidence: 0.8,
        timestamp: new Date()
      });
    } else if (analytics.winRate > 60) {
      insights.push({
        userId: analytics.userId,
        type: 'recommendation',
        message: `Strong win rate of ${analytics.winRate.toFixed(1)}% - consider increasing position size`,
        confidence: 0.7,
        timestamp: new Date()
      });
    }

    // Risk/Reward insights
    if (analytics.averageRR < 1.5) {
      insights.push({
        userId: analytics.userId,
        type: 'warning',
        message: `Low average R:R ratio of ${analytics.averageRR.toFixed(2)} - improve stop loss placement`,
        confidence: 0.75,
        timestamp: new Date()
      });
    }

    // Best trading hours
    if (analytics.bestTradingHours.length > 0) {
      const bestHours = analytics.bestTradingHours.slice(0, 3).map(h => h.hour).join(', ');
      insights.push({
        userId: analytics.userId,
        type: 'recommendation',
        message: `Best trading hours: ${bestHours} UTC - focus on these times`,
        relatedCoins: [],
        confidence: 0.8,
        timestamp: new Date()
      });
    }

    // Long vs Short performance
    const performance = analytics.longVsShortStats;
    if (performance.longWinRate > performance.shortWinRate + 20) {
      insights.push({
        userId: analytics.userId,
        type: 'pattern',
        message: `Long positions performing ${(performance.longWinRate - performance.shortWinRate).toFixed(1)}% better than shorts`,
        confidence: 0.85,
        timestamp: new Date()
      });
    }

    // Rule violations
    if (analytics.ruleViolations.length > 0) {
      analytics.ruleViolations.forEach(violation => {
        insights.push({
          userId: analytics.userId,
          type: 'warning',
          message: `Rule violation: ${violation}`,
          confidence: 0.9,
          timestamp: new Date()
        });
      });
    }

    // Losing streak warning
    if (analytics.losingStreaks.maxConsecutive > 3) {
      insights.push({
        userId: analytics.userId,
        type: 'warning',
        message: `Maximum losing streak: ${analytics.losingStreaks.maxConsecutive} trades - take a break to reset`,
        confidence: 0.9,
        timestamp: new Date()
      });
    }

    return insights;
  }
}

export default TradeAnalyticsEngine;
