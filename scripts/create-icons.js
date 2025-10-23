const fs = require('fs');
const path = require('path');

// Simple 1x1 blue PNG as base64
const bluePng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Create a simple blue square PNG
const createSimpleIcon = (size) => {
  // This is a minimal PNG - just a blue square
  const canvas = Buffer.from(bluePng, 'base64');
  return canvas;
};

// Generate icons
const sizes = [192, 512];
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const iconData = createSimpleIcon(size);
  const iconPath = path.join(publicDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(iconPath, iconData);
  console.log(`Created icon-${size}x${size}.png`);
});

console.log('Icon generation complete!');
