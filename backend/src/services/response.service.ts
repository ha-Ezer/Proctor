import { pool, getClient } from '../config/database';

export interface SaveResponseData {
  sessionId: string;
  questionId: string;
  responseText?: string;
  responseOptionIndex?: number;
}

export class ResponseService {
  /**
   * Save or update a response
   */
  async saveResponse(data: SaveResponseData) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check if this is a multiple-choice question to determine correctness
      let isCorrect: boolean | null = null;

      if (data.responseOptionIndex !== undefined) {
        const optionResult = await client.query(
          `SELECT is_correct FROM question_options
           WHERE question_id = $1 AND option_index = $2`,
          [data.questionId, data.responseOptionIndex]
        );

        if (optionResult.rows.length > 0) {
          isCorrect = optionResult.rows[0].is_correct;
        }
      }

      // Upsert response
      const result = await client.query(
        `INSERT INTO responses (
          session_id, question_id, response_text,
          response_option_index, is_correct, answered_at, revision_count
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 0)
        ON CONFLICT (session_id, question_id) DO UPDATE SET
          response_text = EXCLUDED.response_text,
          response_option_index = EXCLUDED.response_option_index,
          is_correct = EXCLUDED.is_correct,
          updated_at = CURRENT_TIMESTAMP,
          revision_count = responses.revision_count + 1
        RETURNING *`,
        [data.sessionId, data.questionId, data.responseText, data.responseOptionIndex, isCorrect]
      );

      // Update session stats
      await client.query('SELECT update_session_stats($1)', [data.sessionId]);

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving response:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all responses for a session
   */
  async getSessionResponses(sessionId: string) {
    const result = await pool.query(
      `SELECT
        r.*,
        q.question_number,
        q.question_text,
        q.question_type
       FROM responses r
       JOIN questions q ON r.question_id = q.id
       WHERE r.session_id = $1
       ORDER BY q.question_number`,
      [sessionId]
    );

    return result.rows;
  }

  /**
   * Get detailed responses with question and option data
   */
  async getDetailedResponses(sessionId: string) {
    const responses = await pool.query(
      `SELECT
        r.*,
        q.question_number,
        q.question_text,
        q.question_type,
        q.image_url
       FROM responses r
       JOIN questions q ON r.question_id = q.id
       WHERE r.session_id = $1
       ORDER BY q.question_number`,
      [sessionId]
    );

    // For multiple-choice, get all options
    const detailedResponses = await Promise.all(
      responses.rows.map(async (response) => {
        if (response.question_type === 'multiple-choice') {
          const optionsResult = await pool.query(
            `SELECT option_index, option_text, is_correct
             FROM question_options
             WHERE question_id = $1
             ORDER BY option_index`,
            [response.question_id]
          );

          const options = optionsResult.rows;
          const selectedOption =
            response.response_option_index !== null ? options[response.response_option_index] : null;

          return {
            ...response,
            options,
            selectedOption: selectedOption?.option_text || null,
            correctAnswer: options.find((o) => o.is_correct)?.option_text || null,
          };
        }

        return response;
      })
    );

    return detailedResponses;
  }
}

export const responseService = new ResponseService();
