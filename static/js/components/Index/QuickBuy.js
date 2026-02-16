import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { checkout } from '../../api/coaching';
import useMiddleware from '../../utils/useMiddleware';
import { auth } from '../../utils/firebase';
import { COURSE_IDS } from '../../utils/purchaceURLS';
import { Zap, Shield, Crown } from 'lucide-react';

const QuickBuyCard = ({ title, price, courseId, color, icon: Icon, delay }) => {
    const [loading, setLoading] = useState(false);

    const handleQuickBuy = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (loading) return;

        if (!auth.currentUser) {
            window.location.href = '/claim';
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;
            const email = user ? user.email : null;
            const token = await user.getIdToken();
            const mw = useMiddleware(token);

            const response = await checkout(mw, false, email, courseId, { billingCycle: 'month' });

            if (response?.checkoutUrl) {
                window.location.href = response.checkoutUrl;
            } else {
                alert(response?.message || "Checkout failed to initialize.");
                setLoading(false);
            }
        } catch (err) {
            console.error("Stripe Checkout Error:", err);
            alert("Something went wrong with the payment system.");
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="flex-1 min-w-[300px] bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group"
        >
            {/* Background Glow */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 opacity-5 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-10`} style={{ backgroundColor: color }} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <Icon size={24} style={{ color }} />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                        Monthly Plan
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black tracking-tighter" style={{ color }}>
                            ${price}
                        </span>
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">/ month</span>
                    </div>
                </div>

                <button
                    onClick={handleQuickBuy}
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                    style={{
                        backgroundColor: color,
                        color: '#000',
                        boxShadow: `0 10px 30px -10px ${color}40`
                    }}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>Buy Now</span>
                            <Zap size={14} className="fill-current transition-transform group-hover/btn:scale-125" />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

const QuickBuy = () => {
    return (
        <section className="-mt-10 pt-10 pb-20 px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12" data-aos="zoom-in">
                    <h2 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
                        Monthly <span className="text-[var(--yellow)]">Subscriptions</span>
                    </h2>
                    <p className="text-white/60 text-xs md:text-sm font-bold uppercase tracking-[0.3em] mt-2">
                        Start your journey to pro instantly
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                    <QuickBuyCard
                        title="Beginner"
                        price="15"
                        courseId={COURSE_IDS.BEGINNER}
                        color="var(--green)"
                        icon={Zap}
                        delay={0}
                    />
                    <QuickBuyCard
                        title="Intermediate"
                        price="25"
                        courseId={COURSE_IDS.INTERMEDIATE}
                        color="var(--orange)"
                        icon={Shield}
                        delay={0}
                    />
                    <QuickBuyCard
                        title="Advanced"
                        price="50"
                        courseId={COURSE_IDS.ADVANCED}
                        color="var(--red)"
                        icon={Crown}
                        delay={0}
                    />
                </div>
            </div>
        </section>
    );
};

export default QuickBuy;
