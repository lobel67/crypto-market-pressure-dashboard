import React, { useEffect } from 'react';
import { useMarketStore } from '../stores/marketStore';
import PressureGauge from '../components/PressureGauge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function MarketPressure() {
  const { topCoins, fetchTopCoins, loading } = useMarketStore();

  useEffect(() => {
    fetchTopCoins();
    const interval = setInterval(fetchTopCoins, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchTopCoins]);

  if (loading && topCoins.length === 0) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">Loading...</div>;
  }

  // Prepare data for chart
  const chartData = topCoins.map((coin) => ({
    symbol: coin.symbol,
    pressure: coin.score,
    futures: coin.components.futuresScore,
    whale: coin.components.whaleActivityScore
  }));

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🎯 Market Pressure Analysis</h1>

        {/* Pressure Chart */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Pressure Scores Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="symbol" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="pressure"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorPressure)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {topCoins.map((coin) => (
            <div key={coin.symbol} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{coin.symbol}</h3>
                <PressureGauge score={coin.score} size={80} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Price/Volume</span>
                  <span className="font-semibold">{coin.components.priceVolumeScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Futures</span>
                  <span className="font-semibold">{coin.components.futuresScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Whale Activity</span>
                  <span className="font-semibold">{coin.components.whaleActivityScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sentiment</span>
                  <span className="font-semibold">{coin.components.sentimentScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volatility</span>
                  <span className="font-semibold">{coin.components.volatilityScore.toFixed(1)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Signals:</p>
                <div className="space-y-1">
                  {coin.signals.slice(0, 2).map((signal, idx) => (
                    <p key={idx} className="text-xs text-slate-300">
                      {signal}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MarketPressure;
