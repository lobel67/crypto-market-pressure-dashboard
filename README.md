# Crypto Market Pressure Dashboard

A comprehensive real-time cryptocurrency market analysis platform that combines multiple data sources to provide traders with actionable insights on market pressure, whale activity, liquidations, and sentiment analysis.

## 🎯 Features

### Market Pressure Analysis
- **Real-time Pressure Scores**: Algorithmic scoring system that combines multiple market indicators
- **Component Analysis**: Price/Volume, Futures, Whale Activity, Sentiment, and Volatility scores
- **Market Signals**: Automated alerts based on pressure thresholds and market conditions
- **Historical Tracking**: 7-day historical data with TTL-based cleanup

### Data Collection Services

#### Binance Data Collector
- Spot market data (24h price, volume, changes)
- Futures data (funding rates, open interest, liquidations)
- Long/short ratio analysis
- Volatility calculation (20-period)

#### News & Sentiment Analyzer
- Real-time crypto news aggregation
- Sentiment analysis (positive/negative/neutral)
- Coin relevance detection
- Keyword-based filtering

#### Whale Tracker
- Large transaction monitoring (>$500k default)
- Buy/Sell pressure analysis
- Exchange flow detection
- Volume aggregation

### Trade Analytics
- **Performance Metrics**: Win rate, R:R ratio, P&L tracking
- **Best Trading Hours**: Hourly performance analysis
- **Profitability Analysis**: Coin-by-coin and side-specific performance
- **Long vs Short Stats**: Comparative analysis and profit tracking
- **Risk Detection**: Rule violations, leverage misuse, and revenge trading patterns
- **Losing Streaks**: Psychological pattern identification

### Real-time Notifications
- **Pressure Alerts**: High-pressure coin notifications
- **Liquidation Events**: Large liquidation detection
- **Whale Activity**: Significant whale movement alerts
- **News Sentiment**: Major sentiment shifts

### User Features
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Alert Management**: Read/unread filtering and statistics
- **User Preferences**: Customizable coin tracking and risk tolerance
- **Trade History**: Complete trade logging and analysis

## 🏗️ Architecture

### Backend (Node.js + Express + TypeScript)
```
src/backend/
├── server.ts                 # Main entry point
├── services/
│   ├── pressureScoreEngine.ts      # Core pressure scoring
│   ├── tradeAnalyticsEngine.ts     # Trade analysis
│   ├── dataCollectorManager.ts     # Automated data collection
│   ├── marketDataService.ts        # Global market data
│   └── collectors/
│       ├── binanceCollector.ts     # Binance API integration
│       ├── newsCollector.ts        # News aggregation
│       └── whaleTracker.ts         # Whale monitoring
├── routes/
│   ├── tradeAnalytics.ts   # Trade analytics endpoints
│   ├── marketData.ts       # Market data endpoints
│   ├── alerts.ts           # Alert management endpoints
│   ├── auth.ts             # Authentication endpoints
│   └── user.ts             # User profile endpoints
├── models/
│   ├── UserTrade.ts        # Trade schema
│   ├── PressureScore.ts    # Pressure score schema
│   └── Alert.ts            # Alert schema
├── types/
│   ├── market.ts           # Market data types
│   └── trades.ts           # Trade types
└── utils/
    └── logger.ts           # Logging utility
```

### Frontend (React + TypeScript + Tailwind)
```
src/frontend/
├── main.tsx                # Entry point
├── App.tsx                 # Router setup
├── pages/
│   ├── Dashboard.tsx       # Main dashboard
│   ├── MarketPressure.tsx  # Pressure analysis
│   ├── TradeAnalytics.tsx  # Trade analysis
│   ├── Alerts.tsx          # Alert management
│   └── Login.tsx           # Authentication
├── components/
│   ├── Navigation.tsx      # Main navigation
│   ├── PressureGauge.tsx   # Pressure visualization
│   └── AlertsWidget.tsx    # Alert widget
├── stores/
│   ├── authStore.ts        # Auth state (Zustand)
│   ├── marketStore.ts      # Market data state
│   └── tradesStore.ts      # Trade state
└── index.css               # Tailwind styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- Binance API keys
- News API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/lobel67/crypto-market-pressure-dashboard.git
cd crypto-market-pressure-dashboard
```

2. **Install dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd src/frontend
npm install
```

3. **Configure environment**
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
mongod
```

5. **Start the backend**
```bash
npm run dev
```

6. **Start the frontend** (in another terminal)
```bash
cd src/frontend
npm run dev
```

## 📊 Pressure Score Components

### Formula
```
Total Score = (Price/Volume × 0.20) + (Futures × 0.30) + (Whale × 0.20) + (Sentiment × 0.15) + (Volatility × 0.15)
```

### Components

**Price/Volume Score (20%)**
- 24-hour price change
- Trading volume metrics
- Range: 0-100

