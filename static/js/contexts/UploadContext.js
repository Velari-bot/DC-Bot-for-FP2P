import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

const UploadContext = createContext();

export const useUploads = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
    const [uploads, setUploads] = useState({}); // { [uploadId]: { id, file, progress, status, url, lessonId, error, originalName } }
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            const activeUploads = Object.values(uploads).some(u => u.status !== 'completed' && u.status !== 'error');
            if (activeUploads) {
                e.preventDefault();
                e.returnValue = ''; // Required for most browsers
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [uploads]);

    const startUpload = async (file, lessonId, onCompleteCallback) => {
        const uploadId = uuidv4();

        // Initial State
        setUploads(prev => ({
            ...prev,
            [uploadId]: {
                id: uploadId,
                file,
                progress: 0,
                status: 'uploading',
                lessonId,
                originalName: file.name
            }
        }));

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Must be logged in");

            // Step 1: Get Upload URL from API
            const token = await user.getIdToken();
            const folder = `temp/uploads/${user.uid}`;

            const signRes = await fetch('/api/captions?action=upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type || 'video/mp4'
                })
            });

            if (!signRes.ok) {
                const errData = await signRes.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to get upload URL");
            }
            const { uploadUrl, key, videoId } = await signRes.json();

            setUploads(prev => ({
                ...prev,
                [uploadId]: { ...prev[uploadId], videoId }
            }));

            // Step 2: Upload to R2 (using XMLHttpRequest for progress)
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 50; // First 50%
                    setUploads(prev => ({
                        ...prev,
                        [uploadId]: { ...prev[uploadId], progress }
                    }));
                }
            };

            xhr.onload = async () => {
                if (xhr.status === 200) {
                    try {
                        // Skip Server-Side Compression to avoid timeouts on Serverless
                        const publicDomain = "assets.fortnitepathtopro.com";
                        const directUrl = `https://${publicDomain}/${key}`;

                        setUploads(prev => ({
                            ...prev,
                            [uploadId]: { ...prev[uploadId], status: 'completed', progress: 100, url: directUrl, videoId }
                        }));

                        // Trigger Caption Processing
                        try {
                            await fetch('/api/captions?action=start', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ videoId, videoUrl: directUrl })
                            });
                        } catch (triggerErr) {
                            console.error("Failed to trigger captions:", triggerErr);
                        }

                        if (onCompleteCallback) {
                            onCompleteCallback(directUrl, videoId);
                        }

                    } catch (compressionErr) {
                        console.error("Compression Error:", compressionErr);
                        setUploads(prev => ({
                            ...prev,
                            [uploadId]: {
                                ...prev[uploadId],
                                status: 'error',
                                error: compressionErr.message
                            }
                        }));
                    }
                } else {
                    setUploads(prev => ({
                        ...prev,
                        [uploadId]: { ...prev[uploadId], status: 'error', error: `Upload failed with status ${xhr.status}` }
                    }));
                }
            };

            xhr.onerror = () => {
                setUploads(prev => ({
                    ...prev,
                    [uploadId]: { ...prev[uploadId], status: 'error', error: "Network error during upload" }
                }));
            };

            xhr.send(file);

        } catch (error) {
            console.error("Upload Error", error);
            setUploads(prev => ({
                ...prev,
                [uploadId]: { ...prev[uploadId], status: 'error', error: error.message }
            }));
        }
    };

    const removeUpload = (id) => {
        setUploads(prev => {
            const newUploads = { ...prev };
            delete newUploads[id];
            return newUploads;
        });
    };

    return (
        <UploadContext.Provider value={{
            uploads,
            startUpload,
            removeUpload,
            isMinimized,
            setIsMinimized
        }}>
            {children}
        </UploadContext.Provider>
    );
};
