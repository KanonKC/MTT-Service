import AuthService from '@/services/auth/auth.service';
import { FastifyReply, FastifyRequest } from 'fastify';

export default class AuthController {
    private readonly authService: AuthService;
    constructor(authService: AuthService) {
        this.authService = authService;
    }

    async getGoogleOAuthUrl(req: FastifyRequest, res: FastifyReply) {
        const url = this.authService.getGoogleOAuthUrl();
        res.status(200).send({ url });
    }

    async loginWithGoogle(req: FastifyRequest<{ Querystring: { code: string } }>, res: FastifyReply) {
        await this.authService.loginWithGoogle(req.query.code);
        res.status(200).send({ message: 'success' });
    }
}
