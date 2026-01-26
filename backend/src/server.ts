import { createApp } from './app';
import { config, validateEnvironment } from './config/environment';
import { healthCheck, closePool } from './config/database';

// Validate environment variables
validateEnvironment();

// Create Express app
const app = createApp();

// Start server
const server = app.listen(config.port, async () => {
  console.log('');
  console.log('========================================');
  console.log('🎓 PROCTORED EXAM SYSTEM - BACKEND');
  console.log('========================================');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server: http://localhost:${config.port}`);
  console.log(`Health Check: http://localhost:${config.port}/health`);
  console.log('========================================');

  // Test database connection
  const dbHealthy = await healthCheck();
  if (dbHealthy) {
    console.log('✅ Database connection: OK');
  } else {
    console.error('❌ Database connection: FAILED');
    console.error('Please check your DATABASE_* environment variables');
  }

  console.log('========================================');
  console.log('');
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('✅ HTTP server closed');

    await closePool();

    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default server;
