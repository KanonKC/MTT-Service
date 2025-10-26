import { createReadStream, readFileSync } from "fs";
import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import { Readable } from "stream";

export default class GoogleDrive {
    private readonly auth: OAuth2Client;
    private readonly drive: drive_v3.Drive;

    constructor(auth: OAuth2Client, drive: drive_v3.Drive) {
        this.auth = auth;
        this.drive = drive;
    }

    async listFiles(): Promise<drive_v3.Schema$File[]> {
        const result = await this.drive.files.list({
            pageSize: 100,
        });
        return result.data.files ?? [];
    }

    async uploadPDF(filename: string, base64: string) {
        const buffer = Buffer.from(base64, 'base64');
        const stream = Readable.from(buffer);
        return this.drive.files.create({
            requestBody: {
                mimeType: 'application/pdf',
                name: filename,
            },
            media: {
                mimeType: 'application/pdf',
                body: stream,
            }
        })
    }

    async getFile(fileId: string) {
        return this.drive.files.get({
            fileId
        })
    }

    async listFileByFolderId(folderId: string) {
        const response = await this.drive.files.list({
            pageSize: 100,
            q: `'${folderId}' in parents`
        });
        return response.data ?? [];
    }
}