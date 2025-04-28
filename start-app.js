// start-app.js
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config();

// Log the API target being used
console.log(`API Target: ${process.env.VITE_API_TARGET || 'Not set (using default)'}`);

// Start the proxy server
console.log('Starting proxy server...');
const proxyServer = spawn('node', [join(__dirname, 'proxy-server.cjs')], {
  stdio: 'inherit'
});

// Start the Vite preview server
console.log('Starting Vite preview server...');
const viteServer = spawn('npm', ['run', 'preview'], {
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  proxyServer.kill();
  viteServer.kill();
  process.exit(0);
});

// Log any errors
proxyServer.on('error', (error) => {
  console.error('Proxy server error:', error);
});

viteServer.on('error', (error) => {
  console.error('Vite server error:', error);
});

console.log('Both servers are running. Press Ctrl+C to stop.');
