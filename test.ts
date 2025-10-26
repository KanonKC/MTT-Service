import { authenticate } from '@google-cloud/local-auth';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// The scope for reading file metadata.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The path to the credentials file.
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Lists the names and IDs of up to 10 files.
 */
async function listFiles() {
  const credentials = JSON.parse(readFileSync('credentials.json', 'utf8'));
  const auth = new google.auth.OAuth2({
    clientId: credentials.web.client_id,
    clientSecret: credentials.web.client_secret,
    redirectUri: credentials.web.redirect_uris[0],
  })

  const token = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })

  console.log(token);

  // Create a new Drive API client.
  const drive = google.drive({version: 'v3', auth});
  // Get the list of files.
  const result = await drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });
  const files = result.data.files;
  if (!files || files.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log('Files:');
  // Print the name and ID of each file.
  files.forEach((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}

listFiles();