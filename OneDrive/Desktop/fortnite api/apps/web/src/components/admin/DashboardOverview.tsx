'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  signupsToday: number;
  activeSubscriptions: number;
  mrr: number;
  refundRate: number;
  chatLast24h: number;
  voiceLast24h: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
      const response = await fetch('/api/admin/analytics/dashboard', {
        headers: {
          'x-user-id': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.overview);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Signups Today</div>
          <div className="text-3xl font-bold text-green-400">{stats?.signupsToday || 0}</div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Active Subscriptions</div>
          <div className="text-3xl font-bold text-blue-400">{stats?.activeSubscriptions || 0}</div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Monthly Recurring Revenue</div>
          <div className="text-3xl font-bold text-purple-400">${stats?.mrr?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Refund Rate</div>
          <div className="text-3xl font-bold text-yellow-400">{stats?.refundRate || 0}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Chat Usage (24h)</div>
          <div className="text-2xl font-bold">{stats?.chatLast24h || 0}</div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Voice Usage (24h)</div>
          <div className="text-2xl font-bold">{stats?.voiceLast24h || 0} min</div>
        </div>
      </div>
    </div>
  );
}

