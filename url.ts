import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { google } from "googleapis";
const credentials = JSON.parse(readFileSync('credentials.json', 'utf8'));

const oauth2Client = new google.auth.OAuth2(credentials.web.client_id, credentials.web.client_secret, credentials.web.redirect_uris[0]);

// Access scopes for two non-Sign-In scopes: Read-only Drive activity and Google Calendar.
const scopes = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/calendar.readonly'];

// Generate a secure random state value.
const state = randomBytes(32).toString('hex');

// Generate a url that asks permissions for the Drive activity and Google Calendar scope
const authorizationUrl = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',
  /** Pass in the scopes array defined above.
   * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
  scope: scopes,
  // Enable incremental authorization. Recommended as a best practice.
  include_granted_scopes: true,
  // Include the state parameter to reduce the risk of CSRF attacks.
  state: state,
});

console.log(authorizationUrl);