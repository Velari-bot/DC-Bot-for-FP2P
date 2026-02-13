import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const AnnouncementBar = ({ onClose }) => {
    return (
        <div className="bg-zinc-900 border-b border-red-500/20 text-white py-3 px-4 relative z-[60] shadow-sm animate-fade-in">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                <AlertTriangle size={20} className="text-red-500 shrink-0" />
                <p className="text-center text-xs md:text-sm font-medium tracking-wide text-zinc-200">
                    The Podia version of our website is shutting down at the end of this month.
                    We’ve canceled all existing Podia subscriptions.
                    To keep access, you’ll need to resubscribe using our new system.
                </p>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default AnnouncementBar;
