export interface SaveResponseData {
    sessionId: string;
    questionId: string;
    responseText?: string;
    responseOptionIndex?: number;
}
export declare class ResponseService {
    /**
     * Save or update a response
     */
    saveResponse(data: SaveResponseData): Promise<any>;
    /**
     * Get all responses for a session
     */
    getSessionResponses(sessionId: string): Promise<any[]>;
    /**
     * Get detailed responses with question and option data
     */
    getDetailedResponses(sessionId: string): Promise<any[]>;
}
export declare const responseService: ResponseService;
//# sourceMappingURL=response.service.d.ts.map