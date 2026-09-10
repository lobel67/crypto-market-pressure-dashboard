import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMarketStore } from '../stores/marketStore';
import PressureGauge from '../components/PressureGauge';
import AlertsWidget from '../components/AlertsWidget';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const { userId } = useAuthStore();
  const { topCoins, fetchTopCoins, btcDominance } = useMarketStore();

  useEffect(() => {
    fetchTopCoins();
  }, [fetchTopCoins]);

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">📊 Market Dashboard</h1>

        {/* BTC Dominance Card */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Bitcoin Dominance</h2>
          <div className="flex items-center">
            <div className="text-4xl font-bold text-yellow-500">{btcDominance.toFixed(2)}%</div>
            <div className="ml-auto text-slate-400">Market Control</div>
          </div>
        </div>

        {/* Top Pressure Coins */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">🔥 Highest Pressure Coins</h2>
            <div className="space-y-3">
              {topCoins.slice(0, 5).map((coin) => (
                <div key={coin.symbol} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-semibold">{coin.symbol}</p>
                    <p className="text-sm text-slate-400">{coin.signals.slice(0, 1).join('')}</p>
                  </div>
                  <PressureGauge score={coin.score} size={60} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">⚠️ Alerts</h2>
            <AlertsWidget userId={userId || ''} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-slate-400 text-sm mb-2">Total Coins Tracked</h3>
            <p className="text-3xl font-bold">{topCoins.length}</p>
          </div>
          <div className="card">
            <h3 className="text-slate-400 text-sm mb-2">High Pressure Coins</h3>
            <p className="text-3xl font-bold text-red-500">
              {topCoins.filter((c) => c.score >= 75).length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-slate-400 text-sm mb-2">Last Updated</h3>
            <p className="text-sm text-slate-300">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
