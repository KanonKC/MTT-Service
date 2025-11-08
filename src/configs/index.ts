import { configDotenv } from "dotenv";
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
    public readonly host: string = 'localhost';
    public readonly port: number = 8000;
    public readonly timeZone: string = 'Asia/Bangkok';
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
        // Read config file
        configDotenv();
        this.host = process.env.HOST || 'localhost';
        this.port = parseInt(process.env.PORT || '8000');
        this.timeZone = process.env.TIME_ZONE || 'Asia/Bangkok';
        this.line = {
            accessToken: process.env.LINE_ACCESS_TOKEN || ''
        }
        this.gemini = {
            apiKey: process.env.GEMINI_API_KEY || '',
            model: process.env.GEMINI_MODEL || ''
        }

        // Read Google OAuth credentials file
        const credentials = JSON.parse(readFileSync('credentials.json', 'utf8'));
        this.googleCredentials = {
            clientId: credentials.web.client_id,
            clientSecret: credentials.web.client_secret,
            redirectUri: credentials.web.redirect_uris[0],
            scopes: credentials.web.scopes
        }
    }
}