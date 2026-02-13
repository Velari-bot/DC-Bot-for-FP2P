import React from "react";
import Content from "./Content";
import { ASSETS_URL } from "../../utils/constants";

const SneakPeek = () => {

    const included = [
        {
            title: "Intermediate Schedule",
            description: "This schedule gives you a specific amount of time to spend every day along with percentage-based recommendations for the rest of your time. It's stricter than the beginner one and designed for serious improvement. If you follow this consistently, you are guaranteed to see results over time.",
            thumbnail: `${ASSETS_URL}/thumbnails/schedule.jpg`
        },
        {
            title: "How to Fight in Solos",
            description: "I will VOD review solo gameplay and explain in detail how to set up fights and every small decision I make. This advanced approach will make fights feel more controlled and strategic, like playing chess instead of guessing your next move.",
            thumbnail: `${ASSETS_URL}/thumbnails/fighting-in-solos.jpg`
        },
        {
            title: "How to Fight in Duos",
            description: "This focuses on duo gameplay and how to properly set up fights using pressure, angles, and sprays. You'll learn how to end fights quicker and build true chemistry with your duo using high-level strategies.",
            thumbnail: `${ASSETS_URL}/thumbnails/fighting-in-duos.jpg`
        },
        {
            title: "Intermediate Offspawn",
            description: "I will share the best dropspots on the new map for solos, explaining why each one works and which fits your playstyle. Each spot will be broken down with detailed upsides and downsides.",
            thumbnail: `${ASSETS_URL}/thumbnails/offspawn.jpg`
        },
        {
            title: "Intermediate Solo Gameplan",
            description: "This gameplan is based on real tournament gameplay and covers everything from jumping out of the bus to winning the game. Following this removes greedy mistakes and keeps you ahead of players without a proper plan.",
            thumbnail: `${ASSETS_URL}/thumbnails/solos-gameplan.jpg`
        },
        {
            title: "Intermediate Duo Gameplan",
            description: "This duo gameplan is built to make the game feel as easy as possible through smart, passive play. It's especially effective for final tournament games where aggressive play becomes risky.",
            thumbnail: `${ASSETS_URL}/thumbnails/duos-gameplan.jpg`
        },
        {
            title: "Solo Endgames",
            description: "A step-by-step guide that takes you from the start of endgame all the way to the win. You'll learn when to take height, how to rotate, and how to avoid confusing decisions in high Elo lobbies.",
            thumbnail: `${ASSETS_URL}/thumbnails/solos-endgames.jpg`
        },
        {
            title: "Duo Low Ground",
            description: "Everything you need to know about playing lowground correctly — when to take it, how to play it, and how to avoid common mistakes that throw games.",
            thumbnail: `${ASSETS_URL}/thumbnails/duo-lowground.jpg`
        },
        {
            title: "Duo High Ground",
            description: "A complete highground strategy built from two years of top-level experience. You'll learn how to take height, control it through every meta, and close out games using a simple, repeatable system.",
            thumbnail: `${ASSETS_URL}/thumbnails/duo-highground.jpg`
        },
        {
            title: "Intermediate Mechanics Routine",
            description: "An advanced mechanics routine used throughout my career that focuses on fundamentals while accelerating your mechanical improvement in a structured way.",
            thumbnail: `${ASSETS_URL}/thumbnails/mechanics-routine.jpg`
        },
        {
            title: "Intermediate Aim Routine",
            description: "This aim routine is updated for the current meta and weapons, covering only the most important scenarios. You'll know exactly how long to spend on each to avoid wasting time.",
            thumbnail: `${ASSETS_URL}/thumbnails/aim-routine.jpg`
        }
    ];

    return (
        <>
            <section className="pt-20 md:pt-32 pb-10 px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-12" data-aos="zoom-out">
                        Inside the Intermediate Masterclass
                    </h2>

                    <div className="space-y-16">
                        {included.map((item, index) => (
                            <Content
                                key={index}
                                title={item.title}
                                thumbnail={item.thumbnail}
                                description={item.description}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}

export default SneakPeek;