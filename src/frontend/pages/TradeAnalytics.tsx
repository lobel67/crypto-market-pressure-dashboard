import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function TradeAnalytics() {
  const { userId } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openTrades, setOpenTrades] = useState<any[]>([]);
  const [closedTrades, setClosedTrades] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const fetchAnalytics = async () => {
    if (!userId) return;
    try {
      const [analyticsRes, tradesRes] = await Promise.all([
        axios.get(`${API_URL}/trade-analytics/analytics/${userId}`),
        axios.get(`${API_URL}/trade-analytics/trades/${userId}`)
      ]);
      setAnalytics(analyticsRes.data.data);
      const trades = tradesRes.data.data;
      setOpenTrades(trades.filter((t: any) => t.status === 'open'));
      setClosedTrades(trades.filter((t: any) => t.status === 'closed'));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">📈 Trade Analytics</h1>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-slate-400 text-sm mb-2">Total Trades</p>
            <p className="text-3xl font-bold">{analytics?.analytics?.totalTrades || 0}</p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm mb-2">Win Rate</p>
            <p className="text-3xl font-bold text-green-500">
              {analytics?.analytics?.winRate?.toFixed(1) || 0}%
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm mb-2">Avg R:R</p>
            <p className="text-3xl font-bold text-blue-500">
              {analytics?.analytics?.averageRR?.toFixed(2) || 0}
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm mb-2">Avg Holding Time</p>
            <p className="text-3xl font-bold">{(analytics?.analytics?.averageHoldingTime / 60)?.toFixed(1) || 0}h</p>
          </div>
        </div>

        {/* Long vs Short Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Long vs Short Performance</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Long Trades</p>
                <p className="text-2xl font-bold text-blue-500">
                  {analytics?.analytics?.longVsShortStats?.longWinRate?.toFixed(1)}% win rate
                </p>
                <p className="text-sm text-slate-300">
                  Profit: ${analytics?.analytics?.longVsShortStats?.longProfit?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Short Trades</p>
                <p className="text-2xl font-bold text-red-500">
                  {analytics?.analytics?.longVsShortStats?.shortWinRate?.toFixed(1)}% win rate
                </p>
                <p className="text-sm text-slate-300">
                  Profit: ${analytics?.analytics?.longVsShortStats?.shortProfit?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Rule Violations</h2>
            <div className="space-y-2">
              {analytics?.analytics?.ruleViolations?.length > 0 ? (
                analytics.analytics.ruleViolations.map((violation: string, idx: number) => (
                  <p key={idx} className="text-sm text-red-400">⚠️ {violation}</p>
                ))
              ) : (
                <p className="text-sm text-green-400">✅ No violations detected</p>
              )}
            </div>
          </div>
        </div>

        {/* Open Trades */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Open Trades ({openTrades.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-left py-2">Entry Price</th>
                  <th className="text-left py-2">Quantity</th>
                  <th className="text-left py-2">Entry Time</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((trade: any) => (
                  <tr key={trade._id} className="border-b border-slate-700">
                    <td className="py-2 font-semibold">{trade.symbol}</td>
                    <td className={`py-2 ${trade.side === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.side.toUpperCase()}
                    </td>
                    <td className="py-2">${trade.entryPrice.toFixed(2)}</td>
                    <td className="py-2">{trade.quantity}</td>
                    <td className="py-2 text-slate-400">{new Date(trade.entryTime).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Profitable Coins */}
        {analytics?.analytics?.mostProfitableCoins?.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Most Profitable Coins</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.analytics.mostProfitableCoins.map((coin: any) => (
                <div key={coin.symbol} className="bg-slate-700 p-3 rounded-lg">
                  <p className="font-semibold">{coin.symbol}</p>
                  <p className="text-green-400 font-bold">${coin.profit.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{coin.trades} trades</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TradeAnalytics;
