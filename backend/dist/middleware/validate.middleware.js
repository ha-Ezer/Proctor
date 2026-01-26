"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
const zod_1 = require("zod");
/**
 * Middleware factory to validate request body against Zod schema
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
/**
 * Middleware factory to validate query parameters against Zod schema
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            // Convert query string values to appropriate types
            const parsedQuery = {};
            for (const [key, value] of Object.entries(req.query)) {
                // Try to parse numbers
                if (typeof value === 'string' && /^\d+$/.test(value)) {
                    parsedQuery[key] = parseInt(value, 10);
                }
                else {
                    parsedQuery[key] = value;
                }
            }
            const validatedQuery = schema.parse(parsedQuery);
            req.query = validatedQuery;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
/**
 * Middleware factory to validate URL parameters against Zod schema
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
exports.validateParams = validateParams;
//# sourceMappingURL=validate.middleware.js.map