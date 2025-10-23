#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate a unique version based on timestamp and git commit (if available)
function generateVersion() {
  const timestamp = Date.now();
  let gitHash = '';
  
  try {
    const { execSync } = require('child_process');
    gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    // Git not available or not a git repo
    gitHash = 'dev';
  }
  
  return `${timestamp}-${gitHash}`;
}

// Read the service worker template
const templatePath = path.join(__dirname, '..', 'public', 'sw-template.js');
const outputPath = path.join(__dirname, '..', 'public', 'sw.js');

if (fs.existsSync(templatePath)) {
  const template = fs.readFileSync(templatePath, 'utf8');
  const version = generateVersion();
  
  // Replace the placeholder with the actual version
  const serviceWorker = template.replace('{{BUILD_VERSION}}', version);
  
  // Write the generated service worker
  fs.writeFileSync(outputPath, serviceWorker);
  
  console.log(`✅ Service Worker generated with version: ${version}`);
} else {
  console.log('⚠️  Service Worker template not found, using existing sw.js');
}
