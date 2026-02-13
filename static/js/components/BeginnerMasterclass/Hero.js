import React from "react";
import { motion } from "framer-motion";
import VideoPlayer from "../VideoPlayer";
import BuyButton from "./BuyButton";

const Hero = () => {
    return (
        <>
            <section className="pt-24 md:pt-40 pb-20 px-4 relative min-h-[100%]">
                <div className="w-full max-w-7xl mx-auto text-center relative z-10">
                    <div className="max-w-5xl mx-auto text-center" data-aos="fade-down">
                        <h1 className="text-2xl md:text-5xl font-black text-white mb-6 tracking-tighter italic uppercase">
                            Beginner Masterclass
                            <span className="block text-[var(--green)] mt-2">0-1k PR</span>
                        </h1>
                        <p className="text-gray-300 text-base md:text-xl mb-10 max-w-2xl mx-auto">
                            You will learn the most important lessons about Fortnite Competitive in a language that you can understand.
                        </p>
                    </div>

                    {/* Main Video Section */}
                    <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 mt-5 group" data-aos="fade-up">
                        <div className="aspect-video bg-black">
                            <VideoPlayer
                                url="https://www.youtube.com/watch?v=FFMQVj9vyvc"
                            />
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-20 md:mt-[350px]">
                        {/* Monthly Plan */}
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="bg-black rounded-[2.5rem] border border-white/10 p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group"
                            data-aos="fade-up"
                        >
                            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[var(--green)]/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="text-center mb-8 relative z-10">
                                <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">
                                    Monthly Plan
                                </h3>
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-[var(--green)] text-6xl font-black tracking-tighter">
                                        $15
                                    </span>
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">/ month</span>
                                </div>
                            </div>

                            <BuyButton
                                text="Buy Now"
                                billingCycle="month"
                                className="w-full py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl relative z-10"
                            />
                        </motion.div>

                        {/* Yearly Plan */}
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="bg-black border-2 border-[var(--green)]/20 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden flex flex-col justify-between shadow-2xl group"
                            data-aos="fade-up"
                        >
                            <div className="absolute top-6 right-6 bg-[var(--green)] text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest z-20">
                                SAVE 17%
                            </div>

                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[var(--green)]/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="text-center mb-8 relative z-10">
                                <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">
                                    Yearly Plan
                                </h3>

                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-[var(--green)] text-6xl font-black tracking-tighter">
                                        $150
                                    </span>
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">/ year</span>
                                </div>

                                <p className="text-gray-500 text-[10px] mt-4 font-black uppercase tracking-[0.2em] opacity-60">
                                    Normal Price $180/year
                                </p>
                            </div>

                            <BuyButton
                                text="Buy Now"
                                billingCycle="year"
                                className="w-full py-4 bg-[var(--green)] text-black font-black text-sm uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[var(--green)]/20 relative z-10"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Hero;