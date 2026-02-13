import React, { useEffect } from "react";

const Privacy = () => {
    useEffect(() => {
        document.title = "Privacy Policy | Fortnite Path To Pro";
    }, []);

    return (
        <div className="min-h-screen w-full relative bg-[#0A0A0A] text-white">
            <div className="max-w-4xl mx-auto px-6 py-32">
                <h1 className="text-4xl md:text-5xl font-black mb-8 text-center">
                    Privacy Policy
                </h1>
                <p className="text-gray-400 text-center mb-12">
                    Last updated: February 2026
                </p>

                <div className="space-y-8 text-gray-300">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                        <p className="leading-relaxed mb-4">
                            We collect information you provide directly to us, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Account information (email address, name)</li>
                            <li>Payment information (processed securely through Stripe)</li>
                            <li>Communication data (Discord username, support inquiries)</li>
                            <li>Usage data (pages visited, features used)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                        <p className="leading-relaxed mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Process payments and provide access to purchased content</li>
                            <li>Schedule and conduct coaching sessions</li>
                            <li>Send important updates about your purchases</li>
                            <li>Improve our services and user experience</li>
                            <li>Respond to your questions and support requests</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Payment Processing</h2>
                        <p className="leading-relaxed">
                            All payments are processed through Stripe. We do not store your full credit card information on our servers. Stripe's privacy policy governs their handling of your payment data. For more information, visit Stripe's privacy policy at stripe.com/privacy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
                        <p className="leading-relaxed">
                            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>
                        <p className="leading-relaxed mb-4">
                            We use the following third-party services:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Firebase:</strong> Authentication and database services</li>
                            <li><strong>Stripe:</strong> Payment processing</li>
                            <li><strong>Discord:</strong> Community and coaching session platform</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking</h2>
                        <p className="leading-relaxed">
                            We use cookies and similar technologies to maintain your session, remember your preferences, and analyze how our service is used. You can control cookies through your browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
                        <p className="leading-relaxed">
                            We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data by contacting us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Your Rights</h2>
                        <p className="leading-relaxed mb-4">
                            Depending on your location, you may have the right to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Access your personal data</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Object to data processing</li>
                            <li>Export your data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
                        <p className="leading-relaxed">
                            Our Service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent and believe your child has provided us with personal information, please contact us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Policy</h2>
                        <p className="leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
                        <p className="leading-relaxed">
                            If you have questions about this Privacy Policy, please contact us through our Discord server or social media channels.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
