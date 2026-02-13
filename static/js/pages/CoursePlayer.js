import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
    PlayCircle, CheckCircle, FileText, Download,
    ChevronDown, ChevronLeft, ChevronRight, Menu, X, Lock, Trash2, HelpCircle,
    Sparkles, Maximize2, Minimize2, PanelLeft, Layout, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

import { checkout } from '../api/coaching';
import useMiddleware from '../utils/useMiddleware';
import VideoPlayer from '../components/VideoPlayer';

const QuizQuestion = ({ q, qIdx }) => {
    const [selected, setSelected] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const isCorrect = selected === q.correctIndex;

    return (
        <div className="glass-card rounded-[2rem] p-8 md:p-10 transition-all hover:border-white/10 group">
            <div className="flex items-start gap-6 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-sm font-black text-gray-500 border border-white/5">
                    {qIdx + 1}
                </div>
                <h3 className="text-xl md:text-2xl font-bold pt-1 leading-tight">{q.question}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                    <button
                        key={oIdx}
                        disabled={selected !== null}
                        onClick={() => {
                            setSelected(oIdx);
                            setShowExplanation(true);
                        }}
                        className={`
                            p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group/opt
                            ${selected === null ? 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10' : ''}
                            ${selected === oIdx && isCorrect ? 'bg-green-500/10 border-green-500 text-green-500' : ''}
                            ${selected === oIdx && !isCorrect ? 'bg-red-500/10 border-red-500 text-red-500' : ''}
                            ${selected !== null && oIdx === q.correctIndex && !isCorrect ? 'border-green-500/50 text-green-500/50' : ''}
                            ${selected !== null && selected !== oIdx && oIdx !== q.correctIndex ? 'opacity-30' : ''}
                        `}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`
                                w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors
                                ${selected === oIdx ? (isCorrect ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500') : 'border-white/10 group-hover/opt:border-white/30'}
                            `}>
                                {selected === oIdx && (isCorrect ? <CheckCircle size={14} className="text-white" /> : <X size={14} className="text-white" />)}
                            </div>
                            <span className="font-bold text-sm md:text-base">{opt}</span>
                        </div>
                    </button>
                ))}
            </div>

            {showExplanation && q.explanation && (
                <div className="mt-8 p-6 rounded-2xl bg-white/5 border-l-4 border-white/10 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Explanation</p>
                    <p className="text-gray-300 leading-relaxed font-medium">{q.explanation}</p>
                </div>
            )}
        </div>
    );
};

