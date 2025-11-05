import Gemini from '@/externals/gemini/gemini';
import GoogleDrive from '@/externals/google-drive/google-drive';
import { MimeType } from '@/externals/google-drive/request';
import BookRepository from '@/repositories/book/book.repository';
import { CreateBook } from '@/repositories/book/request';
import { Type } from '@google/genai';
import { createWriteStream, readFileSync } from 'fs';
import looksSame from 'looks-same';
import path from 'path';
import { BookDetail, ExtendedBook } from './response';
import { Book } from '@prisma/client';
import { drive_v3 } from 'googleapis';
import { generateLogFileName } from '@/utils/log';
import Configuration from '@/configs';
import { getGoogleDriveImageUrl } from '@/utils/google-drive';

export default class BookService {
    private readonly config: Configuration;
    private readonly googleDrive: GoogleDrive;
    private readonly bookRepository: BookRepository;
    private readonly gemini: Gemini;

    constructor(config: Configuration, googleDrive: GoogleDrive, bookRepository: BookRepository, gemini: Gemini) {
        this.config = config;
        this.googleDrive = googleDrive;
        this.bookRepository = bookRepository;
        this.gemini = gemini;
    }

    extendBook(book: Book): ExtendedBook {
        return {
            ...book,
            google_drive_url: `https://drive.google.com/drive/u/0/folders/${book.google_drive_id}`,
        };
    }

    async get(id: number): Promise<ExtendedBook | null> {
        const book = await this.bookRepository.get(id);
        if (!book) {
            return null;
        }
        return this.extendBook(book);
    }

    async getByTitle(title: string): Promise<ExtendedBook | null> {
        const book = await this.bookRepository.getByTitle(title);
        if (!book) {
            return null;
        }
        return this.extendBook(book);
    }

    async getDetailByCoverImage(base64: string, mimeType: MimeType | string): Promise<BookDetail> {
        const struct = {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                },
                author: {
                    type: Type.STRING,
                },
            },
            required: ['title'],
        };
        const geminiRes = await this.gemini.generateStructuredOutput<BookDetail>(
            [
                {
                    text: 'Extract title and author from the image. For book title, extract for both title and subtitle.',
                },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64,
                    },
                },
            ],
            struct
        );
        return geminiRes;
    }

    async getByMatchingImage(base64: string, mimeType: MimeType | string): Promise<ExtendedBook | null> {
        try {
            const bookList = await this.bookRepository.list();
            const bookTitles = bookList.map((book) => book.title);
            const struct = {
                type: Type.OBJECT,
                properties: {
                    answer: {
                        type: Type.STRING,
                    },
                    confidence: {
                        type: Type.NUMBER,
                    },
                },
            };
            const res = await this.gemini.generateStructuredOutput<{ answer: string, confidence: number }>(
                [
                    {
                        text: `
                From the given list of book titles:
                ${bookTitles.join('\n')}
                Find the book title that matches the image.
                Return only the book title from the given list, no other text.
                Also return the confidence of the answer between 0 and 1.
                `,
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64,
                        },
                    },
                ],
                struct
            );
            if (res.confidence < 0.7) {
                return null;
            }
            const book = bookList.find((book) => book.title === res.answer);
            if (!book) {
                return null;
            }
            return this.extendBook(book);
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async importBookDataFromGoogleDrive() {
        const bookList = await this.bookRepository.list();
        // TODO: List by MimeType
        // const fileList = await this.googleDrive.list("mimeType = 'image/jpeg' or mimeType = 'image/png'", 30);
        const fileList = await this.googleDrive.list("name contains 'bookcover'", 30);
        if (!fileList.files) {
            return;
        }

        const logFileName = generateLogFileName();
        const log = createWriteStream(path.join(process.cwd(), 'public', 'import-book-cover-logs', logFileName));

        log.write('datetime,status,google_drive_url,file_name,error\n');

        for (let i = 0; i < fileList.files.length; i++) {
            const now = new Date().toLocaleString('en-US', { timeZone: this.config.timeZone });
            const file = fileList.files[i];

            if (!file.mimeType?.startsWith('image/')) {
                continue;
            }
            if (!file.parents || file.parents.length === 0) {
                continue;
            }
            const logData = [now, '', getGoogleDriveImageUrl(file.id!), file.name || '<untitled>', '-', '\n'];
            if (bookList.some((book) => book.google_drive_id === file.parents?.[0])) {
                logData[1] = 'Skip';
                log.write(logData.join(','));
                continue;
            }

            try {
                // Download image
                const imageType = file.mimeType.split('/')[1];
                const imageFilename = `${file.id}.${imageType}`;
                const imagePath = path.join(process.cwd(), 'public', 'book-cover', imageFilename);
                await this.googleDrive.download(String(file.id), imagePath);
                // TODO: Handle on download success instead of static waiting
                await new Promise((resolve) => setTimeout(resolve, 5000));

                // Get title and author from image
                const base64 = readFileSync(imagePath, 'base64');
                const geminiRes = await this.getDetailByCoverImage(base64, file.mimeType);

                // Create book
                const req: CreateBook = {
                    title: geminiRes.title,
                    author: geminiRes.author ?? null,
                    coverImage: 'book-cover/' + imageFilename,
                    googleDriveId: file.parents[0],
                };
                await this.bookRepository.create(req);
                logData[1] = 'Success';
                log.write(logData.join(','));
            } catch (error) {
                logData[3] = 'Error';
                logData[4] = String(error).split('\n').join(' ');
                log.write(logData.join(','));
            }
        }
        log.end();
    }

    async compareImage(image1: string, image2: string) {
        const result = await looksSame(image1, image2);
        console.log(result);
    }
}
