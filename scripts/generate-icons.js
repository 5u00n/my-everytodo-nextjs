const fs = require('fs');
const path = require('path');

// Simple SVG icon generator for PWA icons
const generateIcon = (size) => {
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#3B82F6"/>
  <path d="M${size * 0.3} ${size * 0.25} L${size * 0.7} ${size * 0.25} L${size * 0.65} ${size * 0.4} L${size * 0.35} ${size * 0.4} Z" fill="white"/>
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.15}" fill="white"/>
  <path d="M${size * 0.3} ${size * 0.65} L${size * 0.7} ${size * 0.65} L${size * 0.65} ${size * 0.8} L${size * 0.35} ${size * 0.8} Z" fill="white"/>
  <text x="${size * 0.5}" y="${size * 0.9}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.1}" fill="white" font-weight="bold">⏰</text>
</svg>`;
  return svg;
};

// Generate icons
const sizes = [192, 512];
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const iconSvg = generateIcon(size);
  const iconPath = path.join(publicDir, `icon-${size}x${size}.png`);
  
  // For now, we'll create SVG files since we don't have a PNG converter
  const svgPath = path.join(publicDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, iconSvg);
  
  console.log(`Generated icon-${size}x${size}.svg`);
});

console.log('Icon generation complete!');
console.log('Note: You may want to convert SVG to PNG for better PWA support.');
