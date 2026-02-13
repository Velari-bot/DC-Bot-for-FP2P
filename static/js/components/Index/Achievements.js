import React from "react";
import Achievement from "./Achievement";
import { ASSETS_URL } from '../../utils/constants';

const achievements = [
    {
        name: "Nvidia Cup - $3000",
        image: "https://assets.fortnitepathtopro.com/thumbnails/2nd_nvdia_cup.jpg",
        link: "https://fortnitetracker.com/events/epicgames_S39_NvidiaCup_EU?window=S39_NvidiaCup_EU&page=0#2"
    },
    {
        name: "Solo Series - $4000",
        image: "https://assets.fortnitepathtopro.com/thumbnails/8th_finals.jpg",
        link: "https://fortnitetracker.com/events/epicgames_S39_SoloSeriesCupFinal_EU?window=S39_SoloSeriesCupFinal_Day1_EU&sm=S39_SoloSeriesCupFinal_CumulativeLeaderboardDef&page=0#8"
    },
    {
        name: "FNCS Grand Finals - $5000",
        image: `${ASSETS_URL}/achievements/1.png`,
        link: "https://fortnitetracker.com/events/epicgames_S28_FNCS_Major1_GrandFinals_EU?window=S28_FNCS_Major1_GrandFinalDay2_EU&sm=S28_FNCS_Major1_GrandFinalDay2_CumulativeLeaderboardDef&page=0#14"
    },
    {
        name: "FNCS Grand Finals - $4000",
        image: `${ASSETS_URL}/achievements/4.png`,
        link: "https://fortnitetracker.com/events/epicgames_S29_FNCS_Major2_GrandFinals_EU?window=S29_FNCS_Major2_GrandFinalDay2_EU&sm=S29_FNCS_Major2_GrandFinalDay2_CumulativeLeaderboardDef&page=0#17"
    },
    {
        name: "FNCS Grand Finals - $2500",
        image: `${ASSETS_URL}/achievements/2.png`,
        link: "https://fortnitetracker.com/events/epicgames_S30_FNCS_Major3_GrandFinals_EU?window=S30_FNCS_Major3_GrandFinalDay2_EU&sm=S30_FNCS_Major3_GrandFinalDay2_CumulativeLeaderboardDef&page=0#27"
    },
    {
        name: "FNCS Grand Finals - $3000",
        image: `${ASSETS_URL}/achievements/3.png`,
        link: "https://fortnitetracker.com/events/epicgames_S25_FNCS_Major3_GrandFinals_EU?window=S25_FNCS_Major3_GrandFinals_EU_Day1&sm=S25FNCS_GrandFinalsFloatingLeaderboardDef&page=0#30"
    },
    {
        name: "FNCS Division 1 Finals - $1650",
        image: `${ASSETS_URL}/achievements/5.png`,
        link: "https://fortnitetracker.com/events/epicgames_S37_FNCSDivisionalCup_Division1_EU?window=S37_FNCSDivisionalCup_Division1_Week3Final_EU&page=0#4"
    },
    {
        name: "FNCS Div Cup Finals - $1200",
        image: "https://assets.fortnitepathtopro.com/achievements/9th_Div_finals.jpg",
        link: "https://fortnitetracker.com/events/epicgames_S33_FNCSDivisionalCup_Division1_EU?window=S33_FNCSDivisionalCup_Division1_Week5Final_EU&page=0#9"
    },
    {
        name: "FNCS Showdown - $1000",
        image: `${ASSETS_URL}/achievements/8.png`,
        link: "https://fortnitetracker.com/events/epicgames_S35_FNSCShowdown_EU?window=S35_FNCSShowdown_Event3Round2_EU&page=0#2"
    },
    {
        name: "FNCS Showdown - $300",
        image: `${ASSETS_URL}/achievements/9.png`,
        link: "https://fortnitetracker.com/events/epicgames_S35_FNSCShowdown_EU?window=S35_FNCSShowdown_Event2Round2_EU&page=0#5"
    }
]

const Achievements = () => {
    return (
        <>
            <section className="-mt-20 md:-mt-32 py-20 md:py-32 px-4 relative z-10 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.4)_25%,rgba(0,0,0,0.4)_75%,transparent_100%)]">
                <div className="max-w-6xl mx-auto">
                    <div className="w-full flex justify-center items-center">
                        <a
                            className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-center mb-12 transition-all duration-300 relative inline-block group/title"
                            href={"https://fortnitetracker.com/profile/all/38489ae208f44f53b3a790e922ed967d/events"}
                            target="_blank"
                            data-aos="zoom-out"
                        >
                            <span className="text-white">Deckzee's </span><span className="text-[var(--yellow)]">Achievements</span>
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--yellow)] transition-all duration-300 group-hover/title:w-full"></span>
                        </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {achievements.map((achievement, index) => (
                            <Achievement
                                key={index}
                                name={achievement.name}
                                image={achievement.image}
                                link={achievement.link}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}

export default Achievements