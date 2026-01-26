"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkSaveResponses = exports.getSessionResponses = exports.saveResponse = void 0;
const response_service_1 = require("../services/response.service");
/**
 * Save Response Controller
 * POST /api/responses/save
 * Used for auto-save and manual answer submission
 */
const saveResponse = async (req, res, next) => {
    try {
        const { sessionId, questionId, responseText, responseOptionIndex } = req.body;
        const response = await response_service_1.responseService.saveResponse({
            sessionId,
            questionId,
            responseText,
            responseOptionIndex,
        });
        res.json({
            success: true,
            message: 'Response saved successfully',
            data: response,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.saveResponse = saveResponse;
/**
 * Get Session Responses Controller
 * GET /api/responses/session/:sessionId
 */
const getSessionResponses = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const responses = await response_service_1.responseService.getSessionResponses(sessionId);
        res.json({
            success: true,
            message: 'Session responses retrieved successfully',
            data: {
                responses,
                count: responses.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionResponses = getSessionResponses;
/**
 * Bulk Save Responses Controller
 * POST /api/responses/bulk
 * Save multiple responses at once (useful for final submission)
 */
const bulkSaveResponses = async (req, res, next) => {
    try {
        const { sessionId, responses } = req.body;
        if (!Array.isArray(responses) || responses.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Responses array is required',
                code: 'INVALID_RESPONSES',
            });
        }
        const results = [];
        for (const response of responses) {
            const saved = await response_service_1.responseService.saveResponse({
                sessionId,
                questionId: response.questionId,
                responseText: response.responseText,
                responseOptionIndex: response.responseOptionIndex,
            });
            results.push(saved);
        }
        res.json({
            success: true,
            message: `${results.length} responses saved successfully`,
            data: {
                savedCount: results.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkSaveResponses = bulkSaveResponses;
//# sourceMappingURL=response.controller.js.map