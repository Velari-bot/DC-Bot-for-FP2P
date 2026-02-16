import React, { useState } from 'react';
import { db, auth } from '../../utils/firebase';
import { Search, Save, Trophy, DollarSign, Users, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const MatchmakingManager = () => {
    const [searchEmail, setSearchEmail] = useState('');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchEmail) return;
        setLoading(true);
        setStatus(null);
        setUserData(null);

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`/api/admin?action=get-user&targetEmail=${encodeURIComponent(searchEmail)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (res.ok) {
                setUserData(data);
            } else {
                setStatus({ type: 'error', message: data.error || 'User not found' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to fetch user' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!userData) return;
        setSaving(true);
        setStatus(null);

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`/api/admin?action=update-metrics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetEmail: userData.email,
                    powerRanking: userData.powerRanking,
                    earnings: userData.earnings,
                    followers: userData.followers
                })
            });

            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: 'Metrics updated successfully!' });
            } else {
                setStatus({ type: 'error', message: data.error || 'Update failed' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Network error occurred' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-12">
                <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                    <Trophy className="text-[var(--yellow)]" size={40} />
                    Matchmaking Manager
                </h2>
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Update Player Stats & Criteria</p>
            </div>

            {/* Search Section */}
            <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 mb-8 shadow-2xl">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                        <input
                            type="email"
                            required
                            placeholder="Find player by email..."
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-[1.25rem] py-5 pl-14 pr-6 text-white text-lg font-bold placeholder-gray-700 outline-none focus:border-[var(--yellow)]/50 transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-10 bg-white text-black font-black uppercase tracking-widest text-xs rounded-[1.25rem] hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
                    </button>
                </form>
            </div>

            {/* Status Message */}
            {status && (
                <div className={`mb-8 p-6 rounded-3xl flex items-center gap-4 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {status.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    <span className="font-bold uppercase tracking-wider text-sm">{status.message}</span>
                </div>
            )}

            {/* Results Section */}
            {userData && (
                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-8">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">{userData.email}</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">UID: {userData.uid}</p>
                        </div>
                        <div className="px-4 py-2 bg-[var(--yellow)]/10 border border-[var(--yellow)]/20 rounded-full text-[var(--yellow)] text-[10px] font-black uppercase tracking-widest">
                            Found in Database
                        </div>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* PR */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Trophy size={14} /> Power Ranking
                                </label>
                                <input
                                    type="number"
                                    value={userData.powerRanking}
                                    onChange={(e) => setUserData({ ...userData, powerRanking: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black text-xl outline-none focus:border-[var(--yellow)] transition-all"
                                />
                            </div>

                            {/* Earnings */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign size={14} /> Earnings ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={userData.earnings}
                                    onChange={(e) => setUserData({ ...userData, earnings: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black text-xl outline-none focus:border-[var(--yellow)] transition-all"
                                />
                            </div>

                            {/* Followers */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Users size={14} /> Followers
                                </label>
                                <input
                                    type="number"
                                    value={userData.followers}
                                    onChange={(e) => setUserData({ ...userData, followers: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black text-xl outline-none focus:border-[var(--yellow)] transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2">Current Tier</p>
                                    <span className={`text-3xl font-black italic tracking-tighter uppercase ${(userData.earnings >= 10000 || userData.followers >= 500000) ? 'text-purple-500' :
                                        (userData.powerRanking >= 10000 || userData.earnings >= 5000 || userData.followers >= 100000) ? 'text-red-500' :
                                            (userData.powerRanking >= 5000 || userData.earnings >= 2500 || userData.followers >= 50000) ? 'text-[var(--yellow)]' :
                                                'text-gray-500'}`}>
                                        {(userData.earnings >= 10000 || userData.followers >= 500000) ? 'GOD' :
                                            (userData.powerRanking >= 10000 || userData.earnings >= 5000 || userData.followers >= 100000) ? 'ELITE' :
                                                (userData.powerRanking >= 5000 || userData.earnings >= 2500 || userData.followers >= 50000) ? 'PRO' :
                                                    'PLAYER'}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-[1.5rem] hover:bg-gray-200 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Sync New Criteria</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MatchmakingManager;
