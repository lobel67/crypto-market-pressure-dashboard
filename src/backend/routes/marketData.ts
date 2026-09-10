import express, { Router, Request, Response } from 'express';
import { PressureScoreModel } from '../models/PressureScore';
import { AlertModel } from '../models/Alert';
import PressureScoreEngine from '../services/pressureScoreEngine';
import logger from '../utils/logger';

const router = Router();
const pressureEngine = new PressureScoreEngine();

// Get current pressure scores for multiple coins
router.post('/scores', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ success: false, error: 'symbols array required' });
    }

    const scores = await pressureEngine.getPressureScoresForMultipleCoins(symbols);
    
    // Save to database for historical analysis
    await PressureScoreModel.insertMany(scores);

    res.json({ success: true, data: scores });
  } catch (error) {
    logger.error('Error calculating pressure scores:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate pressure scores' });
  }
});

// Get pressure score history for a coin
router.get('/scores/:symbol/history', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { days = 7, limit = 1000 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const history = await PressureScoreModel.find({
      symbol,
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));

    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error fetching pressure score history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

// Get top pressure coins
router.get('/top-pressure', async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    const topCoins = await PressureScoreModel.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        }
      },
      {
        $sort: { score: -1 }
      },
      {
        $limit: parseInt(limit as string)
      },
      {
        $project: {
          symbol: 1,
          score: 1,
          components: 1,
          signals: 1,
          timestamp: 1
        }
      }
    ]);

    res.json({ success: true, data: topCoins });
  } catch (error) {
    logger.error('Error fetching top pressure coins:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top coins' });
  }
});

// Get pressure statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await PressureScoreModel.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' },
          totalCoins: { $sum: 1 },
          highPressure: {
            $sum: {
              $cond: [{ $gte: ['$score', 75] }, 1, 0]
            }
          },
          mediumPressure: {
            $sum: {
              $cond: [{ $and: [{ $gte: ['$score', 50] }, { $lt: ['$score', 75] }] }, 1, 0]
            }
          },
          lowPressure: {
            $sum: {
              $cond: [{ $lt: ['$score', 50] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({ success: true, data: stats[0] || {} });
  } catch (error) {
    logger.error('Error fetching pressure stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
