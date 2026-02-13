import React from 'react';
import VideoTranscriber from '../components/Transcriber/VideoTranscriber';
import Navbar from '../components/Navbar/NavBar';

const TranscribePage = () => {
    return (
        <div className="transcribe-page" style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background Effects */}
            <div className="bg-effects" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 0
            }}>
                <div className="glow-orb" style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    animation: 'float 20s ease-in-out infinite'
                }} />
                <div className="glow-orb" style={{
                    position: 'absolute',
                    bottom: '-20%',
                    left: '-10%',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(118, 75, 162, 0.15) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    animation: 'float 25s ease-in-out infinite reverse'
                }} />
            </div>

            <Navbar />

            <main style={{ position: 'relative', zIndex: 1, paddingTop: '80px' }}>
                <VideoTranscriber />
            </main>

            <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-30px) translateX(20px); }
          50% { transform: translateY(20px) translateX(-20px); }
          75% { transform: translateY(-20px) translateX(-30px); }
        }

        .transcribe-page * {
          box-sizing: border-box;
        }
      `}</style>
        </div>
    );
};

export default TranscribePage;
