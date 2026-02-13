import React, { useRef } from 'react';
import { useUploads } from '../../contexts/UploadContext';
import { Upload as UploadIcon, FileVideo, Plus, Loader2 } from 'lucide-react';

const VideoUpload = ({ onUploadComplete, activeLessonId }) => {
    const { startUpload, uploads, ffmpegLoading, ffmpegError, ffmpegLoaded } = useUploads();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // 🔥 Point #2 — Enforce Hard Upload Limits
        if (!selectedFile.type.includes('video/mp4') && !selectedFile.name.endsWith('.mp4')) {
            alert("Only MP4 files are allowed for better compression compatibility.");
            return;
        }

        if (selectedFile.size > 2 * 1024 * 1024 * 1024) { // 2GB
            alert("File too large (Max 2GB). Please compress locally before uploading or use FFmpeg.");
            return;
        }

        // Start Global Upload (with autocompletion for this lesson)
        startUpload(selectedFile, activeLessonId, (url, videoId) => {
            if (onUploadComplete) onUploadComplete(url, videoId);
        });
    };

    // Check if there is an active upload for THIS lesson
    // We assume the component is passed a unique ID for the lesson being edited
    // But currently VideoUpload is generic. 
    // If activeLessonId is provided, we can show specific status.

    const relevantUpload = Object.values(uploads).find(u => u.lessonId === activeLessonId && u.status !== 'completed' && u.status !== 'error');

    if (relevantUpload) {
        return (
            <div className="bg-[#111] border border-[var(--yellow)]/30 p-4 rounded-xl flex items-center gap-4 animate-pulse">
                <div>
                    <div className="w-10 h-10 rounded-full border-2 border-[var(--yellow)] border-t-transparent animate-spin" />
                </div>
                <div>
                    <h4 className="text-[var(--yellow)] font-bold text-sm">Uploading in Background...</h4>
                    <p className="text-xs text-gray-500">You can continue editing or switch sections.</p>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2">
                        <div className="bg-[var(--yellow)] h-full transition-all duration-300" style={{ width: `${relevantUpload.progress}%` }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="relative group cursor-pointer">
                <input
                    type="file"
                    accept="video/mp4"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 flex flex-col items-center gap-3 ${ffmpegError ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-700 hover:border-[var(--yellow)]/50 hover:bg-zinc-800'}`}>
                    <div className={`p-3 rounded-full transition ${ffmpegError ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 group-hover:bg-[var(--yellow)]/10 group-hover:text-[var(--yellow)]'}`}>
                        {ffmpegLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadIcon className="w-6 h-6" />}
                    </div>
                    <div>
                        <span className="text-sm font-bold text-white block">
                            {ffmpegLoading ? 'Initializing Processor...' : (ffmpegError ? 'Processor Error' : 'Click to Upload Video')}
                        </span>
                        <span className={`text-xs ${ffmpegError ? 'text-red-400' : 'text-zinc-500'}`}>
                            {ffmpegLoading ? 'Setting up high-speed compression' : (ffmpegError ? 'Please refresh the page to retry' : 'MP4 • Max 2GB • Auto-compressed')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoUpload;
