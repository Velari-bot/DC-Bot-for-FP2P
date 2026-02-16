import React from 'react'
import { TrophyIcon, MedalIcon, AwardIcon, StarIcon } from 'lucide-react'
import PastClient from './PastClient'
import { ASSETS_URL } from '../../utils/constants'

const clients = [
    {
        name: "Higgs",
        description: "3x 2nd FNCS",
        pfp: `${ASSETS_URL}/pfps/higgs.png`,
        link: "https://x.com/BatmanBugha"
    },
    {
        name: "KalGamer",
        description: "4x Duo FNCS Winner",
        pfp: `${ASSETS_URL}/pfps/kal.png`,
        link: "https://x.com/realKalgamer710"
    },
    {
        name: "OliverOG",
        description: "11th Duo FNCS",
        pfp: `${ASSETS_URL}/pfps/oliverog.png`,
        link: "https://x.com/OliverOG"
    },
    {
        name: "Blake",
        description: "3rd Trio FNCS",
        pfp: `${ASSETS_URL}/pfps/blake.png`,
        link: "https://x.com/blakeps"
    }
]

const PastClients = () => {
    return (
        <section className="-mt-10 md:-mt-[148px] py-12 md:pt-32 md:pb-40 px-4 relative z-10 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.25)_20%,rgba(0,0,0,0.25)_80%,transparent)]">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-6xl font-black text-center mb-4 tracking-tighter uppercase italic drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" data-aos="zoom-in">
                    <span className="text-white">Past </span>
                    <span className="text-[var(--yellow)]">Clients</span>
                </h2>
                <p className="text-white/90 text-center mb-10 text-lg md:text-xl font-bold tracking-wide drop-shadow-lg" data-aos="zoom-in">
                    Pro Players That I Have Coached
                </p>
                <div className="flex justify-center items-start gap-10 md:gap-16 flex-wrap -mt-5">
                    {clients.map((client, index) => (
                        <PastClient
                            key={index}
                            name={client.name}
                            description={client.description}
                            pfp={client.pfp}
                            link={client.link}
                        />
                    ))}
                </div>
                <div className="text-center mt-12 mb-4 -mt-[-30px]">
                    <p className="text-white/40 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] whitespace-nowrap pointer-events-none" data-aos="fade-up">
                        And many more
                    </p>
                </div>
            </div>
        </section>
    )
}


export default PastClients