import React from "react";
import { StarIcon } from 'lucide-react'

const Vouch = ({ rating, text, title, image, name, subtitle, link }) => {

    return (
        <>
            <div
                className="bg-[#121212] rounded-2xl p-8 flex justify-between flex-col cursor-pointer"
                data-aos="zoom-in"
            >
                <div className="">
                    <div className="flex gap-1 mb-4">
                        {[...Array(rating)].map((_, i) => (
                            <StarIcon
                                key={i}
                                className="text-[var(--yellow)] fill-[var(--yellow)]"
                                size={20}
                            />
                        ))}
                    </div>
                    <h3 className="text-white text-xl font-bold mb-4">
                        "{title}"
                    </h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">{text}</p>
                </div>
                <a
                    className="flex items-center gap-3 transition-all duration-300 hover:-translate-y-1"
                    href={link}
                    target="_blank"
                >
                    <img
                        src={image}
                        alt={name}
                        className="w-12 h-12 rounded-full"
                    />
                    <div>
                        <p className="text-white font-semibold">{name}</p>
                        <p className="text-gray-500 text-sm">{subtitle}</p>
                    </div>
                </a>
            </div>
        </>
    )
}

export default Vouch