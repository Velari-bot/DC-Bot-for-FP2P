import React from "react";
import { TrophyIcon } from "lucide-react";
import BuyButton from "./BuyButton";
import { ASSETS_URL } from "../../utils/constants";

const AboutDeckzee = () => {
    const placements = [
        {
            tournament: 'FNCS Grand Finals',
            placement: '1st'
        },
        {
            tournament: 'FNCS Globals 2025',
            placement: '2nd'
        },
        {
            tournament: 'FNCS Grand Finals',
            placement: '3rd'
        },
        {
            tournament: 'FNCS Grand Finals',
            placement: '3rd'
        },
        {
            tournament: 'FNCS Grand Finals',
            placement: '4th'
        },
    ]
    return (
        <section className="pt-0 md:pt-0 pb-0 md:pb-0 px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

                    <div className="relative mb-8 lg:mb-0" data-aos="fade-right">
                        <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />
                        <img
                            src={`https://assets.fortnitepathtopro.com/fighting/marius.jpg`}
                            alt="Marius"
                            className="relative rounded-3xl w-full max-w-xs aspect-square object-cover mx-auto shadow-2xl border border-white/10"
                        />
                    </div>

                    <div className="order-1 lg:order-2 text-center lg:text-left flex flex-col justify-center" data-aos="fade-left">


                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight italic">
                            MariusCow <span className="text-purple-500">The Best Fighter in the world</span>
                        </h2>

                        <p className="text-gray-300 text-base md:text-lg mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
                            I'm MariusCow and i have been a Fragger for my entire career. I have been playing Tokens every day through my whole career and learned how to defeat some of the best fighters in the world like Shxrk. I have learned exactly what fighting strategies works and doesn't. Fighting is very simple if you know exactly what strategy to implement in every situation and i'm here to teach you that inside the Fighting Masterclass
                        </p>
                        <div className="max-w-xl mx-auto lg:mx-0 text-left">
                            {/* Benefits List */}
                            <div className="space-y-3 md:space-y-4 mb-10 ml-4">
                                {placements.map((placement, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center mt-0.5">
                                            <TrophyIcon className="text-purple-500" size={16} />
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

                            <BuyButton text={"Buy Fighting Masterclass"} />
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutDeckzee;
