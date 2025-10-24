const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Setting up HTTPS for local PWA development...');

// Create a simple HTTPS server setup
const httpsSetup = `
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;

// Create self-signed certificate
const httpsOptions = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost.pem'),
};

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(\`🚀 Ready on https://\${hostname}:\${port}\`);
      console.log('📱 You can now test PWA installation on your tablet!');
    });
});
`;

// Write the HTTPS server file
fs.writeFileSync('./https-server.js', httpsSetup);

console.log('✅ HTTPS server setup created');
console.log('📝 Next steps:');
console.log('1. Run: npm install --save-dev mkcert');
console.log('2. Run: npx mkcert create-ca');
console.log('3. Run: npx mkcert create-cert --domains localhost');
console.log('4. Run: node https-server.js');
console.log('5. Visit: https://localhost:3001/debug-pwa.html');
console.log('');
console.log('⚠️  Note: You may need to accept the self-signed certificate in your browser');
