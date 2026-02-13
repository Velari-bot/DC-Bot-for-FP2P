import React, { useState } from "react";
import FAQ from "./FAQ";

const FAQs = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqItems = [
        {
            question: 'What makes these Masterclasses different from others?',
            answer: "Deckzee is a Pro Fortnite player who has gone through every stage of competitive Fortnite. That means he knows exactly what players need to do to reach the next level. Every Masterclass — except the Fighting Masterclass — is continuously updated after major meta changes or important updates. You'll always be learning strategies that actually work in the current season. You'll also gain access to a private friend group (except the Fighting Masterclass) with players who have similar achievements and PR, creating an environment you can't find anywhere else."
        },
        {
            question: "What if I don't think the Masterclass is useful?",
            answer: "You can cancel your subscription at any time if you feel the Masterclass isn't right for you. Deckzee strongly encourages you to send feedback explaining why it wasn't helpful, so he can improve the experience and make sure it doesn't happen again. The Fighting Masterclass is a one-time purchase and is non-refundable."
        },
        {
            question: 'Will each Masterclass get updated?',
            answer: "Yes. Every Masterclass except the Fighting Masterclass is updated after major meta changes, seasonal shifts, and important gameplay updates. Updates are made whenever strategies need adjusting, ensuring you're always prepared before your next tournament. The Fighting Masterclass is a one-time purchase and is already perfected to help players improve at any level."
        },
        {
            question: "Can I buy the Advanced Masterclass even if I don't have 10K PR?",
            answer: "Each Masterclass is designed for a specific PR range. If your PR is significantly lower, higher-level Masterclasses may be too advanced and less effective for your current understanding. Deckzee carefully tailors every game plan and strategy to fit the intended PR range as perfectly as possible."
        },
        {
            question: 'What is different between each Masterclass?',
            answer: "Each Masterclass is built specifically for players at that level, covering different decision-making priorities, different tournament strategies, and different mistakes to fix at each stage. This ensures you're learning exactly what matters most for your current progression. The Fighting Masterclass is different — it is designed exclusively to help players improve their fighting skills."
        },
        {
            question: 'What happens after this season?',
            answer: "Deckzee updates every Masterclass (except the Fighting Masterclass) to fit the next season's meta. He makes sure you always have the tools needed to place consistently every season, staying competitive throughout your entire career. In other words — he's with you every step of the way, all the way until you achieve your goals."
        },
        {
            question: 'Will you add more content?',
            answer: "Yes. Deckzee continuously adds content he believes is important for players at each level (except the Fighting Masterclass). Players are encouraged to give feedback and suggest ideas they believe would improve the Masterclass experience."
        }
    ];

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    return (
        <>
            <section className="pt-20 md:pt-32 pb-10 px-4 relative z-10 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.4)_25%,rgba(0,0,0,0.4)_75%,transparent_100%)] mt-10">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4" data-aos="fade-down">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-400 text-center text-lg mb-12" data-aos="fade-up">
                        Everything you need to know about our masterclasses
                    </p>

                    <div className="space-y-4">
                        {faqItems.map((item, index) => (
                            <FAQ
                                key={index}
                                question={item.question}
                                answer={item.answer}
                                index={index}
                                openIndex={openIndex}
                                onClick={() => toggleFAQ(index)}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}

export default FAQs