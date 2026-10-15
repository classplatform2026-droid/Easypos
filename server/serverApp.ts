import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { initDatabase, AuditRepo } from './db';
import { initSocketIO } from './socket';
import { authRouter } from './routes/authRoutes';
import { posRouter } from './routes/posRoutes';
import { adminRouter } from './routes/adminRoutes';

export async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  console.log('[ShopPOS Server] Initializing Socket.IO realtime connection engine...');
  initSocketIO(httpServer);

  const isAiStudio = Boolean(process.env.APPLET_ID || process.env.DEFAULT_APP_PORT);
  const PORT = isAiStudio ? 3000 : parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  const corsMiddleware = cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });
  app.use(corsMiddleware);
  app.options('*', corsMiddleware);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'shoppos-owner',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', posRouter);

  // Route-level fallback for database offline errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (
      err.name === 'MongooseError' ||
      err.name === 'MongoNetworkError' ||
      err.name === 'MongoServerSelectionError' ||
      (err.message && (err.message.includes('buffering timed out') || err.message.includes('failed to connect to server')))
    ) {
      console.warn('[AI Studio] Database offline — returning fallback response');
      if (req.method === 'GET') {
        return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      }
      return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    next(err);
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[ShopPOS Server] Serving POS web app with Realtime WebSockets at http://0.0.0.0:${PORT}`);
  });

  console.log('[ShopPOS Server] Initializing MongoDB persistence & collections...');
  await initDatabase().catch((err) => {
    console.warn('[ShopPOS Server] Database initialization notice:', err);
  });

    // Recurring auto-purge: purge audit & system events older than 90 days every 24 hours
    const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;
    setInterval(async () => {
      try {
        await AuditRepo.purgeOlderThanDays(90);
      } catch (err) {
        console.warn('[AuditPurge] Error during periodic 90-day audit purge:', err);
      }
    }, PURGE_INTERVAL_MS);

  const handleExit = () => {
    console.log('[ShopPOS Server] Received exit signal, closing server gracefully...');
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleExit);
  process.on('SIGINT', handleExit);
}
