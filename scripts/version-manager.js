const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const versionFilePath = path.join(__dirname, '..', 'src', 'lib', 'version.ts');

// Read current package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get current version
const currentVersion = packageJson.version || '0.0.0';
const versionParts = currentVersion.split('.').map(Number);

// Increment patch version (0.0.1)
versionParts[2] = (versionParts[2] || 0) + 1;

// Ensure we have 3 parts
while (versionParts.length < 3) {
  versionParts.push(0);
}

const newVersion = versionParts.join('.');

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Generate build timestamp
const buildTimestamp = new Date().toISOString();
const buildNumber = Date.now();

// Create version.ts file
const versionContent = `// Auto-generated version file
// Do not edit manually - this file is updated on each build

export const APP_VERSION = '${newVersion}';
export const BUILD_TIMESTAMP = '${buildTimestamp}';
export const BUILD_NUMBER = ${buildNumber};
export const PWA_VERSION = '${buildNumber}';
export const NODE_VERSION = process.version;

// Version info object
export const VERSION_INFO = {
  appVersion: APP_VERSION,
  buildTimestamp: BUILD_TIMESTAMP,
  buildNumber: BUILD_NUMBER,
  pwaVersion: PWA_VERSION,
  nodeVersion: NODE_VERSION,
  buildDate: new Date(BUILD_TIMESTAMP).toLocaleDateString(),
  buildTime: new Date(BUILD_TIMESTAMP).toLocaleTimeString(),
} as const;

export default VERSION_INFO;
`;

fs.writeFileSync(versionFilePath, versionContent);

console.log(`✅ Version updated: ${currentVersion} → ${newVersion}`);
console.log(`📦 Build number: ${buildNumber}`);
console.log(`🕒 Build timestamp: ${buildTimestamp}`);
console.log(`📁 Version file created: ${versionFilePath}`);
