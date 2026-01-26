import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { responseService } from '../services/response.service';

/**
 * Save Response Controller
 * POST /api/responses/save
 * Used for auto-save and manual answer submission
 */
export const saveResponse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId, questionId, responseText, responseOptionIndex } = req.body;

    const response = await responseService.saveResponse({
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get Session Responses Controller
 * GET /api/responses/session/:sessionId
 */
export const getSessionResponses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const responses = await responseService.getSessionResponses(sessionId);

    res.json({
      success: true,
      message: 'Session responses retrieved successfully',
      data: {
        responses,
        count: responses.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Save Responses Controller
 * POST /api/responses/bulk
 * Save multiple responses at once (useful for final submission)
 */
export const bulkSaveResponses = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      const saved = await responseService.saveResponse({
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
  } catch (error) {
    next(error);
  }
};
