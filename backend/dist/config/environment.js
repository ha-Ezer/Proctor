"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    // Database
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        name: process.env.DATABASE_NAME || 'proctor_db',
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
    },
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
        expiration: process.env.JWT_EXPIRATION || '2h',
        adminExpiration: process.env.ADMIN_JWT_EXPIRATION || '24h',
    },
    // CORS
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    },
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        violationLimit: parseInt(process.env.VIOLATION_RATE_LIMIT || '20'),
        authLimit: parseInt(process.env.AUTH_RATE_LIMIT || '5'),
    },
    // Email
    adminEmail: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
};
/**
 * Validate required environment variables
 * DB: either DATABASE_URL (Railway) or DATABASE_HOST + DATABASE_NAME + DATABASE_USER
 */
const validateEnvironment = () => {
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasDatabaseVars = !!process.env.DATABASE_HOST && !!process.env.DATABASE_NAME && !!process.env.DATABASE_USER;
    if (!hasDatabaseUrl && !hasDatabaseVars) {
        console.error('❌ Set either DATABASE_URL or (DATABASE_HOST, DATABASE_NAME, DATABASE_USER) for the database');
        process.exit(1);
    }
    if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET is required');
        process.exit(1);
    }
    if (exports.config.nodeEnv === 'production' && exports.config.jwt.secret === 'change_this_secret_in_production') {
        console.error('❌ JWT_SECRET must be changed in production');
        process.exit(1);
    }
    console.log('✅ Environment variables validated');
};
exports.validateEnvironment = validateEnvironment;
//# sourceMappingURL=environment.js.map