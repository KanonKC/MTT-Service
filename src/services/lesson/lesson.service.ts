import Gemini from '@/externals/gemini/gemini';
import LessonRepository from '@/repositories/lesson/lesson.repository';
import { ExtendedLesson } from '@/repositories/lesson/response';
import { Type } from '@google/genai';
import { Lesson } from '@prisma/client';
import { randomBytes } from 'crypto';
import BookService from '../book/book.service';
import { ExtendedBook } from '../book/response';
import { LatestLessonResponse, LessonDetailResponse } from './response';

export default class LessonService {
    private readonly gemini: Gemini;
    private readonly bookService: BookService;
    private readonly lessonRepository: LessonRepository;
    constructor(gemini: Gemini, bookService: BookService, lessonRepository: LessonRepository) {
        this.gemini = gemini;
        this.bookService = bookService;
        this.lessonRepository = lessonRepository;
    }

    generateKey(): string {
        const timestamp = Date.now().toString();
        const salt = randomBytes(timestamp.length).toString('hex');
        let key = '';
        for (let i = 0; i < timestamp.length; i++) {
            key += salt[i];
            key += timestamp[i];
        }
        return key;
    }

    async extendLesson(lesson: Lesson): Promise<ExtendedLesson> {
        let book: ExtendedBook | null = null;
        if (lesson.book_id) {
            book = await this.bookService.get(lesson.book_id);
        }
        return {
            ...lesson,
            book: book ? this.bookService.extendBook(book) : null,
        };
    }

    async getLessonDetailFromMessage(message: string): Promise<LessonDetailResponse> {
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
        return this.gemini.generateStructuredOutput<LessonDetailResponse>(prompt, struct);
    }

    async create(message: string, image: Buffer): Promise<ExtendedLesson> {
        // Summarize the message to get the class and subject
        const lessonRes = await this.getLessonDetailFromMessage(message);

        // Get the book detail from the image
        // const bookDetail = await this.bookService.getDetailByCoverImage(image.toString('base64'), 'image/jpeg');

        // Match the book detail to the book in the database
        // const book = await this.bookService.getByTitle(bookDetail.title);
        const book = await this.bookService.getByMatchingImage(image.toString('base64'), 'image/jpeg');

        const lesson = await this.lessonRepository.create({
            key: this.generateKey(),
            classLevel: lessonRes.class,
            subject: lessonRes.subject,
            note: message,
            bookId: book?.id ?? null,
        });

        return this.extendLesson(lesson);
    }

    async delete(id: number): Promise<void> {
        await this.lessonRepository.delete(id);
    }

    async deleteByKey(key: string): Promise<void> {
        await this.lessonRepository.deleteByKey(key);
    }

    async get(id: number): Promise<Lesson | null> {
        return this.lessonRepository.get(id);
    }

    async getLatest(subject: string, studentClass: number): Promise<ExtendedLesson | null> {
        const lesson = await this.lessonRepository.getBySubjectClass(subject, studentClass);
        if (!lesson) {
            return null;
        }
        return this.extendLesson(lesson);
    }
}
