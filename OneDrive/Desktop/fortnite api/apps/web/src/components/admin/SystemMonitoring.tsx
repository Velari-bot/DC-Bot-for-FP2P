'use client';

import { useState, useEffect } from 'react';

interface MonitoringStats {
  activeUsers: number;
  totalUsers: number;
  recentSignups: number;
  activeSubscriptions: number;
  messages: number;
  messagesPerMinute: number;
  voiceMessages: number;
  voicePerMinute: number;
  errorCount: number;
  totalRevenue: number;
}

export default function SystemMonitoring() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadStats = async () => {
    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
      const response = await fetch(`/api/admin/monitoring/stats?range=${timeRange}`, {
        headers: {
          'x-user-id': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <div className="text-gray-400">Loading monitoring data...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">System Monitoring</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Active Users (5 min)</div>
          <div className="text-3xl font-bold text-green-400">{stats?.activeUsers || 0}</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Total Users</div>
          <div className="text-3xl font-bold text-blue-400">{stats?.totalUsers || 0}</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Recent Signups</div>
          <div className="text-3xl font-bold text-purple-400">{stats?.recentSignups || 0}</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Active Subscriptions</div>
          <div className="text-3xl font-bold text-yellow-400">{stats?.activeSubscriptions || 0}</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Messages</div>
          <div className="text-3xl font-bold text-cyan-400">{stats?.messages || 0}</div>
          <div className="text-sm text-gray-500 mt-1">{stats?.messagesPerMinute?.toFixed(2) || 0} per minute</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Voice Messages</div>
          <div className="text-3xl font-bold text-pink-400">{stats?.voiceMessages || 0}</div>
          <div className="text-sm text-gray-500 mt-1">{stats?.voicePerMinute?.toFixed(2) || 0} per minute</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Errors</div>
          <div className="text-3xl font-bold text-red-400">{stats?.errorCount || 0}</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-green-400">${stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
        </div>
      </div>
    </div>
  );
}

