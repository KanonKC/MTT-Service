import { readFileSync } from "fs";
import { OAuth2ClientOptions } from "google-auth-library";

export default class Configuration {
    public readonly googleCredentials: OAuth2ClientOptions = {
        clientId: "",
        clientSecret: "",
        redirectUri: "",
    }

    constructor() {
        const credentials = JSON.parse(readFileSync('credentials.json', 'utf8'));
        this.googleCredentials = {
            clientId: credentials.web.client_id,
            clientSecret: credentials.web.client_secret,
            redirectUri: credentials.web.redirect_uris[0],
        }
    }
}