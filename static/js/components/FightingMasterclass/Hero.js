
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VideoPlayer from "../VideoPlayer";
import BuyButton from "./BuyButton";
import { Zap, Shield, Crown, BoxSelect, Map, Minus, Plus } from "lucide-react";
import { checkout } from "../../api/coaching";
import useMiddleware from "../../utils/useMiddleware";
import { auth } from "../../utils/firebase";
import { FIGHTING_1V1_SINGLE } from "../../utils/purchaceURLS";


const Hero = () => {
    const [bookingLoading, setBookingLoading] = useState(false);
    const [gamemodeQuantities, setGamemodeQuantities] = useState({
        Realistics: 1,
        Boxfights: 0,
        Zonewars: 0
    });

    // Tiered pricing calculation
    // 1st session: $50, 2nd: $40, 3rd+: $35 each
    const calculateTotal = () => {
        const totalQty = Object.values(gamemodeQuantities).reduce((a, b) => a + b, 0);
        if (totalQty <= 0) return 0;

        let total = 50; // First session
        if (totalQty >= 2) total += 40; // Second session
        if (totalQty >= 3) total += (totalQty - 2) * 35; // 3rd+ sessions at $35 each
        return total;
    };

    const currentTotal = calculateTotal();

    const updateQuantity = (id, delta) => {
        setGamemodeQuantities(prev => {
            const newQty = Math.max(0, (prev[id] || 0) + delta);
            return { ...prev, [id]: newQty };
        });
    };

    const handleBook = async () => {
        if (bookingLoading) return;

        // Check if user is logged in
        if (!auth.currentUser) {
            window.location.href = '/claim';
            return;
        }

        const totalQty = Object.values(gamemodeQuantities).reduce((a, b) => a + b, 0);
        if (totalQty === 0) {
            alert("Please select at least one gamemode.");
            return;
        }

        setBookingLoading(true);

        try {
            const user = auth.currentUser;
            const email = user ? user.email : null;
            const token = await user.getIdToken();
            const mw = useMiddleware(token);

            // Filter out 0 quantity modes for cleaner data
            const activeGamemodes = Object.entries(gamemodeQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => ({ id, quantity: qty }));

            const data = {
                quantity: totalQty,
                totalPrice: currentTotal,
                gamemodes: activeGamemodes
            };

            const response = await checkout(mw, FIGHTING_1V1_SINGLE, email, null, data);

            if (response?.checkoutUrl) {
                window.location.href = response.checkoutUrl;
            } else {
                alert(response?.message || "Checkout failed to initialize.");
                setBookingLoading(false);
            }
        } catch (err) {
            console.error("Booking Error:", err);
            alert("Something went wrong.");
            setBookingLoading(false);
        }
    };

    const gamemodes = [
        {
            id: 'Realistics',
            label: 'Realistics',
            subtitle: 'FIRST TO 10 GAMES',
            icon: Zap,
            color: 'bg-red-500'
        },
        {
            id: 'Boxfights',
            label: 'Boxfights',
            subtitle: 'FIRST TO 10 ROUNDS',
            icon: BoxSelect,
            color: 'bg-blue-500' // Placeholder
        },
        {
            id: 'Zonewars',
            label: 'Zonewars',
            subtitle: 'FIRST TO 10 ROUNDS',
            icon: Map,
            color: 'bg-green-500'
        }
    ];

    return (
        <section className="pt-24 md:pt-40 pb-20 px-4 relative min-h-[100%]">


            <div className="w-full max-w-7xl mx-auto text-center relative z-10">
                <div className="max-w-5xl mx-auto text-center" data-aos="fade-down">
                    <h1 className="text-2xl md:text-5xl font-black text-white mb-6 tracking-tighter italic uppercase">
                        Fighting Masterclass
                        <span className="block text-purple-500 mt-2">0-50k PR</span>
                    </h1>
                    <p className="text-gray-300 text-base md:text-xl mb-10 max-w-2xl mx-auto">
                        The most complete Fighting Masterclass by <span className="text-purple-500 font-bold italic">Deckzee & MariusCow</span>
                    </p>
                </div>

                {/* Main Video Section - Centered Original Design */}
                <div className="relative w-full max-w-4xl mx-auto rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 mt-5 group" data-aos="fade-up">
                    <div className="absolute inset-0 bg-purple-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                    <div className="aspect-video bg-black relative z-10">
                        <VideoPlayer
                            url="https://www.youtube.com/watch?v=ScOMC6-kq-c" // Mariuscow's showcase
                        />
                    </div>
                </div>

                {/* Split CTA Section: 1v1 Sessions Left | Masterclass Right */}
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-stretch mt-20 md:mt-[350px] text-left">

                    {/* LEFT: Box for 1v1 Sessions */}
                    <div className="flex-1" data-aos="fade-up">
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="h-full bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden flex flex-col shadow-2xl group"
                        >
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-20" />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                        <Zap size={24} className="text-purple-500" />
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                        Personal Coaching
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">
                                        1v1 <span className="text-[#A855F7]">MariusCow</span>
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black tracking-tighter text-purple-500">
                                            ${currentTotal}
                                        </span>
                                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">/ total</span>
                                    </div>
                                </div>

                                {/* Gamemode Selection List */}
                                <div className="space-y-3 mb-8">
                                    {gamemodes.map((mode) => {
                                        const qty = gamemodeQuantities[mode.id];
                                        const isSelected = qty > 0;

                                        return (
                                            <div
                                                key={mode.id}
                                                onClick={() => !isSelected && updateQuantity(mode.id, 1)}
                                                className={`relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300 group ${isSelected
                                                    ? 'bg-white/[0.03] border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                                                    : 'bg-transparent border-white/10 hover:border-white/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${isSelected
                                                        ? 'bg-purple-500 text-white shadow-lg scale-110'
                                                        : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                                                        }`}>
                                                        <mode.icon size={18} className={isSelected ? "fill-white" : ""} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold uppercase tracking-wide transition-colors text-sm ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
                                                            }`}>
                                                            {mode.label}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                                            {mode.subtitle}
                                                        </span>
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="flex items-center gap-3 relative z-20" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => updateQuantity(mode.id, -1)}
                                                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="text-base font-bold text-white w-4 text-center">{qty}</span>
                                                        <button
                                                            onClick={() => updateQuantity(mode.id, 1)}
                                                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 1v1 Buy Button */}
                                <motion.button
                                    onClick={handleBook}
                                    disabled={bookingLoading}
                                    whileHover={!bookingLoading ? { scale: 1.02 } : {}}
                                    whileTap={!bookingLoading ? { scale: 0.98 } : {}}
                                    className="w-full py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all shadow-xl mt-auto relative z-10"
                                >
                                    {bookingLoading ? "Processing..." : `BUY 1V1 - $${currentTotal} (${Object.values(gamemodeQuantities).reduce((a, b) => a + b, 0)}x FIRST TO 10)`}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT: Masterclass Lifetime Card */}
                    <div className="flex-1" data-aos="fade-up">
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="h-full bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden flex flex-col shadow-2xl group justify-between"
                        >
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-20" />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                        <Crown size={24} className="text-purple-500" />
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                        Lifetime Access
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">
                                        FIGHTING MASTERCLASS
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black tracking-tighter text-purple-500">
                                            $100
                                        </span>
                                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">/ once</span>
                                    </div>
                                </div>

                                <p className="text-gray-400 font-medium text-sm leading-relaxed mb-8">
                                    Unlock every Fighting Strategy in Fortnite and get access to MariusCows Personal Advanced Strategys
                                </p>

                                <BuyButton
                                    text="Buy Lifetime Access"
                                    className="w-full bg-[#A855F7] text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl hover:brightness-110 transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] mt-auto relative z-10"
                                />
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default Hero;
