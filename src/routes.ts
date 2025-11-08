import { PrismaClient } from '@prisma/client';
import fastify from 'fastify';
import Cache from './cache';
import Configuration from './configs';
import AdminController from './controllers/admin/admin.controller';
import AuthController from './controllers/auth/auth.controller';
import GoogleAuthController from './controllers/google-auth/google-auth.controller';
import GoogleDriveController from './controllers/google-drive/google-drive.controller';
import LineWebhookController from './controllers/line-webhook/line-webhook.controller';
import Cron from './cron-job';
import Gemini from './externals/gemini/gemini';
import GoogleAuth from './externals/google-auth/google-auth';
import GoogleDrive from './externals/google-drive/google-drive';
import LINE from './externals/line/line';
import BookRepository from './repositories/book/book.repository';
import LessonRepository from './repositories/lesson/lesson.repository';
import AdminService from './services/admin/admin.service';
import AuthService from './services/auth/auth.service';
import BookService from './services/book/book.service';
import LessonService from './services/lesson/lesson.service';

const server = fastify();

const config = new Configuration();
const prisma = new PrismaClient();
const cache = new Cache();

const googleAuth = new GoogleAuth(config);
const googleDrive = new GoogleDrive(googleAuth);
const line = new LINE(config);
const gemini = new Gemini(config);

const bookRepository = new BookRepository(prisma);
const lessonRepository = new LessonRepository(prisma);

const adminSvc = new AdminService(prisma, line, googleDrive, gemini);
const bookSvc = new BookService(config, googleDrive, bookRepository, gemini);
const lessonSvc = new LessonService(gemini, bookSvc, lessonRepository);
const authSvc = new AuthService(googleAuth);

const googleAuthCtrl = new GoogleAuthController(googleAuth);
const googleDriveCtrl = new GoogleDriveController(googleDrive);
const lineWebhookCtrl = new LineWebhookController(config, line, lessonSvc, cache, adminSvc);
const authCtrl = new AuthController(authSvc);
const adminCtrl = new AdminController(adminSvc);

const cron = new Cron(bookSvc, cache);
cron.start();

server.get('/', async (req, res) => {
  res.send('Hello World');
});

server.get('/admin/health-check', adminCtrl.healthCheck.bind(adminCtrl));
server.get('/google/login', authCtrl.getGoogleOAuthUrl.bind(authCtrl));
server.get('/oauth2callback', authCtrl.loginWithGoogle.bind(authCtrl));
server.get('/files', googleDriveCtrl.listFiles.bind(googleDriveCtrl));
server.post('/files/pdf', googleDriveCtrl.uploadPDF.bind(googleDriveCtrl));
server.post('/line/webhook', lineWebhookCtrl.handleWebhook.bind(lineWebhookCtrl));
server.get('/line/delete/lessons/:key', lineWebhookCtrl.deleteLesson.bind(lineWebhookCtrl));

export { config, server };

