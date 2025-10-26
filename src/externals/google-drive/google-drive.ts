import { createReadStream } from "fs";
import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";

export default class GoogleDrive {
    private readonly auth: OAuth2Client;
    private readonly drive: drive_v3.Drive;

    constructor(auth: OAuth2Client) {
        this.auth = auth;
        this.drive = google.drive({version: 'v3', auth: this.auth});
    }

    async listFiles(): Promise<drive_v3.Schema$File[]> {
        const result = await this.drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
        });
        return result.data.files ?? [];
    }

    async createPDFFile() {
        // Upload type = media

        const fileId = await this.drive.files.generateIds()

        return this.drive.files.create({
            requestBody: {
                mimeType: 'application/pdf',
                name: 'mint-test.pdf',
            },
            media: {
                mimeType: 'application/pdf',
                body: createReadStream('sample.pdf'),
            }
        })
    }
}