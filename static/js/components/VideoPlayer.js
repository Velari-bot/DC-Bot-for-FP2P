import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, RotateCcw, RotateCw, Settings, Captions, ChevronRight, Check, ChevronLeft, Gauge, PanelLeft, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../utils/firebase';

const getEmbedUrl = (url, startTime = 0) => {
    if (!url) return '';
    const cleanUrl = url.trim();

    // YouTube
    const youtubeRegex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
    const youtubeMatch = cleanUrl.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1].length === 11) {
        const id = youtubeMatch[1];
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        let embed = `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&modestbranding=1&rel=0&origin=${encodeURIComponent(origin)}&enablejsapi=1`;
        if (startTime > 0) embed += `&start=${Math.floor(startTime)}`;
        return embed;
    }

    // Vimeo
    if (cleanUrl.includes('vimeo.com')) {
        const id = cleanUrl.split('/').pop().split('?')[0];
        let embed = `https://player.vimeo.com/video/${id}`;
        if (startTime > 0) embed += `#t=${Math.floor(startTime)}s`;
        return embed;
    }

    return null; // Not an embed
};

const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const getLangLabel = (code) => {
    const langs = {
        'en': 'English',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch',
        'pt': 'Português',
        'it': 'Italiano',
        'ja': '日本語',
        'ko': '한국어',
        'zh': '中文',
        'ar': 'العربية'
    };
    return langs[code] || code.toUpperCase();
};


