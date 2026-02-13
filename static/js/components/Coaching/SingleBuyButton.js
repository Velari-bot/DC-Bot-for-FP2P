import React, { useState } from "react";
import { checkout } from "../../api/coaching";
import { motion } from "framer-motion";

import useMiddleware from "../../utils/useMiddleware";
import { auth } from "../../utils/firebase";

const SingleBuyButton = ({ text }) => {
    const middleware = useMiddleware()
    const [creating, setCreating] = useState(false);

    const createCheckout = async () => {
        if (creating) return;

        // Strict Login Enforcement
        if (!auth.currentUser) {
            window.location.href = '/claim';
            return;
        }

        setCreating(true);

        const user = auth.currentUser;
        const token = await user.getIdToken();
        const mw = useMiddleware(token);
        const email = user.email;

        const response = await checkout(mw, "single_coaching", email);
        if (response?.error) return setCreating(false);

        const checkoutUrl = response?.checkoutUrl;
        if (!checkoutUrl) return setCreating(false);

        window.location.href = checkoutUrl;
    }

    return (
        <>
            <motion.button
                className="inline-block bg-gradient-to-r from-[var(--yellow)] to-yellow-400 text-black font-bold text-xl px-16 py-5 rounded-full hover:from-yellow-400 hover:to-[var(--yellow)] transition-all shadow-[0_0_30px_rgba(250,204,36,0.5)] hover:shadow-[0_0_40px_rgba(250,204,36,0.7)]"
                onClick={() => createCheckout()}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
            >
                {text}
            </motion.button>

        </>
    )
}

export default SingleBuyButton