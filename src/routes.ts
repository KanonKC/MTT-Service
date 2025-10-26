import fastify, { FastifyRequest } from 'fastify';
import { readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import GoogleAuthController from './controllers/google-auth/google-auth.controller';
import Configuration from './configs';
import { OAuth2Client } from 'google-auth-library';
import GoogleDrive from './externals/google-drive/google-drive';
import GoogleAuth from './externals/google-auth/google-auth';
import GoogleDriveController from './controllers/google-drive/google-drive.controller';
import LineController from './controllers/line/line.controller';
import LINE from './externals/line/line';

const server = fastify();

const config = new Configuration();

const oauth2Client = new OAuth2Client(config.googleCredentials);
const token = JSON.parse(readFileSync('token.json', 'utf8'));
oauth2Client.setCredentials(token);

const drive = google.drive({version: 'v3', auth: oauth2Client});

const googleAuth = new GoogleAuth(config, oauth2Client);
const googleDrive = new GoogleDrive(oauth2Client, drive);
const line = new LINE(config);

const googleAuthCtrl = new GoogleAuthController(googleAuth);
const googleDriveCtrl = new GoogleDriveController(googleDrive);
const lineCtrl = new LineController(line);


server.get('/', async (req, res) => {
  res.send('Hello World');
});

server.get('/google/login', googleAuthCtrl.generateOAuthUrl.bind(googleAuthCtrl));
server.get('/oauth2callback', googleAuthCtrl.login.bind(googleAuthCtrl));
server.get('/files', googleDriveCtrl.listFiles.bind(googleDriveCtrl));
server.post('/files/pdf', googleDriveCtrl.uploadPDF.bind(googleDriveCtrl));
server.post('/line/webhook', lineCtrl.handleWebhook.bind(lineCtrl));

export default server;
