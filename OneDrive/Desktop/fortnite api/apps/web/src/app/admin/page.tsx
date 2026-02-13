'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardOverview from '@/components/admin/DashboardOverview';
import UsersManagement from '@/components/admin/UsersManagement';
import SystemMonitoring from '@/components/admin/SystemMonitoring';

interface AdminUser {
  isAdmin: boolean;
  role: string;
  email: string;
  username: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Get user ID from localStorage (assuming it's stored there)
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
      
      if (!userId) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/auth', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        router.push('/');
        return;
      }

      const data = await response.json();
      if (!data.isAdmin) {
        router.push('/');
        return;
      }

      setAdminUser(data);
      setLoading(false);
    } catch (error) {
      console.error('Admin check failed:', error);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{adminUser.email}</span>
              <span className="px-2 py-1 bg-purple-600 rounded text-xs">{adminUser.role}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              {[
                { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
                { id: 'users', label: '👥 Users', icon: '👥' },
                { id: 'subscriptions', label: '💳 Subscriptions', icon: '💳' },
                { id: 'monitoring', label: '📈 Monitoring', icon: '📈' },
                { id: 'analytics', label: '📉 Analytics', icon: '📉' },
                { id: 'affiliates', label: '🤝 Affiliates', icon: '🤝' },
                { id: 'promo-codes', label: '🎫 Promo Codes', icon: '🎫' },
                { id: 'ai-controls', label: '🤖 AI Controls', icon: '🤖' },
                { id: 'notifications', label: '📧 Notifications', icon: '📧' },
                { id: 'roles', label: '👑 Roles', icon: '👑' },
                { id: 'audit-logs', label: '📋 Audit Logs', icon: '📋' },
              ].map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'subscriptions' && <SubscriptionsManagement />}
          {activeTab === 'monitoring' && <SystemMonitoring />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'affiliates' && <AffiliatesManagement />}
          {activeTab === 'promo-codes' && <PromoCodesManagement />}
          {activeTab === 'ai-controls' && <AIControls />}
          {activeTab === 'notifications' && <NotificationsManagement />}
          {activeTab === 'roles' && <RolesManagement />}
          {activeTab === 'audit-logs' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
}

// Placeholder components
function SubscriptionsManagement() {
  return <div className="text-white">Subscriptions Management - Coming Soon</div>;
}

function AnalyticsDashboard() {
  return <div className="text-white">Analytics Dashboard - Coming Soon</div>;
}

function AffiliatesManagement() {
  return <div className="text-white">Affiliates Management - Coming Soon</div>;
}

function PromoCodesManagement() {
  return <div className="text-white">Promo Codes Management - Coming Soon</div>;
}

function AIControls() {
  return <div className="text-white">AI Controls - Coming Soon</div>;
}

function NotificationsManagement() {
  return <div className="text-white">Notifications Management - Coming Soon</div>;
}

function RolesManagement() {
  return <div className="text-white">Roles Management - Coming Soon</div>;
}

function AuditLogs() {
  return <div className="text-white">Audit Logs - Coming Soon</div>;
}

