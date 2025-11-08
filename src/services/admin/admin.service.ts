import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import Configuration from '@/configs';
import Gemini from '@/externals/gemini/gemini';
import GoogleDrive from '@/externals/google-drive/google-drive';
import LINE from '@/externals/line/line';
import { HealthCheckResponse } from './response';

export default class AdminService {
    private readonly prisma: PrismaClient;
    private readonly line: LINE;
    private readonly googleDrive: GoogleDrive;
    private readonly gemini: Gemini;

    constructor(prisma: PrismaClient, line: LINE, googleDrive: GoogleDrive, gemini: Gemini) {
        this.prisma = prisma;
        this.line = line;
        this.googleDrive = googleDrive;
        this.gemini = gemini;
    }

    async healthCheck(): Promise<HealthCheckResponse> {
        const result: HealthCheckResponse = {
            services: [],
            timestamp: new Date().toISOString(),
        };

        // Check Prisma database connection
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            result.services.push({
                name: 'Database',
                ready: true,
                message: '',
            });
        } catch (error) {
            result.services.push({
                name: 'Database',
                ready: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        // Check LINE API connection
        try {
            const response = await this.line.testWebhookEndpoint();
            result.services.push({
                name: 'LINE API',
                ready: true,
                message: '',
            });
            // Check if webhook endpoint is working
            if (!response.success) {
                result.services.push({
                    name: 'LINE Webhook',
                    ready: false,
                    message: response.detail,
                });
            } else {
                result.services.push({
                    name: 'LINE Webhook',
                    ready: true,
                    message: '',
                });
            }
        } catch (error) {
            result.services.push({
                name: 'LINE API',
                ready: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
            result.services.push({
                name: 'LINE Webhook',
                ready: false,
                message: 'LINE API is not working.',
            });
        }

        // Check Google Drive API
        try {
            const response = await this.googleDrive.list(undefined, 1);
            result.services.push({
                name: 'Google Drive',
                ready: true,
                message: '',
            });
        } catch (error) {
            result.services.push({
                name: 'Google Drive',
                ready: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        // Check Google Gemini API
        try {
            await this.gemini.generateText('Hello Gemini.');
            result.services.push({
                name: 'Google Gemini',
                ready: true,
                message: '',
            });
        } catch (error) {
            result.services.push({
                name: 'Google Gemini',
                ready: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }

        return result;
    }
}
