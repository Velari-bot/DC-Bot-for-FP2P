import React, { useEffect, useState, useRef } from "react";

import Hero from "../components/IntermediateMasterclass/Hero";
import WhatsIncluded from "../components/IntermediateMasterclass/WhatsIncluded";
import BuyButton from "../components/IntermediateMasterclass/BuyButton";
import AboutDeckzee from "../components/IntermediateMasterclass/AboutDeckzee";
import SneakPeek from "../components/IntermediateMasterclass/SneakPeek";

const IntermediateMasterclass = () => {
    useEffect(() => {
        document.title = "Intermediate Masterclass | Fortnite Path To Pro";
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

export default IntermediateMasterclass;
