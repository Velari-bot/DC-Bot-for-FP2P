import React from 'react';

/**
 * Pathgen Logo Component
 * 
 * Renders the monochrome "P" mark with optional sparkle effects.
 * Inline SVG for full control over animations and styling.
 * 
 * @example
 * ```tsx
 * <Logo size={96} sparkle={true} theme="light" />
 * ```
 */

export interface LogoProps {
  /** Size in pixels or CSS string (e.g., "2rem"). Default: 64 */
  size?: number | string;
  
  /** Theme variant: 'light' (black P) or 'dark' (white P). Default: 'light' */
  theme?: 'light' | 'dark';
  
  /** Enable sparkle animations. Default: false */
  sparkle?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

/**
 * Pathgen Logo - Monochrome P mark with gem-like sparkles
 */
export const Logo: React.FC<LogoProps> = React.memo(({
  size = 64,
  theme = 'light',
  sparkle = false,
  className = '',
  ariaLabel = 'Pathgen logo'
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  const glyphColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const facetColor1 = theme === 'dark' ? '#BDBDBD' : '#F2F2F2';
  const facetColor2 = theme === 'dark' ? '#F2F2F2' : '#BDBDBD';
  
  // Check for reduced motion preference
  const [reducedMotion, setReducedMotion] = React.useState(false);
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  const shouldAnimate = sparkle && !reducedMotion;
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      role="img"
      aria-label={ariaLabel}
      width={sizeValue}
      height={sizeValue}
      className={`pathgen-logo ${shouldAnimate ? 'logo-sparkle-animate' : ''} ${className}`}
      style={{ display: 'block' }}
    >
      <defs>
        {/* Subtle blur for sparkles */}
        <filter id={`sparkleBlur-${theme}`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8"/>
        </filter>
      </defs>
      
      {/* Main P Glyph with Facets */}
      <g id="glyph">
        {/* P Stem */}
        <rect 
          x="20" 
          y="20" 
          width="16" 
          height="60" 
          rx="8" 
          ry="8" 
          fill={glyphColor}
        />
        
        {/* P Bowl */}
        <path 
          d="M 36 20 H 50 A 24 24 0 0 1 50 58 H 36 V 20 Z"
          fill={glyphColor}
        />
        
        {/* Internal Facets (gem-like cuts) */}
        <path 
          d="M 45 28 L 58 32 L 54 40 L 42 38 Z"
          fill={facetColor1}
          opacity="0.3"
        />
        <path 
          d="M 44 42 L 56 46 L 48 52 Z"
          fill={facetColor2}
          opacity="0.25"
        />
        <path 
          d="M 38 26 L 42 24 L 42 34 L 38 36 Z"
          fill={facetColor1}
          opacity="0.2"
        />
      </g>
      
      {/* Sparkles (conditionally rendered) */}
      {sparkle && (
        <g id="sparkles" opacity="0.85">
          <circle 
            cx="64" 
            cy="26" 
            r="2.5" 
            fill="#FFFFFF"
            filter={`url(#sparkleBlur-${theme})`}
            className="sparkle-1"
          />
          <circle 
            cx="70" 
            cy="38" 
            r="1.8" 
            fill="#FFFFFF"
            filter={`url(#sparkleBlur-${theme})`}
            className="sparkle-2"
          />
          <circle 
            cx="52" 
            cy="35" 
            r="1.2" 
            fill="#FFFFFF"
            opacity="0.8"
            filter={`url(#sparkleBlur-${theme})`}
            className="sparkle-3"
          />
          <circle 
            cx="58" 
            cy="28" 
            r="0.9" 
            fill="#FFFFFF"
            opacity="0.7"
            className="sparkle-4"
          />
          <circle 
            cx="24" 
            cy="48" 
            r="1.5" 
            fill="#FFFFFF"
            filter={`url(#sparkleBlur-${theme})`}
            className="sparkle-5"
          />
          <circle 
            cx="60" 
            cy="50" 
            r="1.0" 
            fill="#FFFFFF"
            opacity="0.6"
            className="sparkle-6"
          />
        </g>
      )}
    </svg>
  );
});

Logo.displayName = 'Logo';

export default Logo;

