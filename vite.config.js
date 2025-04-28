import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // Use loaded env vars
  const API_TARGET = env.VITE_API_TARGET

  console.log(`[VITE] Using API target: ${API_TARGET}`)

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api-gateway': {
          target: API_TARGET,
          changeOrigin: true,
          rewrite: (path) => {
            // Remove apenas o primeiro /api-gateway do caminho
            return path.replace('/api-gateway', '');
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (_, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    }
  };
});
