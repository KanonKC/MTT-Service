import { readFileSync } from "fs";

interface GoogleCredentials {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
}

interface LineConfig {
    accessToken: string;
}

interface GeminiConfig {
    apiKey: string;
    model: string;
}

export default class Configuration {
    public readonly googleCredentials: GoogleCredentials = {
        clientId: "",
        clientSecret: "",
        redirectUri: "",
        scopes: []
    }
    public readonly line: LineConfig = {
        accessToken: "",
    }
    public readonly gemini: GeminiConfig = {
        apiKey: "",
        model: "",
    }

    constructor() {
        const credentials = JSON.parse(readFileSync('credentials.json', 'utf8'));
        this.googleCredentials = {
            clientId: credentials.web.client_id,
            clientSecret: credentials.web.client_secret,
            redirectUri: credentials.web.redirect_uris[0],
            scopes: credentials.web.scopes
        }
        const config = JSON.parse(readFileSync('config.json', 'utf8'));
        this.line = {
            accessToken: config.line.access_token
        }
        this.gemini = {
            apiKey: config.gemini.api_key,
            model: config.gemini.model
        }
    }
}