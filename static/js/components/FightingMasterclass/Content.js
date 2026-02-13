import React from "react";

const Content = ({ thumbnail, title, description }) => {

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-[450px_1fr] gap-10 items-center" data-aos="fade-up">
                {/* Thumbnail */}
                <div className="relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                    <img src={thumbnail} alt={title} className="w-full aspect-video object-cover" />
                </div>

                {/* Content */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-3xl font-bold text-white tracking-tight">
                            {title}
                        </h3>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed font-medium">
                        {description}
                    </p>
                </div>
            </div>
        </>
    )
}

export default Content;
