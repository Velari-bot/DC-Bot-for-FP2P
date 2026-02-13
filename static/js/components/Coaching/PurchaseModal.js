import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";

const PurchaseModal = ({ isOpen, onClose, product, onConfirm }) => {
    const [step, setStep] = useState(1); // 1: Input, 2: Show ID
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedId, setGeneratedId] = useState("");
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        // Generate flexible ID (e.g. 8 chars)
        const id = Math.random().toString(36).substr(2, 9).toUpperCase();
        setGeneratedId(id);

        try {
            // Notify Discord via backend proxy
            await fetch('/api/purchase-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    id,
                    product
                })
            });
            setStep(2);
        } catch (err) {
            console.error(err);
            // Even if webhook fails, proceed so user isn't stuck
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-[#FACC24]/20 rounded-2xl w-full max-w-md p-6 relative shadow-[0_0_50px_rgba(250,204,36,0.1)]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-2">
                    {step === 1 ? "Enter Your Details" : "Save Your Auth ID"}
                </h2>

                {step === 1 ? (
                    <form onSubmit={handleGenerate} className="mt-6">
                        <div className="mb-6">
                            <label className="block text-gray-400 text-sm mb-2">Display Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FACC24] transition-colors"
                                placeholder="Enter your username or real name"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-[#FACC24] text-black font-bold text-lg py-3 rounded-xl hover:bg-yellow-400 transition-all transform hover:scale-[1.02] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? "Processing..." : "Continue"}
                        </button>
                    </form>
                ) : (
                    <div className="mt-6">
                        <p className="text-gray-300 text-sm mb-4">
                            Please save this ID. It is required to verify your purchase.
                        </p>
                        <div
                            onClick={handleCopy}
                            className="bg-black/50 border border-[#FACC24]/50 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-[#FACC24] transition-colors mb-6 group"
                        >
                            <span className="text-xl font-mono text-[#FACC24] font-bold tracking-wider">
                                {generatedId}
                            </span>
                            <div className="text-gray-400 group-hover:text-white transition-colors">
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </div>
                        </div>

                        <button
                            onClick={() => onConfirm(generatedId, name)}
                            className="w-full bg-[#FACC24] text-black font-bold text-lg py-3 rounded-xl hover:bg-yellow-400 transition-all transform hover:scale-[1.02]"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseModal;
