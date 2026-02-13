
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import useMiddleware from "../utils/useMiddleware";
import { checkout } from "../api/coaching";
import { Loader2, ShoppingCart, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const PurchaseTest = () => {
    const auth = getAuth();
    const middleware = useMiddleware();
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            setUser(u);
            if (u) {
                await fetchData(u);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const fetchData = async (currentUser) => {
        try {
            // 1. Fetch Courses
            const coursesSnap = await getDocs(collection(db, "courses"));
            const coursesList = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(coursesList);

            // 2. Fetch Payments
            const paymentsSnap = await getDocs(collection(db, "users", currentUser.uid, "payments"));
            const paymentsList = paymentsSnap.docs.map(d => d.data());
            setPayments(paymentsList);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleTestPurchase = async (course) => {
        if (!user) return alert("Please login first");
        setProcessing(course.id);

        try {
            // We follow the same pattern as CoursePlayer
            // If the course has a specific priceId or productId, usually that's used.
            // But checking CoursePlayer, it passes 'false' for productId and the courseId.
            // Let's try passing course.priceId if available as productId, or checking how the API expects it.
            // CoursePlayer: checkout(useM, false, auth.currentUser.email, courseId)

            // If the course has a mapped Stripe Price ID, we might need to pass that or just courseId
            // Let's assume the backend handles courseId resolution to price.

            // However, IntermediateMasterclass passes a mapped ID.

            const res = await checkout(middleware, course.priceId || false, user.email, course.id);

            if (res.checkoutUrl) {
                console.log("Redirecting to:", res.checkoutUrl);
                window.location.href = res.checkoutUrl;
            } else {
                alert("Checkout failed: " + (res.message || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setProcessing(null);
        }
    };

    const isPurchased = (course) => {
        return payments.some(p =>
            (course.requiredProductId && (p.productId === course.requiredProductId || p.item?.toLowerCase().includes(course.requiredProductId.toLowerCase()))) ||
            p.item === course.title
        );
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    if (!user) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-gray-400">Please log in to use the test suite.</p>
            <a href="/claim" className="px-6 py-2 bg-[var(--yellow)] text-black font-bold rounded-lg">Go to Login</a>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 md:p-12 pt-32">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                            <ShoppingCart className="text-[var(--yellow)]" size={32} />
                            Purchase Test Suite
                        </h1>
                        <p className="text-gray-400">Verify course purchases and subscription status manually.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Logged in as</p>
                        <p className="font-mono text-[var(--yellow)]">{user.email}</p>
                    </div>
                </div>

                {/* Status Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 col-span-2">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-500" /> Active Entitlements
                        </h3>
                        {payments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-gray-500 uppercase font-bold text-xs border-b border-white/10">
                                        <tr>
                                            <th className="pb-2">Date</th>
                                            <th className="pb-2">Item Name</th>
                                            <th className="pb-2">Amount</th>
                                            <th className="pb-2">Product ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-mono">
                                        {payments.sort((a, b) => new Date(b.date) - new Date(a.date)).map((p, i) => (
                                            <tr key={i} className="border-b border-white/5 last:border-0">
                                                <td className="py-3 text-gray-400">{new Date(p.date).toLocaleDateString()}</td>
                                                <td className="py-3 text-white font-bold">{p.item}</td>
                                                <td className="py-3 text-green-400">${p.amount}</td>
                                                <td className="py-3 text-gray-500">{p.productId || "N/A"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No payments found on record.</p>
                        )}
                    </div>

                    <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AlertCircle size={20} className="text-[var(--yellow)]" /> Debug Info
                        </h3>
                        <div className="space-y-2 text-xs font-mono text-gray-400">
                            <div className="flex justify-between">
                                <span>UID:</span>
                                <span className="text-white">{user.uid.substring(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Verified Email:</span>
                                <span className={user.emailVerified ? "text-green-500" : "text-red-500"}>{String(user.emailVerified)}</span>
                            </div>
                            <div className="mt-4 p-3 bg-black rounded-lg border border-white/10 overflow-hidden">
                                <p className="mb-1 text-gray-600 uppercase font-bold tracking-widest">Raw Payment Data</p>
                                <pre className="overflow-x-auto">{JSON.stringify(payments, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-6">Course Availability</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => {
                        const purchased = isPurchased(course);
                        return (
                            <div key={course.id} className={`p-6 rounded-2xl border transition-all ${purchased ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg">{course.title}</h3>
                                    {purchased ? (
                                        <span className="bg-green-500 text-black text-xs font-black px-2 py-1 rounded-md uppercase tracking-wide">Owned</span>
                                    ) : (
                                        <span className="bg-gray-700 text-white text-xs font-black px-2 py-1 rounded-md uppercase tracking-wide">Locked</span>
                                    )}
                                </div>

                                <div className="space-y-2 mb-6 text-sm text-gray-400 font-mono">
                                    <div className="flex justify-between">
                                        <span>Course ID:</span>
                                        <span className="text-white truncate max-w-[100px]" title={course.id}>{course.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Price ID:</span>
                                        <span className="text-white truncate max-w-[100px]">{course.priceId || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Req Prod ID:</span>
                                        <span className="text-white truncate max-w-[100px]">{course.requiredProductId || "N/A"}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleTestPurchase(course)}
                                        disabled={processing === course.id || purchased}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all
                                            ${purchased
                                                ? 'bg-green-500/10 text-green-500 cursor-default'
                                                : 'bg-[var(--yellow)] text-black hover:bg-yellow-400 hover:shadow-lg'
                                            }
                                            ${processing === course.id ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        {processing === course.id ? <Loader2 className="animate-spin mx-auto" /> : (purchased ? "Purchased" : "Test Buy")}
                                    </button>

                                    {purchased && (
                                        <a href={`/course/${course.id}`} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">
                                            Open
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PurchaseTest;
