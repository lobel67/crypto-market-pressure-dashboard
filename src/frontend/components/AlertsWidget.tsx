import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AlertsWidgetProps {
  userId: string;
}

function AlertsWidget({ userId }: AlertsWidgetProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const fetchAlerts = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/alerts/user/${userId}`, {
        params: { unreadOnly: true, limit: 5 }
      });
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      default:
        return '🔵';
    }
  };

  return (
    <div className="space-y-2">
      {alerts.length > 0 ? (
        alerts.map((alert) => (
          <div key={alert._id} className="bg-slate-700 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span>{getSeverityIcon(alert.severity)}</span>
              <span className="font-semibold">{alert.symbol}</span>
              <span className="text-slate-400 text-xs">{alert.type.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">No recent alerts</p>
      )}
    </div>
  );
}

export default AlertsWidget;
