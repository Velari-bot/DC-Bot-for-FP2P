import React from "react";
import { Link, useLocation } from 'react-router-dom';

import { TIKTOK, TWITTER, YOUTUBE, TWITCH, DISCORD } from "../../utils/socials"
import { ASSETS_URL } from "../../utils/constants"

const Footer = () => {
    const location = useLocation();

    // Hide footer on course player and admin pages
    if (location.pathname.startsWith('/course/') || location.pathname.startsWith('/admin')) return null;

    return (
        <>
            <footer className="bg-[#0A0A0A] border-t border-white/10 pt-8 pb-12 px-4">
                <div className="max-w-4xl mx-auto flex flex-col justify-center items-center">
                    <Link
                        to="/"
                        className="flex justify-center items-center mb-4 transition-all duration-300 hover:opacity-60 w-fit">
                        <img
                            src={`${ASSETS_URL}/assets/logo.png`}
                            alt="Fortnite Path To Pro"
                            className="h-10 w-10"
                        />
                        <h2 className="ml-1 text-white font-bold text-lg">
                            Fortnite Path To Pro
                        </h2>
                    </Link>

                    {/* Legal Links */}
                    <div className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm mb-4">
                        <Link to="/terms" className="hover:text-white transition-colors duration-300">Terms of Service</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors duration-300">Privacy Policy</Link>
                        <Link to="/refunds" className="hover:text-white transition-colors duration-300">Refund Policy</Link>
                    </div>

                    <div className="flex gap-4 justify-center items-center mb-6">
                        <a href={TIKTOK} className="text-gray-400 hover:text-white transition-colors duration-300 text-[20px]" target="_blank">
                            <i className="bi bi-tiktok"></i>
                        </a>
                        <a href={TWITTER} className="text-gray-400 hover:text-white transition-colors duration-300 text-[20px]" target="_blank">
                            <i className="bi bi-twitter-x"></i>
                        </a>
                        <a href={YOUTUBE} className="text-gray-400 hover:text-white transition-colors duration-300 text-[20px]" target="_blank">
                            <i className="bi bi-youtube"></i>
                        </a>
                        <a href={TWITCH} className="text-gray-400 hover:text-white transition-colors duration-300 text-[20px]" target="_blank">
                            <i className="bi bi-twitch"></i>
                        </a>
                        <a href={DISCORD} className="text-gray-400 hover:text-white transition-colors duration-300 text-[20px]" target="_blank">
                            <i className="bi bi-discord"></i>
                        </a>
                    </div>
                </div>

                <div className="mx-6 md:mx-28 text-center border-t border-white/10 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-white/50 text-sm mb-4 md:mb-0">
                            © {new Date().getFullYear()} Fortnite Path To Pro. All rights reserved.
                        </p>
                        {/* <div className="flex space-x-4 text-sm text-white/50">
                            <Link to="/privacy-policy" className="hover:text-white transition-colors duration-300">Privacy Policy</Link>
                            <Link to="/terms" className="hover:text-white transition-colors duration-300">Terms of Service</Link>
                        </div> */}
                        <a href="https://X.com/WrenchDevelops" className="text-sm text-white/50 text-right hover:text-white transition-colors duration-300" target="_blank">
                            Developed By <i className="bi bi-twitter-x"></i> WrenchDevelops
                        </a>
                    </div>
                    {/* <div className="mt-4 w-full flex md:justify-end justify-center">
                        <a href="https://X.com/StefanDevelops" className="text-sm text-white/50 text-right hover:text-white transition-colors duration-300" target="_blank">
                            Developed By <i className="bi bi-twitter-x"></i> StefanDevelops
                        </a>
                    </div> */}
                </div>
            </footer>
        </>
    )
}

export default Footer;

// <div className="mt-4 w-full flex md:justify-center justify-center">
//     <a href="https://X.com/StefanDevelops" className="text-sm text-gray-400 text-center hover:text-white transition-colors duration-300" target="_blank">
//         Developed By <i className="bi bi-twitter-x"></i> StefanDevelops
//     </a>
// </div>