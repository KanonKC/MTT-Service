const credentials = JSON.parse(readFileSync('credentials.json', 'utf8'));

const oauth2Client = new google.auth.OAuth2(credentials.web.client_id, credentials.web.client_secret, credentials.web.redirect_uris[0]);
