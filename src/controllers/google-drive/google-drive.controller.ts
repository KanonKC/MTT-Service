import GoogleDrive from "@/externals/google-drive/google-drive";
import { FastifyReply, FastifyRequest } from "fastify";

export default class GoogleDriveController {
    private readonly googleDrive: GoogleDrive;

    constructor(googleDrive: GoogleDrive) {
        this.googleDrive = googleDrive;
    }

    async listFiles(req: FastifyRequest, res: FastifyReply) {
        const files = await this.googleDrive.listFiles();
        res.status(200).send({ files });
    }

    async uploadPDF(req: FastifyRequest<{
        Body: {
            filename: string;
            base64: string;
        }
    }>, res: FastifyReply) {
        const { filename, base64 } = req.body;
        const response = await this.googleDrive.uploadPDF(filename, base64);
        res.status(201).send({ ...response.data });
    }
}