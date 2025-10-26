import GoogleAuth from "@/externals/google-auth/google-auth";
import { FastifyReply, FastifyRequest } from "fastify";

export default class GoogleAuthController {
    
    private readonly googleAuth: GoogleAuth;

    constructor(googleAuth: GoogleAuth) {
        this.googleAuth = googleAuth;
    }
    async login(req: FastifyRequest<{ Querystring: { code: string } }>, res: FastifyReply) {
        await this.googleAuth.login(req.query.code);
        res.status(200).send({ message: 'success' });
    }

    async generateOAuthUrl(req: FastifyRequest, res: FastifyReply) {
        const url = this.googleAuth.generateOAuthUrl();
        res.status(200).send({ url });
    }

}