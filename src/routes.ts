import fastify, { FastifyRequest } from 'fastify';
import { readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import GoogleAuthController from './controllers/google-auth/google-auth.controller';
import Configuration from './configs';
import { OAuth2Client } from 'google-auth-library';
import GoogleDrive from './externals/google-drive/google-drive';
import GoogleDriveController from './controllers/google-drive/google-drive.controller';
import LineController from './controllers/line/line.controller';
import LINE from './externals/line/line';
import LessonService from './services/lesson/lesson.service';
import Gemini from './externals/gemini/gemini';
import AuthService from './services/auth/auth.service';
import AuthController from './controllers/auth/auth.controller';
import GoogleAuth from './externals/google-auth/google-auth';
import BookRepository from './repositories/book/book.repository';
import { PrismaClient } from '@prisma/client';
import BookService from './services/book/book.service';
import Cron from './cron';
import Cache from './cache';
import LessonRepository from './repositories/lesson/lesson.repository';

const server = fastify();

const config = new Configuration();
const prisma = new PrismaClient();
const cache = new Cache();

const oauth2Client = new OAuth2Client(config.googleCredentials);
const token = JSON.parse(readFileSync('token.json', 'utf8'));
oauth2Client.setCredentials(token);

const drive = google.drive({version: 'v3', auth: oauth2Client});

const googleDrive = new GoogleDrive(oauth2Client, drive);
const line = new LINE(config);
const gemini = new Gemini(config);
const googleAuth = new GoogleAuth(config, oauth2Client);

const bookRepository = new BookRepository(prisma);
const lessonRepository = new LessonRepository(prisma);

const bookSvc = new BookService(config, googleDrive, bookRepository, gemini);
const lessonSvc = new LessonService(gemini, line, bookSvc, cache, lessonRepository);
const authSvc = new AuthService(googleAuth);

const googleAuthCtrl = new GoogleAuthController(googleAuth);
const googleDriveCtrl = new GoogleDriveController(googleDrive);
const lineCtrl = new LineController(config, line, lessonSvc, cache, gemini);
const authCtrl = new AuthController(authSvc);

const cron = new Cron(bookSvc, cache);
cron.start();

server.get('/', async (req, res) => {
  res.send('Hello World');
});

server.get('/google/login', authCtrl.getGoogleOAuthUrl.bind(authCtrl));
server.get('/oauth2callback', authCtrl.loginWithGoogle.bind(authCtrl));
server.get('/files', googleDriveCtrl.listFiles.bind(googleDriveCtrl));
server.post('/files/pdf', googleDriveCtrl.uploadPDF.bind(googleDriveCtrl));
server.post('/line/webhook', lineCtrl.handleWebhook.bind(lineCtrl));

export { server, config };
