import { readFileSync } from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import Configuration from './configs';
import Gemini from './externals/gemini/gemini';
import GoogleDrive from './externals/google-drive/google-drive';
import LINE from './externals/line/line';
import BookService from './services/book/book.service';
import GoogleAuth from './externals/google-auth/google-auth';
import BookRepository from './repositories/book/book.repository';
import { PrismaClient } from '@prisma/client';
import LessonRepository from './repositories/lesson/lesson.repository';
import LessonService from './services/lesson/lesson.service';
import Cache from './cache';
import LineWebhookController from './controllers/line-webhook/line-webhook.controller';
import { LineEvent } from './externals/line/request';

const config = new Configuration();

const oauth2Client = new OAuth2Client(config.googleCredentials);
const token = JSON.parse(readFileSync('token.json', 'utf8'));
oauth2Client.setCredentials(token);
const cache = new Cache();

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const googleAuth = new GoogleAuth(config, oauth2Client);
const googleDrive = new GoogleDrive(oauth2Client, drive);
const line = new LINE(config);
const gemini = new Gemini(config);

const prisma = new PrismaClient();
const bookRepository = new BookRepository(prisma);
const lessonRepository = new LessonRepository(prisma);

const bookService = new BookService(config, googleDrive, bookRepository, gemini);
const lessonService = new LessonService(gemini, bookService, lessonRepository);

const lineWebhookController = new LineWebhookController(config, line, lessonService, cache, gemini);

// (async () => {
//     await bookService.importBookDataFromGoogleDrive();
//     // await googleDrive.download('12Lizjn_uUmtqAk8mcxJpQ-cIeFgXiLEH', 'public/book-cover/12Lizjn_uUmtqAk8mcxJpQ-cIeFgXiLEH.jpeg')
//     console.log("OK");
// })();

const messageEvent: LineEvent = {
    type: 'message',
    message: {
        type: 'image',
        id: '586283400776908818',
        quoteToken: 'hqWMn4IIAoU5YubZtl5mLA0IyDO7kyF64Qw4Mugw2a7GibK23lp6XBjxWhqg2rLa02epV9n2ivj5zoQjGPPUcuj4OiczzfpofJ2VD6fUNgsomYVU1fmLdHhsFwag047dLj0L8XlbkyA1kz20mLy-Kw',
    },
    webhookEventId: '01K984EMHPTDH0DPMMZ3TK7Y2W',
    deliveryContext: { isRedelivery: false },
    timestamp: 1762283442588,
    source: { type: 'user', userId: 'Ubb56e7d5f9a0c808f21b0e37a1ec43cf' },
    replyToken: '074078043f734d468ae20f211ba48d22',
    mode: 'active',
};

const imageEvent: LineEvent = {
    type: 'message',
    message: {
        type: 'text',
        id: '586283419399618731',
        quoteToken: 'C4-F7tR5EwkAKQzQRMBxMzhIDh36FmhQDa_YNXUJDAPxVjEPezDHQc-y35FhGOXbxM9fm6fe6KjCBX14OkU0XKO3L1zqJ8C9PWanQRQwX6slrEnS0z2MbvUMwwE5vt6QUfhNvZD7yULDLWvjWqI0uw',
        text: 'เลข ม.2 ---',
    },
    webhookEventId: '01K984EZJG9ZW4QQEVQAT3WWHN',
    deliveryContext: { isRedelivery: false },
    timestamp: 1762283453526,
    source: { type: 'user', userId: 'Ubb56e7d5f9a0c808f21b0e37a1ec43cf' },
    replyToken: '0e8325e3af54479fa746799dccdb8273',
    mode: 'active',
};

(async () => {
    // await bookService.importBookDataFromGoogleDrive();
    // await lessonService.create('สอนวิชาคณิตศาสตร์ ชั้น ม.1 เรื่อง สมการกำลังสอง', Buffer.from(''));
    // await lessonRepository.create({
    //     classLevel: 999,
    //     subject: 'Math',
    //     note: 'message',
    //     bookId: null,
    // });

    // await lineWebhookController.updateLesson({
    //     source: {
    //         type: 'user',
    //         userId: 'U4af49806ea64970819f4794019d23351',
    //     },
    //     message: {
    //         type: 'text',
    //         text: 'สอนวิชาคณิตศาสตร์ ชั้น ม.1 เรื่อง สมการกำลังสอง',
    //     },
    // });
    // await googleDrive.download('12Lizjn_uUmtqAk8mcxJpQ-cIeFgXiLEH', 'public/book-cover/12Lizjn_uUmtqAk8mcxJpQ-cIeFgXiLEH.jpeg')
    const result1 = await lineWebhookController.updateLesson(imageEvent);
    const result2 = await lineWebhookController.updateLesson(messageEvent);
    console.log('result1', result1);
    console.log('result2', result2);
    console.log('OK');
})();