const CoursePlayer = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [activeLesson, setActiveLesson] = useState(null);
    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const auth = getAuth();
    const useM = useMiddleware();

    const [isAdmin, setIsAdmin] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});

    const getLessonIcon = (iconName, type, isCompleted, isLocked) => {
        if (isLocked) return <Lock size={16} className="text-gray-600" />;
        const color = 'text-gray-600';

        // Use type for the primary icon decision
        if (type === 'quiz' || iconName === 'quiz') return <HelpCircle size={16} className={color} />;
        if (type === 'text' || iconName === 'text') return <FileText size={16} className={color} />;
        if (type === 'file' || iconName === 'file') return <Download size={16} className={color} />;
        return <PlayCircle size={16} className={color} />;
    };

    const [playbackPosition, setPlaybackPosition] = useState(0);
    const currentTimeRef = React.useRef(0);
    const playerRef = React.useRef(null);
    const splitContainerRef = React.useRef(null);

    const isCompleted = activeLesson ? progress.includes(activeLesson.id) : false;

    // theater mode states
    const [theaterMode, setTheaterMode] = useState(false);
    const [notesWidth, setNotesWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const theaterContainerRef = React.useRef(null);
    const theaterFullscreenRef = React.useRef(false); // Track if theater mode initiated fullscreen

    // Toggle fullscreen for theater mode
    const toggleTheaterMode = React.useCallback(async () => {
        if (!theaterMode) {
            // Enter theater mode + fullscreen
            setTheaterMode(true);
            theaterFullscreenRef.current = true; // Mark that theater initiated fullscreen
            try {
                // Give time for the theater container to render
                setTimeout(async () => {
                    if (theaterContainerRef.current && document.fullscreenEnabled) {
                        await theaterContainerRef.current.requestFullscreen();
                    } else if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                    }
                }, 50);
            } catch (err) {
                console.warn('Fullscreen not supported:', err);
                theaterFullscreenRef.current = false;
            }
        } else {
            // Exit theater mode + fullscreen
            setTheaterMode(false);
            theaterFullscreenRef.current = false;
            if (document.fullscreenElement) {
                try {
                    await document.exitFullscreen();
                } catch (err) {
                    console.warn('Error exiting fullscreen:', err);
                }
            }
        }
    }, [theaterMode]);

    // Listen for fullscreen exit (ESC key or browser controls)
    // Only exit theater mode if the theater container itself was fullscreened and is now exiting
    React.useEffect(() => {
        const handleFullscreenChange = () => {
            const currentFullscreenElement = document.fullscreenElement;

            // If something is fullscreen
            if (currentFullscreenElement) {
                // If it's NOT the theater container (meaning video player took over)
                // Clear the theater fullscreen ref so exiting video fullscreen won't exit theater
                if (theaterContainerRef.current && currentFullscreenElement !== theaterContainerRef.current) {
                    theaterFullscreenRef.current = false;
                }
            } else {
                // Nothing is fullscreen anymore
                // Only exit theater mode if theater was the one that initiated fullscreen
                if (theaterMode && theaterFullscreenRef.current) {
                    setTheaterMode(false);
                    theaterFullscreenRef.current = false;
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [theaterMode]);

    const startResizing = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = (e) => {
        if (isResizing && splitContainerRef.current) {
            const rect = splitContainerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            // Limit limits (between 250px and 70% of screen)
            if (newWidth > 250 && newWidth < rect.width * 0.75) {
                setNotesWidth(newWidth);
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing]);
    const savePlaybackProgress = async ({ playedSeconds }) => {
        if (!auth.currentUser || !activeLesson) return;

        try {
            const userRef = doc(db, "users", auth.currentUser.uid, "course_progress", courseId);
            await setDoc(userRef, {
                lessonProgress: {
                    [activeLesson.id]: playedSeconds
                },
                lastWatched: activeLesson.id,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving progress:", error);
        }
    };

    const handlePlayerReady = async () => {
        if (!auth.currentUser || !activeLesson || !playerRef.current) return;

        try {
            const userRef = doc(db, "users", auth.currentUser.uid, "course_progress", courseId);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const savedTime = data.lessonProgress?.[activeLesson.id] || 0;
                if (savedTime > 0) {
                    playerRef.current.seekTo(savedTime);
                }
            }
        } catch (error) {
            console.error("Error retrieving progress:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, fetch data directly here or call helper
                // Let's keep the logic inline as it was, but use 'user' instead of auth.currentUser
                const currentUser = user;
                // We will use 'user' variable in the code below where auth.currentUser was used.
                // But wait, the code below uses auth.currentUser in line 49.
                // We need to be careful. Let's just set the user context.



                try {
                    // 1. Fetch Course Data
                    const courseRef = doc(db, "courses", courseId);
                    const courseSnap = await getDoc(courseRef);

                    if (courseSnap.exists()) {
                        const data = courseSnap.data();
                        setCourse(data);

                        const ADMIN_EMAILS = ["benderaden826@gmail.com", "bender.adrian@gmail.com", "flamefrags@gmail.com", "benderaiden826@gmail.com"];
                        const adminStatus = ADMIN_EMAILS.includes(currentUser.email);
                        setIsAdmin(adminStatus);

                        // 2. Fetch User Progress & Purchase Verification
                        const userRef = doc(db, "users", currentUser.uid);

                        // Fetch payments
                        const paymentsRef = collection(userRef, "payments");
                        const paymentsSnap = await getDocs(paymentsRef);
                        const payments = paymentsSnap.docs.map(d => d.data());

                        const purchasedStatus = payments.some(p => {
                            const pId = String(p.productId || "").toLowerCase();
                            const pItem = String(p.item || "").toLowerCase();
                            const cTitle = String(data.title || "").toLowerCase();
                            const cReqId = String(data.requiredProductId || "").toLowerCase();
                            const cId = String(courseId || "").toLowerCase();

                            const isMatch = (
                                (cReqId && (pId === cReqId || p.requiredProductId === cReqId || pItem.includes(cReqId))) ||
                                (pId === cId) ||
                                (pItem === cTitle) ||
                                (pItem.startsWith(cTitle))
                            );

                            if (isMatch) {
                                // Check for expiration (e.g. temporary grants)
                                if (p.expiresAt) {
                                    const expiry = new Date(p.expiresAt);
                                    if (expiry < new Date()) return false; // Access expired
                                }
                                return true;
                            }
                            return false;
                        });
                        setHasPurchased(purchasedStatus);

                        // If not purchased and not admin, we ONLY allow entry if there's at least one free preview lesson.
                        const hasFreePreview = data.sections?.some(s => s.lessons?.some(l => l.isFreePreview));

                        if (!purchasedStatus && !adminStatus && !hasFreePreview) {
                            // Instead of alert/redirect, we allow them to stay but they'll see the purchase CTA
                            // unless they don't even have a marketing URL, then we keep the safety redirect
                            if (!data.marketingUrl && !data.priceId) {
                                alert("You have not purchased this course.");
                                window.location.href = "/claim";
                                return;
                            }
                        }

                        const progressRef = doc(userRef, "course_progress", courseId);
                        const progressSnap = await getDoc(progressRef);
                        const completed = progressSnap.exists() ? progressSnap.data().completedLessons || [] : [];
                        setProgress(completed);

                        // Set initial active lesson
                        const firstSection = data.sections?.find(s => s.lessons?.some(l => (l.isVisible !== false || adminStatus) && (l.isFreePreview || purchasedStatus || adminStatus)));
                        const firstLesson = firstSection?.lessons?.find(l => (l.isVisible !== false || adminStatus) && (l.isFreePreview || purchasedStatus || adminStatus));

                        if (firstLesson) {
                            setActiveLesson({
                                sIdx: data.sections.indexOf(firstSection),
                                lIdx: firstSection.lessons.indexOf(firstLesson),
                                ...firstLesson
                            });
                            setExpandedSections({ [firstSection.id]: true });
                        }
                    } else {
                        console.error("Course not found");
                    }

                } catch (error) {
                    console.error("Error loading course:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                window.location.href = '/claim';
            }
        });

        return () => unsubscribe();
    }, [courseId, auth.currentUser]);



    const handleLessonSelect = (sIdx, lIdx, lesson) => {
        const isLocked = !hasPurchased && !isAdmin && !lesson.isFreePreview;
        setActiveLesson({ sIdx, lIdx, ...lesson, isLocked });

        // Reset playback position for new lesson
        currentTimeRef.current = 0;

        // Auto-expand section on selection
        setExpandedSections(prev => ({ ...prev, [course.sections[sIdx].id]: true }));
        // On mobile, close sidebar after selection
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handlePurchase = async () => {
        if (!auth.currentUser) return navigate('/claim');

        try {
            const token = await auth.currentUser.getIdToken();
            const mw = useMiddleware(token);
            const res = await checkout(mw, false, auth.currentUser.email, courseId);
            if (res.checkoutUrl) {
                window.location.href = res.checkoutUrl;
            } else {
                alert(res.message || "Checkout failed to initialize.");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong.");
        }
    };

    const goToNextLesson = () => {
        if (!activeLesson) return;

        let nextSIdx = activeLesson.sIdx;
        let nextLIdx = activeLesson.lIdx + 1;

        // Try to find the next valid lesson
        while (nextSIdx < course.sections.length) {
            const currentSection = course.sections[nextSIdx];

            while (nextLIdx < currentSection.lessons.length) {
                const lesson = currentSection.lessons[nextLIdx];
                const isVisible = lesson.isVisible !== false || isAdmin;
                const isAccessible = lesson.isFreePreview || hasPurchased || isAdmin;

                if (isVisible && isAccessible) {
                    handleLessonSelect(nextSIdx, nextLIdx, lesson);
                    return;
                }
                nextLIdx++;
            }

            // Move to next section
            nextSIdx++;
            nextLIdx = 0;
        }
    };


    const markAsComplete = async () => {
        if (!activeLesson || !auth.currentUser) return;

        const lessonId = activeLesson.id;
        if (!progress.includes(lessonId)) {
            // Optimistic update
            const newProgress = [...progress, lessonId];
            setProgress(newProgress);

            // Confetti effect
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Persist to Firestore
            try {
                const userRef = doc(db, "users", auth.currentUser.uid, "course_progress", courseId);
                await setDoc(userRef, {
                    completedLessons: arrayUnion(lessonId)
                }, { merge: true });
            } catch (err) {
                console.error("Failed to save progress", err);
            }
        }

        // Auto-advance logic could go here
    };

    const handleDeleteCourse = async () => {
        if (!window.confirm("Are you sure you want to delete this course? This implies the ENTIRE course.")) return;

        try {
            await deleteDoc(doc(db, "courses", courseId));
            alert("Course deleted successfully");
            navigate('/admin');
        } catch (e) {
            console.error(e);
            alert("Error deleting course");
        }
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) return <div className="bg-[#111] min-h-screen flex items-center justify-center text-white">Loading Course...</div>;
    if (!course) return <div className="bg-[#111] min-h-screen flex items-center justify-center text-white">Course Not Found</div>;

    // Sub-component for the Curriculum List to avoid duplication
    const CurriculumList = ({ className = "" }) => (
        <div className={`flex flex-col ${className}`}>
            {course.sections.map((section, sIdx) => {
                const isExpanded = expandedSections[section.id];
                return (
                    <div key={section.id} className="mb-2">
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex justify-between items-center group hover:bg-white/[0.02] transition-colors"
                        >
                            <span className="truncate pr-4">{section.title}</span>
                            <ChevronDown size={12} className={`shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                        </button>
                        <div className={`px-2 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            {section.lessons.map((lesson, lIdx) => {
                                if (lesson.isVisible === false && !isAdmin) return null;

                                const isActive = activeLesson?.id === lesson.id;
                                const progressStatus = progress.includes(lesson.id);
                                const lessonLocked = !hasPurchased && !isAdmin && !lesson.isFreePreview;

                                return (
                                    <button
                                        key={lesson.id}
                                        onClick={() => handleLessonSelect(sIdx, lIdx, lesson)}
                                        className={`w-full px-5 py-3 flex items-start gap-4 text-sm transition-all rounded-xl mb-1 group relative overflow-hidden
                                            ${isActive
                                                ? 'bg-white/[0.03] text-[var(--yellow)] shadow-2xl'
                                                : 'hover:bg-white/[0.02] text-gray-400 hover:text-gray-200'}
                                            ${lessonLocked ? 'opacity-30 cursor-not-allowed grayscale' : ''}
                                        `}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--yellow)] rounded-r-full shadow-[0_0_15px_rgba(255,193,7,0.5)]" />
                                        )}
                                        <div className="mt-0.5 shrink-0 transition-transform group-hover:scale-110">
                                            {getLessonIcon(lesson.icon, lesson.type, progressStatus, lessonLocked)}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className={`line-clamp-2 leading-snug tracking-tight font-medium ${isActive ? 'font-black text-white' : ''}`}>{lesson.title}</span>
                                                {progressStatus && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {lesson.isVisible === false && <span className="text-[7px] bg-red-500/10 text-red-500 px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-red-500/10">Draft</span>}
                                                {lessonLocked && <span className="text-[7px] bg-white/5 text-gray-600 px-1 py-0.5 rounded font-black uppercase tracking-tighter">Locked</span>}
                                                {!lessonLocked && lesson.isFreePreview && !hasPurchased && <span className="text-[7px] bg-green-500/10 text-green-400 px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-green-500/10">Preview</span>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="h-screen w-full bg-[#050505] text-white overflow-hidden font-['Outfit',_sans-serif] selection:bg-[var(--yellow)] selection:text-black flex flex-col">
            <style>
                {`
                    @keyframes mesh-pulse {
                        0% { transform: translate(0, 0) scale(1); }
                        50% { transform: translate(-5%, 5%) scale(1.05); }
                        100% { transform: translate(0, 0) scale(1); }
                    }
                    .mesh-bg {
                        position: absolute;
                        inset: 0;
                        background: radial-gradient(circle at 20% 30%, rgba(255, 193, 7, 0.08) 0%, transparent 50%),
                                    radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
                                    radial-gradient(circle at 40% 80%, rgba(147, 51, 234, 0.06) 0%, transparent 50%);
                        filter: blur(100px);
                        opacity: 0.8;
                        pointer-events: none;
                        animation: mesh-pulse 20s ease-in-out infinite;
                    }
                    .glass-sidebar {
                        background: rgba(255, 255, 255, 0.01);
                        backdrop-filter: blur(50px);
                        border-right: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    .glass-card {
                        background: rgba(255, 255, 255, 0.02);
                        backdrop-filter: blur(30px);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: var(--yellow);
                    }
                    @media (max-width: 768px) {
                        .player-content-scroll {
                            overflow-y: auto !important;
                            height: auto !important;
                            flex: 1;
                        }
                    }
                `}
            </style>

            {/* Navbar Spacer - Only on Desktop since NavBar is hidden on mobile player */}
            {!isMobile && <div className="h-[145px]" />}

            {/* Immersive Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-[var(--yellow)]/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[100px]"></div>
                <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Desktop Sidebar (Left) */}
                <motion.div
                    initial={false}
                    animate={{
                        width: sidebarOpen ? (isMobile ? '100%' : 320) : 0,
                        opacity: sidebarOpen ? 1 : 0,
                        x: sidebarOpen ? 0 : (isMobile ? '100%' : -20)
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`${isMobile ? 'fixed inset-0 z-[100] bg-[#050505]/98 backdrop-blur-3xl' : 'hidden md:block glass-sidebar'} overflow-hidden`}
                >
                    <div className="h-full flex flex-col relative z-20">
                        {/* Sidebar Header */}
                        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                            <div className="flex items-center justify-between mb-8">
                                {isMobile ? (
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate('/claim')}
                                        className="group flex items-center gap-2 text-gray-500 hover:text-[var(--yellow)] transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                                    >
                                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                        Back to Dashboard
                                    </button>
                                )}
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={handleDeleteCourse}
                                    className="w-full mb-6 py-3 border border-red-500/10 bg-red-500/5 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg"
                                >
                                    <Trash2 size={14} />
                                    Delete Course
                                </button>
                            )}
                            <h2 className="font-black text-2xl text-white tracking-tight leading-tight transition-colors">
                                {course.title}
                            </h2>
                        </div>

                        {/* Progress Card */}
                        <div className="px-6 py-4">
                            <div className="glass-card rounded-2xl p-4 shadow-2xl">
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <span className="text-2xl font-black text-white">{Math.round((progress.length / Math.max(course.sections.reduce((acc, s) => acc + s.lessons.length, 0), 1)) * 100)}%</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-black ml-2 tracking-tighter">Completed</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold">{progress.length} / {course.sections.reduce((acc, s) => acc + s.lessons.length, 0)}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[var(--yellow)] to-yellow-500 shadow-[0_0_10px_rgba(255,193,7,0.3)] transition-all duration-1000 ease-out"
                                        style={{ width: `${(progress.length / Math.max(course.sections.reduce((acc, s) => acc + s.lessons.length, 0), 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Curriculum List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-10">
                            <CurriculumList />
                        </div>
                    </div>
                </motion.div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Ambient Glows */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse"></div>
                        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px]"></div>
                    </div>

                    {/* Mobile Player View Controls (Simplified Header) */}
                    {isMobile && !theaterMode && (
                        <div className="glass-sidebar p-3 flex items-center justify-between sticky top-0 z-50">
                            <button onClick={() => navigate('/claim')} className="text-gray-400 p-1">
                                <ChevronLeft size={24} />
                            </button>
                            <span className="font-black text-[10px] uppercase tracking-widest text-[var(--yellow)] truncate max-w-[200px]">{course.title}</span>
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className={`p-1 transition-colors ${sidebarOpen ? 'text-[var(--yellow)]' : 'text-gray-400'}`}
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    )}

                    {/* Desktop Header */}
                    {!theaterMode && !isMobile && (
                        <div className="hidden md:flex items-center justify-between px-10 py-6 border-b border-white/5 bg-[#050505]/40 backdrop-blur-3xl sticky top-0 z-20">
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] overflow-hidden">
                                <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>Products</span>
                                <ChevronRight size={12} className="opacity-30 shrink-0" />
                                <span className="truncate hover:text-white transition-colors cursor-default" title={course.title}>{course.title}</span>
                                {activeLesson && (
                                    <>
                                        <ChevronRight size={12} className="opacity-30 shrink-0" />
                                        <span className="truncate text-gray-400 group-hover:text-white transition-colors">{course.sections[activeLesson.sIdx].title}</span>
                                        <ChevronRight size={12} className="opacity-30 shrink-0" />
                                        <span className="text-white truncate font-black tracking-[0.1em]">{activeLesson.title}</span>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className={`p-3 rounded-2xl transition-all active:scale-95 border group ${sidebarOpen ? 'bg-white/5 border-white/10 text-[var(--yellow)] shadow-[0_0_20px_rgba(250,204,36,0.1)]' : 'bg-[var(--yellow)] text-black border-transparent hover:scale-110 shadow-[0_10px_30px_-5px_rgba(250,204,36,0.3)]'}`}
                                    title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                                >
                                    {sidebarOpen ? <PanelLeftClose size={20} className="group-hover:scale-110 transition-transform" /> : <PanelLeftOpen size={20} className="group-hover:scale-110 transition-transform" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <div ref={splitContainerRef} className={`flex-1 relative z-10 overflow-hidden ${theaterMode ? 'flex overflow-hidden' : 'player-content-scroll overflow-y-auto p-0 md:p-12 custom-scrollbar'}`}>

                        {theaterMode && activeLesson?.type === 'video' ? (
                            <div ref={theaterContainerRef} className="flex w-full h-full animate-in fade-in duration-500 bg-black">
                                {/* Video Area (LEFT) */}
                                <div className="flex-1 bg-black flex flex-col relative">
                                    <div className="flex-1 flex items-center justify-center p-4 pt-20">
                                        <div className="w-full h-full max-h-[80vh] aspect-video shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] rounded-2xl overflow-hidden border border-white/10 relative z-10">
                                            <VideoPlayer
                                                key={activeLesson.id}
                                                url={activeLesson.videoUrl}
                                                poster={activeLesson.videoThumbnail || activeLesson.thumbnail}
                                                className="w-full h-full"
                                                captionVideoId={activeLesson.captionVideoId}
                                                onToggleTheater={toggleTheaterMode}
                                                theaterMode={true}
                                                hasNotes={true}
                                                startTime={currentTimeRef.current}
                                                onProgress={(t) => { currentTimeRef.current = t; }}
                                                courseId={courseId}
                                                lessonId={activeLesson.id}
                                                lessonTitle={activeLesson.title}
                                            />
                                        </div>
                                    </div>

                                    {/* Mini Header Overlay for Video - Top Left */}
                                    <div className="absolute top-6 left-6 px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl flex items-center gap-4 z-20 shadow-2xl">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Currently Playing</span>
                                            <span className="text-xs font-bold text-white whitespace-nowrap max-w-[200px] truncate">{activeLesson.title}</span>
                                        </div>
                                        <div className="h-4 w-px bg-white/10" />
                                        <button
                                            onClick={markAsComplete}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCompleted ? 'bg-green-500/10 text-green-500' : 'bg-white text-black hover:bg-gray-200'}`}
                                        >
                                            {isCompleted ? 'Completed' : 'Finish Lesson'}
                                        </button>
                                    </div>

                                    {/* Gradient Accent */}
                                    <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                                        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--yellow)]/5 rounded-full blur-[150px]" />
                                    </div>
                                </div>

                                {/* Drag Handle */}
                                <div
                                    className={`w-1 h-full cursor-col-resize hover:bg-[var(--yellow)]/50 transition-colors z-30 ${isResizing ? 'bg-[var(--yellow)]' : 'bg-white/5'}`}
                                    onMouseDown={startResizing}
                                />

                                {/* Resizable Notes Panel (RIGHT) */}
                                <div
                                    style={{ width: notesWidth }}
                                    className="h-full bg-[#050505] backdrop-blur-3xl border-l border-white/5 flex flex-col relative z-20"
                                >
                                    <div className="p-8 border-b border-white/5 shrink-0 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="px-3 py-1 rounded-full bg-[var(--yellow)]/10 border border-[var(--yellow)]/20 text-[var(--yellow)] text-[8px] font-black uppercase tracking-widest">
                                                    Lesson Notes
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-black text-white leading-tight tracking-tight">
                                                {activeLesson.title}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={toggleTheaterMode}
                                            className="p-3 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl transition-all"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                        <div className="prose prose-invert max-w-none prose-p:text-gray-400 prose-p:leading-relaxed prose-strong:text-white prose-headings:text-white relative">
                                            {activeLesson.blocks ? (
                                                <div className="space-y-12">
                                                    {activeLesson.blocks.map((block, idx) => (
                                                        <div key={idx}>
                                                            {block.type === 'text' && (
                                                                <div className="whitespace-pre-wrap text-base text-gray-300 font-medium leading-relaxed">
                                                                    {block.content}
                                                                </div>
                                                            )}
                                                            {block.type === 'image' && block.url && (
                                                                <div className="rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl my-8">
                                                                    <img
                                                                        src={block.url}
                                                                        alt="Content"
                                                                        className="w-full h-auto"
                                                                        loading="lazy"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap text-base text-gray-300 font-medium leading-relaxed">
                                                    {activeLesson.textBody}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-7xl mx-auto">
                                {activeLesson ? (() => {
                                    if (activeLesson.isLocked) {
                                        return (
                                            <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-700">
                                                <div className="glass-card rounded-[3rem] p-10 md:p-20 text-center max-w-3xl border border-white/5 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                                        <Lock size={200} />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="w-20 h-20 rounded-[2rem] bg-[var(--yellow)]/10 flex items-center justify-center text-[var(--yellow)] mx-auto mb-8 shadow-inner">
                                                            <Lock size={40} />
                                                        </div>
                                                        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Level Up Your Game</h2>
                                                        <p className="text-xl text-gray-400 font-medium mb-12 leading-relaxed max-w-xl mx-auto">
                                                            This premium lesson is part of the <span className="text-white font-black">{course.title}</span>. Join hundreds of pros who have already mastered these techniques.
                                                        </p>

                                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                                            <button
                                                                onClick={handlePurchase}
                                                                className="px-12 py-5 bg-[var(--yellow)] text-black font-black rounded-2xl hover:bg-yellow-400 transition-all hover:scale-105 hover:shadow-[0_20px_40px_-10px_rgba(255,193,7,0.4)] flex items-center justify-center gap-3 w-full sm:w-auto"
                                                            >
                                                                <Sparkles size={20} />
                                                                Get Instant Access
                                                            </button>
                                                            {course.marketingUrl && (
                                                                <a
                                                                    href={course.marketingUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-8 py-5 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/5 w-full sm:w-auto"
                                                                >
                                                                    View Course page
                                                                </a>
                                                            )}
                                                        </div>

                                                        <div className="mt-12 flex items-center justify-center gap-8 grayscale opacity-20">
                                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white" /> <span className="text-[10px] font-black uppercase tracking-widest">Expert Coaching</span></div>
                                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white" /> <span className="text-[10px] font-black uppercase tracking-widest">Discord Support</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${isMobile ? '-mx-0' : ''}`}>
                                            <div className={`flex flex-col lg:flex-row items-start ${isMobile ? 'gap-0' : 'gap-12'}`}>
                                                {/* Main Content: Video & Info */}
                                                <div className="flex-1 w-full">
                                                    {/* Header (Only for videos) */}
                                                    {activeLesson.type === 'video' && (
                                                        <div className={`${isMobile ? 'px-6 py-6 pb-2' : 'space-y-4 mb-12'}`}>
                                                            <div className="flex items-center gap-4">
                                                                <div className="px-4 py-1.5 rounded-full bg-[var(--yellow)]/10 border border-[var(--yellow)]/20 text-[var(--yellow)] text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-yellow-500/5">
                                                                    {course.sections[activeLesson.sIdx].title}
                                                                </div>
                                                                <div className="text-gray-600 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                                                                    Lesson {activeLesson.lIdx + 1} of {course.sections[activeLesson.sIdx].lessons.length}
                                                                </div>
                                                            </div>
                                                            <h1 className={`${isMobile ? 'text-2xl mt-4' : 'text-5xl md:text-7xl'} font-black text-white tracking-tighter mb-4 leading-[0.95] drop-shadow-2xl`}>
                                                                {activeLesson.title}
                                                            </h1>
                                                        </div>
                                                    )}

                                                    {/* Video Player (Standard View) */}
                                                    {activeLesson.type === 'video' && activeLesson.videoUrl && (
                                                        <div className={`aspect-video bg-black overflow-hidden relative z-20 group/player ${isMobile ? 'w-full' : 'rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 transition-transform hover:scale-[1.01] duration-500 mb-12'}`}>
                                                            <VideoPlayer
                                                                key={activeLesson.id}
                                                                url={activeLesson.videoUrl}
                                                                poster={activeLesson.videoThumbnail || activeLesson.thumbnail}
                                                                className="w-full h-full"
                                                                captionVideoId={activeLesson.captionVideoId}
                                                                onToggleTheater={toggleTheaterMode}
                                                                theaterMode={theaterMode}
                                                                hasNotes={activeLesson.textBody || (activeLesson.blocks && activeLesson.blocks.length > 0)}
                                                                startTime={currentTimeRef.current}
                                                                onProgress={(t) => { currentTimeRef.current = t; }}
                                                                courseId={courseId}
                                                                lessonId={activeLesson.id}
                                                                lessonTitle={activeLesson.title}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Mobile Quick Actions */}
                                                    {isMobile && (
                                                        <div className="px-6 py-6 flex flex-col gap-3">
                                                            <button
                                                                onClick={markAsComplete}
                                                                disabled={isCompleted && !isAdmin}
                                                                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center justify-center gap-2
                                                                    ${progress.includes(activeLesson.id)
                                                                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                                        : 'bg-white text-black'}
                                                                `}
                                                            >
                                                                {progress.includes(activeLesson.id) ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-black rounded-full" />}
                                                                {progress.includes(activeLesson.id) ? 'COMPLETED' : 'MARK COMPLETE'}
                                                            </button>
                                                            <button
                                                                onClick={goToNextLesson}
                                                                className="w-full py-4 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2"
                                                            >
                                                                NEXT LESSON <ChevronRight size={14} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Reading Document View */}
                                                    {activeLesson.type === 'text' && (
                                                        <div className={`glass-card shadow-2xl relative overflow-hidden group min-h-[400px] ${isMobile ? 'm-4 rounded-[1.5rem] p-6' : 'rounded-[2.5rem] p-10 md:p-16 mb-12'}`}>
                                                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                                                <FileText size={200} />
                                                            </div>
                                                            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                                        <FileText size={16} />
                                                                    </div>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/60">Reading Material</span>
                                                                </div>
                                                                <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'} font-black mb-6 text-white tracking-tight leading-tight`}>
                                                                    {activeLesson.title}
                                                                </h2>

                                                                {/* Render Blocks or Fallback to TextBody */}
                                                                {activeLesson.blocks ? (
                                                                    <div className="space-y-8">
                                                                        {activeLesson.blocks.map((block, idx) => (
                                                                            <div key={idx}>
                                                                                {block.type === 'text' && (
                                                                                    <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-p:text-lg prose-p:leading-relaxed prose-strong:text-white prose-lg">
                                                                                        <div className="whitespace-pre-wrap font-medium">
                                                                                            {block.content}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {block.type === 'image' && block.url && (
                                                                                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                                                                        <img src={block.url} alt="Content" className="w-full h-auto" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-p:text-lg prose-p:leading-relaxed">
                                                                        <div className="whitespace-pre-wrap font-medium">
                                                                            {activeLesson.textBody || "No content provided."}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Quiz View */}
                                                    {activeLesson.type === 'quiz' && (
                                                        <div className={`${isMobile ? 'px-4 mb-12' : 'space-y-8 mb-12'}`}>
                                                            <div className="glass-card rounded-[2rem] p-8 shadow-2xl relative overflow-hidden mb-8">
                                                                <div className="relative z-10 text-center max-w-2xl mx-auto">
                                                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mx-auto mb-4">
                                                                        <HelpCircle size={24} />
                                                                    </div>
                                                                    <h2 className="text-2xl font-black mb-2">{activeLesson.title}</h2>
                                                                    <p className="text-xs text-gray-400 font-medium tracking-tight">Complete all questions to finish.</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-6">
                                                                {(activeLesson.quizData?.questions || []).map((q, qIdx) => (
                                                                    <QuizQuestion key={q.id} q={q} qIdx={qIdx} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* File/Resource View */}
                                                    {activeLesson.type === 'file' && (
                                                        <div className={`${isMobile ? 'px-4 mb-12' : 'space-y-8 mb-12'}`}>
                                                            <div className="glass-card rounded-[2rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group text-center">
                                                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                                                    <Download size={200} />
                                                                </div>
                                                                <div className="relative z-10">
                                                                    <div className="w-16 h-16 rounded-[1.5rem] bg-green-500/10 flex items-center justify-center text-green-400 mx-auto mb-6">
                                                                        <Download size={32} />
                                                                    </div>
                                                                    <h2 className="text-2xl md:text-4xl font-black mb-4 tracking-tight">{activeLesson.title}</h2>
                                                                    <p className="text-gray-400 text-sm font-medium mb-8 leading-relaxed max-w-md mx-auto">
                                                                        {activeLesson.fileName || "Download the resource below."}
                                                                    </p>

                                                                    <div className="flex flex-col gap-3">
                                                                        <a
                                                                            href={activeLesson.videoUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="w-full py-4 bg-[var(--yellow)] text-black font-black rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                                                                        >
                                                                            <Download size={14} /> Download File
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Description Block */}
                                                    {activeLesson.type === 'video' && activeLesson.textBody && (
                                                        <div className={`${isMobile ? 'px-6 py-4' : 'glass-card rounded-3xl p-8 mb-12'} shadow-2xl relative group overflow-hidden`}>
                                                            {!isMobile && (
                                                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                                                    <FileText size={120} />
                                                                </div>
                                                            )}
                                                            <div className="prose prose-invert max-w-none prose-p:text-gray-400 prose-p:leading-relaxed prose-strong:text-white prose-headings:text-white relative z-10">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 block">About this lesson</h4>
                                                                {activeLesson.blocks ? (
                                                                    <div className="space-y-6">
                                                                        {activeLesson.blocks.map((block, idx) => (
                                                                            <div key={idx}>
                                                                                {block.type === 'text' && (
                                                                                    <div className="whitespace-pre-wrap text-base text-gray-300 font-medium leading-relaxed">
                                                                                        {block.content}
                                                                                    </div>
                                                                                )}
                                                                                {block.type === 'image' && block.url && (
                                                                                    <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg my-4">
                                                                                        <img src={block.url} alt="Content" className="w-full h-auto" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="whitespace-pre-wrap text-base">
                                                                        {activeLesson.textBody}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Mobile Curriculum Accordion */}
                                                    {isMobile && (
                                                        <div className="mt-8 border-t border-white/5 bg-white/[0.01]">
                                                            <div className="p-6">
                                                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-6 flex items-center gap-2">
                                                                    <Layout size={12} /> Course Curriculum
                                                                </h3>
                                                                <CurriculumList className="bg-transparent" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions Sidebar (Desktop Only) */}
                                                {!isMobile && (
                                                    <div className="w-full lg:w-80 shrink-0 space-y-8 sticky top-0 relative z-20">
                                                        <div className="glass-card rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden group">
                                                            <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                            <div className="flex flex-col items-center gap-6 relative z-10">
                                                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-inner
                                                                    ${progress.includes(activeLesson.id) ? 'bg-green-500/10 text-green-500 shadow-green-500/10' : 'bg-[var(--yellow)]/10 text-[var(--yellow)] shadow-yellow-500/10'}
                                                                    group-hover:scale-110
                                                                `}>
                                                                    {isCompleted ? <CheckCircle size={40} /> : (activeLesson.type === 'video' ? <PlayCircle size={40} /> : <FileText size={40} />)}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-2 text-gray-600">Lesson Status</h4>
                                                                    <p className={`text-xl font-black tracking-tight ${isCompleted ? 'text-green-500' : 'text-white'}`}>
                                                                        {isCompleted ? 'Finished' : 'In Progress'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={markAsComplete}
                                                                disabled={isCompleted && !isAdmin}
                                                                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center justify-center gap-3 relative z-10
                                                                    ${progress.includes(activeLesson.id)
                                                                        ? 'bg-white/[0.05] text-green-500 border border-green-500/20 cursor-default'
                                                                        : 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.25)]'}
                                                                `}
                                                            >
                                                                {progress.includes(activeLesson.id) ? (
                                                                    <><CheckCircle size={14} /> LESSON DONE</>
                                                                ) : (
                                                                    'Mark as Complete'
                                                                )}
                                                            </button>

                                                            <div className="h-px bg-white/5" />

                                                            <p className="text-[10px] text-gray-600 font-bold px-4 leading-relaxed tracking-wide">
                                                                Completion helps track your learning progress and unlock achievements.
                                                            </p>
                                                        </div>

                                                        {/* Secondary Actions */}
                                                        <button
                                                            onClick={goToNextLesson}
                                                            className="w-full flex items-center justify-between p-6 bg-white/[0.02] hover:bg-white/[0.05] rounded-[2rem] border border-white/5 transition-all group shadow-xl active:scale-95"
                                                        >
                                                            <div className="flex flex-col items-start translate-x-2 group-hover:translate-x-3 transition-transform">
                                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1">Up Next</span>
                                                                <span className="text-sm font-black text-white group-hover:text-[var(--yellow)] transition-colors">Next Lesson</span>
                                                            </div>
                                                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[var(--yellow)] group-hover:text-black transition-all group-hover:scale-110 shadow-lg">
                                                                <ChevronLeft size={18} className="rotate-180" />
                                                            </div>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );

                                })() : (
                                    <div className="text-center py-20 animate-pulse">
                                        <PlayCircle size={64} className="mx-auto text-gray-800 mb-6" />
                                        <h2 className="text-2xl font-black text-gray-700 uppercase tracking-widest">Select a lesson to begin</h2>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;
