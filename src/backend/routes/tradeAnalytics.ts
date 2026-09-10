import express, { Router, Request, Response } from 'express';
import { UserTradeModel } from '../models/UserTrade';
import { AlertModel } from '../models/Alert';
import TradeAnalyticsEngine from '../services/tradeAnalyticsEngine';
import logger from '../utils/logger';

const router = Router();
const analyticsEngine = new TradeAnalyticsEngine();

// Create a new trade
router.post('/trades', async (req: Request, res: Response) => {
  try {
    const { userId, symbol, entryPrice, quantity, side, leverage, entryTime, tags, notes } = req.body;

    const trade = new UserTradeModel({
      userId,
      symbol,
      entryPrice,
      quantity,
      side,
      leverage: leverage || 1,
      entryTime: new Date(entryTime),
      status: 'open',
      tags,
      notes
    });

    await trade.save();
    res.status(201).json({ success: true, data: trade });
  } catch (error) {
    logger.error('Error creating trade:', error);
    res.status(500).json({ success: false, error: 'Failed to create trade' });
  }
});

// Close a trade
router.put('/trades/:tradeId/close', async (req: Request, res: Response) => {
  try {
    const { tradeId } = req.params;
    const { exitPrice, exitTime } = req.body;

    const trade = await UserTradeModel.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    trade.exitPrice = exitPrice;
    trade.exitTime = new Date(exitTime);
    trade.status = 'closed';

    // Calculate P&L
    const pnl = (exitPrice - trade.entryPrice) * trade.quantity;
    const pnlPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
    trade.profitLoss = trade.side === 'long' ? pnl : -pnl;
    trade.profitLossPercent = trade.side === 'long' ? pnlPercent : -pnlPercent;

    // Calculate R:R if stop loss was set
    if (req.body.stopLoss) {
      const riskPerTrade = Math.abs(trade.entryPrice - req.body.stopLoss) * trade.quantity;
      const rewardPerTrade = Math.abs(exitPrice - trade.entryPrice) * trade.quantity;
      trade.riskRewardRatio = riskPerTrade > 0 ? rewardPerTrade / riskPerTrade : 0;
    }

    await trade.save();
    res.json({ success: true, data: trade });
  } catch (error) {
    logger.error('Error closing trade:', error);
    res.status(500).json({ success: false, error: 'Failed to close trade' });
  }
});

// Get user's trades
router.get('/trades/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, symbol, limit = 50, offset = 0 } = req.query;

    const query: any = { userId };
    if (status) query.status = status;
    if (symbol) query.symbol = symbol;

    const trades = await UserTradeModel.find(query)
      .sort({ entryTime: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await UserTradeModel.countDocuments(query);

    res.json({ success: true, data: trades, total });
  } catch (error) {
    logger.error('Error fetching trades:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trades' });
  }
});

// Get trade analytics for user
router.get('/analytics/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const trades = await UserTradeModel.find({ userId });
    const analytics = analyticsEngine.analyzeTrades(trades);
    const insights = analyticsEngine.generateInsights(analytics);

    res.json({ success: true, data: { analytics, insights } });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// Get performance stats
router.get('/performance/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const trades = await UserTradeModel.find({
      userId,
      status: 'closed',
      exitTime: { $gte: startDate }
    });

    const totalProfit = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const totalTrades = trades.length;
    const winners = trades.filter(t => (t.profitLoss || 0) > 0).length;
    const losers = trades.filter(t => (t.profitLoss || 0) < 0).length;

    const dailyPnL: { [key: string]: number } = {};
    trades.forEach(trade => {
      const date = trade.exitTime?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      dailyPnL[date] = (dailyPnL[date] || 0) + (trade.profitLoss || 0);
    });

    res.json({
      success: true,
      data: {
        totalProfit,
        totalTrades,
        winRate: totalTrades > 0 ? (winners / totalTrades) * 100 : 0,
        winners,
        losers,
        avgWin: winners > 0 ? trades.filter(t => (t.profitLoss || 0) > 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0) / winners : 0,
        avgLoss: losers > 0 ? trades.filter(t => (t.profitLoss || 0) < 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0) / losers : 0,
        dailyPnL,
        period: `${days} days`
      }
    });
  } catch (error) {
    logger.error('Error fetching performance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch performance' });
  }
});

export default router;
