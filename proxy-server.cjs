// proxy-server.cjs - Using CommonJS for the proxy server
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Load environment variables from .env file
require('dotenv').config();

// Get API target from environment variable
// If not set, use a default value (for backward compatibility)
const API_TARGET = process.env.VITE_API_TARGET;

console.log(`[PROXY] Using API target: ${API_TARGET}`);

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log all requests
app.use((req, res, next) => {
  console.log(`[PROXY] ${req.method} ${req.url}`);
  next();
});

// Create a flexible proxy middleware
const apiProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  pathRewrite: {
    '^/api-gateway': '' // Remove /api-gateway prefix
  },
  onProxyReq: (proxyReq, req) => {
    // Add headers that might help with API authentication
    proxyReq.setHeader('Origin', API_TARGET);
    proxyReq.setHeader('Referer', API_TARGET);

    console.log(`[PROXY] Proxying to: ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes) => {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';

    console.log(`[PROXY] Response status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY] Error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end(`Proxy Error: ${err.message}`);
  }
});

// Apply the proxy middleware to all routes starting with /api-gateway
app.use('/api-gateway', apiProxy);

// Default route
app.get('/', (_, res) => {
  res.send(`Proxy server is running. Proxying requests to ${API_TARGET}`);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Use http://localhost:${PORT}/api-gateway/... for your API requests`);
});
