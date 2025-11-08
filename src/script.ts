import { PrismaClient } from '@prisma/client';
import Cache from './cache';
import Configuration from './configs';
import LineWebhookController from './controllers/line-webhook/line-webhook.controller';
import Gemini from './externals/gemini/gemini';
import GoogleAuth from './externals/google-auth/google-auth';
import GoogleDrive from './externals/google-drive/google-drive';
import LINE from './externals/line/line';
import BookRepository from './repositories/book/book.repository';
import LessonRepository from './repositories/lesson/lesson.repository';
import AdminService from './services/admin/admin.service';
import BookService from './services/book/book.service';
import LessonService from './services/lesson/lesson.service';

const config = new Configuration();

const cache = new Cache();

const googleAuth = new GoogleAuth(config);
const googleDrive = new GoogleDrive(googleAuth);
const line = new LINE(config);
const gemini = new Gemini(config);

const prisma = new PrismaClient();
const bookRepository = new BookRepository(prisma);
const lessonRepository = new LessonRepository(prisma);

const adminService = new AdminService(prisma, line, googleDrive, gemini);
const bookService = new BookService(config, googleDrive, bookRepository, gemini);
const lessonService = new LessonService(gemini, bookService, lessonRepository);

const lineWebhookController = new LineWebhookController(config, line, lessonService, cache, adminService);

// (async () => {
//     await bookService.importBookDataFromGoogleDrive();
//     // await googleDrive.download('12Lizjn_uUmtqAk8mcxJpQ-cIeFgXiLEH', 'public/book-cover/12Lizjn_uUmtqAk8mcxJpQ-cIeFgXiLEH.jpeg')
//     console.log("OK");
// })();


(async () => {
    const healthCheck = await adminService.healthCheck();
    console.log(healthCheck);
    console.log('OK');
})();
