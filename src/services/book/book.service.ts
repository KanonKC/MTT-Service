import Gemini from '@/externals/gemini/gemini';
import GoogleDrive from '@/externals/google-drive/google-drive';
import { MimeType } from '@/externals/google-drive/request';
import BookRepository from '@/repositories/book/book.repository';
import { CreateBook } from '@/repositories/book/request';
import { Type } from '@google/genai';
import { readFileSync } from 'fs';
import looksSame from 'looks-same';
import path from 'path';
import { BookDetail, ExtendedBook } from './response';
import { Book } from '@prisma/client';

export default class BookService {
    private readonly googleDrive: GoogleDrive;
    private readonly bookRepository: BookRepository;
    private readonly gemini: Gemini;

    constructor(googleDrive: GoogleDrive, bookRepository: BookRepository, gemini: Gemini) {
        this.googleDrive = googleDrive;
        this.bookRepository = bookRepository;
        this.gemini = gemini;
    }

    async extendBook(book: Book): Promise<ExtendedBook> {
        return {
            ...book,
            google_drive_url: `https://drive.google.com/drive/u/0/folders/${book.google_drive_id}`,
        }
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
        }
        const geminiRes = await this.gemini.generateStructuredOutput<BookDetail>([
            {
                text: 'Extract title and author from the image. For book title, extract for both title and subtitle.',
            },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64,
                },
            },
        ], struct)
        return geminiRes;
    }

    async bulkDownloadBookCover() {
        const bookList = await this.bookRepository.list();
        const fileList = await this.googleDrive.list("name contains 'bookcover'");
        if (!fileList.files) {
            return;
        }

        for (let i = 0; i < fileList.files.length; i++) {
            const file = fileList.files[i];
            
            if (!file.mimeType?.startsWith('image/')) {
                continue;
            }
            if (!file.parents) {
                continue;
            }
            if (bookList.some(book => book.google_drive_id === file.parents?.[0])) {
                continue;
            }

            // Download image
            const imageType = file.mimeType.split('/')[1];
            const imageFilename = `${file.id}.${imageType}`;
            const imagePath = path.join(process.cwd(), 'public', 'book-cover', imageFilename);
            await this.googleDrive.download(String(file.id), imagePath);
            await new Promise(resolve => setTimeout(resolve, 5000));

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
            console.log(`Created book ${geminiRes.title} by ${geminiRes.author ?? 'Unknown'}`);
        }
    }

    async compareImage(image1: string, image2: string) {
        const result = await looksSame(image1, image2);
        console.log(result);
    }
}
