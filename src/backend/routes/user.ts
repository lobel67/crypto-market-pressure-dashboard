import express, { Router, Request, Response } from 'express';
import logger from '../utils/logger';

const router = Router();

// Mock user storage (replace with database in production)
const userSettings: any = {};

// Get user profile
router.get('/profile/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userProfile = userSettings[userId] || {
      userId,
      username: 'User',
      email: 'user@example.com',
      preferredCoins: ['BTC', 'ETH', 'SOL'],
      notificationsEnabled: true,
      riskTolerance: 'medium'
    };

    res.json({ success: true, data: userProfile });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// Update user settings
router.put('/settings/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { preferredCoins, notificationsEnabled, riskTolerance, dailyLimit } = req.body;

    userSettings[userId] = {
      userId,
      preferredCoins: preferredCoins || ['BTC', 'ETH', 'SOL'],
      notificationsEnabled: notificationsEnabled !== false,
      riskTolerance: riskTolerance || 'medium',
      dailyLimit: dailyLimit || 10000,
      updatedAt: new Date()
    };

    res.json({ success: true, data: userSettings[userId] });
  } catch (error) {
    logger.error('Error updating user settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

export default router;
