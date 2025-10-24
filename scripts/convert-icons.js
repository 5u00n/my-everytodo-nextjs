const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const publicDir = path.join(__dirname, '..', 'public');
  const iconSizes = [144, 192, 384, 512];
  
  console.log('🎨 Converting SVG icons to PNG for PWA installation...');
  
  for (const size of iconSizes) {
    const svgPath = path.join(publicDir, `icon-${size === 144 ? '192' : size === 384 ? '512' : size}.svg`);
    const pngPath = path.join(publicDir, `icon-${size}.png`);
    
    try {
      // Check if SVG exists
      if (!fs.existsSync(svgPath)) {
        console.log(`⚠️  SVG not found: ${svgPath}`);
        continue;
      }
      
      // Convert SVG to PNG
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`✅ Created: icon-${size}.png`);
    } catch (error) {
      console.error(`❌ Error converting icon-${size}.png:`, error.message);
    }
  }
  
  console.log('🎉 Icon conversion complete!');
}

convertSvgToPng().catch(console.error);
