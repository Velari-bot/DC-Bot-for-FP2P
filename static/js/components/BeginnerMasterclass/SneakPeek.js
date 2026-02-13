import React from "react";
import Content from "./Content";
import { ASSETS_URL } from "../../utils/constants";

const SneakPeek = () => {

    const included = [
        {
            title: "Schedule",
            description: "I will share exactly what you should spend your time on. You will be able to apply this schedule no matter how much time you have on your day. Even if you only have 3 hours once a while to play. This schedule is made so you are as efficient as possible with your time. You can also apply the schedule if you have more hours but it is focused mostly to make sure you aren't spending your time on the wrong things. When you are at this level you can't waste the time you have.",
            thumbnail: `${ASSETS_URL}/thumbnails/schedule.jpg`
        },
        {
            title: "Fighting Tips",
            description: "There is many fighting tips online but they don't explain actually how to fight step by step. I will in this guide teach you exactly how to fight in a situation where you are keying your opponent in simple terms but used correctly can beat all levels of players.",
            thumbnail: `${ASSETS_URL}/thumbnails/fighting-tips.jpg`
        },
        {
            title: "Offspawn",
            description: "I will share different dropspots on the new map that you could use for Solos. I will share why each dropspot is good and explain what dropspot you should pick depending on your playstyle.",
            thumbnail: `${ASSETS_URL}/thumbnails/offspawn.jpg`
        },
        {
            title: "Solo Gameplan",
            description: "I have built a gameplan for each of my clients every time a new season comes out and even used it myself. This gameplan will be updated every time a new change happens in the game so you don't have to worry about making your own.",
            thumbnail: `${ASSETS_URL}/thumbnails/solos-gameplan.jpg`
        },
        {
            title: "Duo Gameplan",
            description: "The same as the solo gameplan but now I make sure that you have what you need for both of your teammates and a very simple and effective way of playing.",
            thumbnail: `${ASSETS_URL}/thumbnails/duos-gameplan.jpg`
        },
        {
            title: "Solo Endgame",
            description: "Endgames can be very chaotic so I explain it in a simple way so you can replicate it yourself. I also share tips and tricks that you can use in your endgames.",
            thumbnail: `${ASSETS_URL}/thumbnails/solos-endgames.jpg`
        },
        {
            title: "Duo Endgame",
            description: "Tips you and your duo can use in tournaments with a simple explanation of how you should play lowground, midground and highground.",
            thumbnail: `${ASSETS_URL}/thumbnails/duo-endgames.jpg`
        },
        {
            title: "Aim Routine",
            description: "This routine has everything you need to make your aim improve daily. If you stay consistent you should see major improvements.",
            thumbnail: `${ASSETS_URL}/thumbnails/aim-routine.jpg`
        },
        {
            title: "Mechanics Routine",
            description: "Very simple and effective routine that helps translate creative mechanics into real in-game mechanics. Stay consistent and you'll gain pro-level mechanics over time.",
            thumbnail: `${ASSETS_URL}/thumbnails/mechanics-routine.jpg`
        }
    ];


    return (
        <>
            <section className="pt-20 md:pt-32 pb-10 px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-12" data-aos="zoom-out">
                        Inside the Beginner Masterclass
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