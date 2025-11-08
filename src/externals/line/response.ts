export interface LineProfile {
    displayName: string;
    userId: string;
    language?: string;
    pictureUrl?: string;
    statusMessage?: string;
}

export interface LineTestWebhookResponse {
    success: boolean;
    timestamp: string;
    statusCode: number;
    reason: string;
    detail: string;
}