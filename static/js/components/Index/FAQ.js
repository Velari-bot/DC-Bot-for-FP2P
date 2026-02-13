import React from "react";
import { ChevronDown } from "lucide-react"

const FAQ = ({ question, openIndex, index, onClick, answer }) => {

    return (
        <>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-[#FACC24]/30" data-aos="zoom-in">
                <button onClick={onClick} className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors duration-300 hover:bg-white/5">
                    <span className="text-white font-semibold text-lg pr-4">
                        {question}
                    </span>
                    <ChevronDown className={`text-[var(--yellow)] flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} size={24} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="px-6 pb-5 pt-2">
                        <p className="text-gray-300 leading-relaxed">{answer}</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default FAQ