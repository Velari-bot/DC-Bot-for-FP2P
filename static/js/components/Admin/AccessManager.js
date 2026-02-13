import React, { useState, useEffect } from 'react';
import { db, auth } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ShieldCheck, Calendar, User, BookOpen, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const AccessManager = () => {
    const [email, setEmail] = useState('');
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [durationValue, setDurationValue] = useState(1);
    const [durationUnit, setDurationUnit] = useState('months'); // days, weeks, months, years, forever
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const snap = await getDocs(collection(db, 'courses'));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setCourses(list);
                if (list.length > 0) setSelectedCourse(list[0].id);
            } catch (e) {
                console.error("Failed to load courses", e);
            }
        };
        fetchCourses();
    }, []);

    const handleGrant = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`/api/admin?action=grant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetEmail: email,
                    courseId: selectedCourse,
                    durationValue: parseInt(durationValue),
                    durationUnit: durationUnit,
                    reason: reason
                })
            });

            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: `Access granted successfully to ${email}!` });
                setEmail('');
                setReason('');
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to grant access.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Network error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <ShieldCheck className="text-[var(--yellow)]" size={32} />
                    Grant Access
                </h2>
                <p className="text-gray-400 mt-2">Manually grant masterclass access to users, bypassing Stripe.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
                {/* Status Message */}
                {status && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span className="font-bold text-sm uppercase tracking-wide">{status.message}</span>
                    </div>
                )}

                <form onSubmit={handleGrant} className="space-y-8 relative z-10">

                    {/* User Email */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <User size={14} /> User Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)] transition-all outline-none font-medium"
                        />
                        <p className="text-[10px] text-gray-600">Must be an existing user email in the system.</p>
                    </div>

                    {/* Course Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={14} /> Select Masterclass
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courses.map(course => (
                                <button
                                    key={course.id}
                                    type="button"
                                    onClick={() => setSelectedCourse(course.id)}
                                    className={`p-4 rounded-xl border text-left transition-all flex items-center gap-4 group ${selectedCourse === course.id ? 'bg-[var(--yellow)]/10 border-[var(--yellow)] text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedCourse === course.id ? 'border-[var(--yellow)] bg-[var(--yellow)]' : 'border-gray-600'}`}>
                                        {selectedCourse === course.id && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                                    </div>
                                    <span className={`font-bold text-sm ${selectedCourse === course.id ? 'text-[var(--yellow)]' : 'group-hover:text-white'}`}>{course.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} /> Access Duration
                        </label>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-4 flex items-center gap-3 relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={durationValue}
                                    onChange={(e) => setDurationValue(e.target.value)}
                                    disabled={durationUnit === 'forever'}
                                    className={`w-full bg-transparent text-white font-bold outline-none text-center ${durationUnit === 'forever' ? 'opacity-30' : ''}`}
                                />
                                <span className="absolute right-4 text-xs font-black text-gray-600 uppercase tracking-widest pointer-events-none">Value</span>
                            </div>
                            <div className="flex-[2]">
                                <div className="grid grid-cols-3 gap-2">
                                    {['days', 'weeks', 'months', 'years', 'forever'].map(unit => (
                                        <button
                                            key={unit}
                                            type="button"
                                            onClick={() => setDurationUnit(unit)}
                                            className={`py-3 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${durationUnit === unit ? 'bg-[var(--yellow)] text-black' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {unit}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> Reason for Granting
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Giveaway winner, special promotion, refund compensation..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)] transition-all outline-none font-medium h-24 resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !email || !selectedCourse}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${loading || !email || !selectedCourse ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-[var(--yellow)] text-black hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,193,7,0.4)]'}`}
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <><ShieldCheck size={20} /> Grant Access Now</>}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default AccessManager;
