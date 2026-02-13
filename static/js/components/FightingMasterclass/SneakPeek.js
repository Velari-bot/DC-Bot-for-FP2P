import React from "react";
import Content from "./Content";
import { ASSETS_URL } from "../../utils/constants";

const SneakPeek = () => {
    const included = [
        {
            title: "Reading opponent",
            description: "Learn how to predict what your opponent is about to do and win fights in a more efficient way",
            thumbnail: `${ASSETS_URL}/fighting/READING%20OPPONENT.jpg`
        },
        {
            title: "Aggressive Fighting",
            description: "Learn the best strategies when fighting aggressive and learn what strategies to implement in every situations when you are on the offensive",
            thumbnail: `${ASSETS_URL}/fighting/AGGRESSIVE%20FIGHTING.jpg`
        },
        {
            title: "Defensive Fighting",
            description: "Learn what to do in every defensive situation in Solo and in Duos. Learn what strategy to implement after you have healed up and the opponent has overcommitted",
            thumbnail: `${ASSETS_URL}/fighting/DEFENSIVE%20FIGHTING.jpg`
        },
        {
            title: "Fighting Strats",
            description: "Learn every good fighting strategy inside of Fortnite. Learn how to use them, when to use them and how to practice them. These strategies are what pros use without even thinking about it.",
            thumbnail: `${ASSETS_URL}/fighting/FIGHTING%20STRATS.jpg`
        },
        {
            title: "Optimal Edits",
            description: "Learn the most optimal edits and peaks to use when fighting and learn exactly how to practice and master them in the most efficient way possible",
            thumbnail: `${ASSETS_URL}/fighting/OPTIMAL%20EDITS.jpg`
        },
        {
            title: "Fighting Tips",
            description: "Receive the best 5 tips from one of the best fighters in the world MariusCow. He shares what he believes is what you need to do to become one of the best fighters in the world",
            thumbnail: `${ASSETS_URL}/fighting/fighting%20tipsss.jpg`
        },
        {
            title: "Fighting Rules",
            description: "Learn the most important fighting rules that every pro player sticks by in every situation they get into. The rules that every player needs to become a consistent fighter",
            thumbnail: `${ASSETS_URL}/fighting/FIGHTING%20RULES.jpg`
        }
    ];
    return (
        <>
            <section className="pt-20 md:pt-32 pb-10 px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-12" data-aos="zoom-out">
                        Inside the Fighting Masterclass
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
