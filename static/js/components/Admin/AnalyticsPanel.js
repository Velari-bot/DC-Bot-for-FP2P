import React, { useEffect, useState } from 'react';
import { db, auth } from '../../utils/firebase';
import {
    Users,
    TrendingUp,
    Play,
    DollarSign,
    BarChart3,
    Video,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsPanel = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/admin?action=analytics', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch analytics');
                const result = await res.json();
                setData(result);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="animate-spin text-[var(--yellow)]" size={40} />
            <p className="text-gray-500 font-medium animate-pulse">Gathering intelligence...</p>
        </div>
    );

    if (error) return (
        <div className="p-10 text-center bg-red-500/10 border border-red-500/20 rounded-3xl">
            <p className="text-red-400 font-bold mb-2">Error Loading Analytics</p>
            <p className="text-red-300/60 text-sm">{error}</p>
        </div>
    );

    const totalRevenue = data.salesByCourse.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalSales = data.salesByCourse.reduce((acc, curr) => acc + curr.sales, 0);

    // Calculate Estimated Net (based on user reported ~16.9% effective fee rate)
    const effectiveFeeRate = 0.16911;
    const estimatedFees = totalRevenue * effectiveFeeRate;
    const netRevenue = totalRevenue - estimatedFees;

    // Sort courses by revenue
    const topCourse = [...data.salesByCourse].sort((a, b) => b.revenue - a.revenue)[0];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Gross Revenue"
                    value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<DollarSign className="text-gray-400" />}
                    color="gray"
                />
                <StatCard
                    title="Estimated Net"
                    value={`$${netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<TrendingUp className="text-green-400" />}
                    color="green"
                    subtitle="After ~16.9% Fees"
                />
                <StatCard
                    title="Total Sales"
                    value={totalSales.toLocaleString()}
                    icon={<Users className="text-blue-400" />}
                    color="blue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Course Distribution */}
                <div className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Course Sales</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Revenue Distribution</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-2xl">
                            <BarChart3 size={20} className="text-gray-400" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {data.salesByCourse.map((course, idx) => (
                            <div key={course.id} className="space-y-2">
                                <div className="flex justify-between text-sm items-end">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-300 truncate max-w-[200px]">{course.name}</span>
                                        <span className="text-[9px] text-gray-600 font-bold uppercase">Net: ${(course.revenue * (1 - effectiveFeeRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <span className="font-mono text-[var(--yellow)]">${course.revenue.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(course.revenue / (totalRevenue || 1)) * 100}%` }}
                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                        className="h-full bg-gradient-to-r from-[var(--yellow)] to-yellow-600 shadow-[0_0_10px_rgba(250,204,36,0.3)]"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-600 font-black uppercase tracking-tighter">
                                    <span>{course.sales} Student{course.sales !== 1 ? 's' : ''}</span>
                                    <span>{Math.round((course.revenue / (totalRevenue || 1)) * 100)}%</span>
                                </div>
                            </div>
                        ))}
                        {data.salesByCourse.length === 0 && (
                            <p className="text-center py-10 text-gray-600 italic">No sales data yet.</p>
                        )}
                    </div>
                </div>

                {/* Video Popularity */}
                <div className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Most Watched</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Top 5 Content</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-2xl">
                            <Video size={20} className="text-gray-400" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {data.topVideos.slice(0, 5).map((video, idx) => (
                            <div key={video.id} className="group p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black text-gray-600 group-hover:text-[var(--yellow)] transition-colors">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-gray-200 truncate">{video.title}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">ID: {video.id.substring(0, 8)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-white">{video.totalViews.toLocaleString()}</span>
                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Views</p>
                                </div>
                            </div>
                        ))}
                        {data.topVideos.length === 0 && (
                            <div className="text-center py-10 opacity-30 italic text-sm">
                                <Play className="mx-auto mb-3 opacity-20" size={32} />
                                <p>Tracking started. Visit videos to see data.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly Trends */}
            <div className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-8">
                    <Calendar size={20} className="text-[var(--yellow)]" />
                    <h3 className="text-xl font-black text-white tracking-tight">Performance History</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Revenue Trend */}
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Monthly Revenue</p>
                        <div className="h-48 flex items-end gap-2 px-2">
                            {Object.entries(data.revenueByMonth).sort().slice(-6).map(([month, rev]) => (
                                <div key={month} className="flex-1 flex flex-col items-center gap-3 group relative">
                                    <div className="absolute -top-8 bg-black border border-white/10 px-2 py-1 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                        ${rev.toLocaleString()}
                                    </div>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(rev / (Math.max(...Object.values(data.revenueByMonth)) || 1)) * 100}%` }}
                                        className="w-full bg-gradient-to-t from-green-500/20 to-green-400 rounded-t-xl min-h-[4px] relative"
                                    />
                                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter rotate-45 mt-2">{month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Views Trend */}
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Monthly Video Views</p>
                        <div className="h-48 flex items-end gap-2 px-2">
                            {Object.entries(data.monthlyVideoViews || {}).sort().slice(-6).map(([month, views]) => (
                                <div key={month} className="flex-1 flex flex-col items-center gap-3 group relative">
                                    <div className="absolute -top-8 bg-black border border-white/10 px-2 py-1 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                        {views.toLocaleString()}
                                    </div>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(views / (Math.max(...Object.values(data.monthlyVideoViews || {})) || 1)) * 100}%` }}
                                        className="w-full bg-gradient-to-t from-[var(--yellow)]/20 to-[var(--yellow)] rounded-t-xl min-h-[4px]"
                                    />
                                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter rotate-45 mt-2">{month}</span>
                                </div>
                            ))}
                        </div>
                        {(!data.monthlyVideoViews || Object.keys(data.monthlyVideoViews).length === 0) && (
                            <p className="text-center text-xs text-gray-700 mt-20 italic">Awaiting monthly data aggregation...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, color, subtitle }) => {
    const colorMap = {
        green: 'bg-green-500/10 border-green-500/20',
        blue: 'bg-blue-500/10 border-blue-500/20',
        yellow: 'bg-[var(--yellow)]/10 border-[var(--yellow)]/20',
        purple: 'bg-purple-500/10 border-purple-500/20',
        gray: 'bg-white/5 border-white/10'
    };

    return (
        <div className={`p-6 rounded-[2rem] border backdrop-blur-3xl transition-all hover:scale-[1.02] active:scale-[0.98] ${colorMap[color]}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-black/20 rounded-2xl border border-white/5">
                    {React.cloneElement(icon, { size: 20 })}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-black/20 ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                <h4 className="text-2xl font-black text-white tracking-tight">{value}</h4>
                {subtitle && <p className="text-[9px] text-gray-600 font-bold uppercase mt-1 tracking-tighter">{subtitle}</p>}
            </div>
        </div>
    );
};

export default AnalyticsPanel;
