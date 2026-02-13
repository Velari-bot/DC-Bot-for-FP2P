import React from "react";
import { UsersIcon, CheckIcon, DollarSign, Eye } from "lucide-react";

import GroupBuyButton from "./GroupBuyButton";

const GroupCoaching = () => {

    return (
        <>
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" data-aos="fade-down">
                            Group Coaching
                        </h2>
                        <p className="text-gray-400 text-lg max-w-3xl mx-auto" data-aos="fade-up">
                            Join a private call with other passionate, competitive players who share simular goals.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="text-center" data-aos="zoom-in">
                            <div className="w-16 h-16 bg-[#FACC24]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UsersIcon className="text-[var(--yellow)]" size={28} />
                            </div>
                            <h3 className="text-white text-xl font-bold mb-2">
                                Ask Questions
                            </h3>
                            <p className="text-gray-400">
                                You have the chance to ask a Pro any questions you would like
                            </p>
                        </div>

                        <div className="text-center" data-aos="zoom-in">
                            <div className="w-16 h-16 bg-[#FACC24]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="text-[var(--yellow)]" size={28} />
                            </div>
                            <h3 className="text-white text-xl font-bold mb-2">
                                Affordable price
                            </h3>
                            <p className="text-gray-400">
                                Get high quality coaching with an affordable price
                            </p>
                        </div>

                        <div className="text-center" data-aos="zoom-in">
                            <div className="w-16 h-16 bg-[#FACC24]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Eye className="text-[var(--yellow)]" size={28} />
                            </div>
                            <h3 className="text-white text-xl font-bold mb-2">
                                Learn mistakes from others
                            </h3>
                            <p className="text-gray-400">
                                You can prevent mistakes by watching others make them first
                            </p>
                        </div>
                    </div>

                    <div className="text-center" data-aos="zoom-out">
                        <GroupBuyButton text={"Join Group Coaching"} />
                    </div>
                </div>
            </section>
        </>
    )
}

export default GroupCoaching;