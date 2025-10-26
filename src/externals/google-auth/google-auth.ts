import Configuration from '@/configs';
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export default class GoogleAuth {
  private readonly cfg: Configuration;
  private readonly oauth2Client: OAuth2Client;

  constructor(cfg: Configuration, oauth2Client: OAuth2Client) {
    this.cfg = cfg;
    this.oauth2Client = oauth2Client;
  }

  generateOAuthUrl() {
    const state = randomBytes(32).toString('hex');
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.cfg.googleCredentials.scopes,
      include_granted_scopes: true,
      state: state,
    });
  }

  async login(code: string) {
    let { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    writeFileSync('token.json', JSON.stringify(tokens), 'utf8');
  }
}
