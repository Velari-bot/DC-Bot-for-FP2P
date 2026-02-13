import React, { useEffect, useState } from 'react';
import { db } from '../../utils/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Loader2, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'systemLogs'), orderBy('timestamp', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            },
            (error) => {
                console.error("Logs permission error:", error);
                setLoading(false);
                // We'll handle the empty state in the render
            }
        );
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--yellow)]" /></div>;

    return (
        <div className="space-y-2 font-mono text-xs max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.map(log => (
                <div key={log.id} className={`p-3 rounded-xl border flex gap-3 transition-colors ${log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                    log.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-200' :
                        log.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-200' :
                            'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}>
                    <div className="mt-0.5 shrink-0">
                        {log.type === 'error' && <AlertCircle size={14} className="text-red-500" />}
                        {log.type === 'warning' && <AlertTriangle size={14} className="text-orange-500" />}
                        {log.type === 'success' && <CheckCircle size={14} className="text-green-500" />}
                        {log.type === 'info' && <Info size={14} className="text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center opacity-50 text-[10px] mb-1">
                            <span>{log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : 'Just now'}</span>
                            {log.meta?.videoId && <span className="font-mono bg-black/30 px-1 rounded">ID: {log.meta.videoId.slice(0, 8)}</span>}
                        </div>
                        <p className="break-words leading-relaxed">{log.message}</p>
                        {log.meta && log.meta.error && (
                            <pre className="mt-2 p-2 bg-black/30 rounded overflow-x-auto text-[10px] text-red-300 border border-red-500/10">
                                {log.meta.error}
                            </pre>
                        )}
                        {log.meta && log.meta.missing && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {log.meta.missing.map(lang => (
                                    <span key={lang} className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded text-[9px] uppercase tracking-wide">
                                        Missing: {lang}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {logs.length === 0 && <div className="text-center p-8 opacity-50">No logs found. System events will appear here.</div>}
        </div>
    );
};

export default ActivityLogs;
