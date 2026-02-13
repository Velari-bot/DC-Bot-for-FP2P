# Pathgen Logo Guidelines

**Version 1.0** | Last Updated: November 2025

---

## 📦 Overview

The Pathgen logo is a monochrome geometric "P" mark with gem-like facets and optional cosmic sparkle effects. It represents precision, gaming excellence, and AI-powered intelligence.

---

## 🎨 Color Palette

### Primary Colors (Strict Monochrome)

| Color | Hex | Usage |
|-------|-----|-------|
| **Black** | `#000000` | Primary glyph (light backgrounds) |
| **White** | `#FFFFFF` | Sparkles, inverse logo (dark backgrounds) |
| **Light Grey** | `#F2F2F2` | Internal facets, highlights |
| **Mid Grey** | `#BDBDBD` | Secondary facets, depth |

### Color Usage Rules

✅ **DO:**
- Use solid black on light backgrounds (#fafafa, #f8f7ff, white)
- Use solid white on dark backgrounds (#000000, #0a0a0a, #1a1a1a)
- Keep sparkles white regardless of background
- Maintain facet opacity at 20-30%

❌ **DON'T:**
- Use colored variants (no purple, pink, blue)
- Place black logo on dark backgrounds
- Place white logo on light backgrounds
- Reduce sparkle opacity below 60%

---

## 📐 Minimum Sizes

| Size | Usage | Sparkles |
|------|-------|----------|
| **16×16px** | Favicon only | ❌ None |
| **32×32px** | Small icons, browser tabs | ❌ None |
| **48×48px** | Navigation bars, buttons | ⚠️ Optional (reduced) |
| **64×64px+** | Headers, cards, hero sections | ✅ Recommended |

### Size Guidelines

- **Below 32px**: Use solid variant only (`pathgen-p-mark-solid.svg`)
- **32-48px**: Use outline variant or solid (no sparkles)
- **48-64px**: Sparkles optional (consider context)
- **64px+**: Full logo with sparkles recommended

---

## 📏 Safe Zones & Spacing

### Clear Space

Maintain clear space around the logo equal to **25% of the logo height** on all sides.

```
┌───────────────────────────┐
│        (25% height)       │
│   ┌─────────────────┐     │
│   │                 │     │ ← 25%
│   │   PATHGEN P     │     │
│   │                 │     │
│   └─────────────────┘     │
│        (25% height)       │
└───────────────────────────┘
```

### Alignment

- **Horizontal**: Center-align logo with text/content
- **Vertical**: Optically center (may be 2-3px higher than mathematical center)
- **In navigation**: Align baseline with text baseline

---

## 🗂️ Logo Variants

### 1. Primary (With Sparkles)
**File**: `assets/logo/pathgen-p-mark.svg`
- ✅ Use for: Headers, hero sections, loading screens
- ✅ Size: 64px or larger
- ✅ Background: Light (#fafafa, #f8f7ff, white)

### 2. Solid Black
**File**: `assets/logo/pathgen-p-mark-solid.svg`
- ✅ Use for: Small icons, navigation, buttons
- ✅ Size: 32px or larger
- ✅ Background: Light

### 3. Solid White
**File**: `assets/logo/pathgen-p-mark-white.svg`
- ✅ Use for: Dark backgrounds, night mode
- ✅ Size: 32px or larger
- ✅ Background: Dark (#000000, #0a0a0a)

### 4. Outline
**File**: `assets/logo/pathgen-p-mark-outline.svg`
- ✅ Use for: Decorative elements, badges, watermarks
- ✅ Size: 48px or larger
- ✅ Background: Any (with contrast)

---

## 💻 Implementation

### React Component

```tsx
import Logo from '@pathgen/ui/components/Logo';

// Default usage (light background, no sparkles)
<Logo size={64} />

// With sparkles (animated)
<Logo size={96} sparkle={true} />

// Dark mode
<Logo size={64} theme="dark" />

// Custom styling
<Logo 
  size="4rem" 
  sparkle={true}
  className="hover:scale-110 transition-transform"
  ariaLabel="Pathgen - AI Fortnite Coach"
/>
```

### Direct SVG (HTML)

```html
<!-- Light background -->
<img src="/assets/logo/pathgen-p-mark.svg" alt="Pathgen" width="64" height="64">

<!-- Dark background -->
<img src="/assets/logo/pathgen-p-mark-white.svg" alt="Pathgen" width="64" height="64">

<!-- Inline with animation -->
<svg class="logo-sparkle-animate" ...>
  <!-- SVG content -->
</svg>
<link rel="stylesheet" href="/styles/logo.css">
```

### Favicon

```html
<link rel="icon" type="image/x-icon" href="/assets/logo/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/logo/png/pathgen-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/logo/png/pathgen-16.png">
```

---

## ✨ Sparkle Effects

### When to Use Sparkles

✅ **Use sparkles when:**
- Logo is 64px or larger
- On hero/landing pages
- In loading states
- In brand showcase areas
- User has NOT enabled reduced motion

❌ **Don't use sparkles when:**
- Logo is below 64px
- In navigation (too distracting)
- User prefers reduced motion
- Performance is critical (mobile)

### Animation Behavior

- **Duration**: 1000-1500ms per sparkle
- **Easing**: `ease-in-out`
- **Stagger**: 100-200ms delays between sparkles
- **Motion**: Subtle vertical translate (6-10px) + opacity pulse
- **Accessibility**: Automatically disabled when `prefers-reduced-motion: reduce`

---

## 🚫 What NOT to Do

### ❌ Incorrect Usage Examples

1. **Don't stretch or distort**
   - Always maintain 1:1 aspect ratio
   
2. **Don't change colors**
   - No brand colors, no gradients on the glyph
   
3. **Don't rotate or skew**
   - Logo must be upright and aligned
   
4. **Don't place on low-contrast backgrounds**
   - Black on dark grey ❌
   - White on light grey ❌
   
5. **Don't add effects**
   - No drop shadows (except built-in sparkle blur)
   - No outer glows
   - No 3D effects
   
6. **Don't combine with other logos**
   - Pathgen logo must stand alone
   
7. **Don't use sparkles at small sizes**
   - They become illegible noise

---

## 📱 Responsive Behavior

### Desktop (>1024px)
- Use 96-128px logo on hero
- Enable sparkles
- Full facet detail visible

### Tablet (768-1024px)
- Use 64-96px logo
- Sparkles optional
- Consider user preference

### Mobile (<768px)
- Use 48-64px logo in header
- Disable sparkles in navigation
- Use solid variant for performance

---

## 🎯 Brand Examples

### ✅ Correct

```
Light hero section:
┌─────────────────────────────┐
│                             │
│       [P with sparkles]     │ ← 96px, animated
│      Welcome to Pathgen     │
│                             │
└─────────────────────────────┘

Dark navigation:
┌─────────────────────────────┐
│ [White P] Pathgen  Home ... │ ← 40px, no sparkles
└─────────────────────────────┘
```

### ❌ Incorrect

```
Too small with sparkles:
[tiny blurry P] Pathgen ← 24px with sparkles = illegible

Wrong contrast:
Dark background + black P ← invisible

Stretched:
[P P P] ← distorted aspect ratio
```

---

## 📦 Asset Locations

```
fortnite-core/
├─ assets/logo/
│  ├─ pathgen-p-mark.svg           # Primary with sparkles
│  ├─ pathgen-p-mark-solid.svg     # Solid black
│  ├─ pathgen-p-mark-white.svg     # Solid white
│  ├─ pathgen-p-mark-outline.svg   # Stroke-based
│  ├─ favicon.ico                  # Multi-size ICO
│  └─ png/
│     ├─ pathgen-512.png
│     ├─ pathgen-256.png
│     ├─ pathgen-128.png
│     ├─ pathgen-64.png
│     └─ pathgen-32.png
│
├─ packages/ui/src/
│  ├─ components/Logo.tsx          # React component
│  └─ styles/logo.css              # Animation styles
│
└─ examples/login/LogoExample.tsx  # Usage examples
```

---

## 🔧 Exporting PNG Files

### Using SVG to PNG Converter (Recommended)

```bash
# Install sharp (Node.js image processing)
npm install sharp

# Run export script
node tools/export-svgs.js
```

### Manual Export (Design Tools)

1. Open `pathgen-p-mark.svg` in Figma/Illustrator/Inkscape
2. Export at these sizes: 512, 256, 128, 64, 32
3. Format: PNG, transparent background
4. Color space: sRGB
5. Save to `assets/logo/png/`

### Online Converter (Quick)

1. Visit: https://svgtopng.com or https://cloudconvert.com/svg-to-png
2. Upload `pathgen-p-mark.svg`
3. Set size (e.g., 512×512)
4. Download and rename to `pathgen-512.png`

---

## 📞 Questions?

For logo usage questions or custom variants, contact:
- **Design Team**: design@pathgen.gg
- **GitHub Issues**: https://github.com/pathgen/fortnite-core/issues

---

## 📄 License

© 2025 Pathgen. All rights reserved.
The Pathgen logo and brand assets may not be used without permission.

---

**Document Version**: 1.0  
**Last Updated**: November 5, 2025  
**Next Review**: January 2026

