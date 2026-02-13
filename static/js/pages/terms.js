import React, { useEffect } from "react";

const Terms = () => {
    useEffect(() => {
        document.title = "Terms of Service | Fortnite Path To Pro";
    }, []);

    return (
        <div className="min-h-screen w-full relative bg-[#0A0A0A] text-white">
            <div className="max-w-4xl mx-auto px-6 py-32">
                <h1 className="text-4xl md:text-5xl font-black mb-8 text-center">
                    Terms of Service
                </h1>
                <p className="text-gray-400 text-center mb-12">
                    Last updated: February 2026
                </p>

                <div className="space-y-8 text-gray-300">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="leading-relaxed">
                            By accessing and using Fortnite Path To Pro ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                        <p className="leading-relaxed">
                            Fortnite Path To Pro provides digital coaching services, masterclass video content, and 1:1 coaching sessions for Fortnite players. Our services are designed to help players improve their skills and competitive performance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                        <p className="leading-relaxed mb-4">
                            To access certain features of our Service, you must create an account. You are responsible for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Maintaining the confidentiality of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us immediately of any unauthorized use of your account</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Payment Terms</h2>
                        <p className="leading-relaxed mb-4">
                            All purchases are processed through Stripe. By making a purchase, you agree to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Provide accurate and complete payment information</li>
                            <li>Pay all charges at the prices in effect when incurred</li>
                            <li>Pay any applicable taxes associated with your purchase</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Digital Content Access</h2>
                        <p className="leading-relaxed">
                            Upon successful payment, you will receive access to your purchased content. Masterclass content is provided for personal, non-commercial use only. You may not share, distribute, or resell access to our content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Coaching Sessions</h2>
                        <p className="leading-relaxed mb-4">
                            For 1:1 coaching sessions:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Sessions must be scheduled within 30 days of purchase</li>
                            <li>Rescheduling is allowed with 24 hours notice</li>
                            <li>No-shows may result in forfeiture of the session</li>
                            <li>Sessions are conducted via Discord or other agreed platforms</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
                        <p className="leading-relaxed">
                            All content, including but not limited to videos, graphics, text, and logos, is owned by Fortnite Path To Pro and protected by copyright laws. Unauthorized reproduction or distribution is prohibited.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
                        <p className="leading-relaxed">
                            Fortnite Path To Pro is not responsible for any in-game performance outcomes. Our coaching and content are for educational purposes only. We do not guarantee any specific results from using our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
                        <p className="leading-relaxed">
                            We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Contact Information</h2>
                        <p className="leading-relaxed">
                            For questions about these Terms of Service, please contact us through our Discord server or social media channels.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Terms;
