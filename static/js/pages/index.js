import React, { useEffect, useState, useRef } from "react";

import Hero from "../components/Index/Hero";
import PastClients from "../components/Index/PastClients";
import QuickBuy from "../components/Index/QuickBuy";
import Achievements from "../components/Index/Achievements";
import Vouches from "../components/Index/Vouches";
import FAQs from "../components/Index/FAQs";

const Index = () => {
    useEffect(() => {
        document.title = "Fortnite Path To Pro";
    }, []);

    return (
        <>
            <div className="min-h-screen w-full relative bg-[#0A0A0A] premium-bg">
                <Hero />
                <PastClients />
                <QuickBuy />
                <Achievements />
                <Vouches />
                <FAQs />
            </div>
        </>
    );
};

export default Index;
