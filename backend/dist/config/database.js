"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.healthCheck = exports.getClient = exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Railway (and many hosts) provide DATABASE_URL; otherwise use DATABASE_HOST, etc.
const databaseUrl = process.env.DATABASE_URL;
const poolConfig = databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    }
    : {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME || 'proctor_db',
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    };
exports.pool = new pg_1.Pool(poolConfig);
// Test database connection
exports.pool.on('connect', () => {
    console.log('✅ Database connection established');
});
exports.pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});
/**
 * Execute a parameterized query with logging
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV === 'development') {
            console.log('📊 Query executed:', {
                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                rows: res.rowCount,
            });
        }
        return res;
    }
    catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
    }
};
exports.query = query;
/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
    const client = await exports.pool.connect();
    return client;
};
exports.getClient = getClient;
/**
 * Health check query
 */
const healthCheck = async () => {
    try {
        const result = await (0, exports.query)('SELECT NOW()');
        return result.rows.length > 0;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
};
exports.healthCheck = healthCheck;
/**
 * Graceful shutdown
 */
const closePool = async () => {
    try {
        await exports.pool.end();
        console.log('✅ Database pool closed');
    }
    catch (error) {
        console.error('❌ Error closing database pool:', error);
    }
};
exports.closePool = closePool;
//# sourceMappingURL=database.js.map