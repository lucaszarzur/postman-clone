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

  // Log headers for debugging
  console.log('[PROXY] Request headers:', JSON.stringify(req.headers, null, 2));

  // Log authorization header if present (masked for security)
  if (req.headers.authorization) {
    console.log('[PROXY] Authorization header present:', req.headers.authorization.substring(0, 15) + '...');
  } else {
    console.log('[PROXY] No Authorization header present');
  }

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

    // Forward authorization header if present
    if (req.headers.authorization) {
      console.log(`[PROXY] Forwarding Authorization header to API: ${req.headers.authorization.substring(0, 15)}...`);

      // Decodificar o header de autorização para verificar o formato
      try {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Basic ')) {
          const base64Credentials = authHeader.split(' ')[1];
          const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
          const [username, password] = credentials.split(':');
          console.log(`[PROXY] Decoded credentials - Username: ${username}, Password: ${password ? '[PRESENT]' : '[EMPTY]'}`);
        }
      } catch (error) {
        console.error('[PROXY] Error decoding authorization header:', error.message);
      }
    } else {
      console.log('[PROXY] No Authorization header present in request');
    }

    // Log detailed proxy request info
    console.log(`[PROXY] Proxying to: ${API_TARGET}${proxyReq.path}`);
    console.log(`[PROXY] Method: ${req.method}`);
    console.log(`[PROXY] Path: ${proxyReq.path}`);
    console.log(`[PROXY] Headers being sent to API:`, JSON.stringify(proxyReq.getHeaders(), null, 2));
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';

    console.log(`[PROXY] Response status: ${proxyRes.statusCode}`);
    console.log(`[PROXY] Response headers:`, JSON.stringify(proxyRes.headers, null, 2));

    // Log more details for error responses
    if (proxyRes.statusCode >= 400) {
      console.error(`[PROXY] Error response from API: ${proxyRes.statusCode}`);
      console.error(`[PROXY] Request URL that caused error: ${req.method} ${req.url}`);

      // Log específico para erro 500
      if (proxyRes.statusCode === 500) {
        console.error('========== ERRO 500 DETECTADO ==========');
        console.error(`[PROXY] URL: ${req.url}`);
        console.error(`[PROXY] Method: ${req.method}`);
        console.error(`[PROXY] Headers:`, JSON.stringify(req.headers, null, 2));
        console.error(`[PROXY] Has Auth: ${req.headers.authorization ? 'YES' : 'NO'}`);
        console.error('=========================================');
      }

      // Collect response body for error analysis
      let responseBody = '';
      proxyRes.on('data', (chunk) => {
        responseBody += chunk.toString('utf8');
      });

      proxyRes.on('end', () => {
        try {
          console.error('[PROXY] Error response body:', responseBody);

          // Tentar analisar o corpo da resposta para erros 500
          if (proxyRes.statusCode === 500) {
            console.error('========== CORPO DA RESPOSTA 500 ==========');
            console.error(responseBody);
            console.error('===========================================');
          }
        } catch (e) {
          console.error('[PROXY] Error parsing response body:', e.message);
          console.error('[PROXY] Raw response body:', responseBody);
        }
      });
    }
  },
  onError: (err, req, res) => {
    console.error('[PROXY] Proxy error occurred:', err.message);
    console.error('[PROXY] Error stack:', err.stack);
    console.error('[PROXY] Request URL that caused error:', `${req.method} ${req.url}`);
    console.error('[PROXY] Request headers:', JSON.stringify(req.headers, null, 2));

    // Try to determine the cause of the error
    if (err.code === 'ECONNREFUSED') {
      console.error('[PROXY] Connection refused. API server may be down or unreachable.');
    } else if (err.code === 'ENOTFOUND') {
      console.error('[PROXY] Host not found. Check API_TARGET value:', API_TARGET);
    } else if (err.code === 'ETIMEDOUT') {
      console.error('[PROXY] Connection timed out. API server may be slow or unreachable.');
    }

    res.writeHead(500, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end(`Proxy Error: ${err.message}. Check server logs for details.`);
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
