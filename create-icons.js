const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a simple PNG icon generator
function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#3B82F6';
  ctx.fillRect(0, 0, size, size);

  // Rounded corners
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.125);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // White inner rectangle
  ctx.fillStyle = '#FFFFFF';
  const margin = size * 0.125;
  ctx.fillRect(margin, margin, size - margin * 2, size - margin * 2);

  // Blue content area
  ctx.fillStyle = '#3B82F6';
  const contentMargin = size * 0.2;
  ctx.fillRect(contentMargin, contentMargin, size - contentMargin * 2, size - contentMargin * 2);

  // White lines for todo items
  ctx.fillStyle = '#FFFFFF';
  const lineHeight = size * 0.05;
  const lineSpacing = size * 0.08;
  
  for (let i = 0; i < 3; i++) {
    const y = contentMargin + (i + 1) * lineSpacing;
    const width = size - contentMargin * 2 - (i * size * 0.1);
    ctx.fillRect(contentMargin, y, width, lineHeight);
  }

  // Circles for checkboxes
  ctx.fillStyle = '#10B981';
  const circleSize = size * 0.08;
  const circleY = contentMargin + lineSpacing * 2;
  
  ctx.beginPath();
  ctx.arc(contentMargin + circleSize, circleY, circleSize, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(contentMargin + circleSize * 3, circleY, circleSize, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(contentMargin + circleSize * 5, circleY, circleSize, 0, 2 * Math.PI);
  ctx.fill();

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename} (${size}x${size})`);
}

try {
  createIcon(192, 'public/icon-192.png');
  createIcon(512, 'public/icon-512.png');
  console.log('Icons created successfully!');
} catch (error) {
  console.log('Canvas not available, creating simple SVG icons instead...');
  
  // Fallback: Create simple SVG icons
  const svg192 = `<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" rx="24" fill="#3B82F6"/>
    <rect x="24" y="24" width="144" height="144" rx="16" fill="white"/>
    <rect x="48" y="64" width="96" height="8" rx="4" fill="#3B82F6"/>
    <rect x="48" y="80" width="80" height="8" rx="4" fill="#3B82F6"/>
    <rect x="48" y="96" width="88" height="8" rx="4" fill="#3B82F6"/>
    <circle cx="64" cy="120" r="8" fill="#10B981"/>
    <circle cx="96" cy="120" r="8" fill="#EF4444"/>
    <circle cx="128" cy="120" r="8" fill="#F59E0B"/>
  </svg>`;

  const svg512 = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="64" fill="#3B82F6"/>
    <rect x="64" y="64" width="384" height="384" rx="32" fill="white"/>
    <rect x="128" y="160" width="256" height="24" rx="12" fill="#3B82F6"/>
    <rect x="128" y="200" width="200" height="24" rx="12" fill="#3B82F6"/>
    <rect x="128" y="240" width="240" height="24" rx="12" fill="#3B82F6"/>
    <circle cx="192" cy="320" r="24" fill="#10B981"/>
    <circle cx="256" cy="320" r="24" fill="#EF4444"/>
    <circle cx="320" cy="320" r="24" fill="#F59E0B"/>
  </svg>`;

  fs.writeFileSync('public/icon-192.png', svg192);
  fs.writeFileSync('public/icon-512.png', svg512);
  console.log('SVG icons created as fallback');
}
