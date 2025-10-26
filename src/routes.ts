import fastify, { FastifyRequest } from 'fastify';
import { readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import GoogleAuthController from './controllers/google-auth/google-auth.controller';
import Configuration from './configs';
import { OAuth2Client } from 'google-auth-library';
import GoogleDrive from './externals/google-drive/google-drive';
import GoogleAuth from './externals/google-auth/google-auth';

const server = fastify();

const config = new Configuration();
const oauth2Client = new OAuth2Client(config.googleCredentials);
const googleDrive = new GoogleDrive(oauth2Client);
const googleAuth = new GoogleAuth(oauth2Client);
const googleAuthCtrl = new GoogleAuthController(oauth2Client, googleDrive, googleAuth);


server.get('/', async (req, res) => {
  res.send('Hello World');
});

server.get('/oauth2callback', googleAuthCtrl.authCallback.bind(googleAuthCtrl));
server.get('/list-files', googleAuthCtrl.listFiles.bind(googleAuthCtrl));
server.get('/google/login', googleAuthCtrl.login.bind(googleAuthCtrl));
server.post('/pdf', googleAuthCtrl.createPDFFile.bind(googleAuthCtrl));

export default server;
