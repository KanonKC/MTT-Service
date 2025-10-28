import Cache, { TTL } from '@/cache';
import Gemini from '@/externals/gemini/gemini';
import LINE from '@/externals/line/line';
import { LineEvent } from '@/externals/line/request';
import { Type } from '@google/genai';
import BookService from '../book/book.service';
import { ClassUpdateResponse, UpdateLessonResponse } from './response';

export default class LessonService {
    private readonly gemini: Gemini;
    private readonly line: LINE;
    private readonly bookService: BookService;
    private readonly cache: Cache;
    constructor(gemini: Gemini, line: LINE, bookService: BookService, cache: Cache) {
        this.gemini = gemini;
        this.line = line;
        this.bookService = bookService;
        this.cache = cache;
    }

    async update(message: string, image: Buffer): Promise<UpdateLessonResponse> {
        // Summarize the message to get the class and subject
        const struct = {
            type: Type.OBJECT,
            properties: {
                class: {
                    type: Type.NUMBER,
                },
                subject: {
                    type: Type.STRING,
                },
            },
            propertyOrdering: ['class', 'subject'],
            required: ['class', 'subject'],
        };
        const prompt = `
        Report the class and subject of the following message:
        "${message}"
        Here is the following rules for the class and subject:
        - Class must be number between 0 to 6, 0 for elementary level and 1-6 for middle and high school level based on Thai education system
        - Subject must be one of the following: Math, Chemistry, Physics, Biology, English, Other
        `;
        const lessonRes = await this.gemini.generateStructuredOutput<ClassUpdateResponse>(prompt, struct);

        // Get the book detail from the image
        // const bookDetail = await this.bookService.getDetailByCoverImage(image.toString('base64'), 'image/jpeg');

        // Match the book detail to the book in the database
        // const book = await this.bookService.getByTitle(bookDetail.title);
        const book = await this.bookService.getByMatchingImage(image.toString('base64'), 'image/jpeg');

        return {
            class: lessonRes.class,
            subject: lessonRes.subject,
            book: book,
        }
    }

    async updateByLineMessage(e: LineEvent): Promise<UpdateLessonResponse | null> {
        console.log('current cache before', this.cache.cache);
        const messageKey = `update-lesson_message_${e.source.userId}`;
        const imageKey = `update-lesson_image_${e.source.userId}`;
        let res: UpdateLessonResponse | null = null;
        if (e.message.type === 'text') {
            const image = this.cache.get<Buffer>(imageKey);
            if (image) {
                res = await this.update(e.message.text ?? '', image);
                this.cache.delete(imageKey);
            } else {
                this.cache.set(messageKey, e.message.text ?? '', TTL.ONE_HOUR);
            }
        } else if (e.message.type === 'image') {
            const image = await this.line.getContent(e.message.id);
            const message = this.cache.get<string>(messageKey);
            if (message) {
                res = await this.update(message, image);
                this.cache.delete(messageKey);
            } else {
                this.cache.set(imageKey, image, TTL.ONE_HOUR);
            }
        }
        console.log('current cache after', this.cache.cache);
        return res;
    }

    generateReplyMessage(r: UpdateLessonResponse): string {
        let replyMessage = `Class: ${r?.class}\nSubject: ${r?.subject}`;
        if (r.book) {
            replyMessage += `\nBook: ${r.book.title}\n${r.book.google_drive_url}`;
        }
        return replyMessage;
    }
}
