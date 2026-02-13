'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface DiscordUser {
  id: string;
  username: string;
  avatar?: string;
  discriminator?: string;
}

interface GoogleUser {
  id: string;
  username?: string;
  name?: string;
  avatar?: string;
  email?: string;
}

interface PathgenUser {
  id?: string;
  uid?: string;
  email?: string;
  name?: string;
  username?: string;
  discordUsername?: string;
  googleUsername?: string;
  discordAvatar?: string;
  googleAvatar?: string;
  avatar?: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [pathgenUser, setPathgenUser] = useState<PathgenUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for user in localStorage (Discord or Google)
    const checkUser = () => {
      try {
        // Check for pathgen_user first (contains both Discord and Google data)
        const pathgenUserStr = typeof window !== 'undefined' ? localStorage.getItem('pathgen_user') : null;
        if (pathgenUserStr) {
          const user = JSON.parse(pathgenUserStr);
          setPathgenUser(user);
          
          // Also check for Discord user separately for backward compatibility
          const discordUserStr = typeof window !== 'undefined' ? localStorage.getItem('discordUser') : null;
          if (discordUserStr) {
            const discordUser = JSON.parse(discordUserStr);
            setDiscordUser(discordUser);
          }
        } else {
          // Fallback to Discord user only
          const userStr = typeof window !== 'undefined' ? localStorage.getItem('discordUser') : null;
          if (userStr) {
            const user = JSON.parse(userStr);
            setDiscordUser(user);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    checkUser();
    
    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'discordUser' || e.key === 'pathgen_user') {
        checkUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check periodically in case localStorage was updated in the same tab
    const interval = setInterval(checkUser, 1000);

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false);
      }
    }

    // Use a slight delay to prevent immediate closure when clicking the button
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="header">
      <nav className="nav">
        <Link href="/" className="logo">
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
              <defs>
                <filter id="sparkleBlur">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.8"/>
                </filter>
              </defs>
              <g>
                <rect x="20" y="20" width="16" height="60" rx="8" ry="8" fill="#FFFFFF"/>
                <path d="M 36 20 H 50 A 24 24 0 0 1 50 58 H 36 V 20 Z" fill="#FFFFFF"/>
                <path d="M 45 28 L 58 32 L 54 40 L 42 38 Z" fill="#000000" opacity="0.3"/>
                <path d="M 44 42 L 56 46 L 48 52 Z" fill="#000000" opacity="0.25"/>
                <path d="M 38 26 L 42 24 L 42 34 L 38 36 Z" fill="#000000" opacity="0.2"/>
              </g>
              <g opacity="0.85">
                <circle cx="64" cy="26" r="2.5" fill="#FFFFFF" filter="url(#sparkleBlur)"/>
                <circle cx="70" cy="38" r="1.8" fill="#FFFFFF" filter="url(#sparkleBlur)"/>
                <circle cx="52" cy="35" r="1.2" fill="#FFFFFF" opacity="0.8" filter="url(#sparkleBlur)"/>
                <circle cx="58" cy="28" r="0.9" fill="#FFFFFF" opacity="0.7"/>
                <circle cx="24" cy="48" r="1.5" fill="#FFFFFF" filter="url(#sparkleBlur)"/>
                <circle cx="60" cy="50" r="1.0" fill="#FFFFFF" opacity="0.6"/>
              </g>
            </svg>
          </div>
          <span>Pathgen v2</span>
        </Link>

        <div className="nav-center">
          <a href="/docs.html" className="nav-link">Docs</a>
          <div className="dropdown" ref={dropdownRef}>
            <a
              href="#"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFeaturesOpen(!featuresOpen);
              }}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent mousedown from immediately closing
              }}
            >
              Features
              <span className="caret">▼</span>
            </a>
            <div className={`dropdown-menu ${featuresOpen ? 'show' : ''}`} id="featuresDropdown">
              <Link href="/analyze" className="dropdown-item" onClick={() => setFeaturesOpen(false)}>
                <span className="dropdown-item-icon">🎮</span>
                <span>Replay Parser</span>
              </Link>
              <Link href="/masterclass" className="dropdown-item" onClick={() => setFeaturesOpen(false)}>
                <span className="dropdown-item-icon">📖</span>
                <span>Masterclass</span>
              </Link>
              <a href="/chat.html" className="dropdown-item" onClick={() => setFeaturesOpen(false)}>
                <span className="dropdown-item-icon">💬</span>
                <span>AI Coach</span>
              </a>
              <a href="/tournaments.html" className="dropdown-item" onClick={() => setFeaturesOpen(false)}>
                <span className="dropdown-item-icon">🏆</span>
                <span>Tournaments</span>
              </a>
              <a href="/competitive-insights.html" className="dropdown-item" onClick={() => setFeaturesOpen(false)}>
                <span className="dropdown-item-icon">📊</span>
                <span>Competitive Insights</span>
              </a>
              <div className="dropdown-divider"></div>
              <a href="/docs.html" className="dropdown-item" onClick={() => setFeaturesOpen(false)}>
                <span className="dropdown-item-icon">📚</span>
                <span>Documentation</span>
              </a>
            </div>
          </div>
          <a href="/cih-coaching.html" className="nav-link">CIH Coaching</a>
          <a href="/nagc-dropmaps.html" className="nav-link">NAGC Drop Maps</a>
        </div>

        <div className="nav-right">
          <a href="/subscribe.html" className="nav-link">Pricing</a>
          {(discordUser || pathgenUser) ? (
            <a href="/settings.html" className="nav-cta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(() => {
                // Get avatar URL - check Discord first, then Google, then generic avatar
                let avatarUrl: string | null = null;
                let displayName = 'User';
                
                if (discordUser?.avatar && discordUser?.id) {
                  avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
                  displayName = discordUser.username || 'User';
                } else if (pathgenUser) {
                  avatarUrl = pathgenUser.discordAvatar || pathgenUser.googleAvatar || pathgenUser.avatar || null;
                  displayName = pathgenUser.name || pathgenUser.discordUsername || pathgenUser.googleUsername || pathgenUser.username || pathgenUser.email?.split('@')[0] || 'User';
                }
                
                if (avatarUrl) {
                  return (
                    <img 
                      src={avatarUrl}
                      alt={displayName}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        // Fallback to initial if image fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const initial = displayName[0]?.toUpperCase() || 'U';
                          parent.innerHTML = `<div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #8B5CF6, #3B82F6); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #FFFFFF;">${initial}</div><span>${displayName}</span>`;
                        }
                      }}
                    />
                  );
                } else {
                  const initial = displayName[0]?.toUpperCase() || 'U';
                  return (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#FFFFFF'
                    }}>
                      {initial}
                    </div>
                  );
                }
              })()}
              <span>{pathgenUser?.name || pathgenUser?.discordUsername || pathgenUser?.googleUsername || pathgenUser?.username || discordUser?.username || 'User'}</span>
            </a>
          ) : (
            <a href="/login.html" className="nav-cta">Try For Free</a>
          )}
        </div>
      </nav>
    </header>
  );
}