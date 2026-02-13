import React, { useState } from 'react';
import { useUploads } from '../../contexts/UploadContext';
import { Minimize2, Maximize2, X, UploadCloud, CheckCircle, AlertTriangle, Copy, Loader, ChevronUp, ChevronDown } from 'lucide-react';

const UploadWidget = () => {
    const { uploads, removeUpload, isMinimized, setIsMinimized } = useUploads();
    const activeUploads = Object.values(uploads);

    if (activeUploads.length === 0) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("URL Copied!");
    };

    if (isMinimized) {
        return (
            <div
                className="fixed bottom-4 right-4 bg-zinc-900 border border-[var(--yellow)]/30 text-white rounded-full px-4 py-3 shadow-2xl z-[100] cursor-pointer hover:bg-zinc-800 transition flex items-center gap-3"
                onClick={() => setIsMinimized(false)}
            >
                <div className="relative">
                    <Loader className={`w-5 h-5 text-[var(--yellow)] ${activeUploads.some(u => u.status !== 'completed' && u.status !== 'error') ? 'animate-spin' : ''}`} />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--yellow)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--yellow)]"></span>
                    </span>
                </div>
                <span className="text-xs font-bold text-[var(--yellow)]">{activeUploads.filter(u => u.status !== 'completed' && u.status !== 'error').length} Loading</span>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col font-sans animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="bg-[#111] p-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UploadCloud size={16} className="text-[var(--yellow)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Upload Manager ({activeUploads.length})</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(true)} className="text-gray-500 hover:text-white"><Minimize2 size={16} /></button>
                </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-2 bg-black/50 custom-scrollbar">
                {activeUploads.map(upload => (
                    <div key={upload.id} className="bg-[#1a1a1a] p-3 rounded-lg border border-white/5 relative group">
                        <button
                            onClick={() => removeUpload(upload.id)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                            <X size={14} />
                        </button>

                        <div className="mb-2 pr-4">
                            <h4 className="text-xs font-bold text-gray-300 truncate mb-0.5">{upload.originalName}</h4>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded
                                    ${upload.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                        upload.status === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--yellow)]/10 text-[var(--yellow)]'}
                                `}>
                                    {upload.status}
                                </span>
                                {upload.status === 'completed' && (
                                    <button
                                        onClick={() => copyToClipboard(upload.url)}
                                        className="text-[10px] flex items-center gap-1 text-gray-500 hover:text-white transition"
                                    >
                                        <Copy size={10} /> Copy URL
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {(upload.status === 'compressing' || upload.status === 'uploading') && (
                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--yellow)] transition-all duration-300 shadow-[0_0_10px_rgba(255,193,7,0.5)]"
                                    style={{ width: `${upload.progress}%` }}
                                />
                            </div>
                        )}

                        {upload.error && (
                            <p className="text-[10px] text-red-500 mt-2 bg-red-500/5 p-1 rounded border border-red-500/10">
                                {upload.error}
                            </p>
                        )}

                        {upload.status === 'completed' && (
                            <div className="mt-2 text-[10px] text-gray-500 italic">
                                Ready to attach. Go to lesson to apply.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UploadWidget;
