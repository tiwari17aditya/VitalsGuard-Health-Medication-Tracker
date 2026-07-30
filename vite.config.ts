import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env variables (including server-side ones without VITE_ prefix)
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'VitalsGuard Diabetes, BP & Medication Tracker',
          short_name: 'VitalsGuard',
          description: 'Multi-user health and medication dashboard for parents and caretakers',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
      // Custom serverless emulation middleware for local API endpoints
      {
        name: 'api-serverless-emulator',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && (req.url.startsWith('/api/send_mail') || req.url === '/api/send_mail')) {
              const originalEnd = res.end.bind(res);
              try {
                // 1. Read request body chunks
                const chunks: any[] = [];
                for await (const chunk of req) {
                  chunks.push(chunk);
                }
                const rawBody = Buffer.concat(chunks).toString('utf-8');
                
                let body = {};
                if (rawBody) {
                  try {
                    body = JSON.parse(rawBody);
                  } catch (e) {
                    console.warn('[API Emulator] Failed to parse request body as JSON:', e);
                  }
                }

                // 2. Mock Vercel response helper methods
                const resMock = res as any;
                resMock.status = (statusCode: number) => {
                  res.statusCode = statusCode;
                  return resMock;
                };
                resMock.json = (data: any) => {
                  res.setHeader('Content-Type', 'application/json');
                  originalEnd(JSON.stringify(data));
                  return resMock;
                };
                resMock.end = (chunk?: any, encoding?: any, cb?: any) => {
                  originalEnd(chunk, encoding, cb);
                  return resMock;
                };

                // 3. Mock Vercel request properties
                const reqMock = req as any;
                reqMock.body = body;

                // 4. Dynamically import and execute the handler
                // @ts-ignore
                const { default: handler } = await import('./api/send_mail.js');
                await handler(reqMock, resMock);
              } catch (err: any) {
                console.error('[API Emulator Error]:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                originalEnd(JSON.stringify({ error: err.message || 'Internal Server Error' }));
              }
              return;
            }
            next();
          });
        }
      }
    ],
    base: './', // Allows seamless hosting on GitHub Pages, Vercel, or custom domains
    build: {
      chunkSizeWarningLimit: 1000
    }
  };
});
