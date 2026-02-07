"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const environment_1 = require("./config/environment");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const exam_routes_1 = __importDefault(require("./routes/exam.routes"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const response_routes_1 = __importDefault(require("./routes/response.routes"));
const violation_routes_1 = __importDefault(require("./routes/violation.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const studentGroup_routes_1 = __importDefault(require("./routes/studentGroup.routes"));
// Create Express app
const createApp = () => {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin)
                return callback(null, true);
            if (environment_1.config.cors.allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: environment_1.config.nodeEnv,
        });
    });
    // Serve static files (images for exam questions)
    // Serves files from /attachments folder at /images endpoint
    // In production, images can also be served from a CDN
    const attachmentsPath = path_1.default.join(__dirname, '../../attachments');
    const publicImagesPath = path_1.default.join(__dirname, '../public/images');
    // Try to serve from attachments folder first, then from public/images
    app.use('/images', express_1.default.static(attachmentsPath, { maxAge: '1d' }));
    app.use('/images', express_1.default.static(publicImagesPath, { maxAge: '1d' }));
    // Apply general rate limiting to all API routes
    app.use('/api', rateLimit_middleware_1.generalLimiter);
    // Register API routes
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/exams', exam_routes_1.default);
    app.use('/api/sessions', session_routes_1.default);
    app.use('/api/responses', response_routes_1.default);
    app.use('/api/violations', violation_routes_1.default);
    app.use('/api/admin', admin_routes_1.default);
    app.use('/api/admin', studentGroup_routes_1.default); // Student group routes (requires admin auth)
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found',
            path: req.path,
        });
    });
    // Global error handler
    app.use((err, _req, res, _next) => {
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
                message: 'Student groups feature is not set up. Run the database migration: database-migration-student-groups.sql',
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
                message: 'Exam report colors feature is not set up. Run the database migration: backend/database-migration-exam-report-colors-use-session-id.sql',
                code: 'REPORT_COLORS_TABLE_MISSING',
            });
        }
        // Default error response
        res.status(500).json({
            success: false,
            message: environment_1.config.nodeEnv === 'production' ? 'Internal server error' : err.message,
            ...(environment_1.config.nodeEnv === 'development' && { stack: err.stack }),
        });
    });
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map