import Configuration from '@/configs';
import axios, { AxiosInstance } from 'axios';
import { LineProfile } from './response';

export default class LINE {
    private readonly config: Configuration;
    private readonly lineAPI: AxiosInstance;
    private readonly lineDataAPI: AxiosInstance;
    constructor(config: Configuration) {
        this.config = config;
        this.lineAPI = axios.create({
            baseURL: 'https://api.line.me/v2/bot',
            headers: {
                Authorization: `Bearer ${this.config.line.accessToken}`,
            },
        });
        this.lineDataAPI = axios.create({
            baseURL: 'https://api-data.line.me/v2/bot',
            headers: {
                Authorization: `Bearer ${this.config.line.accessToken}`,
            },
        });
    }

    async replyMessage(replyToken: string, message: string): Promise<void> {
        await this.lineAPI.post('/message/reply', {
            replyToken,
            messages: [
                {
                    type: 'text',
                    text: message,
                },
            ],
            config: {
                thinkingConfig: {
                    thinkingBudget: 0,
                },
            },
        });
    }

    async getContent(messageId: string): Promise<Buffer> {
        const response = await this.lineDataAPI.get(`/message/${messageId}/content`, {
            responseType: 'arraybuffer',
        });
        return Buffer.from(response.data);
    }

    async getProfile(userId: string): Promise<LineProfile> {
        const response = await this.lineAPI.get<LineProfile>(`/profile/${userId}`);
        return response.data;
    }
}
