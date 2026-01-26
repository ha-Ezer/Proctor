"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
// Validate environment variables
(0, environment_1.validateEnvironment)();
// Create Express app
const app = (0, app_1.createApp)();
// Start server
const server = app.listen(environment_1.config.port, async () => {
    console.log('');
    console.log('========================================');
    console.log('🎓 PROCTORED EXAM SYSTEM - BACKEND');
    console.log('========================================');
    console.log(`Environment: ${environment_1.config.nodeEnv}`);
    console.log(`Server: http://localhost:${environment_1.config.port}`);
    console.log(`Health Check: http://localhost:${environment_1.config.port}/health`);
    console.log('========================================');
    // Test database connection
    const dbHealthy = await (0, database_1.healthCheck)();
    if (dbHealthy) {
        console.log('✅ Database connection: OK');
    }
    else {
        console.error('❌ Database connection: FAILED');
        console.error('Please check your DATABASE_* environment variables');
    }
    console.log('========================================');
    console.log('');
});
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    server.close(async () => {
        console.log('✅ HTTP server closed');
        await (0, database_1.closePool)();
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
exports.default = server;
//# sourceMappingURL=server.js.map