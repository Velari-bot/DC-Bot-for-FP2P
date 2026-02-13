import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const SUPPORTED_LANGUAGES = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'nl': 'Dutch',
    'pl': 'Polish',
    'tr': 'Turkish'
};

const VideoTranscriber = () => {
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ step: '', percent: 0 });
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('polished');
    const [error, setError] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (isValidFile(droppedFile)) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError('Invalid file type. Please upload an audio or video file.');
            }
        }
    }, []);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (isValidFile(selectedFile)) {
                setFile(selectedFile);
                setError(null);
            } else {
                setError('Invalid file type. Please upload an audio or video file.');
            }
        }
    };

    const isValidFile = (file) => {
        const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg',
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        const validExtensions = /\.(mp3|mp4|wav|webm|ogg|m4a|avi|mov)$/i;
        return validTypes.includes(file.type) || validExtensions.test(file.name);
    };

    const toggleLanguage = (code) => {
        setSelectedLanguages(prev =>
            prev.includes(code)
                ? prev.filter(l => l !== code)
                : [...prev, code]
        );
    };

    const handleTranscribe = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setResults(null);

        try {
            setProgress({ step: 'Uploading file...', percent: 10 });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('languages', JSON.stringify(selectedLanguages));

            setProgress({ step: 'Transcribing with Whisper AI...', percent: 30 });

            const response = await axios.post('/api/transcribe-video/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress({ step: 'Uploading file...', percent: Math.min(percentCompleted, 25) });
                }
            });

            setProgress({ step: 'Complete!', percent: 100 });
            setResults(response.data.results);

        } catch (err) {
            console.error('Transcription error:', err);
            setError(err.response?.data?.message || 'Transcription failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadSubtitle = (content, format, lang = 'en') => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript_${lang}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="transcriber-container">
            <div className="transcriber-header">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="transcriber-title"
                >
                    <span className="gradient-text">AI Video</span> Transcriber
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="transcriber-subtitle"
                >
                    Powered by OpenAI Whisper • Grammar Polish • Multi-Language Translation
                </motion.p>
            </div>

            {!results ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="upload-section"
                >
                    {/* Upload Area */}
                    <div
                        className={`upload-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input
                            type="file"
                            id="file-input"
                            accept=".mp3,.mp4,.wav,.webm,.ogg,.m4a,.avi,.mov"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        {file ? (
                            <div className="file-preview">
                                <div className="file-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <path d="M12 18v-6" />
                                        <path d="m9 15 3-3 3 3" />
                                    </svg>
                                </div>
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                <button
                                    className="remove-file"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="upload-prompt">
                                <div className="upload-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <p className="upload-text">Drop your video or audio file here</p>
                                <p className="upload-hint">or click to browse</p>
                                <p className="supported-formats">MP3, MP4, WAV, WebM, OGG, M4A, AVI, MOV</p>
                            </div>
                        )}
                    </div>

                    {/* Language Selection */}
                    <div className="language-section">
                        <h3 className="section-title">
                            <span className="icon">🌍</span>
                            Translation Languages <span className="optional">(optional)</span>
                        </h3>
                        <p className="section-desc">Select languages to translate your transcript into</p>

                        <div className="language-grid">
                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                                <motion.button
                                    key={code}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`language-chip ${selectedLanguages.includes(code) ? 'selected' : ''}`}
                                    onClick={() => toggleLanguage(code)}
                                >
                                    <span className="lang-flag">{getLanguageFlag(code)}</span>
                                    <span className="lang-name">{name}</span>
                                    {selectedLanguages.includes(code) && (
                                        <span className="check-icon">✓</span>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="error-message"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Transcribe Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`transcribe-btn ${!file ? 'disabled' : ''}`}
                        onClick={handleTranscribe}
                        disabled={!file || isProcessing}
                    >
                        {isProcessing ? (
                            <div className="processing-state">
                                <div className="spinner"></div>
                                <span>{progress.step}</span>
                            </div>
                        ) : (
                            <>
                                <span className="btn-icon">🚀</span>
                                <span>Transcribe & Translate</span>
                            </>
                        )}
                    </motion.button>

                    {isProcessing && (
                        <div className="progress-bar">
                            <motion.div
                                className="progress-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.percent}%` }}
                            />
                        </div>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="results-section"
                >
                    {/* Tabs */}
                    <div className="results-tabs">
                        <button
                            className={`tab ${activeTab === 'original' ? 'active' : ''}`}
                            onClick={() => setActiveTab('original')}
                        >
                            📝 Original
                        </button>
                        <button
                            className={`tab ${activeTab === 'polished' ? 'active' : ''}`}
                            onClick={() => setActiveTab('polished')}
                        >
                            ✨ Polished
                        </button>
                        {Object.keys(results.translations).map(lang => (
                            <button
                                key={lang}
                                className={`tab ${activeTab === lang ? 'active' : ''}`}
                                onClick={() => setActiveTab(lang)}
                            >
                                {getLanguageFlag(lang)} {SUPPORTED_LANGUAGES[lang]}
                            </button>
                        ))}
                    </div>

                    {/* Results Content */}
                    <div className="results-content">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="result-panel"
                            >
                                {renderResultPanel()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="results-actions">
                        <button
                            className="action-btn secondary"
                            onClick={() => { setResults(null); setFile(null); }}
                        >
                            ← New Transcription
                        </button>
                    </div>
                </motion.div>
            )}

            <style jsx>{`
        .transcriber-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          min-height: 100vh;
        }

        .transcriber-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .transcriber-title {
          font-size: 3rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 12px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .transcriber-subtitle {
          color: #a0aec0;
          font-size: 1.1rem;
        }

        .upload-section {
          background: linear-gradient(135deg, rgba(23, 25, 35, 0.9) 0%, rgba(30, 32, 44, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          backdrop-filter: blur(20px);
        }

        .upload-zone {
          border: 2px dashed rgba(102, 126, 234, 0.4);
          border-radius: 16px;
          padding: 60px 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(102, 126, 234, 0.05);
        }

        .upload-zone:hover, .upload-zone.active {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }

        .upload-zone.has-file {
          border-color: #48bb78;
          background: rgba(72, 187, 120, 0.1);
        }

        .upload-icon svg, .file-icon svg {
          width: 64px;
          height: 64px;
          color: #667eea;
          margin-bottom: 16px;
        }

        .upload-text {
          font-size: 1.25rem;
          color: #fff;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .upload-hint {
          color: #a0aec0;
          margin-bottom: 16px;
        }

        .supported-formats {
          font-size: 0.875rem;
          color: #667eea;
          background: rgba(102, 126, 234, 0.15);
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
        }

        .file-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .file-icon svg {
          color: #48bb78;
        }

        .file-name {
          font-size: 1.1rem;
          color: #fff;
          font-weight: 600;
          margin-bottom: 4px;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          color: #a0aec0;
          font-size: 0.9rem;
          margin-bottom: 12px;
        }

        .remove-file {
          background: rgba(245, 101, 101, 0.2);
          color: #f56565;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .remove-file:hover {
          background: rgba(245, 101, 101, 0.3);
        }

        .language-section {
          margin-top: 32px;
        }

        .section-title {
          color: #fff;
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title .icon {
          font-size: 1.5rem;
        }

        .optional {
          color: #a0aec0;
          font-weight: 400;
          font-size: 0.9rem;
        }

        .section-desc {
          color: #718096;
          margin-bottom: 16px;
        }

        .language-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .language-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }

        .language-chip:hover {
          background: rgba(102, 126, 234, 0.15);
          border-color: rgba(102, 126, 234, 0.3);
        }

        .language-chip.selected {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
          border-color: #667eea;
          color: #fff;
        }

        .lang-flag {
          font-size: 1.2rem;
        }

        .check-icon {
          color: #48bb78;
          font-weight: bold;
        }

        .error-message {
          background: rgba(245, 101, 101, 0.15);
          border: 1px solid rgba(245, 101, 101, 0.3);
          color: #f56565;
          padding: 12px 20px;
          border-radius: 12px;
          margin-top: 20px;
          text-align: center;
        }

        .transcribe-btn {
          width: 100%;
          padding: 18px 32px;
          margin-top: 32px;
          border: none;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        }

        .transcribe-btn:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(102, 126, 234, 0.5);
        }

        .transcribe-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 1.3rem;
        }

        .processing-state {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .progress-bar {
          margin-top: 16px;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
        }

        /* Results Section */
        .results-section {
          background: linear-gradient(135deg, rgba(23, 25, 35, 0.9) 0%, rgba(30, 32, 44, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }

        .results-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tab {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #a0aec0;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }

        .tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }

        .results-content {
          padding: 24px;
        }

        .result-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .transcript-box {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
        }

        .transcript-text {
          color: #e2e8f0;
          line-height: 1.8;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
        }

        .segment-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .segment-item {
          display: flex;
          gap: 16px;
          padding: 12px;
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .segment-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .timestamp {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.85rem;
          color: #667eea;
          white-space: nowrap;
          min-width: 120px;
        }

        .segment-text {
          color: #e2e8f0;
          flex: 1;
        }

        .download-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .download-btn {
          padding: 12px 24px;
          border-radius: 10px;
          border: 1px solid rgba(102, 126, 234, 0.4);
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .download-btn:hover {
          background: rgba(102, 126, 234, 0.2);
          border-color: #667eea;
          transform: translateY(-2px);
        }

        .copy-btn {
          border-color: rgba(72, 187, 120, 0.4);
          background: rgba(72, 187, 120, 0.1);
          color: #48bb78;
        }

        .copy-btn:hover {
          background: rgba(72, 187, 120, 0.2);
          border-color: #48bb78;
        }

        .results-actions {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-btn {
          padding: 14px 28px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
        }

        .action-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        /* Scrollbar styling */
        .transcript-text::-webkit-scrollbar,
        .segment-list::-webkit-scrollbar {
          width: 8px;
        }

        .transcript-text::-webkit-scrollbar-track,
        .segment-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .transcript-text::-webkit-scrollbar-thumb,
        .segment-list::-webkit-scrollbar-thumb {
          background: rgba(102, 126, 234, 0.4);
          border-radius: 4px;
        }

        @media (max-width: 640px) {
          .transcriber-title {
            font-size: 2rem;
          }
          
          .upload-section {
            padding: 24px;
          }
          
          .upload-zone {
            padding: 40px 20px;
          }
          
          .language-chip {
            padding: 8px 12px;
            font-size: 0.85rem;
          }
        }
      `}</style>
        </div>
    );

    function renderResultPanel() {
        let data;
        let tabLabel;

        if (activeTab === 'original') {
            data = results.original;
            tabLabel = 'Original';
        } else if (activeTab === 'polished') {
            data = results.polished;
            tabLabel = 'Polished';
        } else {
            data = results.translations[activeTab];
            tabLabel = SUPPORTED_LANGUAGES[activeTab];
        }

        if (!data) return null;

        return (
            <>
                <div className="transcript-box">
                    <h4 style={{ color: '#fff', marginBottom: '12px', fontWeight: 600 }}>
                        📄 Full Transcript ({tabLabel})
                    </h4>
                    <div className="transcript-text">{data.text}</div>
                </div>

                <div className="transcript-box">
                    <h4 style={{ color: '#fff', marginBottom: '12px', fontWeight: 600 }}>
                        ⏱️ Timestamped Segments
                    </h4>
                    <div className="segment-list">
                        {data.segments?.map((segment, idx) => (
                            <div key={idx} className="segment-item">
                                <span className="timestamp">
                                    {formatTime(segment.start)} → {formatTime(segment.end)}
                                </span>
                                <span className="segment-text">{segment.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="download-buttons">
                    <button
                        className="download-btn"
                        onClick={() => downloadSubtitle(data.vtt, 'vtt', activeTab)}
                    >
                        ⬇️ Download VTT
                    </button>
                    <button
                        className="download-btn"
                        onClick={() => downloadSubtitle(data.srt, 'srt', activeTab)}
                    >
                        ⬇️ Download SRT
                    </button>
                    <button
                        className="download-btn copy-btn"
                        onClick={() => copyToClipboard(data.text)}
                    >
                        📋 Copy Text
                    </button>
                </div>
            </>
        );
    }
};

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getLanguageFlag(code) {
    const flags = {
        'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'pt': '🇧🇷', 'it': '🇮🇹',
        'ja': '🇯🇵', 'ko': '🇰🇷', 'zh': '🇨🇳', 'ru': '🇷🇺', 'ar': '🇸🇦',
        'hi': '🇮🇳', 'nl': '🇳🇱', 'pl': '🇵🇱', 'tr': '🇹🇷', 'en': '🇺🇸'
    };
    return flags[code] || '🌐';
}

export default VideoTranscriber;
