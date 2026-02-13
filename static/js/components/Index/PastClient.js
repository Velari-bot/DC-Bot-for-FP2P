import React from "react";

const PastClient = ({ pfp, name, description, link }) => {

    return (
        <>
            <a
                href={link}
                className="flex transition-all duration-300 hover:opacity-60"
                target="_blank"
                data-aos="zoom-in"
            >
                <img
                    src={pfp}
                    alt={name}
                    className="h-16 w-16 rounded-full border-2 border-[var(--yellow)]/20 shadow-lg"
                />

                <div className="ml-3 w-full flex justify-center items-start flex-col">
                    <h2 className="text-white font-bold text-lg leading-tight">
                        {name}
                    </h2>
                    <p className="text-white/70 text-sm">
                        {description}
                    </p>
                </div>
            </a>
        </>
    )
}

export default PastClient;