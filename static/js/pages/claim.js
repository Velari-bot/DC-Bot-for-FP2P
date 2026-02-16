import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs
} from "firebase/firestore";
import { auth, db } from "../utils/firebase";
import { Crown, Calendar, History, LogOut, User, Lock, Mail, Loader2, AlertCircle, BookOpen, PlayCircle, ExternalLink, ShieldCheck, ChevronRight, CreditCard, RefreshCw, Trophy, Zap, MapPin, Clock } from "lucide-react";

/**
 * Claim Component
 * 
 * Handles user authentication (Login/Signup) separate from the main app auth.
 * Displays "Credits" (Hours Remaining) and "Past Payments".
 * Allows scheduling (placeholder for now).
 */
const Claim = () => {
    // Auth State
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Signup

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    // User Data State
    const [credits, setCredits] = useState(0);
    const [payments, setPayments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [discordInfo, setDiscordInfo] = useState(null);
    const [userStats, setUserStats] = useState({ powerRanking: 0, earnings: 0, followers: 0 });
    const [dataLoading, setDataLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);

    // Discord OAuth Message Listener
    useEffect(() => {
        const handleMessage = async (event) => {
            if (event.data?.type === 'DISCORD_AUTH_SUCCESS') {
                const discordUser = event.data.user;
                await linkDiscord(discordUser);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [user]);

    const linkDiscord = async (discordUser) => {
        if (!user) return;
        setDataLoading(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/discord-auth?action=link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    discordId: discordUser.id,
                    discordTag: `${discordUser.username}#${discordUser.discriminator}`,
                    discordAvatar: discordUser.avatar
                })
            });
            if (res.ok) {
                setDiscordInfo({
                    discordId: discordUser.id,
                    discordTag: discordUser.username,
                    discordAvatar: discordUser.avatar
                });
                alert("Discord connected and roles synced!");
            } else {
                const data = await res.json();
                setError(data.error || "Failed to link");
            }
        } catch (err) {
            console.error("Linking failed:", err);
            setError("Failed to link Discord account");
        } finally {
            setDataLoading(false);
        }
    };

    const handleSyncRoles = async () => {
        if (!user || !discordInfo) return;
        setDataLoading(true);
        try {
            const idToken = await user.getIdToken();
            // Using the link endpoint again effectively re-syncs roles
            const res = await fetch('/api/discord-auth?action=link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    discordId: discordInfo.discordId,
                    discordTag: discordInfo.discordTag, // Reuse existing info or maybe don't send if backend can handle it
                    discordAvatar: discordInfo.discordAvatar
                })
            });

            if (res.ok) {
                alert("Roles successfully synced with Discord!");
            }
        } catch (err) {
            console.error(err);
            setError("Sync failed");
        } finally {
            setDataLoading(false);
        }
    };

    const handleDisconnectDiscord = async () => {
        if (!confirm("Are you sure you want to disconnect your Discord account?")) return;
        setDataLoading(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/discord-auth?action=unlink', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (res.ok) {
                setDiscordInfo(null);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to disconnect");
        } finally {
            setDataLoading(false);
        }
    };

    const handleConnectDiscord = async () => {
        try {
            const res = await fetch('/api/discord-auth?action=url');
            const { url } = await res.json();
            const width = 500;
            const height = 800;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            window.open(url, 'Discord Auth', `width=${width},height=${height},top=${top},left=${left}`);
        } catch (err) {
            console.error(err);
            setError("Could not start Discord authentication");
        }
    };

    // Listen to Auth Changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (currentUser) {
                fetchUserData(currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchUserData = async (uid) => {
        setDataLoading(true);
        try {
            // 1. Attempt to claim any pending credits from pre-purchases via API
            try {
                if (auth.currentUser) {
                    const idToken = await auth.currentUser.getIdToken();
                    await fetch('/api/claim-credits', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken })
                    });
                }
            } catch (claimErr) {
                console.warn("Auto-claim failed:", claimErr);
            }

            // Fetch Credits (User Document)
            const userDocRef = doc(db, "users", uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                setCredits(userData.credits || 0);
                if (userData.discordId) {
                    setDiscordInfo({
                        discordId: userData.discordId,
                        discordTag: userData.discordTag,
                        discordAvatar: userData.discordAvatar
                    });
                }
                setUserStats({
                    powerRanking: userData.powerRanking || 0,
                    earnings: userData.earnings || 0,
                    followers: userData.followers || 0
                });
            } else {
                // Initialize user doc if not exists
                await setDoc(userDocRef, {
                    email: auth.currentUser.email,
                    credits: 0,
                    createdAt: new Date()
                });
                setCredits(0);
            }

            // 3. Fetch Payments (Subcollection)
            try {
                const paymentsRef = collection(db, "users", uid, "payments");
                const paymentsSnap = await getDocs(paymentsRef);
                const paymentsList = paymentsSnap.docs.map(d => d.data());

                // Sort by date desc
                const sortedPayments = paymentsList.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : new Date(0);
                    const dateB = b.date ? new Date(b.date) : new Date(0);
                    return dateB - dateA;
                });

                setPayments(sortedPayments);
            } catch (err) {
                console.error("Error fetching payments:", err);
                setPayments([]);
            }

            // Fetch Courses - For now, fetch ALL courses. In future, filter by purchase.
            try {
                const coursesRef = collection(db, "courses");
                const coursesSnap = await getDocs(coursesRef);
                const coursesList = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCourses(coursesList);
            } catch (err) {
                console.error("Error fetching courses:", err);
            }

        } catch (err) {
            console.error("Error fetching user data:", err);
            setError("Failed to load data: " + err.message);
        } finally {
            setDataLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        setAuthLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            console.error("Auth Error:", err);
            let msg = "An error occurred.";
            switch (err.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    msg = "Incorrect email or password.";
                    break;
                case 'auth/email-already-in-use':
                    msg = "This email is already in use.";
                    break;
                case 'auth/weak-password':
                    msg = "Password should be at least 6 characters.";
                    break;
                case 'auth/too-many-requests':
                    msg = "Too many failed attempts. Please try again later.";
                    break;
                default:
                    msg = err.message.replace("Firebase: ", "").replace("Error (auth/", "").replace(").", "");
            }
            setError(msg);
        } finally {
            setAuthLoading(false);
        }
    };

    // --- View State ---
    const [view, setView] = useState('courses'); // 'courses' | 'orders' | 'profile'

    const handleLogout = async () => {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (error) {
            console.error(error);
        }
    };

    const handleManageSubscription = async () => {
        if (!auth.currentUser) return;
        setPortalLoading(true);
        try {
            const idToken = await auth.currentUser.getIdToken();
            const response = await fetch('/api/stripe?action=portal', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.portalUrl) {
                window.location.href = data.portalUrl;
            } else {
                setError(data.message || "Could not open billing portal");
            }
        } catch (err) {
            console.error("Portal Error:", err);
            setError("Failed to open subscription management");
        } finally {
            setPortalLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
                <Loader2 className="animate-spin mb-4 text-[var(--yellow)]" size={48} />
                <p className="font-bold tracking-widest uppercase text-[10px] opacity-50">Synchronizing Vault</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen w-full bg-[#050505] text-white relative overflow-hidden flex items-center justify-center font-['Outfit',_sans-serif]">
                {/* Auth Background */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--yellow)]/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative z-10 w-full max-w-md px-6" data-aos="fade-up">
                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
                        {/* Glow corner */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[var(--yellow)]/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                                {isLogin ? "Player Login" : "Join Path To Pro"}
                            </h2>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">
                                {isLogin ? "Enter your credentials" : "Create your unique profile"}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold animate-shake">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-[var(--yellow)]/50 outline-none transition-all font-medium"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access Token (Password)</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-[var(--yellow)]/50 outline-none transition-all font-medium"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full mt-6 relative group/btn overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--yellow)] to-yellow-500 transition-all duration-300 group-hover/btn:scale-105 rounded-xl"></div>
                                <div className="relative flex items-center justify-center py-4 bg-transparent text-black font-black text-sm uppercase tracking-widest disabled:opacity-50">
                                    {authLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        isLogin ? "Sign In" : "Create Account"
                                    )}
                                </div>
                            </button>
                        </form>

                        <div className="mt-8 text-center relative z-10">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-gray-400 text-xs font-bold hover:text-white transition-colors"
                            >
                                {isLogin ? "New here? " : "Already have an account? "}
                                <span className="text-[var(--yellow)] uppercase tracking-tighter ml-1">
                                    {isLogin ? "Create an account" : "Log in instead"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                {/* Player Sidebar */}
                <div className="w-full md:w-80 bg-white/[0.02] backdrop-blur-3xl border-r border-white/10 p-8 flex flex-col gap-2 relative z-20 h-auto md:h-full overflow-y-auto custom-scrollbar">
                    <div className="mb-12 px-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-[var(--yellow)]/10 rounded-xl">
                                <User size={24} className="text-[var(--yellow)]" />
                            </div>
                            <h2 className="text-white font-black uppercase tracking-tighter text-2xl truncate">
                                {user.email.split('@')[0]}
                            </h2>
                        </div>
                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1 ml-1 truncate">Player ID: {user.uid.slice(0, 8)}...</p>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => setView('courses')}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'courses'
                                ? 'bg-[var(--yellow)] text-black shadow-[0_10px_20px_-5px_rgba(255,193,7,0.3)]'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <BookOpen size={18} /> My Courses
                        </button>

                        <button
                            onClick={() => setView('profile')}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'profile'
                                ? 'bg-[var(--yellow)] text-black shadow-[0_10px_20px_-5px_rgba(255,193,7,0.3)]'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Zap size={18} /> Play & Matchmaking
                        </button>

                        <button
                            onClick={() => setView('orders')}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'orders'
                                ? 'bg-[var(--yellow)] text-black shadow-[0_10px_20px_-5px_rgba(255,193,7,0.3)]'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <History size={18} /> Order History
                        </button>
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                        <button
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 transition-all duration-300 disabled:opacity-50"
                        >
                            {portalLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <CreditCard size={18} />
                            )}
                            Manage Subscription
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all duration-300"
                        >
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto h-auto md:h-full custom-scrollbar">
                    <div className="p-4 md:p-12">
                        {view === 'courses' && (
                            <section data-aos="fade-up">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8 px-2">
                                    <div>
                                        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">Access Your Content</h1>
                                        <div className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-[var(--yellow)] animate-pulse shadow-[0_0_10px_rgba(255,193,7,0.5)]"></span>
                                            <p className="text-gray-400 font-medium uppercase tracking-widest text-[10px]">Active Masterclasses & Resources</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {courses.filter(c => c.isPublic).length > 0 ? (
                                        courses.filter(c => c.isPublic).map(course => {
                                            const isPurchased = payments.some(p =>
                                                (course.requiredProductId && (
                                                    p.productId === course.requiredProductId ||
                                                    p.requiredProductId === course.requiredProductId ||
                                                    p.item.toLowerCase().includes(course.requiredProductId.toLowerCase())
                                                )) ||
                                                p.item === course.title ||
                                                p.productId === course.id
                                            );

                                            return (
                                                <div key={course.id} className="group bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-[var(--yellow)]/30 transition-all duration-500 flex flex-col hover:shadow-2xl">
                                                    <div className="aspect-video relative overflow-hidden">
                                                        {course.thumbnail ? (
                                                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                                                <BookOpen size={60} className="text-white/5" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                                            {isPurchased ?
                                                                <PlayCircle size={64} className="text-[var(--yellow)] group-hover:scale-110 transition-transform shadow-2xl" /> :
                                                                <div className="p-5 bg-black/50 rounded-full backdrop-blur-md border border-white/10">
                                                                    <Lock size={32} className="text-gray-400" />
                                                                </div>
                                                            }
                                                        </div>
                                                        <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full text-[9px] font-black text-white border border-white/10 uppercase tracking-widest">
                                                            {course.sections?.length || 0} SECTIONS
                                                        </div>
                                                    </div>
                                                    <div className="p-8 flex flex-col flex-1">
                                                        <h3 className="text-2xl font-black text-white mb-2 group-hover:text-[var(--yellow)] transition-colors tracking-tight line-clamp-1">{course.title}</h3>
                                                        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-8 h-8 font-medium">
                                                            {course.description || "Start your journey to becoming a professional player today."}
                                                        </p>

                                                        <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.15em] mb-8 border-t border-white/5 pt-6">
                                                            <div className={`flex items-center gap-2 ${isPurchased ? 'text-green-400' : 'text-gray-500'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${isPurchased ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                                                                <span>{isPurchased ? "FULL ACCESS" : "LOCKED"}</span>
                                                            </div>
                                                            {course.isFreePreview && !isPurchased && (
                                                                <div className="flex items-center gap-2 text-blue-400">
                                                                    <PlayCircle size={12} />
                                                                    <span>PREVIEW AVAILABLE</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-auto">
                                                            {isPurchased ? (
                                                                <a
                                                                    href={`/course/${course.id}`}
                                                                    className="w-full py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 transition-all text-center block shadow-2xl active:scale-95"
                                                                >
                                                                    Resume Learning
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={course.id === 'tO4MriPtFjmoksUbpXdQ' ? '/fighting-masterclass' : (course.marketingUrl || "/coaching")}
                                                                    className="w-full py-4 bg-white/[0.05] text-white border border-white/10 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-white/[0.08] transition-all text-center flex items-center justify-center gap-3 group/lock active:scale-95"
                                                                >
                                                                    <Lock size={14} className="group-hover/lock:scale-110 transition-transform" />
                                                                    Unlock Access
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="col-span-full py-20 bg-white/[0.01] border-2 border-dashed border-white/10 rounded-[2.5rem] text-center" data-aos="zoom-in">
                                            <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-xs">Awaiting Curriculum Updates...</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {view === 'profile' && (
                            <section data-aos="fade-up" className="max-w-6xl">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
                                    <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setView('courses')}>Dashboard</span>
                                    <ChevronRight size={10} />
                                    <span className="text-[var(--yellow)]">Play</span>
                                </div>

                                <h1 className="text-3xl md:text-5xl font-black text-white mb-12 tracking-tight">Play & Matchmaking</h1>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* MATCHMAKING LEVEL CARD */}
                                    <div className="lg:col-span-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 overflow-hidden relative group hover:border-[var(--yellow)]/30 transition-all duration-500 shadow-2xl flex flex-col justify-between h-full">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                                            <Trophy size={120} />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                <Zap size={12} className="text-[var(--yellow)]" /> Competitive Performance
                                            </h3>
                                            <div className="flex flex-col gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Matchmaking Rank</span>
                                                    <span className={`text-6xl font-black tracking-tighter uppercase italic ${(userStats?.earnings >= 10000 || userStats?.followers >= 500000) ? 'text-purple-500' :
                                                        (userStats?.powerRanking >= 10000 || userStats?.earnings >= 5000 || userStats?.followers >= 100000) ? 'text-red-500' :
                                                            (userStats?.powerRanking >= 5000 || userStats?.earnings >= 2500 || userStats?.followers >= 50000) ? 'text-[var(--yellow)]' :
                                                                'text-gray-400'
                                                        }`}>
                                                        {(userStats?.earnings >= 10000 || userStats?.followers >= 500000) ? 'GOD' :
                                                            (userStats?.powerRanking >= 10000 || userStats?.earnings >= 5000 || userStats?.followers >= 100000) ? 'ELITE' :
                                                                (userStats?.powerRanking >= 5000 || userStats?.earnings >= 2500 || userStats?.followers >= 50000) ? 'PRO' :
                                                                    'PLAYER'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-6 pt-6 border-t border-white/5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Power Ranking</span>
                                                            <span className="text-xl font-black text-white">{userStats?.powerRanking || 0}</span>
                                                        </div>
                                                        <div className="text-[var(--yellow)] font-black text-[10px] uppercase tracking-tighter">Top 0.1%</div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">LIFETIME Earnings</span>
                                                            <span className="text-xl font-black text-white">${(userStats?.earnings || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-green-500 font-black text-[10px] uppercase tracking-tighter">Verified</div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Followers</span>
                                                            <span className="text-xl font-black text-white">{(userStats?.followers || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-blue-500 font-black text-[10px] uppercase tracking-tighter">Creator</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT SIDE GRID */}
                                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* COMPETITIVE SCRIMS CARD */}
                                        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 group hover:border-blue-500/30 transition-all duration-500 shadow-2xl flex flex-col">
                                            <div className="p-4 bg-blue-500/10 rounded-2xl w-fit mb-8">
                                                <MapPin size={24} className="text-blue-400" />
                                            </div>
                                            <h3 className="text-white text-2xl font-black tracking-tight mb-2">Competitive Scrims</h3>
                                            <p className="text-gray-500 text-xs font-medium mb-8">High-level practice matches hosted by official Path To Pro partners.</p>

                                            <div className="space-y-6 mt-auto">
                                                <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Region</span>
                                                    <span className="text-sm font-black text-white">Europe (EU)</span>
                                                </div>
                                                <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Scrim Status</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-sm font-black text-green-500">OPEN</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Next Session</span>
                                                    <span className="text-sm font-black text-white">6:00 PM CET</span>
                                                </div>
                                                <button className="w-full py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-blue-500/20">
                                                    View Schedule
                                                </button>
                                            </div>
                                        </div>

                                        {/* AVAILABLE PRACTICE CARD */}
                                        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 group hover:border-[var(--yellow)]/30 transition-all duration-500 shadow-2xl flex flex-col">
                                            <div className="p-4 bg-[var(--yellow)]/10 rounded-2xl w-fit mb-8">
                                                <Clock size={24} className="text-[var(--yellow)]" />
                                            </div>
                                            <h3 className="text-white text-2xl font-black tracking-tight mb-2">Available Practice</h3>
                                            <p className="text-gray-500 text-xs font-medium mb-8">Ongoing training sessions, arena matches, and upcoming events.</p>

                                            <div className="space-y-6 mt-auto">
                                                <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Arena</span>
                                                    <span className="text-sm font-black text-white">Open 24/7</span>
                                                </div>
                                                <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tournaments</span>
                                                    <span className="text-sm font-black text-[var(--yellow)]">Cup In 2 Hours</span>
                                                </div>
                                                <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Custom Keys</span>
                                                    <span className="text-sm font-black text-white">Available</span>
                                                </div>
                                                <a href="https://discord.com/invite/fortnitepathtopro" target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-[var(--yellow)] hover:brightness-110 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all text-center flex items-center justify-center gap-2">
                                                    Join Practice Discord <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>

                                        {/* PROFILE CARD - Moved to bottom or keep here? Let's move it to a full width row below */}
                                        <div className="md:col-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 group hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                                <div>
                                                    <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                                        <User size={14} /> ID & Connections
                                                    </h3>
                                                    <div className="flex flex-col md:flex-row gap-8">
                                                        <div>
                                                            <span className="text-gray-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1 block">Account Email</span>
                                                            <div className="text-white font-bold text-lg">{user.email}</div>
                                                        </div>
                                                        {discordInfo && (
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                                                                    {discordInfo.discordAvatar ? (
                                                                        <img
                                                                            src={`https://cdn.discordapp.com/avatars/${discordInfo.discordId}/${discordInfo.discordAvatar}.png`}
                                                                            alt="Discord"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        discordInfo.discordTag.charAt(0).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="text-white font-black text-sm">{discordInfo.discordTag}</div>
                                                                    <div className="text-[#5865F2] text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                        Linked Account
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    {discordInfo ? (
                                                        <button
                                                            onClick={handleSyncRoles}
                                                            disabled={dataLoading}
                                                            className="flex-1 md:flex-none px-6 py-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                                        >
                                                            {dataLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                                            Sync Roles
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={handleConnectDiscord}
                                                            className="flex-1 md:flex-none px-6 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3"
                                                        >
                                                            Connect Discord
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {view === 'orders' && (
                            <section data-aos="fade-up">
                                <h1 className="text-3xl md:text-5xl font-black text-white mb-12 tracking-tight">Order Logs</h1>
                                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                                    {dataLoading ? (
                                        <div className="py-32 text-center">
                                            <Loader2 size={40} className="animate-spin text-[var(--yellow)] mx-auto opacity-20" />
                                        </div>
                                    ) : payments.length > 0 ? (
                                        <div className="overflow-x-auto custom-scrollbar">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/5 bg-white/[0.01]">
                                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Timestamp</th>
                                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Asset Title</th>
                                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Value</th>
                                                        <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {payments.map((payment, index) => (
                                                        <tr key={index} className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] last:border-0">
                                                            <td className="px-10 py-8 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                                                                {new Date(payment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                            </td>
                                                            <td className="px-10 py-8">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-white group-hover:text-[var(--yellow)] transition-colors">{payment.item}</span>
                                                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">ID: {payment.productId || 'N/A'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-8">
                                                                <span className="text-sm font-black text-white">$ {payment.amount}</span>
                                                            </td>
                                                            <td className="px-10 py-8 text-right">
                                                                <span className="px-4 py-1.5 bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-500/20">
                                                                    Finalized
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="py-32 text-center">
                                            <History size={48} className="mx-auto text-white/5 mb-6" />
                                            <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]">No transaction history found.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Claim;
