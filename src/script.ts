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

const config = new Configuration();

const oauth2Client = new OAuth2Client(config.googleCredentials);
const token = JSON.parse(readFileSync('token.json', 'utf8'));
oauth2Client.setCredentials(token);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const googleAuth = new GoogleAuth(config, oauth2Client);
const googleDrive = new GoogleDrive(oauth2Client, drive);
const line = new LINE(config);
const gemini = new Gemini(config);

const prisma = new PrismaClient();
const bookRepository = new BookRepository(prisma);

const bookService = new BookService(googleDrive, bookRepository, gemini);

(async () => {
    await bookService.bulkDownloadBookCover();
    // await googleDrive.download('12Lizjn_uUmtqAk8mcxJpQ-cIeFgXiLEH', 'public/book-cover/12Lizjn_uUmtqAk8mcxJpQ-cIeFgXiLEH.jpeg')
    console.log("OK");
})();
