import Configuration from '@/configs';
import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export default class GoogleAuth {
    private readonly cfg: Configuration;
    private readonly oauth2Client: OAuth2Client;

    constructor(cfg: Configuration) {
        this.cfg = cfg;
        this.oauth2Client = new OAuth2Client(cfg.googleCredentials);
        const token = JSON.parse(readFileSync('token.json', 'utf8'));
        this.oauth2Client.setCredentials(token);
    }

    getOAuth2Client(): OAuth2Client {
        return this.oauth2Client;
    }

    generateOAuthUrl(): string {
        const state = randomBytes(32).toString('hex');
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.cfg.googleCredentials.scopes,
            include_granted_scopes: true,
            state: state,
        });
    }

    async login(code: string): Promise<void> {
        let { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        writeFileSync('token.json', JSON.stringify(tokens), 'utf8');
    }
}
