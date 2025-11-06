import Cache, { TTL } from '@/cache';
import Gemini from '@/externals/gemini/gemini';
import LINE from '@/externals/line/line';
import { LineEvent } from '@/externals/line/request';
import { Type } from '@google/genai';
import BookService from '../book/book.service';
import { ClassUpdateResponse, LatestLessonResponse, UpdateLessonResponse } from './response';
import LessonRepository from '@/repositories/lesson/lesson.repository';
import { ExtendedBook } from '../book/response';

export default class LessonService {
    private readonly gemini: Gemini;
    private readonly line: LINE;
    private readonly bookService: BookService;
    private readonly cache: Cache;
    private readonly lessonRepository: LessonRepository;
    constructor(gemini: Gemini, line: LINE, bookService: BookService, cache: Cache, lessonRepository: LessonRepository) {
        this.gemini = gemini;
        this.line = line;
        this.bookService = bookService;
        this.cache = cache;
        this.lessonRepository = lessonRepository;
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

        this.lessonRepository.create({
            class: lessonRes.class,
            subject: lessonRes.subject,
            note: message,
            bookId: book?.id ?? null,
        })

        return {
            class: lessonRes.class,
            subject: lessonRes.subject,
            book: book,
        }
    }

    // async updateByLineMessage(e: LineEvent): Promise<UpdateLessonResponse | null> {
    //     const messageKey = `update-lesson_message_${e.source.userId}`;
    //     const imageKey = `update-lesson_image_${e.source.userId}`;
    //     let res: UpdateLessonResponse | null = null;
    //     if (e.message.type === 'text') {
    //         const image = this.cache.get<Buffer>(imageKey);
    //         if (image) {
    //             res = await this.update(e.message.text ?? '', image);
    //             this.cache.delete(imageKey);
    //         } else {
    //             this.cache.set(messageKey, e.message.text ?? '', TTL.ONE_HOUR);
    //         }
    //     } else if (e.message.type === 'image') {
    //         const image = await this.line.getContent(e.message.id);
    //         const message = this.cache.get<string>(messageKey);
    //         if (message) {
    //             res = await this.update(message, image);
    //             this.cache.delete(messageKey);
    //         } else {
    //             this.cache.set(imageKey, image, TTL.ONE_HOUR);
    //         }
    //     }
    //     return res;
    // }

    async getLatest(subject: string, studentClass: number): Promise<LatestLessonResponse | null> {
        const lesson = await this.lessonRepository.getBySubjectClass(subject, studentClass);
        if (!lesson) {
            return null;
        }
        let book: ExtendedBook | null = null;
        if (lesson?.book_id) {
            book = await this.bookService.get(lesson.book_id);
        }
        return {
            ...lesson,
            book: book,
        };
    }

    // async getLatestByLineMessage(e: LineEvent): Promise<LatestLessonResponse | null> {
    //     const struct = {
    //         type: Type.OBJECT,
    //         properties: {
    //             subject: {
    //                 type: Type.STRING,
    //             },
    //             class: {
    //                 type: Type.NUMBER,
    //             },
    //         },
    //         required: ['subject', 'class'],
    //     }

    //     const prompt = `
    //     Report the subject and class of the following message:
    //     "${e.message.text}"
    //     Here is the following rules for the subject and class:
    //     - Subject must be one of the following: Math, Chemistry, Physics, Biology, English, Other
    //     - Class must be number between 0 to 6, 0 for elementary level and 1-6 for middle and high school level based on Thai education system
    //     `;
    //     const lessonRes = await this.gemini.generateStructuredOutput<ClassUpdateResponse>(prompt, struct);
    //     return this.getLatest(lessonRes.subject, lessonRes.class);
    // }

    // generateReplyMessage(r: UpdateLessonResponse): string {
    //     let replyMessage = `Class: ${r?.class}\nSubject: ${r?.subject}`;
    //     if (r.book) {
    //         replyMessage += `\nBook: ${r.book.title}\n${r.book.google_drive_url}`;
    //     }
    //     return replyMessage;
    // }
}