**Futures Score (30%)**
- Funding rate (positive = bullish)
- Long/short ratio imbalance
- Open interest spikes
- Liquidation patterns
- Range: 0-100

**Whale Activity Score (20%)**
- Large transaction volume
- Buy/sell pressure ratio
- Exchange inflow/outflow
- Range: 0-100

**Sentiment Score (15%)**
- News sentiment (positive/negative/neutral)
- Weighted by recency
- Coin relevance matching
- Range: 0-100

**Volatility Score (15%)**
- 20-period historical volatility
- Price intensity
- Range: 0-100

## 🔔 Alert Types

1. **Pressure Score Alerts**: Score >= 70 (high), >= 85 (critical)
2. **Liquidation Alerts**: >100 liquidations in 5-minute window
3. **Whale Activity**: >65% buy or <35% buy pressure
4. **Funding Rate**: Extreme positive (>0.1%) or negative (<-0.1%)
5. **Long/Short Ratio**: >2.0 or <0.5 (extreme imbalance)
6. **News Sentiment**: Very positive or very negative sentiment

## 📈 Trade Analytics Insights

### Metrics Calculated
- **Win Rate**: Percentage of profitable trades
- **R:R Ratio**: Risk-to-reward ratio (average)
- **Best Trading Hours**: Hour-by-hour performance analysis
- **Most Profitable Coins**: Top 10 coins by profit
- **Long vs Short Stats**: Side-specific performance
- **Holding Time**: Average trade duration
- **Losing Streaks**: Consecutive loss analysis
- **Rule Violations**: Pattern detection for risky trading

### Automatic Warnings
- Win rate < 40% → Review entry strategy
- R:R ratio < 1.5 → Improve stop loss placement
- High leverage usage (>10x) in >20% trades
- Losing streak > 3 trades
- Inconsistent position sizing
- Overnight risk exposure

## 🔄 Data Collection Schedules

| Task | Frequency | Details |
|------|-----------|----------|
| Market Data | 1 minute | Price, volume, changes |
| Pressure Scores | 2 minutes | Full scoring calculation |
| Liquidations | 5 minutes | Liquidation events |
| News & Sentiment | 30 minutes | News aggregation |
| BTC Dominance | 15 minutes | Market dominance tracking |

## 🔐 Security Features

- JWT authentication with 7-day expiration
- Bcrypt password hashing (10 salt rounds)
- CORS enabled for frontend
- Environment variable configuration
- No sensitive data in logs
- MongoDB TTL indexes for automatic data cleanup

## 📱 Real-time Features

- WebSocket connection for live updates
- Per-coin subscription channels
- Real-time alert broadcasting
- Live pressure score updates
- Liquidation event streaming

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Trade Analytics
- `POST /api/trade-analytics/trades` - Create trade
- `PUT /api/trade-analytics/trades/:id/close` - Close trade
- `GET /api/trade-analytics/trades/:userId` - Get trades
- `GET /api/trade-analytics/analytics/:userId` - Get analytics
- `GET /api/trade-analytics/performance/:userId` - Get performance

### Market Data
- `POST /api/market-data/scores` - Calculate pressure scores
- `GET /api/market-data/scores/:symbol/history` - Score history
- `GET /api/market-data/top-pressure` - Top pressure coins
- `GET /api/market-data/stats` - Market statistics

### Alerts
- `GET /api/alerts/user/:userId` - Get user alerts
- `GET /api/alerts/coin/:symbol` - Get coin alerts
- `PUT /api/alerts/alerts/:id/read` - Mark as read
- `GET /api/alerts/stats/:userId` - Alert statistics

### User
- `GET /api/user/profile/:userId` - Get user profile
- `PUT /api/user/settings/:userId` - Update settings

## 🧪 Testing the Dashboard

1. **Register/Login** on the login page
2. **View Dashboard** - See top pressure coins and alerts
3. **Market Pressure** - Analyze individual coin scores
4. **Trade Analytics** - Log and analyze trades
5. **Alerts** - Monitor real-time notifications

## 📊 Sample Data Points

### Pressure Scores (0-100)
- 0-40: Low pressure (green) - Neutral/stable
- 40-60: Medium pressure (yellow) - Caution
- 60-75: High pressure (orange) - Alert
- 75-100: Critical pressure (red) - Action recommended

## 🔧 Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/crypto-dashboard
JWT_SECRET=your-secret-key
BINANCE_API_KEY=your_key
BINANCE_SECRET_KEY=your_secret
NEWS_API_KEY=your_key
CRYPTO_COMPARE_KEY=your_key
FRONTEND_URL=http://localhost:3000
PRESSURE_SCORE_THRESHOLD=70
LARGE_TRANSACTION_THRESHOLD=500000
```

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

Contributions welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## ⚠️ Disclaimer

This tool is for educational and informational purposes only. It should not be considered as financial advice. Always conduct your own research and consult with a financial advisor before making trading decisions.

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Made with ❤️ by the CryptoFlow Team**
