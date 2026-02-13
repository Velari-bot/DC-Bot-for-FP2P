import React from "react";
import { TrophyIcon } from "lucide-react";
import BuyButton from "./BuyButton";
import { ASSETS_URL } from "../../utils/constants";

const AboutDeckzee = () => {
    const placements = [
        {
            tournament: 'FNCS Showdown Finals',
            placement: '2nd Place'
        },
        {
            tournament: 'FNCS Division Finals',
            placement: '4th Place'
        },
        {
            tournament: 'Nvidia Cup',
            placement: '2nd Place'
        },
        {
            tournament: 'FNCS Grand Finals',
            placement: '14th Place'
        },
        {
            tournament: 'FNCS Grand Finals',
            placement: '17th Place'
        },
    ]
    return (
        <section className="pt-0 md:pt-0 pb-0 md:pb-0 px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

                    <div className="relative mb-8 lg:mb-0" data-aos="fade-right">
                        <div className="absolute inset-0 bg-[#00ff00]/20 blur-3xl rounded-full" />
                        <img
                            src={`${ASSETS_URL}/pfps/deckzee.png`}
                            alt="Deckzee"
                            className="relative rounded-2xl w-full max-w-xs lg:max-w-full mx-auto shadow-2xl border border-white/10"
                        />
                    </div>

                    <div className="order-1 lg:order-2 text-center lg:text-left flex flex-col justify-center" data-aos="fade-left">

                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                            Learn from a Pro with <span className="text-[var(--green)]">5 years of experience</span>
                        </h2>

                        <p className="text-gray-300 text-base md:text-lg mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
                            I've competed for over 5 years and been through all levels of Fortnite. Starting from the buttom rising to the top i have went through many challenges. You will have the chance to learn from me and get help making your challenges feel easy. I have never had an unsatisfied client and i'm not going to start here.
                        </p>

                        <div className="max-w-xl mx-auto lg:mx-0 text-left">
                            {/* Benefits List */}
                            <div className="space-y-3 md:space-y-4 mb-10 ml-4">
                                {placements.map((placement, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00ff00]/20 flex items-center justify-center mt-0.5">
                                            <TrophyIcon className="text-[var(--green)]" size={16} />
                                        </div>
                                        <div>
                                            <span className="text-white font-semibold">
                                                {placement.placement}
                                            </span>
                                            <span className="text-gray-400">
                                                {' '}
                                                - {placement.tournament}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <BuyButton text={"Buy Now"} />
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutDeckzee;
