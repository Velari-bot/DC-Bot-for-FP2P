import React, { useEffect } from "react";

import Hero from "../components/Coaching/Hero";
import AboutDeckzee from "../components/Coaching/AboutDeckzee";


const Coaching = () => {
    useEffect(() => {
        document.title = "Coaching | Fortnite Path To Pro";
    }, []);

    return (
        <div className="min-h-screen w-full relative bg-[#0A0A0A] premium-bg">
            <div className="relative z-10">
                <Hero />

                <div className="px-5 space-y-32 pb-32">
                    <AboutDeckzee />
                </div>
            </div>
        </div>
    );
};

export default Coaching;
