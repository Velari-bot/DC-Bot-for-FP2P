import React from "react";

import SingleBuyButton from "./SingleBuyButton";

const Promo = () => {

    return (
        <>
            <section className="py-32 px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <div data-aos="fade-up">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" data-aos="fade-up">
                            Ready to Get Help from Pro with Years of Experience?
                        </h2>
                        <p className="text-gray-300 text-xl mt-3 mb-8 max-w-2xl mx-auto" data-aos="fade-up">
                            Book now to get advise that makes a difference.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <div data-aos="fade-up">
                            <SingleBuyButton text={"Book 1:1 Coaching"} />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm text-center mt-4" data-aos="fade-up">
                        Discord access granted automatically after purchase
                    </p>
                </div>
            </section>
        </>
    )
}

export default Promo;