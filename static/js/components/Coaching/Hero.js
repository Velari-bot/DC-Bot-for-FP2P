import React, { useState } from "react";
import VideoPlayer from "../VideoPlayer";
import { Zap, Shield, Crown, Play, ChevronRight, CheckIcon, UserIcon, Trophy } from "lucide-react"
import { checkout } from "../../api/coaching";
import useMiddleware from "../../utils/useMiddleware";
import { auth } from "../../utils/firebase";
import { motion } from "framer-motion";


const Hero = () => {
    const middleware = useMiddleware();
    const [creating, setCreating] = useState(false);
    const [selectedHours, setSelectedHours] = useState(1);

    const handlePurchase = async (type) => {
        if (creating) return;

        if (!auth.currentUser) {
            window.location.href = "/claim";
            return;
        }

        setCreating(true);

        const response = await checkout(middleware, type, auth.currentUser.email);

        if (response?.error) {
            console.error("Checkout error:", response);
            setCreating(false);
            return;
        }

        const checkoutUrl = response?.checkoutUrl;
        if (!checkoutUrl) {
            setCreating(false);
            return;
        }

        window.location.href = checkoutUrl;
    };

    const bundleBenefits = [
        '5 Full hours of 1-on-1 focus',
        '20% Discount applied ($150 saved)',
        'Priority scheduling for all sessions',
        'Everything in standard 1:1 coaching',
        'Discord access granted automatically',
    ];
    const seasonalTier1Benefits = [
        'VOD Review once a week',
        'Weekly Private 1-on-1 calls',
        'Personalized gameplan',
        'Discord access granted automatically after purchase'
    ];
    const seasonalTier2Benefits = [
        'Full VOD breakdown of every tournament',
        'Daily Private 1-on-1 calls',
        'Personalized strategy, game plan, and loot routes',
        'Custom development plan focused on your goals',
        'Discord access granted automatically after purchase'
    ];

    return (
        <>
            <section className="pt-24 md:pt-40 pb-20 px-4 relative min-h-[100%]">



                <div className="w-full max-w-7xl mx-auto text-center relative z-12">
                    <div className="max-w-5xl mx-auto text-center">
                        <h1 className="text-2xl md:text-5xl font-black text-white mb-6 tracking-tighter italic uppercase">
                            <span className="text-white">1:1 Coaching</span>
                            <span className="text-[var(--yellow)]"> & Elite Packages</span>
                        </h1>
                        <p className="text-gray-400 text-base md:text-xl mb-12 max-w-2xl mx-auto font-medium">
                            Step up your game with personalized coaching. Join elite-tier 1-on-1 sessions
                            designed to identify your weaknesses and build a path to pro.
                        </p>
                    </div>

                    {/* Main Video Section */}
                    <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 mt-5 group" data-aos="fade-up">
                        <div className="aspect-video bg-black">
                            <VideoPlayer
                                url="https://www.youtube.com/watch?v=XeW5mYlIaLA"
                            />
                        </div>
                    </div>

                    {/* Unified Coaching Interface */}
                    <div className="max-w-5xl mx-auto mt-20 md:mt-[350px]" data-aos="fade-up">
                        <motion.div
                            whileHover={{ scale: 1.015, y: -4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group shadow-2xl text-left"
                        >
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-[var(--yellow)]/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-20" />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                                {/* Left Column: Info & Selector */}
                                <div className="flex flex-col justify-between h-full">
                                    <div className="flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-10">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                                <Zap size={32} className="text-[var(--yellow)]" />
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                                Elite 1:1 Coaching
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-white text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">
                                                1:1 Coaching
                                            </h3>
                                            <div className="flex items-baseline gap-2">
                                                <motion.span
                                                    key={selectedHours}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-7xl font-black text-[var(--yellow)] tracking-tighter"
                                                >
                                                    ${selectedHours === 1 ? '150' : (selectedHours === 3 ? '400' : '600')}
                                                </motion.span>
                                                <div className="flex flex-col items-start translate-y-[-10px]">
                                                    {selectedHours > 1 && (
                                                        <span className="text-[10px] font-black text-red-500/80 bg-red-400/10 px-2.5 py-1 rounded-full mb-2 uppercase tracking-wider">
                                                            SAVE ${selectedHours === 3 ? '50' : '150'}
                                                        </span>
                                                    )}
                                                    <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                                                        Total Price
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-gray-400 text-lg leading-relaxed mb-10 font-medium min-h-[80px]">
                                            {selectedHours === 1 && "A full hour focused purely on your gameplay. We'll identify bad habits, fix mechanics, and set a clear path for improvement."}
                                            {selectedHours === 3 && "Three intensive hours to deep dive into your mechanics. Includes VOD review, live coaching, and a personalized 2-week training plan."}
                                            {selectedHours === 5 && "The ultimate commitment to pro status. Complete gameplay overhaul, consistent weekly check-ins, and priority support."}
                                        </p>

                                        {/* Hour Selector */}
                                        <div className="bg-white/5 p-2 rounded-[1.5rem] flex items-center mb-10 border border-white/10 backdrop-blur-sm mt-auto">
                                            {[1, 3, 5].map((hours) => (
                                                <motion.button
                                                    key={hours}
                                                    onClick={() => setSelectedHours(hours)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`
                                                        flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                                        ${selectedHours === hours
                                                            ? 'bg-[var(--yellow)] text-black shadow-[0_0_25px_rgba(250,204,36,0.3)]'
                                                            : 'text-gray-500 hover:text-white hover:bg-white/5'}
                                                    `}
                                                >
                                                    {hours} Hour{hours > 1 ? 's' : ''}
                                                </motion.button>
                                            ))}
                                        </div>

                                        <motion.button
                                            className="w-full bg-white text-black font-black text-sm md:text-base uppercase tracking-widest py-5 rounded-2xl hover:bg-gray-100 shadow-xl flex items-center justify-center gap-3 backdrop-blur-sm"
                                            onClick={() => handlePurchase(
                                                selectedHours === 1 ? 'single_coaching' :
                                                    (selectedHours === 3 ? 'coaching_bundle_3h' : 'coaching_bundle_5h')
                                            )}
                                            disabled={creating}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {creating ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "BUY NOW"}
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Right Column: Benefits */}
                                <div className="bg-white/[0.02] rounded-[2.5rem] p-8 md:p-10 border border-white/5 flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[var(--yellow)]/5 rounded-full blur-3xl pointer-events-none" />

                                    <h4 className="text-white text-sm font-black italic uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
                                        <Trophy className="text-[var(--yellow)]" size={20} />
                                        What's Included
                                    </h4>
                                    <div className="space-y-5 relative z-10">
                                        {(selectedHours === 1 ? [
                                            'Foundational mechanics analysis',
                                            'Live gameplay critique',
                                            'Basic routine adjustments',
                                            'Discord access',
                                            'Session recording provided'
                                        ] : selectedHours === 3 ? [
                                            'Everything in 1 Hour tier',
                                            'Deep-dive VOD review',
                                            'Personalized 2-week training plan',
                                            'Priority scheduling',
                                            'Direct DM access for questions'
                                        ] : [
                                            'Everything in 3 Hour tier',
                                            'Full tournament history breakdown',
                                            'Consistent weekly check-ins',
                                            'Custom loot routes & drop map',
                                            'Mental game & confidence coaching'
                                        ]).map((benefit, index) => (
                                            <div key={index} className="flex items-start gap-4 group/item">
                                                <div className="w-6 h-6 rounded-full bg-[var(--yellow)]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-[var(--yellow)] transition-colors duration-300">
                                                    <CheckIcon className="text-[var(--yellow)] group-hover/item:text-black transition-colors duration-300" size={14} />
                                                </div>
                                                <span className="text-gray-300 font-bold text-xs uppercase tracking-wide leading-relaxed group-hover/item:text-white transition-colors">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-white/5 relative z-10">
                                        <p className="text-[10px] text-gray-500 text-center font-black uppercase tracking-[0.2em] leading-relaxed italic italic opacity-60">
                                            "Investing in yourself is the highest ROI you can get. Let's get to work."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Seasonal Coaching Options */}
                    <div className="max-w-5xl mx-auto mt-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-10 text-center italic uppercase tracking-tighter" data-aos="fade-up">
                            Seasonal Coaching{' '}
                            <span className="text-[var(--yellow)]">(2 Months)</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Tier 1 - $500 */}
                            <div data-aos="fade-up">
                                <motion.div
                                    whileHover={{ y: -8, scale: 1.01 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="h-full bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden group shadow-2xl flex flex-col text-left"
                                >
                                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--yellow)]/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-20" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                                <Shield size={24} className="text-[var(--yellow)]" />
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">
                                                Basic Season
                                            </h3>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-5xl font-black tracking-tighter text-[var(--yellow)]">
                                                    $500
                                                </span>
                                                <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">/ season</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-10">
                                            {seasonalTier1Benefits.map((benefit, index) => (
                                                <div key={index} className="flex items-center gap-3 group/benefit">
                                                    <div className="w-5 h-5 rounded-full bg-[var(--yellow)]/10 flex items-center justify-center shrink-0 group-hover/benefit:bg-[var(--yellow)] transition-colors">
                                                        <CheckIcon className="text-[var(--yellow)] group-hover/benefit:text-black transition-colors" size={10} />
                                                    </div>
                                                    <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wide group-hover:text-white transition-colors">{benefit}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <motion.button
                                            className="w-full py-4 bg-white text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all shadow-xl mt-auto relative z-10"
                                            onClick={() => handlePurchase("basic_season")}
                                            disabled={creating}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {creating ? "Processing..." : "BOOK SEASONAL COACHING"}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Tier 2 - $2500 */}
                            <div data-aos="fade-up">
                                <motion.div
                                    whileHover={{ y: -8, scale: 1.01 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="h-full bg-black/40 backdrop-blur-xl border-2 border-[var(--yellow)]/20 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl flex flex-col text-left"
                                >
                                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--yellow)]/20 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-30" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                                <Crown size={24} className="text-[var(--yellow)]" />
                                            </div>
                                            <div className="bg-[var(--yellow)] text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                                                MOST POPULAR
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">
                                                Advanced Season
                                            </h3>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-5xl font-black tracking-tighter text-[var(--yellow)]">
                                                    $2,500
                                                </span>
                                                <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">/ season</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-10">
                                            {seasonalTier2Benefits.map((benefit, index) => (
                                                <div key={index} className="flex items-center gap-3 group/benefit">
                                                    <div className="w-5 h-5 rounded-full bg-[var(--yellow)]/10 flex items-center justify-center shrink-0 group-hover/benefit:bg-[var(--yellow)] transition-colors">
                                                        <CheckIcon className="text-[var(--yellow)] group-hover/benefit:text-black transition-colors" size={10} />
                                                    </div>
                                                    <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wide group-hover:text-white transition-colors">{benefit}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <motion.button
                                            className="w-full bg-[var(--yellow)] text-black font-black text-sm uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg shadow-[var(--yellow)]/20 relative z-10 transition-all mt-auto py-4"
                                            onClick={() => handlePurchase("advanced_season")}
                                            disabled={creating}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {creating ? "Processing..." : "BOOK SEASONAL COACHING"}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Hero;