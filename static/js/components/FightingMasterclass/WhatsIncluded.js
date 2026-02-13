import React from "react";
import { ASSETS_URL } from "../../utils/constants";
import { motion } from "framer-motion";


const included = [
    `${ASSETS_URL}/fighting/READING%20OPPONENT.jpg`,
    `${ASSETS_URL}/fighting/AGGRESSIVE%20FIGHTING.jpg`,
    `${ASSETS_URL}/fighting/DEFENSIVE%20FIGHTING.jpg`,
    `${ASSETS_URL}/fighting/FIGHTING%20STRATS.jpg`,
    `${ASSETS_URL}/fighting/OPTIMAL%20EDITS.jpg`,
    `${ASSETS_URL}/fighting/fighting%20tipsss.jpg`,
    "https://assets.fortnitepathtopro.com/content/mechanics%20routine.jpg",
    "https://assets.fortnitepathtopro.com/content/aim%20routine%20(1).jpg",
    "https://assets.fortnitepathtopro.com/content/deckzeekovaaks%20(1).jpg"
]
const WhatsIncluded = () => {

    return (
        <>
            <section className="pt-20 md:pt-32 pb-0 md:pb-0 px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12" data-aos="zoom-out">
                        What's Included
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-40">
                        {included.map((image, index) => (
                            <motion.img
                                src={image}
                                key={index}
                                alt=""
                                className="aspect-video w-full h-full rounded-2xl border border-white/5 shadow-2xl"
                                data-aos="zoom-in"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}

export default WhatsIncluded;
