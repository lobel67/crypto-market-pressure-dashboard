import express, { Router, Request, Response } from 'express';
import { AlertModel } from '../models/Alert';
import logger from '../utils/logger';

const router = Router();

// Get user alerts
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { unreadOnly = false, limit = 50, offset = 0 } = req.query;

    const query: any = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const alerts = await AlertModel.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await AlertModel.countDocuments(query);
    const unreadCount = await AlertModel.countDocuments({ userId, read: false });

    res.json({ success: true, data: alerts, total, unreadCount });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

// Get alerts for a coin
router.get('/coin/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { limit = 50 } = req.query;

    const alerts = await AlertModel.find({ symbol })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Error fetching coin alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

// Mark alert as read
router.put('/alerts/:alertId/read', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    const alert = await AlertModel.findByIdAndUpdate(
      alertId,
      { read: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Error marking alert as read:', error);
    res.status(500).json({ success: false, error: 'Failed to update alert' });
  }
});

// Get alert statistics
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const stats = await AlertModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const readStats = await AlertModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$read',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ success: true, data: { bySeverity: stats, byReadStatus: readStats } });
  } catch (error) {
    logger.error('Error fetching alert statistics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

export default router;
