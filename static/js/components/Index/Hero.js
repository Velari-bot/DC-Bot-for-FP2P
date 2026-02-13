import React from "react";
import VideoPlayer from "../VideoPlayer";
import { Link, useLocation } from 'react-router-dom'
import { ASSETS_URL } from '../../utils/constants'

const pfps = [
    `${ASSETS_URL}/pfps/deckzee.png`,
    `${ASSETS_URL}/pfps/diegoplayz.png`,
    `${ASSETS_URL}/pfps/higgs.png`,
    `${ASSETS_URL}/pfps/kal.png`,
    `${ASSETS_URL}/pfps/oliverog.png`,
    `${ASSETS_URL}/pfps/blake.png`,
]

const Hero = () => {
    return (
        <section className="pt-24 md:pt-40 pb-24 px-4 relative min-h-[100%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/40 via-transparent to-transparent">

            <div className="max-w-6xl mx-auto text-center relative z-10">
                <h1 className="text-2xl md:text-5xl font-black mb-12 leading-tight drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] tracking-tighter italic uppercase" data-aos="fade-down">
                    <span className="text-white block">Welcome to</span>
                    <span className="block text-[var(--yellow)] mt-2">Fortnite Path To Pro</span>
                </h1>

                {/* Main Video Section */}
                <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 mt-5 group" data-aos="fade-up">
                    <div className="aspect-video bg-black">
                        <VideoPlayer
                            url="https://www.youtube.com/watch?v=fHoOzid9HqQ"
                        />
                    </div>
                </div>


            </div>
        </section>
    );
};

export default Hero;
