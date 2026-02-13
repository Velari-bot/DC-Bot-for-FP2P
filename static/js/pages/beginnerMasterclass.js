import React, { useEffect, useState, useRef } from "react";

import Hero from "../components/BeginnerMasterclass/Hero";
import WhatsIncluded from "../components/BeginnerMasterclass/WhatsIncluded";
import BuyButton from "../components/BeginnerMasterclass/BuyButton";
import AboutDeckzee from "../components/BeginnerMasterclass/AboutDeckzee";
import SneakPeek from "../components/BeginnerMasterclass/SneakPeek";

const BeginnerMasterclass = () => {
    useEffect(() => {
        document.title = "Beginner Masterclass | Fortnite Path To Pro";
    }, []);

    return (
        <div className="min-h-screen w-full relative bg-[#0A0A0A] premium-bg">
            <div className="relative z-10">
                <Hero />

                <div className="px-5 pb-32">
                    <WhatsIncluded />

                    <AboutDeckzee />
                    <SneakPeek />

                </div>
            </div>
        </div>
    );
};

export default BeginnerMasterclass;
