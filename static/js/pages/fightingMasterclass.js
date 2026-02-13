import React, { useEffect } from "react";
import Hero from "../components/FightingMasterclass/Hero";
import WhatsIncluded from "../components/FightingMasterclass/WhatsIncluded";
import BuyButton from "../components/FightingMasterclass/BuyButton";
import AboutDeckzee from "../components/FightingMasterclass/AboutDeckzee";
import SneakPeek from "../components/FightingMasterclass/SneakPeek";

const FightingMasterclass = () => {

    useEffect(() => {
        document.title = "Fighting Masterclass | 0-50k PR Training";
    }, []);

    return (
        <div className="min-h-screen w-full relative bg-[#0A0A0A] text-white premium-bg">
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

export default FightingMasterclass;
