import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Alerts() {
  const { userId } = useAuthStore();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchAlerts();
  }, [userId, filter]);

  const fetchAlerts = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/alerts/user/${userId}`, {
        params: { unreadOnly: filter === 'unread' }
      });
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await axios.put(`${API_URL}/alerts/alerts/${alertId}/read`);
      setAlerts(alerts.map((a) => (a._id === alertId ? { ...a, read: true } : a)));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 text-red-200';
      case 'high':
        return 'bg-orange-900 text-orange-200';
      case 'medium':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-blue-900 text-blue-200';
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🔔 Alerts</h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`btn-primary ${filter === 'all' ? '' : 'btn-secondary'}`}
          >
            All Alerts
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`btn-primary ${filter === 'unread' ? '' : 'btn-secondary'}`}
          >
            Unread
          </button>
        </div>

        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert._id}
                className={`card ${!alert.read ? 'border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="font-semibold text-lg">{alert.symbol}</span>
                      <span className="text-slate-400">{alert.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-slate-300 mb-2">{alert.message}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!alert.read && (
                    <button
                      onClick={() => markAsRead(alert._id)}
                      className="btn-secondary text-sm"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <p className="text-slate-400">No alerts to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Alerts;
