import React from "react";
import { Image } from "antd";
import "antd/dist/reset.css";

const Achievement = ({ name, image, link }) => {
  return (
    <div data-aos="zoom-in">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-[#FACC24]/50 transition-all group cursor-pointer">
        <div className="overflow-hidden aspect-video relative">
          <Image
            src={image}
            alt={name}
            preview={{
              mask: <span className="text-white font-medium">Click to view</span>,
            }}
            width="100%"
            height="100%"
            className="transition-transform duration-300 group-hover:scale-110 object-cover"
          />
        </div>
      </div>

      <a
        href={link}
        className="text-white font-semibold text-2xl hover:text-[var(--yellow)] transition-colors duration-300 relative inline-block w-fit group/title mt-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        {name}
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--yellow)] transition-all duration-300 group-hover/title:w-full"></span>
      </a>
    </div>
  );
};

export default Achievement;