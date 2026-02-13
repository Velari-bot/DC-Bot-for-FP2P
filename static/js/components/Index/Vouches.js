import React from "react";

import Vouch from "./Vouch";
import { ASSETS_URL } from "../../utils/constants";

const vouches = [
    {
        name: 'DiegoPlayz',
        subtitle: 'FNCS Grand Finalist',
        title: 'Best coach I have ever worked with, it truly felt like my skill tripled just within weeks of coaching.',
        text: "Deckzee coached Diego in the Solo Series tournaments and also live coached him and his team to qualify to the Grand Finals",
        rating: 5,
        image: `${ASSETS_URL}/pfps/diegoplayz.png`,
        link: "https://x.com/DiegoPlayzfn"
    },
    {
        name: 'Rabbit',
        subtitle: 'Fortnite Player',
        title: "Tier 1 coach of the game",
        text: "Whenever I need to improve in some aspect of the game, I ask deckzee for help because I know he has the solution and the experience.",
        rating: 5,
        image: `${ASSETS_URL}/pfps/rabbit.png`,
        link: "https://x.com/rabbitfn"
    },
    {
        name: 'NoahWPlays',
        subtitle: 'Fortnite Pro & Creator',
        title: 'Deckzee knows what he is doing',
        text: "Deckzee is a very experienced player and has shown he can place well even on other regions. That alone shows he knows the game at a high level.",
        rating: 5,
        image: `${ASSETS_URL}/pfps/noahwplays.png`,
        link: "https://x.com/NoahWPlays"
    },
    {
        name: 'OliverOG',
        subtitle: 'FNCS Grand Finalist',
        title: 'Learned so much in such a short time period. He set us up perfectly for Grand-Finals',
        text: "Deckzee coached OliverOG and his trio for a whole season preparing for fncs and they qualified in their first game.",
        rating: 5,
        image: `${ASSETS_URL}/pfps/oliverog.png`,
        link: "https://x.com/oliverog"
    },
]

const Vouches = () => {

    return (
        <>
            <section className="py-20 md:py-32 px-4 relative z-10 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.5)_25%,rgba(0,0,0,0.5)_75%,transparent_100%)]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12" data-aos="zoom-out">
                        Vouches
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {vouches.map((vouch, index) => (
                            <Vouch
                                key={index}
                                rating={vouch.rating}
                                title={vouch.title}
                                subtitle={vouch.subtitle}
                                image={vouch.image}
                                name={vouch.name}
                                text={vouch.text}
                                link={vouch.link}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}

export default Vouches;