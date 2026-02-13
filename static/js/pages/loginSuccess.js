import React, { useEffect } from "react";
import { useSearchParams, Link } from 'react-router-dom';

import { CheckCircle, ExternalLink } from 'lucide-react';
import { DISCORD } from "../utils/socials";

const LoginSuccess = () => {
    useEffect(() => {
        document.title = "Login Successful | Fortnite Path To Pro";
    }, []);

    return (
        <>
            <div className="bg-gradient-to-b from-gray-800 via-black to-black relative flex-1 min-h-[calc(100dvh-80px)] flex justify-center items-center">
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] pointer-events-none"></div>

                <section className="pt-32 pb-16 px-4 flex items-center justify-center min-h-[calc(100vh-200px)]">
                    <div className="max-w-2xl mx-auto text-center">
                        {/* Success Icon */}
                        <div className="mb-8 flex justify-center" data-aos="fade-down">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#00ff00]/20 blur-3xl rounded-full"></div>
                                <div className="relative bg-[#00ff00]/10 rounded-full p-6 border-2 border-[#00ff00]">
                                    <CheckCircle className="text-[#00ff00]" size={64} />
                                </div>
                            </div>
                        </div>

                        {/* Success Message */}
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" data-aos="fade-down">
                            Discord Connected Successfully!
                        </h1>

                        <p className="text-gray-300 text-lg md:text-xl mb-8 leading-relaxed" data-aos="fade-up">
                            You have successfully connected your Discord account. Please
                            head over to our Discord Server to claim your Coaching Session.
                        </p>

                        {/* CTA Button */}
                        <div data-aos="fade-up">
                            <a
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-[#5865F2] to-[#7289DA] text-white font-bold text-xl px-12 py-5 rounded-full hover:from-[#7289DA] hover:to-[#5865F2] transition-all shadow-[0_0_30px_rgba(88,101,242,0.5)] hover:shadow-[0_0_40px_rgba(88,101,242,0.7)] transform hover:scale-105 duration-300"
                                href={DISCORD}
                                target="_blank"
                                rel="noopener noreferrer"

                            >
                                Join Discord Server
                                <ExternalLink size={24} />
                            </a>
                        </div>

                        {/* Additional Info */}
                        <p className="text-gray-400 text-sm mt-8" data-aos="fade-up">
                            Questions? DM "Deckzee" on Discord!
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
};

export default LoginSuccess;
