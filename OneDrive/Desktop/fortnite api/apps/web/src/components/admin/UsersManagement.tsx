'use client';

import { useState, useEffect } from 'react';

interface User {
  uid: string;
  email: string;
  username: string;
  createdAt: string;
  lastLogin: string;
  isPremium: boolean;
  activePlanId: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (searchQuery) {
      searchUsers();
    } else {
      loadRecentUsers();
    }
  }, [searchQuery]);

  const loadRecentUsers = async () => {
    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
      const response = await fetch('/api/admin/users/search?limit=50', {
        headers: {
          'x-user-id': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'x-user-id': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = async (uid: string) => {
    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
      const response = await fetch(`/api/admin/users/${uid}`, {
        headers: {
          'x-user-id': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
    }
  };

  const banUser = async (uid: string, days: number) => {
    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + days);

      const response = await fetch(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'x-user-id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ban',
          bannedUntil: bannedUntil.toISOString(),
        }),
      });

      if (response.ok) {
        alert('User banned successfully');
        loadRecentUsers();
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const grantPremium = async (uid: string, days: number) => {
    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('uid');
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'x-user-id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'grant_premium',
          days,
        }),
      });

      if (response.ok) {
        alert('Premium granted successfully');
        loadRecentUsers();
      }
    } catch (error) {
      console.error('Failed to grant premium:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Users Management</h2>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by email or UID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        />
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-t border-gray-700">
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.isPremium ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {user.activePlanId || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewUserDetails(user.uid)}
                        className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => grantPremium(user.uid, 30)}
                        className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700"
                      >
                        Grant Premium
                      </button>
                      <button
                        onClick={() => banUser(user.uid, 7)}
                        className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
                      >
                        Ban
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="mt-6 bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">User Details</h3>
          <pre className="text-sm text-gray-300 overflow-auto">
            {JSON.stringify(selectedUser, null, 2)}
          </pre>
          <button
            onClick={() => setSelectedUser(null)}
            className="mt-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

