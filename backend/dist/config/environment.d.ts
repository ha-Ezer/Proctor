export declare const config: {
    nodeEnv: string;
    port: number;
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    jwt: {
        secret: string;
        expiration: string;
        adminExpiration: string;
    };
    cors: {
        allowedOrigins: string[];
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        violationLimit: number;
        authLimit: number;
    };
    adminEmail: string;
    logLevel: string;
};
/**
 * Validate required environment variables
 * DB: either DATABASE_URL (Railway) or DATABASE_HOST + DATABASE_NAME + DATABASE_USER
 */
export declare const validateEnvironment: () => void;
//# sourceMappingURL=environment.d.ts.map