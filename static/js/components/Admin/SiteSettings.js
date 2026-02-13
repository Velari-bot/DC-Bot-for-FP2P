import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { Settings, Save, CheckCircle } from 'lucide-react';

const SiteSettings = () => {
    const [courses, setCourses] = useState([]);
    const [mappings, setMappings] = useState({
        beginner: '',
        intermediate: '',
        advanced: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch courses
                const coursesSnap = await getDocs(collection(db, "courses"));
                const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
                setCourses(coursesData);

                // Fetch current mappings
                const settingsSnap = await getDoc(doc(db, "site_settings", "mappings"));
                if (settingsSnap.exists()) {
                    setMappings(settingsSnap.data());
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "site_settings", "mappings"), mappings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-white opacity-50">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 px-2" data-aos="fade-down">
                <div className="bg-[var(--yellow)]/10 text-[var(--yellow)] p-5 rounded-[2rem] shadow-[0_0_30px_rgba(255,193,7,0.1)]">
                    <Settings size={32} />
                </div>
                <div>
                    <h1 className="text-5xl font-black tracking-tight">System Configuration</h1>
                    <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Core Environment Mappings</p>
                </div>
            </div>

            <div className="space-y-8" data-aos="fade-up">
                {[
                    { key: 'beginner', label: 'Beginner Masterclass', color: 'text-green-400', glow: 'shadow-green-500/5' },
                    { key: 'intermediate', label: 'Intermediate Masterclass', color: 'text-orange-400', glow: 'shadow-orange-500/5' },
                    { key: 'advanced', label: 'Advanced Masterclass', color: 'text-red-400', glow: 'shadow-red-500/5' }
                ].map((item) => (
                    <div key={item.key} className={`bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl transition-all hover:border-white/20 ${item.glow}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.color.replace('text', 'bg')}`} />
                            <label className={`block font-black uppercase tracking-[0.2em] text-[10px] ${item.color}`}>
                                {item.label}
                            </label>
                        </div>
                        <div className="relative group">
                            <select
                                value={mappings[item.key] || ''}
                                onChange={(e) => setMappings({ ...mappings, [item.key]: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-[1.25rem] py-5 px-8 text-white text-sm font-bold outline-none focus:border-[var(--yellow)]/50 transition-all appearance-none cursor-pointer group-hover:bg-black/60 shadow-inner"
                            >
                                <option value="" className="bg-[#111]">Select Active Course...</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id} className="bg-[#111]">
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-white transition-colors">
                                <Settings size={16} />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] py-6 rounded-[1.5rem] hover:bg-gray-200 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50 mt-12 shadow-2xl"
                >
                    {saving ? "Processing..." : saved ? (
                        <>
                            <CheckCircle size={18} className="text-green-600" /> Environment Synced
                        </>
                    ) : (
                        <>
                            <Save size={18} /> Deploy Configuration
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SiteSettings;
