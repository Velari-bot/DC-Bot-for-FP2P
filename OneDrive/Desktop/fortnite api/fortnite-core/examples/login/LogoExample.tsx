import React from 'react';
import Logo from '../../packages/ui/src/components/Logo';

/**
 * Example: Pathgen Logo in Login Screen
 * 
 * Shows how to integrate the logo with the existing geometric grid background.
 * Sparkles are enabled by default but respect reduced motion preferences.
 */
export default function LoginHeader() {
  return (
    <header className="relative min-h-[420px] flex items-center justify-center bg-[#fafafa] overflow-hidden">
      
      {/* Lemni-style Geometric Background (existing) */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.08 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#b372ff"/>
              <stop offset="100%" stopColor="#ff70f0"/>
            </linearGradient>
          </defs>
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="url(#gridGradient)" strokeWidth="0.5"/>
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#gridGradient)" strokeWidth="0.5"/>
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="url(#gridGradient)" strokeWidth="0.5" opacity="0.6"/>
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="url(#gridGradient)" strokeWidth="0.5" opacity="0.6"/>
        </svg>
      </div>
      
      {/* Pathgen Logo with Sparkles */}
      <div className="relative z-10 text-center">
        <Logo 
          size={96} 
          sparkle={true} 
          theme="light" 
          ariaLabel="Pathgen logo - AI Fortnite coach"
          className="mx-auto mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Pathgen
        </h1>
        
        <p className="text-gray-600">
          Train smarter with your personal AI Fortnite coach.
        </p>
      </div>
    </header>
  );
}

/**
 * Example: Logo in Dark Mode Navigation
 */
export function DarkNavLogo() {
  return (
    <nav className="bg-black py-4 px-6 flex items-center">
      <Logo 
        size={40} 
        sparkle={false} 
        theme="dark"
        className="mr-3"
      />
      <span className="text-white font-semibold text-lg">Pathgen</span>
    </nav>
  );
}

/**
 * Example: Animated Logo for Loading State
 */
export function LoadingLogo() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <Logo 
          size={128} 
          sparkle={true} 
          theme="light"
          ariaLabel="Loading Pathgen..."
        />
        <p className="mt-4 text-gray-600 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

