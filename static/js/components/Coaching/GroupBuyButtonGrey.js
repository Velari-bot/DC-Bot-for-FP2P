import React, { useState } from "react";
import { checkout } from "../../api/coaching";

import useMiddleware from "../../utils/useMiddleware";
import { auth } from "../../utils/firebase";

const GroupBuyButtonGrey = ({ text }) => {
    const middleware = useMiddleware()
    const [creating, setCreating] = useState(false);

    const createCheckout = async () => {
        if (creating) return;

        if (!auth.currentUser) {
            window.location.href = '/claim';
            return;
        }

        setCreating(true);

        const user = auth.currentUser;
        const token = await user.getIdToken();
        const mw = useMiddleware(token);

        const response = await checkout(mw, "group_coaching", user.email);
        if (response?.error) return setCreating(false);

        const checkoutUrl = response?.checkoutUrl;
        if (!checkoutUrl) return setCreating(false);

        window.location.href = checkoutUrl;
    }


    return (
        <>
            <button
                className="inline-block bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-16 py-5 rounded-full border border-white/20 transition-all transform hover:scale-105 shadow-[0_0_10px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] duration-300"
                onClick={() => createCheckout()}
            >
                {text}
            </button>

        </>
    )
}

export default GroupBuyButtonGrey;