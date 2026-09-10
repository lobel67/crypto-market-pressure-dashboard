import express, { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

const router = Router();

// Mock user storage (replace with database in production)
const users: any[] = [];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(user);

    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username,
        email,
        token
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email,
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

export default router;
