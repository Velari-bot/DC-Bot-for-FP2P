import React, { useEffect } from "react";

const Refunds = () => {
    useEffect(() => {
        document.title = "Refund Policy | Fortnite Path To Pro";
    }, []);

    return (
        <div className="min-h-screen w-full relative bg-[#0A0A0A] text-white">
            <div className="max-w-4xl mx-auto px-6 py-32">
                <h1 className="text-4xl md:text-5xl font-black mb-8 text-center">
                    Refund Policy
                </h1>
                <p className="text-gray-400 text-center mb-12">
                    Last updated: February 2026
                </p>

                <div className="space-y-8 text-gray-300">
                    {/* Important Notice Banner */}
                    <section className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-6">
                        <h2 className="text-2xl font-black text-red-400 mb-4 text-center">⚠️ IMPORTANT: NO REFUNDS ⚠️</h2>
                        <p className="leading-relaxed text-center text-lg font-semibold text-white">
                            All sales are final. We do not offer refunds under any circumstances for any of our products or services.
                        </p>
                    </section>

                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Policy Summary</h2>
                        <p className="leading-relaxed text-lg">
                            <strong className="text-red-400">All purchases are non-refundable.</strong> This applies to all products and services including, but not limited to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                            <li>Masterclass Courses (Beginner, Intermediate, Advanced, Fighting)</li>
                            <li>1:1 Coaching Sessions</li>
                            <li>Seasonal Coaching Packages</li>
                            <li>Any other digital products or services</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">All Products & Services</h2>
                        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-red-500/30">
                            <h3 className="text-lg font-bold text-red-400 mb-3">No Refunds Policy</h3>
                            <p className="leading-relaxed mb-4">
                                By purchasing any product or service from Fortnite Path To Pro, you acknowledge and agree that:
                            </p>
                            <ul className="list-disc list-inside space-y-3 ml-4">
                                <li><strong>All sales are final</strong> – No refunds will be issued for any reason.</li>
                                <li><strong>No exceptions</strong> – This policy applies regardless of usage, satisfaction level, or circumstances.</li>
                                <li><strong>Digital products</strong> – Due to the nature of digital content, refunds cannot be processed once access is granted.</li>
                                <li><strong>Coaching sessions</strong> – Scheduled or completed sessions are non-refundable.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Not 100% Happy With Your Purchase?</h2>
                        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[var(--yellow)]/30">
                            <h3 className="text-lg font-bold text-[var(--yellow)] mb-3">Contact Deckzee on Discord</h3>
                            <p className="leading-relaxed mb-4">
                                If you are 100% not happy with your purchase, you may reach out directly to <strong className="text-[var(--yellow)]">Deckzee on Discord</strong>.
                            </p>

                            {/* Discord Username Box */}
                            <div className="bg-[var(--yellow)]/10 rounded-lg p-4 border border-[var(--yellow)]/30 mb-4">
                                <p className="text-center">
                                    <span className="text-gray-400 text-sm">Discord Username:</span>
                                    <br />
                                    <span className="text-[var(--yellow)] font-bold text-xl">deckzee</span>
                                </p>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <p className="leading-relaxed">
                                    <strong>Please note:</strong> Contacting Deckzee does not guarantee a refund. He will personally review your situation and take it into consideration on a <strong>case-by-case basis</strong>. Any decision made by Deckzee regarding your request is final.
                                </p>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-gray-400">
                                    Send a DM to <span className="text-[var(--yellow)] font-bold">deckzee</span> on Discord with your purchase details and reason for your request.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Chargebacks & Disputes</h2>
                        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
                            <p className="leading-relaxed mb-4">
                                Initiating a chargeback or payment dispute without first contacting us will result in:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Immediate suspension of your account and access to all purchased content</li>
                                <li>We will dispute all chargebacks and provide evidence of your purchase and access</li>
                                <li>Potential ban from future purchases</li>
                            </ul>
                            <p className="leading-relaxed mt-4 text-gray-400">
                                We strongly encourage you to DM Deckzee on Discord before taking any action with your bank or payment provider.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Agreement</h2>
                        <p className="leading-relaxed">
                            By completing a purchase on Fortnite Path To Pro, you confirm that you have read, understood, and agree to this No Refunds policy. You acknowledge that all sales are final and non-refundable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
                        <p className="leading-relaxed">
                            If you have any questions about this policy before making a purchase, please DM <strong className="text-[var(--yellow)]">Deckzee</strong> on Discord. We're happy to clarify anything before you buy.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Refunds;
