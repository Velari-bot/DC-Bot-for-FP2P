import React, { useState } from "react";
import { checkout } from "../../api/coaching";
import useMiddleware from "../../utils/useMiddleware";
import { CheckCircle2 } from "lucide-react";
import { auth } from "../../utils/firebase";

const CoachingPurchase = () => {
    const middleware = useMiddleware();
    const [creating, setCreating] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("single_coaching");
    const [user, setUser] = useState(auth.currentUser);

    // Listen to Auth Changes to keep button state reactive
    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
        return () => unsubscribe();
    }, []);

    const createCheckout = async () => {
        if (!user) {
            // Redirect to Claim/Login Page if not logged in
            window.location.href = "/claim";
            return;
        }

        if (creating) return;
        setCreating(true);

        // Pass user email to checkout for pre-fill
        const token = await user.getIdToken();
        const mw = useMiddleware(token);
        const response = await checkout(mw, selectedPlan, user.email);
        if (response?.error) return setCreating(false);

        const checkoutUrl = response?.checkoutUrl;
        if (!checkoutUrl) return setCreating(false);

        window.location.href = checkoutUrl;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1 Hour Option */}
                <div
                    onClick={() => setSelectedPlan("single_coaching")}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 relative ${selectedPlan === "single_coaching"
                        ? "border-[var(--yellow)] bg-[var(--yellow)]/10"
                        : "border-white/10 hover:border-white/20 bg-white/5"
                        }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-white text-lg">1 Hour</span>
                        {selectedPlan === "single_coaching" && (
                            <CheckCircle2 className="text-[var(--yellow)]" size={20} />
                        )}
                    </div>
                    <div className="text-2xl font-bold text-[var(--yellow)]">$150</div>
                    <div className="text-sm text-gray-400 mt-1">Single Session</div>
                </div>

                {/* 3 Hour Bundle */}
                <div
                    onClick={() => setSelectedPlan("coaching_bundle_3h")}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 relative ${selectedPlan === "coaching_bundle_3h"
                        ? "border-[var(--yellow)] bg-[var(--yellow)]/10"
                        : "border-white/10 hover:border-white/20 bg-white/5"
                        }`}
                >
                    <div className="absolute -top-3 right-4 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                        SAVE $50
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-white text-lg">3 Hour Bundle</span>
                        {selectedPlan === "coaching_bundle_3h" && (
                            <CheckCircle2 className="text-[var(--yellow)]" size={20} />
                        )}
                    </div>
                    <div className="text-2xl font-bold text-[var(--yellow)]">$400</div>
                    <div className="text-sm text-gray-400 mt-1">Split hours however you want</div>
                </div>
            </div>

            {/* Flexibility Note */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-3">
                <div className="bg-[var(--yellow)]/20 p-1.5 rounded-full mt-0.5">
                    <CheckCircle2 size={14} className="text-[var(--yellow)]" />
                </div>
                <p className="text-sm text-gray-300">
                    <span className="text-white font-bold">Flexible Usage:</span> Use your 3 hours all at once or split them into separate 1-hour sessions whenever you want.
                </p>
            </div>

            <button
                className="w-full bg-gradient-to-r from-[var(--yellow)] to-yellow-400 text-black font-bold text-xl py-4 rounded-full hover:from-yellow-400 hover:to-[var(--yellow)] transition-all shadow-[0_0_30px_rgba(250,204,36,0.3)] hover:shadow-[0_0_40px_rgba(250,204,36,0.5)] transform hover:scale-[1.02] duration-300"
                onClick={createCheckout}
                disabled={creating}
            >
                {creating ? "Processing..." : !user ? "Sign In to Purchase" : selectedPlan === "single_coaching" ? "Buy Now" : "Get 3 Hour Bundle"}
            </button>
        </div>
    );
};

export default CoachingPurchase;
