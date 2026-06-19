import express, { type Express } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { lineRouter } from './routes/line.js';
import { router } from './routes/index.js';

export function buildApp(): Express {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));

  // LINE webhook ต้องการ raw body — mount ก่อน express.json()
  app.use('/line', lineRouter);

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'carekan-backend', version: '1.0.0' });
  });

  app.use('/api', router);

  app.use(errorHandler);

  return app;
}
