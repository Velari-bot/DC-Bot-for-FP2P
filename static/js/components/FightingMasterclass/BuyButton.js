import React, { useState } from "react";
import { checkout } from "../../api/coaching";
import useMiddleware from "../../utils/useMiddleware";
import { auth } from "../../utils/firebase";
import { COURSE_IDS } from "../../utils/purchaceURLS";
import { motion } from "framer-motion";

/**
 * Fighting Masterclass Buy Button
 * Triggers Stripe checkout for the Fighting Masterclass
 */
const BuyButton = ({ text, billingCycle = 'month', className }) => {
    const middleware = useMiddleware();
    const [loading, setLoading] = useState(false);

    const handleBuy = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (loading) return;

        // Check if user is logged in
        if (!auth.currentUser) {
            window.location.href = '/claim';
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;
            const email = user ? user.email : null;
            const token = await user.getIdToken();
            const mw = useMiddleware(token);

            const response = await checkout(mw, false, email, COURSE_IDS.FIGHTING, { billingCycle });

            if (response?.checkoutUrl) {
                window.location.href = response.checkoutUrl;
            } else {
                console.error("Checkout failed:", response);
                alert(response?.message || "Checkout failed to initialize. Please try again.");
                setLoading(false);
            }
        } catch (err) {
            console.error("Stripe Checkout Error:", err);
            alert("Something went wrong with the payment system.");
            setLoading(false);
        }
    };

    const defaultClass = "inline-block bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold text-lg md:text-xl px-8 md:px-16 py-5 rounded-full hover:from-purple-800 hover:to-purple-600 transition-all shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:shadow-[0_0_40px_rgba(147,51,234,0.7)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider";

    return (
        <motion.button
            onClick={handleBuy}
            disabled={loading}
            className={className || defaultClass}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
        >
            {loading ? (
                <div className="flex items-center gap-3 justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                </div>
            ) : (
                text
            )}
        </motion.button>
    );
};

export default BuyButton;
