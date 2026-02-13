import React from "react";

const Content = ({ thumbnail, title, description }) => {

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8 items-center" data-aos="zoom-in">
                {/* Thumbnail */}
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={thumbnail} alt={title} className="w-full aspect-video object-cover" />
                </div>

                {/* Content */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-3xl font-bold text-white">
                            {title}
                        </h3>
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </>
    )
}

export default Content;