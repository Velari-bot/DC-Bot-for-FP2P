import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/firebase';
import CourseList from '../components/Admin/CourseList';
import CourseEditor from '../components/Admin/CourseEditor';
import SiteSettings from '../components/Admin/SiteSettings';
import AccessManager from '../components/Admin/AccessManager';
import AnalyticsPanel from '../components/Admin/AnalyticsPanel';
import MatchmakingManager from '../components/Admin/MatchmakingManager';
import { ShieldAlert, List, Settings, Key, BarChart3, Trophy } from 'lucide-react';

const AdminDashboard = () => {
    const [view, setView] = useState('list'); // 'list' | 'edit' | 'create' | 'settings'
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Security Check
    // In a real app, use Custom Claims or a Firestore 'admins' collection.
    // For now, we'll check against the known admin email.
    const ADMIN_EMAILS = ["benderaden826@gmail.com", "bender.adrian@gmail.com", "flamefrags@gmail.com", "benderaiden826@gmail.com"];

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (!currentUser) {
                // If not logged in, redirect to claim/login
                window.location.href = '/claim';
            }
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading...</div>;

    if (!user || !ADMIN_EMAILS.includes(user.email)) {
        return (
            <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center p-4 text-center">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-400 mb-6">You do not have permission to view the Admin Dashboard.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-bold transition"
                >
                    Return Home
                </button>
                <p className="mt-8 text-xs text-gray-700">Current User: {user?.email}</p>
            </div>
        );
    }

    // --- View Routing ---
    return (
        <div className="h-screen w-full bg-[#050505] text-white relative overflow-hidden font-['Outfit',_sans-serif] flex flex-col">
            {/* Immersive Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-[var(--yellow)]/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[100px]"></div>
                <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Navbar Spacer */}
            <div className="h-[56px] md:h-[145px] shrink-0 transition-all duration-300" />

            <div className="relative z-10 flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Admin Sidebar */}
                <div className="w-full md:w-80 bg-white/[0.02] backdrop-blur-3xl border-r border-white/10 p-8 flex flex-col gap-2 relative z-20 h-full overflow-y-auto custom-scrollbar">
                    <div className="mb-12 px-2">
                        <h2 className="text-white font-black uppercase tracking-tighter text-3xl flex items-center gap-3">
                            <ShieldAlert className="text-[var(--yellow)]" size={28} />
                            Admin
                        </h2>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 ml-1">Management Hub</p>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => setView('list')}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'list' || view === 'edit' || view === 'create'
                                ? 'bg-[var(--yellow)] text-black shadow-[0_10px_20px_-5px_rgba(255,193,7,0.3)]'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <List size={18} /> Courses
                        </button>

                        <button
                            onClick={() => setView('settings')}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'settings'
                                ? 'bg-[var(--yellow)] text-black shadow-[0_10px_20px_-5px_rgba(255,193,7,0.3)]'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Settings size={18} /> Settings
                        </button>

                        <button
                            onClick={() => setView('access')}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'access'
                                ? 'bg-[var(--yellow)] text-black shadow-[0_10px_20px_-5px_rgba(255,193,7,0.3)]'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Key size={18} /> Grant Access
                        </button>

                        <button
                            onClick={() => setView('analytics')}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'analytics'
                                ? 'bg-[var(--yellow)] text-black shadow-[0_10px_20px_-5px_rgba(255,193,7,0.3)]'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <BarChart3 size={18} /> Analytics
                        </button>

                        <button
                            onClick={() => setView('matchmaking')}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'matchmaking'
                                ? 'bg-[var(--yellow)] text-black shadow-[0_10px_20px_-5px_rgba(255,193,7,0.3)]'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Trophy size={18} /> Matchmaking
                        </button>
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/5 text-[9px] text-gray-700 font-black uppercase tracking-[0.4em] px-2 text-center md:text-left">
                        Path To Pro © 2026
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto h-full custom-scrollbar">
                    <div className="p-4 md:p-12">
                        {view === 'list' && (
                            <CourseList
                                onCreate={() => {
                                    setSelectedCourseId(null);
                                    setView('create');
                                }}
                                onEdit={(id) => {
                                    setSelectedCourseId(id);
                                    setView('edit');
                                }}
                            />
                        )}

                        {(view === 'edit' || view === 'create') && (
                            <CourseEditor
                                courseId={selectedCourseId}
                                onBack={() => setView('list')}
                            />
                        )}

                        {view === 'settings' && (
                            <SiteSettings />
                        )}

                        {view === 'access' && (
                            <AccessManager />
                        )}

                        {view === 'analytics' && (
                            <AnalyticsPanel />
                        )}

                        {view === 'matchmaking' && (
                            <MatchmakingManager />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