const VideoPlayer = ({ url, className, poster, captionVideoId, onToggleTheater, theaterMode, hasNotes, startTime = 0, onProgress, courseId, lessonId, lessonTitle }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showPoster, setShowPoster] = useState(startTime === 0);
    const [isStarted, setIsStarted] = useState(startTime > 0);
    const [captions, setCaptions] = useState(null);
    const [isCaptionLoading, setIsCaptionLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState('main'); // 'main', 'speed', 'captions', 'captionSize'
    const [playbackRate, setPlaybackRate] = useState(1);
    const [activeCaption, setActiveCaption] = useState('off');
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isSoftLandscape, setIsSoftLandscape] = useState(false);
    const [captionSize, setCaptionSize] = useState('medium'); // 'small', 'medium', 'large', 'xlarge'
    const [isInControlZone, setIsInControlZone] = useState(false);
    const idleTimerRef = useRef(null);
    const containerRef = useRef(null);
    const lastUrlRef = useRef(url);
    const hasTrackedView = useRef(false);

    const embedUrl = getEmbedUrl(url, startTime);

    useEffect(() => {
        if (startTime > 0 && videoRef.current) {
            videoRef.current.currentTime = startTime;
            // Optionally auto-play if we want, but let's just ensure it starts correctly mapped
        }
    }, [startTime]); // Run when startTime changes (which happens on theater toggle remount)

    useEffect(() => {
        if (!captionVideoId) return;

        const fetchCaptions = async () => {
            setIsCaptionLoading(true);
            try {
                const res = await fetch(`/api/captions?action=get&videoId=${captionVideoId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCaptions(data);

                    // If still processing, poll every 10 seconds
                    if (data.status !== 'ready' && data.status !== 'error') {
                        setTimeout(fetchCaptions, 10000);
                    }
                }
            } catch (e) {
                console.error("Captions load error", e);
            } finally {
                setIsCaptionLoading(false);
            }
        };

        fetchCaptions();
    }, [captionVideoId]);

    // Caption size CSS mapping
    const captionSizeMap = {
        small: '1.2rem',
        medium: '1.6rem',
        large: '2.2rem',
        xlarge: '2.8rem',
        huge: '3.5rem'
    };

    const captionSizeLabels = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        xlarge: 'Extra Large',
        huge: 'Huge'
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle mouse position to show controls only in bottom 1/3
    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;

        // On mobile, we don't use hover logic for control zone
        if (isMobile) {
            setIsInControlZone(true);
            setControlsVisible(true);
            resetIdleTimer();
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const containerHeight = rect.height;
        const controlZoneStart = containerHeight * (2 / 3); // Bottom 1/3

        const inZone = mouseY >= controlZoneStart;
        setIsInControlZone(inZone);

        // Always show controls if settings menu is open
        if (showSettings) {
            setControlsVisible(true);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            return;
        }

        if (inZone) {
            setControlsVisible(true);
            // Reset idle timer when moving in control zone
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (isPlaying) {
                idleTimerRef.current = setTimeout(() => {
                    if (!showSettings) { // Don't hide if settings is open
                        setControlsVisible(false);
                        setShowSettings(false);
                        setSettingsTab('main');
                    }
                }, 2500); // 2.5 second timeout
            }
        } else if (isPlaying && !showSettings) {
            // If mouse moves outside control zone and video is playing, hide controls
            setControlsVisible(false);
        }
    }, [isPlaying, showSettings, isMobile]);

    // Handle idle mouse to hide controls
    const resetIdleTimer = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

        // Always show controls if settings is open
        if (showSettings) {
            setControlsVisible(true);
            return;
        }

        if (isInControlZone || isMobile) {
            setControlsVisible(true);
            if (isPlaying && !showSettings) {
                idleTimerRef.current = setTimeout(() => {
                    if (!showSettings) { // Double check before hiding
                        setControlsVisible(false);
                        setShowSettings(false);
                        setSettingsTab('main');
                    }
                }, isMobile ? 3500 : 2500); // Longer timeout on mobile
            }
        }
    };

    useEffect(() => {
        // Don't hide controls if settings menu is open
        if (showSettings) {
            setControlsVisible(true);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            return;
        }

        if (isPlaying) {
            // Start idle timer only if in control zone (or always on mobile)
            if (isInControlZone || isMobile) {
                resetIdleTimer();
            } else if (!showSettings) {
                setControlsVisible(false);
            }
        } else {
            setControlsVisible(true);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        }

        const handleFSChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                setIsSoftLandscape(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('webkitfullscreenchange', handleFSChange);

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('webkitfullscreenchange', handleFSChange);
        };
    }, [isPlaying, isInControlZone, isMobile, showSettings]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            if (!video) return;
            const pos = video.currentTime;
            setProgress((pos / video.duration) * 100);
            if (video.duration) setDuration(video.duration);
            onProgress?.(pos);
        };

        const onPlay = () => { setIsPlaying(true); setShowPoster(false); setIsStarted(true); };
        const onPause = () => setIsPlaying(false);
        const onWaiting = () => setIsBuffering(true);
        const onPlaying = () => {
            setIsBuffering(false);
            // Track view on first play
            if (!hasTrackedView.current) {
                hasTrackedView.current = true;
                const trackView = async () => {
                    try {
                        const token = await auth.currentUser?.getIdToken();
                        await fetch('/api/track', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({
                                action: 'video_view',
                                videoId: captionVideoId,
                                lessonId: lessonId,
                                courseId: courseId,
                                title: lessonTitle || poster || 'Unknown Video',
                            })
                        });
                    } catch (e) {
                        console.warn("Tracking failed", e);
                    }
                };
                trackView();
            }
        };

        // Reset tracking when URL changes
        if (lastUrlRef.current !== url) {
            hasTrackedView.current = false;
            setIsPlaying(false);
            setIsStarted(false);
            setShowPoster(true);
            setProgress(0);
            setIsBuffering(false);
            setPlaybackRate(1);
            setActiveCaption('off');
            setShowSettings(false);
            lastUrlRef.current = url;
            if (video) video.currentTime = 0;
        }

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('loadedmetadata', updateProgress);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('loadedmetadata', updateProgress);
        };
    }, [url]);

    const togglePlay = (e) => {
        e?.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        const seekTime = (e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * videoRef.current.duration;
        videoRef.current.currentTime = seekTime;
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (videoRef.current) videoRef.current.muted = newMuted;
    };

    const toggleFullscreen = async (e) => {
        e?.stopPropagation();
        if (!containerRef.current) return;

        try {
            const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

            if (!isCurrentlyFullscreen) {
                // Entering Fullscreen
                if (containerRef.current.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                } else if (containerRef.current.webkitRequestFullscreen) {
                    await containerRef.current.webkitRequestFullscreen();
                } else if (videoRef.current?.webkitEnterFullscreen) {
                    // Fallback for iPhone/iOS which often requires native video element fullscreen
                    videoRef.current.webkitEnterFullscreen();
                    return;
                }

                // Try to lock orientation to landscape on mobile
                if (isMobile) {
                    if (window.screen?.orientation?.lock) {
                        try {
                            await window.screen.orientation.lock('landscape');
                        } catch (err) {
                            console.warn("Orientation lock failed:", err);
                            // If lock fails and we are in portrait, use soft rotation
                            if (window.innerHeight > window.innerWidth) {
                                setIsSoftLandscape(true);
                            }
                        }
                    } else if (window.innerHeight > window.innerWidth) {
                        // For devices with no lock support, check current orientation
                        setIsSoftLandscape(true);
                    }
                }
            } else {
                // Exiting Fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    await document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
            }
        } catch (err) {
            console.error("Fullscreen/Orientation error:", err);
        }
    };

    // If it's an embed (YouTube/Vimeo), use Iframe with optional poster overlay
    if (embedUrl) {
        const finalUrl = isStarted ? embedUrl.replace('autoplay=0', 'autoplay=1') : embedUrl;

        return (
            <div className={`relative group bg-black overflow-hidden select-none ${className || "w-full h-full"}`}>
                {poster && !isStarted && (
                    <div
                        className="absolute inset-0 z-10 cursor-pointer transition-opacity duration-500"
                        onClick={() => setIsStarted(true)}
                    >
                        <img src={poster} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-6 bg-[var(--yellow)] rounded-full text-black transform transition-transform hover:scale-110 shadow-[0_0_40px_rgba(250,204,36,0.4)]">
                                <Play size={40} fill="currentColor" />
                            </div>
                        </div>
                    </div>
                )}
                {(isStarted || !poster) && (
                    <iframe
                        src={finalUrl}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        title="Video Player"
                    />
                )}
            </div>
        );
    }

    // Direct Video Player (MP4/WebM/R2)
    return (
        <div
            ref={containerRef}
            className={`relative group bg-black overflow-hidden select-none transition-all duration-300 ${className || "w-full h-full"} ${controlsVisible || !isPlaying ? 'cursor-default' : 'cursor-none'} ${isSoftLandscape ? 'soft-landscape-fullscreen' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => { setIsHovering(true); }}
            onMouseLeave={() => { setIsHovering(false); setIsInControlZone(false); if (isPlaying && !isMobile) setControlsVisible(false); }}
            onClick={isMobile ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                setControlsVisible(!controlsVisible);
                if (!controlsVisible) resetIdleTimer();
            } : togglePlay}
        >
            {/* Dynamic Caption Sizing */}
            <style>
                {`
                    video::cue {
                        background-color: rgba(0, 0, 0, 0.65);
                        color: #fff;
                        font-family: "Gilroy", sans-serif;
                        font-weight: 700;
                        font-size: ${captionSizeMap[captionSize]};
                        padding: 8px 16px;
                        border-radius: 8px;
                        line-height: 1.4;
                        text-shadow: 0 3px 6px rgba(0, 0, 0, 0.9);
                    }
                    .soft-landscape-fullscreen {
                        position: fixed !important;
                        top: 50% !important;
                        left: 50% !important;
                        width: 100vh !important;
                        height: 100vw !important;
                        transform: translate(-50%, -50%) rotate(90deg) !important;
                        z-index: 9999 !important;
                    }
                `}
            </style>
            <video
                ref={videoRef}
                src={url}
                className="w-full h-full object-contain"
                playsInline
                poster={poster}
                onContextMenu={(e) => e.preventDefault()}
                crossOrigin="anonymous"
            >
                {captions?.tracks && Object.entries(captions.tracks).map(([lang, src]) => (
                    <track
                        key={lang}
                        label={getLangLabel(lang)}
                        kind="subtitles"
                        srcLang={lang}
                        src={src}
                        default={false} // Managed by state
                    />
                ))}
            </video>

            {/* Poster Overlay */}
            {showPoster && poster && (
                <div className={`absolute inset-0 bg-black z-10 transition-opacity duration-500 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <img src={poster} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="p-6 bg-[var(--yellow)] rounded-full text-black transform transition-transform hover:scale-110 shadow-[0_0_40px_rgba(250,204,36,0.4)] cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                        >
                            <Play size={40} fill="currentColor" />
                        </div>
                    </div>
                </div>
            )}

            {/* Center Play/Pause (Mobile Only) */}
            {isMobile && controlsVisible && !showPoster && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            togglePlay();
                        }
                        }
                        className="p-8 bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-auto active:scale-95 transition-all shadow-2xl border border-white/10"
                    >
                        {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" />}
                    </button>
                </div>
            )}

            {/* Loading Spinner */}
            {isBuffering && !showPoster && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none text-[var(--yellow)]">
                    <Loader2 className="animate-spin" size={48} />
                </div>
            )}

            {/* Controls Overlay */}
            {(!showPoster || !poster) && (
                <div
                    className={`absolute inset-0 z-30 flex flex-col justify-end transition-all duration-500 overflow-hidden
                        ${isMobile ? 'p-3' : 'p-6 bg-gradient-to-t from-black/80 via-transparent to-transparent group-hover:from-black/80'}
                        ${(controlsVisible || !isPlaying) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {isMobile && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />}
                    <style>
                        {`
                        .volume-slider::-webkit-slider-thumb { appearance: none; width: 0; height: 0; }
                        .volume-slider::-moz-range-thumb { width: 0; height: 0; border: 0; }
                    `}
                    </style>

                    {/* Progress Bar Container - Increased Hit Area */}
                    <div
                        className={`relative ${isMobile ? 'h-6 mb-2' : 'h-4 mb-4'} flex items-center cursor-pointer group/progress transition-all`}
                        onClick={handleSeek}
                    >
                        {/* Track Background */}
                        <div className={`w-full ${isMobile ? 'h-1.5' : 'h-1.5'} bg-white/20 rounded-full overflow-hidden relative`}>
                            {/* Filled Track */}
                            <div className="absolute top-0 left-0 h-full bg-[var(--yellow)] rounded-full transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
                        </div>

                        {/* Interactible Thumb */}
                        <div
                            className={`absolute h-4 w-4 bg-[var(--yellow)] rounded-full shadow-[0_0_15px_rgba(250,204,36,0.8)] transition-all pointer-events-none ${isMobile ? 'opacity-100 scale-100' : 'opacity-0 group-hover/progress:opacity-100 scale-0 group-hover/progress:scale-100'}`}
                            style={{ left: `calc(${progress}% - 8px)` }}
                        />
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2 md:gap-6">
                            {!isMobile && (
                                <button
                                    onClick={togglePlay}
                                    className="p-2 -ml-2 text-white hover:text-[var(--yellow)] transition-transform active:scale-95 rounded-full hover:bg-white/5"
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                                </button>
                            )}

                            {!isMobile && (
                                <div className="flex items-center gap-3 group/volume">
                                    <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors">
                                        {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                                    </button>
                                    <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                                        <input
                                            type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setVolume(val);
                                                if (videoRef.current) videoRef.current.volume = val;
                                                setIsMuted(val === 0);
                                            }}
                                            className="w-20 h-1.5 rounded-full appearance-none cursor-pointer accent-transparent volume-slider bg-white/10"
                                            style={{
                                                background: `linear-gradient(to right, #FACB24 0%, #FACB24 ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <span className={`${isMobile ? 'text-[10px]' : 'text-sm'} font-['Arial',_sans-serif] font-bold text-white/90 tracking-tight`}>
                                {formatTime(videoRef.current?.currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1 md:gap-6">
                            <button
                                onClick={(e) => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                                className={`p-2 text-white/60 hover:text-white transition-colors hover:bg-white/5 rounded-full ${isMobile ? 'scale-75' : ''}`}
                                title="Rewind 10s"
                            >
                                <RotateCcw size={24} />
                            </button>
                            <button
                                onClick={(e) => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                                className={`p-2 text-white/60 hover:text-white transition-colors hover:bg-white/5 rounded-full ${isMobile ? 'scale-75' : ''}`}
                                title="Forward 10s"
                            >
                                <RotateCw size={24} />
                            </button>

                            <button
                                onClick={() => {
                                    if (!videoRef.current) return;
                                    const isCurrentlyOff = activeCaption === 'off';
                                    const targetLang = isCurrentlyOff ? (Object.keys(captions?.tracks || {})[0] || 'en') : 'off';

                                    setActiveCaption(targetLang);
                                    for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                                        videoRef.current.textTracks[i].mode =
                                            (targetLang !== 'off' && videoRef.current.textTracks[i].language === targetLang) ? 'showing' : 'disabled';
                                    }
                                }}
                                className={`p-2 transition-all duration-300 rounded-full hover:bg-white/5 ${activeCaption !== 'off' ? 'text-[var(--yellow)]' : 'text-white/60 hover:text-white'} ${!captions?.tracks || Object.keys(captions.tracks).length === 0 ? 'opacity-30 cursor-not-allowed' : ''} ${isMobile ? 'scale-90' : ''}`}
                                disabled={!captions?.tracks || Object.keys(captions.tracks).length === 0}
                                title={activeCaption === 'off' ? "Turn on captions" : "Turn off captions"}
                            >
                                <Captions size={isMobile ? 20 : 24} className={activeCaption !== 'off' ? 'drop-shadow-[0_0_8px_rgba(250,204,36,0.5)]' : ''} />
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowSettings(!showSettings);
                                        setSettingsTab('main');
                                    }}
                                    className={`p-2 text-white/60 hover:text-white transition-all rounded-full hover:bg-white/5 ${showSettings ? 'rotate-90 text-[var(--yellow)] opacity-100' : ''} ${isMobile ? 'scale-90' : ''}`}
                                    title="Settings"
                                >
                                    <Settings size={isMobile ? 20 : 24} />
                                </button>
                            </div>


                            {hasNotes && !isMobile && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleTheater?.();
                                    }}
                                    className={`p-2 transition-all duration-300 rounded-full hover:bg-white/5 ${theaterMode ? 'text-[var(--yellow)]' : 'text-white/60 hover:text-white'}`}
                                    title={theaterMode ? "Exit Theater Mode" : "Read Notes & Watch Video"}
                                >
                                    <PanelLeft size={24} className={theaterMode ? 'drop-shadow-[0_0_8px_rgba(250,204,36,0.5)]' : ''} />
                                </button>
                            )}

                            <button onClick={toggleFullscreen} className={`p-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5 ${isMobile ? 'scale-90' : ''}`}>
                                <Maximize size={isMobile ? 20 : 24} />
                            </button>
                        </div>
                    </div>

                    {/* Settings Menu - Right Justified & Above Play Bar */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
                                className={`absolute bg-[#0F0F0F]/85 backdrop-blur-[30px] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] z-50 py-1
                                    ${isMobile ? 'bottom-16 left-1/2 -translate-x-1/2 w-[90%]' : 'bottom-[100px] right-6 w-[260px]'}
                                `}
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Main Menu */}
                                {settingsTab === 'main' && (
                                    <div className="space-y-0.5">
                                        <button
                                            onClick={() => setSettingsTab('speed')}
                                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Gauge size={18} className="text-white/70" />
                                                <span className="text-[14px] font-medium text-white/90">Playback speed</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white/40">
                                                <span className="text-[14px]">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                                                <ChevronRight size={16} />
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setSettingsTab('captions')}
                                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Captions size={18} className="text-white/70" />
                                                <span className="text-[14px] font-medium text-white/90">Subtitles/CC</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white/40">
                                                <span className="text-[14px]">
                                                    {activeCaption === 'off' ? 'Off' : getLangLabel(activeCaption)}
                                                </span>
                                                <ChevronRight size={16} />
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setSettingsTab('captionSize')}
                                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Type size={18} className="text-white/70" />
                                                <span className="text-[14px] font-medium text-white/90">Subtitle Size</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white/40">
                                                <span className="text-[14px]">{captionSizeLabels[captionSize]}</span>
                                                <ChevronRight size={16} />
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Speed Menu */}
                                {settingsTab === 'speed' && (
                                    <div className="text-white">
                                        <div className="flex items-center px-4 py-3 mb-1 border-b border-white/[0.05]">
                                            <button
                                                onClick={() => setSettingsTab('main')}
                                                className="p-1 hover:bg-white/10 rounded-full transition-colors mr-3"
                                            >
                                                <ChevronLeft size={20} className="text-white/50" />
                                            </button>
                                            <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.15em]">Playback speed</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                                <button
                                                    key={rate}
                                                    onClick={() => {
                                                        setPlaybackRate(rate);
                                                        if (videoRef.current) videoRef.current.playbackRate = rate;
                                                        setShowSettings(false);
                                                    }}
                                                    className={`w-full flex items-center px-4 py-3 text-[14px] transition-all ${playbackRate === rate ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                >
                                                    <div className="w-8 flex items-center justify-start">
                                                        {playbackRate === rate && <Check size={18} strokeWidth={3} className="text-[var(--yellow)]" />}
                                                    </div>
                                                    <span className={`${playbackRate === rate ? 'font-bold text-white' : 'font-medium text-white/70'}`}>
                                                        {rate === 1 ? 'Normal' : `${rate}x`}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Captions Menu */}
                                {settingsTab === 'captions' && (
                                    <div className="text-white">
                                        <div className="flex items-center px-4 py-3 mb-1 border-b border-white/[0.05]">
                                            <button
                                                onClick={() => setSettingsTab('main')}
                                                className="p-1 hover:bg-white/10 rounded-full transition-colors mr-3"
                                            >
                                                <ChevronLeft size={20} className="text-white/50" />
                                            </button>
                                            <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.15em]">Subtitles</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <button
                                                onClick={() => {
                                                    setActiveCaption('off');
                                                    if (videoRef.current) {
                                                        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                                                            videoRef.current.textTracks[i].mode = 'disabled';
                                                        }
                                                    }
                                                    setShowSettings(false);
                                                }}
                                                className={`w-full flex items-center px-4 py-3 text-[14px] transition-all ${activeCaption === 'off' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                            >
                                                <div className="w-8 flex items-center justify-start">
                                                    {activeCaption === 'off' && <Check size={18} strokeWidth={3} className="text-[var(--yellow)]" />}
                                                </div>
                                                <span className={`${activeCaption === 'off' ? 'font-bold text-white' : 'font-medium text-white/70'}`}>Off</span>
                                            </button>

                                            {captions?.tracks && Object.keys(captions.tracks).map((lang) => (
                                                <button
                                                    key={lang}
                                                    onClick={() => {
                                                        setActiveCaption(lang);
                                                        if (videoRef.current) {
                                                            for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                                                                videoRef.current.textTracks[i].mode =
                                                                    videoRef.current.textTracks[i].language === lang ? 'showing' : 'disabled';
                                                            }
                                                        }
                                                        setShowSettings(false);
                                                    }}
                                                    className={`w-full flex items-center px-4 py-3 text-[14px] transition-all ${activeCaption === lang ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                >
                                                    <div className="w-8 flex items-center justify-start">
                                                        {activeCaption === lang && <Check size={18} strokeWidth={3} className="text-[var(--yellow)]" />}
                                                    </div>
                                                    <span className={`${activeCaption === lang ? 'font-bold text-white' : 'font-medium text-white/70'}`}>
                                                        {getLangLabel(lang)}
                                                    </span>
                                                </button>
                                            ))}

                                            {(captions?.status !== 'ready' && captions?.status !== 'ready_incomplete' && (!captions?.tracks || Object.keys(captions.tracks).length === 0)) && (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                    <Loader2 size={24} className="animate-spin mb-3" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-center px-6">
                                                        {captions?.status === 'error' ? 'Failed to sync' : 'Processing AI Captions...'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Caption Size Menu */}
                                {settingsTab === 'captionSize' && (
                                    <div className="text-white">
                                        <div className="flex items-center px-4 py-3 mb-1 border-b border-white/[0.05]">
                                            <button
                                                onClick={() => setSettingsTab('main')}
                                                className="p-1 hover:bg-white/10 rounded-full transition-colors mr-3"
                                            >
                                                <ChevronLeft size={20} className="text-white/50" />
                                            </button>
                                            <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.15em]">Subtitle Size</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            {['small', 'medium', 'large', 'xlarge'].map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => {
                                                        setCaptionSize(size);
                                                        setShowSettings(false);
                                                    }}
                                                    className={`w-full flex items-center px-4 py-3 text-[14px] transition-all ${captionSize === size ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                >
                                                    <div className="w-8 flex items-center justify-start">
                                                        {captionSize === size && <Check size={18} strokeWidth={3} className="text-[var(--yellow)]" />}
                                                    </div>
                                                    <span className={`${captionSize === size ? 'font-bold text-white' : 'font-medium text-white/70'}`}>
                                                        {captionSizeLabels[size]}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Caption Processing Toast */}
            <AnimatePresence>
                {captions && captions.status !== 'ready' && captions.status !== 'ready_incomplete' && captions.status !== 'error' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute top-6 left-6 flex items-center gap-3 bg-black/80 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl z-40"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--yellow)] rounded-full blur-[10px] opacity-20 animate-pulse" />
                            <Loader2 className="animate-spin text-[var(--yellow)]" size={16} />
                        </div>
                        <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] leading-none">
                            {captions.status === 'searching' ? 'Finding AI Captions' : 'Syncing AI Data'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoPlayer;
