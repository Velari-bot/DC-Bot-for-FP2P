import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Plus, Save, Trash2, ChevronDown, ChevronRight, ChevronUp,
    Video, FileText, Image as ImageIcon, Layout,
    Loader2, GripVertical, CheckCircle, Edit2, ExternalLink,
    UploadCloud, Settings, Eye, EyeOff, Lock, Unlock, X, HelpCircle,
    DollarSign, Link as LinkIcon, AlertCircle, Sparkles, Download, Mic, RotateCw, AlertTriangle, FileSearch, XCircle, Globe
} from 'lucide-react';
import VideoUpload from '../Upload/VideoUpload';
import VideoPlayer from '../VideoPlayer';
import ActivityLogs from './ActivityLogs';
import { db, storage, auth } from '../../utils/firebase';

import {
    collection, addDoc, updateDoc, doc,
    getDocs, deleteDoc, getDoc
} from 'firebase/firestore';
import { useUploads } from '../../contexts/UploadContext';

const CourseEditor = ({ courseId, onBack }) => {
    // --- State ---
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [courseData, setCourseData] = useState({
        title: "", description: "", priceId: "", requiredProductId: "",
        marketingUrl: "", isPublic: false, thumbnail: "", sections: [],
        isOneTime: false, monthlyPriceId: "", yearlyPriceId: "",
        monthlyProductId: "", yearlyProductId: "",
        pricingModel: 'monthly'
    });

    // UI State
    const [expandedSections, setExpandedSections] = useState({});
    const [editingLesson, setEditingLesson] = useState(null);
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'curriculum'
    const [captionLanguageSelection, setCaptionLanguageSelection] = useState(null); // { lessonId, videoUrl, captionVideoId }
    const [captionStatuses, setCaptionStatuses] = useState({}); // { videoId: status }
    const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }
    const [batchTranscribing, setBatchTranscribing] = useState(null); // sectionId currently being batch transcribed
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, lessonTitle: '' });

    // Clear toast after 3s
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // --- Effects ---
    useEffect(() => {
        if (courseId) fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        setLoading(true);
        try {
            const docSnap = await getDoc(doc(db, "courses", courseId));
            if (docSnap.exists()) {
                const data = docSnap.data();

                // Derive pricing model if not present
                if (!data.pricingModel) {
                    if (data.isOneTime) data.pricingModel = 'one-off';
                    else if ((data.monthlyPriceId || data.priceId) && data.yearlyPriceId) data.pricingModel = 'all';
                    else if (data.yearlyPriceId) data.pricingModel = 'yearly';
                    else data.pricingModel = 'monthly';
                }

                setCourseData(data);
                if (data.sections?.length > 0) setExpandedSections({ [data.sections[0].id]: true });

                // Fetch statuses for all videos in course
                const videoIds = [];
                data.sections?.forEach(s => s.lessons?.forEach(l => {
                    if (l.captionVideoId) videoIds.push(l.captionVideoId);
                }));
                if (videoIds.length > 0) fetchCaptionStatuses(videoIds);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const dataToSave = { ...courseData, updatedAt: new Date().toISOString() };
            if (courseId) {
                await updateDoc(doc(db, "courses", courseId), dataToSave);
            } else {
                await addDoc(collection(db, "courses"), { ...dataToSave, createdAt: new Date().toISOString() });
            }
            alert("Course saved successfully!");
            if (!courseId) onBack();
        } catch (error) {
            console.error(error);
            alert("Failed to save course.");
        } finally {
            setSaving(false);
        }
    };

    // --- Logic ---
    const fetchCaptionStatuses = async (ids) => {
        const updates = {};
        for (const id of ids) {
            if (!id) continue;
            try {
                const res = await fetch(`/api/captions?action=get&videoId=${id}`);
                if (res.ok) {
                    const data = await res.json();
                    updates[id] = data.status || 'unknown';
                }
            } catch (e) {
                console.error("Failed to fetch caption status:", e);
            }
        }
        setCaptionStatuses(prev => ({ ...prev, ...updates }));
    };

    // Poll for active caption jobs - faster polling (1.5s)
    useEffect(() => {
        const activeIds = Object.entries(captionStatuses)
            .filter(([_, status]) => status && status !== 'ready' && status !== 'error')
            .map(([id]) => id);

        if (activeIds.length === 0) return;

        const timer = setTimeout(() => {
            fetchCaptionStatuses(activeIds);
        }, 1500);

        return () => clearTimeout(timer);
    }, [captionStatuses]);

    const addSection = () => {
        const newSection = { id: crypto.randomUUID(), title: "New Section", lessons: [] };
        const newSections = [...courseData.sections, newSection];
        setCourseData({ ...courseData, sections: newSections });
        setExpandedSections({ ...expandedSections, [newSection.id]: true });
    };

    const updateSectionTitle = (index, title) => {
        const newSections = [...courseData.sections];
        newSections[index].title = title;
        setCourseData({ ...courseData, sections: newSections });
    };

    const addLesson = (sIdx, type = 'video') => {
        const newSections = [...courseData.sections];
        const newLesson = {
            id: crypto.randomUUID(),
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type: type,
            videoUrl: "",
            textBody: "",
            isVisible: true,
            isFreePreview: false,
            icon: type === 'quiz' ? 'quiz' : (type === 'text' ? 'text' : (type === 'file' ? 'file' : 'video')),
            quizData: type === 'quiz' ? { questions: [{ id: crypto.randomUUID(), question: "New Question", options: ["", "", "", ""], correctIndex: 0 }] } : null
        };
        if (!newSections[sIdx].lessons) newSections[sIdx].lessons = [];
        newSections[sIdx].lessons.push(newLesson);
        setCourseData({ ...courseData, sections: newSections });
        setEditingLesson({ sIdx, lIdx: newSections[sIdx].lessons.length - 1 });
    };

    const updateLesson = (sIdx, lIdx, field, value) => {
        const newSections = [...courseData.sections];
        newSections[sIdx].lessons[lIdx][field] = value;
        if (field === 'type') {
            newSections[sIdx].lessons[lIdx].icon = value;
        }
        setCourseData({ ...courseData, sections: newSections });
    };

    const { uploads } = useUploads();
    useEffect(() => {
        if (!editingLesson) return;
        const currentLesson = courseData.sections[editingLesson.sIdx].lessons[editingLesson.lIdx];
        const completedUpload = Object.values(uploads).find(u => u.lessonId === currentLesson.id && u.status === 'completed');
        if (completedUpload && currentLesson.videoUrl !== completedUpload.url) {
            updateLesson(editingLesson.sIdx, editingLesson.lIdx, "videoUrl", completedUpload.url);
        }
    }, [uploads, editingLesson]);

    // Auto-resize textareas when editing starts, tab changes, or content changes
    useEffect(() => {
        const timer = setTimeout(() => {
            const textareas = document.querySelectorAll('textarea');
            textareas.forEach(ta => {
                ta.style.height = 'auto';
                ta.style.height = ta.scrollHeight + 'px';
            });
        }, 50);
        return () => clearTimeout(timer);
    }, [editingLesson, activeTab]);

    const uploadToR2 = async (file, folder) => {
        if (!auth.currentUser) throw new Error("User not authenticated");
        const token = await auth.currentUser.getIdToken();

        const res = await fetch('/api/upload-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                folder: folder
            })
        });

        if (!res.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, publicUrl } = await res.json();

        await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file
        });

        return publicUrl;
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const url = await uploadToR2(file, 'thumbnails');
            setCourseData({ ...courseData, thumbnail: url });
        } catch (error) {
            console.error("Thumbnail upload failed:", error);
            alert("Upload failed: " + error.message);
        }
    };

    const handleTriggerCaptions = async (lessonId, videoUrl, captionVideoId, language = 'en') => {
        if (!videoUrl) return;
        try {
            const finalVideoId = captionVideoId || crypto.randomUUID();

            // 1. Immediate UI update
            setCaptionLanguageSelection(null);
            setCaptionStatuses(prev => ({ ...prev, [finalVideoId]: 'processing' }));

            // 2. Update lesson immediately to have the new ID
            const newSections = [...courseData.sections];
            for (let s of newSections) {
                const l = s.lessons?.find(lesson => lesson.id === lessonId);
                if (l) {
                    l.captionVideoId = finalVideoId;
                    break;
                }
            }
            setCourseData({ ...courseData, sections: newSections });

            setToast({ type: 'success', message: 'Transcription Started! Watch the progress bar below.' });

            // 3. API Call
            const res = await fetch('/api/captions?action=start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId: finalVideoId,
                    videoUrl: videoUrl,
                    language: language
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.details || err.error || "Failed");
            }

            // 4. Force a status check after 1s to confirm backend caught it
            setTimeout(() => fetchCaptionStatuses([finalVideoId]), 1000);

        } catch (err) {
            console.error(err);
            setCaptionStatuses(prev => ({ ...prev, [captionVideoId]: 'error' }));
            setToast({ type: 'error', message: "Error: " + err.message });
        }
    };

    // Batch transcribe all video lessons in a course
    const handleBatchTranscribeWholeCourse = async (mode = 'en') => {
        const allVideoLessons = courseData.sections.flatMap(s => (s.lessons || []).filter(l => l.type === 'video' && l.videoUrl));

        if (allVideoLessons.length === 0) {
            setToast({ type: 'error', message: 'No video lessons with URLs found in this course.' });
            return;
        }

        const msg = mode === 'en'
            ? `Transcribe ${allVideoLessons.length} lessons (English Only - Fast/Cheap)?`
            : `Transcribe and Translate ${allVideoLessons.length} lessons to all 10 languages (Slower/Expensive)?`;

        if (!confirm(msg)) return;

        setBatchTranscribing('course_batch');
        setBatchProgress({ current: 0, total: allVideoLessons.length, lessonTitle: '' });
        setToast({ type: 'success', message: `Starting global batch for ${allVideoLessons.length} lessons...` });

        const newSections = JSON.parse(JSON.stringify(courseData.sections));

        for (let i = 0; i < allVideoLessons.length; i++) {
            const lesson = allVideoLessons[i];
            setBatchProgress({ current: i + 1, total: allVideoLessons.length, lessonTitle: lesson.title });

            try {
                const finalVideoId = lesson.captionVideoId || crypto.randomUUID();
                setCaptionStatuses(prev => ({ ...prev, [finalVideoId]: 'processing' }));

                // Update course data object
                for (let s of newSections) {
                    const l = s.lessons?.find(les => les.id === lesson.id);
                    if (l) { l.captionVideoId = finalVideoId; break; }
                }

                await fetch('/api/captions?action=start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        videoId: finalVideoId,
                        videoUrl: lesson.videoUrl,
                        language: mode // 'en' triggers the fast path we added to api/captions.js
                    })
                });

                // Small delay between queue entries
                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                console.error(`Global batch error on "${lesson.title}":`, err);
            }
        }

        setCourseData({ ...courseData, sections: newSections });
        setBatchTranscribing(null);
        setToast({ type: 'success', message: `All ${allVideoLessons.length} lessons queued for processing!` });
    };

    // Batch transcribe all video lessons in a section
    const handleBatchTranscribeSection = async (sectionIdx, mode = 'en') => {
        const section = courseData.sections[sectionIdx];
        if (!section) return;

        // Filter only video lessons that have a videoUrl
        const videoLessons = (section.lessons || []).filter(l => l.type === 'video' && l.videoUrl);
        if (videoLessons.length === 0) {
            setToast({ type: 'error', message: 'No video lessons with URLs found in this section.' });
            return;
        }

        // Confirm with user
        if (!confirm(`This will transcribe ${videoLessons.length} video lesson(s) in "${section.title}" (${mode === 'en' ? 'English Only' : 'All Languages'}). Continue?`)) {
            return;
        }

        setBatchTranscribing(section.id);
        setBatchProgress({ current: 0, total: videoLessons.length, lessonTitle: '' });
        setToast({ type: 'success', message: `Starting batch transcription for ${videoLessons.length} lessons...` });

        const newSections = [...courseData.sections];

        for (let i = 0; i < videoLessons.length; i++) {
            const lesson = videoLessons[i];
            setBatchProgress({ current: i + 1, total: videoLessons.length, lessonTitle: lesson.title });

            try {
                const finalVideoId = lesson.captionVideoId || crypto.randomUUID();

                // Update UI immediately
                setCaptionStatuses(prev => ({ ...prev, [finalVideoId]: 'processing' }));

                // Update lesson with caption ID
                for (let s of newSections) {
                    const l = s.lessons?.find(les => les.id === lesson.id);
                    if (l) {
                        l.captionVideoId = finalVideoId;
                        break;
                    }
                }
                setCourseData({ ...courseData, sections: newSections });

                const fetchOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        videoId: finalVideoId,
                        videoUrl: lesson.videoUrl,
                        language: mode
                    })
                };

                // Call API with robust retry logic
                let res = await fetch('/api/captions?action=start', fetchOptions);

                // Handle rate limiting (429) specially
                if (res.status === 429) {
                    console.warn(`Rate limited on "${lesson.title}", waiting 60s before retry...`);
                    setToast({ type: 'error', message: `Rate limited. Pausing 60s before retrying "${lesson.title}"...` });
                    await new Promise(resolve => setTimeout(resolve, 60000));
                    res = await fetch('/api/captions?action=start', fetchOptions);
                }

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.details || err.error || "Failed");
                }

                // Wait 5 seconds between requests for section batch to be safe
                if (i < videoLessons.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }

            } catch (err) {
                console.error(`Error transcribing lesson "${lesson.title}":`, err);
                setToast({ type: 'error', message: `Error on "${lesson.title}": ${err.message}` });
                // Wait 5s on error too
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        setBatchTranscribing(null);
        setBatchProgress({ current: 0, total: 0, lessonTitle: '' });
        setToast({ type: 'success', message: `Batch transcription started for ${videoLessons.length} lessons! Watch progress in each lesson.` });

        // Fetch statuses for all the videos we just started
        const allVideoIds = videoLessons.map(l => l.captionVideoId).filter(Boolean);
        if (allVideoIds.length > 0) {
            setTimeout(() => fetchCaptionStatuses(allVideoIds), 2000);
        }
    };

    const handleResumeBatchSection = async (sectionIdx) => {
        const section = courseData.sections[sectionIdx];
        if (!section) return;

        // Filter for failed lessons
        const failedLessons = (section.lessons || []).filter(l =>
            l.type === 'video' && l.videoUrl && l.captionVideoId && captionStatuses[l.captionVideoId] === 'error'
        );

        if (failedLessons.length === 0) {
            setToast({ type: 'info', message: 'No failed lessons found to resume.' });
            return;
        }

        if (!confirm(`Retry ${failedLessons.length} failed video lesson(s) in "${section.title}"?`)) {
            return;
        }

        setBatchTranscribing(section.id);
        const total = failedLessons.length;
        setBatchProgress({ current: 0, total, lessonTitle: '' });
        setToast({ type: 'success', message: `Retrying batch for ${total} failed lessons...` });

        for (let i = 0; i < failedLessons.length; i++) {
            const lesson = failedLessons[i];
            setBatchProgress({ current: i + 1, total, lessonTitle: lesson.title });

            try {
                const finalVideoId = lesson.captionVideoId;
                setCaptionStatuses(prev => ({ ...prev, [finalVideoId]: 'processing' }));

                const fetchOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        videoId: finalVideoId,
                        videoUrl: lesson.videoUrl,
                        language: 'en'
                    })
                };

                // Call API with robust retry logic
                let res = await fetch('/api/captions?action=start', fetchOptions);

                if (res.status === 429) {
                    console.warn(`Rate limited on "${lesson.title}", waiting 60s...`);
                    setToast({ type: 'error', message: `Rate limited. Pausing 60s before retrying "${lesson.title}"...` });
                    await new Promise(resolve => setTimeout(resolve, 60000));
                    res = await fetch('/api/captions?action=start', fetchOptions);
                }

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.details || err.error || "Failed");
                }

                if (i < failedLessons.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }

            } catch (err) {
                console.error(`Error retrying lesson "${lesson.title}":`, err);
                setToast({ type: 'error', message: `Error on "${lesson.title}": ${err.message}` });
            }
        }

        setBatchTranscribing(null);
        setBatchProgress({ current: 0, total: 0, lessonTitle: '' });
        setToast({ type: 'success', message: `Retry batch completed.` });

        const allVideoIds = section.lessons.map(l => l.captionVideoId).filter(Boolean);
        if (allVideoIds.length > 0) setTimeout(() => fetchCaptionStatuses(allVideoIds), 2000);
    };


    const handleAuditAndFix = async () => {
        if (!confirm("Start deep scan? This will check all 10 languages for every video and auto-repair missing ones.")) return;

        setToast({ type: 'info', message: 'Starting audit... check Logs tab.' });

        // Map ID to URL
        const videoUrlMap = {};
        const allVideoIds = [];
        courseData.sections.forEach(s => {
            s.lessons.forEach(l => {
                if (l.type === 'video' && l.captionVideoId) {
                    allVideoIds.push(l.captionVideoId);
                    videoUrlMap[l.captionVideoId] = l.videoUrl;
                }
            });
        });

        if (allVideoIds.length === 0) {
            setToast({ type: 'info', message: 'No videos to audit.' });
            return;
        }

        try {
            const res = await fetch('/api/captions?action=audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoIds: allVideoIds })
            });

            const data = await res.json();
            const incomplete = data.incompleteVideos || [];

            if (incomplete.length > 0) {
                if (confirm(`Found ${incomplete.length} incomplete videos (missing languages). Auto-fix now?`)) {
                    setToast({ type: 'success', message: `Queueing repairs for ${incomplete.length} videos...` });

                    for (const video of incomplete) {
                        const vUrl = videoUrlMap[video.videoId];
                        if (!vUrl) continue;

                        // Call start action for each
                        await fetch('/api/captions?action=start', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                videoId: video.videoId,
                                videoUrl: vUrl,
                                language: 'en'
                            })
                        });
                        // Add delay to be nice to rate limits
                        await new Promise(r => setTimeout(r, 2000));
                    }
                    setToast({ type: 'success', message: 'All repairs queued! Check Logs tab for progress.' });
                }
            } else {
                setToast({ type: 'success', message: 'Audit Passed! All videos have 100% language coverage.' });
            }
        } catch (e) {
            console.error(e);
            setToast({ type: 'error', message: 'Audit failed: ' + e.message });
        }
    };

    const handleClearQueue = async () => {
        if (!confirm("⚠️ STOP ALL JOBS?\n\nThis will clear the pending queue. Any video currently processing will finish, but no new ones will start.")) return;

        try {
            const res = await fetch('/api/captions?action=clear_queue');
            const data = await res.json();
            setToast({ type: 'success', message: data.message });
        } catch (e) {
            setToast({ type: 'error', message: "Failed to clear queue" });
        }
    };


    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
            <Loader2 className="animate-spin mb-4 text-[var(--yellow)]" size={48} />
            <p className="font-bold tracking-widest uppercase text-xs opacity-50">Initializing Editor</p>
        </div>
    );

    return (
        <div className="bg-transparent min-h-screen text-white font-['Outfit',_sans-serif] selection:bg-[var(--yellow)] selection:text-black pb-32">
            {/* Super Slim Premium Header */}
            <div className="sticky top-0 z-50 bg-[#050505]/40 backdrop-blur-3xl border-b border-white/10 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="group p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10">
                        <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={20} />
                    </button>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black tracking-tight">{courseData.title || "New Course"}</h1>
                            {!courseData.isPublic && <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-red-500/20">Draft</span>}
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{courseData.sections.length} Sections • {courseData.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} Lessons</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 mr-4">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-[var(--yellow)] text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Settings size={14} className="inline mr-2 mb-0.5" /> Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('curriculum')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'curriculum' ? 'bg-[var(--yellow)] text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Layout size={14} className="inline mr-2 mb-0.5" /> Curriculum
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'logs' ? 'bg-[var(--yellow)] text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <AlertCircle size={14} className="inline mr-2 mb-0.5" /> System Logs
                        </button>
                    </div>

                    {/* Batch Transcription Progress Indicator */}
                    {batchTranscribing && (
                        <div className="bg-[var(--yellow)]/10 border border-[var(--yellow)]/30 rounded-xl px-4 py-2 flex items-center gap-3 mr-2">
                            <Loader2 size={16} className="animate-spin text-[var(--yellow)]" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--yellow)]">
                                    Transcribing {batchProgress.current}/{batchProgress.total}
                                </p>
                                <p className="text-[9px] text-gray-400 truncate max-w-[150px]">
                                    {batchProgress.lessonTitle}
                                </p>
                            </div>
                        </div>
                    )}

                    <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 bg-white text-black font-black uppercase tracking-tighter text-sm rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Course
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'logs' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter uppercase">System Logs</h2>
                                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-2">Monitor transcriptions & errors</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleAuditAndFix}
                                        className="px-6 py-3 bg-[var(--yellow)]/10 text-[var(--yellow)] hover:bg-[var(--yellow)]/20 border border-[var(--yellow)]/20 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all"
                                    >
                                        <FileSearch size={16} /> Audit & Fix Transcriptions
                                    </button>
                                    <button
                                        onClick={handleClearQueue}
                                        className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all"
                                    >
                                        <XCircle size={16} /> Stop All Actions
                                    </button>
                                </div>
                            </div>
                            <ActivityLogs />
                        </motion.div>
                    ) : activeTab === 'settings' ? (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                        >
                            {/* Left: Metadata */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Course Title</label>
                                        <input
                                            type="text"
                                            value={courseData.title}
                                            onChange={e => setCourseData({ ...courseData, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-6 py-4 text-2xl font-black focus:border-[var(--yellow)] outline-none transition-all"
                                            placeholder="Enter an epic name..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Learning Outcomes & Description</label>
                                        <textarea
                                            value={courseData.description}
                                            onChange={e => setCourseData({ ...courseData, description: e.target.value })}
                                            onInput={e => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                            onFocus={e => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-6 py-4 text-gray-400 font-medium min-h-[192px] focus:border-[var(--yellow)] outline-none transition-all overflow-hidden leading-relaxed"
                                            placeholder="What will students master by the end of this course?"
                                        />
                                    </div>
                                </div>

                                {/* Stripe Connection Card */}
                                <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                        <DollarSign size={120} />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight">Stripe Connection</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Monetize your expertise</p>
                                        </div>
                                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 shrink-0">
                                            {['one-off', 'monthly', 'yearly', 'all'].map((m) => (
                                                <button
                                                    key={m}
                                                    onClick={() => setCourseData({ ...courseData, pricingModel: m, isOneTime: m === 'one-off' })}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${courseData.pricingModel === m ? 'bg-[var(--yellow)] text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-white'}`}
                                                >
                                                    {m.replace('-', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(courseData.pricingModel === 'one-off' || courseData.pricingModel === 'monthly' || courseData.pricingModel === 'all') && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                        {courseData.pricingModel === 'one-off' ? 'One-off Price ID' : 'Monthly Price ID'} <HelpCircle size={10} className="opacity-50" />
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={courseData.monthlyPriceId || courseData.priceId || ""}
                                                        onChange={e => setCourseData({ ...courseData, monthlyPriceId: e.target.value, priceId: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-[var(--yellow)] focus:border-[var(--yellow)] outline-none transition-all"
                                                        placeholder="price_..."
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                                                        {courseData.pricingModel === 'one-off' ? 'One-off Product ID' : 'Monthly Product ID'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={courseData.monthlyProductId || courseData.requiredProductId || ""}
                                                        onChange={e => setCourseData({ ...courseData, monthlyProductId: e.target.value, requiredProductId: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-gray-400 focus:border-white/30 outline-none transition-all"
                                                        placeholder="prod_..."
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {(courseData.pricingModel === 'yearly' || courseData.pricingModel === 'all') && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                        Yearly Price ID <HelpCircle size={10} className="opacity-50" />
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={courseData.yearlyPriceId || ""}
                                                        onChange={e => setCourseData({ ...courseData, yearlyPriceId: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-[var(--yellow)] focus:border-[var(--yellow)] outline-none transition-all"
                                                        placeholder="price_..."
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Yearly Product ID</label>
                                                    <input
                                                        type="text"
                                                        value={courseData.yearlyProductId || ""}
                                                        onChange={e => setCourseData({ ...courseData, yearlyProductId: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-gray-400 focus:border-white/30 outline-none transition-all"
                                                        placeholder="prod_..."
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                External Marketing URL <LinkIcon size={10} className="opacity-50" />
                                            </label>
                                            <input
                                                type="text"
                                                value={courseData.marketingUrl}
                                                onChange={e => setCourseData({ ...courseData, marketingUrl: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-blue-400 focus:border-blue-500/50 outline-none transition-all"
                                                placeholder="/beginner-masterclass"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                                        <AlertCircle className="text-[var(--yellow)] shrink-0 mt-0.5" size={16} />
                                        <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                                            Ensure the <span className="text-white">Price ID</span> exactly matches your Stripe Dashboard. If a user owns the <span className="text-white">Product ID</span>, they gain instant access. Use the <span className="text-white">Marketing URL</span> for social media promos.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Preview & Meta */}
                            <div className="lg:col-span-4 space-y-8">
                                {/* Thumbnail Gallery */}
                                <div className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#FACC24]">Cover Media</h3>
                                    <div className="relative group aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center hover:border-[var(--yellow)]/40 transition-all cursor-pointer">
                                        {courseData.thumbnail ? (
                                            <>
                                                <img src={courseData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                    <div className="bg-white text-black px-4 py-2 rounded-lg font-black text-xs uppercase shadow-2xl">Upload New</div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center group-hover:scale-110 transition-transform">
                                                <ImageIcon className="mx-auto mb-3 text-gray-600 group-hover:text-[var(--yellow)] transition-colors" size={32} />
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Drop Image or Click</p>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleImageUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>

                                {/* Privacy Controls */}
                                <div className="glass-card p-6 rounded-[2rem] border border-white/5 space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#FACC24]">Publishing</h3>

                                    <div
                                        onClick={() => setCourseData({ ...courseData, isPublic: !courseData.isPublic })}
                                        className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${courseData.isPublic ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            {courseData.isPublic ? <Eye className="text-green-500" /> : <EyeOff className="text-red-500" />}
                                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${courseData.isPublic ? 'bg-green-500' : 'bg-gray-700'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${courseData.isPublic ? 'translate-x-4' : ''}`} />
                                            </div>
                                        </div>
                                        <h4 className={`text-sm font-black uppercase tracking-wide ${courseData.isPublic ? 'text-green-500' : 'text-red-500'}`}>
                                            {courseData.isPublic ? 'Live on Store' : 'Archived (Draft)'}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 font-bold mt-1">
                                            {courseData.isPublic ? 'Visible to students. Sales are enabled.' : 'Hidden from everyone except admins.'}
                                        </p>
                                    </div>

                                    {courseId && (
                                        <a href={`/course/${courseId}`} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                            <ExternalLink size={14} /> Full Site Preview
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="curriculum"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-6 max-w-4xl mx-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter">Course Curriculum</h2>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Design the student journey</p>
                                </div>
                                <button
                                    onClick={addSection}
                                    className="bg-[var(--yellow)] text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(255,193,7,0.3)]"
                                >
                                    <Plus size={16} /> New Module
                                </button>
                            </div>

                            {courseData.sections.length === 0 && (
                                <div className="py-24 glass-card border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-gray-600">
                                    <div className="p-8 bg-white/5 rounded-full mb-6">
                                        <Layout size={64} className="opacity-20" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-400">Empty Curriculum</h3>
                                    <p className="text-sm font-bold opacity-50 uppercase tracking-widest mt-2">Every pro journey starts with the first module</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-6">
                                {/* Masterclass Utilities */}
                                <div className="flex flex-wrap items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] gap-4">
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Masterclass Utilities</h3>
                                        <p className="text-[10px] text-gray-500 font-medium mt-1">Global actions for the entire curriculum</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {batchTranscribing === 'course_batch' ? (
                                            <div className="flex items-center gap-4 bg-[var(--yellow)]/10 border border-[var(--yellow)]/20 px-6 py-3 rounded-2xl">
                                                <Loader2 size={16} className="animate-spin text-[var(--yellow)]" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-[var(--yellow)] uppercase tracking-[0.2em]">Queueing Lessons {batchProgress.current}/{batchProgress.total}</span>
                                                    <span className="text-[9px] text-[var(--yellow)]/60 font-medium truncate max-w-[150px]">{batchProgress.lessonTitle}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleBatchTranscribeWholeCourse('en')}
                                                    className="px-6 py-3 bg-white/5 border border-white/10 hover:border-[var(--yellow)]/50 hover:bg-[var(--yellow)]/5 rounded-2xl transition-all group flex items-center gap-3"
                                                >
                                                    <Sparkles size={16} className="text-gray-500 group-hover:text-[var(--yellow)] transition-colors" />
                                                    <div className="flex flex-col items-start leading-none">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-[var(--yellow)] transition-colors">Transcribe All (En)</span>
                                                        <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter mt-1">FAST & CHEAP</span>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => handleBatchTranscribeWholeCourse('multi')}
                                                    className="px-6 py-3 bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-2xl transition-all group flex items-center gap-3"
                                                >
                                                    <Globe size={16} className="text-gray-500 group-hover:text-purple-500 transition-colors" />
                                                    <div className="flex flex-col items-start leading-none">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-purple-500 transition-colors">Translate All (Multi)</span>
                                                        <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter mt-1">COMPREHENSIVE</span>
                                                    </div>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <Reorder.Group
                                    axis="y"
                                    values={courseData.sections}
                                    onReorder={(newOrder) => setCourseData({ ...courseData, sections: newOrder })}
                                    className="space-y-4"
                                >
                                    {courseData.sections.map((section, sIdx) => {
                                        const isExpanded = expandedSections[section.id];
                                        return (
                                            <Reorder.Item
                                                key={section.id}
                                                value={section}
                                                className="glass-card border border-white/5 rounded-[2rem] overflow-hidden group/section shadow-2xl"
                                            >
                                                <div
                                                    className={`p-6 flex items-center gap-4 select-none cursor-pointer transition-colors ${isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                                                    onClick={() => setExpandedSections(p => ({ ...p, [section.id]: !p[section.id] }))}
                                                >
                                                    <div className="p-3 bg-white/5 rounded-xl text-gray-600 group-hover/section:text-[var(--yellow)] transition-colors">
                                                        <GripVertical size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={section.title}
                                                            onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="bg-transparent text-white font-black text-xl outline-none placeholder-gray-800 w-full focus:underline decoration-[var(--yellow)] decoration-3 underline-offset-8"
                                                            placeholder="Module Title..."
                                                        />
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Module {sIdx + 1}</span>
                                                            <div className="w-1 h-1 rounded-full bg-gray-800" />
                                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{(section.lessons?.length || 0)} Lessons</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* Retry Failed Button */}
                                                        {section.lessons?.some(l => l.captionVideoId && captionStatuses[l.captionVideoId] === 'error') && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleResumeBatchSection(sIdx); }}
                                                                disabled={batchTranscribing === section.id}
                                                                className="p-3 rounded-xl transition flex items-center gap-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/50"
                                                                title="Retry failed transcriptions"
                                                            >
                                                                <RotateCw size={18} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Retry Errors</span>
                                                            </button>
                                                        )}
                                                        {/* Batch Transcribe Button */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleBatchTranscribeSection(sIdx); }}
                                                            disabled={batchTranscribing === section.id}
                                                            className={`p-3 rounded-xl transition flex items-center gap-2 ${batchTranscribing === section.id
                                                                ? 'bg-[var(--yellow)]/10 text-[var(--yellow)]'
                                                                : 'text-gray-800 hover:text-[var(--yellow)] hover:bg-[var(--yellow)]/10'
                                                                }`}
                                                            title="Transcribe all video lessons in this section"
                                                        >
                                                            {batchTranscribing === section.id ? (
                                                                <>
                                                                    <Loader2 size={18} className="animate-spin" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                                        {batchProgress.current}/{batchProgress.total}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <Mic size={18} />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (confirm("Delete entire module?")) setCourseData({ ...courseData, sections: courseData.sections.filter((_, i) => i !== sIdx) }); }}
                                                            className="p-3 text-gray-800 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <div className={`p-3 rounded-xl transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-white/10' : 'text-gray-600'}`}>
                                                            <ChevronDown size={20} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden border-t border-white/5"
                                                        >
                                                            <Reorder.Group
                                                                axis="y"
                                                                values={section.lessons || []}
                                                                onReorder={(newLessons) => {
                                                                    const newSections = [...courseData.sections];
                                                                    newSections[sIdx].lessons = newLessons || [];
                                                                    setCourseData({ ...courseData, sections: newSections });
                                                                }}
                                                                className="p-4 space-y-2 bg-black/40"
                                                            >
                                                                {(section.lessons || []).map((lesson, lIdx) => {
                                                                    const isEditing = editingLesson?.sIdx === sIdx && editingLesson?.lIdx === lIdx;

                                                                    return (
                                                                        <Reorder.Item
                                                                            key={lesson.id}
                                                                            value={lesson}
                                                                            className="group/lesson"
                                                                        >
                                                                            {isEditing ? (
                                                                                <div className="bg-[#0a0a0a] border-2 border-[var(--yellow)] rounded-3xl p-8 my-4 shadow-2xl relative z-20">
                                                                                    <div className="flex items-center justify-between mb-8">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="p-2 bg-[var(--yellow)] rounded-lg text-black">
                                                                                                <Edit2 size={16} />
                                                                                            </div>
                                                                                            <h4 className="text-sm font-black uppercase tracking-widest text-[var(--yellow)]">Lesson Configuration</h4>
                                                                                        </div>
                                                                                        <button onClick={() => setEditingLesson(null)} className="p-2 hover:bg-white/5 rounded-full transition text-gray-500 hover:text-white">
                                                                                            <X size={20} />
                                                                                        </button>
                                                                                    </div>

                                                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                                                                        {/* Edit Content */}
                                                                                        <div className="lg:col-span-8 space-y-8">
                                                                                            <div className="space-y-2">
                                                                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none ml-1">Label</label>
                                                                                                <input
                                                                                                    type="text"
                                                                                                    value={lesson.title}
                                                                                                    onChange={e => updateLesson(sIdx, lIdx, "title", e.target.value)}
                                                                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black focus:border-[var(--yellow)] outline-none transition-all"
                                                                                                    placeholder="What is this lesson called?"
                                                                                                    autoFocus
                                                                                                />
                                                                                            </div>

                                                                                            {lesson.type === 'video' && (
                                                                                                <div className="space-y-6">
                                                                                                    <div className="glass-card p-6 border border-white/5 bg-white/5 rounded-3xl">
                                                                                                        <div className="flex items-center justify-between mb-6">
                                                                                                            <span className="text-[10px] font-black text-[var(--yellow)] uppercase tracking-[0.2em]">Video Asset</span>
                                                                                                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                                                                                                {['url', 'upload'].map(src => (
                                                                                                                    <button
                                                                                                                        key={src}
                                                                                                                        onClick={() => updateLesson(sIdx, lIdx, "videoSourceType", src)}
                                                                                                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${((!lesson.videoSourceType && src === 'url') || lesson.videoSourceType === src) ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}
                                                                                                                    >
                                                                                                                        {src === 'url' ? 'External' : 'Direct Upload'}
                                                                                                                    </button>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        {lesson.videoSourceType === 'upload' && !lesson.videoUrl ? (
                                                                                                            <VideoUpload
                                                                                                                onUploadComplete={(url, videoId) => {
                                                                                                                    updateLesson(sIdx, lIdx, "videoUrl", url);
                                                                                                                    updateLesson(sIdx, lIdx, "captionVideoId", videoId);
                                                                                                                }}
                                                                                                                activeLessonId={lesson.id}
                                                                                                            />
                                                                                                        ) : (
                                                                                                            <div className="space-y-4">
                                                                                                                {lesson.videoSourceType === 'url' ? (
                                                                                                                    <div className="flex gap-2">
                                                                                                                        <div className="flex gap-2">
                                                                                                                            <input
                                                                                                                                type="text"
                                                                                                                                value={lesson.videoUrl}
                                                                                                                                onChange={e => updateLesson(sIdx, lIdx, "videoUrl", e.target.value)}
                                                                                                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-xs font-mono text-gray-400 focus:border-[var(--yellow)]/50 outline-none"
                                                                                                                                placeholder="Paste URL (YouTube / Vimeo / Cloudflare)..."
                                                                                                                            />
                                                                                                                            <button
                                                                                                                                onClick={(e) => {
                                                                                                                                    e.preventDefault();
                                                                                                                                    setCaptionLanguageSelection({
                                                                                                                                        lessonId: lesson.id,
                                                                                                                                        videoUrl: lesson.videoUrl,
                                                                                                                                        captionVideoId: lesson.captionVideoId
                                                                                                                                    });
                                                                                                                                }}
                                                                                                                                className="bg-white/5 hover:bg-white/10 px-4 rounded-xl text-[10px] font-black uppercase transition-all"
                                                                                                                                title="Generate Captions for this URL"
                                                                                                                            >
                                                                                                                                <Sparkles size={14} className="text-[var(--yellow)]" />
                                                                                                                            </button>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                ) : (
                                                                                                                    <div className="flex items-center justify-between px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                                                                                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Video Attached</span>
                                                                                                                        </div>
                                                                                                                        <div className="flex flex-col min-w-[180px]">
                                                                                                                            {lesson.captionVideoId && (() => {
                                                                                                                                const status = captionStatuses[lesson.captionVideoId];
                                                                                                                                const isProcessing = status && status !== 'ready' && status !== 'ready_incomplete' && status !== 'error';

                                                                                                                                if (status === 'ready' || status === 'ready_incomplete') {
                                                                                                                                    return (
                                                                                                                                        <div className="flex items-center justify-between mb-2">
                                                                                                                                            <div className={`flex items-center gap-2 px-3 py-1.5 ${status === 'ready' ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} border rounded-lg`}>
                                                                                                                                                {status === 'ready' ? (
                                                                                                                                                    <CheckCircle size={10} className="text-green-500" />
                                                                                                                                                ) : (
                                                                                                                                                    <AlertCircle size={10} className="text-yellow-500" />
                                                                                                                                                )}
                                                                                                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'ready' ? 'text-green-500' : 'text-yellow-500'}`}>
                                                                                                                                                    {status === 'ready' ? 'Captions Active' : 'Captions (Partial)'}
                                                                                                                                                </span>
                                                                                                                                            </div>

                                                                                                                                            <button
                                                                                                                                                onClick={(e) => {
                                                                                                                                                    e.preventDefault();
                                                                                                                                                    setCaptionLanguageSelection({
                                                                                                                                                        lessonId: lesson.id,
                                                                                                                                                        videoUrl: lesson.videoUrl,
                                                                                                                                                        captionVideoId: lesson.captionVideoId
                                                                                                                                                    });
                                                                                                                                                }}
                                                                                                                                                className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors ml-4"
                                                                                                                                            >
                                                                                                                                                Regenerate
                                                                                                                                            </button>
                                                                                                                                        </div>
                                                                                                                                    );
                                                                                                                                }

                                                                                                                                if (status === 'error') {
                                                                                                                                    return (
                                                                                                                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-2 flex items-center gap-2">
                                                                                                                                            <AlertCircle size={12} className="text-red-500" />
                                                                                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Generation Failed</span>
                                                                                                                                            <button
                                                                                                                                                onClick={() => handleTriggerCaptions(lesson.id, lesson.videoUrl, lesson.captionVideoId)}
                                                                                                                                                className="ml-auto text-[9px] underline decoration-red-500 text-red-500 hover:text-white"
                                                                                                                                            >
                                                                                                                                                Retry
                                                                                                                                            </button>
                                                                                                                                        </div>
                                                                                                                                    );
                                                                                                                                }

                                                                                                                                if (isProcessing) {
                                                                                                                                    let pct = 10;
                                                                                                                                    let label = 'Initializing...';

                                                                                                                                    if (status === 'processing') { pct = 25; label = 'Transcribing Audio...'; }
                                                                                                                                    else if (status === 'cleaning') { pct = 50; label = 'Polishing with AI...'; }
                                                                                                                                    else if (status === 'translating') { pct = 75; label = 'Translating Languages...'; }
                                                                                                                                    else if (status === 'uploading') { pct = 90; label = 'Finalizing Upload...'; }

                                                                                                                                    return (
                                                                                                                                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full mb-2">
                                                                                                                                            <div className="flex justify-between items-center mb-2">
                                                                                                                                                <div className="flex items-center gap-2">
                                                                                                                                                    <Loader2 size={10} className="animate-spin text-[var(--yellow)]" />
                                                                                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--yellow)]">{label}</span>
                                                                                                                                                </div>
                                                                                                                                                <span className="text-[9px] font-mono text-white/50">{pct}%</span>
                                                                                                                                            </div>
                                                                                                                                            <div className="h-1 bg-white/10 rounded-full overflow-hidden w-full">
                                                                                                                                                <motion.div
                                                                                                                                                    initial={{ width: 0 }}
                                                                                                                                                    animate={{ width: `${pct}%` }}
                                                                                                                                                    className="h-full bg-[var(--yellow)] shadow-[0_0_10px_rgba(250,204,36,0.5)]"
                                                                                                                                                    transition={{ type: "spring", stiffness: 50 }}
                                                                                                                                                />
                                                                                                                                            </div>
                                                                                                                                        </div>
                                                                                                                                    );
                                                                                                                                }

                                                                                                                                // No captions yet
                                                                                                                                return (
                                                                                                                                    <button
                                                                                                                                        onClick={(e) => {
                                                                                                                                            e.preventDefault();
                                                                                                                                            setCaptionLanguageSelection({
                                                                                                                                                lessonId: lesson.id,
                                                                                                                                                videoUrl: lesson.videoUrl,
                                                                                                                                                captionVideoId: lesson.captionVideoId
                                                                                                                                            });
                                                                                                                                        }}
                                                                                                                                        className="bg-white/5 hover:bg-[var(--yellow)] hover:text-black hover:scale-105 active:scale-95 border border-dashed border-white/10 hover:border-transparent rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all mb-2 flex items-center gap-2 w-max"
                                                                                                                                    >
                                                                                                                                        <Sparkles size={12} /> Generate Captions
                                                                                                                                    </button>
                                                                                                                                );
                                                                                                                            })()}

                                                                                                                            <button
                                                                                                                                onClick={() => updateLesson(sIdx, lIdx, "videoUrl", "")}
                                                                                                                                className="text-[9px] font-black text-gray-600 hover:text-red-500 uppercase tracking-widest transition-colors self-start ml-1"
                                                                                                                            >
                                                                                                                                Detach Video from Lesson
                                                                                                                            </button>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        )}

                                                                                                        {/* Thumbnail Upload Section */}
                                                                                                        <div className="mt-4 pt-4 border-t border-white/5">
                                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Video Thumbnail (Poster)</label>
                                                                                                                {lesson.videoThumbnail && (
                                                                                                                    <button
                                                                                                                        onClick={() => updateLesson(sIdx, lIdx, "videoThumbnail", "")}
                                                                                                                        className="text-[10px] text-red-500 font-bold uppercase hover:underline"
                                                                                                                    >
                                                                                                                        Remove
                                                                                                                    </button>
                                                                                                                )}
                                                                                                            </div>

                                                                                                            {!lesson.videoThumbnail ? (
                                                                                                                <div className="relative group/thumb border border-white/10 bg-black/20 rounded-xl p-3 flex items-center justify-center cursor-pointer hover:border-[var(--yellow)] hover:bg-[var(--yellow)]/5 transition-all">
                                                                                                                    <input
                                                                                                                        type="file"
                                                                                                                        accept="image/*"
                                                                                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                                                        onChange={async (e) => {
                                                                                                                            const file = e.target.files[0];
                                                                                                                            if (!file) return;
                                                                                                                            try {
                                                                                                                                // Reuse the generic uploadToR2 function we already have in this component
                                                                                                                                const url = await uploadToR2(file, 'thumbnails');
                                                                                                                                updateLesson(sIdx, lIdx, "videoThumbnail", url);
                                                                                                                            } catch (err) {
                                                                                                                                alert("Thumbnail upload failed: " + err.message);
                                                                                                                            }
                                                                                                                        }}
                                                                                                                    />
                                                                                                                    <div className="flex items-center gap-2 text-gray-500 group-hover/thumb:text-[var(--yellow)]">
                                                                                                                        <ImageIcon size={16} />
                                                                                                                        <span className="text-xs font-bold uppercase tracking-wide">Upload Post Image</span>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            ) : (
                                                                                                                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
                                                                                                                    <img src={lesson.videoThumbnail} alt="Thumbnail preview" className="w-16 h-9 object-cover rounded-lg bg-black" />
                                                                                                                    <div className="flex-1 min-w-0">
                                                                                                                        <p className="text-xs text-gray-400 truncate">Custom Thumbnail Set</p>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>

                                                                                                        {lesson.videoUrl && (
                                                                                                            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative group/preview mt-4">
                                                                                                                <VideoPlayer
                                                                                                                    url={lesson.videoUrl}
                                                                                                                    className="w-full h-full"
                                                                                                                    poster={lesson.videoThumbnail}
                                                                                                                />
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                            <div className="space-y-2">
                                                                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none ml-1">Additional Notes</label>
                                                                                                <div className="space-y-4">
                                                                                                    {(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : [])).map((block, bIdx) => (
                                                                                                        <div key={block.id || bIdx} className="group/block relative pl-8">
                                                                                                            {/* Block Controls */}
                                                                                                            <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center pt-2 opacity-50 group-hover/block:opacity-100 transition-opacity">
                                                                                                                <button
                                                                                                                    onClick={() => {
                                                                                                                        const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                        if (bIdx > 0) {
                                                                                                                            [newBlocks[bIdx], newBlocks[bIdx - 1]] = [newBlocks[bIdx - 1], newBlocks[bIdx]];
                                                                                                                            updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                        }
                                                                                                                    }}
                                                                                                                    className="p-1 hover:text-white text-gray-600 transition-colors"
                                                                                                                    disabled={bIdx === 0}
                                                                                                                >
                                                                                                                    <ChevronUp size={14} />
                                                                                                                </button>
                                                                                                                <div className="flex-1 w-px bg-white/5 my-1" />
                                                                                                                <button
                                                                                                                    onClick={() => {
                                                                                                                        const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                        const currentBlocks = lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []);
                                                                                                                        if (bIdx < currentBlocks.length - 1) {
                                                                                                                            [newBlocks[bIdx], newBlocks[bIdx + 1]] = [newBlocks[bIdx + 1], newBlocks[bIdx]];
                                                                                                                            updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                        }
                                                                                                                    }}
                                                                                                                    className="p-1 hover:text-white text-gray-600 transition-colors"
                                                                                                                >
                                                                                                                    <ChevronDown size={14} />
                                                                                                                </button>
                                                                                                            </div>

                                                                                                            {/* Render Block */}
                                                                                                            <div className="relative">
                                                                                                                {block.type === 'text' ? (
                                                                                                                    <textarea
                                                                                                                        value={block.content}
                                                                                                                        onChange={e => {
                                                                                                                            const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                            newBlocks[bIdx] = { ...newBlocks[bIdx], content: e.target.value };
                                                                                                                            updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                            if (bIdx === 0) updateLesson(sIdx, lIdx, "textBody", e.target.value);
                                                                                                                        }}
                                                                                                                        onInput={e => {
                                                                                                                            e.target.style.height = 'auto';
                                                                                                                            e.target.style.height = e.target.scrollHeight + 'px';
                                                                                                                        }}
                                                                                                                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-sm text-gray-300 focus:border-[var(--yellow)] outline-none min-h-[100px] leading-relaxed overflow-hidden"
                                                                                                                        placeholder="Add notes..."
                                                                                                                    />
                                                                                                                ) : (
                                                                                                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden relative group/img">
                                                                                                                        {block.url ? (
                                                                                                                            <>
                                                                                                                                <img src={block.url} alt="Content" className="w-full h-auto max-h-[500px] object-contain bg-black/50" />
                                                                                                                                <button
                                                                                                                                    onClick={() => {
                                                                                                                                        const newBlocks = [...(lesson.blocks || [])];
                                                                                                                                        newBlocks[bIdx] = { ...newBlocks[bIdx], url: "" };
                                                                                                                                        updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                    }}
                                                                                                                                    className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500 rounded-xl text-white opacity-0 group-hover/img:opacity-100 transition-all"
                                                                                                                                >
                                                                                                                                    <Trash2 size={16} />
                                                                                                                                </button>
                                                                                                                            </>
                                                                                                                        ) : (
                                                                                                                            <div className="p-8 text-center border-2 border-dashed border-white/10 m-4 rounded-xl relative">
                                                                                                                                <ImageIcon className="mx-auto mb-2 text-gray-600" size={24} />
                                                                                                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Upload Image</p>
                                                                                                                                <input
                                                                                                                                    type="file"
                                                                                                                                    accept="image/*"
                                                                                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                                                                    onChange={async (e) => {
                                                                                                                                        const file = e.target.files[0];
                                                                                                                                        if (!file) return;
                                                                                                                                        try {
                                                                                                                                            const url = await uploadToR2(file, `content/${courseId}/${lesson.id}`);
                                                                                                                                            const newBlocks = [...(lesson.blocks || [])];
                                                                                                                                            newBlocks[bIdx] = { ...newBlocks[bIdx], url };
                                                                                                                                            updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                        } catch (err) {
                                                                                                                                            console.error(err);
                                                                                                                                            alert("Image upload failed: " + err.message);
                                                                                                                                        }
                                                                                                                                    }}
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                )}

                                                                                                                <button
                                                                                                                    onClick={() => {
                                                                                                                        const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                        newBlocks.splice(bIdx, 1);
                                                                                                                        updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                    }}
                                                                                                                    className="absolute -right-3 top-1/2 -translate-y-1/2 translate-x-full p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover/block:opacity-100 transition-all"
                                                                                                                >
                                                                                                                    <Trash2 size={16} />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>

                                                                                                <div className="flex items-center gap-4 pt-4">
                                                                                                    <div className="h-px bg-white/5 flex-1" />
                                                                                                    <button
                                                                                                        onClick={() => {
                                                                                                            const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                            newBlocks.push({ id: crypto.randomUUID(), type: 'text', content: '' });
                                                                                                            updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                        }}
                                                                                                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--yellow)]/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all group"
                                                                                                    >
                                                                                                        <Plus size={14} className="text-gray-500 group-hover:text-[var(--yellow)]" /> Add Text
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => {
                                                                                                            const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                            newBlocks.push({ id: crypto.randomUUID(), type: 'image', url: '' });
                                                                                                            updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                        }}
                                                                                                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all group"
                                                                                                    >
                                                                                                        <ImageIcon size={14} className="text-gray-500 group-hover:text-purple-400" /> Add Image
                                                                                                    </button>
                                                                                                    <div className="h-px bg-white/5 flex-1" />
                                                                                                </div>
                                                                                            </div>


                                                                                            {lesson.type === 'text' && (
                                                                                                <div className="space-y-6">
                                                                                                    {/* Block Editor Area */}
                                                                                                    <div className="space-y-4">
                                                                                                        {(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : [])).map((block, bIdx) => (
                                                                                                            <div key={block.id || bIdx} className="group/block relative pl-8">
                                                                                                                {/* Block Controls */}
                                                                                                                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center pt-2 opacity-50 group-hover/block:opacity-100 transition-opacity">
                                                                                                                    <button
                                                                                                                        onClick={() => {
                                                                                                                            const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                            if (bIdx > 0) {
                                                                                                                                [newBlocks[bIdx], newBlocks[bIdx - 1]] = [newBlocks[bIdx - 1], newBlocks[bIdx]];
                                                                                                                                updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        className="p-1 hover:text-white text-gray-600 transition-colors"
                                                                                                                        disabled={bIdx === 0}
                                                                                                                    >
                                                                                                                        <ChevronUp size={14} />
                                                                                                                    </button>
                                                                                                                    <div className="flex-1 w-px bg-white/5 my-1" />
                                                                                                                    <button
                                                                                                                        onClick={() => {
                                                                                                                            const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                            const currentBlocks = lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []);
                                                                                                                            if (bIdx < currentBlocks.length - 1) {
                                                                                                                                [newBlocks[bIdx], newBlocks[bIdx + 1]] = [newBlocks[bIdx + 1], newBlocks[bIdx]];
                                                                                                                                updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                            }
                                                                                                                        }}
                                                                                                                        className="p-1 hover:text-white text-gray-600 transition-colors"
                                                                                                                    >
                                                                                                                        <ChevronDown size={14} />
                                                                                                                    </button>
                                                                                                                </div>

                                                                                                                {/* Render Block */}
                                                                                                                <div className="relative">
                                                                                                                    {block.type === 'text' ? (
                                                                                                                        <textarea
                                                                                                                            value={block.content}
                                                                                                                            onChange={e => {
                                                                                                                                const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                                newBlocks[bIdx] = { ...newBlocks[bIdx], content: e.target.value };
                                                                                                                                updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                // Also update textBody for legacy preview if it's the first block
                                                                                                                                if (bIdx === 0) updateLesson(sIdx, lIdx, "textBody", e.target.value);
                                                                                                                            }}
                                                                                                                            onInput={e => {
                                                                                                                                e.target.style.height = 'auto';
                                                                                                                                e.target.style.height = e.target.scrollHeight + 'px';
                                                                                                                            }}
                                                                                                                            className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-lg text-gray-300 focus:border-[var(--yellow)] outline-none min-h-[100px] leading-relaxed overflow-hidden"
                                                                                                                            placeholder="Write something awesome..."
                                                                                                                        />
                                                                                                                    ) : (
                                                                                                                        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden relative group/img">
                                                                                                                            {block.url ? (
                                                                                                                                <>
                                                                                                                                    <img src={block.url} alt="Content" className="w-full h-auto max-h-[500px] object-contain bg-black/50" />
                                                                                                                                    <button
                                                                                                                                        onClick={() => {
                                                                                                                                            const newBlocks = [...(lesson.blocks || [])];
                                                                                                                                            newBlocks[bIdx] = { ...newBlocks[bIdx], url: "" };
                                                                                                                                            updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                        }}
                                                                                                                                        className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500 rounded-xl text-white opacity-0 group-hover/img:opacity-100 transition-all"
                                                                                                                                    >
                                                                                                                                        <Trash2 size={16} />
                                                                                                                                    </button>
                                                                                                                                </>
                                                                                                                            ) : (
                                                                                                                                <div className="p-12 text-center border-2 border-dashed border-white/10 m-4 rounded-xl relative">
                                                                                                                                    <ImageIcon className="mx-auto mb-4 text-gray-600" size={32} />
                                                                                                                                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Upload Image</p>
                                                                                                                                    <input
                                                                                                                                        type="file"
                                                                                                                                        accept="image/*"
                                                                                                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                                                                        onChange={async (e) => {
                                                                                                                                            const file = e.target.files[0];
                                                                                                                                            if (!file) return;
                                                                                                                                            try {
                                                                                                                                                const url = await uploadToR2(file, `content/${courseId}/${lesson.id}`);
                                                                                                                                                const newBlocks = [...(lesson.blocks || [])];
                                                                                                                                                newBlocks[bIdx] = { ...newBlocks[bIdx], url };
                                                                                                                                                updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                            } catch (err) {
                                                                                                                                                console.error(err);
                                                                                                                                            }
                                                                                                                                        }}
                                                                                                                                    />
                                                                                                                                </div>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    )}

                                                                                                                    {/* Delete Block */}
                                                                                                                    <button
                                                                                                                        onClick={() => {
                                                                                                                            const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                            newBlocks.splice(bIdx, 1);
                                                                                                                            updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                        }}
                                                                                                                        className="absolute -right-3 top-1/2 -translate-y-1/2 translate-x-full p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover/block:opacity-100 transition-all"
                                                                                                                    >
                                                                                                                        <Trash2 size={16} />
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>

                                                                                                    {/* Add Block Actions */}
                                                                                                    <div className="flex items-center gap-4 pt-4">
                                                                                                        <div className="h-px bg-white/5 flex-1" />
                                                                                                        <button
                                                                                                            onClick={() => {
                                                                                                                const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                newBlocks.push({ id: crypto.randomUUID(), type: 'text', content: '' });
                                                                                                                updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                            }}
                                                                                                            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--yellow)]/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all group"
                                                                                                        >
                                                                                                            <Plus size={14} className="text-gray-500 group-hover:text-[var(--yellow)]" /> Add Text
                                                                                                        </button>
                                                                                                        <button
                                                                                                            onClick={() => {
                                                                                                                const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                newBlocks.push({ id: crypto.randomUUID(), type: 'image', url: '' });
                                                                                                                updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                            }}
                                                                                                            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all group"
                                                                                                        >
                                                                                                            <ImageIcon size={14} className="text-gray-500 group-hover:text-purple-400" /> Add Image
                                                                                                        </button>
                                                                                                        <div className="h-px bg-white/5 flex-1" />
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {lesson.type === 'file' && (
                                                                                                <div className="space-y-6">
                                                                                                    <div className="glass-card p-10 border border-white/5 bg-white/5 rounded-[2.5rem] text-center border-2 border-dashed">
                                                                                                        {lesson.videoUrl ? (
                                                                                                            <div className="flex items-center justify-between p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                                                                                                                <div className="flex items-center gap-4 text-left">
                                                                                                                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
                                                                                                                        <FileText size={28} />
                                                                                                                    </div>
                                                                                                                    <div>
                                                                                                                        <p className="font-black text-white text-lg leading-tight uppercase tracking-tighter">{lesson.fileName || "Material Attached"}</p>
                                                                                                                        <p className="text-[10px] text-blue-400/60 font-black uppercase tracking-widest mt-0.5 underline">Secured in Cloud Storage</p>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                                <button onClick={() => { updateLesson(sIdx, lIdx, "videoUrl", ""); updateLesson(sIdx, lIdx, "fileName", ""); }} className="p-3 text-red-500/50 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-2xl transition-all">
                                                                                                                    <Trash2 size={24} />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <div className="relative group p-10">
                                                                                                                <UploadCloud size={64} className="mx-auto text-gray-600 group-hover:text-[var(--yellow)] transition-all group-hover:scale-110 duration-500" />
                                                                                                                <h3 className="mt-4 font-black uppercase tracking-widest text-sm">Upload Resources</h3>
                                                                                                                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">PDF, ZIP, DOCX, etc.</p>
                                                                                                                <input
                                                                                                                    type="file"
                                                                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                                                    onChange={async e => {
                                                                                                                        const file = e.target.files[0];
                                                                                                                        if (!file) return;
                                                                                                                        try {
                                                                                                                            const url = await uploadToR2(file, `materials/${lesson.id}`);
                                                                                                                            updateLesson(sIdx, lIdx, "videoUrl", url);
                                                                                                                            updateLesson(sIdx, lIdx, "fileName", file.name);
                                                                                                                        } catch (err) {
                                                                                                                            console.error(err);
                                                                                                                        }
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="space-y-4">
                                                                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Notes & Instructions</label>
                                                                                                        <div className="space-y-4">
                                                                                                            {(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : [])).map((block, bIdx) => (
                                                                                                                <div key={block.id || bIdx} className="group/block relative pl-8">
                                                                                                                    {/* Block Controls */}
                                                                                                                    <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center pt-2 opacity-50 group-hover/block:opacity-100 transition-opacity">
                                                                                                                        <button
                                                                                                                            onClick={() => {
                                                                                                                                const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                                if (bIdx > 0) {
                                                                                                                                    [newBlocks[bIdx], newBlocks[bIdx - 1]] = [newBlocks[bIdx - 1], newBlocks[bIdx]];
                                                                                                                                    updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                }
                                                                                                                            }}
                                                                                                                            className="p-1 hover:text-white text-gray-600 transition-colors"
                                                                                                                            disabled={bIdx === 0}
                                                                                                                        >
                                                                                                                            <ChevronUp size={14} />
                                                                                                                        </button>
                                                                                                                        <div className="flex-1 w-px bg-white/5 my-1" />
                                                                                                                        <button
                                                                                                                            onClick={() => {
                                                                                                                                const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                                const currentBlocks = lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []);
                                                                                                                                if (bIdx < currentBlocks.length - 1) {
                                                                                                                                    [newBlocks[bIdx], newBlocks[bIdx + 1]] = [newBlocks[bIdx + 1], newBlocks[bIdx]];
                                                                                                                                    updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                }
                                                                                                                            }}
                                                                                                                            className="p-1 hover:text-white text-gray-600 transition-colors"
                                                                                                                        >
                                                                                                                            <ChevronDown size={14} />
                                                                                                                        </button>
                                                                                                                    </div>

                                                                                                                    {/* Render Block */}
                                                                                                                    <div className="relative">
                                                                                                                        {block.type === 'text' ? (
                                                                                                                            <textarea
                                                                                                                                value={block.content}
                                                                                                                                onChange={e => {
                                                                                                                                    const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                                    newBlocks[bIdx] = { ...newBlocks[bIdx], content: e.target.value };
                                                                                                                                    updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                    if (bIdx === 0) updateLesson(sIdx, lIdx, "textBody", e.target.value);
                                                                                                                                }}
                                                                                                                                onInput={e => {
                                                                                                                                    e.target.style.height = 'auto';
                                                                                                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                                                                                                }}
                                                                                                                                className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-sm text-gray-300 focus:border-[var(--yellow)] outline-none min-h-[100px] leading-relaxed overflow-hidden"
                                                                                                                                placeholder="Add instructions..."
                                                                                                                            />
                                                                                                                        ) : (
                                                                                                                            <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden relative group/img">
                                                                                                                                {block.url ? (
                                                                                                                                    <>
                                                                                                                                        <img src={block.url} alt="Content" className="w-full h-auto max-h-[500px] object-contain bg-black/50" />
                                                                                                                                        <button
                                                                                                                                            onClick={() => {
                                                                                                                                                const newBlocks = [...(lesson.blocks || [])];
                                                                                                                                                newBlocks[bIdx] = { ...newBlocks[bIdx], url: "" };
                                                                                                                                                updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                            }}
                                                                                                                                            className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500 rounded-xl text-white opacity-0 group-hover/img:opacity-100 transition-all"
                                                                                                                                        >
                                                                                                                                            <Trash2 size={16} />
                                                                                                                                        </button>
                                                                                                                                    </>
                                                                                                                                ) : (
                                                                                                                                    <div className="p-8 text-center border-2 border-dashed border-white/10 m-4 rounded-xl relative">
                                                                                                                                        <ImageIcon className="mx-auto mb-2 text-gray-600" size={24} />
                                                                                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Upload Image</p>
                                                                                                                                        <input
                                                                                                                                            type="file"
                                                                                                                                            accept="image/*"
                                                                                                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                                                                            onChange={async (e) => {
                                                                                                                                                const file = e.target.files[0];
                                                                                                                                                if (!file) return;
                                                                                                                                                try {
                                                                                                                                                    const url = await uploadToR2(file, 'course-content');
                                                                                                                                                    const newBlocks = [...(lesson.blocks || [])];
                                                                                                                                                    newBlocks[bIdx] = { ...newBlocks[bIdx], url };
                                                                                                                                                    updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                                                } catch (err) {
                                                                                                                                                    console.error(err);
                                                                                                                                                    alert("Image upload failed: " + err.message);
                                                                                                                                                }
                                                                                                                                            }}
                                                                                                                                        />
                                                                                                                                    </div>
                                                                                                                                )}
                                                                                                                            </div>
                                                                                                                        )}

                                                                                                                        <button
                                                                                                                            onClick={() => {
                                                                                                                                const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                                newBlocks.splice(bIdx, 1);
                                                                                                                                updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                            }}
                                                                                                                            className="absolute -right-3 top-1/2 -translate-y-1/2 translate-x-full p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover/block:opacity-100 transition-all"
                                                                                                                        >
                                                                                                                            <Trash2 size={16} />
                                                                                                                        </button>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>

                                                                                                        <div className="flex items-center gap-4 pt-4">
                                                                                                            <div className="h-px bg-white/5 flex-1" />
                                                                                                            <button
                                                                                                                onClick={() => {
                                                                                                                    const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                    newBlocks.push({ id: crypto.randomUUID(), type: 'text', content: '' });
                                                                                                                    updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                }}
                                                                                                                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--yellow)]/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all group"
                                                                                                            >
                                                                                                                <Plus size={14} className="text-gray-500 group-hover:text-[var(--yellow)]" /> Add Text
                                                                                                            </button>
                                                                                                            <button
                                                                                                                onClick={() => {
                                                                                                                    const newBlocks = [...(lesson.blocks || (lesson.textBody ? [{ id: 'legacy', type: 'text', content: lesson.textBody }] : []))];
                                                                                                                    newBlocks.push({ id: crypto.randomUUID(), type: 'image', url: '' });
                                                                                                                    updateLesson(sIdx, lIdx, "blocks", newBlocks);
                                                                                                                }}
                                                                                                                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all group"
                                                                                                            >
                                                                                                                <ImageIcon size={14} className="text-gray-500 group-hover:text-purple-400" /> Add Image
                                                                                                            </button>
                                                                                                            <div className="h-px bg-white/5 flex-1" />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {lesson.type === 'quiz' && (
                                                                                                <div className="space-y-6">
                                                                                                    {(lesson.quizData?.questions || []).map((q, qIdx) => (
                                                                                                        <div key={q.id} className="p-8 bg-black/40 border border-white/5 rounded-[2rem] space-y-6 relative group/q hover:border-white/20 transition-all">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover/q:text-[var(--yellow)]/30 transition-colors">Question {qIdx + 1}</span>
                                                                                                                <button onClick={() => { const qs = lesson.quizData.questions.filter((_, i) => i !== qIdx); updateLesson(sIdx, lIdx, "quizData", { ...lesson.quizData, questions: qs }); }} className="p-2 text-gray-800 hover:text-red-500 transition opacity-0 group-hover/q:opacity-100"><Trash2 size={14} /></button>
                                                                                                            </div>
                                                                                                            <input
                                                                                                                type="text"
                                                                                                                className="w-full bg-transparent border-b-2 border-white/5 py-2 text-xl font-bold focus:border-[var(--yellow)] outline-none"
                                                                                                                value={q.question}
                                                                                                                onChange={e => { const qs = [...lesson.quizData.questions]; qs[qIdx].question = e.target.value; updateLesson(sIdx, lIdx, "quizData", { ...lesson.quizData, questions: qs }); }}
                                                                                                                placeholder="Type the question..."
                                                                                                            />
                                                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                                                {q.options.map((opt, oIdx) => (
                                                                                                                    <div key={oIdx} className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${q.correctIndex === oIdx ? 'bg-green-500/10 border-green-500/40 text-green-500 shadow-[0_10px_30px_-10px_rgba(34,197,94,0.3)]' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                                                                                                        <div
                                                                                                                            onClick={() => { const qs = [...lesson.quizData.questions]; qs[qIdx].correctIndex = oIdx; updateLesson(sIdx, lIdx, "quizData", { ...lesson.quizData, questions: qs }); }}
                                                                                                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${q.correctIndex === oIdx ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-800 hover:border-gray-600'}`}
                                                                                                                        >
                                                                                                                            {q.correctIndex === oIdx && <CheckCircle size={14} className="text-white" />}
                                                                                                                        </div>
                                                                                                                        <input
                                                                                                                            type="text"
                                                                                                                            className="bg-transparent flex-1 text-sm font-black outline-none placeholder-gray-800"
                                                                                                                            value={opt}
                                                                                                                            onChange={e => { const qs = [...lesson.quizData.questions]; qs[qIdx].options[oIdx] = e.target.value; updateLesson(sIdx, lIdx, "quizData", { ...lesson.quizData, questions: qs }); }}
                                                                                                                            placeholder="Add option..."
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                    <button
                                                                                                        onClick={() => { const q = [...(lesson.quizData?.questions || [])]; q.push({ id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctIndex: 0 }); updateLesson(sIdx, lIdx, "quizData", { ...lesson.quizData, questions: q }); }}
                                                                                                        className="w-full py-6 bg-white/5 border border-white/5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/10 transition-all border-dashed border-2"
                                                                                                    >
                                                                                                        + Insert New Question
                                                                                                    </button>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>

                                                                                        {/* Edit Sidebar */}
                                                                                        <div className="lg:col-span-4 space-y-6">
                                                                                            <div className="glass-card p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-8">
                                                                                                <div className="space-y-4">
                                                                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Modal Type</label>
                                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                                        {['video', 'text', 'quiz', 'file'].map(t => (
                                                                                                            <button key={t} onClick={() => updateLesson(sIdx, lIdx, "type", t)} className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${lesson.type === t ? 'bg-[var(--yellow)] text-black border-[var(--yellow)] shadow-lg shadow-[var(--yellow)]/20' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/20'}`}>
                                                                                                                {t}
                                                                                                            </button>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="space-y-4 border-t border-white/5 pt-8">
                                                                                                    <div className="flex items-center justify-between group/toggle" onClick={() => updateLesson(sIdx, lIdx, "isVisible", !lesson.isVisible)}>
                                                                                                        <div>
                                                                                                            <h5 className="text-[10px] font-black uppercase tracking-widest group-hover/toggle:text-white transition-colors">Visible to students</h5>
                                                                                                            <p className="text-[9px] font-bold text-gray-600 uppercase mt-0.5">Control access</p>
                                                                                                        </div>
                                                                                                        <div className={`w-12 h-7 rounded-full p-1.5 transition-colors cursor-pointer ${lesson.isVisible !== false ? 'bg-green-500' : 'bg-gray-800'}`}>
                                                                                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${lesson.isVisible !== false ? 'translate-x-5' : ''}`} />
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    <div className="flex items-center justify-between group/toggle" onClick={() => updateLesson(sIdx, lIdx, "isFreePreview", !lesson.isFreePreview)}>
                                                                                                        <div>
                                                                                                            <h5 className="text-[10px] font-black uppercase tracking-widest group-hover/toggle:text-white transition-colors">Free Preview</h5>
                                                                                                            <p className="text-[9px] font-bold text-gray-600 uppercase mt-0.5">Marketing Hook</p>
                                                                                                        </div>
                                                                                                        <div className={`w-12 h-7 rounded-full p-1.5 transition-colors cursor-pointer ${lesson.isFreePreview ? 'bg-[var(--gold)]' : 'bg-gray-800'}`}>
                                                                                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${lesson.isFreePreview ? 'translate-x-5' : ''}`} />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="pt-4 flex flex-col gap-3">
                                                                                                    <button onClick={() => setEditingLesson(null)} className="w-full py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all shadow-xl active:scale-95">Accept & Close</button>
                                                                                                    <button onClick={() => { if (confirm("Delete lesson?")) setCourseData({ ...courseData, sections: courseData.sections.map((s, i) => i === sIdx ? { ...s, lessons: s.lessons.filter((_, j) => j !== lIdx) } : s) }); setEditingLesson(null); }} className="w-full py-3 text-red-500/50 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors">Terminate Lesson</button>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div
                                                                                    onClick={() => setEditingLesson({ sIdx, lIdx })}
                                                                                    className="px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group/item relative overflow-hidden"
                                                                                >
                                                                                    <div className={`w-2 h-full absolute left-0 top-0 transition-all ${lesson.isVisible === false ? 'bg-red-500/50' : (lesson.isFreePreview ? 'bg-[var(--yellow)]/30' : 'bg-transparent group-hover/item:bg-white/5')}`} />

                                                                                    <div className="flex items-center gap-4 flex-1">
                                                                                        <div className={`p-2.5 rounded-xl transition-all ${lesson.isVisible === false ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-400 group-hover/item:text-white'}`}>
                                                                                            {lesson.type === 'quiz' ? <HelpCircle size={18} /> : (lesson.type === 'text' ? <FileText size={18} /> : (lesson.type === 'file' ? <Download size={18} /> : <Video size={18} />))}
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <h4 className={`text-sm font-black transition-colors ${lesson.isVisible === false ? 'text-gray-600' : 'text-gray-300 group-hover/item:text-white'}`}>
                                                                                                {lesson.title || "Untitled Lesson"}
                                                                                            </h4>
                                                                                            <div className="flex items-center gap-3 mt-1 underline-offset-2">
                                                                                                {lesson.isFreePreview && <span className="text-[8px] bg-[var(--yellow)]/10 text-[var(--yellow)] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest border border-[var(--yellow)]/20 shadow-sm">Preview</span>}
                                                                                                {lesson.isVisible === false && <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest border border-red-500/20">Hidden</span>}
                                                                                                <span className="text-[8px] text-gray-700 font-bold uppercase tracking-[0.15em]">{lesson.type} asset</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-all scale-90 group-hover/item:scale-100">
                                                                                        <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                                                                                            <Edit2 size={14} />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </Reorder.Item>
                                                                    );
                                                                })}
                                                            </Reorder.Group>

                                                            <div className="p-4 pt-0">
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    <button onClick={() => addLesson(sIdx, 'video')} className="py-4 glass-card border-white/5 hover:border-[var(--yellow)]/30 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/5 group">
                                                                        <Video size={18} className="text-gray-700 group-hover:text-[var(--yellow)] transition-colors" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 group-hover:text-white">Video</span>
                                                                    </button>
                                                                    <button onClick={() => addLesson(sIdx, 'text')} className="py-4 glass-card border-white/5 hover:border-blue-500/30 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/5 group">
                                                                        <FileText size={18} className="text-gray-700 group-hover:text-blue-400 transition-colors" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 group-hover:text-white">Text</span>
                                                                    </button>
                                                                    <button onClick={() => addLesson(sIdx, 'quiz')} className="py-4 glass-card border-white/5 hover:border-purple-500/30 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/5 group">
                                                                        <HelpCircle size={18} className="text-gray-700 group-hover:text-purple-400 transition-colors" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 group-hover:text-white">Quiz</span>
                                                                    </button>
                                                                    <button onClick={() => addLesson(sIdx, 'file')} className="py-4 glass-card border-white/5 hover:border-green-500/30 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/5 group">
                                                                        <Download size={18} className="text-gray-700 group-hover:text-green-400 transition-colors" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 group-hover:text-white">File</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </Reorder.Item>
                                        );
                                    })}
                                </Reorder.Group>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Premium Language Selection Modal */}
            <AnimatePresence>
                {captionLanguageSelection && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setCaptionLanguageSelection(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-1 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Sparkles size={120} />
                            </div>

                            <div className="px-10 pt-10 pb-6 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-2xl font-black tracking-tight mb-2 text-white">AI Transcriber</h3>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Powered by OpenAI Whisper + GPT-4</p>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Main Action - English Only */}
                                <button
                                    onClick={() => handleTriggerCaptions(
                                        captionLanguageSelection.lessonId,
                                        captionLanguageSelection.videoUrl,
                                        captionLanguageSelection.captionVideoId,
                                        'en'
                                    )}
                                    className="w-full bg-white/5 border border-white/10 hover:border-[var(--yellow)]/50 hover:bg-[var(--yellow)]/5 p-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-left">
                                            <div className="font-black text-lg uppercase tracking-tight flex items-center gap-2 group-hover:text-[var(--yellow)] transition-colors">
                                                <Sparkles size={18} /> Transcribe (En)
                                            </div>
                                            <div className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">
                                                FAST & CHEAP • English Only
                                            </div>
                                        </div>
                                        <ChevronRight size={24} className="text-gray-500 group-hover:text-[var(--yellow)]" />
                                    </div>
                                </button>

                                {/* Secondary Action - All Languages */}
                                <button
                                    onClick={() => handleTriggerCaptions(
                                        captionLanguageSelection.lessonId,
                                        captionLanguageSelection.videoUrl,
                                        captionLanguageSelection.captionVideoId,
                                        'multi'
                                    )}
                                    className="w-full bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 p-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-left">
                                            <div className="font-black text-lg uppercase tracking-tight flex items-center gap-2 group-hover:text-purple-500 transition-colors">
                                                <Globe size={18} /> Translate (Multi)
                                            </div>
                                            <div className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">
                                                COMPREHENSIVE • 9 Languages
                                            </div>
                                        </div>
                                        <ChevronRight size={24} className="text-gray-500 group-hover:text-purple-500" />
                                    </div>
                                </button>

                                {/* Features List */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-white">Whisper Transcription</div>
                                            <div className="text-[10px] text-gray-500">Accurate English transcription with timestamps</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <CheckCircle size={16} className="text-purple-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-white">GPT-4 Grammar Polish</div>
                                            <div className="text-[10px] text-gray-500">Fixes punctuation and transcription errors</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <CheckCircle size={16} className="text-blue-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-white">9 Language Translations</div>
                                            <div className="text-[10px] text-gray-500">EN, ES, FR, DE, PT, IT, JA, KO, ZH, AR</div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-center text-white/30 font-bold uppercase tracking-widest pt-2">
                                    Processing typically takes 1-3 minutes per video
                                </p>
                            </div>

                            <div className="p-4 pt-0">
                                <button
                                    onClick={() => setCaptionLanguageSelection(null)}
                                    className="w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 bg-[#0A0A0A] border border-white/10 px-6 py-4 rounded-2xl shadow-2xl"
                    >
                        <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div>
                            <p className="text-sm font-black text-white">{toast.type === 'success' ? 'Success' : 'Error'}</p>
                            <p className="text-xs text-gray-400 font-medium">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="p-1 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default CourseEditor;
