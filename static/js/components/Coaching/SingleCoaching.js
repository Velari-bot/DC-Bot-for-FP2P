import React from "react";
import { PlayCircle, Swords, MapPin } from "lucide-react";

import SingleBuyButton from "./SingleBuyButton";

const SingleCoaching = () => {


    return (
        <>
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" data-aos="fade-down">
                            1:1 Coaching
                        </h2>
                        <p className="text-gray-400 text-lg max-w-3xl mx-auto" data-aos="fade-up">
                            A full hour where my entire focus is on fixing your bad habits and creating better ones.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="text-center" data-aos="zoom-in">
                            <div className="w-16 h-16 bg-[#FACC24]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PlayCircle className="text-[var(--yellow)]" size={28} />
                            </div>
                            <h3 className="text-white text-xl font-bold mb-2">
                                VOD Reviewing
                            </h3>
                            <p className="text-gray-400">
                                Analyze games from myself or yourself with full focus on teaching you the game
                            </p>
                        </div>

                        <div className="text-center" data-aos="zoom-in">
                            <div className="w-16 h-16 bg-[#FACC24]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Swords className="text-[var(--yellow)]" size={28} />
                            </div>
                            <h3 className="text-white text-xl font-bold mb-2">
                                1v1
                            </h3>
                            <p className="text-gray-400">
                                Fight a pro with full focus on finding your bad habits and creating better ones
                            </p>
                        </div>

                        <div className="text-center" data-aos="zoom-in">
                            <div className="w-16 h-16 bg-[#FACC24]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="text-[var(--yellow)]" size={28} />
                            </div>
                            <h3 className="text-white text-xl font-bold mb-2">
                                Gameplan
                            </h3>
                            <p className="text-gray-400">
                                Make a bulletproof gameplan for your landing spot that fits your playstyle
                            </p>
                        </div>
                    </div>

                    <div className="text-center" data-aos="zoom-out">
                        <SingleBuyButton text={"Book 1:1 Coaching"} />
                    </div>
                    <p className="text-gray-400 text-sm text-center mt-4" data-aos="fade-up">
                        Discord access granted automatically after purchase
                    </p>
                </div>
            </section>
        </>
    )
}

export default SingleCoaching;