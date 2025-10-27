import Gemini from '@/externals/gemini/gemini';
import { Type } from '@google/genai';
import { ClassUpdateResponse, UpdateLessonResponse } from './response';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { LineEvent } from '@/externals/line/request';
import LINE from '@/externals/line/line';
import BookService from '../book/book.service';
import BookRepository from '@/repositories/book/book.repository';

export default class ScheduleService {
    private readonly gemini: Gemini;
    private readonly line: LINE;
    private readonly bookService: BookService;
    private readonly bookRepository: BookRepository;
    constructor(gemini: Gemini, line: LINE, bookService: BookService, bookRepository: BookRepository) {
        this.gemini = gemini;
        this.line = line;
        this.bookService = bookService;
        this.bookRepository = bookRepository;
    }

    async updateByMessage(message: string): Promise<void> {
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
        const result = await this.gemini.generateStructuredOutput<ClassUpdateResponse>(prompt, struct);
        console.log(result);
    }

    async getLessonCacheKey(e: LineEvent) {
        return {
            messageKey: `update-lesson_message_${e.source.userId}`,
            imageKey: `update-lesson_image_${e.source.userId}`,
        }
    }

    async cacheLineLessonMessage(e: LineEvent): Promise<UpdateLessonResponse | null> {
        const { messageKey, imageKey } = await this.getLessonCacheKey(e);
        if (existsSync(`cache/${imageKey}`)) {
            const image = readFileSync(`cache/${imageKey}`);
            const res = await this.updateLesson(e.message.text ?? '', image);
            unlinkSync(`cache/${messageKey}`);
            return res;
        } else {
            writeFileSync(`cache/${messageKey}`, e.message.text ?? '');
        }
        return null;
    }

    async cacheLineLessonImage(e: LineEvent): Promise<UpdateLessonResponse | null> {
        const { messageKey, imageKey } = await this.getLessonCacheKey(e);
        const image = await this.line.getContent(e.message.id);
        if (existsSync(`cache/${messageKey}`)) {
            const message = readFileSync(`cache/${messageKey}`);
            const res = await this.updateLesson(message.toString(), image);
            unlinkSync(`cache/${messageKey}`);
            return res;
        } else {
            writeFileSync(`cache/${imageKey}`, image);
        }
        return null;
    }

    async updateLesson(message: string, image: Buffer): Promise<UpdateLessonResponse> {
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
        const bookDetail = await this.bookService.getDetailByCoverImage(image.toString('base64'), 'image/jpeg');
        const book = await this.bookService.getByTitle(bookDetail.title);

        return {
            class: lessonRes.class,
            subject: lessonRes.subject,
            book: book,
        }
    }
}
