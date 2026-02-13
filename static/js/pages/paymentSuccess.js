import React, { useEffect } from "react";
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle } from "lucide-react";

import { DISCORD } from "../utils/socials";

const PaymentSuccess = () => {

    const [searchParams] = useSearchParams();
    const coachingType = searchParams.get('item') || searchParams.get('coaching-type') || 'Coaching';
    const email = searchParams.get('email');

    // Auto-Sync on load to ensure purchase is recorded even if webhook fails
    useEffect(() => {
        if (email) {
            console.log("Triggering auto-sync for", email);
            fetch(`/api/sync-purchases?email=${encodeURIComponent(email)}`)
                .then(res => res.json())
                .then(data => console.log("Sync result:", data))
                .catch(err => console.error("Sync failed:", err));
        }
    }, [email]);

    const formatCoachingType = (type) => {
        if (type === '1-on-1' || type === '1:1') return '1:1';
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    useEffect(() => {
        document.title = "Payment Successful | Fortnite Path To Pro";
    }, []);

    return (
        <>
            <div className="bg-gradient-to-b from-gray-800 via-black to-black relative flex-1 min-h-[calc(100dvh-80px)]">
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] pointer-events-none"></div>

                <section className="pt-32 pb-16 px-4 flex items-center justify-center">
                    <div className="max-w-2xl mx-auto text-center">
                        <div data-aos="fade-down">
                            <div className="mb-8 flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#FACC24]/20 blur-3xl rounded-full"></div>
                                    <div className="relative bg-[#FACC24]/10 rounded-full p-6 border-2 border-[var(--yellow)]">
                                        <CheckCircle className="text-[var(--yellow)]" size={64} />
                                    </div>
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Payment Successful!
                            </h1>

                            <p className="text-gray-300 text-lg md:text-xl mb-8 leading-relaxed">
                                You have successfully purchased a{' '}
                                <span className="text-[var(--yellow)] font-semibold">
                                    {formatCoachingType(coachingType)}
                                </span>{' '}
                                Coaching Session. Check your email to claim your session and get
                                started.
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8 max-w-lg mx-auto" data-aos="fade-up">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Mail className="text-[var(--yellow)]" size={32} />
                                <h3 className="text-white text-xl font-bold">
                                    You're All Set!
                                </h3>
                            </div>
                            <p className="text-gray-400 mb-6">
                                To complete your enrollment, head over to your Dashboard to access your course or schedule your session.
                                <br />
                                <span className="text-[var(--yellow)] font-bold"> No further verification needed. </span>
                            </p>

                            <Link
                                to="/claim"
                                className="inline-flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-lg px-8 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg w-full"
                            >
                                Go to Dashboard
                            </Link>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <div data-aos="fade-right" className="flex">
                                <Link
                                    to="/"
                                    className="box-border inline-flex items-center justify-center bg-gradient-to-r from-[var(--yellow)] to-yellow-400 text-black font-bold text-lg px-10 py-4 rounded-full border border-transparent hover:from-yellow-400 hover:to-[var(--yellow)] transition-all duration-300 shadow-[0_0_20px_rgba(250,204,36,0.3)] hover:shadow-[0_0_30px_rgba(250,204,36,0.5)] transform hover:scale-105"
                                >
                                    Return Home
                                </Link>
                            </div>

                            <div data-aos="fade-left" className="flex">
                                <Link
                                    to="/coaching"
                                    className="bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-16 py-5 rounded-full border border-white/20 transition-all transform hover:scale-105 shadow-[0_0_10px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] duration-300"
                                >
                                    View All Coaching
                                </Link>
                            </div>
                        </div>

                        <p className="text-gray-400 text-sm mt-8" data-aos="fade-up">
                            Questions? DM "Deckzee" on Discord!
                        </p>
                    </div>
                </section >
            </div >
        </>
    );
};

export default PaymentSuccess;
