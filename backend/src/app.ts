import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/environment';
import { generalLimiter } from './middleware/rateLimit.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import examRoutes from './routes/exam.routes';
import sessionRoutes from './routes/session.routes';
import responseRoutes from './routes/response.routes';
import violationRoutes from './routes/violation.routes';
import adminRoutes from './routes/admin.routes';
import studentGroupRoutes from './routes/studentGroup.routes';

// Create Express app
export const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (config.cors.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // Serve static files (images for exam questions)
  // Serves files from /attachments folder at /images endpoint
  // In production, images can also be served from a CDN
  const attachmentsPath = path.join(__dirname, '../../attachments');
  const publicImagesPath = path.join(__dirname, '../public/images');
  
  // Try to serve from attachments folder first, then from public/images
  app.use('/images', express.static(attachmentsPath, { maxAge: '1d' }));
  app.use('/images', express.static(publicImagesPath, { maxAge: '1d' }));

  // Apply general rate limiting to all API routes
  app.use('/api', generalLimiter);

  // Register API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/exams', examRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/responses', responseRoutes);
  app.use('/api/violations', violationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin', studentGroupRoutes); // Student group routes (requires admin auth)

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.path,
    });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('❌ Error:', err);

    // Handle specific error types
    if (err.message === 'UNAUTHORIZED_EMAIL') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this exam. Please contact your instructor.',
        code: 'UNAUTHORIZED_EMAIL',
      });
    }

    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (err.message === 'INVALID_TOKEN') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    if (err.message === 'NO_ACTIVE_EXAM') {
      return res.status(404).json({
        success: false,
        message: 'No active exam found',
        code: 'NO_ACTIVE_EXAM',
      });
    }

    if (err.message === 'ACCESS_DENIED_TO_EXAM') {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this exam. It may be restricted to a specific group.',
        code: 'ACCESS_DENIED_TO_EXAM',
      });
    }

    if (err.message === 'SESSION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND',
      });
    }

    if (err.message === 'GROUPS_TABLE_MISSING') {
      return res.status(503).json({
        success: false,
        message:
          'Student groups feature is not set up. Run the database migration: database-migration-student-groups.sql',
        code: 'GROUPS_TABLE_MISSING',
      });
    }

    if (err.message === 'GROUP_NAME_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'A group with this name already exists',
        code: 'GROUP_NAME_EXISTS',
      });
    }

    if (err.message === 'REPORT_COLORS_TABLE_MISSING') {
      return res.status(503).json({
        success: false,
        message:
          'Exam report colors feature is not set up. Run the database migration: backend/database-migration-exam-report-colors-use-session-id.sql',
        code: 'REPORT_COLORS_TABLE_MISSING',
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
  });

  return app;
};
