import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export default class GoogleAuth {
  private oauth2Client: OAuth2Client;

  constructor(oauth2Client: OAuth2Client) {
    this.oauth2Client = oauth2Client;
  }

  generateAuthUrl() {
    const state = randomBytes(32).toString('hex');
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/calendar.readonly'],
      include_granted_scopes: true,
      state: state
    });
  }
}
