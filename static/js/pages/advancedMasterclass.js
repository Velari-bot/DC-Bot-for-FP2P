import React, { useEffect, useState, useRef } from "react";

import Hero from "../components/AdvancedMasterclass/Hero";
import WhatsIncluded from "../components/AdvancedMasterclass/WhatsIncluded";
import BuyButton from "../components/AdvancedMasterclass/BuyButton";
import AboutDeckzee from "../components/AdvancedMasterclass/AboutDeckzee";
import SneakPeek from "../components/AdvancedMasterclass/SneakPeek";

const AdvancedMasterclass = () => {
    useEffect(() => {
        document.title = "Advanced Masterclass | Fortnite Path To Pro";
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

export default AdvancedMasterclass;
