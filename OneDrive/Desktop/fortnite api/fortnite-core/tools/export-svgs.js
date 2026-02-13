/**
 * SVG to PNG Export Script
 * 
 * Converts Pathgen logo SVGs to PNG files at multiple sizes.
 * Requires: sharp (npm install sharp)
 * 
 * Usage: node tools/export-svgs.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Sharp not found. Install it with: npm install sharp');
  console.log('\n📝 Alternative: Use an online converter:');
  console.log('   1. Visit https://svgtopng.com');
  console.log('   2. Upload assets/logo/pathgen-p-mark.svg');
  console.log('   3. Export at sizes: 512, 256, 128, 64, 32');
  console.log('   4. Save to assets/logo/png/');
  process.exit(1);
}

const SIZES = [512, 256, 128, 64, 32, 16];
const SVG_PATH = path.join(__dirname, '../assets/logo/pathgen-p-mark.svg');
const OUTPUT_DIR = path.join(__dirname, '../assets/logo/png');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read SVG file
const svgBuffer = fs.readFileSync(SVG_PATH);

console.log('🎨 Exporting Pathgen logo to PNG...\n');

// Export each size
Promise.all(
  SIZES.map(async (size) => {
    const outputPath = path.join(OUTPUT_DIR, `pathgen-${size}.png`);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png({
          compressionLevel: 9,
          palette: false, // Use full color depth
        })
        .toFile(outputPath);
      
      console.log(`✅ Exported ${size}×${size}px → ${outputPath}`);
      return { size, success: true };
    } catch (error) {
      console.error(`❌ Failed to export ${size}×${size}px:`, error.message);
      return { size, success: false, error };
    }
  })
).then((results) => {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n✨ Export complete: ${successful} successful, ${failed} failed`);
  
  if (successful > 0) {
    console.log(`\n📦 PNG files saved to: ${OUTPUT_DIR}`);
  }
  
  // Generate favicon.ico instructions
  console.log('\n📄 To generate favicon.ico:');
  console.log('   1. Visit https://www.favicon-generator.org/');
  console.log('   2. Upload pathgen-64.png or pathgen-32.png');
  console.log('   3. Download and save to assets/logo/favicon.ico');
  console.log('   OR use ImageMagick:');
  console.log('      convert pathgen-16.png pathgen-32.png pathgen-48.png favicon.ico');
});

// Also export solid and white variants
const VARIANTS = [
  { file: 'pathgen-p-mark-solid.svg', prefix: 'pathgen-solid' },
  { file: 'pathgen-p-mark-white.svg', prefix: 'pathgen-white' }
];

console.log('\n🎨 Exporting variant logos...\n');

VARIANTS.forEach(({ file, prefix }) => {
  const svgPath = path.join(__dirname, '../assets/logo', file);
  
  if (!fs.existsSync(svgPath)) {
    console.log(`⚠️  ${file} not found, skipping`);
    return;
  }
  
  const variantBuffer = fs.readFileSync(svgPath);
  
  // Export just the common sizes for variants
  [64, 32].forEach(async (size) => {
    const outputPath = path.join(OUTPUT_DIR, `${prefix}-${size}.png`);
    
    try {
      await sharp(variantBuffer)
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toFile(outputPath);
      
      console.log(`✅ Exported ${prefix} ${size}×${size}px`);
    } catch (error) {
      console.error(`❌ Failed ${prefix} ${size}×${size}px:`, error.message);
    }
  });
});

