import GoogleAuth from "@/externals/google-auth/google-auth";
import GoogleDrive from "@/externals/google-drive/google-drive";
import { FastifyReply, FastifyRequest } from "fastify";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { OAuth2Client } from "google-auth-library";

export default class GoogleAuthController {
    
    private readonly oauth2Client: OAuth2Client;
    private readonly googleAuth: GoogleAuth;
    private readonly googleDrive: GoogleDrive;

    constructor(oauth2Client: OAuth2Client, googleDrive: GoogleDrive, googleAuth: GoogleAuth) {
        this.oauth2Client = oauth2Client;
        this.googleDrive = googleDrive;
        this.googleAuth = googleAuth;
        if (existsSync('token.json')) {
            this.oauth2Client.setCredentials(JSON.parse(readFileSync('token.json', 'utf8')));
        }
    }
    async authCallback(req: FastifyRequest<{ Querystring: { code: string } }>, res: FastifyReply) {
        let { tokens } = await this.oauth2Client.getToken(req.query.code);
        this.oauth2Client.setCredentials(tokens);
        writeFileSync('token.json', JSON.stringify(tokens), 'utf8');
        res.status(200).send({ message: 'success' });
    }

    async listFiles(req: FastifyRequest, res: FastifyReply) {
        const files = await this.googleDrive.listFiles();
        res.status(200).send({ files });
    }

    async login(req: FastifyRequest, res: FastifyReply) {
        const url = this.googleAuth.generateAuthUrl()
        res.send(url);
    }

    async createPDFFile(req: FastifyRequest, res: FastifyReply) {
        try {
            const response = await this.googleDrive.createPDFFile();
            res.status(200).send({ message: 'success', data: response.data });
        } catch (error) {
            res.status(500).send({ message: 'error', error: error });
        }
    }
}