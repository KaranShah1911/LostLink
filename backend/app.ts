import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import authRoutes from './routes/authRoutes';
import itemRoutes from './routes/itemRoutes';
import adminRoutes from './routes/adminRoutes';
import claimRoutes from './routes/claimRoutes';
import userRoutes from './routes/userRoutes';
import { MAX_IMAGE_SIZE_MB } from './middleware/uploadMiddleware';

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

// GET /api/health — quick check that the server (and database) is reachable from the phone.
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
// Claim routes use full paths (/api/items/:id/claims..., /api/claims/...) and protect each route themselves.
app.use('/api', claimRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler: logs details on the server, returns a short message to the client (no stack traces).
// Express 5 forwards errors thrown in async route handlers here automatically.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `Image must be smaller than ${MAX_IMAGE_SIZE_MB} MB`
        : 'Only one JPG, PNG, WEBP or HEIC image is allowed in the "image" field';
    return res.status(400).json({ success: false, message });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON' });
  }
  if ((error as { code?: number })?.code === 11000) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  console.error(error);
  res.status(500).json({ success: false, message: 'Something went wrong on the server' });
});

export default app;
