# Pathgen Logo Assets

Monochrome "P" mark with gem-like facets and cosmic sparkles.

## 📁 Files

### SVG (Vector - Use These!)

- **`pathgen-p-mark.svg`** - Primary logo with sparkles (8.2 KB)
  - Use for: Hero sections, loading screens, large displays (64px+)
  - Features: Faceted P + 6 animated sparkles
  
- **`pathgen-p-mark-solid.svg`** - Solid black, no sparkles (0.4 KB)
  - Use for: Navigation, buttons, small icons (32px+)
  - Features: Clean P glyph only

- **`pathgen-p-mark-white.svg`** - Solid white for dark backgrounds (0.5 KB)
  - Use for: Dark mode, night theme, black backgrounds
  - Features: White P with darker facets

- **`pathgen-p-mark-outline.svg`** - Stroke-based outline (0.5 KB)
  - Use for: Decorative, badges, watermarks
  - Features: 2px stroke, no fill

### PNG (Raster - Generate These)

Run `node ../../tools/export-svgs.js` to create:
- `png/pathgen-512.png`
- `png/pathgen-256.png`
- `png/pathgen-128.png`
- `png/pathgen-64.png`
- `png/pathgen-32.png`
- `png/pathgen-16.png`

### Favicon

Generate `favicon.ico` from PNGs:
```bash
# Option 1: Online tool
https://www.favicon-generator.org/

# Option 2: ImageMagick
convert pathgen-16.png pathgen-32.png pathgen-48.png favicon.ico
```

## 🎨 Color Palette

```
#000000  Black       Primary glyph (light backgrounds)
#FFFFFF  White       Sparkles, inverse logo (dark backgrounds)
#F2F2F2  Light Grey  Internal facets, highlights
#BDBDBD  Mid Grey    Secondary facets, depth
```

## 📐 Usage Guidelines

### When to Use Each Variant

| Variant | Size | Background | Sparkles | Use Case |
|---------|------|------------|----------|----------|
| **Primary** | 64px+ | Light | ✅ Yes | Hero, loading, showcase |
| **Solid** | 32px+ | Light | ❌ No | Navigation, icons, buttons |
| **White** | 32px+ | Dark | ❌ No | Dark mode, night theme |
| **Outline** | 48px+ | Any | ❌ No | Decorative, badges |

### Minimum Sizes

- **16×16px**: Favicon only (use solid PNG)
- **32×32px**: Small icons (use solid SVG)
- **48×48px**: Navigation (sparkles optional)
- **64×64px+**: Hero, cards (sparkles recommended)

### Color Rules

✅ **DO**:
- Use black logo on light backgrounds (#fafafa, #f8f7ff, white)
- Use white logo on dark backgrounds (#000000, #0a0a0a, #1a1a1a)
- Keep sparkles white regardless of theme
- Maintain clear space (25% of logo height on all sides)

❌ **DON'T**:
- Use colored variants (no purple, pink, blue)
- Place black logo on dark backgrounds
- Place white logo on light backgrounds
- Stretch or distort (always maintain 1:1 aspect ratio)
- Add outer glows, shadows, or 3D effects
- Reduce size below 32px with sparkles

## 💻 Quick Start

### HTML

```html
<!-- Light background -->
<img src="/assets/logo/pathgen-p-mark.svg" alt="Pathgen" width="64" height="64">

<!-- Dark background -->
<img src="/assets/logo/pathgen-p-mark-white.svg" alt="Pathgen" width="64" height="64">

<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/assets/logo/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/logo/png/pathgen-32.png">
```

### React

```tsx
import Logo from '@pathgen/ui/components/Logo';

// With sparkles (animated)
<Logo size={96} sparkle={true} theme="light" />

// Navigation (no sparkles)
<Logo size={40} theme="dark" />
```

## 📖 Full Documentation

See `../../docs/LOGO-GUIDELINES.md` for:
- Complete usage guidelines
- Safe zones & spacing
- Responsive behavior
- Animation specifications
- DO/DON'T examples
- Brand consistency rules

## 🔧 Export PNG Files

```bash
# Install sharp (if not already)
npm install sharp

# Run export script
node ../../tools/export-svgs.js
```

This will generate all PNG sizes in the `png/` directory.

## 🌐 Live Examples

- **Login**: http://localhost:3000/login.html
- **Setup**: http://localhost:3000/setup.html

## 📞 Questions?

- **Documentation**: `../../docs/LOGO-GUIDELINES.md`
- **React Examples**: `../../examples/login/LogoExample.tsx`
- **Export Tool**: `../../tools/export-svgs.js`

---

**Version**: 1.0  
**Updated**: November 5, 2025  
**Status**: Production Ready ✅

