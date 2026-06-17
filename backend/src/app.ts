import express, { type Express } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { router } from './routes/index.js';

export function buildApp(): Express {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', router);

  app.use(errorHandler);

  return app;
}
