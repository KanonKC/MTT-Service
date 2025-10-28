import { createReadStream, createWriteStream, readFileSync } from "fs";
import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import { Readable } from "stream";
import { MimeType } from "./request";
import { GoogleDriveFileList } from "./response";

export default class GoogleDrive {
    private readonly auth: OAuth2Client;
    private readonly drive: drive_v3.Drive;

    constructor(auth: OAuth2Client, drive: drive_v3.Drive) {
        this.auth = auth;
        this.drive = drive;
    }

    async list(q?: string, pageSize?: number) {
        const result = await this.drive.files.list({
            pageSize: pageSize ?? 5,
            q: q ?? undefined,
            fields: 'nextPageToken, files(id, name, parents, mimeType)',
            orderBy: 'createdTime desc'
        });
        return result.data
    }

    async listFiles(): Promise<drive_v3.Schema$File[]> {
        const result = await this.drive.files.list({
            pageSize: 100,
        });
        return result.data.files ?? [];
    }

    async createFile(stream: Readable, mimeType: MimeType, filename: string) {
        return this.drive.files.create({
            requestBody: {
                mimeType,
                name: filename,
            },
            media: {
                mimeType,
                body: stream,
            }
        })
    }

    async getFile(fileId: string) {
        return this.drive.files.get({
            fileId
        })
    }

    async downloadFile(fileId: string) {
        return this.drive.files.get({
            fileId,
            alt: 'media',
        }, {
            responseType: 'stream'
        })
    }

    async listFileByFolderId(folderId: string) {
        const response = await this.drive.files.list({
            pageSize: 100,
            q: `'${folderId}' in parents`
        });
        return response.data ?? [];
    }

    async listFolder() {
        const response = await this.drive.files.list({
            pageSize: 100,
            q: `mimeType='application/vnd.google-apps.folder'`,
        });
        return response.data ?? [];
    }

    async listImageFile() {
        const response = await this.drive.files.list({
            pageSize: 100,
            q: `name contains 'bookcover'`,
        });
        return response.data ?? [];
    }

    async export(fileId: string, mimeType: MimeType) {
        return this.drive.files.export({
            fileId,
            mimeType,
        })
    }

    async download(fileId: string, filename: string) {
        const { data } = await this.downloadFile(fileId);
        const dest = createWriteStream(filename);
        data.pipe(dest);
    }

    async uploadPDF(filename: string, base64: string) {
        const buffer = Buffer.from(base64, 'base64');
        const stream = Readable.from(buffer);
        return this.createFile(stream, MimeType.PDF, filename);
    }

}