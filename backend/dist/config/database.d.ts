import { Pool } from 'pg';
export declare const pool: Pool;
/**
 * Execute a parameterized query with logging
 */
export declare const query: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
/**
 * Get a client from the pool for transactions
 */
export declare const getClient: () => Promise<import("pg").PoolClient>;
/**
 * Health check query
 */
export declare const healthCheck: () => Promise<boolean>;
/**
 * Graceful shutdown
 */
export declare const closePool: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map