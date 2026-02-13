import React from "react";
import { ASSETS_URL } from "../../utils/constants";

const included = [
    `${ASSETS_URL}/thumbnails/high-elo-fighting.jpg`,
    `${ASSETS_URL}/thumbnails/discipline.jpg`,
    `${ASSETS_URL}/thumbnails/duo-coms.jpg`,
    `${ASSETS_URL}/thumbnails/deckzee-kovaaks.jpg`,
    `${ASSETS_URL}/thumbnails/solos-gameplan.jpg`,
    `${ASSETS_URL}/thumbnails/mechanics-routine.jpg`
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
                            <>
                                <img src={image} key={index} alt="" className="aspect-video w-full h-full rounded-md" data-aos="zoom-in" />
                            </>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}

export default WhatsIncluded;