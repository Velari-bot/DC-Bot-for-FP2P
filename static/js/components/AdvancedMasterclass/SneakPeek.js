import React from "react";
import Content from "./Content";
import { ASSETS_URL } from "../../utils/constants";

const SneakPeek = () => {

  const included = [
    {
      title: "Advanced Schedule",
      description: "A simple but extremely effective schedule designed to make sure you're spending your time on what truly matters. This prevents wasted practice and keeps your focus on the most important areas for improvement.",
      thumbnail: `${ASSETS_URL}/thumbnails/schedule.jpg`
    },
    {
      title: "High Elo Fighting",
      description: "You'll learn the most important things to focus on when fighting in high Elo lobbies. This skill is critical in important games and the improvements will directly show in tournament performance.",
      thumbnail: `${ASSETS_URL}/thumbnails/high-elo-fighting.jpg`
    },
    {
      title: "Advanced Offspawn",
      description: "The most important offspawn tips for the new season, including how to play surge correctly and how to choose the right spot for the current meta.",
      thumbnail: `${ASSETS_URL}/thumbnails/offspawn.jpg`
    },
    {
      title: "Advanced Solo Gameplan",
      description: "Exactly what goes through my head from start to finish in a solo match. This is the exact gameplan I personally use, and it will be updated after every major meta change.",
      thumbnail: `${ASSETS_URL}/thumbnails/solos-gameplan.jpg`
    },
    {
      title: "Duo Low Ground",
      description: "A complete breakdown of lowground mastery, including small details that change how it should be played and when it's best to take lowground in the current meta.",
      thumbnail: `${ASSETS_URL}/thumbnails/duo-lowground.jpg`
    },
    {
      title: "Duo Mid Ground",
      description: "You'll learn advanced midground tactics such as pre-edits, timing windows, and how to properly prepare for taking high or low ground.",
      thumbnail: `${ASSETS_URL}/thumbnails/duo-midground.jpg`
    },
    {
      title: "Duo High Ground",
      description: "You'll learn advanced midground tactics such as pre-edits and how to properly prepare for taking high or low ground.",
      thumbnail: `${ASSETS_URL}/thumbnails/duo-highground.jpg`
    },
    {
      title: "Communication for Duos",
      description: "Learn exactly how to communicate in offspawn and endgames to avoid misunderstandings and make faster, clearer decisions under pressure.",
      thumbnail: `${ASSETS_URL}/thumbnails/duo-coms.jpg`
    },
    {
      title: "Mentality & Confidence",
      description: "Build the confidence and winning mindset needed to compete at the highest level. This focuses on shifting from passive play to playing to win every game.",
      thumbnail: `${ASSETS_URL}/thumbnails/mentality.jpg`
    },
    {
      title: "Discipline",
      description: "What it truly takes to reach the next level and go pro — including routines, sacrifices, and learning to love the boring but necessary work.",
      thumbnail: `${ASSETS_URL}/thumbnails/discipline.jpg`
    },
    {
      title: "My Kovaak's Routine",
      description: "The exact Kovaak's warm-up routine I use daily. This routine is updated with every meta change and normally costs $15 — included free in this masterclass.",
      thumbnail: `${ASSETS_URL}/thumbnails/deckzee-kovaaks.jpg`
    },
    {
      title: "Advanced Mechanics Routine",
      description: "An advanced mechanics routine focused on fundamentals with added tools to accelerate your mechanical growth efficiently.",
      thumbnail: `${ASSETS_URL}/thumbnails/mechanics-routine.jpg`
    }
  ];


  return (
    <>
      <section className="pt-20 md:pt-32 pb-10 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-12" data-aos="zoom-out">
            Inside the Advanced Masterclass
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